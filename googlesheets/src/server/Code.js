const key = 'KEY';
const domainKey = 'DOMAIN';
const googleAnalyticsReportingClientID = 'GOOGLE_ANALYTICS_REPORTING_CLIENT_ID';
const googleAnalyticsReportingSecret = 'GOOGLE_ANALYTICS_REPORTING_SECRET';
const githubClientID = 'GITHUB_CLIENT_ID';
const githubClientSecret = 'GITHUB_CLIENT_SECRET';

const commandsKey = 'commands';
const emailKey = 'email';

export const onInstall = () => {
  onOpen();
}

export const onOpen = () => {
  SpreadsheetApp.getUi().createAddonMenu().addItem("Manage Connections", 'sidebar').addToUi(); 
};

export const sidebar = () => {
  const userProperties = PropertiesService.getUserProperties();
  var email = Session.getActiveUser().getEmail();
  userProperties.setProperty(emailKey, email);
  registerUser(email);
  var html = HtmlService.createTemplateFromFile("sidebar").evaluate();
  html.setTitle("Data Connector");
  SpreadsheetApp.getUi().showSidebar(html);
};

// registerUser registers a user
export const registerUser = (email) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  var options = {
    'validateHttpsCertificates': false,
    'method': 'POST',
    'followRedirects': true,
    'muteHttpExceptions': true,
    'contentType': 'application/json',
    'payload': {
      'email': email,
      'key': scriptProperties.getProperty(key),
    },
  };
  options.payload = JSON.stringify(options.payload);
  var response = UrlFetchApp.fetch(scriptProperties.getProperty('DOMAIN')+'/user/register', options).getContentText();
  return JSON.parse(response); 
}

export const getCommands = () => {
  const scriptProperties = PropertiesService.getScriptProperties();
  const userProperties = PropertiesService.getUserProperties();
  var cmds = userProperties.getProperty(commandsKey);
  if (cmds){
    return {'response': JSON.parse(cmds)}
  }

  // TODO: remove this after all users have had a chance to save their commands in the script
  var google_key = Session.getTemporaryActiveUserKey();
  var options = {
    'validateHttpsCertificates': false,
    'method': 'GET',
    'followRedirects': true,
    'muteHttpExceptions': false,
  };
  var response = UrlFetchApp.fetch(scriptProperties.getProperty(domainKey)+'/get?google_key='+google_key, options).getContentText();
  var j = JSON.parse(response);
  if('response' in j){
    userProperties.setProperty(commandsKey, JSON.stringify(j['response']));
  }
  return j; 
};

// runCommand simply inserts the formula to run and nothing else. Maybe shouldn't call it "runCommand"?
export const runCommand = (name) => {
  SpreadsheetApp.getActiveSheet().getActiveCell().setFormula('=run("'+name+'")');
  return;
};

export const saveCommands = (commands) => {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(commandsKey, JSON.stringify(commands));
  return {'response': commands};
};

const is2dArray = array => array.every(item => Array.isArray(item));

/**
* Runs a Data Connector command
* @param {name} text The name of your saved command
* @param {args} range The arguments to send in the form B1:C3 or "melanie,fred,james"
* @returns the data.
* @customfunction
*/
function run(name, args){
  const scriptProperties = PropertiesService.getScriptProperties();
  const userProperties = PropertiesService.getUserProperties();
  var emailFromStorage = userProperties.getProperty(emailKey);
  if (!emailFromStorage){
    return ['Please open the sidebar to authorize this request ("Add-ons -> Data Connector -> Manage Connections").']
  }

  var cmds = userProperties.getProperty(commandsKey);
  if (!cmds){
    return ['No saved commands. Please open the sidebar to create a command ("Add-ons -> Data Connector -> Manage Connections")']
  }

  cmds = JSON.parse(cmds);
  var found = false;
  var cmdIndex = -1;
  var cmd = {};
  cmds.forEach(function (item, index) {
    if (item.name===name){
      found = true;
      cmdIndex = index;
      cmd = JSON.parse(JSON.stringify(item));
    }
  });

  if(!found){
    return ['Could not find a Data Connector command with name "'+name+'"']; 
  }

  var options = {
    'validateHttpsCertificates': false,
    'method': 'POST',
    'followRedirects': true,
    'muteHttpExceptions': false,
    'contentType': 'application/json',
    'payload': {
      'command': cmd,
      'email': emailFromStorage,
      'command_number': cmdIndex,
      'params': [],
      'key': scriptProperties.getProperty(key),
    }
  };

  // Set OAuth2 header, if applicable
  if(cmd.command.command.provider && cmd.command.command.provider != ''){
    var connections = getOAuthConnections();
    if(cmd.command.command.provider in connections){
      if(!cmd.command.command.headers){
        cmd.command.command.headers = [];
      }
      cmd.command.command.headers.push({'Key':'Authorization','Value':'Bearer '+connections[cmd.command.command.provider]})
    } else {
      return ['Data Connector error: OAuth2 Header for '+cmd.command.command.provider+'not found. Please connect to '+cmd.command.command.provider];
    }
  }

  // there's 2 ways to pass parameters:
  // 1. "1,2,3,4" // Note: if it is only 1 cell reference it gets passed in as a string, NOT a cell reference
  // 2. [["1", "2", "3", "4"]]
  // Since we split on the comma in our backend, #1 CANNOT contain extra commas. Instead, manually encode them or pass them as a cell reference.
  // Another option is to split on a "|" or other operator
  if(Array.isArray(args) && is2dArray(args)){
    for (var i=0; i<args.length; i++){
      for (var j=0; j<args[i].length; j++){
        options.payload.params.push(encodeURIComponent(args[i][j])); // use encodeURIComponent as encodeURI does NOT encode commas
      }
    }
  } else if (!isNaN(args)){ // for numbers or a single cell reference that contains a number
    options.payload.params.push(args.toString());
  } else if (args) { // for strings or a single cell reference that contains a string
    options.payload.params = args.split(",");
  }
  
  options.payload = JSON.stringify(options.payload);
  var response = UrlFetchApp.fetch(scriptProperties.getProperty(domainKey)+'/sheets_run', options).getContentText();
  try {
    var rsp = JSON.parse(response);
    if ('error' in rsp && rsp.error != ''){
      return [['data connector error: '+rsp.error]];
    } else if ('response' in rsp){
      if (rsp.response===''){
        return [['--']];
      }
      return rsp.response; 
    } else {
      return rsp;
    }   
  } catch (e){
    return [['data connector error: invalid JSON']];
  }
}

var oauthConnections = [getGoogleAnalyticsReportingService, getGitHubService];
// These names should match the services defined in OAuth2.jsx
var github = 'github';
var googleAnalyticsReporting = 'google_analytics_reporting';

/**
 * Gets the user's authorized OAuth2 connections
 * @return {Object} An array of active OAuth2 connections
 */
 function getOAuthConnections(){
  var authorized = {};
  oauthConnections.forEach(function(item, index){
    var service = item();
    if (service.hasAccess()){
      authorized[service.serviceName_] = service.getAccessToken();
    }
  })
  return authorized;
}

/**
 * Builds and returns the authorization URL from the service object.
 * @return {String} The authorization URL.
 */
function getAuthorizationUrl(service) {
  if(service===github){
    return getGitHubService().getAuthorizationUrl();
  } else if (service == googleAnalyticsReporting){
    return getGoogleAnalyticsReportingService().getAuthorizationUrl();
  }
}

/**
 * Resets the API service, forcing re-authorization before
 * additional authorization-required API calls can be made.
 */
function oauthSignOut(provider) {
  if(provider === googleAnalyticsReporting){
    getGoogleAnalyticsReportingService().reset();
  } else if(provider === github){
    getGitHubService().reset();
  }
}

/**
 * Callback handler that is executed after an authorization attempt.
 * @param {Object} request The results of API auth request.
 */
function authCallback(request){
  var template = HtmlService.createTemplateFromFile('callback');
  template.isSignedIn = false;
  template.error = null;
  var title;
  try {
    var service;
    if(request.parameters.serviceName===googleAnalyticsReporting){
      service = getGoogleAnalyticsReportingService();
    } else if(request.parameters.serviceName===github){
      service = getGitHubService();
    }
    var authorized = service.handleCallback(request);
    template.isSignedIn = authorized;
    title = authorized ? 'Access Granted' : 'Failed to connect to service';
  } catch (e) {
    template.error = e;
    title = 'Access Error';
  }
  template.title = title;
  return template.evaluate().setTitle(title);
}

/**
 * Logs the redict URI to register in the Google Developers Console.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}

/**
 * Includes the given project HTML file in the current HTML project file.
 * Also used to include JavaScript.
 * @param {String} filename Project file name.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Gets an OAuth2 service configured for the Google Analytics Reporting API.
 * @return {OAuth2.Service} The OAuth2 service
 */
 function getGoogleAnalyticsReportingService(){
  const scriptProperties = PropertiesService.getScriptProperties();
  const userProperties = PropertiesService.getUserProperties();
  return OAuth2.createService(googleAnalyticsReporting)
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(scriptProperties.getProperty(googleAnalyticsReportingClientID))
    .setClientSecret(scriptProperties.getProperty(googleAnalyticsReportingSecret))
    .setCallbackFunction('authCallback')
    .setScope('https://www.googleapis.com/auth/analytics.readonly')
    .setPropertyStore(userProperties);
}

/**
 * Gets an OAuth2 service configured for the GitHub API.
 * @return {OAuth2.Service} The OAuth2 service
 */
 function getGitHubService(){
  const scriptProperties = PropertiesService.getScriptProperties();
  const userProperties = PropertiesService.getUserProperties();
  return OAuth2.createService(github)
    .setAuthorizationBaseUrl('https://github.com/login/oauth/authorize')
    .setTokenUrl('https://github.com/login/oauth/access_token')
    .setClientId(scriptProperties.getProperty(githubClientID))
    .setClientSecret(scriptProperties.getProperty(githubClientSecret))
    .setCallbackFunction('authCallback')
    .setPropertyStore(userProperties);
}

global.onInstall = onInstall;
global.onOpen = onOpen;
global.sidebar = sidebar;
global.getCommands = getCommands;
global.run = run;
global.runCommand = runCommand;
global.saveCommands = saveCommands;
// OAuth2 functions
global.getOAuthConnections = getOAuthConnections;
global.getAuthorizationUrl = getAuthorizationUrl;
global.oauthSignOut = oauthSignOut;
global.authCallback = authCallback;
global.include = include;
