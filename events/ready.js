const { Events } = require("discord.js");
const { deployCommands } = require("../utils/deployCommands");
// const { sendEmbedDemonstrativo } = require("../utils/sendEmbedAuto");
const config = require("../config");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client, cron) {
    console.log(`\n======================================================`);
    console.log(`🤖 [ONLINE] Bot conectado com sucesso como: ${client.user.tag}`);
    console.log(`🏢 [CONFIG] Servidor: ${config.organizacao.nome}`);
    console.log(`⚡ [MODE] 100% Discord-Native (Sem banco de dados SQL pesado)`);
    console.log(`======================================================\n`);

    // Registra/atualiza comandos Slash na guilda automaticamente
    await deployCommands(client);

    // =========================================================================
    // ⏰ AGENDAMENTOS PERIÓDICOS (CRON JOBS) - DESATIVADO / COMENTADO
    // Para ativar, basta descomentar o bloco abaixo e ajustar o horário e o canal desejado:
    // =========================================================================
    /*
    if (cron) {
      // Exemplo: Dispara todos os dias às 12:00 (Sintaxe Cron: minuto hora dia mês dia-da-semana)
      cron.schedule("0 12 * * *", () => {
        console.log("⏰ [CRON] Executando rotina automática demonstrativa...");
        sendEmbedDemonstrativo(client, config.canais.entrada);
      });
    }
    */
  },
};
