const keepAlive = require("./server");
//keepAlive();

require("dotenv").config();
const Discord = require("discord.js");
const Statcord = require("statcord.js");
const config = require("./config.json");
const bot = new Discord.Client({ disableEveryone: true });
const axios = require("axios");
var cache = require("memory-cache");
bot.login(process.env.bot_token);
//bot.setMaxListeners(100);

const enabled = true;

const permissionsError =
  "You need `MANAGE_MESSAGES` permissions in order to run this command.";

const statcord = new Statcord.Client({
  key: process.env.statcord,
  client: bot,
});

bot.on("ready", async () => {
  console.log("Ready.");
  console.log("CuRe is now online in " + bot.guilds.cache.size + " guilds.");
  await statcord.autopost();

  bot.user
    .setActivity("for ?help", { type: "WATCHING" })
    .then((presence) =>
      console.log(
        `Activity set: ${presence.game ? presence.game.name : "none"}`
      )
    )
    .catch(console.error);
});

statcord.on("autopost-start", () => {
  console.log("Started statcord autopost.");
});

statcord.on("post", (status) => {
  if (!status) console.log("Posted to statcord.");
  else console.error(status);
});

bot.on("message", async (message) => {
  if (message.author.bot) return;
  let args = message.content.split(" ");
  let command = args[0];
  if (command == config.prefix + "stats") {
    try {
      statcord.postCommand("stats", message.author.id);
    } catch (e) {
      console.log("Failed to post command stats to statcord.");
    }
    let guildNum = 0;
    let channelNum = 0;
    let memberNum = 0;
    bot.guilds.cache.map((guild) => {
      guildNum++;
      guild.channels.cache.map((channel) => {
        channelNum++;
      });
      memberNum += guild.memberCount;
    });
    await message.channel.send(
      "I help **" +
        memberNum +
        " users** in **" +
        channelNum +
        " channels** of** " +
        guildNum +
        " servers!**"
    );
  }
});

// Check if the bot was tagged in the message
bot.on("message", async (message) => {
  if (message.author.bot) return;
  if (message.content.includes(bot.user.toString())) {
    try {
      await statcord.postCommand("mentioned", message.author.id);
    } catch (e) {
      console.log("Failed to post command stats to statcord");
    }
    return message.channel.send(
      "Hey there! My prefix is `" +
        config.prefix +
        "`\nRun `" +
        config.prefix +
        "help` to see some of my commands!"
    );
  }
});

bot.on("message", async (message) => {
  if (message.author.bot) return;
  let prefix = config.prefix;
  let messageBody = message.content.split(" ");
  let command = messageBody[0];

  if (command == `${prefix}help`) {
    try {
      await statcord.postCommand("help", message.author.id);
    } catch (e) {
      console.log("Failed to post command stats to statcord");
    }
    const embed = new Discord.MessageEmbed()
      .setColor("#123456")
      .setTitle("**CuRe Bot**")
      .setDescription(
        "CuRe Bot is a ***Cu***stom ***Re***sponse Bot for discord."
      )

      .addField(
        config.prefix + "help",
        "Shows what you are looking at right now."
      )
      .addField(
        config.prefix + "create your trigger - your response",
        "This command **creates a trigger.** Whenever a user sends a messages containing the trigger string, the bot will respond with the response string. The trigger and response arguments are separated by `-`"
      )
      .addField(
        config.prefix + "list",
        "Shows a **list of the triggers** and responses on the server."
      )
      .addField(
        config.prefix + "remove index",
        "**Deletes a trigger** from the server. To get the trigger's index, use the `" +
          config.prefix +
          "list` command."
      )
      .addField(
        config.prefix + "ping",
        "Tells you the bot's and Discord's API latency."
      )
      //.addField(config.prefix + "stats", "Shows the bot's usage statistics.")
      .addField(
        "Like CuRe?",
        "[Consider upvoting CuRe](https://top.gg/bot/592968118905733120)\n[Inviting the bot to your own server!](https://cure.jkm.sh/invite)\nOr [supporting development on patreon](https://www.patreon.com/jokur) 😃"
      )

      .addField(
        "Need help?",
        "Join the [CuRe Bot Support Server](https://cure.jkm.sh/server)"
      )
      .setTimestamp()
      .setURL("https://cure.jkm.sh")
      .setFooter("💙 CuRe Bot");

    return message.channel.send(embed);
  } else if (command == config.prefix + "list") {
    return message.channel.send(
      "View this server's triggers at the following link: https://cure.jkm.sh/triggers?guild=" +
        message.guild.id
    );
  } else if (command == `${config.prefix}ping`) {
    try {
      await statcord.postCommand("ping", message.author.id);
    } catch (e) {
      console.log("Failed to post command stats to statcord");
    }
    const m = await message.channel.send("Pong 🏓");
    m.edit(
      `Pong 🏓\nBot latency is ${
        m.createdTimestamp - message.createdTimestamp
      }ms. Discord API Latency is ${bot.ws.ping}ms`
    );
  }
});

const checkManageMessagePerms = (message) => {
  if (!message.channel.permissionsFor(message.member).has("MANAGE_MESSAGES")) {
    return true;
  }
  return false;
};

//add trigger
bot.on("message", async (message) => {
  if (message.author.bot) return;
  let prefix = config.prefix;
  let guild = message.guild.id;
  if (
    message.content.substring(0, prefix.length + "create".length) ==
    prefix + "create"
  ) {
    try {
      await statcord.postCommand("create", message.author.id);
    } catch (e) {
      console.log("Failed to post command stats to statcord");
    }
    let content = message.content
      .substring(prefix.length + "create".length + 1)
      .split(" - ");
    if (content.length < 2) {
      return await message.channel.send(
        "You did not include an argument. Try again."
      );
    }

    if (checkManageMessagePerms(message)) {
      return message.channel.send(permissionsError);
    }

    axios
      .get(process.env.storage_service + guild)
      .then(async function (response) {
        let after;
        if (JSON.stringify(response.data) == "{}") {
          after = JSON.parse(
            '{"' +
              content[0] + //trigger
              '":"' +
              content[1] + //response
              '"}'
          );
        } else {
          let before = JSON.stringify(response.data);
          after = JSON.parse(
            before.substring(0, before.length - 1) +
              ',"' +
              content[0] + //trigger
              '":"' +
              content[1] + //response
              '"}'
          );
        }
        pushNewTriggerList(message, after);
      })
      .catch(async function (error) {
        console.log(
          "Error retrieving trigger list. Cannot add new trigger.\n" + error
        );
        //if not triggers exist bc of 404 error try again here
        after = JSON.parse(
          '{"' +
            content[0] + //trigger
            '":"' +
            content[1] + //response
            '"}'
        );
        pushNewTriggerList(message, after);
      });
  }
});

async function pushNewTriggerList(message, updatedList, removeTrigger = false) {
  let guild = message.guild.id;
  axios
    .put(process.env.storage_service + guild, updatedList)
    .then(async function (response) {
      let addOrDelete = "added";
      if (removeTrigger) {
        addOrDelete = "removed";
      }
      return await message.channel.send(
        "Trigger " +
          addOrDelete +
          " successfully. To see the new trigger list run `" +
          config.prefix +
          "list`.\nIt will take up to 30 seconds for the updated trigger list to take effect."
      );
    })
    .catch(async function (error) {
      return await message.channel.send(
        "Error adding new trigger.  \n" + error
      );
    });
}

//remove trigger cmd
bot.on("message", async (message) => {
  if (message.author.bot) return;

  let prefix = config.prefix;
  let guild = message.guild.id;
  let args = message.content.split(" ");
  let command = args[0];
  if (command == prefix + "remove") {
    if (args[1] == undefined || isNaN(args[1])) {
      return message.channel.send(
        "Include a trigger index to remove.\nTo see the trigger list run `" +
          config.prefix +
          "list`."
      );
    }
    if (checkManageMessagePerms(message)) {
      return message.channel.send(permissionsError);
    }
    try {
      await statcord.postCommand("remove", message.author.id);
    } catch (e) {
      console.log("Failed to post command stats to statcord");
    }
    //check if number and is in bounds
    axios
      .get(process.env.storage_service + guild)
      .then(async function (response) {
        let before = response.data;
        let keys = Object.keys(response.data);
        if (args[1] > keys.length - 1 || args[1] < 0) {
          return message.channel.send("Trigger index out of bounds.");
        }
        let remover = keys[args[1]];
        delete before[remover];
        pushNewTriggerList(message, before, true);
      })
      .catch(async function (error) {
        return console.log(
          "Error retrieving trigger list. Cannot remove trigger.  \n" + error
        );
      });
  }
});

const triggerCheck = async (message, triggers) => {
  for (i = 0; i < Object.keys(triggers).length; i++) {
    let trigger = Object.keys(triggers)[i];
    if (message.content.toLowerCase().includes(trigger.toLowerCase())) {
      try {
        await statcord.postCommand("RESPONSE", message.author.id);
      } catch (e) {
        console.log("Failed to post command stats to statcord");
      }
      return message.channel.send(triggers[trigger]);
    }
  }
};

//message trigger functionality
if (enabled) {
  bot.on("message", async (message) => {
    const guild = message.guild.id;
    //ignore if bot or if prefixed
    if (
      message.author.bot ||
      message.content.substring(0, 1) == config.prefix
    ) {
      return;
    }

    if (cache.get(guild)) {
      console.log("in cache")
      return triggerCheck(message, cache.get(guild));
    } else {
      //guild not in cache
      await axios
        .get(process.env.storage_service + guild)
        .then(async function (response) {
          cache.put(guild, response.data, 30000);
          return triggerCheck(message, cache.get(guild));
        })
        .catch(async function (error) {
          //console.log("Error fetching trigger list. Cannot put into cache.);
        });
    }
  });
}
