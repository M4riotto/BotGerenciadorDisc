const { Client, GatewayIntentBits, Options } = require("discord.js");
const dotenv = require("dotenv");
const cron = require("node-cron");

const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");

// Carrega as variáveis de ambiente
dotenv.config();

// Inicializa a instância do Client do Discord 100% otimizado para baixo consumo de RAM (< 60MB)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  makeCache: Options.cacheWithLimits({
    MessageManager: 25, // Mantém no máximo 25 mensagens por canal na RAM
    StageInstanceManager: 0,
    VoiceStateManager: 50,
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 1800, // Limpa mensagens inativas a cada 30 min
      lifetime: 900,  // Mensagens com mais de 15 min saem da memória
    },
  },
});

// Carrega comandos e eventos modulares (100% Discord-Native, sem banco de dados SQL)
loadCommands(client);
loadEvents(client, cron);

// Realiza o login na API do Discord
client.login(process.env.DISCORD_TOKEN);
