// public/js/modules/gw2-api.js
import { ACHIEVEMENTS, WALLET_IDS, MATERIAL_IDS, PROGRESSION_IDS } from './constants.js';
import { showLoading, hideLoading } from './loading.js';
import { calculate } from './calculator.js';

// Função para extrair mensagem de erro de uma resposta HTTP
async function getErrorMessage(response, defaultMsg) {
    try {
        const errorData = await response.json();
        return errorData.text || errorData.error || defaultMsg;
    } catch {
        return defaultMsg;
    }
}

// Função para verificar se a resposta é ok (status 2xx)
function isOk(response) {
    return response && response.ok;
}

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
        // Todas as 5 requisições (uma pode falhar sem abortar as outras)
        const results = await Promise.allSettled([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/progression?access_token=${apiKey}`, { signal: controller.signal })
        ]);
        clearTimeout(timeoutId);

        // Helper para saber se uma requisição foi bem-sucedida (rede + HTTP ok)
        const isSuccess = (result) => result.status === 'fulfilled' && result.value && isOk(result.value);

        // 1. Account (obrigatório)
        const accountResult = results[3];
        if (!isSuccess(accountResult)) {
            throw new Error("account: falha ao obter dados da conta");
        }

        // 2. Wallet (obrigatório)
        const walletResult = results[0];
        if (!isSuccess(walletResult)) {
            throw new Error("wallet: falha ao obter dados da carteira");
        }

        // 3. Materials (obrigatório)
        const materialsResult = results[1];
        if (!isSuccess(materialsResult)) {
            throw new Error("materials: falha ao obter materiais");
        }

        // 4. Achievements (não obrigatório – se falhar, apenas não atualiza título)
        let currentTitle = parseInt(document.getElementById('currentTitle').value) || 0; // valor manual atual
        const achievementsResult = results[2];
        if (isSuccess(achievementsResult)) {
            try {
                const achievementsData = await achievementsResult.value.json();
                if (Array.isArray(achievementsData)) {
                    if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) currentTitle = 4;
                    else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) currentTitle = 3;
                    else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) currentTitle = 2;
                    else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) currentTitle = 1;
                }
            } catch (e) {
                console.warn("Erro ao parsear achievements", e);
            }
        } else {
            console.warn("Achievements não disponível (possível falta do escopo 'progression'). Título mantido como selecionado manualmente.");
        }

        // 5. Progression (obrigatório apenas se currentTitle == 0)
        const progressionResult = results[4];
        let progressionOk = isSuccess(progressionResult);
        if (currentTitle === 0 && !progressionOk) {
            throw new Error("progression: necessário para usuários sem título");
        }

        // Se chegou aqui, temos todos os dados obrigatórios
        const walletData = await walletResult.value.json();
        const materialsData = await materialsResult.value.json();
        const accountData = await accountResult.value.json();

        let progressionData = {};
        if (progressionOk) {
            const progressionArray = await progressionResult.value.json();
            for (const item of progressionArray) {
                progressionData[item.id] = item.value;
            }
        }

        // Atualiza upgrades
        const empowermentLevel = progressionData[PROGRESSION_IDS.FRACTAL_EMPOWERMENT] || 0;
        const karmicLevel = progressionData[PROGRESSION_IDS.KARMIC_RETRIBUTION] || 0;
        const agonyLevel = progressionData[PROGRESSION_IDS.AGONY_IMPEDANCE] || 0;
        window.upgradesOwned = {
            empowerment: empowermentLevel,
            karmic: karmicLevel,
            agony: agonyLevel
        };

        // Preenche os campos da UI
        document.getElementById('pristine').value = walletData.find(i => i.id === WALLET_IDS.PRISTINE)?.value || 0;
        document.getElementById('relics').value = walletData.find(i => i.id === WALLET_IDS.RELICS)?.value || 0;
        document.getElementById('matrices').value = materialsData.find(i => i.id === MATERIAL_IDS.INTEGRATED_MATRIX)?.count || 0;
        document.getElementById('currentTitle').value = currentTitle;

        const titleNames = { 0: "Nenhum", 1: "Fractal Savant", 2: "Fractal Prodigy", 3: "Fractal Champion", 4: "Fractal God" };
        document.getElementById('accountName').innerText = accountData.name || "Desconhecida";
        document.getElementById('accountTitle').innerText = titleNames[currentTitle];
        document.getElementById('accountInfo').style.display = 'block';

        calculate();

        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            apiStatus.style.display = 'block';
            apiStatus.innerText = "✅ Sincronizado com sucesso!";
            setTimeout(() => apiStatus.style.display = 'none', 3000);
        }
    } catch (err) {
        console.error("Erro durante sincronização:", err);
        // Extrai qual escopo faltou baseado na mensagem
        let missingScope = "";
        if (err.message.includes("account")) missingScope = "account";
        else if (err.message.includes("wallet")) missingScope = "wallet";
        else if (err.message.includes("materials")) missingScope = "inventories";
        else if (err.message.includes("progression")) missingScope = "progression";

        let errorMsg = "";
        if (missingScope) {
            errorMsg = `Erro (Marcar ${missingScope} na criacao da API)`;
        } else if (err.name === 'AbortError') {
            errorMsg = "⏱️ Tempo limite excedido. Verifique sua conexão.";
        } else if (err.message.includes("Failed to fetch")) {
            errorMsg = "🌐 Não foi possível conectar à API do GW2. Verifique sua internet, firewall ou extensões.";
        } else {
            errorMsg = `❌ Falha inesperada: ${err.message}`;
        }

        const apiError = document.getElementById('apiError');
        if (apiError) {
            apiError.style.display = 'block';
            apiError.innerHTML = errorMsg;
            setTimeout(() => apiError.style.display = 'none', 10000);
        }
    } finally {
        hideLoading();
    }
}