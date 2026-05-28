// api/consultar.js
const https = require('https');

const FRACTAL_RELIC_ID = 7;
const PRISTINE_RELIC_ID = 24;
const INTEGRATED_MATRIX_ID = 73248;

// Função auxiliar para fazer requisições HTTPS nativas retornando uma Promise
function seguroGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    body: data
                });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = async (req, res) => {
    // Força cabeçalhos de segurança e resposta JSON
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Método não permitido' }));
    }

    const { apiKey } = req.body || {};

    if (!apiKey || apiKey.trim() === '') {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Por favor, forneça uma API Key válida.' }));
    }

    try {
        const walletUrl = `https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`;
        const bankUrl = `https://api.guildwars2.com/v2/account/bank?access_token=${apiKey}`;

        // Executa ambas as requisições em paralelo de forma segura
        const [walletRes, bankRes] = await Promise.all([
            seguroGet(walletUrl),
            seguroGet(bankUrl)
        ]);

        if (walletRes.status === 403 || bankRes.status === 403) {
            res.statusCode = 403;
            return res.end(JSON.stringify({ 
                error: 'Chave inválida ou sem permissão. Verifique as permissões de "account", "wallet" e "inventories" no site da ArenaNet.' 
            }));
        }

        if (walletRes.status !== 200 || bankRes.status !== 200) {
            res.statusCode = 502;
            return res.end(JSON.stringify({ error: 'Erro de comunicação ou resposta inválida da API do GW2.' }));
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
        return res.end(JSON.stringify({ error: 'Erro interno no servidor ao processar os dados da Tyria.' }));
    }
};
