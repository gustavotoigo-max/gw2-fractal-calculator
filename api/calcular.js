// api/calcular.js (CommonJS)
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
        upgrades
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

    const currentLevels = upgrades || {};
    const currentEmpowerment = currentLevels.empowerment || 0;
    const currentKarmic = currentLevels.karmic || 0;
    const currentAgony = currentLevels.agony || 0;

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

    // ======================== DADOS DOS TIERS ========================
    const tierData = [
        { level: 1, name: "__TIER1__", pristine: 0, relics: 25000, matrices: 75, keepMessage: "__KEEP_MSG_1__" },
        { level: 2, name: "__TIER2__", pristine: 1200, relics: 35000, matrices: 150, keepMessage: "__KEEP_MSG_2__" },
        { level: 3, name: "__TIER3__", pristine: 0, relics: 45000, matrices: 225, keepMessage: "__KEEP_MSG_3__" },
        { level: 4, name: "__TIER4__", pristine: 2000, relics: 55000, matrices: 300, keepMessage: "__KEEP_MSG_4__" }
    ];

    const relicsPerMatrix = 15;

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

    // ======================== PROCESSAMENTO DOS UPGRADES ========================
    if (parseInt(currentTitle) === 0 && missingUpgrades.length > 0) {
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

        wallet.matrices = Math.max(0, wallet.matrices - totalMatricesNeededUp);
        wallet.relics = Math.max(0, wallet.relics - totalRelicsNeededUp);

        // Geração da mensagem com placeholders para os nomes dos upgrades
        let upgradesListHtml = missingUpgrades.map(up => {
            let placeholder = "";
            if (up.type === "empowerment" && up.level === 1) placeholder = "__UPGRADE_EMPOWERMENT_1__";
            else if (up.type === "empowerment" && up.level === 2) placeholder = "__UPGRADE_EMPOWERMENT_2__";
            else if (up.type === "karmic" && up.level === 1) placeholder = "__UPGRADE_KARMIC_1__";
            else if (up.type === "karmic" && up.level === 2) placeholder = "__UPGRADE_KARMIC_2__";
            else if (up.type === "agony" && up.level === 1) placeholder = "__UPGRADE_AGONY_1__";
            else if (up.type === "agony" && up.level === 2) placeholder = "__UPGRADE_AGONY_2__";
            return `• ${placeholder}: ${up.matrices} Matrix + ${up.relics} Relics`;
        }).join('<br>');

        upgradeMessage = `
            <div style="margin-top: 10px; padding: 8px; background: rgba(229,169,60,0.1); border-radius: 6px;">
                <strong>⚠️ __UPGRADE_WARNING_TITLE__</strong><br>
                ${upgradesListHtml}
                ${upgradeDays > 0 ? `<br>⏱️ __UPGRADE_DAYS_ESTIMATE__: +${upgradeDays} __LBL_DAYS__` : ''}
            </div>
        `;
        totalDaysRemaining += upgradeDays;
    } else if (parseInt(currentTitle) === 0 && missingUpgrades.length === 0) {
        upgradeMessage = `
            <div style="margin-top: 10px; padding: 8px; background: rgba(46,204,113,0.1); border-radius: 6px; color: #2ecc71;">
                ✅ __UPGRADE_ALL_DONE__
            </div>
        `;
    }

    // ======================== FUNÇÃO AUXILIAR ========================
    function calculateFuturePristineNeed(tierData, currentIndex) {
        let total = 0;
        for (let j = currentIndex + 1; j < tierData.length; j++) {
            total += tierData[j].pristine;
        }
        return total;
    }

    // ======================== LOOP PRINCIPAL ========================
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

        const keepMessageHtml = `<br><br><span style="color: var(--text-secondary); font-size: 12px;">${tier.keepMessage}</span>`;

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

        if ((neededPristine > 0 && !canGetPristine) ||
            (neededMatrices > 0 && !canGetMatrices) ||
            (neededRelics > 0 && !canGetRelics)) {
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
                    if (effectiveRelics >= relicsNeededForMatrices) effectiveMatrices = tier.matrices;
                }
                const canBuy = wallet.pristine >= tier.pristine &&
                               effectiveMatrices >= tier.matrices &&
                               effectiveRelics >= tier.relics;
                if (canBuy) break;
                wallet.pristine += dPristine;
                wallet.relics += dRelics;
                wallet.matrices += dMatricesFromCMs;
                tierDays++;
                if (tierDays > 15000) { tierDays = Infinity; break; }
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

        let convertWarningPlaceholder = "";
        if (isNextTier && tierDays !== Infinity) {
            let futurePristineNeed = 0;
            for (let k = i + 1; k < tierData.length; k++) futurePristineNeed += tierData[k].pristine;
            const safeSurplus = Math.max(0, wallet.pristine - futurePristineNeed);
            if (safeSurplus > 0) {
                convertWarningPlaceholder = `__CONVERT_WARNING_${safeSurplus}_${safeSurplus * 15}__`;
            }
        }

        let daysLabel = `+${tierDays} __LBL_DAYS__`;
        if (tierDays === Infinity) daysLabel = "__LBL_INF_DAYS__";
        else if (tierDays === 0) daysLabel = "__LBL_READY_BUY__";

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
        if (i === 0 && upgradeMessage) {
            tierCardHtml = tierCardHtml.replace('<strong>__LBL_NEED_STOCK__</strong><br>', upgradeMessage + '<br><strong>__LBL_NEED_STOCK__</strong><br>');
        }
        tierCardHtml += `</div>`;
        htmlOutput += tierCardHtml;
    }

    return res.status(200).json({
        totalDaysRemaining,
        htmlOutput
    });
};