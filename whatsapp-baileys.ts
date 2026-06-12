import * as baileysModule from "@whiskeysockets/baileys";
import { useMultiFileAuthState, DisconnectReason, WASocket } from "@whiskeysockets/baileys";
import pino from "pino";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";

// Resolve makeWASocket function in a highly robust way to support both ESM/CommonJS contexts
let makeWASocket: any;
const bMod = baileysModule as any;
if (typeof bMod === 'function') {
  makeWASocket = bMod;
} else if (typeof bMod.default === 'function') {
  makeWASocket = bMod.default;
} else if (bMod.default && typeof bMod.default.default === 'function') {
  makeWASocket = bMod.default.default;
} else if (typeof bMod.makeWASocket === 'function') {
  makeWASocket = bMod.makeWASocket;
} else {
  makeWASocket = bMod.default;
}

let sock: WASocket | null = null;
let connectionStatus: "offline" | "connecting" | "qr" | "connected" | "error" = "offline";
let lastQrString: string | null = null;
let qrBase64Image: string | null = null;
let connectionError: string | null = null;
let connectedUser: { id: string; name?: string } | null = null;

let reconnectTimer: NodeJS.Timeout | null = null;
let retryCount = 0;
const MAX_RETRY_COUNT = 5;

const authPath = path.join(process.cwd(), "baileys_auth_session");

function logDebug(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  let text = `[${timestamp}] ${message}`;
  if (error) {
    text += ` | Error: ${error.message || error} ${error.stack || ""}`;
  }
  text += "\n";
  try {
    fs.appendFileSync(path.join(process.cwd(), "baileys_debug.log"), text);
  } catch (e) {
    console.error("Failed to write to baileys_debug.log:", e);
  }
  console.log(`[BaileysDebug] ${message}`, error || "");
}

export async function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    qr: qrBase64Image,
    error: connectionError,
    user: connectedUser
  };
}

export async function disconnectWhatsApp() {
  console.log("[Baileys] Desconectando sessão activa ou limpando...");
  retryCount = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sock) {
    try { sock.logout(); } catch (e) {}
    try { sock.end(undefined); } catch (e) {}
    sock = null;
  }
  
  connectionStatus = "offline";
  lastQrString = null;
  qrBase64Image = null;
  connectedUser = null;
  
  // Limpa os arquivos de autenticação
  if (fs.existsSync(authPath)) {
    try {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log("[Baileys] Arquivos de sessão removidos com sucesso.");
    } catch (err: any) {
      console.error("[Baileys] Erro ao deletar pasta auth_session:", err);
    }
  }
}

export async function initBaileys() {
  if (sock) {
    logDebug("[Baileys] Já inicializado.");
    return;
  }

  logDebug("[Baileys] Inicializando conexões...");
  connectionStatus = "connecting";
  connectionError = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ["Viralyze Impressão 3D", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        lastQrString = qr;
        connectionStatus = "qr";
        logDebug(`[Baileys] Novo QR Code gerado!`);
        try {
          qrBase64Image = await QRCode.toDataURL(qr);
        } catch (err) {
          logDebug("[Baileys] Erro ao converter QR para base64", err);
        }
      }

      if (connection === "connecting") {
        connectionStatus = "connecting";
        logDebug("[Baileys] Conectando ao WhatsApp...");
      }

      if (connection === "open") {
        logDebug("[Baileys] Conexão com WhatsApp estabelecida com SUCESSO!");
        connectionStatus = "connected";
        lastQrString = null;
        qrBase64Image = null;
        connectionError = null;
        retryCount = 0;

        if (sock && sock.user) {
          const rawId = sock.user.id;
          const cleanId = rawId.split(":")[0]?.split("@")[0] || rawId;
          connectedUser = {
            id: cleanId,
            name: sock.user.name || "Meu WhatsApp"
          };
          logDebug(`[Baileys] Usuário conectado ID: ${cleanId}, Nome: ${sock.user.name}`);
        }
      }

      if (connection === "close") {
        const errText = lastDisconnect?.error?.stack || lastDisconnect?.error?.message || lastDisconnect?.error?.toString() || "";
        const isQrTimeout = errText.includes("QR refs") || errText.includes("attempts ended");
        const errorStatusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        
        sock = null;
        connectionStatus = "offline";
        lastQrString = null;
        qrBase64Image = null;
        connectedUser = null;

        if (isQrTimeout) {
          logDebug("[Baileys] QR Code expirou por inatividade. Parando reconexão automática.");
          connectionStatus = "offline";
          connectionError = "O QR Code expirou por inatividade no celular. Clique em 'Conectar Zap' para gerar um novo QR Code.";
          retryCount = 0;
          try {
            if (fs.existsSync(authPath)) {
              fs.rmSync(authPath, { recursive: true, force: true });
            }
          } catch (cleanErr) {
            logDebug("Erro ao limpar sessão após expiração do QR", cleanErr);
          }
        } else if (errorStatusCode === DisconnectReason.loggedOut) {
          logDebug("[Baileys] Desconectado por deslogar dispositivo. Limpando sessão...");
          connectionError = "Dispositivo desconectado no celular. Escaneie o QR Code novamente.";
          await disconnectWhatsApp();
          retryCount = 0;
        } else {
          const shouldReconnect = errorStatusCode !== DisconnectReason.loggedOut && retryCount < MAX_RETRY_COUNT;
          
          if (shouldReconnect) {
            retryCount++;
            logDebug(`[Baileys] Conexão fechada. Tentativa de reconexão automática ${retryCount}/${MAX_RETRY_COUNT} em 5 segundos... Código: ${errorStatusCode}`, lastDisconnect?.error);
            connectionStatus = "connecting";
            connectionError = `Conexão fechada (Código: ${errorStatusCode || 'Stream'}). Reatando conexão (${retryCount}/${MAX_RETRY_COUNT})...`;
            
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              initBaileys();
            }, 5000);
          } else {
            logDebug(`[Baileys] Limite de reconexões atingido ou não deve reconectar. Código de status: ${errorStatusCode}`, lastDisconnect?.error);
            connectionStatus = "offline";
            connectionError = `Conexão encerrada (Código: ${errorStatusCode || 'Desconhecido'}). Clique em 'Conectar Zap' para reconectar manualmente.`;
            retryCount = 0;
          }
        }
      }
    });

  } catch (err: any) {
    logDebug("[Baileys] Falha crítica de inicialização", err);
    connectionStatus = "error";
    connectionError = err.message;
  }
}

// Enviar mensagem real usando o Baileys
export async function sendBaileysMessage(to: string, text: string) {
  logDebug(`[Baileys-Send] Iniciando envio de mensagem para o contato: ${to}`);
  if (!sock || connectionStatus !== "connected") {
    throw new Error("WhatsApp não está conectado no Baileys. Verifique se escaneou o QR Code.");
  }

  let cleanNumber = to.replace(/\D/g, "");
  let jidsToTry: string[] = [];

  if (cleanNumber.startsWith("55")) {
    if (cleanNumber.length === 13) {
      const ddd = cleanNumber.substring(2, 4);
      const rest = cleanNumber.substring(5);
      const jidWithout9 = `55${ddd}${rest}@s.whatsapp.net`;
      const jidWith9 = `${cleanNumber}@s.whatsapp.net`;
      // SE O USUÁRIO DIGITOU COM 9 (13 DÍGITOS), PRIORIZAR O COM 9!
      jidsToTry.push(jidWith9);
      jidsToTry.push(jidWithout9);
    } else if (cleanNumber.length === 12) {
      const ddd = cleanNumber.substring(2, 4);
      const rest = cleanNumber.substring(4);
      const jidWith9 = `55${ddd}9${rest}@s.whatsapp.net`;
      const jidWithout9 = `${cleanNumber}@s.whatsapp.net`;
      // SE O USUÁRIO DIGITOU SEM 9 (12 DÍGITOS), PRIORIZAR O SEM 9!
      jidsToTry.push(jidWithout9);
      jidsToTry.push(jidWith9);
    } else {
      if (!cleanNumber.endsWith("@s.whatsapp.net")) {
        jidsToTry.push(`${cleanNumber}@s.whatsapp.net`);
      } else {
        jidsToTry.push(cleanNumber);
      }
    }
  } else {
    if (!cleanNumber.endsWith("@s.whatsapp.net")) {
      jidsToTry.push(`${cleanNumber}@s.whatsapp.net`);
    } else {
      jidsToTry.push(cleanNumber);
    }
  }

  logDebug(`[Baileys-Send] JIDs em potencial para o contato: ${JSON.stringify(jidsToTry)}`);

  let finalJid = jidsToTry[0];
  try {
    logDebug(`[Baileys-Send] Verificando JIDs ativos no WhatsApp via onWhatsApp...`);
    for (const jid of jidsToTry) {
      try {
        const onWhatsAppPromise = sock.onWhatsApp(jid);
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Verification Timeout")), 3000));
        const result = await Promise.race([onWhatsAppPromise, timeoutPromise]);
        
        logDebug(`[Baileys-Send] Resposta do onWhatsApp para ${jid}: ${JSON.stringify(result)}`);
        if (result && result.length > 0 && result[0].exists) {
          finalJid = result[0].jid;
          logDebug(`[Baileys-Send] JID ativo confirmado e selecionado: ${finalJid}`);
          break;
        }
      } catch (errInner) {
        logDebug(`[Baileys-Send] Erro de verificação individual para ${jid}, continuará tentando.`, errInner);
      }
    }
  } catch (err) {
    logDebug(`[Baileys-Send] Erro geral ao validar JID via onWhatsApp, mantendo como fallback: ${finalJid}`, err);
  }

  logDebug(`[Baileys-Send] Enviando mensagem final via sendMessage para ${finalJid}: "${text.substring(0, 40)}..."`);
  try {
    const result = await sock.sendMessage(finalJid, { text: text });
    logDebug(`[Baileys-Send] Mensagem enviada com SUCESSO! ID da msg: ${result?.key?.id}`);
    return result;
  } catch (sendErr: any) {
    logDebug(`[Baileys-Send] ERRO AO ENVIAR MENSAGEM para ${finalJid}`, sendErr);
    throw sendErr;
  }
}
