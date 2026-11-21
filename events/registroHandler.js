const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const config = require("../config");
const { checkCommandPermission } = require("../utils/permissionCheck");

/**
 * Gerencia todas as etapas do sistema de registro:
 * - Abertura do Modal de Nome
 * - Envio da solicitação para a moderação
 * - Aprovação (remove [NVT], remove tag iniciante, adiciona tag de membro e define nome escolhido)
 * - Recusa da solicitação
 */
async function handleRegistro(interaction, client) {
  const customId = interaction.customId || "";
  const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Comunidade";

  // 1. Abertura do Modal ao clicar no botão
  if (interaction.isButton() && customId === "abrir_modal_registro") {
    const modal = new ModalBuilder()
      .setCustomId("modal_registro_submit")
      .setTitle(`Registro - ${orgNome}`.slice(0, 45));

    const nomeInput = new TextInputBuilder()
      .setCustomId("input_nome_registro")
      .setLabel("Qual é o seu Nome / Como quer ser chamado?")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex: Carlos")
      .setRequired(true)
      .setMaxLength(25);

    const row = new ActionRowBuilder().addComponents(nomeInput);
    modal.addComponents(row);

    return interaction.showModal(modal);
  }

  // 2. Submissão do Modal pelo Usuário
  if (interaction.isModalSubmit() && customId === "modal_registro_submit") {
    await interaction.deferReply({ flags: 64 });

    const nome = interaction.fields.getTextInputValue("input_nome_registro").trim();
    const guild = interaction.guild;

    // Canal de aprovação (usa CHANNEL_REGISTRO ou fallback para canal atual)
    const targetChannelId = config.canais.registro || interaction.channelId;
    const approvalChannel = guild.channels.cache.get(targetChannelId) ||
      (await guild.channels.fetch(targetChannelId).catch(() => null));

    if (!approvalChannel) {
      return interaction.editReply({
        content: "❌ Canal de aprovação de registro não encontrado.",
      });
    }

    const embedSolicitacao = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle(`📋 Nova Solicitação de Registro - ${orgNome}`)
      .setDescription(`Um novo membro preencheu a ficha e aguarda aprovação da moderação:`)
      .addFields(
        { name: "👤 Membro", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
        { name: "📝 Nome Escolhido", value: `**${nome}**`, inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `ID: ${interaction.user.id} • ${orgNome}` })
      .setTimestamp();

    const rowBotoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_registro_${interaction.user.id}_${encodeURIComponent(nome)}`)
        .setLabel("✅ Aceitar")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`recusar_registro_${interaction.user.id}`)
        .setLabel("❌ Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    await approvalChannel.send({ embeds: [embedSolicitacao], components: [rowBotoes] });

    return interaction.editReply({
      content: "✅ Seu formulário de registro foi enviado com sucesso! Aguarde a aprovação da moderação.",
    });
  }

  // 3. Moderação clica em Aceitar
  if (interaction.isButton() && customId.startsWith("aprovar_registro_")) {
    const isStaff = await checkCommandPermission(interaction);
    if (!isStaff) {
      return interaction.reply({
        content: "❌ Apenas membros da moderação podem aprovar registros.",
        flags: 64,
      });
    }

    await interaction.deferUpdate();

    const parts = customId.split("_");
    const targetUserId = parts[2];
    const encodedNome = parts.slice(3).join("_");
    const nome = decodeURIComponent(encodedNome || "");

    const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
    if (!member) {
      return interaction.followUp({
        content: "❌ O membro não está mais no servidor.",
        flags: 64,
      });
    }

    // 1. Após a aprovação: remove o [NVT] e define SOMENTE o nome escolhido
    const novoApelido = (nome || member.user.displayName || member.user.username).trim().slice(0, 32);
    await member.setNickname(novoApelido).catch((err) => {
      console.warn(`Não foi possível alterar o nickname de ${member.user.tag}:`, err.message);
    });

    // 2. Remove a tag de iniciante / novato
    if (config.cargos?.novato && member.roles.cache.has(config.cargos.novato)) {
      await member.roles.remove(config.cargos.novato).catch((err) => {
        console.warn(`Não foi possível remover cargo de iniciante:`, err.message);
      });
    }

    // 3. Adiciona a tag de Membro oficial/aprovado
    if (config.cargos?.membro) {
      await member.roles.add(config.cargos.membro).catch((err) => {
        console.warn(`Não foi possível adicionar cargo de membro:`, err.message);
      });
    }

    const embedAprovado = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(config.cores.cargoSucesso)
      .setTitle(`✅ Registro Aprovado - ${orgNome}`)
      .addFields({
        name: "🛡️ Aprovado por:",
        value: `<@${interaction.user.id}> em <t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: false,
      });

    await interaction.editReply({ embeds: [embedAprovado], components: [] });

    // Notifica o membro na DM
    const dmEmbed = new EmbedBuilder()
      .setColor(config.cores.cargoSucesso)
      .setTitle(`🎉 Registro Aprovado - ${orgNome}`)
      .setDescription(
        `Olá **${novoApelido}**, o seu registro foi aprovado com sucesso!\n\n` +
        `• O seu apelido foi atualizado para: **\`${novoApelido}\`**\n` +
        `• Você recebeu a tag oficial de **Membro** do servidor e a tag de iniciante foi removida.\n\n` +
        `Aproveite a sua estadia!`
      )
      .setTimestamp();

    await member.send({ embeds: [dmEmbed] }).catch(() => {});
    return;
  }

  // 4. Moderação clica em Recusar
  if (interaction.isButton() && customId.startsWith("recusar_registro_")) {
    const isStaff = await checkCommandPermission(interaction);
    if (!isStaff) {
      return interaction.reply({
        content: "❌ Apenas membros da moderação podem recusar registros.",
        flags: 64,
      });
    }

    await interaction.deferUpdate();

    const targetUserId = customId.replace("recusar_registro_", "");
    const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    const embedRecusado = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(config.cores.exoneracao)
      .setTitle(`❌ Registro Recusado - ${orgNome}`)
      .addFields({
        name: "🛡️ Recusado por:",
        value: `<@${interaction.user.id}> em <t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: false,
      });

    await interaction.editReply({ embeds: [embedRecusado], components: [] });

    if (member) {
      const dmEmbed = new EmbedBuilder()
        .setColor(config.cores.exoneracao)
        .setTitle(`❌ Registro Não Aprovado - ${orgNome}`)
        .setDescription(
          `Olá, o seu registro no servidor **${orgNome}** não foi aprovado pela moderação.\n` +
          `Entre em contato com um moderador ou abra um ticket caso tenha dúvidas.`
        )
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    }
    return;
  }
}

module.exports = { handleRegistro };
