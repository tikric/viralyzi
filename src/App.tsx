import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Users, Sparkles, Calendar, Database, 
  Plus, CheckCircle2, ChevronRight, Bell, 
  Radio, Film, Trash2, Send, Save, Share2, Globe, Clock, Check,
  Camera, Upload, ArrowRight, MessageSquare, Copy, Eye, BarChart2, CheckSquare,
  Settings
} from "lucide-react";
import Overview from "./components/Overview";
import { 
  SocialAccount, TrendTopic, ViralCampaign, CaptureLead, 
  SchedulerItem, PushAlert, CrmConfig, GeneratedContent,
  BroadcastItem, ProductItem
} from "./types";

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai-trends" | "ai-photo" | "broadcast" | "crm">("dashboard");

  // API State
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [campaigns, setCampaigns] = useState<ViralCampaign[]>([]);
  const [schedulers, setSchedulers] = useState<SchedulerItem[]>([]);
  const [leads, setLeads] = useState<CaptureLead[]>([]);
  const [notifications, setNotifications] = useState<PushAlert[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  const [crmConfig, setCrmConfig] = useState<CrmConfig>({
    status: "Active",
    selectedCrm: "WhatsApp Direto / RD Station",
    apiKeyConfigured: true,
    webhookUrl: "https://viralyze.site/webhooks/whatsapp-leads-auto",
    autoDm: true,
    triggerKeywords: ["QUERO", "VALOR", "CATALOGO", "PREÇO", "COMPRAR"]
  });

  const [apiCredentials, setApiCredentials] = useState({
    whatsappEngine: "direct",
    whatsapp: { accessToken: "", phoneId: "", verifyToken: "viralyze_token" },
    evolution: { apiUrl: "", apiKey: "", instance: "" },
    instagram: { accessToken: "", businessAccountId: "" },
    facebook: { accessToken: "", pageId: "" }
  });

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Selected filters
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  // Notification states
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // New account form
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccHandle, setNewAccHandle] = useState("");
  const [newAccPlatform, setNewAccPlatform] = useState<"tiktok" | "instagram" | "facebook" | "whatsapp">("tiktok");

  // AI Content Trend Generator states
  const [selectedTrend, setSelectedTrend] = useState<TrendTopic | null>(null);
  const [customTrendTitle, setCustomTrendTitle] = useState("");
  const [aiTone, setAiTone] = useState("Hype Enérgico de Vendas");
  const [aiDuration, setAiDuration] = useState("30 segundos");
  const [aiPlatform, setAiPlatform] = useState<"tiktok" | "instagram" | "whatsapp">("tiktok");
  const [aiAudience, setAiAudience] = useState("Amantes de Cultura Geek, Gamers e Decoração Maker");
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // AI Photo Post Generator States
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductDetails, setCustomProductDetails] = useState("");
  const [materialType, setMaterialType] = useState("Filamento Silk Metálico PLA");
  const [customPrice, setCustomPrice] = useState("R$ 89,90");
  const [simulatedPhoto, setSimulatedPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingPhotoPost, setIsGeneratingPhotoPost] = useState(false);
  const [photoPostResult, setPhotoPostResult] = useState<{
    tiktok: { hook: string; musicStyle: string; vocals: string; caption: string; hashtags: string[] };
    instagram: { carouselIdea: string; caption: string; hashtags: string[] };
    facebook: { postText: string; hashtags: string[] };
    whatsapp: { boldOffer: string };
  } | null>(null);

  // Broadcast campaign states (daily messaging)
  const [newBcTitle, setNewBcTitle] = useState("");
  const [newBcMessage, setNewBcMessage] = useState("");
  const [newBcPlatform, setNewBcPlatform] = useState<"whatsapp" | "whatsapp" | "instagram" | "tiktok">("whatsapp");
  const [newBcCategory, setNewBcCategory] = useState("Novidades 3D");
  const [isSendingBc, setIsSendingBc] = useState<string | null>(null);

  // Sentiment Analysis states
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [activeAnalysisResult, setActiveAnalysisResult] = useState<{
    campaignId: string;
    positive: number;
    neutral: number;
    negative: number;
    summary: string;
    viralReason: string;
  } | undefined>(undefined);

  // Custom CRM setting states
  const [newTriggerWord, setNewTriggerWord] = useState("");

  // Real APIs configuration panel states
  const [apiCredTab, setApiCredTab] = useState<"whatsapp" | "evolution" | "instagram" | "facebook" | "direto">("direto");
  const [testPhoneInput, setTestPhoneInput] = useState("");
  const [isSendingTestMessage, setIsSendingTestMessage] = useState(false);
  const [copiedWebhookLink, setCopiedWebhookLink] = useState(false);

  // WhatsApp local direct code states
  const [integracaoCode, setIntegracaoCode] = useState("");
  const [isLoadingIntegracao, setIsLoadingIntegracao] = useState(false);
  const [isSavingIntegracao, setIsSavingIntegracao] = useState(false);

  // Baileys status and controllers
  const [baileysStatus, setBaileysStatus] = useState<"offline" | "connecting" | "qr" | "connected" | "error">("offline");
  const [baileysQr, setBaileysQr] = useState<string | null>(null);
  const [baileysError, setBaileysError] = useState<string | null>(null);
  const [isDisconnectingBaileys, setIsDisconnectingBaileys] = useState(false);

  // Fetch Baileys status and current QR code if available
  const fetchBaileysStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (res.ok) {
        const data = await res.json();
        setBaileysStatus(data.status);
        setBaileysQr(data.qr);
        setBaileysError(data.error);
      }
    } catch (err) {
      console.error("Erro ao obter status do Baileys:", err);
    }
  };

  // Triggers connect on Baileys
  const connectBaileys = async () => {
    try {
      await fetch("/api/whatsapp/connect", { method: "POST" });
      fetchBaileysStatus();
    } catch (err) {
      console.error(err);
    }
  };

  // Triggers disconnect and clears auth files
  const disconnectBaileys = async () => {
    setIsDisconnectingBaileys(true);
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        pushClientToast(
          "WhatsApp Desconectado 🔌",
          "Todas as credenciais de sessão do Baileys foram limpadas do servidor."
        );
      }
      fetchBaileysStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDisconnectingBaileys(false);
    }
  };

  // New scheduler state
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoPlatform, setNewVideoPlatform] = useState<"tiktok" | "instagram" | "whatsapp">("tiktok");
  const [newVideoAccount, setNewVideoAccount] = useState("");
  const [newVideoDateTime, setNewVideoDateTime] = useState("");

  // Copy success indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch custom integracao.js source code
  const fetchIntegracaoCode = async () => {
    setIsLoadingIntegracao(true);
    try {
      const res = await fetch("/api/integracao-code");
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.code) {
          setIntegracaoCode(data.code);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar integracao.js:", err);
    } finally {
      setIsLoadingIntegracao(false);
    }
  };

  // Save custom integracao.js source code
  const handleSaveIntegracaoCode = async () => {
    setIsSavingIntegracao(true);
    try {
      const res = await fetch("/api/integracao-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: integracaoCode })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        pushClientToast(
          "Código Salvo! 🔌",
          "Seu script de automação de WhatsApp Direto (integracao.js) foi gravado com sucesso no servidor!"
        );
      } else {
        alert("Falha ao salvar seu código no backend.");
      }
    } catch (err) {
      console.error(err);
      alert("Houve um erro de comunicação ao tentar salvar.");
    } finally {
      setIsSavingIntegracao(false);
    }
  };

  // Fetch initial dashboard state
  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Erro ao consultar dados da API.");
      const data = await res.json();
      setAccounts(data.accounts);
      setTrends(data.trends);
      setCampaigns(data.campaigns);
      setSchedulers(data.schedulers);
      setLeads(data.leads);
      setNotifications(data.notifications);
      setCrmConfig(data.crmIntegration);
      setBroadcasts(data.broadcasts);
      setProducts(data.products || []);
      if (data.apiCredentials) {
        setApiCredentials(data.apiCredentials);
      }
      fetchIntegracaoCode();
      
      if (data.accounts.length > 0) {
        setNewVideoAccount(data.accounts[0].id);
      }
      if (data.trends.length > 0) {
        setSelectedTrend(data.trends[0]);
      }
      if (data.products && data.products.length > 0) {
        setSelectedProduct(data.products[0]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("Falha ao comunicar com o servidor de automação Viralyze Maker.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
    fetchBaileysStatus();

    // Polling suave a cada 5 segundos para sincronizar o QR Code e status live do Baileys
    const interval = setInterval(() => {
      fetchBaileysStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handler: Add new Channel/Account
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccHandle) return;

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccName,
          handle: newAccHandle.startsWith("@") || newAccHandle.startsWith("+") ? newAccHandle : "@" + newAccHandle,
          platform: newAccPlatform
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
        setShowAddAccountModal(false);
        setNewAccName("");
        setNewAccHandle("");
        
        pushClientToast(
          `Canal ${newAccHandle} integrado!`,
          `Sua conta de vendas do ${newAccPlatform.toUpperCase()} foi conectada com sucesso ao painel da sua loja de Impressão 3D.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Remove social account/channel (Requested: "tirar os canais que eu quiser")
  const handleDeleteAccount = async (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    if (confirm(`Deseja realmente remover o canal ${acc.handle} da sua lista de integrados?`)) {
      try {
        const res = await fetch(`/api/accounts/${accountId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts);
          if (selectedAccountId === accountId) {
            setSelectedAccountId("all");
          }
          pushClientToast(
            `Canal Desconectado`,
            `O canal de rede social ${acc.handle} foi removido com sucesso de todas as automações de postagem.`
          );
        } else {
          alert("Não foi possível excluir a conta.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handler: Toggle Campaign Live Status
  const handleToggleCampaignStatus = (campaignId: string, newStatus: "active" | "paused" | "boosted") => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const extraViews = newStatus === "boosted" ? 42000 : 0;
        const extraComments = newStatus === "boosted" ? 180 : 0;
         return { 
          ...c, 
          status: newStatus,
          views: c.views + extraViews,
          comments: c.comments + extraComments,
          leadsCaptured: c.leadsCaptured + Math.floor(extraComments * (c.conversionRate / 100))
        };
      }
      return c;
    }));

    const camp = campaigns.find(c => c.id === campaignId);
    if (camp) {
      const msg = newStatus === "boosted" 
        ? `Injetando tráfego orgânico inteligente baseado em relatórios de interesse no ${camp.platform.toUpperCase()} para maximizar vendas de peças.` 
        : `Campanha de automação de respostas 3D definida como ${newStatus}.`;
      
      pushClientToast(
        `${camp.title}: ${newStatus === "boosted" ? "Aceleração Ativada" : "Ajustado"}`,
        msg
      );
    }
  };

  // Helper code to inject toast push clientside
  const pushClientToast = (title: string, message: string) => {
    const freshAlert: PushAlert = {
      id: "nc" + Math.random().toString(36).substr(2, 5),
      title,
      message,
      platform: "system",
      type: "alert",
      time: "Agora mesmo",
      read: false
    };
    setNotifications(prev => [freshAlert, ...prev]);
  };

  // Handler: Save live Meta, WhatsApp, Instagram, Facebook credentials on server
  const handleSaveApiCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/api-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiCredentials)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
        pushClientToast(
          "Configurações Salvas! ⚙️",
          "Suas credenciais de APIs oficiais da Meta / WhatsApp foram gravadas no servidor com sucesso."
        );
      } else {
        alert("Falha ao salvar chaves no servidor.");
      }
    } catch (err) {
      console.error(err);
      alert("Houve um erro de rede ao tentar salvar as chaves de API.");
    }
  };

  // Handler: Send a live WhatsApp test message
  const handleSendLiveWhatsAppTest = async () => {
    if (!testPhoneInput) {
      alert("Por favor, digite um número de WhatsApp completo!");
      return;
    }
    setIsSendingTestMessage(true);
    try {
      const res = await fetch("/api/broadcasts/b1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPhoneNumber: testPhoneInput })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
        if (data.realApiUsed) {
          pushClientToast(
            "Mensagem Real Enviada! 🚀",
            data.apiLog || `Disparo de teste bem-sucedido para o número: ${testPhoneInput}`
          );
        } else {
          const isFailureOrWarning = data.apiLog && (
            data.apiLog.includes("Falha") || 
            data.apiLog.includes("Erro") || 
            data.apiLog.includes("desconectado") ||
            data.apiLog.includes("deslogado") ||
            data.apiLog.includes("não foram configuradas")
          );
          if (isFailureOrWarning) {
            pushClientToast(
              "Falha no Envio Real ⚠️",
              data.apiLog
            );
          } else {
            pushClientToast(
              "Simulado (Sem Chaves) ⚠️",
              `Nenhuma API (Meta ou Evolution) está ativa ou configurada. Simulação gerada para: ${testPhoneInput}`
            );
          }
        }
      } else {
        const data = await res.json();
        alert(`Erro ao disparar: ${data.error || "Código de erro desconhecido."}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Houve um erro crítico ao disparar mensagem: ${err.message || err}`);
    } finally {
      setIsSendingTestMessage(false);
    }
  };

  // Handler: Inject mock comment lead simulation with 3D keywords
  const handleInjectSimulatedLead = async () => {
    const currentVideo = campaigns[Math.floor(Math.random() * campaigns.length)];
    const chosenTriggerWord = crmConfig.triggerKeywords[Math.floor(Math.random() * crmConfig.triggerKeywords.length)];
    
    const randomUsernames = [
      { name: "Rodrigo Maker", handle: "@rodriguinho_3d", email: "rodrigo.m@gmail.com" },
      { name: "Vitória Gamer", handle: "@vitoria_setup", email: "vitoria.gamer@uol.com.br" },
      { name: "Marcos Geek", handle: "@marcos_geek", email: "marcos.geek99@outlook.com" },
      { name: "Fernanda Arquitetura", handle: "@fer_decor", email: "fer.arquiteturasp@gmail.com" }
    ];
    const userToInject = randomUsernames[Math.floor(Math.random() * randomUsernames.length)];

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userToInject.name,
          email: userToInject.email,
          handle: userToInject.handle,
          sourceVideo: currentVideo.title,
          triggerComment: chosenTriggerWord,
          crm: crmConfig.selectedCrm
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);

        setCampaigns(prev => prev.map(c => {
          if (c.id === currentVideo.id) {
            return { 
              ...c, 
              comments: c.comments + 1,
              leadsCaptured: c.leadsCaptured + 1
            };
          }
          return c;
        }));

        pushClientToast(
          "Novo Cliente no Zap! 🎯",
          `O usuário ${userToInject.handle} digitou "${chosenTriggerWord}" no post "${currentVideo.title}". Um funil automático enviou fotos das cores e salvou o contato!`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Advanced sentiment analyzer for 3D Print Comments
  const handleTriggerSentimentAnalysis = async (campaign: ViralCampaign) => {
    setIsAnalyzingSentiment(true);
    try {
      const res = await fetch("/api/sentiment-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignTitle: campaign.title,
          comments: `Quero o de dragão! Quanto custa o envio para Porto Alegre?
Tem desconto comprando dois suportes? Qual o material PLA ou ABS?
Adorei as cores metálicas, muito brilhante! Manda preço no privado pff.
Pecinha top de linha, encaixou perfeito no meu headphone.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveAnalysisResult({
          campaignId: campaign.id,
          positive: data.analysis.positive,
          neutral: data.analysis.neutral,
          negative: data.analysis.negative,
          summary: data.analysis.summary,
          viralReason: data.analysis.viralReason
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  // Handler: General content generator from Trends with Gemini
  const handleGenerateViralContent = async () => {
    const trendText = customTrendTitle || (selectedTrend ? selectedTrend.title : "Incrível Dragão Articulado 3D");
    setIsGeneratingContent(true);
    setGeneratedContent(null);

    try {
      const res = await fetch("/api/generate-viral-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendTitle: trendText,
          tone: aiTone,
          duration: aiDuration,
          platform: aiPlatform,
          targetAudience: aiAudience
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.content);

        pushClientToast(
          "Roteiro Prontinho com IA! 🎬",
          `Roteiro de vídeo para mostrar seu produto 3D gerado com ganchos do feed viral de hoje.`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // NEW: Handler to generate formatted ready-to-send posts from product photo/characteristics
  const handleGenerateFromPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = customProductName || (selectedProduct ? selectedProduct.name : "Vaso Geométrico Espiral");
    const desc = customProductDetails || (selectedProduct ? selectedProduct.defaultPrompt : "Lindo acabamento espiral decorativo.");
    
    setIsGeneratingPhotoPost(true);
    setPhotoPostResult(null);

    try {
      const res = await fetch("/api/generate-from-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: name,
          productDescription: desc,
          materialType: materialType,
          customDetails: `Preço sugerido: ${customPrice}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPhotoPostResult(data.outputs);
        pushClientToast(
          "Posts Prontos para Venda! 📸",
          `Gerado textos de alto impacto para postar no TikTok, Instagram e disparar no WhatsApp com foco em vendas por impulso.`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPhotoPost(false);
    }
  };

  // NEW: Daily message broadcast dispatch simulator (Tikric clone inspired)
  const handleSendBroadcast = async (broadcastId: string) => {
    setIsSendingBc(broadcastId);
    try {
      const res = await fetch(`/api/broadcasts/${broadcastId}/send`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts);
        setNotifications(data.notifications);
        pushClientToast(
          "Comunicado Diário Enviado!",
          "As mensagens prontas de catálogo 3D foram enviadas aos Leads ativos no WhatsApp e Instagram."
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingBc(null);
    }
  };

  // NEW: Add custom Broadcast template
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBcTitle || !newBcMessage) return;

    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBcTitle,
          message: newBcMessage,
          platform: newBcPlatform,
          category: newBcCategory
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts);
        setNewBcTitle("");
        setNewBcMessage("");
        pushClientToast("Campanha Criada! ⚡", "Nova mensagem programada criada. Envie diariamente para manter seus contatos quentes.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Insert scheduled post/video
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle) return;

    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newVideoTitle,
          platform: newVideoPlatform,
          accountId: newVideoAccount || "1",
          scheduledFor: newVideoDateTime,
          reason: `Postagem inteligente da peça 3D às ${newVideoDateTime || "18:00"} baseada no tráfego de lazer.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSchedulers(data.schedulers);
        setNewVideoTitle("");
        setNewVideoDateTime("");

        pushClientToast(
          "Publicação Marcada! 📅",
          `Recomendamos filamento Silk metálico de alta visibilidade para este post.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export report document
  const handleExportReport = () => {
    window.open("/api/export-report", "_blank");
    pushClientToast(
      "Dados de Vendas Salvos! 📊",
      `Metadados de pedidos e engajamento orgânico foram exportados para arquivo local.`
    );
  };

  // Clear notifications
  const handleClearNotifications = async () => {
    try {
      const res = await fetch("/api/notifications/clear", { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Copy Helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Drag and drop photo simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate drop photo
    setSimulatedPhoto("https://images.unsplash.com/photo-1615840287214-7fe58a8f3685?w=500&auto=format&fit=crop");
    pushClientToast("Foto Carregada com Sucesso! 📸", "Visual do item 3D processado para o redator de inteligência artificial.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Background radial lights */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[110px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Header Ribbon bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-emerald-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-display font-extrabold text-black text-xl tracking-tight">3D</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white tracking-wide">Viralyze 3D Shop</h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                  Maker-IA v2
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Plataforma de Crescimento Orgânico, Foto-Postador & Sistema de Mensagens Diárias para TikTok, Instagram e WhatsApp</p>
            </div>
          </div>

          {/* Connected accounts manager pill and notifications */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Canal Ativo:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setSelectedAccountId("all")}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedAccountId === "all" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedAccountId === acc.id ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    acc.platform === "tiktok" ? "bg-emerald-400" :
                    acc.platform === "instagram" ? "bg-pink-400" :
                    "bg-teal-400"
                  }`} />
                  {acc.handle}
                </button>
              ))}
              
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="p-1 px-2.5 sm:px-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg flex items-center gap-1 cursor-pointer"
                title="Integrar Novo Canal Social"
              >
                <Plus size={14} />
                <span className="hidden sm:inline text-xs font-semibold">Integrar</span>
              </button>
            </div>

            {/* Notification alert Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden font-sans">
                  <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 font-sans">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Radio size={14} className="text-emerald-400" />
                      Alertas de Vendas ({unreadCount})
                    </span>
                    <button
                      onClick={handleClearNotifications}
                      className="text-[10px] text-slate-400 hover:text-emerald-400"
                    >
                      Limpar Lidos
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-850">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">Nenhum alerta recente.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 text-xs ${n.read ? "bg-slate-900/50 opacity-70" : "bg-emerald-500/5"}`}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-slate-200">{n.title}</span>
                            <span className="text-[9px] font-mono text-slate-450">{n.time}</span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* App Settings button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Configurações Gerais do App & APIs"
            >
              <Settings size={18} />
            </button>

          </div>
        </header>

        {/* Global Warning Label */}
        {errorStatus && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            <p>{errorStatus}</p>
          </div>
        )}

        {/* Primary Tabs Navigation bar */}
        <div className="mt-6 flex overflow-x-auto border-b border-slate-900 pb-px gap-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 font-display text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "dashboard" 
                ? "border-emerald-400 text-white bg-slate-900/40 rounded-t-lg font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp size={15} className={activeTab === "dashboard" ? "text-emerald-400" : "text-slate-400"} />
            Painel da Loja 3D
          </button>
          
          <button
            onClick={() => setActiveTab("ai-photo")}
            className={`flex items-center gap-2 font-display text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "ai-photo" 
                ? "border-emerald-400 text-white bg-slate-900/40 rounded-t-lg font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera size={15} className={activeTab === "ai-photo" ? "text-emerald-400" : "text-slate-400"} />
            Gerador por Foto de Peça
            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1 py-0.5 rounded ml-1 font-mono uppercase font-bold">Foto IA</span>
          </button>

          <button
            onClick={() => setActiveTab("ai-trends")}
            className={`flex items-center gap-2 font-display text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "ai-trends" 
                ? "border-emerald-400 text-white bg-slate-900/40 rounded-t-lg font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film size={15} className={activeTab === "ai-trends" ? "text-emerald-400" : "text-slate-400"} />
            Roteiros de Tendências
          </button>

          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex items-center gap-2 font-display text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "broadcast" 
                ? "border-emerald-400 text-white bg-slate-900/40 rounded-t-lg font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare size={15} className={activeTab === "broadcast" ? "text-emerald-400" : "text-slate-400"} />
            Mensagens Diárias (Tikric)
            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded ml-1 font-mono uppercase font-bold text-[9px]">Lançamento</span>
          </button>

          <button
            onClick={() => setActiveTab("crm")}
            className={`flex items-center gap-2 font-display text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "crm" 
                ? "border-emerald-400 text-white bg-slate-900/40 rounded-t-lg font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database size={15} className={activeTab === "crm" ? "text-emerald-400" : "text-slate-400"} />
            Funil WhatsApp & Clientes
          </button>
        </div>

        {/* Dynamic Inner body content */}
        <main className="py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <span className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-emerald-400 animate-spin"></span>
              <p className="text-slate-400 text-xs font-mono">Iniciando motor de vendas automáticas Viralyze 3D...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & GENERAL METRICS */}
              {activeTab === "dashboard" && (
                <Overview 
                  accounts={accounts}
                  campaigns={campaigns}
                  leads={leads}
                  notifications={notifications}
                  selectedAccountId={selectedAccountId}
                  onToggleStatus={handleToggleCampaignStatus}
                  onExportReport={handleExportReport}
                  onInjectSimulatedLead={handleInjectSimulatedLead}
                  onTriggerSentimentAnalysis={handleTriggerSentimentAnalysis}
                  onDeleteAccount={handleDeleteAccount}
                  activeAnalysisResult={activeAnalysisResult}
                  isAnalyzingSentiment={isAnalyzingSentiment}
                />
              )}

              {/* TAB 2: AI PHOTO POSTS GENERATOR (Requested: "irei colocar somente a foto do produto a ia gerara o post pronto") */}
              {activeTab === "ai-photo" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  
                  {/* Left Column Parameters (5 cols) */}
                  <form onSubmit={handleGenerateFromPhoto} className="lg:col-span-5 space-y-4">
                    
                    {/* Select Product Item */}
                    <div className="glass-panel p-5 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-1.5">
                          <Camera size={16} />
                          1. Descreva seu Objeto 3D
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">Selecione uma fôrma já mapeada no seu fatiador 3D ou digite o nome de sua nova criação.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs text-slate-300 font-semibold block">Presets de Peças Comuns</label>
                        <div className="grid grid-cols-2 gap-2">
                          {products.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedProduct(p);
                                setCustomProductName("");
                                setCustomProductDetails("");
                              }}
                              className={`p-2 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                                selectedProduct?.name === p.name && !customProductName
                                  ? "bg-emerald-500/10 border-emerald-500/40 text-white font-semibold"
                                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              <span className="block font-medium truncate">{p.name}</span>
                              <span className="text-[9px] text-slate-500 block leading-tight">{p.category}</span>
                            </button>
                          ))}
                        </div>

                        <div className="border-t border-slate-800 pt-3 space-y-2">
                          <label className="text-xs text-slate-300 font-semibold block">Ou digite o nome da Peça</label>
                          <input
                            type="text"
                            placeholder="Ex: Escultura Articulada Mandstrack"
                            value={customProductName}
                            onChange={(e) => {
                              setCustomProductName(e.target.value);
                              setSelectedProduct(null);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-mono">MATERIAIS E ACABAMENTO DA IMPRESSÃO</label>
                          <select
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none text-slate-200"
                          >
                            <option>Filamento Silk Metálico PLA (Mais Brilho)</option>
                            <option>Filamento PLA Orgânico Biodegradável</option>
                            <option>Filamento ABS Premium de Alta Resistência</option>
                            <option>Filamento Translúcido PLA (Para Luminárias)</option>
                            <option>Filamento PETG Industrial Dupla Cor</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block font-mono">PREÇO DE VENDA</label>
                            <input
                              type="text"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-1.5 text-slate-100 placeholder-slate-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block font-mono">DIMENSÕES OU ESCALA</label>
                            <input
                              type="text"
                              placeholder="Ex: 25cm / 120 gramas"
                              value={customProductDetails}
                              onChange={(e) => setCustomProductDetails(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-1.5 text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated drag and drop photo uploader */}
                    <div className="glass-panel p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-emerald-400 font-mono font-bold uppercase block">
                          2. Solte a Foto do Produto
                        </label>
                        {simulatedPhoto && (
                          <button
                            type="button"
                            onClick={() => setSimulatedPhoto(null)}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                          isDragging 
                            ? "border-emerald-400 bg-emerald-500/10" 
                            : simulatedPhoto 
                            ? "border-emerald-500/40 bg-zinc-900/40" 
                            : "border-slate-800 hover:border-slate-700 bg-slate-900/20"
                        }`}
                      >
                        {simulatedPhoto ? (
                          <div className="space-y-2">
                            <img
                              src={simulatedPhoto}
                              alt="3d-photo-print"
                              className="w-full h-32 object-cover rounded-lg border border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <p className="text-[10px] text-emerald-400 font-bold font-mono">FOTOGRAFIA DETECTADA E MAPEADA ✅</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="mx-auto w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-450 border border-slate-800">
                              <Upload size={18} />
                            </div>
                            <p className="text-xs font-semibold text-slate-300">Arraste ou clique para enviar a foto da peça</p>
                            <p className="text-[10px] text-slate-505">Suporta fotos reais de filamentos no bico de impressão ou finalizados</p>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isGeneratingPhotoPost}
                        className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/10 cursor-pointer transition-all"
                      >
                        {isGeneratingPhotoPost ? (
                          <>
                            <span className="w-3.5 h-3.5 border border-black border-t-transparent rounded-full animate-spin"></span>
                            Gemini escrevendo posts completos...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Gerar Posts Virais Prontos (3 Redes)
                          </>
                        )}
                      </button>
                    </div>

                  </form>

                  {/* Right Column Outputs (7 cols) */}
                  <div className="lg:col-span-7 glass-panel p-6 rounded-2xl min-h-[450px] relative">
                    {photoPostResult ? (
                      <div className="space-y-6 animate-fadeIn pb-4">
                        <div className="border-b border-slate-850 pb-3 flex justify-between items-center bg-slate-900/20 p-3 rounded-xl">
                          <div>
                            <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              REPERTÓRIO DE VENDAS COMPLETO VIA GEMINI 3.5 FLASH
                            </span>
                            <h3 className="text-lg font-bold font-display text-white mt-1">
                              {customProductName || (selectedProduct ? selectedProduct.name : "Peça Espetacular 3D")}
                            </h3>
                          </div>
                        </div>

                        {/* TikTok Post Output */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-emerald-400 border border-slate-800 font-mono">
                              VÍDEO VIRAL (TIKTOK / REELS)
                            </span>
                            <button
                              onClick={() => copyToClipboard(`GANCHO: ${photoPostResult.tiktok.hook}\nLOCUÇÃO: ${photoPostResult.tiktok.vocals}\nLEGENDA: ${photoPostResult.tiktok.caption}`, "tt")}
                              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === "tt" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              {copiedKey === "tt" ? "Copiado!" : "Copiar Completo"}
                            </button>
                          </div>
                          
                          <div className="text-xs space-y-2">
                            <p className="text-slate-200 leading-relaxed font-semibold block text-amber-300">
                              🚨 Gancho Inicial: <span className="text-slate-300 font-normal">{photoPostResult.tiktok.hook}</span>
                            </p>
                            <p className="text-slate-200 leading-relaxed">
                              🎵 Áudio Recomendado: <span className="font-mono text-emerald-400">{photoPostResult.tiktok.musicStyle}</span>
                            </p>
                            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 text-slate-300 leading-relaxed">
                              🗣️ <span className="font-bold text-slate-400">Roteiro Fale-Estilo 3D:</span> "{photoPostResult.tiktok.vocals}"
                            </div>
                            <div className="text-[11px] text-slate-450 leading-relaxed bg-slate-950/20 p-2 rounded">
                              <span className="font-bold text-slate-400">Legenda curta TikTok:</span> {photoPostResult.tiktok.caption}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {photoPostResult.tiktok.hashtags.map((h, i) => (
                                <span key={i} className="text-[10px] bg-slate-950 text-emerald-400 px-2 py-0.5 rounded">
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Instagram Showcase Photo/Carousel Output */}
                        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-pink-950/30 text-pink-400 border border-pink-900/30 font-mono">
                              FOTO DETALHADA E FEED (INSTAGRAM)
                            </span>
                            <button
                              onClick={() => copyToClipboard(photoPostResult.instagram.caption, "ig")}
                              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === "ig" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              {copiedKey === "ig" ? "Copiado!" : "Copiar Legenda Feed"}
                            </button>
                          </div>
                          
                          <div className="text-xs space-y-2">
                            <div className="bg-slate-950/30 p-2.5 rounded text-slate-350 border border-slate-850">
                              📷 <span className="font-bold text-white">IDÉIA DE CARROSSEL 3 SLIDES:</span> {photoPostResult.instagram.carouselIdea}
                            </div>
                            <div className="bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-850 whitespace-pre-line text-[11px] leading-relaxed">
                              {photoPostResult.instagram.caption}
                            </div>
                          </div>
                        </div>

                        {/* Facebook Showcase Post Output */}
                        {photoPostResult.facebook && (
                          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-950/30 text-blue-400 border border-blue-900/30 font-mono">
                                OFERTA PARA GRUPOS PAGINAS & MARKETPLACE (FACEBOOK)
                              </span>
                              <button
                                onClick={() => copyToClipboard(photoPostResult.facebook.postText, "fb")}
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === "fb" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                {copiedKey === "fb" ? "Copiado!" : "Copiar Texto Completo"}
                              </button>
                            </div>
                            
                            <div className="text-xs space-y-2">
                              <div className="bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-850 whitespace-pre-line text-[11px] leading-relaxed">
                                {photoPostResult.facebook.postText}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {photoPostResult.facebook.hashtags.map((h, i) => (
                                  <span key={i} className="text-[10px] bg-slate-950 text-blue-400 px-2 py-0.5 rounded font-mono">
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* WhatsApp Broadcast Ready Offer (The central request!) */}
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/35 font-mono">
                              OFERTA DE ZAP PRONTA PARA ENVIAR (WHATSAPP)
                            </span>
                            <button
                              onClick={() => {
                                copyToClipboard(photoPostResult.whatsapp.boldOffer, "wa");
                                // Automatically save as Broadcast draft option
                                setNewBcTitle(`Oferta ${customProductName || (selectedProduct ? selectedProduct.name : "Peça 3D")}`);
                                setNewBcMessage(photoPostResult.whatsapp.boldOffer);
                              }}
                              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === "wa" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              {copiedKey === "wa" ? "Copiar e Salvar como Diária" : "Copiar para Disparo"}
                            </button>
                          </div>
                          
                          <div className="bg-slate-950 text-emerald-200 p-4 rounded-xl border border-emerald-500/10 whitespace-pre-line text-xs font-mono leading-relaxed select-all">
                            {photoPostResult.whatsapp.boldOffer}
                          </div>
                          <span className="text-[10px] text-slate-500 italic block">
                            Dica: Você pode copiar o texto acima e jogá-lo na seção de "Mensagens Diárias" no painel da Viralyze para disparar massivamente.
                          </span>
                        </div>

                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full border border-slate-800/80 flex items-center justify-center text-slate-500 bg-slate-900/30">
                          <Camera size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-300">Aguardando Foto ou Carregamento do Objeto 3D</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Tire a foto da sua impressora 3D agindo (timmelapse) ou do boneco de resina finalizado e digite os detalhes do filamento à esquerda para criarmos posts de venda prontos sob medida para TikTok, Instagram e WhatsApp!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: AI SCRIPT TREND GENERATOR */}
              {activeTab === "ai-trends" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left trends index */}
                    <div className="lg:col-span-1 space-y-4">
                      
                      <div className="glass-panel p-5 rounded-2xl space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-emerald-400">
                            Hashtags e Assuntos em Alta
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Ganchos recomendados inspirados no TikTok hoje.</p>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {trends.map(t => (
                            <div 
                              key={t.id}
                              onClick={() => {
                                setSelectedTrend(t);
                                setCustomTrendTitle("");
                              }}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                selectedTrend?.id === t.id && !customTrendTitle
                                  ? "bg-emerald-500/10 border-emerald-500/50" 
                                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold font-mono text-emerald-400">{t.change} cresc.</span>
                                <span className="text-[9px] uppercase tracking-wider bg-slate-850 px-1 text-slate-400 font-bold border border-slate-800 rounded">
                                  {t.platform.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-white mt-1 pr-1">{t.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{t.category}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-800/80">
                          <label className="text-xs text-slate-300 font-semibold block">Título Especial Customizado</label>
                          <input
                            type="text"
                            placeholder="Ex: Como configuro impressão de Yoda 3D de 50 cm"
                            value={customTrendTitle}
                            onChange={(e) => {
                              setCustomTrendTitle(e.target.value);
                              setSelectedTrend(null);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Content style adjustments */}
                      <div className="glass-panel p-5 rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-emerald-400">
                          Ajustes do Robô de Copys
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block font-mono">TOM DE VOZ</label>
                            <select
                              value={aiTone}
                              onChange={(e) => setAiTone(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                            >
                              <option>Hype Enérgico de Vendas</option>
                              <option>ASMR Satisfatório Mecânico</option>
                              <option>Inspirador Dia-a-Dia de Maker</option>
                              <option>Didático de Preços e Margem</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block font-mono">DURAÇÃO</label>
                            <select
                              value={aiDuration}
                              onChange={(e) => setAiDuration(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                            >
                              <option>15 segundos</option>
                              <option>30 segundos</option>
                              <option>60 segundos</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-mono">PÚBLICO-ALVO DE IMPRESSÃO</label>
                          <input
                            type="text"
                            value={aiAudience}
                            onChange={(e) => setAiAudience(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-100 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-mono">REDE REDIRECIONADA</label>
                          <div className="grid grid-cols-3 gap-1 pt-1">
                            {["tiktok", "instagram", "whatsapp"].map(plat => (
                              <button
                                key={plat}
                                type="button"
                                onClick={() => setAiPlatform(plat as any)}
                                className={`text-[10px] font-bold py-1.5 rounded-lg border text-center uppercase cursor-pointer ${
                                  aiPlatform === plat 
                                    ? "bg-slate-800 border-emerald-400 text-white" 
                                    : "bg-slate-950 border-slate-900 text-slate-400 hover:text-white"
                                }`}
                              >
                                {plat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateViralContent}
                          disabled={isGeneratingContent}
                          className="w-full font-bold text-xs bg-emerald-400 hover:bg-emerald-300 text-black py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isGeneratingContent ? (
                            <>
                              <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin"></span>
                              Modelando com Gemini...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              Gerar Roteiro de Tendência
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                    {/* Right script output */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl relative">
                      {generatedContent ? (
                        <div className="space-y-5 animate-fadeIn">
                          
                          <div className="border-b border-slate-800 pb-4 flex justify-between items-start gap-4">
                            <div>
                              <span className="px-2.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                COMPORTAMENTO ORGÂNICO DETECTADO
                              </span>
                              <h2 className="text-lg font-bold text-white mt-1 font-display flex items-center gap-2">
                                <Film size={18} className="text-emerald-400" />
                                {generatedContent.title}
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                setNewVideoTitle(generatedContent.title);
                                setActiveTab("dashboard");
                                pushClientToast("Copiado p/ Fila", "O post de tendência foi exportado para o agendador de pico.");
                              }}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 block font-semibold px-2.5 py-1.5 rounded border border-emerald-500/25 bg-emerald-500/5 whitespace-nowrap cursor-pointer hover:bg-emerald-500/10 transition-colors"
                            >
                              Jogar na Fila
                            </button>
                          </div>

                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono block">
                              🚨 GANCHO DE RETENÇÃO (CORTES INICIAIS):
                            </span>
                            <p className="text-xs text-amber-200 mt-1 font-medium">{generatedContent.hook}</p>
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono block">
                              CRONOGRAMA DE GRAVAÇÃO E NARRATIVA:
                            </span>
                            <div className="divide-y divide-slate-800 bg-slate-900/40 rounded-xl border border-slate-800 p-2">
                              {generatedContent.script.map((scene, idx) => (
                                <div key={idx} className="p-3 text-xs flex flex-col md:flex-row gap-4">
                                  <div className="md:w-16 font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                                    <span>Seção {scene.scene}</span>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="text-slate-400"><span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Visual:</span>{scene.visuals}</div>
                                    <div className="text-slate-100 font-display font-medium">🗣️ "{scene.vocals}"</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 block font-mono uppercase">Legenda Estética Para Redes:</span>
                              <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-line bg-slate-950 p-2.5 rounded border border-slate-800 select-all">
                                {generatedContent.caption}
                              </p>
                            </div>
                            
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 block font-mono uppercase">Hashtags Recomendadas:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {generatedContent.hashtags.map((h, i) => (
                                  <span key={i} className="text-xs bg-slate-950 text-emerald-400 border border-slate-800 px-2 py-0.5 rounded-lg select-all">
                                    {h}
                                  </span>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400 mt-1">
                                <span className="font-bold text-slate-300 block mb-0.5">Postagem Estratégica:</span>
                                {generatedContent.postingRecommendations}
                              </div>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-550">
                            <Film size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-300">Nenhum Roteiro de Tendência Ativo</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                              Selecione uma hashtag do painel esquerdo ou digite seu tema personalizado para extrair um roteiro em escala.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: AUTOMATED DAILY MESSAGES (Cloned style & inspiration from https://tikric.github.io/mensagens/) */}
              {activeTab === "broadcast" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Explanatory Header */}
                  <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center gap-3">
                    <span className="text-2xl">📢</span>
                    <div className="text-xs">
                      <h4 className="font-bold text-emerald-400">Mensagens Diárias Automáticas (Canal Ativo Direct e WhatsApp)</h4>
                      <p className="text-slate-300 mt-0.5">Aumente sua conversão em até 4x enviando fotos dos seus produtos recém faturados direto no Zap e mensagens programadas para a base de prospects.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Form: Create new Broadcast daily template */}
                    <div className="lg:col-span-4 glass-panel p-5 rounded-2xl h-fit space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-1.5">
                          Escrever Novo Comunicado
                        </h3>
                        <p className="text-xs text-slate-400">Escreva a mensagem personalizada pronta com dados das impressões para despachar à lista de contatos.</p>
                      </div>

                      <form onSubmit={handleCreateBroadcast} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-mono">IDENTIFICADOR DA CAMPANHA</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Alerta Litofania Dia dos Namorados"
                            value={newBcTitle}
                            onChange={(e) => setNewBcTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-100"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block font-mono">CANAL PRINCIPAL</label>
                            <select
                              value={newBcPlatform}
                              onChange={(e) => setNewBcPlatform(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-slate-100 focus:outline-none"
                            >
                              <option value="whatsapp">Zap (+5511998765432)</option>
                              <option value="instagram">Instagram DM</option>
                              <option value="tiktok">TikTok Direct</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block font-mono">CATEGORIA</label>
                            <input
                              type="text"
                              value={newBcCategory}
                              onChange={(e) => setNewBcCategory(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-slate-400 block font-mono">TEXTO PRONTO (ZAP METADADOS DO PRODUTO)</label>
                            <button
                              type="button"
                              onClick={() => {
                                setNewBcMessage(`🚀 *O DRAGÃO VOLTOU!* 🐉\n\nNossos Dragões Articulados de Cristal saíram quentinhos da mesa de PEI agora e já estão na prateleira.\n\n🔥 *Condição Relâmpago VIP:* Apenas hoje, compre e ganhe um mini chaveirinho surpresa 3D!\n\n👇 *Responda com EU QUERO para resgatar.*`);
                                pushClientToast("Template carregado", "Modelo de satisfação carregado na área de texto.");
                              }}
                              className="text-[9px] text-emerald-400 hover:underline"
                            >
                              Carregar Exemplo
                            </button>
                          </div>
                          <textarea
                            required
                            rows={6}
                            placeholder="Adicione emojis, links de Whatsapp e preço final de forma magnética..."
                            value={newBcMessage}
                            onChange={(e) => setNewBcMessage(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full font-bold text-xs bg-emerald-400 hover:bg-emerald-300 text-black py-2.5 rounded-xl transition-all shadow-lg"
                        >
                          Registrar Campanha de Mensagens
                        </button>
                      </form>
                    </div>

                    {/* Right Side: Campaigns Active list & Dispatches with direct Send action simulation */}
                    <div className="lg:col-span-8 glass-panel p-6 rounded-2xl space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white font-display">Mensagens Agendadas e Campanhas Ativas</h3>
                        <p className="text-xs text-slate-400">Monitore os cliques, envios diários de promoções e clique no botão de disparo rápido para disparar imediatamente.</p>
                      </div>

                      <div className="space-y-4">
                        {broadcasts.map((bc) => (
                          <div key={bc.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                  bc.platform === "whatsapp" ? "bg-teal-950 text-teal-400" :
                                  bc.platform === "instagram" ? "bg-pink-950 text-pink-400" :
                                  "bg-slate-800 text-slate-400"
                                }`}>
                                  {bc.platform.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">Categoria: {bc.category}</span>
                                <span className="text-[10px] text-slate-500 font-mono">| {bc.date}</span>
                              </div>

                              <p className="text-sm font-semibold text-white font-display">{bc.title}</p>
                              
                              <div className="bg-slate-950/60 p-3 rounded border border-slate-850/80 text-xs text-slate-355 font-mono max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed">
                                {bc.message}
                              </div>

                              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                                <span>Disparos Recebidos: <strong className="text-white font-semibold font-mono">{bc.sentCount.toLocaleString()}</strong></span>
                                <span>Respostas Positivas (Vendas): <strong className="text-emerald-400 font-semibold font-mono">{bc.conversions}</strong></span>
                              </div>
                            </div>

                            {/* Dispath / Trigger messaging simulator */}
                            <div className="text-right flex flex-col items-end gap-1.5 justify-start min-w-[140px]">
                              {bc.status === "sent" ? (
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 block font-mono flex items-center gap-1">
                                  ✓ DISPARADO COMPLETADO
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 block font-mono">
                                  ● PRONTO PARA ENVIO
                                </span>
                              )}

                              <button
                                onClick={() => handleSendBroadcast(bc.id)}
                                disabled={isSendingBc === bc.id}
                                className="mt-2 w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1"
                              >
                                {isSendingBc === bc.id ? (
                                  <>
                                    <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin"></span>
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Send size={12} />
                                    Disparar Diário Agora
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "crm" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  {/* Left: WhatsApp Baileys Engine & CRM Configurations */}
                  <div className="lg:col-span-1 glass-panel p-5 rounded-2xl h-fit space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-1.5">
                          <span>🔌</span> WhatsApp Baileys & CRM Local
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Gerencie seu WhatsApp via conexão física (QR Code) e configure gatilhos automáticos para responder seus clientes.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* BAiLEYS CONNECTION AND SCAN CARD */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-450 font-mono uppercase block tracking-wider">Conexão Física Local</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white font-mono">Status:</span>
                              {baileysStatus === "connected" ? (
                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono animate-pulse">
                                  🟢 CONECTADO
                                </span>
                              ) : baileysStatus === "connecting" ? (
                                <span className="bg-amber-400/15 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono animate-pulse">
                                  🟡 CONECTANDO...
                                </span>
                              ) : baileysStatus === "qr" ? (
                                <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono animate-pulse">
                                  🔵 AGUARDANDO QR CODE
                                </span>
                              ) : (
                                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                                  🔴 DESCONECTADO
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={fetchBaileysStatus}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg font-mono border border-slate-800 cursor-pointer"
                            >
                              Atualizar 🔄
                            </button>
                            {baileysStatus === "offline" && (
                              <button
                                type="button"
                                onClick={connectBaileys}
                                className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-350 text-black text-[10px] font-bold rounded-lg font-mono cursor-pointer transition-colors"
                              >
                                Conectar Zap 🔌
                              </button>
                            )}
                            {baileysStatus !== "offline" && (
                              <button
                                type="button"
                                disabled={isDisconnectingBaileys}
                                onClick={disconnectBaileys}
                                className="px-2 py-1 bg-rose-550 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg font-mono disabled:opacity-50 cursor-pointer transition-colors"
                              >
                                {isDisconnectingBaileys ? "Saindo..." : "Desconectar 🚪"}
                              </button>
                            )}
                          </div>

                          {/* QR Code display area */}
                          {baileysStatus === "qr" && baileysQr && (
                            <div className="flex flex-col items-center justify-center p-3 bg-slate-900/40 rounded-xl border border-blue-500/10 space-y-2.5 animate-fadeIn">
                              <p className="text-[10px] text-blue-300 font-mono text-center leading-normal">
                                Escaneie para conectar seu WhatsApp celular:
                              </p>
                              <div className="bg-white p-2.5 rounded-xl shadow-xl">
                                <img src={baileysQr} alt="WhatsApp QR Code" className="w-36 h-36 block" referrerPolicy="no-referrer" />
                              </div>
                              <p className="text-[9px] text-slate-450 font-mono text-center">
                                WhatsApp {`>`} Dispositivos Conectados {`>`} Conectar.
                              </p>
                            </div>
                          )}

                          {baileysStatus === "connected" && (
                            <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 flex gap-2 animate-fadeIn">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                ✓
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-bold text-white">Sessão Baileys Conectada!</p>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                  Seu telefone está espelhado localmente para envio em massa.
                                </p>
                              </div>
                            </div>
                          )}

                          {baileysStatus === "offline" && (
                            <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-850 flex gap-2 text-slate-400">
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-450 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                ✕
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-bold text-slate-300">WhatsApp Offline</p>
                                <p className="text-[10px] text-slate-450 leading-normal">
                                  Clique em "Conectar Zap" para iniciar e gerar o QR Code.
                                </p>
                              </div>
                            </div>
                          )}

                          {baileysError && (
                            <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-500/15 text-rose-400 text-[9px] font-mono leading-relaxed break-all">
                              <strong>ERRO:</strong> {baileysError}
                            </div>
                          )}
                        </div>

                        {/* CRM Selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">CRM / Plataforma de Mensagens</label>
                          <select
                            value={crmConfig.selectedCrm}
                            onChange={(e) => setCrmConfig(prev => ({ ...prev, selectedCrm: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                          >
                            <option>WhatsApp Direto (Link da Bio/Direct)</option>
                            <option>RD Station (Integração Oficial)</option>
                            <option>ActiveCampaign</option>
                            <option>HubSpot 3D Maker</option>
                          </select>
                        </div>

                        {/* Script Editor (integracao.js) */}
                        <div className="space-y-1 border-t border-slate-850 pt-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-slate-400 block font-mono font-bold">EDITOR MOTOR (INTEGRACAO.JS)</label>
                            {isLoadingIntegracao && <span className="text-[8px] text-amber-500 animate-pulse font-mono font-bold">Carregando...</span>}
                          </div>
                          <textarea
                            value={integracaoCode}
                            onChange={(e) => setIntegracaoCode(e.target.value)}
                            rows={8}
                            className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2 text-slate-200 font-mono focus:border-emerald-500/40 focus:outline-none leading-normal"
                            placeholder="// Código javascript da integracao"
                          />
                          <button
                            type="button"
                            onClick={handleSaveIntegracaoCode}
                            disabled={isSavingIntegracao}
                            className="w-full py-1.5 bg-emerald-400 hover:bg-emerald-350 text-black text-[10px] font-bold rounded-lg cursor-pointer transition-colors font-mono uppercase"
                          >
                            {isSavingIntegracao ? "Salvando..." : "Salvar Script do Motor 💾"}
                          </button>
                        </div>

                        {/* Test message trigger */}
                        <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-2">
                          <h4 className="text-[10px] text-emerald-400 font-bold uppercase font-mono">Testar Disparo no Celular</h4>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="DDI + DDD + Número (Ex: 5511999998888)"
                              value={testPhoneInput}
                              onChange={(e) => setTestPhoneInput(e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={handleSendLiveWhatsAppTest}
                              disabled={isSendingTestMessage}
                              className="px-2.5 bg-emerald-450 hover:bg-emerald-400 text-black text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              {isSendingTestMessage ? "..." : "Enviar"}
                            </button>
                          </div>
                        </div>

                        {/* CRM Auto DM catalog trigger configurations */}
                        <div className="pt-2 border-t border-slate-850 space-y-3">
                          <div className="flex justify-between items-center text-xs text-slate-300">
                            <span>Disparo Automático de Catálogo</span>
                            <input
                              type="checkbox"
                              checked={crmConfig.autoDm}
                              onChange={(e) => setCrmConfig(prev => ({ ...prev, autoDm: e.target.checked }))}
                              className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-800 rounded focus:ring-emerald-400 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-350 block">Palavras-Chave de Ativação</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {crmConfig.triggerKeywords.map((word, idx) => (
                                <span key={idx} className="flex items-center gap-1 text-[10px] bg-slate-900 border border-slate-800 text-slate-200 px-2 py-0.5 rounded-lg">
                                  {word}
                                  <button
                                    type="button"
                                    onClick={() => setCrmConfig(prev => ({ ...prev, triggerKeywords: prev.triggerKeywords.filter(w => w !== word) }))}
                                    className="text-slate-500 hover:text-rose-400 ml-1 font-bold font-mono text-[9px]"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Adicionar (Ex: QUERO)"
                                value={newTriggerWord}
                                onChange={(e) => setNewTriggerWord(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1 text-slate-100"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newTriggerWord && !crmConfig.triggerKeywords.includes(newTriggerWord)) {
                                    setCrmConfig(prev => ({ ...prev, triggerKeywords: [...prev.triggerKeywords, newTriggerWord] }));
                                    setNewTriggerWord("");
                                  }
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-750 text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Right: Lead funnel lists */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white font-display">Contatos Quentes & Funil de Compras</h3>
                          <p className="text-xs text-slate-400">Usuários que engajaram nas postagens orgânicas 3D e foram capturados para vendas no Zap.</p>
                        </div>
                        <button
                          onClick={handleInjectSimulatedLead}
                          className="text-[10px] text-emerald-400 hover:text-emerald-350 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          + Injetar Cliente Simulador
                        </button>
                      </div>

                      <div className="space-y-3">
                        {leads.map((l) => (
                          <div key={l.id} className="p-3 bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">{l.name}</span>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                                  {l.handle}
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs">Produto de Interesse: <strong className="text-slate-200 font-semibold">{l.interest}</strong></p>
                              <div className="text-[10px] text-slate-500">
                                Comentou: <span className="text-amber-400 font-mono font-semibold">"{l.triggerComment}"</span> | Origem: {l.sourceVideo}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block font-mono">{l.date}</span>
                              <span className="text-[10px] text-emerald-450 font-bold bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded mt-1.5 inline-block font-mono">
                                Conectado no Zap
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </>
          )}
        </main>

      </div>

      {/* FOOTER BAR */}
      <footer className="border-t border-slate-800/80 mt-12 py-5 text-center text-xs text-slate-550 max-w-7xl mx-auto px-4">
        <p>Plataforma Viralyze 3D Shop • Gerador de Roteiros & Sistema de Automação de Disparo Diário</p>
        <p className="text-[10px] text-slate-600 mt-1">Conectado de forma segura ao Gemini Pro 3.5 para prebióticos de inteligência artificial de vendas.</p>
      </footer>

      {/* DIALOG BOX: ADD SOCIAL ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-scaleUp">
            <div>
              <h2 className="text-base font-bold text-white font-display">Integrar Novo Canal de Vendas</h2>
              <p className="text-xs text-slate-400 mt-1">Insira os dados do canal abaixo para sincronizar suas capturas e disparo de mensagens.</p>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-mono">REDE SOCIAL</label>
                <div className="grid grid-cols-4 gap-1">
                  {(["tiktok", "instagram", "facebook", "whatsapp"] as const).map(plat => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setNewAccPlatform(plat)}
                      className={`text-[10px] font-semibold py-2 rounded-xl text-center border cursor-pointer uppercase ${
                        newAccPlatform === plat 
                          ? "bg-slate-800 border-emerald-400 text-white font-bold" 
                          : "bg-slate-950 border-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-mono">NOME DO ATENDIMENTO / CANAL</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Suporte de Vendas Dragões3D"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-mono">HABILITAÇÃO / HANDLE REDE OU NÚMERO ZAP</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: @vendedor_3d ou +5511998765432"
                  value={newAccHandle}
                  onChange={(e) => setNewAccHandle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl cursor-pointer"
                >
                  Integrar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG BOX: APP SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-2xl w-full max-w-2xl space-y-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white font-display flex items-center gap-1.5">
                  <span className="text-emerald-400">⚙️</span> Configurações Gerais do App & APIs
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie chaves secretas da Meta, sincronização de Webhooks para Instagram/WhatsApp e automações de comentários.
                </p>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold bg-slate-950 p-1.5 px-2.5 rounded-lg border border-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              
              {/* Active WhatsApp Engine is Zap Direto (Baileys) */}
              <div className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide font-mono flex items-center gap-1.5">
                    ⚡ Motor WhatsApp Ativo: Zap Direto (Baileys)
                  </span>
                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Sua automação com o WhatsApp local está ativa por padrão. Não há necessidade de intermediários ou de pagar taxas adicionais.
                  </p>
                </div>
                <div className="text-[10px] bg-slate-900 font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-800 select-none">
                  {baileysStatus === "connected" ? (
                    <span className="text-emerald-400">🟢 CELULAR CONECTADO</span>
                  ) : baileysStatus === "qr" ? (
                    <span className="text-blue-400">🔵 AGUARDANDO ESCANEAR QR</span>
                  ) : baileysStatus === "connecting" ? (
                    <span className="text-amber-400">🟡 INICIANDO MOTOR...</span>
                  ) : (
                    <span className="text-slate-400">🔌 MOTOR PREPARADO (OFFLINE)</span>
                  )}
                </div>
              </div>



              <div className="space-y-4 animate-fadeIn">
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/15 space-y-2">
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                    ⚡ AUTOMAÇÃO DIRETAMENTE INTEGRADA
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    O <strong>Zap Direto</strong> chama o seu script local <code className="text-emerald-300 font-mono bg-slate-950 px-1 py-0.5 rounded">integracao.js</code> diretamente no backend Node do app para rodar o motor local (Baileys) de forma ágil, segura e 100% autônoma.
                  </p>
                </div>

                  {/* BAiLEYS CONNECTION AND SCAN CARD */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 font-mono uppercase block tracking-wider">Sincronização Física via Baileys</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono uppercase">Status do Scanner:</span>
                          {baileysStatus === "connected" ? (
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono animate-pulse">
                              🟢 CONECTADO
                            </span>
                          ) : baileysStatus === "connecting" ? (
                            <span className="bg-amber-400/15 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono animate-pulse">
                              🟡 CONECTANDO...
                            </span>
                          ) : baileysStatus === "qr" ? (
                            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono animate-pulse">
                              🔵 AGUARDANDO LEITURA DO QR CODE
                            </span>
                          ) : (
                            <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                              🔴 DESCONECTADO
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={fetchBaileysStatus}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg font-mono border border-slate-800 cursor-pointer"
                        >
                          Sincronizar Stat 🔄
                        </button>
                        {baileysStatus === "offline" && (
                          <button
                            type="button"
                            onClick={connectBaileys}
                            className="px-2.5 py-1.5 bg-emerald-400 hover:bg-emerald-350 text-black text-[10px] font-bold rounded-lg font-mono cursor-pointer transition-colors"
                          >
                            Conectar Zap 🔌
                          </button>
                        )}
                        {baileysStatus !== "offline" && (
                          <button
                            type="button"
                            disabled={isDisconnectingBaileys}
                            onClick={disconnectBaileys}
                            className="px-2.5 py-1.5 bg-rose-550 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg font-mono disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            {isDisconnectingBaileys ? "Saindo..." : "Desconectar Zap 🚪"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* QR Code display area */}
                    {baileysStatus === "qr" && baileysQr && (
                      <div className="flex flex-col items-center justify-center p-5 bg-slate-900/40 rounded-xl border border-blue-500/10 space-y-3.5 animate-fadeIn">
                        <p className="text-[10.5px] text-blue-300 font-mono text-center max-w-sm leading-normal">
                          Aproxime a câmera do seu celular com o WhatsApp do QR Code abaixo para sincronizar seu dispositivo:
                        </p>
                        <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-white">
                          <img src={baileysQr} alt="WhatsApp QR Code" className="w-44 h-44 block" referrerPolicy="no-referrer" />
                        </div>
                        <p className="text-[9.5px] text-slate-450 font-mono text-center leading-normal">
                          Abra o WhatsApp {`>`} Configurações {`>`} Dispositivos Conectados {`>`} Conectar um dispositivo.
                        </p>
                      </div>
                    )}

                    {baileysStatus === "connected" && (
                      <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 flex gap-3.5 animate-fadeIn">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          ✓
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">Excelente! Conexão ativa no servidor.</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                            Seu número está com o fluxo Baileys conectado de forma offline-first nacional. Mensagens automatizadas de disparo, CRM integrativo e alertas diários agora enviarão de forma 100% autônoma e imediata.
                          </p>
                        </div>
                      </div>
                    )}

                    {baileysStatus === "offline" && (
                      <div className="bg-slate-900/20 p-4 rounded-xl border border-slate-850 flex gap-3.5 select-none text-slate-400">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-450 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          ✕
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-300">WhatsApp Baileys Adormecido</p>
                          <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                            Clique no botão "Conectar Zap" à direita para ativar a inicialização rápida do Baileys local, gerar seu código QR de autenticação e espelhar o seu telefone celular Maker de disparos.
                          </p>
                        </div>
                      </div>
                    )}

                    {baileysError && (
                      <div className="bg-rose-950/20 p-3 rounded-lg border border-rose-500/15 text-rose-400 text-[10px] font-mono leading-relaxed break-all">
                        <strong>ERRO DETECTADO:</strong> {baileysError}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-400 block font-mono font-bold tracking-wider uppercase">💻 Editor Online do Script (integracao.js)</label>
                      <button
                        type="button"
                        onClick={fetchIntegracaoCode}
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 font-mono underline"
                      >
                        Recarregar Arquivo 🔄
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-mono leading-tight">
                      Edite o conteúdo em tempo de execução:
                    </p>

                    <div className="relative border border-slate-800 rounded-xl overflow-hidden">
                      <textarea
                        value={integracaoCode}
                        onChange={(e) => setIntegracaoCode(e.target.value)}
                        rows={14}
                        className="w-full bg-slate-955 text-xs text-slate-100 font-mono p-4 block focus:outline-none focus:border-emerald-500/50 leading-relaxed"
                        placeholder="// Cole aqui seu código do integracao.js..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Sincronização Física</span>
                      <span className="text-[9px] text-slate-500 block">Salva as mudanças direto no disco do servidor.</span>
                    </div>
                    <button
                      type="button"
                      disabled={isSavingIntegracao}
                      onClick={handleSaveIntegracaoCode}
                      className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-350 text-black text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-colors font-mono uppercase text-center"
                    >
                      {isSavingIntegracao ? "Gravando Script..." : "Salvar Código do Motor 💾"}
                    </button>
                  </div>

                  {/* Sandboxed Testing for Direct Integracao script */}
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 text-sm">⚡</span>
                      <h4 className="text-[11px] text-emerald-400 font-bold uppercase font-mono">Disparar Mensagem de Ensaio (Zap Direto)</h4>
                    </div>
                    <p className="text-[10px] text-slate-450 leading-snug">
                      Envie uma mensagem de teste real utilizando o motor de conexão ativa (Baileys) ou seu arquivo de script <code className="text-emerald-300 font-mono">integracao.js</code> agora mesmo.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: 5515996145288"
                        value={testPhoneInput}
                        onChange={(e) => setTestPhoneInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleSendLiveWhatsAppTest}
                        disabled={isSendingTestMessage}
                        className="px-4 py-2 bg-emerald-400 hover:bg-emerald-350 text-black text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 font-mono text-center"
                      >
                        {isSendingTestMessage ? "..." : "Enviar agora"}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            {/* SAVE ALL VALUES AND PERSIST */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer bg-slate-950/20 hover:bg-slate-950 rounded-xl border border-transparent hover:border-slate-800 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    // 1. Save API Credentials
                    const credsRes = await fetch("/api/api-credentials", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(apiCredentials)
                    });
                    
                    // 2. Save CRM Configuration
                    const crmRes = await fetch("/api/crm-config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        selectedCrm: crmConfig.selectedCrm,
                        autoDm: crmConfig.autoDm,
                        triggerKeywords: crmConfig.triggerKeywords
                      })
                    });

                    if (credsRes.ok && crmRes.ok) {
                      pushClientToast(
                        "Configurações Aplicadas! ⚙️",
                        "Todas as chaves secretas da Meta e regras de CRM foram salvas e aplicadas às automações."
                      );
                      setShowSettingsModal(false);
                    } else {
                      alert("Falha ao salvar configurações em lote no servidor.");
                    }
                  } catch (err: any) {
                    console.error(err);
                    alert("Erro ao conectar ao servidor para gravar configurações.");
                  }
                }}
                className="px-5 py-2.5 text-xs bg-emerald-400 hover:bg-emerald-350 text-black font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
