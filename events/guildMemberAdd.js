const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    const channelEntrada = config.canais.entrada;

    // 1. Ao entrar no servidor: define o apelido com o prefixo [NVT] antes do nome
    try {
      const baseName = member.user.displayName || member.user.username;
      const initialNickname = `[NVT] ${baseName}`.slice(0, 32);
      await member.setNickname(initialNickname).catch((err) => {
        console.warn(`⚠️ [GUILD_MEMBER_ADD] Não foi possível definir apelido [NVT] para ${member.user.tag}:`, err.message);
      });
    } catch (nickErr) {
      console.warn("⚠️ [GUILD_MEMBER_ADD] Erro ao definir apelido de novato:", nickErr.message);
    }

    // 2. Ao entrar no servidor: atribui a tag de iniciante / novato automaticamente
    const cargoInicianteId = config.cargos?.novato;
    if (cargoInicianteId) {
      try {
        const role = await member.guild.roles.fetch(cargoInicianteId).catch(() => null);
        if (role) {
          await member.roles.add(role);
          console.log(`✅ [GUILD_MEMBER_ADD] Tag "${role.name}" (${role.id}) atribuída com sucesso a ${member.user.tag}`);
        } else {
          console.warn(`⚠️ [GUILD_MEMBER_ADD] Cargo de iniciante ID ${cargoInicianteId} não foi encontrado no servidor.`);
        }
      } catch (roleErr) {
        console.error(`❌ [GUILD_MEMBER_ADD] Erro ao adicionar tag de iniciante a ${member.user.tag}:`, roleErr.message);
      }
    }

    // 3. Envia mensagem de boas-vindas no canal de entrada
    const welcomeEmbed = new EmbedBuilder()
      .setColor(config.cores.boasVindas)
      .setTitle(`🎉 Bem-vindo(a) à ${config.organizacao.nome}!`)
      .setDescription(
        `🎊 Olá <@${member.user.id}>, seja muito bem-vindo(a) ao nosso servidor! 🎉\n\n` +
        `Para liberar seus canais e ter seu registro aprovado, realize o seu registro no canal oficial!`
      )
      .addFields(
        {
          name: "📜 Regras",
          value: "Por favor, leia as diretrizes e regras da comunidade.",
          inline: true,
        },
        {
          name: "💬 Interaja!",
          value: "Estamos muito felizes em tê-lo(a) conosco.",
          inline: true,
        }
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `${config.organizacao.nome} - Boas-vindas!` })
      .setTimestamp();

    const welcomeChannel = member.guild.channels.cache.get(channelEntrada) ||
      (await member.guild.channels.fetch(channelEntrada).catch(() => null));

    if (welcomeChannel) {
      welcomeChannel.send({
        content: `<@${member.user.id}>`,
        embeds: [welcomeEmbed],
      }).catch((err) => {
        console.warn("⚠️ [GUILD_MEMBER_ADD] Erro ao enviar mensagem de boas-vindas:", err.message);
      });
    }
  },
};
