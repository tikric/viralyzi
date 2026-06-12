import express from 'express';
import { default as makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Serve os arquivos do site (pasta dist depois do build)
app.use(express.static('dist'));

// Rota do QR Code para conectar o WhatsApp
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
        if (connection === 'open') console.log('WhatsApp conectado!');
    });
});

// Qualquer outra rota volta para o index.html do site
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});