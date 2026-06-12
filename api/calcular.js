export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const {
        lang,
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
            level: i = 1,
            name: "__TIER1__",
            pristine: 0,
            relics: 25000,
            matrices: 75,
            keepMessage: keepMessages[selectedLang][i]
        },
        {
            level: i = 2,
            name: "__TIER2__",
            pristine: 1200,
            relics: 35000,
            matrices: 150,
            keepMessage: keepMessages[selectedLang][i]
        },
        {
            level: i = 3,
            name: "__TIER3__",
            pristine: 0,
            relics: 45000,
            matrices: 225,
            keepMessage: keepMessages[selectedLang][i]
        },
        {
            level: i = 4,
            name: "__TIER4__",
            pristine: 2000,
            relics: 55000,
            matrices: 300,
            keepMessage: keepMessages[selectedLang][i]
        }
    ];

    const relicsPerMatrix = 15;
    
    const originalPristine = parseInt(pristine) || 0;
    const originalRelics = parseInt(relics) || 0;
    const originalMatrices = parseInt(matrices) || 0;

    let wallet = {
        pristine: originalPristine,
        relics: originalRelics,
        matrices: originalMatrices
    };

    const dPristine = parseInt(dailyPristine) || 0;
    const dMatricesFromCMs = parseInt(dailyMatrices) || 0;
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

        const keepMessages = {
    pt: [
        "Mantenha 25.000 Fractal Relics para próximo título",
        "Mantenha 1.200 Pristines e 35.000 Fractal Relics para próximo título",
        "Mantenha 45.000 Fractal Relics para próximo título",
        "Mantenha 2.000 Pristines e 55.000 Fractal Relics para próximo título"
    ],
    en: [
        "Keep 25,000 Fractal Relics for the next title",
        "Keep 1,200 Pristines and 35,000 Fractal Relics for the next title",
        "Keep 45,000 Fractal Relics for the next title",
        "Keep 2,000 Pristines and 55,000 Fractal Relics for the next title"
    ]
};

const selectedLang = (lang === 'pt' ? 'pt' : 'en');

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

        const canGetPristine = dPristine > 0 || wallet.pristine >= tier.pristine;
        const canGetMatrices = dMatricesFromCMs > 0 || dRelics > 0 || wallet.matrices >= tier.matrices;
        const canGetRelics = dRelics > 0 || dPristine > 0 || wallet.relics >= tier.relics;
        
        if (
            (neededPristine > 0 && !canGetPristine) ||
            (neededMatrices > 0 && !canGetMatrices) ||
            (neededRelics > 0 && !canGetRelics)
        ) {
            tierDays = Infinity;
        } else {
            while (true) {
                const futurePristineNeed = calculateFuturePristineNeed(tierData, i);
                const availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);
                const effectiveRelics = wallet.relics + (availablePristineForConversion * 15);
                
                let effectiveMatrices = wallet.matrices;
                
                if (effectiveMatrices < tier.matrices) {
                    const matrixDeficit = tier.matrices - effectiveMatrices;
                    const relicsNeededForMatrices = matrixDeficit * relicsPerMatrix;
                    
                    if (effectiveRelics >= relicsNeededForMatrices) {
                        effectiveMatrices = tier.matrices;
                    }
                }

                const canBuy =
                    wallet.pristine >= tier.pristine &&
                    effectiveMatrices >= tier.matrices &&
                    effectiveRelics >= tier.relics;

                if (canBuy) {
                    break;
                }

                wallet.pristine += dPristine;
                wallet.relics += dRelics;
                wallet.matrices += dMatricesFromCMs;
                
                tierDays++;

                if (tierDays > 15000) {
                    tierDays = Infinity;
                    break;
                }
            }
        }

        if (tierDays !== Infinity) {
            const futurePristineNeed = calculateFuturePristineNeed(tierData, i);
            let availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);

            if (wallet.matrices < tier.matrices) {
                const matrixDeficit = tier.matrices - wallet.matrices;
                const relicsNeeded = matrixDeficit * relicsPerMatrix;
                
                let totalRelicsAvailable = wallet.relics + (availablePristineForConversion * 15);
                
                if (totalRelicsAvailable >= relicsNeeded) {
                    let relicsToUse = Math.min(wallet.relics, relicsNeeded);
                    let remainingRelicsNeeded = relicsNeeded - relicsToUse;
                    
                    if (remainingRelicsNeeded > 0) {
                        const pristinesToConvert = Math.ceil(remainingRelicsNeeded / 15);
                        wallet.pristine -= pristinesToConvert;
                        wallet.relics += pristinesToConvert * 15;
                        relicsToUse += pristinesToConvert * 15;
                    }
                    
                    wallet.relics -= relicsNeeded;
                    wallet.matrices += matrixDeficit;
                }
            }

            if (wallet.relics < tier.relics) {
                const relicDeficit = tier.relics - wallet.relics;
                const maxConvertibleRelics = availablePristineForConversion * 15;
                const relicsToCreate = Math.min(relicDeficit, maxConvertibleRelics);
                const pristinesToConvert = Math.ceil(relicsToCreate / 15);

                wallet.pristine -= pristinesToConvert;
                wallet.relics += pristinesToConvert * 15;
            }

            wallet.pristine -= tier.pristine;
            wallet.relics -= tier.relics;
            wallet.matrices -= tier.matrices;
            
            totalDaysRemaining += tierDays;
        }

        // =====================================================
        // GERAR AVISO DE CONVERSÃO (excedente seguro) - apenas para o próximo título
        // =====================================================
        let convertWarningPlaceholder = "";
        if (isNextTier && tierDays !== Infinity) {
            // Soma dos Pristine necessários para os próximos tiers (depois deste)
            let futurePristineNeed = 0;
            for (let k = i + 1; k < tierData.length; k++) {
                futurePristineNeed += tierData[k].pristine;
            }
            // Excedente seguro = o que sobra de Pristine após pagar este tier e reservar para os futuros
            const safeSurplus = Math.max(0, wallet.pristine - futurePristineNeed);
            if (safeSurplus > 0) {
                const relicsFromSurplus = safeSurplus * 15;
                convertWarningPlaceholder = `__CONVERT_WARNING_${safeSurplus}_${relicsFromSurplus}__`;
            }
        }

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

                ${keepMessageHtml}
                ${convertWarningPlaceholder}
            </div>
        `;
    }

    return res.status(200).json({
        totalDaysRemaining,
        htmlOutput
    });
}