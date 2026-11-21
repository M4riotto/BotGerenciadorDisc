const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../config");

module.exports.ticketCreate = async (interaction, client) => {
  try {
    const guild = interaction.guild || (await client.guilds.fetch(interaction.guildId).catch(() => null));
    if (!guild) {
      console.error("❌ Guilda não encontrada ao processar ticket.");
      return;
    }

    const orgNome = config.organizacao.nome || "Comunidade";
    const ticketConfig = config.tickets || {};
    const cargoStaffId = ticketConfig.cargoAtendimento || config.permissoes?.cargoMinimo;

    // Busca o cargo mínimo de atendimento
    const staffRole = cargoStaffId ? await guild.roles.fetch(cargoStaffId).catch(() => null) : null;

    // =======================================================================
    // 1. ABERTURA DE TICKET PELO SELECT MENU
    // =======================================================================
    if (interaction.isStringSelectMenu() && interaction.customId === "abrir_ticket_select") {
      await interaction.deferReply({ flags: 64 });

      const ticketChoice = interaction.values[0];
      const opcoes = ticketConfig.opcoes || [];
      const opcaoEscolhida = opcoes.find((o) => o.id === ticketChoice) || {
        label: ticketChoice,
        description: "",
        emoji: "🎫",
      };

      // Sanitiza o nome do canal
      const sanitizedUsername = interaction.user.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10);
      const sanitizedType = ticketChoice
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 12);
      const ticketChannelName = `ticket-${sanitizedType}-${sanitizedUsername}`;

      // Configura permissões do canal de ticket
      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
          ],
        },
        {
          id: client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageChannels,
          ],
        },
      ];

      // Concede acesso a todos os cargos >= ao cargo configurado de atendimento
      if (staffRole) {
        guild.roles.cache
          .filter((role) => role.position >= staffRole.position)
          .forEach((role) => {
            permissionOverwrites.push({
              id: role.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
              ],
            });
          });
      }

      // Validação da categoria
      const categoryId = ticketConfig.categoriaId || config.canais.categoryId;
      let parentCategory = null;
      if (categoryId) {
        const cat = guild.channels.cache.get(categoryId);
        if (cat && cat.type === ChannelType.GuildCategory) {
          parentCategory = cat.id;
        }
      }

      if (!parentCategory) {
        const fallbackCat = guild.channels.cache.find(
          (c) =>
            c.type === ChannelType.GuildCategory &&
            (c.name.toLowerCase().includes("ticket") || c.name.toLowerCase().includes("atendimento"))
        );
        if (fallbackCat) parentCategory = fallbackCat.id;
      }

      const ticketChannel = await guild.channels.create({
        name: ticketChannelName,
        type: ChannelType.GuildText,
        parent: parentCategory || undefined,
        permissionOverwrites,
        topic: interaction.user.id,
      });

      const userEmbed = new EmbedBuilder()
        .setTitle(`🎟️ Ticket Criado - ${orgNome}`)
        .setDescription(`O seu canal de ticket foi criado com sucesso: <#${ticketChannel.id}>`)
        .setColor(config.cores.padrao);

      const rowLink = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Ir para o Ticket")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guild.id}/${ticketChannel.id}`)
      );

      await interaction.editReply({ embeds: [userEmbed], components: [rowLink] });

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`Atendimento: ${opcaoEscolhida.emoji ? opcaoEscolhida.emoji + " " : ""}${opcaoEscolhida.label}`)
        .setDescription(
          `Olá <@${interaction.user.id}>, este é o seu atendimento privado para **${opcaoEscolhida.label}**.\n` +
          `Descreva com detalhes a sua solicitação e aguarde um moderador responder.\n\n` +
          `🛡️ **Equipe responsável:** ${staffRole ? `<@&${staffRole.id}> e superiores` : "Moderação"}\n` +
          `⏱️ **Tempo estimado:** Em breve nossa equipe responderá ao seu chamado.`
        )
        .setColor(config.cores.padrao)
        .setThumbnail(interaction.user.displayAvatarURL());

      const ticketActionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("finalizar_ticket")
          .setLabel("🔒 Finalizar Ticket")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("notificar_membro")
          .setLabel("🔔 Notificar Membro")
          .setStyle(ButtonStyle.Secondary)
      );

      await ticketChannel.send({
        content: `👋 Bem-vindo(a) <@${interaction.user.id}>! A equipe de atendimento foi notificada.`,
        embeds: [ticketEmbed],
        components: [ticketActionRow],
      });
      return;
    }

    // =======================================================================
    // 2. BOTÃO: FINALIZAR TICKET
    // =======================================================================
    if (interaction.customId === "finalizar_ticket") {
      const ticketChannel = interaction.channel;
      const member = await guild.members.fetch(interaction.user.id);

      const isStaff =
        (staffRole && (member.roles.cache.has(staffRole.id) || member.roles.highest.position >= staffRole.position)) ||
        member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
        member.permissions.has(PermissionsBitField.Flags.Administrator) ||
        member.id === guild.ownerId;

      if (!isStaff) {
        return interaction.reply({
          content: "❌ Apenas membros da equipe de atendimento/moderação podem finalizar este ticket.",
          flags: 64,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("modal_finalizar_ticket")
        .setTitle("Finalizar Atendimento");

      const mensagemInput = new TextInputBuilder()
        .setCustomId("mensagem_finalizacao")
        .setLabel("Motivo da finalização do ticket:")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Descreva o desfecho do atendimento...")
        .setRequired(true);

      const modalRow = new ActionRowBuilder().addComponents(mensagemInput);
      modal.addComponents(modalRow);

      return interaction.showModal(modal);
    }

    // =======================================================================
    // 3. MODAL: CONFIRMAR FINALIZAÇÃO DO TICKET
    // =======================================================================
    if (interaction.customId === "modal_finalizar_ticket") {
      await interaction.deferReply({ flags: 64 });

      const mensagem = interaction.fields.getTextInputValue("mensagem_finalizacao");
      const ticketChannel = interaction.channel;
      const creatorId = ticketChannel.topic;

      await ticketChannel.send(
        `🔒 **Ticket Finalizado por <@${interaction.user.id}>**\n` +
        `📝 **Motivo:**\n\`\`\`${mensagem}\`\`\`\n` +
        `⚠️ *Este canal será excluído em alguns segundos...*`
      );

      // Envia notificação por DM ao criador se disponível
      if (creatorId) {
        try {
          const creator = await guild.members.fetch(creatorId).catch(() => null);
          if (creator) {
            const dmEmbed = new EmbedBuilder()
              .setTitle(`Atendimento Finalizado - ${orgNome}`)
              .setDescription(
                `O seu ticket no servidor foi finalizado por <@${interaction.user.id}>.\n\n` +
                `**Mensagem de Conclusão:**\n\`\`\`${mensagem}\`\`\``
              )
              .setColor(config.cores.ticketFinalizado)
              .setTimestamp();

            await creator.send({ embeds: [dmEmbed] }).catch(() => {});
          }
        } catch (dmErr) {
          console.warn("Não foi possível enviar DM ao autor do ticket.");
        }
      }

      await interaction.editReply({
        content: "✅ O ticket foi concluído com sucesso e o canal será deletado em instantes.",
      });

      setTimeout(async () => {
        await ticketChannel.delete("Ticket finalizado").catch(() => {});
      }, 5000);
      return;
    }

    // =======================================================================
    // 4. BOTÃO: NOTIFICAR MEMBRO POR DM
    // =======================================================================
    if (interaction.customId === "notificar_membro") {
      await interaction.deferReply({ flags: 64 });
      const ticketChannel = interaction.channel;
      const creatorId = ticketChannel.topic;

      if (!creatorId) {
        return interaction.editReply({
          content: "❌ ID do criador deste ticket não foi localizado.",
        });
      }

      const memberToNotify = await guild.members.fetch(creatorId).catch(() => null);
      if (!memberToNotify) {
        return interaction.editReply({
          content: "❌ Membro autor do ticket não está mais no servidor.",
        });
      }

      const embedNotify = new EmbedBuilder()
        .setColor(config.cores.padrao)
        .setTitle(`📩 Atualização no seu Ticket - ${orgNome}`)
        .setDescription(
          `Olá <@${creatorId}>, a equipe respondeu ao seu ticket!\n\n` +
          `👉 [Clique aqui para acessar o canal do ticket](${ticketChannel.url})`
        )
        .setTimestamp();

      const dmSent = await memberToNotify.send({ embeds: [embedNotify] }).catch(() => null);

      if (!dmSent) {
        return interaction.editReply({
          content: `⚠️ Não foi possível enviar mensagem privada para <@${creatorId}> (DMs bloqueadas). Mencione-o diretamente no canal.`,
        });
      }

      return interaction.editReply({
        content: `✅ Notificação enviada com sucesso no privado de <@${creatorId}>!`,
      });
    }
  } catch (error) {
    console.error("❌ Erro no módulo de tickets:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: "❌ Houve um erro ao processar esta ação do ticket.",
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: "❌ Houve um erro inesperado no ticket.",
        flags: 64,
      }).catch(() => {});
    }
  }
};
