export const onInstall = () => {
  onOpen();
}

export const onOpen = () => {
  SpreadsheetApp.getUi().createAddonMenu().addItem("Manage Connections", 'sidebar').addToUi(); 
};

export const sidebar = () => {
  updateUserKey();
  var html = HtmlService.createTemplateFromFile("sidebar").evaluate();
  html.setTitle("Data Connector");
  html.key = Session.getTemporaryActiveUserKey();
  html.email = Session.getActiveUser().getEmail();
  SpreadsheetApp.getUi().showSidebar(html);
};

// updateUserKey updates a user's temporaryActiveUserKey
export const updateUserKey = () => {
  // We don't necessarily need to encrypt the jwt since it will be going over HTTPS but could be good to do anyway.
  const scriptProperties = PropertiesService.getScriptProperties();
  const jwt = createJwt({
    privateKey: scriptProperties.getProperty('JWT_SECRET'),
    input: {'email':Session.getActiveUser().getEmail(),'google_key':Session.getTemporaryActiveUserKey()},
  });
 
  var options = {
    'validateHttpsCertificates': false,
    'method': 'POST',
    'followRedirects': true,
    'muteHttpExceptions': true,
    'headers' : {
      'Authorization': 'Bearer '+jwt,
    },
  };
  var response = UrlFetchApp.fetch(scriptProperties.getProperty('DOMAIN')+'/update_google_key', options).getContentText();
  return JSON.parse(response); 
}

export const getCommands = () => {
  var google_key = Session.getTemporaryActiveUserKey();
  var options = {
    'validateHttpsCertificates': false,
    'method': 'GET',
    'followRedirects': true,
    'muteHttpExceptions': false,
  };
  var response = UrlFetchApp.fetch(PropertiesService.getScriptProperties().getProperty('DOMAIN')+'/get?google_key='+google_key, options).getContentText();
  return JSON.parse(response); 
};

// runCommand simply inserts the formula to run and nothing else. Maybe shouldn't call it "runCommand"?
export const runCommand = (name) => {
  SpreadsheetApp.getActiveSheet().getActiveCell().setFormula('=run("'+name+'")');
  return;
};

export const saveCommands = (commands) => {
  var google_key = Session.getTemporaryActiveUserKey();
  var options = {
    'validateHttpsCertificates': false,
    'method': 'POST',
    'contentType': 'application/json',
    'followRedirects': true,
    'muteHttpExceptions': false,
    'payload': JSON.stringify({"google_key": google_key, "commands": commands}),
  };
  var response = UrlFetchApp.fetch(PropertiesService.getScriptProperties().getProperty('DOMAIN')+'/save', options).getContentText();
  return JSON.parse(response); 
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
  var options = {
    'validateHttpsCertificates': false,
    'method': 'POST',
    'followRedirects': true,
    'muteHttpExceptions': false,
    'payload': {
      'google_key': Session.getTemporaryActiveUserKey(),
      // TODO: We won't have to get every access token once we start storing everything in PropertiesService...
      'credentials': getOAuthConnections(),
      'command_name': name,
      'params': [],    
    }
  };
  
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
  var response = UrlFetchApp.fetch(PropertiesService.getScriptProperties().getProperty('DOMAIN')+'/run', options).getContentText();
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

// https://vanchiv.com/create-json-web-token-using-google-apps-script/
const createJwt = ({ privateKey, input = {} }) => {
  // Sign token using HMAC with SHA-256 algorithm
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Date.now();
  const expires = new Date(now);

  // we don't need it to last for hours
  // expires.setHours(expires.getHours() + expiresInHours);
  expires.setMinutes(expires.getMinutes() + 1);

  // iat = issued time, exp = expiration time
  const payload = {
    exp: Math.round(expires.getTime() / 1000),
    iat: Math.round(now / 1000),
  };

  // add user payload
  Object.keys(input).forEach(function (key) {
    payload[key] = input[key];
  });

  const base64Encode = (text, json = true) => {
    const input = json ? JSON.stringify(text) : text;
    return Utilities.base64EncodeWebSafe(input).replace(/=+$/, '');
  };

  const toSign = `${base64Encode(header)}.${base64Encode(payload)}`;
  const signatureBytes = Utilities.computeHmacSha256Signature(
    toSign,
    privateKey
  );
  const signature = base64Encode(signatureBytes, false);
  return `${toSign}.${signature}`;
};

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
  return OAuth2.createService(googleAnalyticsReporting)
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(PropertiesService.getScriptProperties().getProperty('GOOGLE_ANALYTICS_REPORTING_CLIENT_ID'))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty('GOOGLE_ANALYTICS_REPORTING_SECRET'))
    .setCallbackFunction('authCallback')
    .setScope('https://www.googleapis.com/auth/analytics.readonly')
    .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Gets an OAuth2 service configured for the GitHub API.
 * @return {OAuth2.Service} The OAuth2 service
 */
 function getGitHubService(){
  return OAuth2.createService(github)
    .setAuthorizationBaseUrl('https://github.com/login/oauth/authorize')
    .setTokenUrl('https://github.com/login/oauth/access_token')
    .setClientId(PropertiesService.getScriptProperties().getProperty('GITHUB_CLIENT_ID'))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty('GITHUB_CLIENT_SECRET'))
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties());
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
