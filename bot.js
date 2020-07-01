require("dotenv").config();
const Discord = require("discord.js");
const Statcord = require("statcord.js");
const config = require("./config.json");
const bot = new Discord.Client({ disableEveryone: true });
const axios = require("axios");
bot.login(process.env.bot_token);
bot.setMaxListeners(100)
const enabled = true;

const statcord = new Statcord.Client(process.env.statcord, bot);

bot.on("ready", () => {
  // List servers the bot is connected to
  bot.guilds.cache.map(guild => {
    console.log(" - " + guild.name + " (" + guild.id + ")");
    /*
    // List all channels
    guild.channels.forEach(channel => {
      console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`);
    });*/
  });
});

bot.on("ready", async () => {
  console.log("Ready.");
  // Start auto posting
  await statcord.post();
  let initialPost = await statcord.autopost();

  if (initialPost) {
      console.error(initialPost);
      //process.exit();
  }
});


bot.on("message", async message => {

  if (message.author.bot) return;
  let args = message.content.split(" ");
  let command = args[0];
  if (command == config.prefix + "stats") {
    statcord.postCommand("stats", message.author.id);
    let guildNum = 0;
    let channelNum = 0;
    let memberNum = 0;
    bot.guilds.cache.map(guild => {
      guildNum++;
      guild.channels.cache.map(channel => {
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

bot.on("ready", async () => {
  console.log(`${bot.user.username} is now online.`);
  bot.user
    .setActivity("for ?help 😁", { type: "WATCHING" })
    .then(presence =>
      console.log(
        `Activity set: ${presence.game ? presence.game.name : "none"}`
      )
    )
    .catch(console.error);
});

bot.on("message", async message => {
  if (message.author.bot) return;
  // Check if the bot was tagged in the message
  if (message.content.includes(bot.user.toString())) {
    return await message.channel.send(
      "Hey there! My prefix is `" +
        config.prefix +
        "`\nRun `" +
        config.prefix +
        "help` to see some of my commands!"
    );
  }
});

bot.on("message", async message => {
  if (message.author.bot) return;
  let args = message.content.split(" ");
  let command = args[0];
  if (command == config.prefix + "list") {
    message.channel.send(
      "View this server's triggers at the following link: https://curebot.dev/triggers?guild=" +
        message.guild.id
    );
  }
});

bot.on("message", async message => {
  if (message.author.bot) return;

  let prefix = config.prefix;
  let messageBody = message.content.split(" ");
  let command = messageBody[0];

  if (command == `${prefix}help`) {
    statcord.postCommand("help", message.author.id);
    const embed = new Discord.MessageEmbed()
      .setColor("#123456")
      .setTitle("**CuRe Bot Trigger List**")
      .setDescription("CuRe Bot is a ***Cu***stom ***Re***sponse Bot discord.")

      .addField(
        config.prefix + "help",
        "Shows what you are looking at right now."
      )
      .addField(
        config.prefix + "create your trigger - your response",
        'This command **creates a trigger.** Whenever a user sends a messages containing the "trigger" string, the bot will respond with the "response" string. The trigger and response arguments are seperated by `-`'
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
      .addField(config.prefix + "stats", "Shows the bot's usage statistics.")
      .addField(
        "Please consider upvoting the bot on discordbotlist.com 😃",
        "https://discordbotlist.com/bots/cure"
      )
      .addField("Bot invite link", "https://curebot.dev/invite")
      .addField("Support server invite link", "https://curebot.dev/server")
      .setTimestamp()
      .setURL("https://curebot.dev")
      .setFooter("💙 CuRe Bot");

    message.channel.send(embed);
  }
});

//add trigger
bot.on("message", async message => {
  if (message.author.bot) return;

  let prefix = config.prefix;
  let guild = message.guild.id;
  if (
    message.content.substring(0, prefix.length + "create".length) ==
    prefix + "create"
  ) {
    statcord.postCommand("create", message.author.id);
    let content = message.content
      .substring(prefix.length + "create".length + 1)
      .split(" - ");

    if (content.length < 2) {
      return await message.channel.send(
        "You did not include an argument. Try again."
      );
    }
    if (!message.channel.permissionsFor(message.member).has("ADMINISTRATOR")) {
      return await message.channel.send(
        "You need `Administrator` permissions in order to run this command."
      );
    }

    axios
      .get(process.env.storage_service + guild)
      .then(async function(response) {
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
      .catch(async function(error) {
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
    .then(async function(response) {
      let addOrDelete = "added";
      if (removeTrigger) {
        addOrDelete = "removed";
      }
      return await message.channel.send(
        "Trigger " +
          addOrDelete +
          " successfully. To see the new trigger list run `" +
          config.prefix +
          "list`."
      );
    })
    .catch(async function(error) {
      return await message.channel.send(
        "Error adding new trigger.  \n" + error
      );
    });
}

//remove trigger cmd
bot.on("message", async message => {
  if (message.author.bot) return;

  let prefix = config.prefix;
  let guild = message.guild.id;
  let args = message.content.split(" ");
  let command = args[0];
  if (command == prefix + "remove") {
    if (args[1] == undefined || isNaN(args[1])) {
      await message.channel.send(
        "Include a trigger index to remove.\nTo see the trigger list run `" +
          config.prefix +
          "list`."
      );

      return;
    }
    if (!message.channel.permissionsFor(message.member).has("ADMINISTRATOR")) {
      return await message.channel.send(
        "You need `Administrator` permissions in order to run this command."
      );
    }
    statcord.postCommand("remove", message.author.id);
    //check if number and is in bounds
    axios
      .get(process.env.storage_service + guild)
      .then(async function(response) {
        let before = response.data;
        let keys = Object.keys(response.data);
        if (args[1] > keys.length - 1 || args[1] < 0) {
          return await message.channel.send("Trigger index out of bounds.");
        }
        let remover = keys[args[1]];
        delete before[remover];
        pushNewTriggerList(message, before, true);
      })
      .catch(async function(error) {
        return console.log(
          "Error retrieving trigger list. Cannot remove trigger.  \n" + error
        );
      });
  }
});

if (enabled) {
  bot.on("message", async message => {
    let guild = message.guild.id;
    if (message.author.bot) return;
    //do not look for triggers if message contains bot prefix
    if (message.content.substring(0, 1) == config.prefix) return;
    axios
      .get(process.env.storage_service + guild)
      .then(async function(response) {
        //for every trigger
        for (i = 0; i < Object.keys(response.data).length; i++) {
          let trigger = Object.keys(response.data)[i];
          //if the message includes the trigger
          if (message.content.toLowerCase().includes(trigger.toLowerCase())) {
            return await message.channel.send(response.data[trigger]);
          }
        }
      })
      .catch(async function(error) {
        //console.log("Error retrieving trigger list. Cannot search. \n" + error);
      });
  });
}

bot.on("message", async message => {
  if (message.author.bot) return;
  let messageBody = message.content.split(" ");
  let command = messageBody[0];

  if (command == `${config.prefix}ping`) {
    statcord.postCommand("ping", message.author.id);
    const m = await message.channel.send("Pong 🏓");
    m.edit(
      `Pong 🏓\nBot latency is ${m.createdTimestamp -
        message.createdTimestamp}ms. Discord API Latency is ${Math.round(
        bot.ping
      )}ms`
    );
  }
});