// api/calcular.js
module.exports = async function handler(req, res) {
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
        dailyRelics,
        upgrades  // objeto vindo do frontend: { empowerment, karmic, agony }
    } = req.body;

    // ======================== DEFINIÇÃO DOS UPGRADES ========================
    const UPGRADE_LIST = [
        { type: "empowerment", level: 1, matrices: 1, relics: 250 },
        { type: "empowerment", level: 2, matrices: 3, relics: 500 },
        { type: "karmic", level: 1, matrices: 1, relics: 500 },
        { type: "karmic", level: 2, matrices: 5, relics: 1000 },
        { type: "agony", level: 1, matrices: 10, relics: 1000 },
        { type: "agony", level: 2, matrices: 15, relics: 2500 }
    ];

    // Níveis atuais (do frontend, via progression API)
    const currentLevels = upgrades || {};
    const currentEmpowerment = currentLevels.empowerment || 0;
    const currentKarmic = currentLevels.karmic || 0;
    const currentAgony = currentLevels.agony || 0;

    // Identifica quais upgrades ainda faltam e soma custos totais
    let missingUpgrades = [];
    let totalMatricesNeededUp = 0;
    let totalRelicsNeededUp = 0;

    for (const up of UPGRADE_LIST) {
        let current = 0;
        if (up.type === "empowerment") current = currentEmpowerment;
        if (up.type === "karmic") current = currentKarmic;
        if (up.type === "agony") current = currentAgony;

        if (current < up.level) {
            missingUpgrades.push(up);
            totalMatricesNeededUp += up.matrices;
            totalRelicsNeededUp += up.relics;
        }
    }

    // ======================== DADOS DOS TIERS (ORIGINAL) ========================
    const tierData = [
        {
            level: 1,
            name: "__TIER1__",
            pristine: 0,
            relics: 25000,
            matrices: 75,
            keepMessage: "__KEEP_MSG_1__"
        },
        {
            level: 2,
            name: "__TIER2__",
            pristine: 1200,
            relics: 35000,
            matrices: 150,
            keepMessage: "__KEEP_MSG_2__"
        },
        {
            level: 3,
            name: "__TIER3__",
            pristine: 0,
            relics: 45000,
            matrices: 225,
            keepMessage: "__KEEP_MSG_3__"
        },
        {
            level: 4,
            name: "__TIER4__",
            pristine: 2000,
            relics: 55000,
            matrices: 300,
            keepMessage: "__KEEP_MSG_4__"
        }
    ];

    const relicsPerMatrix = 15;

    // ================ INICIALIZAÇÃO DA WALLET E GANHOS DIÁRIOS ================
    let wallet = {
        pristine: parseInt(pristine) || 0,
        relics: parseInt(relics) || 0,
        matrices: parseInt(matrices) || 0
    };

    const dPristine = parseInt(dailyPristine) || 0;
    const dMatricesFromCMs = parseInt(dailyMatrices) || 0;
    const dRelics = parseInt(dailyRelics) || 0;

    let totalDaysRemaining = 0;
    let htmlOutput = "";
    let upgradeMessage = "";
    let upgradeDays = 0;

    // ======================== PROCESSAMENTO DOS UPGRADES (SE TÍTULO 0) ========================
    if (parseInt(currentTitle) === 0 && missingUpgrades.length > 0) {
        // Cálculo dos dias necessários para juntar os recursos faltantes
        let missingMatrices = Math.max(0, totalMatricesNeededUp - wallet.matrices);
        let missingRelics = Math.max(0, totalRelicsNeededUp - wallet.relics);
        let tempMatrices = wallet.matrices;
        let tempRelics = wallet.relics;

        while ((missingMatrices > 0 || missingRelics > 0) && upgradeDays < 10000) {
            tempMatrices += dMatricesFromCMs;
            tempRelics += dRelics;
            missingMatrices = Math.max(0, totalMatricesNeededUp - tempMatrices);
            missingRelics = Math.max(0, totalRelicsNeededUp - tempRelics);
            upgradeDays++;
        }

        // Subtrai os custos da wallet (como se já tivessem sido pagos)
        wallet.matrices = Math.max(0, wallet.matrices - totalMatricesNeededUp);
        wallet.relics = Math.max(0, wallet.relics - totalRelicsNeededUp);

        // Monta a mensagem de upgrades pendentes para exibir no card do primeiro título
        upgradeMessage = `
            <div style="margin-top: 10px; padding: 8px; background: rgba(229,169,60,0.1); border-radius: 6px;">
                <strong>⚠️ Upgrades obrigatórios pendentes (necessários para Fractal Savant):</strong><br>
                ${missingUpgrades.map(up => {
                    let name = "";
                    if (up.type === "empowerment") name = "Fractal Empowerment";
                    else if (up.type === "karmic") name = "Karmic Retribution";
                    else name = "Agony Impedance";
                    return `• ${name} ${up.level}: ${up.matrices} Matrizes + ${up.relics} Relics`;
                }).join('<br>')}
                ${upgradeDays > 0 ? `<br>⏱️ Tempo estimado para concluir upgrades: +${upgradeDays} dias` : '<br>✅ Você já possui os recursos necessários para comprar todos os upgrades!'}
            </div>
        `;

        totalDaysRemaining += upgradeDays;
    } else if (parseInt(currentTitle) === 0 && missingUpgrades.length === 0) {
        // Já possui todos os upgrades, não precisa de mensagem de pendência, mas pode exibir uma mensagem opcional
        upgradeMessage = `
            <div style="margin-top: 10px; padding: 8px; background: rgba(46,204,113,0.1); border-radius: 6px; color: #2ecc71;">
                ✅ Você já possui todos os upgrades obrigatórios! Agora só falta acumular os recursos para o título.
            </div>
        `;
    }

    // ======================== FUNÇÃO AUXILIAR (FUTURE PRISTINE NEED) ========================
    function calculateFuturePristineNeed(tierData, currentIndex) {
        let total = 0;
        for (let j = currentIndex + 1; j < tierData.length; j++) {
            total += tierData[j].pristine;
        }
        return total;
    }

    // ======================== LOOP PRINCIPAL DOS TIERS ========================
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
                ${tier.keepMessage}
            </span>
        `;

        // Se o tier já foi concluído, apenas exibe como concluído
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

        // Verifica se é possível progredir (ganhos diários >0 ou recursos já suficientes)
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
            // Simula dias até conseguir comprar este tier
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

                if (canBuy) break;

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

        // Após conseguir comprar, atualiza a wallet (gastos)
        if (tierDays !== Infinity) {
            const futurePristineNeed = calculateFuturePristineNeed(tierData, i);
            let availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);

            // Compra de matrizes com relics, se necessário
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

            // Compra de relics com pristines, se necessário
            if (wallet.relics < tier.relics) {
                const relicDeficit = tier.relics - wallet.relics;
                const maxConvertibleRelics = availablePristineForConversion * 15;
                const relicsToCreate = Math.min(relicDeficit, maxConvertibleRelics);
                const pristinesToConvert = Math.ceil(relicsToCreate / 15);
                wallet.pristine -= pristinesToConvert;
                wallet.relics += pristinesToConvert * 15;
            }

            // Gasta os recursos do tier
            wallet.pristine -= tier.pristine;
            wallet.relics -= tier.relics;
            wallet.matrices -= tier.matrices;

            totalDaysRemaining += tierDays;
        }

        // Geração do aviso de conversão (excedente seguro) para o tier atual (se for o próximo)
        let convertWarningPlaceholder = "";
        if (isNextTier && tierDays !== Infinity) {
            let futurePristineNeed = 0;
            for (let k = i + 1; k < tierData.length; k++) {
                futurePristineNeed += tierData[k].pristine;
            }
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

        // Monta o card do tier
        let tierCardHtml = `
            <div class="tier-card ${futureClass}">
                <div class="tier-header">
                    <span>${tier.name}</span>
                    <span class="status">${daysLabel}</span>
                </div>
                <strong>__LBL_NEED_STOCK__</strong><br>
                • __LBL_PRISTINES__: <span class="resource">${neededPristine.toLocaleString()}</span> |
                • __LBL_RELICS__: <span class="resource">${neededRelics.toLocaleString()}</span> |
                • __LBL_MATRICES__: <span class="resource">${neededMatrices.toLocaleString()}</span>
                ${keepMessageHtml}
                ${convertWarningPlaceholder}
        `;

        // Se for o primeiro tier (Savant) e houver mensagem de upgrade, insere antes do keepMessage
        if (i === 0 && upgradeMessage) {
            // Insere a mensagem de upgrade logo após o cabeçalho e antes dos recursos
            tierCardHtml = tierCardHtml.replace('<strong>__LBL_NEED_STOCK__</strong><br>', upgradeMessage + '<br><strong>__LBL_NEED_STOCK__</strong><br>');
        }

        tierCardHtml += `</div>`;
        htmlOutput += tierCardHtml;
    }

    // ======================== RESPOSTA FINAL ========================
    return res.status(200).json({
        totalDaysRemaining,
        htmlOutput
    });
};