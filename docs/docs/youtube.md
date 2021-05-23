---
title: Youtube
slug: /youtube
---

## How do I import YouTube data to Google Sheets?

YouTube is an online video platform owned by Google. In total, users watch more than one billion hours of YouTube videos each day, and hundreds of hours of video content are uploaded to YouTube servers every minute. It was founded by Steve Chen, Chad Hurley, and Jawed Karim. In this guide, I'll walk you through how to import data from YouTube into Google Sheets.

** BEFORE YOU BEGIN **

If you haven't already, install the Data Connector Add-on for Google Sheets from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/appname/529655450076)

**Step 1: Create your API Request**

1. Open Google Sheets and click `Add-ons -> Data Connector -> Manage Connections`
2. Click `NEW COMMAND`
3. Name your command. In this case, we will name it `youtube`
4. Select `API` for the Type
5. Select and connect to the `YouTube` OAuth2 provider
6. Select `GET` for the Method
7. Enter `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=+++1+++` in the URL field.
8. Select `JMESPath` for the Filter type
9. Enter `items[].statistics.viewCount` in the expression box.
10. Click `SAVE`

**Step 2: Run the command**

1. Now, you can run your command: `=run("youtube","your-channel-id")`