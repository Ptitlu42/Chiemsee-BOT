const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");

const { saveConfiguration, addConfiguration } = require("./database");

const selectedChannelsMap = new Map();

const configClean = async (interaction) => {
  try {
    console.log(`💡Received interaction type: ${interaction.type}`);

    if (interaction.isCommand() && interaction.commandName === "config-clean-msg") {
      const channels = interaction.guild.channels.cache.filter((c) =>
        c.isTextBased()
      );
      if (channels.size === 0) {
        await interaction.reply({
          content: "Il n’y a pas de canaux textuels sur ce serveur.",
          ephemeral: true,
        });
        return;
      }

      const channelSelectMenu = new StringSelectMenuBuilder()
        .setCustomId("select-channel")
        .setPlaceholder("Sélectionnez les canaux")
        .setMinValues(1)
        .setMaxValues(Math.min(channels.size, 25));

      for (const channel of channels.values()) {
        channelSelectMenu.addOptions({
          label: channel.name,
          description: channel.topic || "No description",
          value: channel.id,
        });
      }

      const actionRow = new ActionRowBuilder().addComponents(channelSelectMenu);
      await interaction.reply({
        content: "Sélectionnez les canaux à configurer :",
        components: [actionRow],
        ephemeral: true,
      });
    } else if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "select-channel"
    ) {
      selectedChannelsMap.set(interaction.user.id, interaction.values);

      const modal = new ModalBuilder()
        .setCustomId("duration-modal")
        .setTitle("Suppression des messages de plus de:");

      const durationInput = new TextInputBuilder()
        .setCustomId("duration-input")
        .setLabel("Minutes")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Exemple: 60")
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(
        durationInput
      );
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    } else if (
      interaction.isModalSubmit() &&
      interaction.customId === "duration-modal"
    ) {
      const selectedChannels = selectedChannelsMap.get(interaction.user.id);

      if (!selectedChannels) {
        console.error("❌Selected channels are undefined.");
        await interaction.reply({
          content: "Aucun canal n’a été sélectionné.",
          ephemeral: true,
        });
        return;
      }

      const duration = interaction.fields.getTextInputValue("duration-input");
      const durationInMinutes = parseInt(duration);

      if (isNaN(durationInMinutes)) {
        console.error("❌Invalid duration input.");
        await interaction.reply({
          content: "La durée saisie est invalide.",
          ephemeral: true,
        });
        return;
      }

      await addConfiguration(
        interaction.guildId,
        selectedChannels,
        durationInMinutes
      );

      selectedChannelsMap.delete(interaction.user.id);

      await interaction.reply({
        content: `Les messages du/des salons: ${selectedChannels
          .map((channel) => `<#${channel}>`)
          .join(", ")} seront supprimés après ${duration} minutes.`,
      });
    }
  } catch (error) {
    console.error("❌Error during interaction handling:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content: "Une erreur est survenue lors de la gestion de l'interaction.",
        ephemeral: true,
      });
    } else if (!interaction.deferred) {
      await interaction.followUp({
        content: "Une erreur est survenue après votre interaction.",
        ephemeral: true,
      });
    }
  }
};

const { getConfigurations } = require("./database");

const configList = async (interaction) => {
  try {
    const configurations = await getConfigurations(interaction.guildId);
    let response = "⚙️ **Configurations de suppression des messages:**\n\n";

    configurations.forEach((config) => {
      config.channel_ids.forEach((channelId) => {
        response += `⏳**Canal:** <#${channelId}> - Durée: ${config.duration} minutes\n`;
      });
    });

    await interaction.reply({ content: response, ephemeral: true });
  } catch (error) {
    console.error("❌Error during config list:", error);
    await interaction.reply({
      content: "Erreur lors de la récupération des configurations.",
      ephemeral: true,
    });
  }
};

module.exports = { configClean, configList };
