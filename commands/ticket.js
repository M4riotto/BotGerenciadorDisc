const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eticket")
    .setDescription("Envia o painel oficial de abertura de tickets de atendimento configurado no servidor.")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal onde o painel será enviado (padrão: canal atual)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  async execute(interaction, client) {
    // Resposta imediata para evitar expiração de 3 segundos (DiscordAPIError 10062)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const targetChannel = interaction.options.getChannel("canal") || interaction.channel;
    const orgNome = config.organizacao.nome || "Servidor";
    const ticketConfig = config.tickets || {};
    const opcoes = ticketConfig.opcoes || [];

    if (opcoes.length === 0) {
      return interaction.editReply({
        content: "❌ Nenhuma opção de ticket configurada no momento. Use `/configuracao` para adicionar tipos de tickets.",
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("abrir_ticket_select")
      .setPlaceholder("📩 Selecione o assunto do seu atendimento...")
      .addOptions(
        opcoes.map((op) => ({
          label: op.label.slice(0, 100),
          description: (op.description || "").slice(0, 100),
          value: op.id,
          emoji: op.emoji || undefined,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle(`🎟️ ${ticketConfig.titulo || "Central de Atendimento"} - ${orgNome}`)
      .setDescription(
        `${ticketConfig.descricao || "Selecione o tipo de atendimento abaixo para abrir seu ticket privado."}\n\n` +
        `> ⏱️ **Tempo de resposta estimado:** Até 24 horas após a abertura.\n` +
        `> ⚠️ **Atenção:** Tickets abertos sem motivo ou para brincadeiras resultarão em punição.\n` +
        `> 📸 **Denúncias:** Devem conter prints ou links claros demonstrando a infração.\n\n` +
        `*Selecione abaixo o assunto correspondente ao seu atendimento:*`
      )
      .setThumbnail(config.organizacao.logoUrl || interaction.guild.iconURL() || undefined)
      .setFooter({
        text: `${orgNome} • Atendimento`,
        iconURL: config.organizacao.logoUrl || undefined,
      })
      .setTimestamp();

    await targetChannel.send({
      embeds: [embed],
      components: [row],
    });

    // Salva o canal onde o painel foi enviado
    config.updateConfigField("tickets", "canalPainel", targetChannel.id);

    await interaction.editReply({
      content: `✅ Painel oficial de tickets enviado com sucesso em <#${targetChannel.id}>!`,
    });
  },
};
