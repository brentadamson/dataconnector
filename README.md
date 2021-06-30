# Data Connector

Data Connector is a Google Sheets Add-on that lets you import (and export) data to/from Google Sheets. Our roadmap:

<ol>
  <li>Connect to JSON/XML/CSV APIs</li>
  <li>Import data from any website, including those with JavaScript via a headless browser</li>
  <li>JMESPath/XPath/JSONPath/Pup/JQ and other filters</li>
  <li>Connect to PostgreSQL, MySQL, and other databases</li>
  <li>Run your commands in Google Sheets/Excel/Slack/Airtable</li>
</ol>

Q: Why create this when there's like a bazillion Add-ons that do the same thing? 

A: Privacy! Add-ons in Google Sheets have a lot of power to read your Sheet. Further, connecting to various APIs and databases means we may need to store your API Keys and other information securely (unless, of course, you parameterize your queries). We want to be transparent about our methods and are always open to suggestions on how to improve the code. While other Add-ons might claim to be privacy-centric, you can never be assured until you see the code. Further, no other Add-on fulfilled our wishlist above.

More about how we stack up to our competitors can be found [on our website](https://dataconnector.app/)

## :runner: How do I run this?

The easiest way to run the Data Connector Add-on is to install it from the Google Workspace Marketplace: https://workspace.google.com/marketplace/app/appname/529655450076

## :hammer: If, instead, you want to run your own version you will need to setup both the backend API and the Google Sheets parts. 

* Clone this repo:

  `git clone https://github.com/brentadamson/dataconnector.git`


### Backend

* Set your environment variables:

  **IMPORTANT**: The `KEY` **MUST** be the same as the `KEY` environment variable set below in the `Google Sheets` section.

  ```
  export DATACONNECTOR_POSTGRESQL_USER=user
  export DATACONNECTOR_POSTGRESQL_PASSWORD=mypassword
  export DATACONNECTOR_POSTGRESQL_HOST=localhost
  export DATACONNECTOR_POSTGRESQL_DATABASE=mydatabase
  export DATACONNECTOR_POSTGRESQL_PORT=5432
  export DATACONNECTOR_KEY=my-key
  ```

* `cd backend/backend/cmd`

* `go run .`

  Your backend service will be listening at `http://127.0.0.1:8000` by default

### Google Sheets

* From the main `dataconnector` directory:

  `cd googlesheets`

  `npm install`

* Login to [clasp](https://github.com/google/clasp), which lets you manage Apps scripts from the commandline:

  `npm run login`

* Setup a new Sheet and script by running:

  `npm run setup`

  If you already have an existing Sheet and script:

  `npm run setup:use-id <script_id>`

* In your new Sheets script, create a new file called `env.gs` and paste the following code:

  ```
  function updateEnvVariables(){
    PropertiesService.getScriptProperties().setProperty('DOMAIN', 'https://api.example.com');
    PropertiesService.getScriptProperties().setProperty('KEY',"my-key");

    // OAuth2 Creds
    //// Facebook Ads Manager API
    PropertiesService.getScriptProperties().setProperty('FACEBOOK_ADS_MANAGER_CLIENT_ID', 'my-facebook-ads-manager-app-id');
    PropertiesService.getScriptProperties().setProperty('FACEBOOK_ADS_MANAGER_CLIENT_SECRET', 'my-facebook-ads-manager-client-secret');
    //// GitHub API
    PropertiesService.getScriptProperties().setProperty('GITHUB_CLIENT_ID', 'my-github-client-id');
    PropertiesService.getScriptProperties().setProperty('GITHUB_CLIENT_SECRET', 'my-github-client-secret');
    //// Google Analytics Reporting API
    PropertiesService.getScriptProperties().setProperty('GOOGLE_ANALYTICS_REPORTING_CLIENT_ID', 'my-google-analytics-client-id.apps.googleusercontent.com');
    PropertiesService.getScriptProperties().setProperty('GOOGLE_ANALYTICS_REPORTING_SECRET', 'my-google-analytics-client-secret');
  }
  ```

  **IMPORTANT**: The `KEY` **MUST** be the same as the `KEY` environment variable set above in the `Backend` section.

  Update the `DOMAIN` and `KEY`, select the `updateEnvVariables` in the functions dropdown list and hit the play button.

  Once that's complete, you can delete the `env.gs` file.

* To make changes to the Add-on, enable hot reloading:

  `mkcert -install`

  `npm run setup:https`

  `npm run start`

  Make some changes in the code and see the changes instantly in the Add-on.
  
  **Note**: changes to `Code.js` will require a restart.

* To deploy:

  `npm run deploy`

### To contribute

Before you do anything, please open up an issue or assign yourself an existing one. This helps coordinate things.
