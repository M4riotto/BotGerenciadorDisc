const { SlashCommandBuilder } = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("apagar_mensagens")
    .setDescription("Apaga as últimas mensagens do canal.")
    .addIntegerOption((option) =>
      option
        .setName("quantidade")
        .setDescription("Quantidade de mensagens a apagar (padrão: 100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const quantidade = interaction.options.getInteger("quantidade") || 100;

    try {
      const fetched = await interaction.channel.messages.fetch({ limit: quantidade });
      await interaction.channel.bulkDelete(fetched, true);

      await interaction.reply({
        content: `🧹 **${fetched.size}** mensagens apagadas com sucesso!`,
        flags: 64,
      });
    } catch (err) {
      console.error("Erro ao apagar mensagens:", err);
      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Erro ao tentar apagar as mensagens (mensagens com mais de 14 dias não podem ser apagadas em massa).",
          flags: 64,
        });
      }
    }
  },
};
