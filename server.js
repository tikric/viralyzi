import express from 'express';
import { default as makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// ========== CONFIGURAÇÃO DO FRONTEND ==========
// Procura pelos arquivos do site em diferentes pastas
const possiblePaths = [
    path.join(__dirname, 'dist'),           // Build de produção (React/Vite)
    path.join(__dirname, 'src'),            // Código fonte (desenvolvimento)
    path.join(__dirname, 'public'),         // Pasta pública
    __dirname                               // Raiz (fallback)
];

let frontendPath = null;
for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.readdirSync(p).length > 0) {
        frontendPath = p;
        console.log(`📁 Servindo arquivos estáticos de: ${frontendPath}`);
        break;
    }
}

if (frontendPath) {
    app.use(express.static(frontendPath));
} else {
    console.log('⚠️ Nenhuma pasta com arquivos estáticos encontrada!');
}

// ========== ROTA PARA O QR CODE ==========
app.get('/qr', async (req, res) => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['Chrome (Linux)', '', '']
        });

        // Timeout para evitar que a conexão fique pendente
        const timeout = setTimeout(() => {
            res.status(504).send('Tempo limite excedido para gerar o QR Code');
        }, 30000);

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection } = update;
            if (qr && !res.headersSent) {
                clearTimeout(timeout);
                const qrImage = await qrcode.toDataURL(qr);
                res.send(`
                    <html>
                        <head><title>Conectar WhatsApp</title></head>
                        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial;">
                            <div style="text-align: center;">
                                <h2>Escaneie o QR Code para conectar</h2>
                                <img src="${qrImage}" alt="QR Code" />
                                <p>Abra o WhatsApp > Configurações > Dispositivos conectados</p>
                            </div>
                        </body>
                    </html>
                `);
            }
            if (connection === 'open') console.log('✅ WhatsApp conectado com sucesso!');
        });
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).send('Erro interno ao gerar QR Code');
    }
});

// ========== ROTA PRINCIPAL ==========
app.get('*', (req, res) => {
    // Tenta servir o index.html de diferentes locais
    const possibleIndexPaths = [
        path.join(frontendPath, 'index.html'),
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'src', 'index.html'),
        path.join(__dirname, 'dist', 'index.html')
    ];

    for (const indexPath of possibleIndexPaths) {
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
            return;
        }
    }

    // Se não encontrar nenhum index.html
    res.status(404).send(`
        <html>
            <head><title>Site não encontrado</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>🤖 Site em construção</h1>
                <p>O servidor está rodando, mas o site ainda não foi configurado.</p>
                <p>Para conectar o WhatsApp, acesse <a href="/qr">/qr</a></p>
            </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📱 Site: https://viralyzi-4.onrender.com`);
    console.log(`📱 QR Code: https://viralyzi-4.onrender.com/qr`);
});