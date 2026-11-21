const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("expulsar")
    .setDescription("Expulsa um membro do servidor.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Membro a ser expulso")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo da expulsão")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const usuario = interaction.options.getUser("usuario");
    let motivo = interaction.options.getString("motivo");

    if (!usuario) {
      return interaction.reply({ content: "❌ Usuário não especificado.", flags: 64 });
    }

    const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: "❌ Usuário não encontrado no servidor.", flags: 64 });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: "❌ O bot não possui permissão hierárquica suficiente para expulsar este membro.",
        flags: 64,
      });
    }

    const orgNome = config.organizacao.nome || "Comunidade";
    const nick = member.nickname || member.user.username;
    motivo = `${motivo} (por: ${interaction.user.tag})`;

    const expulsoEmbed = new EmbedBuilder()
      .setColor(config.cores.exoneracao || "#e74c3c")
      .setTitle(`🚫 Membro Expulso - ${orgNome}`)
      .setDescription(
        `**Membro:** ${member.user.username} (<@${usuario.id}>)\n` +
        `**ID:** \`${usuario.id}\`\n\n` +
        `**Motivo da Expulsão:**\n\`\`\`${motivo}\`\`\``
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({
        text: `Expulso por: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    // Canal de logs de saída/expulsão
    const logChannelId = config.canais.saida || config.canais.exonerados;
    const channel = client.channels.cache.get(logChannelId) ||
      (await client.channels.fetch(logChannelId).catch(() => null));

    if (channel) {
      await channel.send({
        content: `<@${usuario.id}>`,
        embeds: [expulsoEmbed],
      });
    }

    // Notificação na DM do usuário antes da expulsão
    const embedDm = new EmbedBuilder()
      .setColor(config.cores.exoneracao || "#e74c3c")
      .setTitle(`⚠️ Expulsão - ${orgNome}`)
      .setDescription(`Você foi expulso do servidor **${orgNome}**.`)
      .addFields(
        { name: "Motivo", value: motivo },
        { name: "Data", value: new Date().toLocaleDateString("pt-BR"), inline: true }
      )
      .setFooter({ text: "Caso acredite que foi um engano, entre em contato com a moderação." });

    await member.send({ embeds: [embedDm] }).catch(() => {});

    // Expulsa o membro do servidor
    await member.kick(`Expulso por ${interaction.user.tag}: ${motivo}`).catch((err) => {
      console.error("Erro ao expulsar membro:", err);
    });

    await interaction.reply({
      content: `✅ O membro <@${usuario.id}> foi expulso com sucesso do servidor.`,
      flags: 64,
    });
  },
};
