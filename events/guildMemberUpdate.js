const { Events } = require("discord.js");
const config = require("../config");
const { guildMemberUpdateName: updateName } = require("./guildMemberUpdateName");

module.exports = {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(oldMember, newMember) {
    try {
      // Monitora alteração de nickname e registra no canal de segurança
      await updateName(
        oldMember,
        newMember,
        config.canais.security
      );
    } catch (error) {
      console.error("Erro no evento guildMemberUpdate:", error);
    }
  },
};
