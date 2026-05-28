// api/consultar.js

const FRACTAL_RELIC_ID = 7;
const PRISTINE_RELIC_ID = 24;
const INTEGRATED_MATRIX_ID = 73248;

export const config = {
    runtime: 'edge', // Força a Vercel a usar o ambiente moderno com suporte nativo a fetch
};

export default async function handler(req) {
    // Permite apenas requisições POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Captura o JSON enviado pelo frontend de forma nativa e limpa
        const payload = await req.json();
        const apiKey = payload && payload.apiKey ? payload.apiKey.trim() : '';

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Por favor, forneça uma API Key válida.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const walletUrl = `https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`;
        const bankUrl = `https://api.guildwars2.com/v2/account/bank?access_token=${apiKey}`;

        // Realiza as chamadas em paralelo de forma nativa no servidor
        const [walletResponse, bankResponse] = await Promise.all([
            fetch(walletUrl),
            fetch(bankUrl)
        ]);

        if (walletResponse.status === 403 || bankResponse.status === 403) {
            return new Response(JSON.stringify({ 
                error: 'Chave inválida ou sem permissão. Garanta as permissões "account", "wallet" e "inventories" no site da ArenaNet.' 
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!walletResponse.ok || !bankResponse.ok) {
            return new Response(JSON.stringify({ error: 'Erro de comunicação com a API da ArenaNet.' }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const walletData = await walletResponse.json();
        const bankData = await bankResponse.json();

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

        // Retorna a resposta de sucesso formatada
        return new Response(JSON.stringify({
            fractalRelics,
            pristineRelics,
            integratedMatrices
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Erro interno ao processar a sincronização.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
