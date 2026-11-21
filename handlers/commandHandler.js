const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

/**
 * Lê recursivamente uma pasta e retorna caminhos de todos os arquivos .js
 * @param {string} dir 
 * @returns {string[]}
 */
function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (file.endsWith(".js")) {
      results.push(filePath);
    }
  });

  return results;
}

/**
 * Carrega todos os comandos na Collection client.commands
 * @param {import("discord.js").Client} client 
 */
function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, "..", "commands");

  if (!fs.existsSync(commandsPath)) {
    console.warn("⚠️ [COMMANDS] Pasta de comandos não encontrada:", commandsPath);
    return;
  }

  const commandFiles = getFilesRecursively(commandsPath);
  let loadedCount = 0;

  for (const filePath of commandFiles) {
    try {
      // Limpa cache para permitir hot reload se necessário
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        loadedCount++;
      } else {
        console.warn(`⚠️ [COMMANDS] O comando em ${path.basename(filePath)} está faltando a propriedade "data" ou "execute".`);
      }
    } catch (error) {
      console.error(`❌ [COMMANDS] Falha ao carregar comando ${filePath}:`, error);
    }
  }

  console.log(`✅ [COMMANDS] ${loadedCount} comandos carregados com sucesso!`);
}

module.exports = { loadCommands };
