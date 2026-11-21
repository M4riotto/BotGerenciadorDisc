const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const sendEmbedDemonstrativo = async (client, channelId) => {
  try {
    const targetChannelId = channelId || config.canais.entrada;
    const channel = await client.channels
      .fetch(targetChannelId)
      .catch(() => null);
    if (!channel) {
      console.warn(
        `⚠️ [DEMO] Canal ${targetChannelId} não encontrado para envio de embed demonstrativo.`,
      );
      return;
    }

    const orgNome =
      config.organizacao.nome || process.env.ORG_NOME || "Comunidade";
    const logoUrl =
      config.organizacao.logoUrl || client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setColor(config.cores.lembrete)
      .setTitle(`📢 Comunicado Demonstrativo - ${orgNome}`)
      .setDescription(
        `> Este é um exemplo de mensagem automática programada.\n\n` +
          `🔹 Você pode personalizar este texto, os campos e a cor como desejar.\n` +
          `🔹 Para agendar envios periódicos, basta descomentar o bloco de **Cron** em \`events/ready.js\`.`,
      )
      .addFields(
        {
          name: "📌 Dica",
          value:
            "Configure os horários desejados utilizando a sintaxe do node-cron.",
          inline: true,
        },
        {
          name: "💬 Suporte",
          value: "Abra um ticket na central para tirar dúvidas com a equipe.",
          inline: true,
        },
      )
      .setThumbnail(logoUrl || null)
      .setFooter({
        text: `• Equipe de Administração - ${orgNome}`,
        iconURL: logoUrl || undefined,
      })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(
      `✅ [DEMO] Embed demonstrativo enviado no canal #${channel.name}`,
    );
  } catch (error) {
    console.error("❌ Erro ao enviar embed demonstrativo:", error);
  }
};

module.exports = { sendEmbedDemonstrativo };
