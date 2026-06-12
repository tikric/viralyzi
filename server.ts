import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initBaileys, getWhatsAppStatus, disconnectWhatsApp, sendBaileysMessage } from "./whatsapp-baileys";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazy initializer for Gemini Client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Global In-Memory Store centered entirely on 3D Printing & TikTok / Instagram / WhatsApp ("Zap")
const db = {
  accounts: [
    { id: "1", platform: "tiktok", handle: "@imperio3d_print", name: "Império do 3D", avatar: "https://images.unsplash.com/photo-1615840287214-7fe58a8f3685?w=150", followers: 85400, active: true },
    { id: "2", platform: "instagram", handle: "@imperio3d.art", name: "Império 3D Instagram", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", followers: 23100, active: true },
    { id: "3", platform: "whatsapp", handle: "+55 (11) 99876-5432", name: "Zap Oficial Imperio3D", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", followers: 4200, active: true }
  ],
  trends: [
    { id: "t1", title: "Miniaturas de Dragão Articulado Cristalino (Satisfatório 3D)", platform: "tiktok", change: "+524%", category: "Impressão 3D/Filamentos", engagement: "Altíssimo", desc: "Vídeos ASMR destacando a flexibilidade e o brilho de dragões impressos em filamento silk arco-íris.", hashtags: ["#3dprinting #satisfying #articulateddragon #impressao3d"] },
    { id: "t2", title: "Suporte Personalizado Gamer de Headset (Darth Vader & Marvel)", platform: "instagram", change: "+310%", category: "Games/Setup", engagement: "Alto", desc: "Vídeos estéticos e carrosséis mostrando setups gamers com peças ricas em detalhes.", hashtags: ["#setupgamer #impressão3d #geekbrasil #decoracaogeek"] },
    { id: "t3", title: "Como Cobrar por Impressões 3D (Calculadora de Custos IA)", platform: "tiktok", change: "+185%", category: "Dicas/Tutoriais", engagement: "Alto", desc: "Ganchos rápidos ensinando a calcular hora-máquina, filamento e margem de lucro real.", hashtags: ["#arquitetura #engenharia #maker #impressora3d #rendaextra"] },
    { id: "t4", title: "Luminárias de Lua Realistas e Encaixes de Enigma", platform: "instagram", change: "+240%", category: "Decoração/Elegante", engagement: "Muito Alto", desc: "Vídeos no escuro acendendo luminárias impressas em 3D usando filamento translúcido.", hashtags: ["#decoracaocriativa #luminaria3d #designdeinteriores"] }
  ],
  campaigns: [
    {
      id: "v1",
      title: "ASMR Dragão Articulado de Cristal",
      platform: "tiktok",
      accountId: "1",
      status: "active",
      views: 184500,
      likes: 24300,
      shares: 6200,
      saves: 8900,
      comments: 730,
      conversionRate: 8.5,
      sentiment: { positive: 85, neutral: 12, negative: 3 },
      scheduledTime: "Publicado há 18 horas",
      leadsCaptured: 62,
      retention: [100, 91, 84, 76, 68, 59, 48]
    },
    {
      id: "v2",
      title: "Demonstração Suporte Headset Darth Vader",
      platform: "instagram",
      accountId: "2",
      status: "active",
      views: 74200,
      likes: 8500,
      shares: 1240,
      saves: 2300,
      comments: 310,
      conversionRate: 6.2,
      sentiment: { positive: 91, neutral: 7, negative: 2 },
      scheduledTime: "Publicado há 2 dias",
      leadsCaptured: 19,
      retention: [100, 94, 88, 80, 72, 65, 59]
    },
    {
      id: "v3",
      title: "Promoção de Lançamento Litofania WhatsApp",
      platform: "whatsapp",
      accountId: "3",
      status: "active",
      views: 12400,
      likes: 1900,
      shares: 3200,
      saves: 1400,
      comments: 540,
      conversionRate: 15.4,
      sentiment: { positive: 94, neutral: 5, negative: 1 },
      scheduledTime: "Campanha WhatsApp há 3 dias",
      leadsCaptured: 83,
      retention: [100, 98, 95, 91, 88, 85, 80]
    }
  ],
  leads: [
    { id: "l1", name: "Claudio Souza", email: "claudio.3d@yahoo.com.br", handle: "+55 (11) 98765-4321", interest: "Dragão Articulado Silk", triggerComment: "QUERO O DRAGÃO", sourceVideo: "ASMR Dragão Articulado de Cristal", date: "Hoje, 10:45", crmStatus: "Synced", crm: "WhatsApp Link / Direct" },
    { id: "l2", name: "Beatriz Mello", email: "gabi.make@gmail.com", handle: "@beatriz_geek", interest: "Suporte Headset Darth Vader", triggerComment: "VALOR?", sourceVideo: "Demonstração Suporte Headset Darth Vader", date: "Hoje, 09:12", crmStatus: "Synced", crm: "Instagram Direct Direct" },
    { id: "l3", name: "Eldenir Ribeiro", email: "elder.rib@hotmail.com", handle: "+55 (21) 97112-9080", interest: "Luminária de Lua Personalizada", triggerComment: "Encomendar no Zap", sourceVideo: "Promoção de Lançamento Litofania WhatsApp", date: "Ontem, 21:15", crmStatus: "Synced", crm: "ActiveCampaign" }
  ],
  schedulers: [
    { id: "s1", title: "Como é impressa a caneca Octogonal Geek", platform: "tiktok", accountId: "1", scheduledFor: "Hoje - 18:30 (Pico)", status: "scheduled", reason: "Horário de volta do trabalho. Vídeos de timelapse 3D performam 30% melhor." },
    { id: "s2", title: "Unboxing Filamento Dupla Cor Metálico", platform: "instagram", accountId: "2", scheduledFor: "Amanhã - 12:00 (Pico)", status: "scheduled", reason: "Visualização rápida antes do almoço estimula as vendas com o link da bio." }
  ],
  notifications: [
    { id: "n1", title: "Pico de Vendas no Zap! 📈", message: "12 contatos solicitaram catálogo 3D após o último direct de promoção no Instagram.", platform: "whatsapp", type: "crm", time: "Há 5 min", read: false },
    { id: "n2", title: "Vídeo Ultra-Viral TikTok! 🔥", message: "O timelapse do Dragão de Cristal alcançou 180k visualizações. Configure seu fluxo de respostas imediatas.", platform: "tiktok", type: "alert", time: "Há 25 min", read: false }
  ],
  crmIntegration: {
    status: "Active",
    selectedCrm: "WhatsApp Direto / RD Station",
    apiKeyConfigured: true,
    webhookUrl: "https://viralyze.site/webhooks/whatsapp-leads-auto",
    autoDm: true,
    triggerKeywords: ["QUERO", "VALOR", "CATALOGO", "PREÇO", "COMPRAR"]
  },
  apiCredentials: {
    whatsappEngine: "direct",
    whatsapp: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
      phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "viralyze_token"
    },
    evolution: {
      apiUrl: process.env.EVOLUTION_API_URL || "",
      apiKey: process.env.EVOLUTION_API_KEY || "",
      instance: process.env.EVOLUTION_INSTANCE || ""
    },
    instagram: {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
      businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || ""
    },
    facebook: {
      accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "",
      pageId: process.env.FACEBOOK_PAGE_ID || ""
    }
  },
  
  // Custom Daily Messages Campaigns database
  broadcasts: [
    { id: "b1", title: "Mensagem Semanal de Promoção de Dragões", message: "Olá Maker! 🐉 Acabamos de liberar uma tiragem limitada dos nossos incríveis Dragões Articulados de Cristal em Silk Rainbow! São mais de 45cm de puro brilho 3D. Quer garantir o seu com 15% OFF + frete grátis e suporte grátis? Responda 'DRAGÃO15' aqui no WhatsApp! 🚀", platform: "whatsapp", category: "Novidades", sentCount: 1450, conversions: 240, status: "sent", date: "Hoje, 09:00" },
    { id: "b2", title: "Seguimento de Carrinho Abandonado", message: "E aí! Vimos que você se interessou pelo nosso Suporte Gamer Darth Vader Premium 3D, mas não concluiu seu pedido. 🎮 Vou te dar um filamento extra ou frete grátis se fechar hoje! Clique no link para falar direto com o designer no Zap: https://wa.me/5511998765432?text=QUERO", platform: "instagram", category: "Vendas", sentCount: 380, conversions: 90, status: "active", date: "Segunda-feira" },
  ],

  // Pre-configured list of mock products for easy AI generation
  products: [
    { name: "Dragão Articulado de Cristal Silk", category: "Decoração/Colecionáveis", defaultPrompt: "Filamento Silk Metálico, 45cm de comprimento, articulado que se move sozinho de forma relaxante." },
    { name: "Suporte de Headset Darth Vader Premium", category: "Gamer Setup", defaultPrompt: "Suporte ultra-resistente pintado a mão ou filamento preto Premium, encaixe perfeito para headsets gamer pro." },
    { name: "Sapo de Sorte com Moeda na Boca Articulado", category: "Cultura Geek/Místicas", defaultPrompt: "Sapo asteca de feng shui, moeda removível, filamento dourado que simula ouro escovado." },
    { name: "Luminária Decorativa Stark Tech Stark Industries", category: "Marvel/Nerds", defaultPrompt: "Luminária de mesa com luzes LED customizáveis, formato do reator Arc do Homem de Ferro." }
  ]
};

// API: Get app state
app.get("/api/dashboard", (req, res) => {
  res.json({
    accounts: db.accounts,
    trends: db.trends,
    campaigns: db.campaigns,
    schedulers: db.schedulers,
    leads: db.leads,
    notifications: db.notifications,
    crmIntegration: db.crmIntegration,
    broadcasts: db.broadcasts,
    products: db.products,
    apiCredentials: db.apiCredentials
  });
});

// API: Save Account
app.post("/api/accounts", (req, res) => {
  const { platform, handle, name, avatar } = req.body;
  if (!platform || !handle || !name) {
    return res.status(400).json({ error: "Parâmetros de conta incompletos." });
  }

  const newAccount = {
    id: String(db.accounts.length + 1),
    platform,
    handle,
    name,
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    followers: Math.floor(Math.random() * 25000) + 1200,
    active: true
  };
  db.accounts.push(newAccount);
  res.json({ success: true, account: newAccount, accounts: db.accounts });
});

// NEW API: Delete connected channel
app.delete("/api/accounts/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = db.accounts.length;
  db.accounts = db.accounts.filter(acc => acc.id !== id);
  if (db.accounts.length === initialLen) {
    return res.status(404).json({ error: "Conta não localizada." });
  }
  res.json({ success: true, accounts: db.accounts });
});

// API: Add Scheduled Video
app.post("/api/scheduler", (req, res) => {
  const { title, platform, accountId, scheduledFor, reason } = req.body;
  if (!title || !platform || !accountId) {
    return res.status(400).json({ error: "Título, plataforma e conta requeridos." });
  }
  const newSch = {
    id: "s" + (db.schedulers.length + 1),
    title,
    platform,
    accountId,
    scheduledFor: scheduledFor || "Hoje - 21:00 (Pico)",
    status: "scheduled" as const,
    reason: reason || "O algoritmo do Viralyze projeta tráfego elevado para produtos 3D neste horário."
  };
  db.schedulers.push(newSch);
  res.json({ success: true, item: newSch, schedulers: db.schedulers });
});

// API: Trigger Lead registration
app.post("/api/leads", (req, res) => {
  const { name, email, handle, sourceVideo, triggerComment, crm } = req.body;
  const newLead = {
    id: "l" + (db.leads.length + 1),
    name: name || "Cliente do Zap",
    email: email || "compras.3d@viralyzemaker.com",
    handle: handle || "+55 (11) 94811-3040",
    interest: `Interesse em Impressão (${triggerComment || "COMPRAR"})`,
    triggerComment: triggerComment || "COMPRAR",
    sourceVideo: sourceVideo || "Vídeo Tendência 3D",
    date: "A alguns segundos",
    crmStatus: "Synced" as const,
    crm: crm || db.crmIntegration.selectedCrm
  };
  db.leads.unshift(newLead);
  res.json({ success: true, lead: newLead, leads: db.leads });
});

// NEW API: Get & Post Broadcast automated messages (Inspired by https://tikric.github.io/mensagens/)
app.get("/api/broadcasts", (req, res) => {
  res.json(db.broadcasts);
});

app.post("/api/broadcasts", (req, res) => {
  const { title, message, platform, category } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: "Título e mensagem do comunicado de vendas são necessários." });
  }

  const newBc = {
    id: "b" + (db.broadcasts.length + 1),
    title,
    message,
    platform: platform || "whatsapp",
    category: category || "Promoção 3D",
    sentCount: 0,
    conversions: 0,
    status: "active" as const,
    date: "Agora mesmo"
  };
  db.broadcasts.unshift(newBc);
  res.json({ success: true, broadcast: newBc, broadcasts: db.broadcasts });
});

// Helper function to send real WhatsApp message via Meta Graph API
async function sendRealWhatsAppMessage(phoneId: string, accessToken: string, to: string, bodyText: string) {
  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: bodyText
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Meta retornou status ${response.status}: ${errorText}`);
  }
  return await response.json();
}

// Helper function to send WhatsApp messages via Evolution API (QR Code option)
async function sendEvolutionWhatsAppMessage(apiUrl: string, apiKey: string, instance: string, to: string, bodyText: string) {
  const base = apiUrl.replace(/\/$/, "");
  const url = `${base}/message/sendText/${instance}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      number: to,
      options: {
        delay: 1200,
        presence: "composing"
      },
      textMessage: {
        text: bodyText
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Evolution retornou status ${response.status}: ${errorText}`);
  }
  return await response.json();
}

// Helper function to send WhatsApp messages dynamically via local integracao.js
async function sendDirectWhatsAppMessage(to: string, bodyText: string) {
  // 1. Tentar enviar via Baileys real se estiver conectado
  const wppStatus = await getWhatsAppStatus();
  if (wppStatus.status === "connected") {
    console.log(`[Zap Direto] Motor Baileys conectado! Enviando mensagem direta real para ${to}`);
    await sendBaileysMessage(to, bodyText);
    return { success: true, method: "baileys", target: to };
  }

  // 2. Se não estiver ativo, tentamos o fallback no arquivo customizado integracao.js
  console.log(`[Zap Direto] Baileys desativado ou desconectado. Tentando fallback no integracao.js...`);
  const filePath = path.join(process.cwd(), "integracao.js");
  if (!fs.existsSync(filePath)) {
    throw new Error("Sua sessão do WhatsApp local (Baileys) não está conectada. Por favor, escaneie o QR Code no painel ou verifique o arquivo 'integracao.js'.");
  }

  try {
    // Clear require cache to enable live reloading of your custom Code updates immediately
    try {
      delete require.cache[require.resolve(filePath)];
    } catch (e) {}

    const dynamicRequire = eval("require");
    const integracao = dynamicRequire(filePath);
    
    if (typeof integracao.enviar !== "function") {
      throw new Error("A função 'enviar(contatoId, mensagem)' não foi exportada pelo arquivo 'integracao.js'. Verifique suas exportações.");
    }

    const cleanNumber = to.replace(/\D/g, "");
    const formattedId = cleanNumber.includes("@") ? cleanNumber : `${cleanNumber}@c.us`;

    console.log(`[Zap Direto] Disparando execução local integracao.js para: ${formattedId}`);
    await integracao.enviar(formattedId, bodyText);
    return { success: true, method: "integracao.js", target: formattedId };
  } catch (err: any) {
    console.error("Falha ao executar integracao.js:", err);
    throw new Error(`WhatsApp deslogado. Falha na tentativa de fallback via integracao.js: ${err.message}`);
  }
}

// API: Send direct message campaign (supports Meta and Evolution API alternatives)
app.post("/api/broadcasts/:id/send", async (req, res) => {
  const { id } = req.params;
  const { testPhoneNumber } = req.body || {};
  const bc = db.broadcasts.find(b => b.id === id);
  if (!bc) {
    return res.status(404).json({ error: "Mensagem diária não encontrada." });
  }

  bc.status = "sent";
  
  // Decide whether to dispatch a real Meta/Evolution WhatsApp message or simulate
  let realApiUsed = false;
  let apiLog = "Simulado com sucesso (Mocks).";
  
  const targetPhone = testPhoneNumber || (db.leads[0]?.handle?.startsWith("+") ? db.leads[0].handle : "");

  if (bc.platform === "whatsapp" && targetPhone) {
    const cleanPhone = targetPhone.replace(/\D/g, "");
    if (cleanPhone) {
      const engine = db.apiCredentials.whatsappEngine || "direct";
      
      if (engine === "direct") {
        try {
          await sendDirectWhatsAppMessage(cleanPhone, bc.message);
          realApiUsed = true;
          apiLog = `Mensagem enviada com sucesso de forma DIRETAMENTE via integracao.js para +${cleanPhone}`;
          bc.sentCount = (bc.sentCount || 0) + 1;
          bc.conversions = (bc.conversions || 0) + 1;
        } catch (err: any) {
          console.error("Erro ao enviar pelo WhatsApp Direto (integracao.js):", err);
          apiLog = `Falha no WhatsApp Direto (integracao.js): ${err.message}`;
        }
      } else if (engine === "evolution") {
        const hasEvolution = db.apiCredentials.evolution && 
                             db.apiCredentials.evolution.apiUrl && 
                             db.apiCredentials.evolution.apiKey && 
                             db.apiCredentials.evolution.instance;
        if (hasEvolution) {
          try {
            await sendEvolutionWhatsAppMessage(
              db.apiCredentials.evolution.apiUrl,
              db.apiCredentials.evolution.apiKey,
              db.apiCredentials.evolution.instance,
              cleanPhone,
              bc.message
            );
            realApiUsed = true;
            apiLog = `Enviada com sucesso via Evolution API em tempo de execução QR para +${cleanPhone}`;
            bc.sentCount = (bc.sentCount || 0) + 1;
            bc.conversions = (bc.conversions || 0) + 1;
          } catch (err: any) {
            console.error("Erro ao enviar pela Evolution API:", err);
            apiLog = `Falha na Evolution API: ${err.message}`;
          }
        } else {
          apiLog = "Evolution API selecionada, mas credenciais não foram configuradas.";
        }
      } else if (engine === "whatsapp") {
        const hasMeta = db.apiCredentials.whatsapp &&
                           db.apiCredentials.whatsapp.accessToken &&
                           db.apiCredentials.whatsapp.phoneId;
        if (hasMeta) {
          try {
            await sendRealWhatsAppMessage(
              db.apiCredentials.whatsapp.phoneId,
              db.apiCredentials.whatsapp.accessToken,
              cleanPhone,
              bc.message
            );
            realApiUsed = true;
            apiLog = `Enviada com sucesso via WhatsApp Cloud API Oficial para +${cleanPhone}`;
            bc.sentCount = (bc.sentCount || 0) + 1;
            bc.conversions = (bc.conversions || 0) + 1;
          } catch (err: any) {
            console.error("Erro ao enviar pelo WhatsApp Real:", err);
            apiLog = `Falha na API Oficial da Meta: ${err.message}`;
          }
        } else {
          apiLog = "WhatsApp Cloud API selecionada, mas credenciais (Access Token / Phone ID) não foram configuradas.";
        }
      }
    }
  }

  if (!realApiUsed) {
    bc.sentCount = (bc.sentCount || 0) + Math.floor(Math.random() * 500) + 150;
    bc.conversions = (bc.conversions || 0) + Math.floor(Math.random() * 40) + 12;
  }
  
  bc.date = "Disparado agora";

  // Trigger push alert
  db.notifications.unshift({
    id: "n" + Math.random().toString(36).substr(2, 4),
    title: realApiUsed ? `Disparo WhatsApp Real Concluído! 🚀` : `Disparo Diário Concluído! 🚀`,
    message: realApiUsed 
      ? `Destinatário: +${targetPhone}. Detalhes: ${apiLog}`
      : `A campanha "${bc.title}" foi simulada de forma automática para ${bc.sentCount} contatos.`,
    platform: bc.platform as any,
    type: "crm",
    time: "A alguns instantes",
    read: false
  });

  res.json({ 
    success: true, 
    broadcast: bc, 
    broadcasts: db.broadcasts, 
    notifications: db.notifications,
    realApiUsed,
    apiLog
  });
});

// NEW API: Generate formatted posts directly from a user's product photo representation & details
app.post("/api/generate-from-photo", async (req, res) => {
  const { productName, productDescription, materialType, customDetails } = req.body;
  if (!productName) {
    return res.status(400).json({ error: "Por favor, selecione ou descreva um produto 3D." });
  }

  const details = productDescription || "Um produto impresso em 3D de alta qualidade com acabamento primoroso.";
  const mat = materialType || "Filamento Silk Orgânico PLA de Alta Densidade";

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Você é o maior redator e Social Media especializado em vendas e marketing de produtos de Impressão 3D.
Quero que você crie um pacote completo de posts de vendas para o produto "${productName}".
Formatos exigidos: TikTok, Instagram, Facebook (focado em grupos de venda e marketplace) e WhatsApp (mensagem pronta para lista de transmissão VIP).
Materiais utilizados: ${mat}.
Características e detalhes adicionais: ${details} / ${customDetails || ""}.

Gere um formato JSON com quatro versões completas de posts em português do Brasil (PT-BR) com as chaves exatas descritas abaixo:
{
  "tiktok": {
    "hook": "Gancho verbal matador de 3 segundos focado no visual do produto 3D",
    "musicStyle": "Estilo de trilha ou áudio em alta satisfatório sugerido",
    "vocals": "Locução/Falas cativantes de 30 segundos explicando os detalhes",
    "caption": "Legenda curta focada em engajamento orgânico",
    "hashtags": ["#impressao3d", "#artesanato", "#geek", "#colecionador"]
  },
  "instagram": {
    "carouselIdea": "Roteiro de 3 slides (fotos/carrossel) para este produto 3D",
    "caption": "Legenda atrativa e estética para o feed com apelo visual, preço sugerido e CTA firme",
    "hashtags": ["#decoracao3d", "#impressora3d", "#inovacao", "#casadecorada"]
  },
  "facebook": {
    "postText": "Texto completo e persuasivo voltado para grupos de canais, páginas ou Marketplace locais com preço visível, benefícios do acabamento e link de chamada para Zap.",
    "hashtags": ["#decoracao", "#vendas", "#artigo3d", "#artesanatobrasil"]
  },
  "whatsapp": {
    "boldOffer": "Mensagem persuasiva e pronta ideal para enviar em grupos de vendas, broadcast diários, ou no privado, usando emojis e espaçamentos profissionais. Deve conter lista de benefícios e chamada direta para falar com o atendente."
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.9
        }
      });

      const resText = response.text || "{}";
      const outputs = JSON.parse(resText);
      return res.json({ success: true, source: "gemini", outputs });
    } catch (err: any) {
      console.error("Erro no Gemini ao gerar postagem de produto:", err.message);
    }
  }

  // Realistic mock response fallback for 3D Printing templates
  const fallback = {
    tiktok: {
      hook: `🤯 Isso NÃO é um objeto de loja comum! Você nunca viu nada que se mova desse jeito... feito em Impressão 3D de alta performance!`,
      musicStyle: "Trilha Lo-Fi relaxante ou som mecânico simulando o motor da impressora 3D",
      vocals: `Esse é o segredo de como transformamos plástico biodegradável em um incrível "${productName}" com precisão de mícron. Olha as texturas incríveis dele! É articulado, fita perfeita p/ seu setup de games ou quarto. Curtiu? Deixa seu comentário.`,
      caption: `Seu setup gamer precisa de um upgrade de qualidade? 👾 Comente 'CUPOM' e eu te envio o preço de lançamento do ${productName} por direct!`,
      hashtags: ["#impressao3d", `#${productName.toLowerCase().replace(/\s/g, "")}`, "#geekbrasil", "#maker", "#decoracaocriativa"]
    },
    instagram: {
      carouselIdea: "Slide 1: Foto close-up premium destacando o filamento silk metálico | Slide 2: Vídeo curto mostrando a flexibilidade/articulado | Slide 3: Caixa de presente personalizada em 3D",
      caption: `🎨 NOVIDADE DA SEMANA: ${productName.toUpperCase()}! 🔥\n\nPecinhas ricas em detalhes que dão um toque de sofisticação e estilo geek ao seu setup gamer ou decoração de sala.\n\n✅ Impresso em filamento de alta resistência.\n✅ Acabamento biodegradável ecológico super brilhante.\n✅ Disponível em várias cores metálicas e foscas!\n\nDe R$ 120,00 por apenas R$ 79,90 com Frete Grátis esta semana.\n\n👇 Comente 'QUERO' que meu bot de atendimento te envia o link do catálogo e fotos no direct!`,
      hashtags: ["#geeklife", "#setupdecor", "#decoracaointeriores", "#lojadejogos", "#impresso3d", "#presentecriativo"]
    },
    facebook: {
      postText: `🙌 PROCURANDO PRESENTE ÚNICO OU DECORAÇÃO PREMIUM COM EXCLUSIVIDADE?\n\nVeja esse espetacular ${productName}! Perfeito para enfeitar seu setup, quarto gamer ou escritório. Impresso em altíssima qualidade de detalhes com filamento especial biodegradável brilhoso.\n\n💰 Valor Promocional na Viralyze: ${customDetails || "R$ 79,90"}\n📍 Entregamos em toda a região com embalagem reforçada.\n\nFale diretamente conosco no Zap para reservar o seu lote ou ver outras cores disponíveis no catálogo!\n👉 Enviar mensagem: https://wa.me/5511998765432?text=QUERO`,
      hashtags: ["#compras", "#impressao3d", "#geekbrasil", "#novidades", "#gamerbrasil"]
    },
    whatsapp: {
      boldOffer: `🔥 *LANÇAMENTO EXCLUSIVO DE IMPRESSÃO 3D!* 🔥\n\nFala, Maker e Amante Geek! Olha essa novidade fantástica que acaba de sair das nossas impressoras:\n\n✨ *${productName}* ✨\n\nO produto dos seus sonhos esculpido mícron por mícron com filamento biodegradável premium.\n\n*Por que garantir o seu hoje?*\n💎 Textura metálica exclusiva que muda com a luz\n🤖 Totalmente articulado de alta interatividade\n🎁 Edição especial limitada para esta lista VIP\n\n💵 *Apenas 3x de R$ 26,00* sem juros!\n📦 Enviamos para todo o Brasil ou retirada imediata.\n\n👉 *Fale comigo agora no chat e digite 'FECHAR' para garantir o frete grátis!:* https://wa.me/5511998765432?text=FECHAR`
    }
  };

  res.json({ success: true, source: "mock", outputs: fallback });
});

// API: Sentiment Analysis for 3D comments with Gemini or fallback
app.post("/api/sentiment-analysis", async (req, res) => {
  const { campaignTitle, comments } = req.body;
  let text = comments || "Quero saber o preço! Tem na cor azul escuro? Entrega rápida para Curitiba?";

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Analise o sentimento deste grupo de comentários de redes sociais de uma loja de Impressão 3D para o vídeo promocional "${campaignTitle}". Retorne no exato formato JSON:
{
  "positive": 85,
  "neutral": 10,
  "negative": 5,
  "summary": "Resumo rápido de uma frase sobre as maiores vontades e necessidades dos clientes e recomendação.",
  "viralReason": "Breve comentário sobre o que atraiu mais atenção na peça impressa 3D."
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const data = JSON.parse(response.text || "{}");
      return res.json({ success: true, source: "gemini", analysis: data });
    } catch (err) {
      console.error(err);
    }
  }

  res.json({
    success: true,
    source: "local-algorithm",
    analysis: {
      positive: 92,
      neutral: 6,
      negative: 2,
      summary: "90% das interações perguntam sobre o preço com entrega para regiões de SP/RJ. Altíssimo interesse de compra por impulso.",
      viralReason: "A beleza do brilho do filamento Silk Rainbow gerou enorme atração visual nos primeiros 3s de vídeo."
    }
  });
});

// API: Write general script with custom title inputs 
app.post("/api/generate-viral-content", async (req, res) => {
  const { trendTitle, tone, duration, platform, targetAudience } = req.body;
  const theme = trendTitle || "Dragão articulado de filamento 3D";
  
  const prompt = `Gere um roteiro incrivelmente viral de vídeo de 30s focado em venda de produto de Impressão 3D: "${theme}". Canal: "${platform || "tiktok"}". Tom: "${tone || "Hype"}".
Retorne em JSON:
{
  "title": "Título magnético do vídeo",
  "hook": "Gancho matador inicial de 3 segundos",
  "script": [
    {"scene": 1, "visuals": "Sujestão visual", "vocals": "Locução falada"}
  ],
  "caption": "Legenda perfeita com hashtags",
  "hashtags": ["lista", "de", "tags"],
  "postingRecommendations": "Melhor hora sugerida e hashtag extra",
  "crmLeadWorkflow": "Ação recomendada ao receber comentários"
}`;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.9
        }
      });
      return res.json({ success: true, source: "gemini", content: JSON.parse(response.text || "{}") });
    } catch (err) {
       console.error(err);
    }
  }

  res.json({ 
    success: true,
    source: "mock",
    content: {
      title: `O SEGREDO REVELADO: ${theme}`,
      hook: "⚠️ Alerta de satisfação extrema! Não pisque senão você perde a melhor parte dessa transformação 3D.",
      script: [
        { scene: 1, visuals: "Timelapse acelerado da mesa de impressão do bico de metal de forma hipnotizante.", vocals: "Isso é o que acontece quando você escolhe o filamento correto e configura as camadas com precisão incrível no bico de 0.4mm." },
        { scene: 2, visuals: "Retirando a peça articulada brilhante da mesa flexível de PEI magnético.", vocals: "Fica perfeito, resistente, sem marcas de suporte e pronto pra embelezar o seu setup." }
      ],
      caption: `Qual nota você dá para essa impressão finalizada? 👇 Deixe nos comentários sua cor favorita para mim imprimir amanhã!`,
      hashtags: ["#impressora3d #timelapse #design #gamerbr #lojaonline"],
      postingRecommendations: "A IA Viralyze recomenda postar esta timelapse às 19:15 quando o engajamento orgânico de entretenimento satisfatório atinge o teto de visualização diária.",
      crmLeadWorkflow: "Mensagem imediata via direct com fotos da peça se o usuário comentar 'PREÇO' ou 'QUERO'"
    }
  });
});

// --- METAS & WHATSAPP CLOUD APIS INTEGRATION ENDPOINTS ---

// GET configurations status and current values
app.get("/api/api-credentials", (req, res) => {
  res.json({
    whatsappEngine: db.apiCredentials.whatsappEngine || "direct",
    whatsapp: {
      accessToken: db.apiCredentials.whatsapp.accessToken,
      phoneId: db.apiCredentials.whatsapp.phoneId,
      verifyToken: db.apiCredentials.whatsapp.verifyToken,
    },
    evolution: db.apiCredentials.evolution || {
      apiUrl: "",
      apiKey: "",
      instance: ""
    },
    instagram: {
      accessToken: db.apiCredentials.instagram.accessToken,
      businessAccountId: db.apiCredentials.instagram.businessAccountId,
    },
    facebook: {
      accessToken: db.apiCredentials.facebook.accessToken,
      pageId: db.apiCredentials.facebook.pageId,
    }
  });
});

// POST to update credentials
app.post("/api/api-credentials", (req, res) => {
  const { whatsappEngine, whatsapp, evolution, instagram, facebook } = req.body;
  
  if (whatsappEngine) {
    db.apiCredentials.whatsappEngine = whatsappEngine;
  }
  if (whatsapp) {
    db.apiCredentials.whatsapp = {
      ...db.apiCredentials.whatsapp,
      ...whatsapp
    };
  }
  if (evolution) {
    db.apiCredentials.evolution = {
      ...(db.apiCredentials.evolution || {}),
      ...evolution
    };
  }
  if (instagram) {
    db.apiCredentials.instagram = {
      ...db.apiCredentials.instagram,
      ...instagram
    };
  }
  if (facebook) {
    db.apiCredentials.facebook = {
      ...db.apiCredentials.facebook,
      ...facebook
    };
  }
  
  db.notifications.unshift({
    id: "n" + Math.random().toString(36).substr(2, 4),
    title: "Chaves de API Atualizadas ⚙️",
    message: `As credenciais e motor WhatsApp (${db.apiCredentials.whatsappEngine || "direct"}) foram salvos com sucesso no servidor.`,
    platform: "system",
    type: "alert",
    time: "Agora mesmo",
    read: false
  });

  res.json({ success: true, apiCredentials: db.apiCredentials, notifications: db.notifications });
});

// GET custom integracao.js content
app.get("/api/integracao-code", (req, res) => {
  const filePath = path.join(process.cwd(), "integracao.js");
  try {
    if (fs.existsSync(filePath)) {
      const code = fs.readFileSync(filePath, "utf-8");
      return res.json({ exists: true, code });
    }
    res.json({ exists: false, code: "" });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao ler integracao.js: " + err.message });
  }
});

// POST custom integracao.js content
app.post("/api/integracao-code", (req, res) => {
  const { code } = req.body;
  if (typeof code !== "string") {
    return res.status(400).json({ error: "O campo 'code' deve conter uma string com o código fonte." });
  }
  const filePath = path.join(process.cwd(), "integracao.js");
  try {
    fs.writeFileSync(filePath, code, "utf-8");
    
    db.notifications.unshift({
      id: "n" + Math.random().toString(36).substr(2, 4),
      title: "Código Direct Link Salvo! 🐍",
      message: "Seu arquivo de automação local (integracao.js) foi atualizado fisicamente no servidor Node.js.",
      platform: "system",
      type: "alert",
      time: "Agora mesmo",
      read: false
    });
    
    res.json({ success: true, notifications: db.notifications });
  } catch (err: any) {
    console.error("Erro ao gravar integracao.js:", err);
    res.status(500).json({ error: "Erro ao gravar arquivo integracao.js: " + err.message });
  }
});

// --- BAILEYS DIRECT API CHANNELS CONTROL ---

app.get("/api/whatsapp/status", async (req, res) => {
  const statusInfo = await getWhatsAppStatus();
  res.json(statusInfo);
});

app.post("/api/whatsapp/connect", async (req, res) => {
  try {
    await initBaileys();
    res.json({ success: true, message: "Baileys init triggered." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/whatsapp/disconnect", async (req, res) => {
  try {
    await disconnectWhatsApp();
    db.notifications.unshift({
      id: "n" + Math.random().toString(36).substr(2, 4),
      title: "Zap Desconectado 🔌",
      message: "Sessão do WhatsApp Baileys foi encerra de forma bem sucedida no servidor.",
      platform: "whatsapp",
      type: "alert",
      time: "Agora mesmo",
      read: false
    });
    res.json({ success: true, message: "Baileys session disconnected.", notifications: db.notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Meta Platform Webhook Verification GET: handles webhook handshake with Meta developers dashboard
app.get("/api/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const savedVerifyToken = db.apiCredentials.whatsapp.verifyToken || "viralyze_token";

  if (mode && token) {
    if (mode === "subscribe" && token === savedVerifyToken) {
      console.log("[Meta Webhook] Verificado com sucesso!");
      return res.status(200).send(challenge);
    } else {
      console.log("[Meta Webhook] Erro na verificação: token incorreto");
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

// Meta Platform Webhook Event Receiver POST: handles live comments or messages on WhatsApp
app.post("/api/webhook/whatsapp", async (req, res) => {
  const body = req.body;
  console.log("[Meta Webhook] Recebido evento:", JSON.stringify(body));
  
  if (body.object === "whatsapp_business_account") {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const contacts = value?.contacts;
      const messages = value?.messages;

      if (messages && messages[0]) {
        const msg = messages[0];
        const from = msg.from; // Sender number
        const text = msg.text?.body || "";
        const name = contacts?.[0]?.profile?.name || "Cliente Real Webhook";

        console.log(`[Webhook WhatsApp] Nova mensagem de ${name} (+${from}): ${text}`);

        // Register as Hot Lead
        const lowerText = text.trim().toUpperCase();
        const keywords = db.crmIntegration.triggerKeywords.map(k => k.toUpperCase());
        const matched = keywords.some(k => lowerText.includes(k));

        const newLead = {
          id: "l" + (db.leads.length + 1),
          name: name,
          email: "leads.meta@cliente.com",
          handle: "+" + from,
          interest: matched ? `Interesse via Gatilho ("${text}")` : `Interativo (${text})`,
          triggerComment: text,
          sourceVideo: "WhatsApp Real-Time API",
          date: "Agora mesmo",
          crmStatus: "Synced" as const,
          crm: db.crmIntegration.selectedCrm
        };
        db.leads.unshift(newLead);

        // Send Push Notify to UI
        db.notifications.unshift({
          id: "n" + Math.random().toString(36).substr(2, 4),
          title: `Mensagem de WhatsApp Real! 📈`,
          message: `O contato ${name} (+${from}) enviou uma mensagem: "${text}". Capturado instantaneamente!`,
          platform: "whatsapp",
          type: "crm",
          time: "Agora mesmo",
          read: false
        });

        // Trigger Auto Answer if token and phoneId are present
        if (db.crmIntegration.autoDm && db.apiCredentials.whatsapp.accessToken && db.apiCredentials.whatsapp.phoneId) {
          let customMsg = `Olá, ${name}! Nós recebemos seu contato na nossa loja de Impressão 3D. Em breve um designer de miniaturas vai te atender.`;
          if (matched) {
            customMsg = `Olá ${name}! 🐉 Você digitou a palavra de ativação "${text}".\n\nAqui está o catálogo premium de miniaturas articuladas e suportes personalizados da nossa loja!\n\nUse o código *VIP3D* para 10% de desconto e frete prioritário no seu pedido de hoje!`;
          }
          await sendRealWhatsAppMessage(
            db.apiCredentials.whatsapp.phoneId,
            db.apiCredentials.whatsapp.accessToken,
            from,
            customMsg
          );
        }
      }
    } catch (e: any) {
      console.error("[Webhook WhatsApp] Falha ao processar evento:", e.message);
    }
  }

  // Meta expects 200 OK for every webhook payload
  res.sendStatus(200);
});

app.post("/api/crm-config", (req, res) => {
  const { selectedCrm, autoDm, triggerKeywords } = req.body;
  if (selectedCrm) db.crmIntegration.selectedCrm = selectedCrm;
  if (autoDm !== undefined) db.crmIntegration.autoDm = autoDm;
  if (triggerKeywords) db.crmIntegration.triggerKeywords = triggerKeywords;
  res.json({ success: true, crmIntegration: db.crmIntegration });
});

app.post("/api/notifications/clear", (req, res) => {
  db.notifications.forEach(n => n.read = true);
  res.json({ success: true, notifications: db.notifications });
});

app.get("/api/export-report", (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const reportData = {
    platform: "Viralyze Impressão 3D - Relatório Mensal",
    period: "Últimos 30 Dias (Junho 2026)",
    generatedBy: "Michely B.",
    summary: {
      totalViews: db.campaigns.reduce((sum, c) => sum + c.views, 0),
      totalLikes: db.campaigns.reduce((sum, c) => sum + c.likes, 0),
      totalLeads: db.leads.length,
      averageSentimentPositive: Math.round(db.campaigns.reduce((sum, c) => sum + c.sentiment.positive, 0) / db.campaigns.length),
    },
    campaigns: db.campaigns,
    leadsCaptured: db.leads,
    broadcasts: db.broadcasts
  };

  res.setHeader('Content-disposition', `attachment; filename=viralyze_3dprint_report_${today}.json`);
  res.setHeader('Content-type', 'application/json');
  res.write(JSON.stringify(reportData, null, 2));
  res.end();
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Viralyze 3D] Rodando com sucesso na porta ${PORT}`);
    // Boot Baileys WhatsApp local engine background
    initBaileys().catch(err => {
      console.error("[Baileys] Erro no auto-start do Baileys:", err);
    });
  });
}

startServer();
