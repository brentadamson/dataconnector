---
title: Yahoo Finance
slug: /yahoo-finance
---

## How do I import Yahoo Finance data to Google Sheets?

Yahoo! Finance is a media property that is part of the Yahoo! network, which, since 2017, is owned by Verizon Media. It provides financial news, data and commentary including stock quotes, press releases, financial reports, and original content. It also offers some online tools for personal finance management. In addition to posting partner content from other web sites, it posts original stories by its team of staff journalists. It is ranked 15th by SimilarWeb on the list of largest news and media websites. In this guide, I'll walk you through how to import data from Yahoo Finance into Google Sheets.

** BEFORE YOU BEGIN **

If you haven't already, install the Data Connector Add-on for Google Sheets from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/appname/529655450076)

**Step 1: Create your API Request**

1. Open Google Sheets and click `Add-ons -> Data Connector -> Manage Connections`
2. Click `NEW COMMAND`
3. Name your command. In this case, we will name it `yahoo`
4. Select `API` for the Type
5. Select `GET` for the Method
6. Enter `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/+++1+++/net-share-purchase-activity` in the URL field.
7. Enter a new header with key `x-rapidapi-key` and value of your API Key from Rapid API.
8. Enter a new header with key `x-rapidapi-host` and value of `yahoo-finance15.p.rapidapi.com`.
9. Enter a new header with key `useQueryString` and value of `true`.
10. Select `JMESPath` for the Filter type
11. Enter `netSharePurchaseActivity.buyPercentInsiderShares.raw` in the expression box.
12. Click `SAVE`

**Step 2: Run the command**

1. Now, you can run your command: `=run("yahoo", "AAPL")`