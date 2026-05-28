// api/consultar.js

const FRACTAL_RELIC_ID = 7;
const PRISTINE_RELIC_ID = 24;
const INTEGRATED_MATRIX_ID = 73248;

export default async function handler(req, res) {
    // Garante que só aceita requisições do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { apiKey } = req.body;

    if (!apiKey || apiKey.trim() === '') {
        return res.status(400).json({ error: 'Por favor, forneça uma API Key válida.' });
    }

    try {
        const walletUrl = `https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`;
        const bankUrl = `https://api.guildwars2.com/v2/account/bank?access_token=${apiKey}`;

        const [walletResponse, bankResponse] = await Promise.all([
            fetch(walletUrl),
            fetch(bankUrl)
        ]);

        if (walletResponse.status === 403 || bankResponse.status === 403) {
            return res.status(403).json({ 
                error: 'Chave inválida ou sem permissão. Garanta que sua API key tenha as permissões "account", "wallet" e "inventories" marcadas.' 
            });
        }

        if (!walletResponse.ok || !bankResponse.ok) {
            return res.status(502).json({ 
                error: `Erro na API do GW2 (Wallet: ${walletResponse.status} | Bank: ${bankResponse.status})` 
            });
        }

        const walletData = await walletResponse.json();
        const bankData = await bankResponse.json();

        let fractalRelics = 0;
        let pristineRelics = 0;

        walletData.forEach(currency => {
            if (currency.id === FRACTAL_RELIC_ID) fractalRelics = currency.value;
            if (currency.id === PRISTINE_RELIC_ID) pristineRelics = currency.value;
        });

        let integratedMatrices = 0;
        if (Array.isArray(bankData)) {
            bankData.forEach(item => {
                if (item && item.id === INTEGRATED_MATRIX_ID) {
                    integratedMatrices += item.count;
                }
            });
        }

        // Retorna os dados puros extraídos com segurança
        return res.status(200).json({
            fractalRelics,
            pristineRelics,
            integratedMatrices
        });

    } catch (err) {
        return res.status(500).json({ 
            error: err.message || 'Erro interno no servidor ao conectar com a Tyria.' 
        });
    }
}
