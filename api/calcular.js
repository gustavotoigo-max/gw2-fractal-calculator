export default function handler(req, res) {
    // Garante que só aceita requisições do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { 
        currentTitle, pristine, relics, matrices, 
        dailyPristine, dailyMatrices, dailyRelics 
    } = req.body;

    // A base de dados dos Tiers fica trancada aqui no servidor. Ninguém consegue ver.
    const tierData = [
        { level: 1, name: "Nenhum ➔ Fractal Savant",     pristine: 0,    relics: 25000,  matrices: 75  },
        { level: 2, name: "Savant ➔ Fractal Prodigy",    pristine: 1200, relics: 35000,  matrices: 150 },
        { level: 3, name: "Prodigy ➔ Fractal Champion",  pristine: 0,    relics: 45000,  matrices: 225 },
        { level: 4, name: "Champion ➔ Fractal God",     pristine: 2000, relics: 55000,  matrices: 400 }
    ];

    let wallet = { 
        pristine: parseInt(pristine) || 0, 
        relics: parseInt(relics) || 0, 
        matrices: parseInt(matrices) || 0 
    };

    let totalDaysRemaining = 0;
    let htmlOutput = "";

    // Executa toda a matemática em segredo
    for (let i = 0; i < tierData.length; i++) {
        const tier = tierData[i];

        if (parseInt(currentTitle) >= tier.level) {
            htmlOutput += `
                <div class="tier-card completed">
                    <div class="tier-header">
                        <span>${tier.name}</span>
                        <span class="status">__LBL_COMPLETED__</span>
                    </div>
                    <div>__LBL_ALREADY_DONE__</div>
                </div>
            `;
            continue;
        }

        const neededPristine = Math.max(0, tier.pristine - wallet.pristine);
        const neededRelics = Math.max(0, tier.relics - wallet.relics);
        const neededMatrices = Math.max(0, tier.matrices - wallet.matrices);

        wallet.pristine = Math.max(0, wallet.pristine - tier.pristine);
        wallet.relics = Math.max(0, wallet.relics - tier.relics);
        wallet.matrices = Math.max(0, wallet.matrices - tier.matrices);

        const dPristine = parseInt(dailyPristine) || 0;
        const dMatrices = parseInt(dailyMatrices) || 0;
        const dRelics = parseInt(dailyRelics) || 0;

        const pristineDays = dPristine > 0 ? Math.ceil(neededPristine / dPristine) : (neededPristine > 0 ? Infinity : 0);
        const matrixDays = dMatrices > 0 ? Math.ceil(neededMatrices / dMatrices) : (neededMatrices > 0 ? Infinity : 0);
        const relicsDays = dRelics > 0 ? Math.ceil(neededRelics / dRelics) : (neededRelics > 0 ? Infinity : 0);

        const tierDays = Math.max(pristineDays, matrixDays, relicsDays);

        if (tierDays !== Infinity) {
            totalDaysRemaining += tierDays;
        }

        let stepGate = "__GATE_NONE__";
        if (tierDays === 0) stepGate = "__GATE_READY__";
        else if (tierDays === relicsDays) stepGate = "__GATE_NORMAL__";
        else if (tierDays === pristineDays && tierDays === matrixDays) stepGate = "__GATE_BOTH__";
        else if (tierDays === pristineDays) stepGate = "__GATE_PRISTINE__";
        else if (tierDays === matrixDays) stepGate = "__GATE_MATRIX__";

        let daysLabel = `+${tierDays} __LBL_DAYS__`;
        if (tierDays === Infinity) { daysLabel = "__LBL_INF_DAYS__"; stepGate = "__LBL_NO_FARM__"; }
        else if (tierDays === 0) { daysLabel = "__LBL_READY_BUY__"; }

        htmlOutput += `
            <div class="tier-card">
                <div class="tier-header">
                    <span>${tier.name}</span>
                    <span class="status">${daysLabel}</span>
                </div>
                <strong>__LBL_NEED_STOCK__</strong><br>
                • Pristines: <span class="resource">${neededPristine.toLocaleString()}</span> | 
                • Relics: <span class="resource">${neededRelics.toLocaleString()}</span> | 
                • Matrices: <span class="resource">${neededMatrices.toLocaleString()}</span><br>
                <small style="text-align: left; margin-top: 5px; color: var(--text-secondary); font-size: 12px;">
                    __LBL_GATE__ <span style="color: var(--primary); font-weight:600;">${stepGate}</span>
                </small>
            </div>
        `;
    }

    // Retorna apenas os resultados mastigados.
    return res.status(200).json({
        totalDaysRemaining,
        htmlOutput
    });
}
