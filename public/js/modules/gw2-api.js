// public/js/modules/gw2-api.js
import { ACHIEVEMENTS, WALLET_IDS, MATERIAL_IDS, PROGRESSION_IDS } from './constants.js';
import { showLoading, hideLoading } from './loading.js';
import { calculate } from './calculator.js';

// Função auxiliar para verificar se a resposta é ok (status 2xx)
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

        // ============================================================
        // 1. Coleta os status individuais (true = erro, false = ok)
        // ============================================================
        const walletErro = !isOk(walletRes);
        const materialsErro = !isOk(materialsRes);
        const achievementErro = !isOk(achievementsRes);
        const accessTokenErro = !isOk(accountRes); // account = access_token

        // Determina o título atual ANTES de verificar progression (para aplicar regra)
        // Precisamos do título para decidir se progression é obrigatório.
        // Como a requisição de achievements pode ter falhado, tentamos extrair mesmo assim.
        let currentTitle = 0;
        if (!achievementErro) {
            try {
                const achievementsData = await achievementsRes.json();
                if (Array.isArray(achievementsData)) {
                    if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) currentTitle = 4;
                    else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) currentTitle = 3;
                    else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) currentTitle = 2;
                    else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) currentTitle = 1;
                }
            } catch (e) {
                console.warn("Erro ao parsear achievements", e);
            }
        }

        // Regra para progression: só é erro se título == 0
        const progressionErro = !isOk(progressionRes) && (currentTitle === 0);

        // ============================================================
        // 2. Monta a lista de escopos com erro (conforme regras)
        // ============================================================
        const escoposErro = [];
        if (walletErro) escoposErro.push("wallet");
        if (materialsErro) escoposErro.push("materials");
        if (achievementErro) escoposErro.push("achievements");
        if (accessTokenErro) escoposErro.push("account");
        if (progressionErro) escoposErro.push("progression");

        // ============================================================
        // 3. Se houver erros, exibe mensagem e interrompe
        // ============================================================
        if (escoposErro.length > 0) {
            let mensagem = "Erro (Marcar ";
            if (escoposErro.length === 1) {
                mensagem += `${escoposErro[0]}`;
            } else {
                mensagem += escoposErro.slice(0, -1).join(", ") + " e " + escoposErro.slice(-1);
            }
            mensagem += " na criacao da API)";

            // Exibe no elemento de erro da API
            const apiError = document.getElementById('apiError');
            if (apiError) {
                apiError.style.display = 'block';
                apiError.innerHTML = `❌ ${mensagem}<br><br>🔑 <a href="https://account.arena.net/applications" target="_blank" style="color: #e5a93c;">Clique aqui para criar ou editar sua API Key</a>`;
                setTimeout(() => apiError.style.display = 'none', 10000);
            } else {
                alert(mensagem);
            }
            hideLoading();
            return; // interrompe a execução
        }

        // ============================================================
        // 4. Se chegou aqui, todos os endpoints necessários estão ok.
        //    Prossegue com a obtenção dos dados e cálculo.
        // ============================================================
        const walletData = await walletRes.json();
        const materialsData = await materialsRes.json();
        const achievementsData = await achievementsRes.json();
        const accountData = await accountRes.json();

        // Progression só é necessário se título == 0 (mas se chegou aqui, ou está ok ou não é necessário)
        let progressionData = {};
        if (isOk(progressionRes)) {
            const progressionArray = await progressionRes.json();
            for (const item of progressionArray) {
                progressionData[item.id] = item.value;
            }
        }

        // Upgrades (valores padrão 0 se não existirem)
        const empowermentLevel = progressionData[PROGRESSION_IDS.FRACTAL_EMPOWERMENT] || 0;
        const karmicLevel = progressionData[PROGRESSION_IDS.KARMIC_RETRIBUTION] || 0;
        const agonyLevel = progressionData[PROGRESSION_IDS.AGONY_IMPEDANCE] || 0;

        window.upgradesOwned = {
            empowerment: empowermentLevel,
            karmic: karmicLevel,
            agony: agonyLevel
        };

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

        // Atualiza título (já temos currentTitle, mas vamos garantir)
        const currentTitleSelect = document.getElementById('currentTitle');
        if (currentTitleSelect) currentTitleSelect.value = currentTitle;

        const titleNames = { 0: "Nenhum", 1: "Fractal Savant", 2: "Fractal Prodigy", 3: "Fractal Champion", 4: "Fractal God" };
        const accountNameSpan = document.getElementById('accountName');
        if (accountNameSpan) accountNameSpan.innerText = accountData.name || "Desconhecida";
        const accountTitleSpan = document.getElementById('accountTitle');
        if (accountTitleSpan) accountTitleSpan.innerText = titleNames[currentTitle];
        const accountInfoDiv = document.getElementById('accountInfo');
        if (accountInfoDiv) accountInfoDiv.style.display = 'block';

        // Dispara o cálculo (agora sem erros)
        calculate();

        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            apiStatus.style.display = 'block';
            apiStatus.innerText = "✅ Sincronizado com sucesso!";
            setTimeout(() => apiStatus.style.display = 'none', 3000);
        }
    } catch (err) {
        console.error("Erro inesperado:", err);
        let errorMsg = "❌ Falha inesperada ao sincronizar. ";
        if (err.name === 'AbortError') {
            errorMsg = "⏱️ Tempo limite excedido. Verifique sua conexão.";
        } else if (err.message.includes("Failed to fetch")) {
            errorMsg = "🌐 Não foi possível conectar à API do GW2.";
        } else {
            errorMsg += err.message;
        }
        const apiError = document.getElementById('apiError');
        if (apiError) {
            apiError.style.display = 'block';
            apiError.innerText = errorMsg;
            setTimeout(() => apiError.style.display = 'none', 8000);
        }
    } finally {
        hideLoading();
    }
}