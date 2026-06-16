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

// Função para verificar se a resposta é ok (status 2xx) e não é erro de rede
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
        // Realiza as 5 requisições sem abortar todas se uma falhar (Promise.allSettled)
        const results = await Promise.allSettled([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/progression?access_token=${apiKey}`, { signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        // Separa as respostas (se houver erro de rede, o valor é undefined)
        const walletResult = results[0];
        const materialsResult = results[1];
        const achievementsResult = results[2];
        const accountResult = results[3];
        const progressionResult = results[4];

        // Helper para verificar se a requisição foi bem-sucedida (rede ok e resposta ok)
        const isSuccess = (result) => result.status === 'fulfilled' && result.value && result.value.ok;

        // Verifica achievements primeiro – é obrigatório para saber o título
        if (achievementsResult.status !== 'fulfilled' || !achievementsResult.value.ok) {
            let errorMsg = "Não foi possível obter suas conquistas (achievements).";
            if (achievementsResult.status === 'rejected') {
                errorMsg = `Erro de rede ao acessar achievements: ${achievementsResult.reason?.message || 'conexão falhou'}`;
            } else if (achievementsResult.value.status === 403) {
                errorMsg = "Permissão negada para achievements. Marque 'progression'? (Na verdade, achievements precisa do escopo 'progression' ou 'account'? Verifique)";
            }
            throw new Error(errorMsg);
        }

        // Lê os dados de achievements (apenas uma vez)
        let achievementsData;
        try {
            achievementsData = await achievementsResult.value.json();
        } catch (e) {
            throw new Error("Erro ao ler dados de achievements: " + e.message);
        }

        // Determina o título atual
        let currentTitle = 0;
        if (Array.isArray(achievementsData)) {
            if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) currentTitle = 4;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) currentTitle = 3;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) currentTitle = 2;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) currentTitle = 1;
        }

        // Monta lista de escopos com erro (baseado em HTTP 403 ou falha de rede)
        const missingScopes = [];

        // Wallet
        if (!isSuccess(walletResult)) {
            missingScopes.push("wallet");
        }

        // Materials
        if (!isSuccess(materialsResult)) {
            missingScopes.push("materials");
        }

        // Account
        if (!isSuccess(accountResult)) {
            missingScopes.push("account");
        }

        // Progression: só necessário se título == 0
        if (currentTitle === 0 && !isSuccess(progressionResult)) {
            missingScopes.push("progression");
        }

        // Se há escopos faltando, exibe mensagem específica e interrompe
        if (missingScopes.length > 0) {
            let message = "Erro (Marcar ";
            if (missingScopes.length === 1) {
                message += missingScopes[0];
            } else {
                message += missingScopes.slice(0, -1).join(", ") + " e " + missingScopes.slice(-1);
            }
            message += " na criacao da API)";

            const apiError = document.getElementById('apiError');
            if (apiError) {
                apiError.style.display = 'block';
                apiError.innerHTML = `❌ ${message}<br><br>🔑 <a href="https://account.arena.net/applications" target="_blank" style="color: #e5a93c;">Clique aqui para criar ou editar sua API Key</a>`;
                setTimeout(() => apiError.style.display = 'none', 10000);
            } else {
                alert(message);
            }
            hideLoading();
            return;
        }

        // Se chegou aqui, todos os endpoints necessários estão OK (rede e HTTP)
        // Extrai os dados de cada um
        const walletData = await walletResult.value.json();
        const materialsData = await materialsResult.value.json();
        const accountData = await accountResult.value.json();

        let progressionData = {};
        if (progressionResult.status === 'fulfilled' && progressionResult.value.ok) {
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

        // Atualiza campos da UI
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
        console.error("Erro fatal:", err);
        let errorMsg = "";
        if (err.name === 'AbortError') {
            errorMsg = "⏱️ Tempo limite excedido. Verifique sua conexão.";
        } else if (err.message.includes("Failed to fetch") || err.message.includes("network")) {
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