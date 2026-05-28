// api/consultar.js
const https = require('https');

const FRACTAL_RELIC_ID = 7;
const PRISTINE_RELIC_ID = 24;
const INTEGRATED_MATRIX_ID = 73248;

// Função auxiliar para fazer requisições HTTPS nativas retornando uma Promise
function seguroGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        }).on('error', (err) => { reject(err); });
    });
}

module.exports = async (req, res) => {
    // Garante que o cabeçalho de resposta é JSON
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Método não permitido' }));
    }

    try {
        // Se a Vercel já parseou o body automaticamente:
        let payload = req.body;

        // Se o body veio como String ou Buffer devido ao ambiente puro, parseia manualmente:
        if (typeof req.body === 'string') {
            payload = JSON.parse(req.body);
        } else if (req.body instanceof Buffer) {
            payload = JSON.parse(req.body.toString('utf-8'));
        } else if (!payload && req.query && req.query.apiKey) {
            // Fallback caso os dados tenham ido por QueryString por algum motivo
            payload = { apiKey: req.query.apiKey };
        }

        const apiKey = payload && payload.apiKey ? payload.apiKey.trim() : '';

        if (!apiKey) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Por favor, forneça uma API Key válida.' }));
        }

        const walletUrl = `https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`;
        const bankUrl = `https://api.guildwars2.com/v2/account/bank?access_token=${apiKey}`;

        // Executa as chamadas em paralelo
        const [walletRes, bankRes] = await Promise.all([
            seguroGet(walletUrl),
            seguroGet(bankUrl)
        ]);

        if (walletRes.status === 403 || bankRes.status === 403) {
            res.statusCode = 403;
            return res.end(JSON.stringify({ 
                error: 'Chave inválida ou sem permissão. Garanta as permissões "account", "wallet" e "inventories".' 
            }));
        }

        if (walletRes.status !== 200 || bankRes.status !== 200) {
            res.statusCode = 502;
            return res.end(JSON.stringify({ error: 'Erro de resposta da API da ArenaNet.' }));
        }

        const walletData = JSON.parse(walletRes.body);
        const bankData = JSON.parse(bankRes.body);

        let fractalRelics = 0;
        let pristineRelics = 0;

        if (Array.isArray(walletData)) {
            walletData.forEach(currency => {
                if (currency.id === FRACTAL_RELIC_ID) fractalRelics = currency.value;
                if (currency.id === PRISTINE_RELIC_ID) pristineRelics = currency.value;
            });
        }

        let integratedMatrices = 0;
        if (Array.isArray(bankData)) {
            bankData.forEach(item => {
                if (item && item.id === INTEGRATED_MATRIX_ID) {
                    integratedMatrices += item.count;
                }
            });
        }

        res.statusCode = 200;
        return res.end(JSON.stringify({
            fractalRelics,
            pristineRelics,
            integratedMatrices
        }));

    } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'Erro interno ao processar a requisição.' }));
    }
};
