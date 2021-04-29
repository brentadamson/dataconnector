---
title: CoinMarketCap
slug: /coinmarketcap
---

## How do I import CoinMarketCap data to Google Sheets?

CoinMarketCap describes their API as follows: "The CoinMarketCap API is our enterprise-grade cryptocurrency API for all crypto data use cases from personal, academic, to commercial. The API is a suite of high-performance RESTful JSON endpoints that allow application developers, data scientists, and enterprise business platforms to tap into the latest raw and derived cryptocurrency and exchange market data as well as years of historical data. This is the same data that powers coinmarketcap.com which has been opened up for your use cases." In this guide, I'll walk you through how to import data from CoinMarketCap into Google Sheets.

** BEFORE YOU BEGIN **

If you haven't already, install the Data Connector Add-on for Google Sheets from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/appname/529655450076)

**Step 1: Create your API Request**

1. Open Google Sheets and click `Add-ons -> Data Connector -> Manage Connections`
2. Click `NEW COMMAND`
3. Name your command. In this case, we will name it `coinmarketcap`
4. Select `API` for the Type
5. Select `GET` for the Method
6. Enter `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?convert=USD&symbol=BTC` in the URL field.
7. Enter `X-CMC_PRO_API_KEY` for a Header key and `+++1+++` for the Header value
8. Enter `Accept` for another Header key and `application/json` for the Header value
7. Select `JMESPath` for the Filter type
8. Enter `data.BTC.quote.USD.price` in the expression box.
9. Click `SAVE`

**Step 2: Run the command**

1. Now, you can run your command: `=run("coinmarketcap", B1)`, where cell `B1` has your CoinMarketCap API Key