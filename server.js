import express from 'express';
import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Servir arquivos estáticos (seu frontend)
app.use(express.static('.'));

// Rota para o QR Code
app.get('/qr', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Chrome (Linux)', '', '']
    });

    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;
        if (qr) {
            const qrImage = await qrcode.toDataURL(qr);
            res.send(`<img src="${qrImage}" />`);
        }
        if (connection === 'open') console.log('✅ WhatsApp conectado!');
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});