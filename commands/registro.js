const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("registro")
    .setDescription("Publica o painel de registro para novos membros.")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal onde o painel será enviado (padrão: canal atual)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const targetChannel = interaction.options.getChannel("canal") || interaction.channel;
    const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Comunidade";

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle(`📝 Registro de Membro - ${orgNome}`)
      .setDescription(
        `Seja muito bem-vindo(a) ao servidor **${orgNome}**! 🎉\n\n` +
        `Para liberar seu acesso completo e receber a sua tag inicial, realize o seu registro rápido.\n\n` +
        `👉 **Clique no botão abaixo** e informe o seu nome / apelido.\n` +
        `Após o envio, a moderação avaliará a sua solicitação.`
      )
      .setThumbnail(config.organizacao.logoUrl || interaction.guild.iconURL() || undefined)
      .setFooter({ text: `${orgNome} - Sistema de Registro`, iconURL: config.organizacao.logoUrl || undefined })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("abrir_modal_registro")
        .setLabel("📋 Fazer Registro")
        .setStyle(ButtonStyle.Success)
    );

    await targetChannel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: `✅ Painel de registro publicado com sucesso em <#${targetChannel.id}>!`,
      flags: 64,
    });
  },
};
