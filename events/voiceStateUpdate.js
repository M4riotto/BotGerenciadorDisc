const { Events } = require("discord.js");
const config = require("../config");
const { voiceStateUpdate } = require("./verifyChannelVoice");

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState, client) {
    try {
      const guild = client.guilds.cache.get(process.env.GUILD_ID) || newState.guild;
      if (guild) {
        await voiceStateUpdate(oldState, newState, config.canais.voiceStatus, guild);
      }
    } catch (error) {
      console.error("Erro no evento voiceStateUpdate:", error);
    }
  },
};
