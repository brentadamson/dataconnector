---
title: Github
slug: /github
---

## How do I connect to the GitHub API in Google Sheets?

GitHub is where people build software. More than 65 million people use GitHub to discover, fork, and contribute to over 200 million projects. In this guide, I'll walk you through how to import data from GitHub into Google Sheets.

** BEFORE YOU BEGIN **

If you haven't already, install the Data Connector Add-on for Google Sheets from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/appname/529655450076)

**Step 1: Create your API Request**

1. Open Google Sheets and click `Add-ons -> Data Connector -> Manage Connections`
2. Click `NEW COMMAND`
3. Name your command. In this case, we will name it `github`
4. Select `API` for the Type
5. Select and connect to the `GitHub` OAuth2 provider
6. Select `GET` for the Method
7. Enter `https://api.github.com/user/repos` in the URL field.
8. Select `JMESPath` for the Filter type
9. Enter `[].[name,stargazers_count]` in the expression box.
10. Click `SAVE`

**Step 2: Run the command**

1. Now, you can run your command: `=run("github")`

**Notes**

Not all of GitHub's endpoints require OAuth2 credentials.