const { PermissionsBitField } = require("discord.js");
const config = require("../config");

/**
 * Verifica se o membro possui um determinado cargo ou qualquer cargo superior na hierarquia (>=).
 * Também concede permissão automática para o Dono do Servidor e Administradores.
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 * @param {string} [requiredRoleId] - ID do cargo mínimo necessário. Se não informado, usa config.permissoes.cargoMinimo
 * @returns {Promise<boolean>}
 */
async function checkCommandPermission(interaction, requiredRoleId) {
  try {
    const guild = interaction.guild || (await interaction.client.guilds.fetch(interaction.guildId).catch(() => null));
    if (!guild) return false;

    const member = interaction.member || (await guild.members.fetch(interaction.user.id).catch(() => null));
    if (!member) return false;

    // 1. Dono do servidor sempre tem permissão máxima
    if (guild.ownerId === member.id) {
      return true;
    }

    // 2. Administradores do servidor sempre têm permissão
    if (member.permissions && member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return true;
    }

    // 3. Cargo mínimo exigido
    const targetRoleId = requiredRoleId || config.permissoes?.cargoMinimo || config.cargos.supervisor;
    if (!targetRoleId) {
      return true;
    }

    const requiredRole = await guild.roles.fetch(targetRoleId).catch(() => null);
    if (!requiredRole) {
      console.warn(`⚠️ [PERMISSÃO] Cargo com ID ${targetRoleId} não encontrado no servidor.`);
      return member.permissions && member.permissions.has(PermissionsBitField.Flags.ManageGuild);
    }

    // 4. Regra >= (cargo do membro com posição maior ou igual ao cargo exigido)
    const memberHighestPos = member.roles?.highest?.position ?? 0;
    const hasRoleOrAbove = memberHighestPos >= requiredRole.position || member.roles.cache.has(requiredRole.id);

    return hasRoleOrAbove;
  } catch (error) {
    console.error("❌ Erro ao verificar permissões de comando:", error);
    return false;
  }
}

/**
 * Aplica a validação de permissão (>= cargo X).
 * Se o usuário não tiver permissão, responde automaticamente com mensagem efêmera.
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 * @param {string} [requiredRoleId]
 * @returns {Promise<boolean>} true se permitido, false se negado
 */
async function enforceRoleOrAbove(interaction, requiredRoleId) {
  const allowed = await checkCommandPermission(interaction, requiredRoleId);

  if (!allowed) {
    const targetRoleId = requiredRoleId || config.permissoes?.cargoMinimo;
    const roleText = targetRoleId ? `<@&${targetRoleId}>` : "de liderança";
    const msg = `❌ Você não tem permissão para usar este comando.\n*(Necessário possuir o cargo ${roleText} ou qualquer cargo acima dele).*`;

    if (interaction.deferred) {
      await interaction.editReply({ content: msg }).catch(() => {});
    } else if (interaction.replied) {
      await interaction.followUp({ content: msg, flags: 64 }).catch(() => {});
    } else {
      await interaction.reply({ content: msg, flags: 64 }).catch(() => {});
    }

    return false;
  }

  return true;
}

module.exports = {
  checkCommandPermission,
  enforceRoleOrAbove,
};
