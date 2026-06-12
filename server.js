import express from 'express';
import { default as makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Serve arquivos estáticos da pasta src (seus arquivos TSX)
app.use(express.static('src'));
app.use(express.static('.'));

// Rota do QR Code
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

// Rota principal - serve o index.html da pasta src
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'src', 'index.html');
    res.sendFile(indexPath);
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Site: https://viralyzi-4.onrender.com`);
});