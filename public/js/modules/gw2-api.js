// public/js/modules/gw2-api.js
import { ACHIEVEMENTS, WALLET_IDS, MATERIAL_IDS, PROGRESSION_IDS } from './constants.js';
import { showLoading, hideLoading } from './loading.js';
import { calculate } from './calculator.js';

export async function fetchFractalData() {
    const apiKey = document.getElementById('apiKey').value.trim();
    localStorage.setItem('savedApiKey', apiKey);

    if (!apiKey) {
        alert("Por favor, insira uma API Key válida.");
        return;
    }

    showLoading();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        console.log("Iniciando sincronização...");

        // Requisições paralelas
        const [walletRes, materialsRes, achievementsRes, accountRes, progressionRes] = await Promise.all([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/progression?access_token=${apiKey}`, { signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        // Verifica erros HTTP (exceto progression que pode ser 200 mesmo sem dados)
        if (!walletRes.ok || !materialsRes.ok || !accountRes.ok) {
            throw new Error(`Erro na API: Wallet=${walletRes.status}, Materials=${materialsRes.status}, Account=${accountRes.status}`);
        }

        const walletData = await walletRes.json();
        const materialsData = await materialsRes.json();
        const achievementsData = await achievementsRes.json();
        const accountData = await accountRes.json();

        // Processa progression (upgrades do Deroir)
        let progressionData = {};
        if (progressionRes.ok) {
            const progressionArray = await progressionRes.json();
            // Converte array em objeto para fácil acesso
            for (const item of progressionArray) {
                progressionData[item.id] = item.value;
            }
        } else {
            console.warn("Erro ao buscar progressões, status:", progressionRes.status);
        }

        // Extrai os níveis atuais de cada upgrade (valor padrão 0 se não existir)
        const empowermentLevel = progressionData[PROGRESSION_IDS.FRACTAL_EMPOWERMENT] || 0;
        const karmicLevel = progressionData[PROGRESSION_IDS.KARMIC_RETRIBUTION] || 0;
        const agonyLevel = progressionData[PROGRESSION_IDS.AGONY_IMPEDANCE] || 0;

        // Armazena globalmente para uso no calculate
        window.upgradesOwned = {
            empowerment: empowermentLevel,
            karmic: karmicLevel,
            agony: agonyLevel
        };

        console.log("Upgrades obtidos:", window.upgradesOwned);

        // Atualiza campos do inventário
        const pristineObj = walletData.find(i => i.id === WALLET_IDS.PRISTINE);
        const pristineInput = document.getElementById('pristine');
        if (pristineInput) pristineInput.value = pristineObj ? pristineObj.value : 0;

        const relicObj = walletData.find(i => i.id === WALLET_IDS.RELICS);
        const relicsInput = document.getElementById('relics');
        if (relicsInput) relicsInput.value = relicObj ? relicObj.value : 0;

        const matrixObj = materialsData.find(i => i.id === MATERIAL_IDS.INTEGRATED_MATRIX);
        const matricesInput = document.getElementById('matrices');
        if (matricesInput) matricesInput.value = matrixObj ? (matrixObj.count || 0) : 0;

        // Detecta título atual (conquistas)
        let detectedTitle = 0;
        if (achievementsData && achievementsData.text === "all ids provided are invalid") {
            detectedTitle = 0;
        } else if (Array.isArray(achievementsData)) {
            if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) detectedTitle = 4;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) detectedTitle = 3;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) detectedTitle = 2;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) detectedTitle = 1;
        }

        const currentTitleSelect = document.getElementById('currentTitle');
        if (currentTitleSelect) currentTitleSelect.value = detectedTitle;

        // Exibe informações da conta
        const titleNames = { 0: "Nenhum", 1: "Fractal Savant", 2: "Fractal Prodigy", 3: "Fractal Champion", 4: "Fractal God" };
        const accountNameSpan = document.getElementById('accountName');
        if (accountNameSpan) accountNameSpan.innerText = accountData.name || "Desconhecida";
        const accountTitleSpan = document.getElementById('accountTitle');
        if (accountTitleSpan) accountTitleSpan.innerText = titleNames[detectedTitle];
        const accountInfoDiv = document.getElementById('accountInfo');
        if (accountInfoDiv) accountInfoDiv.style.display = 'block';

        // Dispara o cálculo (que usará window.upgradesOwned)
        if (typeof calculate === 'function') calculate();

        // Exibe status de sucesso temporariamente
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            apiStatus.style.display = 'block';
            apiStatus.innerText = "✅ Sincronizado com sucesso!";
            setTimeout(() => apiStatus.style.display = 'none', 3000);
        }
    } catch (err) {
        console.error("Erro detalhado:", err);
        let errorMsg = "Falha ao sincronizar. ";
        if (err.name === 'AbortError') errorMsg = "Tempo limite excedido. Verifique sua conexão.";
        else if (err.message.includes("HTTP")) errorMsg += "Erro na comunicação com a API do GW2.";
        else errorMsg += err.message;
        const apiError = document.getElementById('apiError');
        if (apiError) {
            apiError.style.display = 'block';
            apiError.innerText = `❌ ${errorMsg}`;
            setTimeout(() => apiError.style.display = 'none', 8000);
        }
    } finally {
        hideLoading();
    }
}