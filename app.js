const Discord = require("discord.js");
const puppeteer = require('puppeteer');
const wikiRegex = new RegExp("\\[\\[([^\\[\\]]*)\\]\\]", "gu");
const urlRegex = new RegExp("\\w", "g");

const log = require('simple-node-logger').createSimpleFileLogger('./logs/requests.log');
const errorLog = require('simple-node-logger').createSimpleFileLogger('./logs/error.log');
errorLog.setLevel('error');

var config = require("./config.json");

var client = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ["TYPING_START"]
});

var browser;

client.token = config.token;

client.login();
console.log("Logged in");

//Setup our browswer
(async () => {
    browser = await puppeteer.launch({
        ignoreHTTPSError: true,
        headless: true,
        handleSIGHUP: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
})();

client.on("ready", () => {
    console.log(`Ready as ${client.user.username}`);
});

client.on("message", (message) => {
    if (message.author.id == client.user.id) {
        //Disabled this check, as it causes it to not do a check if you post twice in a row.
        //return;
    }
    try {
        const server = message.guild.name;

        let matches = wikiRegex.exec(message.cleanContent);
        if (matches != null && matches.length > 0) {
            for (let i = 1; i < matches.length; i++) {
                handleItem(titleCase(matches[i]), message.channel, server);
            }
        }
    } catch (error) {
        errorLog.error(new Date().toJSON(), ' ', error.message);
    }
});

async function handleItem(name, channel, server) {
    console.log(name)
    let itemUrlPart = convertToUrlString(name);
    var url = config.wikiURL + itemUrlPart;
    let initalMessage = "Retrieving details from the Wiki for **" + name + "**";
    var messageId;
    await channel
        .send(initalMessage)
        .then(message => {
            //console.log(`Sent message: ${message.id} ${initialMessage}`);
            messageId = message.id;
        })
        .catch(error => {
            //console.log(error.message)
            errorLog.error(new Date().toJSON(), ' ', error.message, ' - ', server, ' - ', name);
        })

    if (messageId != null) {
        await getImage(url, server)
            .then((result) => {
                if (result.success == false) {
                    channel
                        .fetchMessage(messageId)
                        .then(message => {
                            message.edit("Could not get details from the Wiki for **" + name + "**");
                        })
                        .catch(error => {
                            errorLog.error(new Date().toJSON(), ' Could not edit message ', messageId, ' - ', server, ' - ', name);
                        })
                } else {
                    log.info(new Date().toJSON(), ' ', server, ' - ', name, ' - ', url);
                    //need a way that lets us add an attachment message, currently I can only edit text to it
                    let output = '<' + url + '>';
                    console.log(output);
                    //if no screenshot, just edit the original message
                    if (result.screenshot == false) {
                        channel
                            .fetchMessage(messageId)
                            .then(message => {
                                message.edit(output);
                            })
                            .catch(error => {
                                errorLog.error(new Date().toJSON(), ' Could not edit message ', messageId, ' - ', server, ' - ', name);
                            })
                    } else {
                        //otherwise delete the message and create a new one with the screenshot
                        channel
                            .fetchMessage(messageId)
                            .then(message => {
                                message.delete();
                            })
                            .catch(error => {
                                errorLog.error(new Date().toJSON(), ' Could not delete message ', messageId, ' - ', server, ' - ', name);
                            })
                        channel.send(output, { file: result.screenshot });
                    }
                    console.log('Found in the wiki and sent: ' + url);
                }
            })
            .catch(error => {
                errorLog.error(new Date().toJSON(), ' ', error.message, ' - ', server, ' - ', name);
            })
    }
}

async function getImage(url, server) {
    console.time('getPage')
    const page = await browser.newPage();
    //Disabling Javascript adds 100% increased performance
    await page.setJavaScriptEnabled(config.enableJavascript)
    var output = {
        screenshot: false,
        success: false
    }

    //Set a tall page so the image isn't covered by popups
    await page.setViewport({ 'width': config.width, 'height': config.height });

    try {
        //played around with a few different waitUntils.  This one seemed the quickest.
        //If you don't disable Javascript on the PoE Wiki site, removing this parameter makes it hang
        await page.goto(url, { waitUntil: 'networkidle2' });
    } catch (error) {
        errorLog.error(new Date().toJSON(), ' ', error.message, ' - ', server, ' - ', url);
    }

    var invalidPage = await page.$(config.wikiInvalidPage);
    //if we have a invalid page, lets exit
    if (invalidPage != null) {
        return output;
    }

    //if we have a div for the item, screenshot it.
    //If not, just return the page without the screenshot
    const div = await page.$(config.wikiDiv);
    if (div != null) {
        try {
            output.screenshot = await div.screenshot();
            output.success = true;
        } catch (error) {
            output.success = true;
        }
    } else {
        output.success = true;
    }

    await page.close();
    console.timeEnd('getPage')
    return output;

}

function convertToUrlString(name) {
    return name.replace(new RegExp(" ", "g"), "_");
}

function titleCase(str) {
    let excludedWords = ["of", "and", "the", "to", "at", "for"];
    let words = str.toLowerCase().split(" ");
    for (var i in  words)
    {
        if ((i == 0) || !(excludedWords.includes(words[i]))) {
            words[i] = words[i][0].toUpperCase()+words[i].slice(1,words[i].length);
        } else {
            continue;
        }
    }
    return words.join(" ");
};
