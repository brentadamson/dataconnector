---
title: Google Analytics
slug: /google-analytics
---

## How do I import Google Analytics data to Google Sheets?

Google Analytics is a web analytics service offered by Google that tracks and reports website traffic, currently as a platform inside the Google Marketing Platform brand. In this guide, I'll walk you through how to import data from Google Analytics into Google Sheets.

** BEFORE YOU BEGIN **

If you haven't already, install the Data Connector Add-on for Google Sheets from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/appname/529655450076)

**Step 1: Create your API Request**

1. Open Google Sheets and click `Add-ons -> Data Connector -> Manage Connections`
2. Click `NEW COMMAND`
3. Name your command. In this case, we will name it `analytics`
4. Select `API` for the Type
5. Select and connect to the `Google Analytics Reporting` OAuth2 provider
6. Select `POST` for the Method
7. Enter `https://analyticsreporting.googleapis.com/v4/reports:batchGet` in the URL field.
8. Enter a header with Key of `Content-Type` and Value of `application/json`
9. Enter the following for the Body (your `viewId` can be found at http://analytics.google.com/):
  ```
  {
    "reportRequests": [
      {
        "viewId": "my-view-id",
        "dateRanges": [
          {
            "startDate": "+++2+++",
            "endDate": "+++3+++"
          }
        ],
        "metrics": [
          {
            "expression": "ga:+++1+++"
          }
        ]
      }
    ]
  }
  ```
10. Select `JMESPath` for the Filter type
11. Enter `reports[].data.totals[].values[]` in the expression box.
12. Click `SAVE`

**Step 2: Run the command**

1. Now, you can run your command: `=run("analytics","pageviews,2021-05-07,2021-05-07")`