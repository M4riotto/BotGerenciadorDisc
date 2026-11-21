const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("up")
    .setDescription("Promove um membro e atualiza seus cargos e nickname na comunidade.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Membro a ser promovido")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("cargo_antigo")
        .setDescription("Cargo atual do membro a ser removido")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("cargo_novo")
        .setDescription("Novo cargo a ser atribuído")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    // Permissão: qualquer cargo maior ou igual ao cargo mínimo configurado
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    await interaction.deferReply({ flags: 64 });

    const user = interaction.options.getUser("usuario");
    const roleAntigo = interaction.options.getRole("cargo_antigo");
    const roleNovo = interaction.options.getRole("cargo_novo");

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.editReply({
        content: "❌ Membro não encontrado no servidor.",
      });
    }

    // Adiciona o cargo novo
    if (roleNovo && !member.roles.cache.has(roleNovo.id)) {
      await member.roles.add(roleNovo.id).catch((err) => {
        console.warn(`Erro ao adicionar cargo novo: ${err.message}`);
      });
    }

    // Remove o cargo antigo
    if (roleAntigo && member.roles.cache.has(roleAntigo.id)) {
      await member.roles.remove(roleAntigo.id).catch((err) => {
        console.warn(`Erro ao remover cargo antigo: ${err.message}`);
      });
    }

    // Se o membro tiver a tag de novato e estiver sendo promovido para outro cargo, remove a tag novato
    if (config.cargos.novato && member.roles.cache.has(config.cargos.novato) && roleNovo.id !== config.cargos.novato) {
      await member.roles.remove(config.cargos.novato).catch(() => {});
    }

    // Gera o prefixo a partir do nome do cargo novo (ex: "Moderador" -> "[MODERADOR]")
    const roleCleanName = roleNovo.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛ]/g, "").toUpperCase();
    const prefix = `[${(roleCleanName || roleNovo.name.toUpperCase()).slice(0, 10)}]`;

    // Atualiza o apelido preservando o nome original
    const currentNickname = member.nickname || user.displayName || user.username;
    let cleanName = currentNickname;

    // Remove qualquer prefixo existente entre colchetes
    if (cleanName.startsWith("[")) {
      const closingIndex = cleanName.indexOf("]");
      if (closingIndex !== -1) {
        cleanName = cleanName.slice(closingIndex + 1).trim();
      }
    }

    const newNickname = `${prefix} ${cleanName}`.slice(0, 32);
    if (member.nickname !== newNickname) {
      await member.setNickname(newNickname).catch((err) => {
        console.warn(`Não foi possível alterar apelido de ${user.tag}: ${err.message}`);
      });
    }

    // Envia anúncio de promoção no canal configurado
    const channelPromovidosId = config.canais.promovidos;
    const channel = client.channels.cache.get(channelPromovidosId) ||
      (await client.channels.fetch(channelPromovidosId).catch(() => null));

    const orgNome = config.organizacao.nome || process.env.ORG_NOME || "Comunidade";

    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(config.cores.cargoSucesso || config.cores.padrao)
        .setTitle(`🆙 PROMOÇÃO! - ${orgNome}`)
        .setDescription(
          `O membro <@${user.id}> foi promovido!\n\n` +
          `**Cargo anterior:** <@&${roleAntigo.id}>\n` +
          `**Novo cargo:** <@&${roleNovo.id}>`
        )
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `Promovido por ${interaction.user.tag} • ${orgNome}`, iconURL: config.organizacao.logoUrl || undefined })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }

    await interaction.editReply({
      content: `✅ Usuário <@${user.id}> promovido para <@&${roleNovo.id}> com sucesso!\nApelido atualizado para \`${newNickname}\`.`,
    });
  },
};
