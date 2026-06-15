// public/js/modules/gw2-api.js
import { ACHIEVEMENTS, WALLET_IDS, MATERIAL_IDS, PROGRESSION_IDS } from './constants.js';
import { showLoading, hideLoading } from './loading.js';
import { calculate } from './calculator.js';

// Função auxiliar para extrair mensagem de erro da resposta da API
async function getErrorMessage(response, defaultMsg) {
    try {
        const errorData = await response.json();
        if (errorData.text) return errorData.text;
        if (errorData.error) return errorData.error;
        return defaultMsg;
    } catch (e) {
        return defaultMsg;
    }
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
        console.log("Iniciando sincronização...");

        // Realiza todas as requisições em paralelo
        const [walletRes, materialsRes, achievementsRes, accountRes, progressionRes] = await Promise.all([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/progression?access_token=${apiKey}`, { signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        // Array para armazenar quais endpoints falharam
        const failedEndpoints = [];
        const requiredScopes = ['account', 'inventories', 'wallet', 'progression'];

        // Verifica cada resposta
        if (!accountRes.ok) failedEndpoints.push('account');
        if (!walletRes.ok) failedEndpoints.push('wallet');
        if (!materialsRes.ok) failedEndpoints.push('inventories');
        if (!progressionRes.ok) failedEndpoints.push('progression');
        // Achievements pode falhar se o usuário não tiver permissão (mas é menos crítico)

        if (failedEndpoints.length > 0) {
            // Tenta obter a mensagem de erro de uma das respostas (ex.: 403)
            let sampleRes = null;
            if (!accountRes.ok) sampleRes = accountRes;
            else if (!walletRes.ok) sampleRes = walletRes;
            else if (!materialsRes.ok) sampleRes = materialsRes;
            else if (!progressionRes.ok) sampleRes = progressionRes;

            let errorDetail = "";
            if (sampleRes && sampleRes.status === 403) {
                const errorMsg = await getErrorMessage(sampleRes, "Permissão negada. Verifique os escopos da sua API Key.");
                if (errorMsg.includes("permission") || errorMsg.includes("scope")) {
                    errorDetail = ` Permissões necessárias: ${requiredScopes.join(', ')}. A sua chave não possui: ${failedEndpoints.join(', ')}.`;
                } else {
                    errorDetail = ` ${errorMsg}`;
                }
            } else if (sampleRes && sampleRes.status === 401) {
                errorDetail = " API Key inválida ou expirada. Gere uma nova chave no site da ArenaNet.";
            } else {
                errorDetail = ` Status ${sampleRes?.status}: ${sampleRes?.statusText || 'Erro desconhecido'}.`;
            }

            throw new Error(`Falha ao acessar os seguintes endpoints: ${failedEndpoints.join(', ')}.${errorDetail}`);
        }

        // Se chegou aqui, todas as respostas estão OK (status 2xx)
        const walletData = await walletRes.json();
        const materialsData = await materialsRes.json();
        const achievementsData = await achievementsRes.json();
        const accountData = await accountRes.json();
        const progressionArray = await progressionRes.json();

        // Processa progression (upgrades)
        let progressionData = {};
        for (const item of progressionArray) {
            progressionData[item.id] = item.value;
        }

        const empowermentLevel = progressionData[PROGRESSION_IDS.FRACTAL_EMPOWERMENT] || 0;
        const karmicLevel = progressionData[PROGRESSION_IDS.KARMIC_RETRIBUTION] || 0;
        const agonyLevel = progressionData[PROGRESSION_IDS.AGONY_IMPEDANCE] || 0;

        window.upgradesOwned = {
            empowerment: empowermentLevel,
            karmic: karmicLevel,
            agony: agonyLevel
        };

        // Atualiza campos
        const pristineObj = walletData.find(i => i.id === WALLET_IDS.PRISTINE);
        const pristineInput = document.getElementById('pristine');
        if (pristineInput) pristineInput.value = pristineObj ? pristineObj.value : 0;

        const relicObj = walletData.find(i => i.id === WALLET_IDS.RELICS);
        const relicsInput = document.getElementById('relics');
        if (relicsInput) relicsInput.value = relicObj ? relicObj.value : 0;

        const matrixObj = materialsData.find(i => i.id === MATERIAL_IDS.INTEGRATED_MATRIX);
        const matricesInput = document.getElementById('matrices');
        if (matricesInput) matricesInput.value = matrixObj ? (matrixObj.count || 0) : 0;

        // Detecta título
        let detectedTitle = 0;
        if (achievementsData && achievementsData.text !== "all ids provided are invalid") {
            if (Array.isArray(achievementsData)) {
                if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) detectedTitle = 4;
                else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) detectedTitle = 3;
                else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) detectedTitle = 2;
                else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) detectedTitle = 1;
            }
        }

        const currentTitleSelect = document.getElementById('currentTitle');
        if (currentTitleSelect) currentTitleSelect.value = detectedTitle;

        const titleNames = { 0: "Nenhum", 1: "Fractal Savant", 2: "Fractal Prodigy", 3: "Fractal Champion", 4: "Fractal God" };
        const accountNameSpan = document.getElementById('accountName');
        if (accountNameSpan) accountNameSpan.innerText = accountData.name || "Desconhecida";
        const accountTitleSpan = document.getElementById('accountTitle');
        if (accountTitleSpan) accountTitleSpan.innerText = titleNames[detectedTitle];
        const accountInfoDiv = document.getElementById('accountInfo');
        if (accountInfoDiv) accountInfoDiv.style.display = 'block';

        calculate();

        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            apiStatus.style.display = 'block';
            apiStatus.innerText = "✅ Sincronizado com sucesso!";
            setTimeout(() => apiStatus.style.display = 'none', 3000);
        }
    } catch (err) {
        console.error("Erro detalhado:", err);
        let errorMsg = "❌ Falha ao sincronizar. ";

        if (err.name === 'AbortError') {
            errorMsg = "⏱️ Tempo limite excedido. Verifique sua conexão com a internet e tente novamente.";
        } else if (err.message.includes("Failed to fetch")) {
            errorMsg = "🌐 Não foi possível conectar à API do Guild Wars 2. Verifique sua conexão ou tente mais tarde.";
        } else {
            errorMsg += err.message;
        }

        // Adiciona dica sobre as permissões necessárias, se o erro mencionar 403 ou permissão
        if (err.message.includes("403") || err.message.includes("permission") || err.message.includes("scope")) {
            errorMsg += "<br><br>🔑 <strong>Permissões necessárias para esta ferramenta:</strong> account, inventories, wallet, progression.<br>"
                + "👉 <a href='https://account.arena.net/applications' target='_blank' style='color: #e5a93c;'>Clique aqui para criar uma nova API Key com essas permissões</a>";
        } else if (err.message.includes("401")) {
            errorMsg += "<br><br>🔑 Sua API Key parece inválida. Gere uma nova chave no site da ArenaNet.";
        }

        const apiError = document.getElementById('apiError');
        if (apiError) {
            apiError.style.display = 'block';
            apiError.innerHTML = errorMsg; // innerHTML para permitir link
            setTimeout(() => apiError.style.display = 'none', 10000); // aumenta tempo para leitura
        } else {
            alert(errorMsg);
        }
    } finally {
        hideLoading();
    }
}