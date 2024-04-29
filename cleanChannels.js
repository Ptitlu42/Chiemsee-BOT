const { ChannelType } = require("discord.js");

async function cleanChannels(client, channelIds, durationInMinutes) {
  const durationInMilliseconds = durationInMinutes * 60 * 1000;
  const now = Date.now();

  for (const channelId of channelIds) {
    try {
      const channel = await client.channels.fetch(channelId);

      if (!channel || channel.type !== ChannelType.GuildText) {
        console.log(
          `❌The channel with ID ${channelId} was not found or is not a text channel.`
        );
        continue;
      }

      let messagesDeleted = 0;
      let fetchOptions = { limit: 100 };

      while (true) {
        const messages = await channel.messages.fetch(fetchOptions);
        const messagesToDelete = messages.filter(
          (m) => now - m.createdTimestamp > durationInMilliseconds
        );

        if (messagesToDelete.size === 0) {
          break;
        }

        const deletedMessages = await channel.bulkDelete(
          messagesToDelete,
          true
        );
        messagesDeleted += deletedMessages.size;

        if (deletedMessages.size < 100) {
          break;
        }
      }

      console.log(
        `🗑️Deleted ${messagesDeleted} messages from the channel: ${channel.name}.`
      );
    } catch (error) {
      console.error(`❌Error cleaning channel with ID ${channelId}:`, error);
    }
  }
}

module.exports = { cleanChannels };
