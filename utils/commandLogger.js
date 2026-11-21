const { EmbedBuilder } = require("discord.js");
const config = require("../config");

/**
 * Registra a execução de um Slash Command no canal de logs/auditoria configurado
 */
async function logCommandExecution(interaction, client) {
  try {
    const logChannelId = config.canais.logsComandos || config.canais.security;
    if (!logChannelId) return;

    const channel = client.channels.cache.get(logChannelId) ||
      await client.channels.fetch(logChannelId).catch(() => null);

    if (!channel) return;

    // Formata os parâmetros/opções passados no comando
    let optionsText = "";
    if (interaction.options && interaction.options.data && interaction.options.data.length > 0) {
      optionsText = interaction.options.data.map((opt) => {
        let val = opt.value;
        if (opt.user) val = `<@${opt.user.id}> (${opt.user.tag})`;
        else if (opt.role) val = `<@&${opt.role.id}> (${opt.role.name})`;
        else if (opt.channel) val = `<#${opt.channel.id}> (${opt.channel.name})`;
        return `• **${opt.name}:** ${val}`;
      }).join("\n");
    } else {
      optionsText = "*Nenhum argumento adicional*";
    }

    const orgNome = config.organizacao.nome || "Comunidade";
    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao || "#3498db")
      .setTitle(`📜 Comando Executado: /${interaction.commandName}`)
      .setDescription(
        `**Moderador/Autor:** ${interaction.user.tag} (<@${interaction.user.id}>)\n` +
        `**Canal:** <#${interaction.channelId}>\n` +
        `**Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
        `**Parâmetros Utilizados:**\n${optionsText}`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `${orgNome} • Auditoria de Comandos`,
        iconURL: config.organizacao.logoUrl || undefined,
      })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.warn("Erro ao registrar log de comando:", err.message);
  }
}

module.exports = { logCommandExecution };
