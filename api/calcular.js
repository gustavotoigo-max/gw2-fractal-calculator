export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { 
        currentTitle, pristine, relics, matrices, 
        dailyPristine, dailyMatrices, dailyRelics 
    } = req.body;

    // Base de dados exata dos custos acumulados por Tier
    const tierData = [
        { level: 1, name: "Nenhum ➔ Fractal Savant",     pristine: 0,    relics: 25000,  matrices: 75  },
        { level: 2, name: "Savant ➔ Fractal Prodigy",    pristine: 1200, relics: 35000,  matrices: 150 },
        { level: 3, name: "Prodigy ➔ Fractal Champion",  pristine: 0,    relics: 45000,  matrices: 225 },
        { level: 4, name: "Champion ➔ Fractal God",     pristine: 2000, relics: 55000,  matrices: 400 }
    ];

    // Clonamos o inventário inicial recebido da API oficial do GW2
    let wallet = { 
        pristine: parseInt(pristine) || 0, 
        relics: parseInt(relics) || 0, 
        matrices: parseInt(matrices) || 0 
    };

    const dPristine = parseInt(dailyPristine) || 0;
    const dMatrices = parseInt(dailyMatrices) || 0;
    const dRelics = parseInt(dailyRelics) || 0;

    let totalDaysRemaining = 0;
    let htmlOutput = "";

    // Simulação linear e progressiva das etapas
    for (let i = 0; i < tierData.length; i++) {
        const tier = tierData[i];

        // Se o jogador já passou ou tem esse título, marca como concluído
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

        // Calcula EXATAMENTE quanto falta considerando o que sobrou na carteira da etapa anterior
        const neededPristine = Math.max(0, tier.pristine - wallet.pristine);
        const neededRelics = Math.max(0, tier.relics - wallet.relics);
        const neededMatrices = Math.max(0, tier.matrices - wallet.matrices);

        let tierDays = 0;
        
        // Se o usuário não ativou nenhuma rotina de farm mas ainda precisa de itens, gera tempo infinito
        if ((neededPristine > 0 && dPristine === 0) || 
            (neededMatrices > 0 && dMatrices === 0) || 
            (neededRelics > 0 && dRelics === 0 && dPristine === 0)) {
            tierDays = Infinity;
        } else {
            // SIMULAÇÃO DIÁRIA DA ETAPA: Avança dia após dia acumulando recursos de verdade
            while (
                wallet.pristine < tier.pristine || 
                wallet.matrices < tier.matrices || 
                (wallet.relics + (Math.max(0, wallet.pristine - tier.pristine) * 15)) < tier.relics
            ) {
                wallet.pristine += dPristine;
                wallet.matrices += dMatrices;
                wallet.relics += dRelics;
                tierDays++;

                // Trava de segurança para evitar loops infinitos caso trave o farm
                if (tierDays > 15000) {
                    tierDays = Infinity;
                    break;
                }
            }
        }

        // Se o farm concluiu a etapa com sucesso, subtraímos os custos do banco de dados da carteira corrente
        let stepGate = "__GATE_NONE__";
        if (tierDays !== Infinity && tierDays > 0) {
            // Se faltou Relic normal mas tínhamos Pristines sobrando para cobrir o buraco, faz a conversão (Melt)
            if (wallet.relics < tier.relics) {
                const relicDeficit = tier.relics - wallet.relics;
                const pristinesToConvert = Math.ceil(relicDeficit / 15);
                wallet.pristine -= pristinesToConvert;
                wallet.relics += (pristinesToConvert * 15);
                stepGate = "__GATE_NORMAL__"; // O gargalo foi relic normal convertido
            }

            // Deduz os custos exatos do upgrade da carteira viva
            wallet.pristine -= tier.pristine;
            wallet.relics -= tier.relics;
            wallet.matrices -= tier.matrices;

            totalDaysRemaining += tierDays;
        }

        // Identificação visual inteligente do Gargalo Real da Etapa baseado nos dados limites
        if (tierDays === 0) {
            stepGate = "__GATE_READY__";
        } else if (stepGate === "__GATE_NONE__") {
            // Se não foi resolvido por melt, avalia estatisticamente quem atrasou mais
            const pDays = dPristine > 0 ? neededPristine / dPristine : 0;
            const mDays = dMatrices > 0 ? neededMatrices / dMatrices : 0;
            const rDays = dRelics > 0 ? neededRelics / dRelics : 0;
            const maxDays = Math.max(pDays, mDays, rDays);

            if (maxDays === rDays) stepGate = "__GATE_NORMAL__";
            else if (maxDays === pDays && maxDays === mDays) stepGate = "__GATE_BOTH__";
            else if (maxDays === pDays) stepGate = "__GATE_PRISTINE__";
            else if (maxDays === mDays) stepGate = "__GATE_MATRIX__";
        }

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

    return res.status(200).json({
        totalDaysRemaining,
        htmlOutput
    });
}
