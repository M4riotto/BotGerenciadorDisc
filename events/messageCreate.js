const { Events } = require("discord.js");
const config = require("../config");
const { sugestaoMessage } = require("./sugestaoMensagem");

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (!message || message.author?.bot) return;

    try {
      await sugestaoMessage(message, config.canais.sugestao);
    } catch (error) {
      console.error("Erro no evento messageCreate:", error);
    }
  },
};
