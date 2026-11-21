const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../config");
const { enforceRoleOrAbove } = require("../utils/permissionCheck");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mensagem")
    .setDescription("Abre formulário para o bot enviar uma mensagem em seu nome."),

  async execute(interaction, client) {
    if (!await enforceRoleOrAbove(interaction)) {
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("falar_modal")
      .setTitle("Enviar Mensagem como Bot");

    const mensagemInput = new TextInputBuilder()
      .setCustomId("mensagem")
      .setLabel("Digite sua mensagem:")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(mensagemInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  },
};
