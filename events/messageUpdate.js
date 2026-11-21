const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports.messageUpdate = async (oldMessage, newMessage, channelMsgDelete) => {
  if (oldMessage.content === newMessage.content) return;

  const MAX_FIELD_VALUE_LENGTH = 1024;
  const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Organização";

  const oldContent = (oldMessage.content?.trim() || 'Sem conteúdo').slice(0, MAX_FIELD_VALUE_LENGTH);
  const newContent = (newMessage.content?.trim() || 'Sem conteúdo').slice(0, MAX_FIELD_VALUE_LENGTH);

  const embed = new EmbedBuilder()
    .setColor(config.cores.logMensagemEditada)
    .setTitle(`✏️ Mensagem Editada - ${orgNome}`)
    .addFields(
      { name: 'Autor', value: `<@${newMessage.author?.id || 'Desconhecido'}>`, inline: true }, 
      { name: 'Canal', value: `<#${newMessage.channel?.id || 'Desconhecido'}>`, inline: true }, 
      { name: 'Mensagem Antiga', value: `\`\`\`${oldContent}\`\`\``, inline: false },
      { name: 'Mensagem Nova', value: `\`\`\`${newContent}\`\`\``, inline: false }
    )
    .setFooter({ text: `${orgNome} - Auditoria`, iconURL: config.organizacao.logoUrl || undefined })
    .setTimestamp();

  const logChannel = newMessage.guild?.channels?.cache?.get(channelMsgDelete);
  if (logChannel) {
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao enviar mensagem de log:', error);
    }
  } else {
    console.warn('Canal de log não encontrado.');
  }
};
