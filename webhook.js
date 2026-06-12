import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Chrome (Linux)', '', ''],
        syncFullHistory: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('📱 Escaneie o QR Code com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log('❌ Conexão fechada. Status:', lastDisconnect?.error?.output?.statusCode);
            
            if (shouldReconnect) {
                console.log('🔄 Reconectando automaticamente...');
                connectToWhatsApp();
            } else {
                console.log('🔴 Sessão encerrada. Execute o programa novamente para escanear o QR Code.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();