const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports.guildMemberUpdateName = async (
  oldMember,
  newMember,
  channelSecurity
) => {
  try {
    if (oldMember.nickname !== newMember.nickname) {
      const oldNickname = oldMember.nickname || oldMember.user.username; 
      const newNickname = newMember.nickname || newMember.user.username;
      const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Organização";

      const auditLogs = await newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberUpdate,
        limit: 1,
      });
      const auditEntry = auditLogs.entries.first();
      const executor = auditEntry ? auditEntry.executor : null; 
      const executorMember = executor ? await newMember.guild.members.fetch(executor.id).catch(() => null) : null;

      const embed = new EmbedBuilder()
        .setColor(config.cores.logAlteracaoNick) 
        .setTitle(`🔄 Nickname Alterado - ${orgNome}`)
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "👤 Usuário", value: `${newMember.user.tag}`, inline: true },
          {
            name: "📋 Antigo Nickname",
            value: `\`${oldNickname}\``,
            inline: true,
          },
          {
            name: "📝 Novo Nickname",
            value: `\`${newNickname}\``,
            inline: true,
          }
        )
        .setFooter({
          text: executorMember
            ? `Alterado por ${executorMember.user.tag} • ${orgNome}`
            : `Responsável desconhecido • ${orgNome}`,
          iconURL: executor
            ? executor.displayAvatarURL({ dynamic: true })
            : undefined,
        })
        .setTimestamp();

      const channel = newMember.guild.channels.cache.get(channelSecurity);
      if (channel) channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error(`Erro ao buscar informações do membro: ${error}`);
  }
};
