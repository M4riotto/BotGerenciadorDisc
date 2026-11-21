const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Verifica a latência do bot."),

  async execute(interaction, client) {
    await interaction.reply({ content: "Pinging...", flags: 64 });
    const sent = await interaction.fetchReply();
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong! Latência: \`${latency}ms\` | API: \`${Math.round(client.ws.ping)}ms\``);
  },
};
