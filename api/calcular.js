export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const {
        currentTitle,
        pristine,
        relics,
        matrices,
        dailyPristine,
        dailyMatrices,
        dailyRelics
    } = req.body;

    const tierData = [
        {
            level: 1,
            name: "__TIER1__",
            pristine: 0,
            relics: 25000,
            matrices: 75
        },
        {
            level: 2,
            name: "__TIER2__",
            pristine: 1200,
            relics: 35000,
            matrices: 150
        },
        {
            level: 3,
            name: "__TIER3__",
            pristine: 0,
            relics: 45000,
            matrices: 225
        },
        {
            level: 4,
            name: "__TIER4__",
            pristine: 2000,
            relics: 55000,
            matrices: 400
        }
    ];

    // Valores ORIGINAIS do usuário
    const originalPristine = parseInt(pristine) || 0;
    const originalRelics = parseInt(relics) || 0;
    const originalMatrices = parseInt(matrices) || 0;

    let wallet = {
        pristine: originalPristine,
        relics: originalRelics,
        matrices: originalMatrices
    };

    const dPristine = parseInt(dailyPristine) || 0;
    const dMatrices = parseInt(dailyMatrices) || 0;
    const dRelics = parseInt(dailyRelics) || 0;

    let totalDaysRemaining = 0;
    let htmlOutput = "";

    function calculateFuturePristineNeed(tierData, currentIndex) {
        let total = 0;
        for (let j = currentIndex + 1; j < tierData.length; j++) {
            total += tierData[j].pristine;
        }
        return total;
    }

    // =========================================================
    // FUNÇÃO PARA CALCULAR EXCEDENTE REAL DE PRISTINE
    // Para um determinado tier, considerando os gastos anteriores
    // =========================================================
    function calculateAvailablePristineForConversion(tierIndex, currentTitleValue) {
        // Soma todos os Pristines necessários para tiers já concluídos?
        // Não, o jogador já gastou esses. Precisamos saber quantos Pristines ele tem HOJE
        // e quantos ele vai precisar gastar neste tier + tiers futuros
        
        let totalFutureNeed = 0;
        for (let j = tierIndex; j < tierData.length; j++) {
            totalFutureNeed += tierData[j].pristine;
        }
        
        // Excedente = Pristines atuais - total necessário para este tier + futuros
        // Se for negativo, não há excedente
        const surplus = originalPristine - totalFutureNeed;
        return Math.max(0, surplus);
    }

    // =========================================================
    // LOOP DAS ETAPAS
    // =========================================================

    for (let i = 0; i < tierData.length; i++) {
        const tier = tierData[i];
        const isCompleted = parseInt(currentTitle) >= tier.level;
        
        // Etapa já concluída
        if (isCompleted) {
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

        // Verifica se este é o PRIMEIRO tier não concluído
        const isNextTier = parseInt(currentTitle) === tier.level - 1;
        
        // Recursos faltando
        let neededPristine = Math.max(0, tier.pristine - wallet.pristine);
        let neededRelics = Math.max(0, tier.relics - wallet.relics);
        let neededMatrices = Math.max(0, tier.matrices - wallet.matrices);
        
        let tierDays = 0;

        // Verifica se farm é impossível
        if (
            (neededPristine > 0 && dPristine === 0) ||
            (neededMatrices > 0 && dMatrices === 0) ||
            (neededRelics > 0 && dRelics === 0 && dPristine === 0)
        ) {
            tierDays = Infinity;
        } else {
            // Simulação diária
            while (true) {
                const futurePristineNeed = calculateFuturePristineNeed(tierData, i);
                const availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);
                const effectiveRelics = wallet.relics + (availablePristineForConversion * 15);

                const canBuy =
                    wallet.pristine >= tier.pristine &&
                    wallet.matrices >= tier.matrices &&
                    effectiveRelics >= tier.relics;

                if (canBuy) break;

                wallet.pristine += dPristine;
                wallet.matrices += dMatrices;
                wallet.relics += dRelics;
                tierDays++;

                if (tierDays > 15000) {
                    tierDays = Infinity;
                    break;
                }
            }
        }

        let stepGate = "__GATE_NONE__";
        let conversionLine = "";

        // =====================================================
        // SÓ EXIBE LINHA DE CONVERSÃO se for o PRÓXIMO título
        // =====================================================
        if (isNextTier && tierDays !== Infinity) {
            // Calcula o excedente REAL baseado nos Pristines originais
            // Subtrai o custo deste tier
            const costThisTier = tier.pristine;
            const surplusAfterThisTier = Math.max(0, originalPristine - costThisTier);
            
            if (surplusAfterThisTier > 0) {
                const relicsFromConversion = surplusAfterThisTier * 15;
                conversionLine = `
                    <br><br>
                    <span style="color: var(--primary); font-size: 12px;">
                        ✨ Excedente seguro: ${surplusAfterThisTier.toLocaleString()} Pristines → +${relicsFromConversion.toLocaleString()} Relics disponíveis para conversão
                    </span>
                `;
            }
        }

        // Executa compra
        if (tierDays !== Infinity) {
            const futurePristineNeed = calculateFuturePristineNeed(tierData, i);
            let availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);

            if (wallet.relics < tier.relics) {
                const relicDeficit = tier.relics - wallet.relics;
                const maxConvertibleRelics = availablePristineForConversion * 15;
                const relicsToCreate = Math.min(relicDeficit, maxConvertibleRelics);
                const pristinesToConvert = Math.ceil(relicsToCreate / 15);

                wallet.pristine -= pristinesToConvert;
                wallet.relics += pristinesToConvert * 15;

                if (pristinesToConvert > 0) {
                    stepGate = "__GATE_NORMAL__";
                }
            }

            wallet.pristine -= tier.pristine;
            wallet.relics -= tier.relics;
            wallet.matrices -= tier.matrices;
            totalDaysRemaining += tierDays;
        }

        // Identifica gargalo
        if (tierDays === 0) {
            stepGate = "__GATE_READY__";
        } else if (tierDays !== Infinity && stepGate === "__GATE_NONE__") {
            const pDays = dPristine > 0 ? neededPristine / dPristine : 0;
            const mDays = dMatrices > 0 ? neededMatrices / dMatrices : 0;
            const rDays = dRelics > 0 ? neededRelics / dRelics : 0;
            const maxDays = Math.max(pDays, mDays, rDays);

            if (maxDays === rDays) {
                stepGate = "__GATE_NORMAL__";
            } else if (maxDays === pDays && maxDays === mDays) {
                stepGate = "__GATE_BOTH__";
            } else if (maxDays === pDays) {
                stepGate = "__GATE_PRISTINE__";
            } else if (maxDays === mDays) {
                stepGate = "__GATE_MATRIX__";
            }
        }

        // Texto visual
        let daysLabel = `+${tierDays} __LBL_DAYS__`;
        if (tierDays === Infinity) {
            daysLabel = "__LBL_INF_DAYS__";
            stepGate = "__LBL_NO_FARM__";
        } else if (tierDays === 0) {
            daysLabel = "__LBL_READY_BUY__";
        }

        htmlOutput += `
            <div class="tier-card">
                <div class="tier-header">
                    <span>${tier.name}</span>
                    <span class="status">${daysLabel}</span>
                </div>

                <strong>__LBL_NEED_STOCK__</strong><br>

                • __LBL_PRISTINES__:
                <span class="resource">
                    ${neededPristine.toLocaleString()}
                </span> |

                • __LBL_RELICS__:
                <span class="resource">
                    ${neededRelics.toLocaleString()}
                </span> |

                • __LBL_MATRICES__:
                <span class="resource">
                    ${neededMatrices.toLocaleString()}
                </span>

                ${conversionLine}

                <br>

                <small style="text-align: left; margin-top: 5px; color: var(--text-secondary); font-size: 12px;">
                    __LBL_GATE__
                    <span style="color: var(--primary); font-weight:600;">
                        ${stepGate}
                    </span>
                </small>
            </div>
        `;
    }

    return res.status(200).json({
        totalDaysRemaining,
        htmlOutput
    });
}