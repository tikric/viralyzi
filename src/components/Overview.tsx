import React, { useState } from "react";
import { 
  TrendingUp, Users, Sparkles, MessageSquare, 
  Play, Pause, Award, ArrowUpRight, BarChart2, 
  PieChart, Shield, Download, FileText, PlusCircle, RefreshCw, Trash2
} from "lucide-react";
import { SocialAccount, ViralCampaign, CaptureLead, PushAlert } from "../types";

interface OverviewProps {
  accounts: SocialAccount[];
  campaigns: ViralCampaign[];
  leads: CaptureLead[];
  notifications: PushAlert[];
  selectedAccountId: string;
  onToggleStatus: (id: string, status: "active" | "paused" | "boosted") => void;
  onExportReport: () => void;
  onInjectSimulatedLead: () => void;
  onTriggerSentimentAnalysis: (campaign: ViralCampaign) => void;
  onDeleteAccount: (id: string) => void;
  activeAnalysisResult?: {
    campaignId: string;
    positive: number;
    neutral: number;
    negative: number;
    summary: string;
    viralReason: string;
  };
  isAnalyzingSentiment: boolean;
}

export default function Overview({
  accounts,
  campaigns,
  leads,
  notifications,
  selectedAccountId,
  onToggleStatus,
  onExportReport,
  onInjectSimulatedLead,
  onTriggerSentimentAnalysis,
  onDeleteAccount,
  activeAnalysisResult,
  isAnalyzingSentiment
}: OverviewProps) {
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);

  // Filter campaigns based on selected account
  const filteredCampaigns = campaigns.filter(c => 
    selectedAccountId === "all" ? true : c.accountId === selectedAccountId
  );

  // Totals calculations
  const totalViews = filteredCampaigns.reduce((sum, c) => sum + c.views, 0);
  const totalLikes = filteredCampaigns.reduce((sum, c) => sum + c.likes, 0);
  const totalShares = filteredCampaigns.reduce((sum, c) => sum + c.shares, 0);
  const totalSaves = filteredCampaigns.reduce((sum, c) => sum + c.saves, 0);
  const totalComments = filteredCampaigns.reduce((sum, c) => sum + c.comments, 0);
  const totalLeads = leads.length;

  // Selected Campaign for visual retention graph (defaults to the first active campaign)
  const [selectedGraphCampaignId, setSelectedGraphCampaignId] = useState<string>(
    filteredCampaigns[0]?.id || "v1"
  );
  const graphCampaign = campaigns.find(c => c.id === selectedGraphCampaignId) || campaigns[0];

  return (
    <div className="space-y-6">
      {/* Upper Cards Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Views */}
        <div id="card-total-views" className="p-5 glass-panel rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp size={48} className="text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Visitas Orgânicas de Vendas</p>
          <p className="text-2xl font-bold text-white font-display mt-2">
            {totalViews.toLocaleString("pt-BR")}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs font-semibold font-mono">
            <span>+24.1% interesse gerado</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 2: Conversion Rate */}
        <div id="card-engagement" className="p-5 glass-panel rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Sparkles size={48} className="text-cyan-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Conversão em Contato</p>
          <p className="text-2xl font-bold text-white font-display mt-2">
            {totalViews > 0 ? (((totalLikes + totalComments + totalSaves) / totalViews) * 100).toFixed(1) : "0.0"}%
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-cyan-400 text-xs font-semibold font-mono">
            <span>Interesse em Catálogo 3D</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 3: Leads Generated */}
        <div id="card-leads" className="p-5 glass-panel rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Users size={48} className="text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Clientes Capturados (Zap/Inbox)</p>
          <p className="text-2xl font-bold text-white font-display mt-2">
            {totalLeads} Clientes
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs font-semibold font-mono">
            <span>Funil de vendas ativo</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 4: Channels */}
        <div id="card-channels" className="p-5 glass-panel rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Award size={48} className="text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Canais Sincronizados</p>
          <p className="text-2xl font-bold text-white font-display mt-2">
            {accounts.length} Fontes de Tráfego
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-indigo-400 text-xs font-semibold font-mono">
            <span>Automação Integrada</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Retention Analysis (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <BarChart2 className="text-emerald-400" size={20} />
                Retenção Visual das Peças 3D (ASMR & Zoom)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visualização segundo a segundo dos ganchos das peças. Vídeos satisfatórios mostram maior retenção no início do filamento brilhante.
              </p>
            </div>
            {/* Dropdown to switch campaign in graph */}
            <select
              value={selectedGraphCampaignId}
              onChange={(e) => setSelectedGraphCampaignId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              {filteredCampaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Canvas SVG Graph */}
          {graphCampaign && (
            <div className="space-y-4">
              <div className="h-64 rounded-xl bg-slate-900/60 p-4 flex flex-col justify-between border border-slate-800/80 relative">
                <div className="absolute inset-0 flex flex-col justify-between py-8 px-10 pointer-events-none opacity-20">
                  <div className="w-full border-t border-dashed border-slate-600"></div>
                  <div className="w-full border-t border-dashed border-slate-600"></div>
                  <div className="w-full border-t border-dashed border-slate-600"></div>
                  <div className="w-full border-t border-dashed border-slate-600"></div>
                </div>

                {/* SVG Graph Curve */}
                <div className="w-full h-full relative z-10 flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradient-emerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Points line */}
                    <path
                      d={`M 0,${200 - graphCampaign.retention[0]*1.8} 
                          L 116,${200 - graphCampaign.retention[1]*1.8} 
                          L 233,${200 - graphCampaign.retention[2]*1.8} 
                          L 350,${200 - graphCampaign.retention[3]*1.8} 
                          L 466,${200 - graphCampaign.retention[4]*1.8} 
                          L 583,${200 - graphCampaign.retention[5]*1.8} 
                          L 700,${200 - graphCampaign.retention[6]*1.8}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Area fill */}
                    <path
                      d={`M 0,${200 - graphCampaign.retention[0]*1.8} 
                          L 116,${200 - graphCampaign.retention[1]*1.8} 
                          L 233,${200 - graphCampaign.retention[2]*1.8} 
                          L 350,${200 - graphCampaign.retention[3]*1.8} 
                          L 466,${200 - graphCampaign.retention[4]*1.8} 
                          L 583,${200 - graphCampaign.retention[5]*1.8} 
                          L 700,${200 - graphCampaign.retention[6]*1.8}
                          L 700,200 L 0,200 Z`}
                      fill="url(#gradient-emerald)"
                    />

                    {/* Dots for metrics */}
                    {graphCampaign.retention.map((val, idx) => {
                      const x = (idx * 700) / 6;
                      const y = 200 - val * 1.8;
                      return (
                        <g key={idx} className="group/dot cursor-pointer">
                          <circle cx={x} cy={y} r="6" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
                          <circle cx={x} cy={y} r="10" fill="#10b981" className="animate-ping opacity-0 group-hover/dot:opacity-30" />
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Values over plot points */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between px-0 pointer-events-none font-mono text-[10px] text-slate-400 mt-2">
                    <span className="translate-y-4">0s (100%)</span>
                    <span className="translate-y-4">3s {valLabelColor(graphCampaign.retention[1])} GANCHO</span>
                    <span className="translate-y-4">5s ({graphCampaign.retention[2]}%)</span>
                    <span className="translate-y-4">10s ({graphCampaign.retention[3]}%)</span>
                    <span className="translate-y-4">15s ({graphCampaign.retention[4]}%)</span>
                    <span className="translate-y-4">30s ({graphCampaign.retention[5]}%)</span>
                    <span className="translate-y-4 font-bold text-white">60s ({graphCampaign.retention[6]}%)</span>
                  </div>
                </div>
              </div>

              {/* Hook performance report card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Retenção Satisfeita
                  </span>
                  <p className="text-sm font-semibold text-white font-display mt-1">
                    Análise Fina do Gancho de Filamento
                  </p>
                  <p className="text-xs text-slate-400 pr-4">
                    Seu vídeo de demonstração 3D reteve {graphCampaign.retention[1]}% da audiência física no ponto crucial do movimento da peça. A estimativa média do mercado é de {graphCampaign.platform === "tiktok" ? "64% no TikTok" : "58% no Instagram"}. Excelente tração visual!
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-mono">Conversão WhatsApp</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">
                    {graphCampaign.conversionRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">pediram cupom ou link</span>
                </div>
              </div>
            </div>
          )}

          {!graphCampaign && (
            <div className="h-64 rounded-xl bg-slate-900/60 p-6 flex flex-col items-center justify-center border border-slate-800/80 text-center space-y-3">
              <BarChart2 className="text-slate-600 animate-pulse" size={36} />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Nenhum Post Sincronizado</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Selecione sua conta real e realize configurações de Webhook do Instagram Direct ou WhatsApp Cloud nas configurações para sincronizar e mensurar campanhas ativas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sentiment Analysis Column */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2 font-display">
              <PieChart className="text-emerald-400" size={20} />
              Desejos do Cliente (Análise Chat)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Extraindo emoção dos comentários e chats automatizados p/ mapear interesse direto nas suas peças 3D.
            </p>
          </div>

          {graphCampaign ? (
            <div className="space-y-4 my-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400">Comprar Já ({graphCampaign.sentiment.positive}%)</span>
                  <span className="text-slate-400 font-mono">Dúvidas ({graphCampaign.sentiment.neutral}%)</span>
                  <span className="text-rose-400">Reclamações ({graphCampaign.sentiment.negative}%)</span>
                </div>
                <div className="w-full flex h-3 rounded-full overflow-hidden bg-slate-850">
                  <div style={{ width: `${graphCampaign.sentiment.positive}%` }} className="bg-emerald-400-h-full"></div>
                  <div style={{ width: `${graphCampaign.sentiment.neutral}%` }} className="bg-slate-450 h-full"></div>
                  <div style={{ width: `${graphCampaign.sentiment.negative}%` }} className="bg-rose-500 h-full"></div>
                </div>
              </div>

              {/* Detailed Gemini Analytics for Comments */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/70 text-xs text-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 block font-mono flex items-center gap-1">
                    <Shield size={12} />
                    Mapeamento de Peças via Gemini
                  </span>
                  <button
                    onClick={() => {
                      setActiveAnalysisId(graphCampaign.id);
                      onTriggerSentimentAnalysis(graphCampaign);
                    }}
                    disabled={isAnalyzingSentiment && activeAnalysisId === graphCampaign.id}
                    className="text-[10px] text-white hover:text-emerald-400 font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-emerald-500/50 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={10} className={`${isAnalyzingSentiment && activeAnalysisId === graphCampaign.id ? "animate-spin" : ""}`} />
                    Analisar Comentários
                  </button>
                </div>

                {activeAnalysisResult && activeAnalysisResult.campaignId === graphCampaign.id ? (
                  <div className="space-y-2 animate-fadeIn text-xs">
                    <p className="italic text-slate-300">"{activeAnalysisResult.summary}"</p>
                    <p className="text-[10px] text-emerald-400 font-semibold font-mono">Elemento Viral: <span className="text-slate-400 font-normal">{activeAnalysisResult.viralReason}</span></p>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-400">
                    <p>Deseja processar as reações do feed integrado na sua conta?</p>
                    <p className="text-[10px] text-slate-500">Mapeamos as principais dúvidas sobre frete, cor preferida, tamanho das peças em escala antes de enviar sua campanha diária no privado.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-950/70 rounded-xl border border-slate-800/50 text-center space-y-2 my-auto">
              <PieChart className="text-slate-600 mx-auto" size={28} />
              <p className="text-xs font-semibold text-slate-305">Aguardando Interações Reais</p>
              <p className="text-[11px] text-slate-500 leading-normal">
                Nenhum desejo ou tag de comentário extraído por IA ainda. Conecte seu Webhook do Instagram ou WhatsApp Cloud nas configurações para começar a carregar chats de compradores reais.
              </p>
            </div>
          )}


        </div>
      </div>

      {/* Campaigns Monitor List Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <FileText className="text-emerald-400" size={20} />
              Monitoramento Ativo das Peças Virais
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Impulsionamento por tráfego orgânico ou pausa silenciosa e acompanhamento da taxa de conversão a venda final.
            </p>
          </div>

          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 font-semibold text-xs text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-400/10 cursor-pointer self-start sm:self-auto"
          >
            <Download size={14} />
            Exportar Relatório Mensal
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono font-medium pb-2">
                <th className="py-3 px-4 text-xs">Post de Produto / Detalhes</th>
                <th className="py-3 px-2 text-xs">Canal</th>
                <th className="py-3 px-2 text-xs">Visualizações</th>
                <th className="py-3 px-2 text-xs">Contatos Recebidos</th>
                <th className="py-3 px-2 text-xs">Conversão Whatsapp</th>
                <th className="py-3 px-2 text-xs">Status do Post</th>
                <th className="py-3 px-4 text-right text-xs">Controles Rápidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCampaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white font-display text-sm">{camp.title}</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">{camp.scheduledTime}</div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      camp.platform === "tiktok" ? "bg-slate-900 text-emerald-400 border border-emerald-500/10" :
                      camp.platform === "instagram" ? "bg-pink-950/40 text-pink-400 border border-pink-900/40" :
                      "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                    }`}>
                      {camp.platform.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-300 font-medium font-mono text-xs">
                    {camp.views.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-mono text-slate-300">{camp.comments} interações</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">
                      +{camp.leadsCaptured} no Zap integrado
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold font-mono">
                      {camp.conversionRate}%
                    </div>
                    <span className="text-[10px] text-slate-400">conversão chat final</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                      camp.status === "active" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                      camp.status === "boosted" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 animate-pulse" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        camp.status === "active" ? "bg-emerald-400" :
                        camp.status === "boosted" ? "bg-indigo-400" :
                        "bg-slate-500"
                      }`} />
                      {camp.status === "active" ? "Rodando" : camp.status === "boosted" ? "Acelerado por IA" : "Pausado"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {camp.status === "active" ? (
                      <button
                        onClick={() => onToggleStatus(camp.id, "boosted")}
                        title="Impulsionar Orçamento Orgânico / Distribuição"
                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg cursor-pointer transition-colors inline-block"
                      >
                        <Sparkles size={13} />
                      </button>
                    ) : null}
                    
                    {camp.status !== "paused" ? (
                      <button
                        onClick={() => onToggleStatus(camp.id, "paused")}
                        title="Desativar respostas automáticas"
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg cursor-pointer transition-colors inline-block"
                      >
                        <Pause size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(camp.id, "active")}
                        title="Ativar respostas automáticas"
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg cursor-pointer transition-colors inline-block"
                      >
                        <Play size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connected Channel Deletion & Addition list */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white font-display">Gerenciamento de Canais de Redes Sociais</h3>
          <p className="text-xs text-slate-400 mt-1">Conecte e remova os canais de postagem da sua loja conforme sua estratégia de vendas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img src={acc.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                <div>
                  <div className="text-xs font-bold text-white">{acc.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{acc.handle}</div>
                  <span className="text-[9px] bg-slate-950 text-slate-400 px-1 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                    {acc.platform}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onDeleteAccount(acc.id)}
                className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 cursor-pointer transition-colors"
                title="Desconectar este canal"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Visual label color logic for hook
function valLabelColor(val: number) {
  if (val >= 80) return <span className="text-emerald-400 font-bold font-mono">({val}%) Ótimo</span>;
  if (val >= 70) return <span className="text-cyan-400 font-bold font-mono">({val}%) Bom</span>;
  return <span className="text-amber-500 font-bold font-mono">({val}%) Regular</span>;
}
