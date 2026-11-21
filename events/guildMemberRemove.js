const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member, client) {
    const channelSaida = config.canais.saida;
    const channelQD = config.canais.qd;
    const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Organização";

    try {
      console.log("Membro saiu:", member.id);
      const fetchedUser = await client.users.fetch(member.id).catch(() => member.user);

      const auditLogs = await member.guild.fetchAuditLogs({
        type: 20, // MEMBER_KICK
        limit: 1,
      }).catch(() => null);

      const kickLog = auditLogs ? auditLogs.entries.first() : null;
      let wasKicked = false;

      if (
        kickLog &&
        kickLog.target.id === member.id &&
        Date.now() - kickLog.createdTimestamp < 5000
      ) {
        wasKicked = true;
      }

      if (wasKicked) {
        const kickChannel = member.guild.channels.cache.get(channelSaida) ||
          (await member.guild.channels.fetch(channelSaida).catch(() => null));
        const kickEmbed = new EmbedBuilder()
          .setColor(config.cores.exoneracao)
          .setTitle(`🚫 Usuário Expulso - ${orgNome}`)
          .setDescription(
            `🔨 O usuário **${fetchedUser.tag}** foi expulso do servidor.`
          )
          .setThumbnail(fetchedUser.displayAvatarURL())
          .setFooter({
            text: `ID: ${fetchedUser.id} • ${orgNome}`,
            iconURL: config.organizacao.logoUrl || undefined,
          });

        if (kickChannel) {
          kickChannel.send({
            content: `<@${fetchedUser.id}>`,
            embeds: [kickEmbed],
          });
        }
      } else {
        const farewellChannel = member.guild.channels.cache.get(channelQD) ||
          (await member.guild.channels.fetch(channelQD).catch(() => null));
        const farewellEmbed = new EmbedBuilder()
          .setColor(config.cores.saida)
          .setTitle(`😢 Despedida - ${orgNome}`)
          .setDescription(
            `👋 O usuário **${fetchedUser.tag}** saiu do servidor.`
          )
          .setThumbnail(fetchedUser.displayAvatarURL())
          .setFooter({
            text: `ID: ${fetchedUser.id} • ${orgNome}`,
            iconURL: config.organizacao.logoUrl || undefined,
          });

        if (farewellChannel) {
          farewellChannel.send({
            content: `<@${fetchedUser.id}>`,
            embeds: [farewellEmbed],
          });
        }
      }
    } catch (error) {
      console.error("Erro no evento guildMemberRemove:", error);
    }
  },
};
