const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports.voiceStateUpdate = async (oldState, newState, channelVoiceStatusID, guild) => {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    const channelVoiceStatus = guild.channels.cache.get(channelVoiceStatusID);
    if (!channelVoiceStatus) return;

    const user = newState.member?.user || oldState.member?.user;
    if (!user) return;
    const now = new Date();
    const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Organização";

    const createEmbed = (description, color) => {
        return new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setDescription(description)
            .addFields(
                { name: 'ID do Usuário', value: `${user.id}`, inline: true },
                { name: 'Horário', value: `<t:${Math.floor(now / 1000)}:T>`, inline: true }
            )
            .setFooter({ text: `${orgNome} - Monitoramento de Voz` })
            .setTimestamp();
    };

    // Usuário entrou em um canal
    if (!oldChannel && newChannel) {
        const embed = createEmbed(
            `🔊 **<@${user.id}>** entrou no canal de voz **${newChannel.name}**.`,
            config.cores.vozEntrou
        );
        channelVoiceStatus.send({ embeds: [embed] });
    }

    // Usuário saiu de um canal
    if (oldChannel && !newChannel) {
        const embed = createEmbed(
            `🔇 **<@${user.id}>** saiu do canal de voz **${oldChannel.name}**.`,
            config.cores.vozSaiu
        );
        channelVoiceStatus.send({ embeds: [embed] });
    }

    // Usuário trocou de canal
    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
        const embed = createEmbed(
            `🔄 **<@${user.id}>** mudou do canal **${oldChannel.name}** para **${newChannel.name}**.`,
            config.cores.vozMudou
        );
        channelVoiceStatus.send({ embeds: [embed] });
    }
};
