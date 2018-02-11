# PoEWikiBot

A Discord bot for looking up Path of Exile items on the Wiki.  It will post an image of the Item information from the wiki if it's available. Otherwise it will post a direct link to the Wiki Page.

## How it works

The bot uses Puppeteer to load the relevant wiki page for the item passed in.  Once the page has loaded it then takes a screenshot of the Item div.  Puppeteer uses Chromium which means the bot takes up a reasonable amount of disk space (just under 300MB).

## Requirements

This requires Node.js version 7.6+ at a minimum, as it uses async/await calls.

## Configuration

Update the token value in **config.json** with your Discord Bot token.

Run **npm install**

Start the bot with  **node app.js**

## Support for other wikis

You should be able to edit the **wikiURL** and **wikiDiv** settings in the **config.json** to a different Wiki.

The **wikiDiv** is the CSS selector that the bot will screenshot.

## Known issues

### Running on Ubunutu

There are two issues with running it on Ubuntu (and possibly other distros).

* Puppeteer won't start in a sandbox, so this feature is diabled, which isn't recommended from a security standpoint.  Remove these options in the puppeteer.launch to enable sandbox mode: '--no-sandbox', '--disable-setuid-sandbox'
* Puppeteer will also stop sending web pages after a number of requests, which the flag '--disable-dev-shm-usage' should fix.


## Settings

Settings available in the **config.json** are:

Settings | Default Value
---------|--------------
token |
wikiURL | "https://pathofexile.gamepedia.com/"
wikiDiv | ".infobox-page-container > .item-box"
wikiInvalidPage | ".noarticletext"
wikiInfoDiv | ".infocard"
width  | 2500
height | 2500
enableJavascript | false

## Usage

syntax: **[[ItemName]]**

![The Scourge](/screenshots/The_Scourge.png?raw=true "The Scourge")

## Acknowledgements

This bot was forked from https://github.com/DrJam/PoEWikiBot, which I found while looking for a bot with this functionality.  I couldn't get his to work, but I reused parts of his code in this solution.