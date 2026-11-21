const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { buildConfigDashboard } = require("../events/configHandler");
const { checkCommandPermission } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("configuracao")
    .setDescription("Painel de configuração interativo do servidor e do bot.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    // Permissão: apenas administradores, dono do servidor ou cargos >= cargoMinimo
    const isStaff = await checkCommandPermission(interaction);
    if (!isStaff) {
      return interaction.reply({
        content: "❌ Apenas administradores do servidor podem acessar o painel de configurações.",
        flags: 64,
      });
    }

    const dashboard = buildConfigDashboard(interaction.guild);
    await interaction.reply({
      embeds: [dashboard.embed],
      components: dashboard.components,
      flags: 64,
    });
  },
};
