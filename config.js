const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const CONFIG_PATH = path.join(__dirname, "config.json");

// Valores padrão caso o config.json esteja vazio ou incompleto
const defaultConfig = {
  prefix: "/",
  organizacao: {
    nome: "Comunidade Discord",
    tipo: "comunidade",
    corEmbed: "#3498db",
    logoUrl: "",
  },
  cores: {
    padrao: "#3498db",
    boasVindas: "#00FF00",
    saida: "#FF0000",
    exoneracao: "#e74c3c",
    cargoSucesso: "#00FF7F",
    cargoRemovido: "#FF0000",
    logMensagemDeletada: "#FF0000",
    logMensagemEditada: "#FFA500",
    logAlteracaoNick: "#00BFFF",
    vozEntrou: "#00FF00",
    vozSaiu: "#FF0000",
    vozMudou: "#0099FF",
    sugestao: "#ADD8E6",
    lembrete: "#ff9900",
    ticketFinalizado: "#e74c3c",
  },
  permissoes: {
    cargoMinimo: "1573726020282884164",
  },
  canais: {
    registro: "1573726022266785823",
    entrada: "1573726022866833534",
    saida: "1573726023466483764",
    qd: "1573726022866833535",
    exonerados: "1573726022866833535",
    promovidos: "1573726023466483767",
    logsComandos: "1573726025366507671",
    sugestao: "1573726023466483768",
    ticket: "1572318388057809077",
    categoryId: "1573726025181962379",
    msgDelete: "1573726025366507671",
    security: "1573726025366507671",
    voiceStatus: "1573726025366507671",
  },
  cargos: {
    minimoComandos: "1573726020282884164",
    novato: "1573726020282884159",
    membro: "",
    amigos: "1573726020157178032",
  },
  tickets: {
    cargoAtendimento: "1573726020282884164",
    categoriaId: "1573726025181962379",
    canalPainel: "1572318388057809077",
    titulo: "Central de Atendimento",
    descricao:
      "Precisando de suporte ou ajuda? Selecione abaixo o tipo de atendimento para abrir seu ticket privado.",
    opcoes: [
      {
        id: "duvida_suporte",
        label: "Dúvidas e Suporte Geral",
        description: "Tirar dúvidas com a equipe de moderação",
        emoji: "❓",
      },
      {
        id: "denunciar_membro",
        label: "Denunciar um Membro",
        description: "Denunciar infração de regras ou comportamento inadequado",
        emoji: "🚫",
      },
      {
        id: "entrar_staff",
        label: "Entrar para a Staff",
        description: "Candidatar-se para a equipe do servidor",
        emoji: "🤝",
      },
      {
        id: "recorrer_punicao",
        label: "Recorrer Punição",
        description: "Recorrer a um aviso ou castigo recebido",
        emoji: "📢",
      },
      {
        id: "falar_com_dono",
        label: "Falar com a Direção",
        description: "Contatar diretamente a liderança do servidor",
        emoji: "👑",
      },
    ],
  },
};

// Lê config.json existente
let savedData = {};
if (fs.existsSync(CONFIG_PATH)) {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    savedData = JSON.parse(raw);
  } catch (err) {
    console.warn(
      "⚠️ Não foi possível ler config.json, usando defaults:",
      err.message,
    );
  }
}

const config = {
  prefix: savedData.prefix || defaultConfig.prefix,
  organizacao: {
    ...defaultConfig.organizacao,
    ...(savedData.organizacao || {}),
  },
  cores: { ...defaultConfig.cores, ...(savedData.cores || {}) },
  permissoes: { ...defaultConfig.permissoes, ...(savedData.permissoes || {}) },
  canais: { ...defaultConfig.canais, ...(savedData.canais || {}) },
  cargos: { ...defaultConfig.cargos, ...(savedData.cargos || {}) },
  tickets: {
    ...defaultConfig.tickets,
    ...(savedData.tickets || {}),
    opcoes:
      savedData.tickets?.opcoes && savedData.tickets.opcoes.length > 0
        ? savedData.tickets.opcoes
        : defaultConfig.tickets.opcoes,
  },
};

/**
 * Salva a configuração atual de volta no config.json
 */
config.saveConfig = function () {
  const dataToSave = {
    prefix: config.prefix,
    organizacao: config.organizacao,
    cores: config.cores,
    permissoes: config.permissoes,
    canais: config.canais,
    cargos: config.cargos,
    tickets: config.tickets,
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(dataToSave, null, 2), "utf-8");
  return dataToSave;
};

config.updateConfigField = function (section, key, value) {
  if (!config[section]) config[section] = {};
  config[section][key] = value;

  if (section === "cargos" && key === "minimoComandos") {
    config.permissoes.cargoMinimo = value;
  }

  config.saveConfig();
  return config;
};

module.exports = config;
