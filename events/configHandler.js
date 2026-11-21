const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const config = require("../config");
const { checkCommandPermission } = require("../utils/permissionCheck");

// Nomes amigáveis dos canais para exibição
const CANAIS_INFO = {
  registro: { label: "Canal de Registro (Moderação)", desc: "Onde a moderação recebe aprovações de novos membros", type: "text" },
  entrada: { label: "Canal de Boas-Vindas (Entrada)", desc: "Onde mensagens de novos membros são publicadas", type: "text" },
  promovidos: { label: "Canal de UP / Promoções (/up)", desc: "Anúncios públicos de promoções na equipe", type: "text" },
  exonerados: { label: "Canal de Exonerados (/amigos)", desc: "Registro público de exonerações e transferências para Amigos", type: "text" },
  qd: { label: "Canal do QD (Quadro Disciplinar / Saídas)", desc: "Logs de advertências disciplinares e saídas voluntárias", type: "text" },
  saida: { label: "Canal de Saída (Expulsões)", desc: "Logs de membros expulsos do servidor", type: "text" },
  logsComandos: { label: "Canal de Logs de Comandos (Auditoria)", desc: "Registro automático de cada comando executado pela equipe", type: "text" },
  sugestao: { label: "Canal de Sugestões", desc: "Canal onde o bot cria votações automáticas com reações", type: "text" },
  ticket: { label: "Canal do Painel de Tickets (/eticket)", desc: "Canal onde o painel de atendimento é enviado", type: "text" },
  categoryId: { label: "Categoria dos Tickets", desc: "Categoria onde as salas privadas de atendimento são criadas", type: "category" },
  msgDelete: { label: "Logs de Mensagens Deletadas/Editadas", desc: "Canal de logs para segurança e auditoria de texto", type: "text" },
  security: { label: "Logs de Segurança (Troca de Nick)", desc: "Canal de logs para alterações de apelidos", type: "text" },
  voiceStatus: { label: "Logs de Voz (Calls)", desc: "Logs de membros entrando/saindo/mudando de call", type: "text" },
};

// Nomes amigáveis dos cargos
const CARGOS_INFO = {
  minimoComandos: { label: "Cargo Mínimo de Permissões (>=)", desc: "Cargo base: quem tiver este cargo ou qualquer cargo ACIMA pode usar comandos" },
  novato: { label: "Cargo de Iniciante (Entrada)", desc: "Cargo atribuído automaticamente quando um novo membro entra no servidor" },
  membro: { label: "Cargo de Membro (Aprovado)", desc: "Cargo atribuído após aprovação do /registro (a tag iniciante é removida)" },
  amigos: { label: "Cargo de Amigos", desc: "Cargo opcional concedido no comando /amigos (visitantes/ex-membros)" },
};

/**
 * Constrói o Embed e os componentes do Painel Principal de Configurações
 */
function buildConfigDashboard(guild) {
  const orgNome = config.organizacao.nome || "Comunidade Discord";
  const tkt = config.tickets || {};

  const embed = new EmbedBuilder()
    .setColor(config.cores.padrao)
    .setTitle(`⚙️ Painel de Configurações - ${orgNome}`)
    .setDescription(
      `Aqui você pode configurar todas as variáveis do bot de forma interativa.\n` +
      `Todas as alterações são salvas automaticamente no arquivo **config.json** e aplicadas na hora!`
    )
    .addFields(
      {
        name: "🏢 Identidade da Comunidade",
        value:
          `• **Nome:** \`${config.organizacao.nome}\`\n` +
          `• **Logo:** ${config.organizacao.logoUrl ? `[Ver Imagem](${config.organizacao.logoUrl})` : "*Não configurada*"}`,
        inline: false,
      },
      {
        name: "🛡️ Cargos do Sistema",
        value:
          `• **Mínimo para Comandos (>=):** ${config.permissoes.cargoMinimo ? `<@&${config.permissoes.cargoMinimo}>` : "*Não definido*"}\n` +
          `• **Iniciante (Entrada):** ${config.cargos.novato ? `<@&${config.cargos.novato}>` : "*Não definido*"}\n` +
          `• **Membro (Registro Aprovado):** ${config.cargos.membro ? `<@&${config.cargos.membro}>` : "*Não definido*"}\n` +
          `• **Cargo Amigos (/amigos):** ${config.cargos.amigos ? `<@&${config.cargos.amigos}>` : "*Não definido*"}`,
        inline: false,
      },
      {
        name: "🎟️ Sistema de Atendimento (Tickets)",
        value:
          `• **Cargo de Atendimento (>=):** ${tkt.cargoAtendimento ? `<@&${tkt.cargoAtendimento}>` : "*Não definido*"}\n` +
          `• **Categoria:** ${tkt.categoriaId ? `<#${tkt.categoriaId}>` : "*Não definida*"}\n` +
          `• **Opções de Tickets Ativas:** **${tkt.opcoes ? tkt.opcoes.length : 0}** tipos de tickets configurados`,
        inline: false,
      },
      {
        name: "📢 Principais Canais do Servidor",
        value:
          `• **Registro:** ${config.canais.registro ? `<#${config.canais.registro}>` : "*Não definido*"}\n` +
          `• **Boas-Vindas:** ${config.canais.entrada ? `<#${config.canais.entrada}>` : "*Não definido*"}\n` +
          `• **UP / Promoções:** ${config.canais.promovidos ? `<#${config.canais.promovidos}>` : "*Não definido*"}\n` +
          `• **Exonerados / Amigos:** ${config.canais.exonerados ? `<#${config.canais.exonerados}>` : "*Não definido*"}\n` +
          `• **QD (Quadro Disciplinar):** ${config.canais.qd ? `<#${config.canais.qd}>` : "*Não definido*"}\n` +
          `• **Logs de Comandos:** ${config.canais.logsComandos ? `<#${config.canais.logsComandos}>` : "*Não definido*"}\n` +
          `• **Sugestões:** ${config.canais.sugestao ? `<#${config.canais.sugestao}>` : "*Não definido*"}`,
        inline: false,
      },
      {
        name: "🎨 Cores Principais",
        value:
          `• **Padrão:** \`${config.cores.padrao}\` | **Sucesso:** \`${config.cores.cargoSucesso}\` | **Aviso:** \`${config.cores.lembrete}\` | **Perigo:** \`${config.cores.exoneracao}\``,
        inline: false,
      }
    )
    .setFooter({ text: `${orgNome} • config.json`, iconURL: config.organizacao.logoUrl || undefined })
    .setTimestamp();

  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("cfg_menu_selecao")
      .setPlaceholder("Selecione o que deseja configurar...")
      .addOptions(
        {
          label: "🚀 Assistente Passo a Passo (Wizard)",
          description: "Configure todas as variáveis essenciais em sequência guiada",
          value: "menu_wizard",
          emoji: "🚀",
        },
        {
          label: "🎟️ Configurar Tickets e Atendimento",
          description: "Defina quem pode atender (>= cargo), crie ou remova opções de tickets",
          value: "menu_tickets",
          emoji: "🎟️",
        },
        {
          label: "📢 Configurar Canais do Servidor",
          description: "Defina os canais de registro, entrada, promoções, logs, tickets...",
          value: "menu_canais",
          emoji: "📢",
        },
        {
          label: "🛡️ Configurar Cargos do Servidor",
          description: "Defina o cargo mínimo de comandos, novato, membro e amigos",
          value: "menu_cargos",
          emoji: "🛡️",
        },
        {
          label: "🏢 Nome e Logo da Comunidade",
          description: "Altere o nome e a URL da logo exibida nos embeds",
          value: "menu_identidade",
          emoji: "🏢",
        },
        {
          label: "🎨 Cores dos Embeds",
          description: "Personalize a paleta de cores hexadecimais do bot",
          value: "menu_cores",
          emoji: "🎨",
        },
        {
          label: "🔄 Atualizar Resumo do Painel",
          description: "Recarrega o painel com as informações mais recentes",
          value: "menu_dashboard",
          emoji: "🔄",
        }
      )
  );

  const rowBotoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_wizard")
      .setLabel("🚀 Assistente")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("cfg_btn_tickets")
      .setLabel("🎟️ Tickets")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("cfg_btn_canais")
      .setLabel("📢 Canais")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("cfg_btn_cargos")
      .setLabel("🛡️ Cargos")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("cfg_btn_identidade")
      .setLabel("🏢 Identidade")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [menu, rowBotoes] };
}

/**
 * Constrói cada etapa do Assistente Passo a Passo (Wizard)
 */
function buildWizardStep(step, guild) {
  // Passo 1: Identidade da Comunidade
  if (step === 1) {
    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 1 de 10): Identidade da Comunidade")
      .setDescription(
        `Vamos começar definindo a **Identidade** do seu servidor!\n\n` +
        `• **Nome Atual:** \`${config.organizacao.nome}\`\n` +
        `• **Logo URL:** ${config.organizacao.logoUrl ? `[Ver Imagem](${config.organizacao.logoUrl})` : "*Não configurada*"}\n\n` +
        `Clique em **✏️ Alterar Nome e Logo** para editar, ou clique em **Avançar ➡️** para manter como está.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_btn_edit_id")
        .setLabel("✏️ Alterar Nome e Logo")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_2")
        .setLabel("Avançar para Passo 2 ➡️")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    return { embed, components: [row] };
  }

  // Passo 2: Cargo Mínimo de Permissões (>=)
  if (step === 2) {
    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_role_minimoComandos")
      .setPlaceholder("Selecione o Cargo Mínimo de Permissões...");

    const rowRole = new ActionRowBuilder().addComponents(roleSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_3")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 2 de 10): Cargo Mínimo para Comandos (>=)")
      .setDescription(
        `Defina qual cargo terá permissão para usar os comandos de moderação do bot.\n` +
        `**Regra (>=):** Qualquer membro com esse cargo ou **qualquer cargo acima dele** na hierarquia terá acesso.\n\n` +
        `• **Configurado Atualmente:** ${config.permissoes.cargoMinimo ? `<@&${config.permissoes.cargoMinimo}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o cargo abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowRole, rowBtn] };
  }

  // Passo 3: Cargo de Iniciante (Entrada)
  if (step === 3) {
    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_role_novato")
      .setPlaceholder("Selecione o Cargo de Iniciante...");

    const rowRole = new ActionRowBuilder().addComponents(roleSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_4")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 3 de 10): Cargo de Iniciante (Entrada)")
      .setDescription(
        `Defina qual cargo será concedido **automaticamente ao entrar no servidor** (junto com o apelido \`[NVT]\`).\n\n` +
        `• **Configurado Atualmente:** ${config.cargos.novato ? `<@&${config.cargos.novato}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o cargo abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowRole, rowBtn] };
  }

  // Passo 4: Cargo de Membro (Após Registro Aprovado)
  if (step === 4) {
    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_role_membro")
      .setPlaceholder("Selecione o Cargo de Membro Oficial...");

    const rowRole = new ActionRowBuilder().addComponents(roleSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_5")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 4 de 10): Cargo de Membro Aprovado")
      .setDescription(
        `Defina qual cargo será concedido após a moderação **aprovar o /registro** do usuário.\n` +
        `*(Quando aprovado, o bot remove a tag de iniciante, remove o [NVT] e concede este cargo de Membro)*.\n\n` +
        `• **Configurado Atualmente:** ${config.cargos.membro ? `<@&${config.cargos.membro}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o cargo abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowRole, rowBtn] };
  }

  // Passo 5: Canal de Registro (Aprovações da Moderação)
  if (step === 5) {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_channel_registro")
      .setPlaceholder("Selecione o Canal de Registro...")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    const rowChannel = new ActionRowBuilder().addComponents(channelSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_6")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 5 de 10): Canal de Aprovação de Registro")
      .setDescription(
        `Defina em qual canal a moderação receberá as fichas preenchidas no **/registro** com os botões [✅ Aceitar] e [❌ Recusar].\n\n` +
        `• **Configurado Atualmente:** ${config.canais.registro ? `<#${config.canais.registro}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o canal abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowChannel, rowBtn] };
  }

  // Passo 6: Canal de Entrada (Boas-Vindas)
  if (step === 6) {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_channel_entrada")
      .setPlaceholder("Selecione o Canal de Entrada / Boas-Vindas...")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    const rowChannel = new ActionRowBuilder().addComponents(channelSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_7")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 6 de 10): Canal de Entrada / Boas-Vindas")
      .setDescription(
        `Defina onde o bot postará a mensagem de boas-vindas quando um novo membro entrar no servidor.\n\n` +
        `• **Configurado Atualmente:** ${config.canais.entrada ? `<#${config.canais.entrada}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o canal abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowChannel, rowBtn] };
  }

  // Passo 7: Canal de UP / Promoções (/up)
  if (step === 7) {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_channel_promovidos")
      .setPlaceholder("Selecione o Canal de Promoções (/up)...")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    const rowChannel = new ActionRowBuilder().addComponents(channelSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_8")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 7 de 10): Canal de UP / Promoções (/up)")
      .setDescription(
        `Defina em qual canal serão enviados os anúncios oficiais de promoções quando o comando **/up** for executado.\n\n` +
        `• **Configurado Atualmente:** ${config.canais.promovidos ? `<#${config.canais.promovidos}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o canal abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowChannel, rowBtn] };
  }

  // Passo 8: Canal de Exonerados (/amigos e Exonerações)
  if (step === 8) {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_channel_exonerados")
      .setPlaceholder("Selecione o Canal de Exonerados...")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    const rowChannel = new ActionRowBuilder().addComponents(channelSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_9")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 8 de 10): Canal de Exonerados (/amigos)")
      .setDescription(
        `Defina em qual canal serão postados os avisos oficiais de exoneração e transferências para o cargo de Amigos (/amigos).\n\n` +
        `• **Configurado Atualmente:** ${config.canais.exonerados ? `<#${config.canais.exonerados}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o canal abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowChannel, rowBtn] };
  }

  // Passo 9: Canal do QD (Quadro Disciplinar / Despedidas)
  if (step === 9) {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_channel_qd")
      .setPlaceholder("Selecione o Canal do QD / Despedidas...")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    const rowChannel = new ActionRowBuilder().addComponents(channelSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_10")
        .setLabel("Pular / Próximo Passo ➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 9 de 10): Canal do QD (Quadro Disciplinar)")
      .setDescription(
        `Defina onde serão registrados os avisos quando um membro sai voluntariamente do servidor ou registros disciplinares.\n\n` +
        `• **Configurado Atualmente:** ${config.canais.qd ? `<#${config.canais.qd}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o canal abaixo para avançar automaticamente:*`
      );

    return { embed, components: [rowChannel, rowBtn] };
  }

  // Passo 10: Canal de Logs de Comandos (Auditoria)
  if (step === 10) {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("cfg_wz_apply_channel_logsComandos")
      .setPlaceholder("Selecione o Canal de Logs de Comandos...")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

    const rowChannel = new ActionRowBuilder().addComponents(channelSelect);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_wz_goto_fim")
        .setLabel("Concluir Configuração 🎉")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🚀 Assistente (Passo 10 de 10): Canal de Logs de Comandos")
      .setDescription(
        `Defina o canal de auditoria onde o bot registrará automaticamente **cada comando executado pela equipe** (/up, /expulsar, /amigos, /embed, etc.).\n\n` +
        `• **Configurado Atualmente:** ${config.canais.logsComandos ? `<#${config.canais.logsComandos}>` : "*Não definido*"}\n\n` +
        `👉 *Selecione o canal abaixo para concluir o assistente:*`
      );

    return { embed, components: [rowChannel, rowBtn] };
  }

  // Finalização do Wizard
  const embedFim = new EmbedBuilder()
    .setColor(config.cores.cargoSucesso || config.cores.padrao)
    .setTitle("🎉 Assistente Concluído com Sucesso!")
    .setDescription(
      `Todas as principais configurações do bot foram salvas com sucesso no arquivo **config.json**!\n\n` +
      `**Resumo Completo:**\n` +
      `• **Identidade:** \`${config.organizacao.nome}\`\n` +
      `• **Cargo Mínimo (>=):** ${config.permissoes.cargoMinimo ? `<@&${config.permissoes.cargoMinimo}>` : "*Não definido*"}\n` +
      `• **Iniciante:** ${config.cargos.novato ? `<@&${config.cargos.novato}>` : "*Não definido*"}\n` +
      `• **Membro Oficial:** ${config.cargos.membro ? `<@&${config.cargos.membro}>` : "*Não definido*"}\n` +
      `• **Canal de Registro:** ${config.canais.registro ? `<#${config.canais.registro}>` : "*Não definido*"}\n` +
      `• **Canal de Entrada:** ${config.canais.entrada ? `<#${config.canais.entrada}>` : "*Não definido*"}\n` +
      `• **Canal de UP / Promoções:** ${config.canais.promovidos ? `<#${config.canais.promovidos}>` : "*Não definido*"}\n` +
      `• **Canal de Exonerados:** ${config.canais.exonerados ? `<#${config.canais.exonerados}>` : "*Não definido*"}\n` +
      `• **Canal do QD:** ${config.canais.qd ? `<#${config.canais.qd}>` : "*Não definido*"}\n` +
      `• **Canal de Logs de Comandos:** ${config.canais.logsComandos ? `<#${config.canais.logsComandos}>` : "*Não definido*"}\n\n` +
      `Você pode retornar ao Painel Principal ou ajustar opções individuais a qualquer momento com **/configuracao**.`
    );

  const rowFim = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_voltar")
      .setLabel("🏠 Voltar ao Painel Principal")
      .setStyle(ButtonStyle.Primary)
  );

  return { embed: embedFim, components: [rowFim] };
}

/**
 * Painel de gerenciamento exclusivo de Tickets
 */
function buildTicketsMenu() {
  const tkt = config.tickets || {};
  const opcoes = tkt.opcoes || [];

  let opcoesText = "";
  if (opcoes.length === 0) {
    opcoesText = "*Nenhuma opção de ticket configurada.*";
  } else {
    opcoesText = opcoes
      .map((op, i) => `${i + 1}. ${op.emoji ? op.emoji + " " : ""}**${op.label}** (\`${op.id}\`)\n   *${op.description || "Sem descrição"}*`)
      .join("\n\n");
  }

  const embed = new EmbedBuilder()
    .setColor(config.cores.padrao)
    .setTitle("🎟️ Gerenciador do Sistema de Tickets")
    .setDescription(
      `Configure quais opções de tickets aparecerão para os membros e quem pode atendê-los.\n\n` +
      `🛡️ **Cargo para Atender Tickets (>=):** ${tkt.cargoAtendimento ? `<@&${tkt.cargoAtendimento}>` : "*Não configurado (usa cargo mínimo de moderação)*"}\n` +
      `*(Este cargo e todos os cargos superiores na hierarquia têm permissão de ver e assumir tickets)*\n\n` +
      `📁 **Categoria de Salas:** ${tkt.categoriaId ? `<#${tkt.categoriaId}>` : "*Não configurada*"}\n\n` +
      `📋 **Opções de Atendimento no Menu (/eticket):**\n${opcoesText}`
    );

  const rowBotoes1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_tkt_cargo")
      .setLabel("🛡️ Cargo de Atendimento (>=)")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("cfg_btn_tkt_cat")
      .setLabel("📁 Categoria das Salas")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("cfg_btn_tkt_add")
      .setLabel("➕ Adicionar Opção")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("cfg_btn_tkt_del")
      .setLabel("➖ Remover Opção")
      .setStyle(ButtonStyle.Danger)
  );

  const rowBotoes2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_tkt_enviar")
      .setLabel("🚀 Publicar Painel Oficial Aqui")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("cfg_btn_voltar")
      .setLabel("⬅️ Voltar ao Painel Geral")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [rowBotoes1, rowBotoes2] };
}

/**
 * Menu seletor de qual canal configurar
 */
function buildCanaisListMenu() {
  const options = Object.entries(CANAIS_INFO).map(([key, info]) => ({
    label: info.label.slice(0, 100),
    description: info.desc.slice(0, 100),
    value: key,
  }));

  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("cfg_sel_canal_tipo")
      .setPlaceholder("Escolha qual canal você quer definir...")
      .addOptions(options.slice(0, 25))
  );

  const rowBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_voltar")
      .setLabel("⬅️ Voltar ao Painel")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor(config.cores.padrao)
    .setTitle("📢 Seleção de Canais do Servidor")
    .setDescription("Escolha no menu abaixo **qual canal** você deseja vincular no bot:");

  return { embed, components: [select, rowBtn] };
}

/**
 * Menu seletor de qual cargo configurar
 */
function buildCargosListMenu() {
  const options = Object.entries(CARGOS_INFO).map(([key, info]) => ({
    label: info.label.slice(0, 100),
    description: info.desc.slice(0, 100),
    value: key,
  }));

  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("cfg_sel_cargo_tipo")
      .setPlaceholder("Escolha qual cargo você quer definir...")
      .addOptions(options)
  );

  const rowBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_voltar")
      .setLabel("⬅️ Voltar ao Painel")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor(config.cores.padrao)
    .setTitle("🛡️ Seleção de Cargos do Servidor")
    .setDescription("Escolha no menu abaixo **qual cargo** você deseja configurar:");

  return { embed, components: [select, rowBtn] };
}

/**
 * Componente nativo do Discord para escolher o canal diretamente
 */
function buildChannelPicker(channelKey) {
  const info = CANAIS_INFO[channelKey] || { label: channelKey, type: "text" };

  const select = new ChannelSelectMenuBuilder()
    .setCustomId(`cfg_apply_channel_${channelKey}`)
    .setPlaceholder(`Selecione o canal para: ${info.label}...`.slice(0, 100));

  if (info.type === "category") {
    select.addChannelTypes(ChannelType.GuildCategory);
  } else {
    select.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);
  }

  const rowSelect = new ActionRowBuilder().addComponents(select);
  const rowBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_canais")
      .setLabel("⬅️ Escolher Outro Canal")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("cfg_btn_voltar")
      .setLabel("🏠 Voltar ao Início")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor(config.cores.padrao)
    .setTitle(`📢 Definir: ${info.label}`)
    .setDescription(
      `**Descrição:** ${info.desc}\n` +
      `**Canal atual:** ${config.canais[channelKey] ? `<#${config.canais[channelKey]}> (\`${config.canais[channelKey]}\`)` : "*Nenhum*"}\n\n` +
      `👉 **Clique no menu abaixo para selecionar o canal desejado no servidor:**`
    );

  return { embed, components: [rowSelect, rowBtn] };
}

/**
 * Componente nativo do Discord para escolher o cargo diretamente
 */
function buildRolePicker(cargoKey) {
  const info = CARGOS_INFO[cargoKey] || { label: cargoKey };

  const select = new RoleSelectMenuBuilder()
    .setCustomId(`cfg_apply_role_${cargoKey}`)
    .setPlaceholder(`Selecione o cargo para: ${info.label}...`.slice(0, 100));

  const rowSelect = new ActionRowBuilder().addComponents(select);
  const rowBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("cfg_btn_cargos")
      .setLabel("⬅️ Escolher Outro Cargo")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("cfg_btn_voltar")
      .setLabel("🏠 Voltar ao Início")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor(config.cores.padrao)
    .setTitle(`🛡️ Definir: ${info.label}`)
    .setDescription(
      `**Descrição:** ${info.desc}\n` +
      `**Cargo atual:** ${config.cargos[cargoKey] ? `<@&${config.cargos[cargoKey]}> (\`${config.cargos[cargoKey]}\`)` : "*Nenhum*"}\n\n` +
      `👉 **Clique no menu abaixo para selecionar o cargo desejado no servidor:**`
    );

  return { embed, components: [rowSelect, rowBtn] };
}

/**
 * Roteador principal de todas as interações do módulo de configuração (/configuracao)
 */
async function handleConfigInteraction(interaction, client) {
  const customId = interaction.customId || "";
  const isStaff = await checkCommandPermission(interaction);

  if (!isStaff) {
    return interaction.reply({
      content: "❌ Apenas administradores do servidor podem alterar as configurações.",
      flags: 64,
    });
  }

  // 1. Botão: Voltar ao Painel Principal ou Seleção de Dashboard
  if (customId === "cfg_btn_voltar" || (interaction.isStringSelectMenu() && interaction.values[0] === "menu_dashboard")) {
    const dashboard = buildConfigDashboard(interaction.guild);
    return interaction.update({
      content: null,
      embeds: [dashboard.embed],
      components: dashboard.components,
    });
  }

  // 2. Módulo do Assistente Passo a Passo (Wizard)
  if (customId === "cfg_btn_wizard" || (interaction.isStringSelectMenu() && interaction.values[0] === "menu_wizard")) {
    const step1 = buildWizardStep(1, interaction.guild);
    return interaction.update({
      content: null,
      embeds: [step1.embed],
      components: step1.components,
    });
  }

  if (customId.startsWith("cfg_wz_goto_")) {
    const nextStep = customId.replace("cfg_wz_goto_", "");
    if (nextStep === "fim") {
      const fim = buildWizardStep("fim", interaction.guild);
      return interaction.update({ content: null, embeds: [fim.embed], components: fim.components });
    }
    const stepNum = parseInt(nextStep, 10);
    const stepObj = buildWizardStep(stepNum, interaction.guild);
    return interaction.update({ content: null, embeds: [stepObj.embed], components: stepObj.components });
  }

  if (customId === "cfg_wz_btn_edit_id") {
    const modal = new ModalBuilder()
      .setCustomId("cfg_wz_modal_id_submit")
      .setTitle("Identidade da Comunidade");

    const inputNome = new TextInputBuilder()
      .setCustomId("cfg_in_nome")
      .setLabel("Nome da Comunidade / Servidor:")
      .setStyle(TextInputStyle.Short)
      .setValue(config.organizacao.nome || "")
      .setPlaceholder("Ex: Minha Comunidade")
      .setRequired(true)
      .setMaxLength(50);

    const inputLogo = new TextInputBuilder()
      .setCustomId("cfg_in_logo")
      .setLabel("URL da Logo (Opcional):")
      .setStyle(TextInputStyle.Short)
      .setValue(config.organizacao.logoUrl || "")
      .setPlaceholder("https://exemplo.com/logo.png")
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputNome),
      new ActionRowBuilder().addComponents(inputLogo)
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && customId === "cfg_wz_modal_id_submit") {
    const nome = interaction.fields.getTextInputValue("cfg_in_nome").trim();
    const logoUrl = interaction.fields.getTextInputValue("cfg_in_logo").trim();

    config.updateConfigField("organizacao", "nome", nome);
    config.updateConfigField("organizacao", "logoUrl", logoUrl);

    const step1 = buildWizardStep(1, interaction.guild);
    return interaction.update({
      content: "✅ **Nome e Logo atualizados com sucesso!**",
      embeds: [step1.embed],
      components: step1.components,
    });
  }

  if (customId.startsWith("cfg_wz_apply_role_") && interaction.isRoleSelectMenu()) {
    const roleKey = customId.replace("cfg_wz_apply_role_", "");
    const roleId = interaction.values[0];

    config.updateConfigField("cargos", roleKey, roleId);
    if (roleKey === "minimoComandos") {
      config.updateConfigField("permissoes", "cargoMinimo", roleId);
    }

    const nextStepMap = { minimoComandos: 3, novato: 4, membro: 5 };
    const nextStep = nextStepMap[roleKey] || 5;
    const stepObj = buildWizardStep(nextStep, interaction.guild);
    return interaction.update({
      content: `✅ Cargo configurado para <@&${roleId}>!`,
      embeds: [stepObj.embed],
      components: stepObj.components,
    });
  }

  if (customId.startsWith("cfg_wz_apply_channel_") && interaction.isChannelSelectMenu()) {
    const channelKey = customId.replace("cfg_wz_apply_channel_", "");
    const channelId = interaction.values[0];

    config.updateConfigField("canais", channelKey, channelId);

    const nextStepMap = {
      registro: 6,
      entrada: 7,
      promovidos: 8,
      exonerados: 9,
      qd: 10,
      logsComandos: "fim",
    };
    const nextStep = nextStepMap[channelKey] || "fim";
    const stepObj = buildWizardStep(nextStep, interaction.guild);
    return interaction.update({
      content: `✅ Canal configurado para <#${channelId}>!`,
      embeds: [stepObj.embed],
      components: stepObj.components,
    });
  }

  // 3. Módulo de Tickets
  if (customId === "cfg_btn_tickets" || (interaction.isStringSelectMenu() && interaction.values[0] === "menu_tickets")) {
    const tktMenu = buildTicketsMenu();
    return interaction.update({
      content: null,
      embeds: [tktMenu.embed],
      components: tktMenu.components,
    });
  }

  if (customId === "cfg_btn_tkt_cargo") {
    const select = new RoleSelectMenuBuilder()
      .setCustomId("cfg_apply_role_ticket_staff")
      .setPlaceholder("Selecione o cargo mínimo para atender tickets (>=)...");

    const row = new ActionRowBuilder().addComponents(select);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_btn_tickets")
        .setLabel("⬅️ Voltar aos Tickets")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("🛡️ Cargo Mínimo para Atendimento de Tickets")
      .setDescription(
        `Defina qual cargo terá permissão para visualizar e atender os tickets criados pelos membros.\n\n` +
        `**Regra Hierárquica:** O cargo selecionado e **todos os cargos acima dele (>=)** terão acesso total para atender e fechar tickets.\n\n` +
        `👉 *Selecione o cargo abaixo:*`
      );

    return interaction.update({
      content: null,
      embeds: [embed],
      components: [row, rowBtn],
    });
  }

  if (customId === "cfg_apply_role_ticket_staff" && interaction.isRoleSelectMenu()) {
    const roleId = interaction.values[0];
    config.tickets.cargoAtendimento = roleId;
    config.saveConfig();

    const tktMenu = buildTicketsMenu();
    return interaction.update({
      content: `✅ Cargo de atendimento atualizado para <@&${roleId}> (e superiores)! Salvo no config.json.`,
      embeds: [tktMenu.embed],
      components: tktMenu.components,
    });
  }

  if (customId === "cfg_btn_tkt_cat") {
    const select = new ChannelSelectMenuBuilder()
      .setCustomId("cfg_apply_channel_ticket_cat")
      .setPlaceholder("Selecione a categoria onde os tickets serão criados...")
      .addChannelTypes(ChannelType.GuildCategory);

    const row = new ActionRowBuilder().addComponents(select);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_btn_tickets")
        .setLabel("⬅️ Voltar aos Tickets")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle("📁 Categoria dos Canais de Tickets")
      .setDescription(`Selecione no menu abaixo a **Categoria** do Discord onde os tickets privados serão abertos:`);

    return interaction.update({
      content: null,
      embeds: [embed],
      components: [row, rowBtn],
    });
  }

  if (customId === "cfg_apply_channel_ticket_cat" && interaction.isChannelSelectMenu()) {
    const catId = interaction.values[0];
    config.tickets.categoriaId = catId;
    config.canais.categoryId = catId;
    config.saveConfig();

    const tktMenu = buildTicketsMenu();
    return interaction.update({
      content: `✅ Categoria dos tickets atualizada para <#${catId}>! Salva no config.json.`,
      embeds: [tktMenu.embed],
      components: tktMenu.components,
    });
  }

  if (customId === "cfg_btn_tkt_add") {
    const modal = new ModalBuilder()
      .setCustomId("cfg_modal_add_ticket_submit")
      .setTitle("Adicionar Opção de Ticket");

    const inputLabel = new TextInputBuilder()
      .setCustomId("cfg_in_tkt_label")
      .setLabel("Nome da Opção / Assunto:")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex: Suporte Financeiro ou Parcerias")
      .setRequired(true)
      .setMaxLength(50);

    const inputDesc = new TextInputBuilder()
      .setCustomId("cfg_in_tkt_desc")
      .setLabel("Descrição (aparece no select):")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex: Dúvidas sobre pagamentos e doações")
      .setRequired(false)
      .setMaxLength(90);

    const inputEmoji = new TextInputBuilder()
      .setCustomId("cfg_in_tkt_emoji")
      .setLabel("Emoji (Opcional):")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex: 💰 ou 🤝 ou ❓")
      .setRequired(false)
      .setMaxLength(10);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputLabel),
      new ActionRowBuilder().addComponents(inputDesc),
      new ActionRowBuilder().addComponents(inputEmoji)
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && customId === "cfg_modal_add_ticket_submit") {
    const label = interaction.fields.getTextInputValue("cfg_in_tkt_label").trim();
    const description = interaction.fields.getTextInputValue("cfg_in_tkt_desc").trim();
    const emoji = interaction.fields.getTextInputValue("cfg_in_tkt_emoji").trim();

    const id = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 20);

    if (!config.tickets.opcoes) config.tickets.opcoes = [];
    config.tickets.opcoes = config.tickets.opcoes.filter((o) => o.id !== id);

    config.tickets.opcoes.push({
      id: id || `ticket_${Date.now()}`,
      label,
      description: description || undefined,
      emoji: emoji || undefined,
    });

    config.saveConfig();

    const tktMenu = buildTicketsMenu();
    return interaction.update({
      content: `✅ Nova opção de ticket **${label}** adicionada com sucesso e salva no config.json!`,
      embeds: [tktMenu.embed],
      components: tktMenu.components,
    });
  }

  if (customId === "cfg_btn_tkt_del") {
    const opcoes = config.tickets.opcoes || [];

    if (opcoes.length === 0) {
      return interaction.reply({
        content: "❌ Nenhuma opção de ticket configurada para remover.",
        flags: 64,
      });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId("cfg_sel_del_ticket_opcao")
      .setPlaceholder("Escolha qual opção deseja remover...")
      .addOptions(
        opcoes.map((op) => ({
          label: op.label.slice(0, 100),
          description: `ID: ${op.id}`,
          value: op.id,
          emoji: op.emoji || undefined,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);
    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_btn_tickets")
        .setLabel("⬅️ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.cores.exoneracao || config.cores.padrao)
      .setTitle("🗑️ Remover Opção de Ticket")
      .setDescription("Selecione abaixo a opção que deseja remover do painel de tickets:");

    return interaction.update({
      content: null,
      embeds: [embed],
      components: [row, rowBtn],
    });
  }

  if (customId === "cfg_sel_del_ticket_opcao" && interaction.isStringSelectMenu()) {
    const idRemover = interaction.values[0];
    const opRemovida = (config.tickets.opcoes || []).find((o) => o.id === idRemover);

    config.tickets.opcoes = (config.tickets.opcoes || []).filter((o) => o.id !== idRemover);
    config.saveConfig();

    const tktMenu = buildTicketsMenu();
    return interaction.update({
      content: `✅ Opção **${opRemovida?.label || idRemover}** removida do painel de tickets e do config.json!`,
      embeds: [tktMenu.embed],
      components: tktMenu.components,
    });
  }

  if (customId === "cfg_btn_tkt_enviar") {
    const targetChannel = interaction.channel;
    const orgNome = config.organizacao.nome || "Servidor";
    const opcoes = config.tickets.opcoes || [];

    if (opcoes.length === 0) {
      return interaction.reply({
        content: "❌ Você precisa ter ao menos uma opção de ticket configurada antes de enviar o painel.",
        flags: 64,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("abrir_ticket_select")
      .setPlaceholder("📩 Selecione o assunto do seu atendimento...")
      .addOptions(
        opcoes.map((op) => ({
          label: op.label.slice(0, 100),
          description: (op.description || "").slice(0, 100),
          value: op.id,
          emoji: op.emoji || undefined,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(config.cores.padrao)
      .setTitle(`🎟️ ${config.tickets.titulo || "Central de Atendimento"} - ${orgNome}`)
      .setDescription(
        `${config.tickets.descricao || "Selecione o tipo de atendimento abaixo para abrir seu ticket privado."}\n\n` +
        `> ⏱️ **Tempo de resposta estimado:** Até 24 horas após a abertura.\n` +
        `> ⚠️ **Atenção:** Tickets abertos sem motivo ou para brincadeiras resultarão em punição.\n` +
        `> 📸 **Denúncias:** Devem conter prints ou links claros demonstrando a infração.\n\n` +
        `*Selecione abaixo o assunto correspondente ao seu atendimento:*`
      )
      .setThumbnail(config.organizacao.logoUrl || interaction.guild.iconURL() || undefined)
      .setFooter({
        text: `${orgNome} • Atendimento`,
        iconURL: config.organizacao.logoUrl || undefined,
      })
      .setTimestamp();

    await targetChannel.send({
      embeds: [embed],
      components: [row],
    });

    config.tickets.canalPainel = targetChannel.id;
    config.canais.ticket = targetChannel.id;
    config.saveConfig();

    return interaction.reply({
      content: `✅ Painel oficial de tickets publicado com sucesso em <#${targetChannel.id}>!`,
      flags: 64,
    });
  }

  // 4. Abrir Menu de Canais
  if (customId === "cfg_btn_canais" || (interaction.isStringSelectMenu() && interaction.values[0] === "menu_canais")) {
    const menu = buildCanaisListMenu();
    return interaction.update({
      content: null,
      embeds: [menu.embed],
      components: menu.components,
    });
  }

  // 5. Abrir Menu de Cargos
  if (customId === "cfg_btn_cargos" || (interaction.isStringSelectMenu() && interaction.values[0] === "menu_cargos")) {
    const menu = buildCargosListMenu();
    return interaction.update({
      content: null,
      embeds: [menu.embed],
      components: menu.components,
    });
  }

  // 6. Selecionou qual canal deseja alterar no menu
  if (customId === "cfg_sel_canal_tipo" && interaction.isStringSelectMenu()) {
    const canalKey = interaction.values[0];
    const picker = buildChannelPicker(canalKey);
    return interaction.update({
      content: null,
      embeds: [picker.embed],
      components: picker.components,
    });
  }

  // 7. Selecionou qual cargo deseja alterar no menu
  if (customId === "cfg_sel_cargo_tipo" && interaction.isStringSelectMenu()) {
    const cargoKey = interaction.values[0];
    const picker = buildRolePicker(cargoKey);
    return interaction.update({
      content: null,
      embeds: [picker.embed],
      components: picker.components,
    });
  }

  // 8. Aplicou um canal via ChannelSelectMenu
  if (customId.startsWith("cfg_apply_channel_") && interaction.isChannelSelectMenu()) {
    const canalKey = customId.replace("cfg_apply_channel_", "");
    const selectedChannelId = interaction.values[0];

    config.updateConfigField("canais", canalKey, selectedChannelId);

    const embed = new EmbedBuilder()
      .setColor(config.cores.cargoSucesso || config.cores.padrao)
      .setTitle("✅ Canal Atualizado!")
      .setDescription(
        `O canal para **${CANAIS_INFO[canalKey]?.label || canalKey}** foi configurado com sucesso para <#${selectedChannelId}>.\n` +
        `💾 *Salvo no config.json e ativo imediatamente!*`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_btn_canais")
        .setLabel("📢 Configurar Outro Canal")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("🏠 Voltar ao Painel")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.update({
      content: null,
      embeds: [embed],
      components: [row],
    });
  }

  // 9. Aplicou um cargo via RoleSelectMenu
  if (customId.startsWith("cfg_apply_role_") && interaction.isRoleSelectMenu()) {
    const cargoKey = customId.replace("cfg_apply_role_", "");
    const selectedRoleId = interaction.values[0];

    config.updateConfigField("cargos", cargoKey, selectedRoleId);
    if (cargoKey === "minimoComandos") {
      config.updateConfigField("permissoes", "cargoMinimo", selectedRoleId);
    }

    const embed = new EmbedBuilder()
      .setColor(config.cores.cargoSucesso || config.cores.padrao)
      .setTitle("✅ Cargo Atualizado!")
      .setDescription(
        `O cargo para **${CARGOS_INFO[cargoKey]?.label || cargoKey}** foi configurado com sucesso para <@&${selectedRoleId}>.\n` +
        `💾 *Salvo no config.json e ativo imediatamente!*`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cfg_btn_cargos")
        .setLabel("🛡️ Configurar Outro Cargo")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cfg_btn_voltar")
        .setLabel("🏠 Voltar ao Painel")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.update({
      content: null,
      embeds: [embed],
      components: [row],
    });
  }

  // 10. Abrir Modal de Identidade
  if (customId === "cfg_btn_identidade" || (interaction.isStringSelectMenu() && interaction.values[0] === "menu_identidade")) {
    const modal = new ModalBuilder()
      .setCustomId("cfg_modal_identidade_submit")
      .setTitle("Identidade da Comunidade");

    const inputNome = new TextInputBuilder()
      .setCustomId("cfg_in_nome")
      .setLabel("Nome da Comunidade / Servidor:")
      .setStyle(TextInputStyle.Short)
      .setValue(config.organizacao.nome || "")
      .setPlaceholder("Ex: Comunidade Discord")
      .setRequired(true)
      .setMaxLength(50);

    const inputLogo = new TextInputBuilder()
      .setCustomId("cfg_in_logo")
      .setLabel("URL da Imagem / Logo (Opcional):")
      .setStyle(TextInputStyle.Short)
      .setValue(config.organizacao.logoUrl || "")
      .setPlaceholder("https://exemplo.com/logo.png")
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputNome),
      new ActionRowBuilder().addComponents(inputLogo)
    );

    return interaction.showModal(modal);
  }

  // 11. Submissão do Modal de Identidade
  if (interaction.isModalSubmit() && customId === "cfg_modal_identidade_submit") {
    const nome = interaction.fields.getTextInputValue("cfg_in_nome").trim();
    const logoUrl = interaction.fields.getTextInputValue("cfg_in_logo").trim();

    config.updateConfigField("organizacao", "nome", nome);
    config.updateConfigField("organizacao", "logoUrl", logoUrl);

    const dashboard = buildConfigDashboard(interaction.guild);
    return interaction.update({
      content: "✅ **Identidade atualizada com sucesso e salva em config.json!**",
      embeds: [dashboard.embed],
      components: dashboard.components,
    });
  }

  // 12. Abrir Modal de Cores
  if (customId === "cfg_btn_cores" || (interaction.isStringSelectMenu() && interaction.values[0] === "menu_cores")) {
    const modal = new ModalBuilder()
      .setCustomId("cfg_modal_cores_submit")
      .setTitle("Cores dos Embeds (HEX)");

    const inputPadrao = new TextInputBuilder()
      .setCustomId("cfg_in_padrao")
      .setLabel("Cor Principal / Padrão:")
      .setStyle(TextInputStyle.Short)
      .setValue(config.cores.padrao || "#3498db")
      .setPlaceholder("#3498db")
      .setRequired(true);

    const inputSucesso = new TextInputBuilder()
      .setCustomId("cfg_in_sucesso")
      .setLabel("Cor de Sucesso / Promoção:")
      .setStyle(TextInputStyle.Short)
      .setValue(config.cores.cargoSucesso || "#00FF7F")
      .setPlaceholder("#00FF7F")
      .setRequired(true);

    const inputPerigo = new TextInputBuilder()
      .setCustomId("cfg_in_perigo")
      .setLabel("Cor de Exoneração / Punição:")
      .setStyle(TextInputStyle.Short)
      .setValue(config.cores.exoneracao || "#e74c3c")
      .setPlaceholder("#e74c3c")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputPadrao),
      new ActionRowBuilder().addComponents(inputSucesso),
      new ActionRowBuilder().addComponents(inputPerigo)
    );

    return interaction.showModal(modal);
  }

  // 13. Submissão do Modal de Cores
  if (interaction.isModalSubmit() && customId === "cfg_modal_cores_submit") {
    const corPadrao = interaction.fields.getTextInputValue("cfg_in_padrao").trim();
    const corSucesso = interaction.fields.getTextInputValue("cfg_in_sucesso").trim();
    const corPerigo = interaction.fields.getTextInputValue("cfg_in_perigo").trim();

    if (corPadrao) config.updateConfigField("cores", "padrao", corPadrao);
    if (corSucesso) config.updateConfigField("cores", "cargoSucesso", corSucesso);
    if (corPerigo) config.updateConfigField("cores", "exoneracao", corPerigo);

    const dashboard = buildConfigDashboard(interaction.guild);
    return interaction.update({
      content: "✅ **Cores atualizadas com sucesso e salvas em config.json!**",
      embeds: [dashboard.embed],
      components: dashboard.components,
    });
  }
}

module.exports = {
  buildConfigDashboard,
  handleConfigInteraction,
};
