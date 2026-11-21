const { Events } = require("discord.js");
const { handleComponent } = require("../handlers/componentHandler");
const { logCommandExecution } = require("../utils/commandLogger");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    try {
      // 1. Tratamento de Slash Commands (/comando)
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          console.warn(`⚠️ Comando não encontrado: ${interaction.commandName}`);
          return interaction.reply({
            content: "❌ Este comando não foi reconhecido ou foi desativado.",
            flags: 64,
          });
        }

        await command.execute(interaction, client);
        await logCommandExecution(interaction, client);
        return;
      }

      // 2. Tratamento de Componentes (Botões, Modais e Menus de Seleção: String, Canal, Cargo)
      if (
        interaction.isButton() ||
        interaction.isModalSubmit() ||
        interaction.isAnySelectMenu()
      ) {
        await handleComponent(interaction, client);
        return;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar interaction (${interaction.customId || interaction.commandName}):`, error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Ocorreu um erro interno ao processar esta ação.",
          flags: 64,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: "❌ Ocorreu um erro interno ao processar esta ação.",
          flags: 64,
        }).catch(() => {});
      }
    }
  },
};
