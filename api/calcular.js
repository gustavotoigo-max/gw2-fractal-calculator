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
            matrices: 75,
            keepMessage: "Mantenha 25.000 Fractal Relics para próximo título"
        },
        {
            level: 2,
            name: "__TIER2__",
            pristine: 1200,
            relics: 35000,
            matrices: 150,
            keepMessage: "Mantenha 1.200 Pristines e 35.000 Fractal Relics para próximo título"
        },
        {
            level: 3,
            name: "__TIER3__",
            pristine: 0,
            relics: 45000,
            matrices: 225,
            keepMessage: "Mantenha 45.000 Fractal Relics para próximo título"
        },
        {
            level: 4,
            name: "__TIER4__",
            pristine: 2000,
            relics: 55000,
            matrices: 400,
            keepMessage: "Mantenha 2.000 Pristines e 55.000 Fractal Relics para próximo título"
        }
    ];

    // Configuração de conversão
    const relicsPerMatrix = 15; // 15 Relics = 1 Integrated Matrix
    
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
    const dMatricesFromCMs = parseInt(dailyMatrices) || 0; // Matrices grátis via CMs
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

    // Função para calcular quantas Matrices podem ser obtidas por dia
    function getDailyMatrices(relicsAvailable) {
        // Prioriza Matrices grátis das CMs
        let matricesGained = dMatricesFromCMs;
        let remainingRelics = relicsAvailable;
        
        // Se ainda precisar de mais Matrices, compra com Relics
        // Nota: isso é usado na simulação, não na compra real
        return matricesGained;
    }

    for (let i = 0; i < tierData.length; i++) {
        const tier = tierData[i];
        const isCompleted = parseInt(currentTitle) >= tier.level;
        const isNextTier = parseInt(currentTitle) === tier.level - 1;
        const isFutureTier = !isCompleted && !isNextTier && parseInt(currentTitle) < tier.level - 1;
        
        const futureClass = isFutureTier ? 'future-tier' : '';
        
        let neededPristine = Math.max(0, tier.pristine - wallet.pristine);
        let neededRelics = Math.max(0, tier.relics - wallet.relics);
        let neededMatrices = Math.max(0, tier.matrices - wallet.matrices);
        
        let tierDays = 0;

        const keepMessageHtml = `
            <br><br>
            <span style="color: var(--text-secondary); font-size: 12px;">
                📌 ${tier.keepMessage}
            </span>
        `;

        if (isCompleted) {
            htmlOutput += `
                <div class="tier-card completed ${futureClass}">
                    <div class="tier-header">
                        <span>${tier.name}</span>
                        <span class="status">__LBL_COMPLETED__</span>
                    </div>
                    <div>__LBL_ALREADY_DONE__</div>
                </div>
            `;
            continue;
        }

        // =====================================================
        // VERIFICA SE É POSSÍVEL PROGREDIR
        // =====================================================
        
        // Pristine: só consegue se tiver ganho diário ou já tiver o suficiente
        const canGetPristine = dPristine > 0 || wallet.pristine >= tier.pristine;
        
        // Matrices: consegue via CMs (grátis) OU comprando com Relics
        const canGetMatrices = dMatricesFromCMs > 0 || dRelics > 0 || wallet.matrices >= tier.matrices;
        
        // Relics: consegue via ganho diário ou conversão de Pristine
        const canGetRelics = dRelics > 0 || dPristine > 0 || wallet.relics >= tier.relics;
        
        if (
            (neededPristine > 0 && !canGetPristine) ||
            (neededMatrices > 0 && !canGetMatrices) ||
            (neededRelics > 0 && !canGetRelics)
        ) {
            tierDays = Infinity;
        } else {
            // =================================================
            // SIMULAÇÃO DIÁRIA
            // =================================================
            while (true) {
                // Calcula Pristine disponível para conversão
                const futurePristineNeed = calculateFuturePristineNeed(tierData, i);
                const availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);
                
                // Relics considerando conversão de Pristine excedente
                const effectiveRelics = wallet.relics + (availablePristineForConversion * 15);
                
                // Matrices considerando compra com Relics
                let effectiveMatrices = wallet.matrices;
                
                // Se faltar Matrices, verifica se pode comprar com Relics
                if (effectiveMatrices < tier.matrices) {
                    const matrixDeficit = tier.matrices - effectiveMatrices;
                    const relicsNeededForMatrices = matrixDeficit * relicsPerMatrix;
                    
                    // Se tiver Relics suficientes (incluindo conversão), compra
                    if (effectiveRelics >= relicsNeededForMatrices) {
                        effectiveMatrices = tier.matrices;
                    }
                }

                // Verifica se já consegue comprar
                const canBuy =
                    wallet.pristine >= tier.pristine &&
                    effectiveMatrices >= tier.matrices &&
                    effectiveRelics >= tier.relics;

                if (canBuy) {
                    break;
                }

                // =============================================
                // ACUMULA RECURSOS DO DIA
                // =============================================
                
                // 1. Acumula Pristine (sempre, se tiver farm)
                wallet.pristine += dPristine;
                
                // 2. Acumula Relics base
                wallet.relics += dRelics;
                
                // 3. Acumula Matrices grátis das CMs
                wallet.matrices += dMatricesFromCMs;
                
                // 4. Se não tiver CM ativo mas precisa de Matrices, o jogador 
                //    pode optar por converter Relics em Matrices.
                //    Isso será feito no momento da compra, não na simulação diária.
                
                tierDays++;

                if (tierDays > 15000) {
                    tierDays = Infinity;
                    break;
                }
            }
        }

        let conversionLine = "";

        // =====================================================
        // EXECUTA COMPRA (se não for infinito)
        // =====================================================

        if (tierDays !== Infinity) {
            const futurePristineNeed = calculateFuturePristineNeed(tierData, i);
            let availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);

            // 1. Primeiro, compra Matrices se necessário (usando Relics)
            if (wallet.matrices < tier.matrices) {
                const matrixDeficit = tier.matrices - wallet.matrices;
                const relicsNeeded = matrixDeficit * relicsPerMatrix;
                
                // Verifica se tem Relics suficientes (incluindo conversão de Pristine)
                let totalRelicsAvailable = wallet.relics + (availablePristineForConversion * 15);
                
                if (totalRelicsAvailable >= relicsNeeded) {
                    // Precisa converter Pristine em Relics?
                    let relicsToUse = Math.min(wallet.relics, relicsNeeded);
                    let remainingRelicsNeeded = relicsNeeded - relicsToUse;
                    
                    if (remainingRelicsNeeded > 0) {
                        // Converte Pristine para Relics
                        const pristinesToConvert = Math.ceil(remainingRelicsNeeded / 15);
                        wallet.pristine -= pristinesToConvert;
                        wallet.relics += pristinesToConvert * 15;
                        relicsToUse += pristinesToConvert * 15;
                    }
                    
                    // Compra as Matrices
                    wallet.relics -= relicsNeeded;
                    wallet.matrices += matrixDeficit;
                }
            }

            // 2. Depois, compra Relics se necessário (convertendo Pristine excedente)
            if (wallet.relics < tier.relics) {
                const relicDeficit = tier.relics - wallet.relics;
                const maxConvertibleRelics = availablePristineForConversion * 15;
                const relicsToCreate = Math.min(relicDeficit, maxConvertibleRelics);
                const pristinesToConvert = Math.ceil(relicsToCreate / 15);

                wallet.pristine -= pristinesToConvert;
                wallet.relics += pristinesToConvert * 15;
            }

            // 3. Deduz custos do tier
            wallet.pristine -= tier.pristine;
            wallet.relics -= tier.relics;
            wallet.matrices -= tier.matrices;
            
            totalDaysRemaining += tierDays;
        }

        // =====================================================
        // GERAR LINHA DE CONVERSÃO (se for o próximo título)
        // =====================================================

        if (isNextTier && tierDays !== Infinity) {
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

        // =====================================================
        // TEXTO VISUAL
        // =====================================================

        let daysLabel = `+${tierDays} __LBL_DAYS__`;
        if (tierDays === Infinity) {
            daysLabel = "__LBL_INF_DAYS__";
        } else if (tierDays === 0) {
            daysLabel = "__LBL_READY_BUY__";
        }

        htmlOutput += `
            <div class="tier-card ${futureClass}">
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
                ${keepMessageHtml}
            </div>
        `;
    }

    return res.status(200).json({
        totalDaysRemaining,
        htmlOutput
    });
}