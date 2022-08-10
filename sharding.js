require("./server")();
require("dotenv").config();
const Discord = require("discord.js");
const config = require("./config");
const Statcord = require("statcord.js");

const manager = new Discord.ShardingManager('./index.js', { token: process.env.bot_token});

const statcord = new Statcord.ShardingClient({
    key: process.env.statcord,
    manager
});

manager.spawn();

manager.on("shardCreate", (shard) => {
    console.log(`Shard ${shard.id} launched`);
});

statcord.on("autopost-start", () => {
    console.log("Started statcord autopost.");
});

statcord.on("post", status => {
    if (!status) console.log("Posted to statcord.");
    else console.error(status);
});