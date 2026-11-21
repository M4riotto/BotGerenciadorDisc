const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Registra todos os Slash Commands carregados no client junto à API do Discord.
 * @param {import("discord.js").Client} client 
 */
async function deployCommands(client) {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID;
  const clientId = client.user.id;

  if (!token || !guildId) {
    console.warn("⚠️ [DEPLOY] DISCORD_TOKEN ou GUILD_ID não definidos no .env. Não foi possível registrar os comandos slash.");
    return;
  }

  const commandsData = [];
  client.commands.forEach((cmd) => {
    if (cmd.data && typeof cmd.data.toJSON === "function") {
      commandsData.push(cmd.data.toJSON());
    }
  });

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log(`🔄 [DEPLOY] Registrando ${commandsData.length} comandos Slash na guilda (${guildId})...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandsData }
    );

    console.log(`✅ [DEPLOY] ${data.length} comandos Slash registrados com sucesso!`);
  } catch (error) {
    console.error("❌ [DEPLOY] Erro ao registrar comandos slash:", error);
  }
}

module.exports = { deployCommands };
