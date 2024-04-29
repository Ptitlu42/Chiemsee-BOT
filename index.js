const { Client, GatewayIntentBits, InteractionType } = require("discord.js");
const config = require("./config.json");
const { configClean, configList } = require("./configClean");
const { cleanChannels } = require("./cleanChannels");
const cron = require("node-cron");
const { addConfiguration, getConfigurations } = require("./database.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
  ],
});

client.once("ready", () => {
  console.log("Bot ready !");
});

cron.schedule("* * * * *", async () => {
  client.guilds.cache.forEach(async (guild) => {
    try {
      const configurations = await getConfigurations(guild.id);
      for (const config of configurations) {
        const channelIds = Array.isArray(config.channel_ids)
          ? config.channel_ids
          : JSON.parse(config.channel_ids);
        await cleanChannels(client, channelIds, config.duration);
      }
    } catch (error) {
      console.error(
        "❌Erreur lors de la récupération des configurations:",
        error
      );
    }
  });
});

client.on("interactionCreate", async (interaction) => {
  if (
    interaction.type === InteractionType.ApplicationCommand &&
    interaction.commandName === "config-clean"
  ) {
    await configClean(interaction);
  } else if (interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
    await configClean(interaction);
  }

  if (
    interaction.type === InteractionType.ApplicationCommand &&
    interaction.commandName === "config-list"
  ) {
    await configList(interaction);
  }
});

client.login(config.token);
