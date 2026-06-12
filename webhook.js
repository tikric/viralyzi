import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import fs from 'fs';

const WEBHOOK_URL = 'https://ais-pre-pnhih646qlflvtbr3yarpo-299564898302.us-east5.run.app/api/webhook/whatsapp';

try {
    if (fs.existsSync('auth_info')) {
        fs.rmSync('auth_info', { recursive: true, force: true });
        console.log('Sessao antiga removida');
    }
} catch (err) {}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Chrome (Linux)', '', ''],
        syncFullHistory: false
    });

    sock.ev.on('connection.update', async (update) =
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('ESCANEIE O QR CODE:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') console.log('WhatsApp conectado!');
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Reconectando...');
                connectToWhatsApp();
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) =
        const msg = messages[0];
        if (!msg.message) return;
        let fromNumber = msg.key.remoteJid.replace('@s.whatsapp.net', '');
        const payload = {
            object: "whatsapp_business_account",
            entry: [{
                changes: [{
                    value: {
                        contacts: [{ profile: { name: "Cliente" } }],
                        messages: [{ from: fromNumber, text: { body: text } }]
                    }
                }]
            }]
        };
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Mensagem enviada para Google Studio:', text);
    });

    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();
