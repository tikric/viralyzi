import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket } from "@whiskeysockets/baileys";
import pino from "pino";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";

let sock: WASocket | null = null;
let connectionStatus: "offline" | "connecting" | "qr" | "connected" | "error" = "offline";
let lastQrString: string | null = null;
let qrBase64Image: string | null = null;
let connectionError: string | null = null;

const authPath = path.join(process.cwd(), "baileys_auth_session");

export async function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    qr: qrBase64Image,
    error: connectionError
  };
}

export async function disconnectWhatsApp() {
  console.log("[Baileys] Desconectando sessão ativa...");
  if (sock) {
    try { sock.logout(); } catch (e) {}
    try { sock.end(undefined); } catch (e) {}
    sock = null;
  }
  
  connectionStatus = "offline";
  lastQrString = null;
  qrBase64Image = null;
  
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
    console.log("[Baileys] Já inicializado.");
    return;
  }

  console.log("[Baileys] Inicializando conexões...");
  connectionStatus = "connecting";
  connectionError = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        lastQrString = qr;
        connectionStatus = "qr";
        try {
          qrBase64Image = await QRCode.toDataURL(qr);
        } catch (err) {
          console.error("[Baileys] Erro ao converter QR para base64:", err);
        }
      }

      if (connection === "connecting") {
        connectionStatus = "connecting";
      }

      if (connection === "open") {
        console.log("[Baileys] Conexão com WhatsApp estabelecida com SUCESSO!");
        connectionStatus = "connected";
        lastQrString = null;
        qrBase64Image = null;
        connectionError = null;
      }

      if (connection === "close") {
        const errorStatusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = errorStatusCode !== DisconnectReason.loggedOut;
        
        console.log(`[Baileys] Conexão fechada. Motivo: ${errorStatusCode}. Deve tentar reconectar? ${shouldReconnect}`);
        
        sock = null;
        connectionStatus = "offline";
        lastQrString = null;
        qrBase64Image = null;

        if (errorStatusCode === DisconnectReason.loggedOut) {
          console.log("[Baileys] Desconectado por deslogar dispositivo. Limpando sessão...");
          await disconnectWhatsApp();
        } else if (shouldReconnect) {
          console.log("[Baileys] Tentando reconectar automaticamente em 5 segundos...");
          setTimeout(() => {
            initBaileys();
          }, 5000);
        }
      }
    });

  } catch (err: any) {
    console.error("[Baileys] Falha crítica de inicialização:", err);
    connectionStatus = "error";
    connectionError = err.message;
  }
}

// Enviar mensagem real usando o Baileys
export async function sendBaileysMessage(to: string, text: string) {
  if (!sock || connectionStatus !== "connected") {
    throw new Error("WhatsApp não está conectado no Baileys. Verifique se escaneou o QR Code.");
  }

  // Formata o número (removendo caracteres especiais e adicionando sufixo do whatsapp @s.whatsapp.net)
  let cleanNumber = to.replace(/\D/g, "");
  if (!cleanNumber.endsWith("@s.whatsapp.net")) {
    cleanNumber = `${cleanNumber}@s.whatsapp.net`;
  }

  console.log(`[Baileys] Enviando mensagem para ${cleanNumber}: ${text}`);
  const result = await sock.sendMessage(cleanNumber, { text: text });
  return result;
}
