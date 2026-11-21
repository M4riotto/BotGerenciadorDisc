const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message) {
    if (!message || message.partial) return;

    try {
      const channelMsgDelete = config.canais.msgDelete;
      const logChannel = message.guild?.channels.cache.get(channelMsgDelete);
      if (!logChannel) return;

      const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Organização";

      const embed = new EmbedBuilder()
        .setColor(config.cores.logMensagemDeletada)
        .setTitle(`🗑️ Mensagem Deletada - ${orgNome}`)
        .addFields(
          {
            name: "Autor",
            value: message.author ? `<@${message.author.id}> (${message.author.tag})` : "Desconhecido",
            inline: true,
          },
          {
            name: "Canal",
            value: message.channel ? `<#${message.channel.id}>` : "Desconhecido",
            inline: true,
          },
          {
            name: "Conteúdo",
            value: message.content && message.content.trim()
              ? `\`\`\`${message.content.substring(0, 1000)}\`\`\``
              : "Sem conteúdo textual ou anexo",
            inline: false,
          }
        )
        .setFooter({ text: `${orgNome} - Auditoria`, iconURL: config.organizacao.logoUrl || undefined })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Erro ao registrar mensagem deletada:", error);
    }
  },
};
