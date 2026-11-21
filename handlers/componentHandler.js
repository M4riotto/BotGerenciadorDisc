const config = require("../config");

// Importações dos módulos de eventos/componentes
const { ticketCreate } = require("../events/ticketCreate");
const { messageModal } = require("../events/mensagemModal");
const { handleRegistro } = require("../events/registroHandler");
const { handleConfigInteraction } = require("../events/configHandler");
const { handleEmbedComponent } = require("../commands/embed");

/**
 * Roteia componentes (botões, menus e modais) para seus respectivos módulos
 * @param {import("discord.js").Interaction} interaction 
 * @param {import("discord.js").Client} client 
 */
async function handleComponent(interaction, client) {
  const customId = interaction.customId || "";

  // 1. Módulo de Embeds Interativos (/embed)
  if (customId.startsWith("embed_")) {
    return handleEmbedComponent(interaction, client);
  }

  // 2. Módulo de Configurações do Servidor (/configuracao)
  if (customId.startsWith("cfg_")) {
    return handleConfigInteraction(interaction, client);
  }

  // 3. Módulo de Registro (Modal, Submissão, Aprovação e Recusa)
  if (
    customId === "abrir_modal_registro" ||
    customId === "modal_registro_submit" ||
    customId.startsWith("aprovar_registro_") ||
    customId.startsWith("recusar_registro_")
  ) {
    return handleRegistro(interaction, client);
  }

  // 4. Módulo de Tickets
  if (
    customId === "abrir_ticket_select" ||
    customId.startsWith("menu_denuncia") ||
    customId.startsWith("menu_cargo") ||
    customId.startsWith("menu_denunciar_superior") ||
    customId.startsWith("menu_recorrer") ||
    customId.includes("ticket") ||
    customId.includes("fechar") ||
    customId.includes("assumir") ||
    customId === "mandar_prova"
  ) {
    return ticketCreate(interaction, client);
  }

  // 5. Módulo de Mensagem / Falar
  if (customId === "falar_modal") {
    return messageModal(interaction);
  }
}

module.exports = { handleComponent };
