const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

// Controle de cache para evitar atingir o rate limit do gateway (Opcode 8)
let lastFetchTimestamp = 0;
const CACHE_COOLDOWN_MS = 60000; // 60 segundos entre chamadas fetch() completas

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Lista todos os membros que possuem determinado cargo.")
    .addRoleOption((option) =>
      option
        .setName("cargo")
        .setDescription("Cargo a ser listado")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const role = interaction.options.getRole("cargo");
    await interaction.deferReply({ ephemeral: false });

    try {
      const guild = interaction.guild;
      let membersWithRole;

      // Se o cache possui menos membros que o servidor e o cooldown de 60s já passou, tenta atualizar
      const now = Date.now();
      if (guild.memberCount > guild.members.cache.size && (now - lastFetchTimestamp) > CACHE_COOLDOWN_MS) {
        try {
          await guild.members.fetch();
          lastFetchTimestamp = now;
        } catch (fetchErr) {
          // Se o Discord aplicar GatewayRateLimitError (opcode 8), usa os membros que já estão em cache
          console.warn("⚠️ Rate limit no opcode 8 (fetch), utilizando membros em cache:", fetchErr.message);
        }
      }

      // Filtra os membros a partir do cache seguro do Discord.js
      const targetRole = guild.roles.cache.get(role.id);
      membersWithRole = targetRole?.members || guild.members.cache.filter((m) => m.roles.cache.has(role.id));

      if (!membersWithRole || membersWithRole.size === 0) {
        return interaction.editReply({
          content: `Nenhum membro encontrado com o cargo <@&${role.id}>.`,
        });
      }

      const membersList = membersWithRole.map((member) => `<@${member.id}> (${member.displayName})`);
      const orgNome = config.organizacao.nome || "Comunidade";

      const embed = new EmbedBuilder()
        .setColor(config.cores.padrao)
        .setTitle(`👥 Membros com o cargo @${role.name} (${membersWithRole.size}) - ${orgNome}`)
        .setDescription(membersList.slice(0, 50).join("\n"))
        .setFooter({ text: orgNome, iconURL: config.organizacao.logoUrl || undefined })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("Erro na consulta de hierarquia:", err);
      await interaction.editReply({
        content: "❌ Ocorreu um erro ao listar os membros deste cargo.",
      });
    }
  },
};
