import express from 'express';
import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Tenta servir o frontend da pasta 'src' (comum em projetos React/Vite)
// Se não encontrar, tenta servir a pasta raiz
const frontendPath = path.join(__dirname, 'src');
app.use(express.static(frontendPath));
app.use(express.static('.')); // Fallback para a raiz

// Rota para o QR Code (seu bot)
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

// Rota padrão: serve o arquivo index.html da pasta correta
app.get('*', (req, res) => {
    // Tenta servir o index.html da pasta src primeiro
    const indexPathSrc = path.join(frontendPath, 'index.html');
    const indexPathRoot = path.join(__dirname, 'index.html');

    if (require('fs').existsSync(indexPathSrc)) {
        res.sendFile(indexPathSrc);
    } else if (require('fs').existsSync(indexPathRoot)) {
        res.sendFile(indexPathRoot);
    } else {
        res.status(404).send('Página não encontrada. Verifique se o arquivo index.html existe.');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});