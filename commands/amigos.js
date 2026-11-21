const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("amigos")
    .setDescription("Remove os cargos atuais do membro e atribui apenas a tag de Amigos (permanece no servidor).")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Membro a ser transferido para Amigos")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo da transferência")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const usuario = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Transferência de cargo para Amigos";

    if (!usuario) {
      return interaction.reply({ content: "❌ Usuário não especificado.", flags: 64 });
    }

    const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: "❌ Usuário não encontrado no servidor.", flags: 64 });
    }

    const guild = interaction.guild;
    const orgNome = config.organizacao.nome || "Comunidade";
    const tagAmigosId = config.cargos.amigos;

    if (!tagAmigosId) {
      return interaction.reply({
        content: "❌ O cargo de Amigos ainda não foi configurado. Use `/configuracao` para defini-lo.",
        flags: 64,
      });
    }

    const tagAmigosRole = await guild.roles.fetch(tagAmigosId).catch(() => null);
    if (!tagAmigosRole) {
      return interaction.reply({
        content: `❌ O cargo de Amigos (ID: \`${tagAmigosId}\`) não foi encontrado no servidor.`,
        flags: 64,
      });
    }

    // 1. Remove os cargos atuais do membro (exceto @everyone e cargos gerenciados por integrações)
    for (const [roleId, role] of member.roles.cache) {
      if (roleId !== guild.roles.everyone.id && roleId !== tagAmigosId && !role.managed) {
        await member.roles.remove(roleId).catch((err) => {
          console.warn(`Não foi possível remover cargo ${role.name}:`, err.message);
        });
      }
    }

    // 2. Adiciona exclusivamente o cargo de Amigos
    if (!member.roles.cache.has(tagAmigosId)) {
      await member.roles.add(tagAmigosId).catch((err) => {
        console.warn(`Não foi possível adicionar cargo de amigos:`, err.message);
      });
    }

    // 3. Atualiza o apelido para o prefixo [AMIGOS] mantendo o nome limpo
    const currentNickname = member.nickname || usuario.displayName || usuario.username;
    let cleanName = currentNickname;
    if (cleanName.startsWith("[")) {
      const closingIndex = cleanName.indexOf("]");
      if (closingIndex !== -1) {
        cleanName = cleanName.slice(closingIndex + 1).trim();
      }
    }
    const newNickname = `[AMIGOS] ${cleanName}`.slice(0, 32);
    if (member.nickname !== newNickname) {
      await member.setNickname(newNickname).catch((err) => {
        console.warn(`Não foi possível alterar apelido de ${usuario.tag}:`, err.message);
      });
    }

    // 4. Envia embed no canal de logs/anúncios
    const logChannelId = config.canais.exonerados || config.canais.promovidos;
    const logChannel = client.channels.cache.get(logChannelId) ||
      (await client.channels.fetch(logChannelId).catch(() => null));

    const amigosEmbed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle(`🤝 Transferência para Amigos - ${orgNome}`)
      .setDescription(
        `O membro <@${usuario.id}> agora possui o cargo de **Amigos**.\n\n` +
        `**Motivo:**\n\`\`\`${motivo}\`\`\``
      )
      .setThumbnail(usuario.displayAvatarURL())
      .setFooter({
        text: `Alterado por: ${interaction.user.tag} • ${orgNome}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (logChannel) {
      await logChannel.send({
        content: `<@${usuario.id}>`,
        embeds: [amigosEmbed],
      });
    }

    // 5. Mensagem amigável via DM para o usuário
    const embedDm = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle(`🤝 ${orgNome}`)
      .setDescription(
        `Olá **${cleanName}**, seus cargos foram atualizados e agora você possui o cargo de **Amigos** no servidor **${orgNome}**.\n\n` +
        `Você continua como membro da comunidade com acesso às salas de convivência e bate-papo!`
      )
      .addFields({ name: "Motivo informado", value: motivo })
      .setTimestamp();

    await member.send({ embeds: [embedDm] }).catch(() => {});

    await interaction.reply({
      content: `✅ O membro <@${usuario.id}> foi transferido para o cargo de **Amigos** com sucesso (apelido atualizado para \`${newNickname}\`).`,
      flags: 64,
    });
  },
};
