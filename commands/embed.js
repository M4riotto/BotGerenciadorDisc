const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

// Armazena as sessões ativas de criação de embed por ID do usuário
const embedSessions = new Map();

/**
 * Valida com segurança uma URL para evitar CombinedPropertyError no Discord.js
 */
function safeUrl(url) {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return undefined;
  return trimmed;
}

/**
 * Converte com segurança cor HEX para número inteiro ou usa a cor padrão
 */
function safeColor(hex) {
  if (!hex || typeof hex !== "string") return config.cores.padrao || 0x3498db;
  const clean = hex.trim().replace("#", "");
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return parseInt(clean, 16);
  }
  return config.cores.padrao || 0x3498db;
}

/**
 * Gera o Embed de Pré-Visualização a partir dos dados da sessão
 */
function buildPreviewEmbed(session) {
  const embed = new EmbedBuilder()
    .setTitle((session.title || "Título do Embed").slice(0, 256))
    .setDescription(
      (
        session.description ||
        "Esta é uma pré-visualização do seu embed. Clique em ✏️ **Editar Conteúdo** para personalizar o texto, a cor e a imagem!"
      ).slice(0, 4096)
    )
    .setColor(safeColor(session.color))
    .setTimestamp();

  if (session.footer) {
    const icon = safeUrl(config.organizacao.logoUrl);
    embed.setFooter({
      text: session.footer.slice(0, 2048),
      ...(icon ? { iconURL: icon } : {}),
    });
  }

  const validImg = safeUrl(session.image);
  if (validImg) {
    embed.setImage(validImg);
  }

  return embed;
}

/**
 * Constrói os botões de ação para a mensagem de pré-visualização
 */
function buildActionRows(userId) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`embed_btn_editar_${userId}`)
      .setLabel("✏️ Editar Conteúdo")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`embed_btn_canal_${userId}`)
      .setLabel("📢 Escolher Canal")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`embed_btn_enviar_${userId}`)
      .setLabel("🚀 Publicar Embed")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`embed_btn_cancelar_${userId}`)
      .setLabel("❌ Cancelar")
      .setStyle(ButtonStyle.Danger)
  );

  return [row1];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Criador visual de embeds interativo com pré-visualização em tempo real.")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal de destino onde o embed será publicado (padrão: canal atual)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const userId = interaction.user.id;
    const targetChannel = interaction.options.getChannel("canal") || interaction.channel;

    // Inicializa a sessão do usuário
    const session = {
      targetChannelId: targetChannel.id,
      title: "Título do seu Embed",
      description: "Escreva aqui a mensagem do seu embed. Suporta markdown, quebras de linha e emojis!",
      color: config.cores.padrao || "#3498db",
      image: "",
      footer: config.organizacao.nome || "Comunidade Discord",
    };

    embedSessions.set(userId, session);

    const embed = buildPreviewEmbed(session);
    const components = buildActionRows(userId);

    await interaction.reply({
      content: `👁️ **Pré-visualização do Embed** (Canal de destino: <#${targetChannel.id}>)\n*Veja como o embed vai ficar antes de postar:*`,
      embeds: [embed],
      components,
      flags: 64,
    });
  },

  /**
   * Manipula botões, seletores e modais do construtor de embed
   */
  async handleEmbedComponent(interaction, client) {
    const customId = interaction.customId || "";
    const userId = interaction.user.id;

    // 1. Abrir Modal de Edição de Conteúdo
    if (customId === `embed_btn_editar_${userId}`) {
      const session = embedSessions.get(userId) || {
        title: "",
        description: "",
        color: config.cores.padrao || "#3498db",
        image: "",
        footer: config.organizacao.nome || "",
      };

      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_editar_${userId}`)
        .setTitle("Editar Conteúdo do Embed");

      const inputTitle = new TextInputBuilder()
        .setCustomId("embed_in_title")
        .setLabel("Título do Embed:")
        .setStyle(TextInputStyle.Short)
        .setValue(session.title || "")
        .setPlaceholder("Ex: Anúncio Importante")
        .setRequired(false)
        .setMaxLength(250);

      const inputDesc = new TextInputBuilder()
        .setCustomId("embed_in_desc")
        .setLabel("Descrição / Mensagem Principal:")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(session.description || "")
        .setPlaceholder("Digite sua mensagem aqui (suporta formatação do Discord)...")
        .setRequired(true)
        .setMaxLength(3900);

      const inputColor = new TextInputBuilder()
        .setCustomId("embed_in_color")
        .setLabel("Cor HEX (ex: #3498db ou #00FF7F):")
        .setStyle(TextInputStyle.Short)
        .setValue(typeof session.color === "string" ? session.color : "#3498db")
        .setPlaceholder("#3498db")
        .setRequired(false)
        .setMaxLength(7);

      const inputImage = new TextInputBuilder()
        .setCustomId("embed_in_image")
        .setLabel("URL da Imagem / Banner (Opcional):")
        .setStyle(TextInputStyle.Short)
        .setValue(session.image || "")
        .setPlaceholder("https://exemplo.com/banner.png")
        .setRequired(false);

      const inputFooter = new TextInputBuilder()
        .setCustomId("embed_in_footer")
        .setLabel("Rodapé / Footer (Opcional):")
        .setStyle(TextInputStyle.Short)
        .setValue(session.footer || "")
        .setPlaceholder("Ex: Atenciosamente, Equipe")
        .setRequired(false)
        .setMaxLength(200);

      modal.addComponents(
        new ActionRowBuilder().addComponents(inputTitle),
        new ActionRowBuilder().addComponents(inputDesc),
        new ActionRowBuilder().addComponents(inputColor),
        new ActionRowBuilder().addComponents(inputImage),
        new ActionRowBuilder().addComponents(inputFooter)
      );

      return interaction.showModal(modal);
    }

    // 2. Submissão do Modal com os novos dados
    if (interaction.isModalSubmit() && customId === `embed_modal_editar_${userId}`) {
      const session = embedSessions.get(userId) || {
        targetChannelId: interaction.channelId,
      };

      session.title = interaction.fields.getTextInputValue("embed_in_title").trim();
      session.description = interaction.fields.getTextInputValue("embed_in_desc").trim();
      session.color = interaction.fields.getTextInputValue("embed_in_color").trim() || config.cores.padrao;
      session.image = interaction.fields.getTextInputValue("embed_in_image").trim();
      session.footer = interaction.fields.getTextInputValue("embed_in_footer").trim();

      embedSessions.set(userId, session);

      const embed = buildPreviewEmbed(session);
      const components = buildActionRows(userId);

      return interaction.update({
        content: `👁️ **Pré-visualização Atualizada!** (Canal de destino: <#${session.targetChannelId}>)\n*Veja como o embed ficou após a edição:*`,
        embeds: [embed],
        components,
      });
    }

    // 3. Escolher outro Canal de destino
    if (customId === `embed_btn_canal_${userId}`) {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId(`embed_select_canal_${userId}`)
        .setPlaceholder("Escolha o canal onde o embed será postado...")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

      const rowSelect = new ActionRowBuilder().addComponents(channelSelect);
      const rowBack = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`embed_btn_voltar_${userId}`)
          .setLabel("⬅️ Voltar à Pré-visualização")
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({
        content: "📢 **Selecione o canal de destino no menu abaixo:**",
        components: [rowSelect, rowBack],
      });
    }

    // 4. Aplicar canal selecionado
    if (interaction.isChannelSelectMenu() && customId === `embed_select_canal_${userId}`) {
      const session = embedSessions.get(userId) || {
        targetChannelId: interaction.channelId,
      };
      session.targetChannelId = interaction.values[0];
      embedSessions.set(userId, session);

      const embed = buildPreviewEmbed(session);
      const components = buildActionRows(userId);

      return interaction.update({
        content: `👁️ **Canal alterado com sucesso para <#${session.targetChannelId}>!**\n*Pré-visualização do Embed:*`,
        embeds: [embed],
        components,
      });
    }

    // 5. Voltar do seletor de canal para a pré-visualização
    if (customId === `embed_btn_voltar_${userId}`) {
      const session = embedSessions.get(userId) || {
        targetChannelId: interaction.channelId,
      };
      const embed = buildPreviewEmbed(session);
      const components = buildActionRows(userId);

      return interaction.update({
        content: `👁️ **Pré-visualização do Embed** (Canal de destino: <#${session.targetChannelId}>)\n*Veja como o embed vai ficar antes de postar:*`,
        embeds: [embed],
        components,
      });
    }

    // 6. Publicar Embed no canal escolhido
    if (customId === `embed_btn_enviar_${userId}`) {
      const session = embedSessions.get(userId);
      if (!session) {
        return interaction.reply({
          content: "❌ Sessão expirada. Execute o comando `/embed` novamente.",
          flags: 64,
        });
      }

      const guild = interaction.guild;
      const targetChannel = guild.channels.cache.get(session.targetChannelId) ||
        (await guild.channels.fetch(session.targetChannelId).catch(() => null));

      if (!targetChannel) {
        return interaction.reply({
          content: "❌ Canal de destino não encontrado.",
          flags: 64,
        });
      }

      const finalEmbed = buildPreviewEmbed(session);
      await targetChannel.send({ embeds: [finalEmbed] });

      embedSessions.delete(userId);

      return interaction.update({
        content: `🎉 **Embed publicado com sucesso em <#${targetChannel.id}>!**`,
        embeds: [],
        components: [],
      });
    }

    // 7. Cancelar criação
    if (customId === `embed_btn_cancelar_${userId}`) {
      embedSessions.delete(userId);
      return interaction.update({
        content: "❌ Criação de embed cancelada.",
        embeds: [],
        components: [],
      });
    }
  },
};
