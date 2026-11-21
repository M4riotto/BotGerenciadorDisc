const fs = require("fs");
const path = require("path");

/**
 * Carrega todos os eventos da pasta events/
 * @param {import("discord.js").Client} client 
 * @param {any} cron 
 */
function loadEvents(client, cron) {
  const eventsPath = path.join(__dirname, "..", "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  let loadedCount = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      delete require.cache[require.resolve(filePath)];
      const event = require(filePath);

      if (event && event.name && typeof event.execute === "function") {
        const listener = (...args) => {
          if (event.name === "ready") {
            return event.execute(client, cron);
          }
          return event.execute(...args, client);
        };

        if (event.once) {
          client.once(event.name, listener);
        } else {
          client.on(event.name, listener);
        }
        loadedCount++;
      }
    } catch (error) {
      console.error(`❌ [EVENTS] Erro ao carregar evento ${file}:`, error);
    }
  }

  console.log(`✅ [EVENTS] ${loadedCount} eventos carregados com sucesso!`);
}

module.exports = { loadEvents };
