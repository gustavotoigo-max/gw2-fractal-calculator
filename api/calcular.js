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

    // Custos reais das etapas
    const tierData = [
        {
            level: 1,
            name: "Nenhum ➔ Fractal Savant",
            pristine: 0,
            relics: 25000,
            matrices: 75
        },
        {
            level: 2,
            name: "Savant ➔ Fractal Prodigy",
            pristine: 1200,
            relics: 35000,
            matrices: 150
        },
        {
            level: 3,
            name: "Prodigy ➔ Fractal Champion",
            pristine: 0,
            relics: 45000,
            matrices: 225
        },
        {
            level: 4,
            name: "Champion ➔ Fractal God",
            pristine: 2000,
            relics: 55000,
            matrices: 400
        }
    ];

    // Carteira viva
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

    // =========================================================
    // CALCULA QUANTO PRISTINE AINDA SERÁ NECESSÁRIO NO FUTURO
    // =========================================================
    function calculateFuturePristineNeed(tierData, currentIndex) {
        let total = 0;
        for (let j = currentIndex + 1; j < tierData.length; j++) {
            total += tierData[j].pristine;
        }
        return total;
    }

    // =========================================================
    // LOOP DAS ETAPAS
    // =========================================================
    for (let i = 0; i < tierData.length; i++) {
        const tier = tierData[i];

        // Etapa já concluída
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

        // Recursos faltando
        let neededPristine = Math.max(0, tier.pristine - wallet.pristine);
        let neededRelics = Math.max(0, tier.relics - wallet.relics);
        let neededMatrices = Math.max(0, tier.matrices - wallet.matrices);

        let tierDays = 0;

        // =====================================================
        // CHECA SE O FARM É IMPOSSÍVEL
        // =====================================================
        if (
            (neededPristine > 0 && dPristine === 0) ||
            (neededMatrices > 0 && dMatrices === 0) ||
            (neededRelics > 0 && dRelics === 0 && dPristine === 0)
        ) {
            tierDays = Infinity;
        } else {
            // =================================================
            // SIMULAÇÃO DIÁRIA
            // =================================================
            while (true) {
                // Quanto pristine ainda será necessário no futuro?
                const futurePristineNeed = calculateFuturePristineNeed(tierData, i);

                // Quanto pristine pode ser convertido sem prejudicar o futuro?
                const availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);

                // Relics virtuais possíveis após melt
                const effectiveRelics = wallet.relics + (availablePristineForConversion * 15);

                // Verifica se já consegue comprar
                const canBuy =
                    wallet.pristine >= tier.pristine &&
                    wallet.matrices >= tier.matrices &&
                    effectiveRelics >= tier.relics;

                if (canBuy) {
                    break;
                }

                // Acumula recursos do dia
                wallet.pristine += dPristine;
                wallet.matrices += dMatrices;
                wallet.relics += dRelics;

                tierDays++;

                // Proteção
                if (tierDays > 15000) {
                    tierDays = Infinity;
                    break;
                }
            }
        }

        let stepGate = "__GATE_NONE__";

        // =====================================================
        // EXECUTA COMPRA
        // =====================================================
        if (tierDays !== Infinity) {
            // Quanto pristine ainda precisa reservar futuramente?
            const futurePristineNeed = calculateFuturePristineNeed(tierData, i);

            // Quanto pode converter?
            let availablePristineForConversion = Math.max(0, wallet.pristine - futurePristineNeed);

            // Se faltar relic normal
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

            // Deduz custos
            wallet.pristine -= tier.pristine;
            wallet.relics -= tier.relics;
            wallet.matrices -= tier.matrices;

            totalDaysRemaining += tierDays;
        }

        // =====================================================
        // IDENTIFICA GARGALO
        // =====================================================
        if (tierDays === 0) {
            stepGate = "__GATE_READY__";
        } else if (stepGate === "__GATE_NONE__") {
            const pDays = dPristine > 0 ? neededPristine / dPristine : 0;
            const mDays = dMatrices > 0 ? neededMatrices / dMatrices : 0;
            const rDays = dRelics > 0 ? neededRelics / dRelics : 0;
