const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports.sugestaoMessage = async (message, channelSugestao) => {
  if (message.channel.id === channelSugestao && !message.author.bot) {
    const originalContent = message.content;
    const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Organização";

    const embed = new EmbedBuilder()
      .setColor(config.cores.sugestao) 
      .setTitle(`💡 Sugestão a Considerar - ${orgNome}`)
      .setDescription(`\`\`\`${originalContent}\`\`\``) 
      .setFooter({
        text: `Enviado por ${message.author.username} • ${orgNome}`,
        iconURL: config.organizacao.logoUrl || undefined,
      });

    try {
      await message.delete();

      const embedMessage = await message.channel.send({ embeds: [embed] });

      await embedMessage.react('✅');
      await embedMessage.react('❌');

      const filter = (reaction, user) => !user.bot;
      const collector = embedMessage.createReactionCollector({ filter });

      collector.on('collect', async (reaction, user) => {
        if (reaction.emoji.name !== '✅' && reaction.emoji.name !== '❌') {
          await reaction.users.remove(user.id);
        }
      });
    } catch (error) {
      console.error('Erro ao processar a mensagem:', error);
    }
  }
};
