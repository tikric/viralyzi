import { default as makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

async function connect() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });
    
    sock.ev.on('connection.update', ({ qr, connection }) => {
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'open') console.log('✅ Conectado!');
    });
    
    sock.ev.on('creds.update', saveCreds);
}

connect();