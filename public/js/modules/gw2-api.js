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

        // Coleta informações de erro de cada endpoint
        const errors = [];

        // Verifica account
        if (!accountRes.ok) {
            let detail = `Account (${accountRes.status} ${accountRes.statusText})`;
            if (accountRes.status === 403) {
                const msg = await getErrorMessage(accountRes, "Permissão negada. Escopo 'account' necessário.");
                detail += ` - ${msg}`;
            }
            errors.push({ endpoint: "account", detail });
        }

        // Verifica wallet
        if (!walletRes.ok) {
            let detail = `Wallet (${walletRes.status} ${walletRes.statusText})`;
            if (walletRes.status === 403) {
                const msg = await getErrorMessage(walletRes, "Permissão negada. Escopo 'wallet' necessário.");
                detail += ` - ${msg}`;
            }
            errors.push({ endpoint: "wallet", detail });
        }

        // Verifica materials (inventories)
        if (!materialsRes.ok) {
            let detail = `Inventários (Materials) (${materialsRes.status} ${materialsRes.statusText})`;
            if (materialsRes.status === 403) {
                const msg = await getErrorMessage(materialsRes, "Permissão negada. Escopo 'inventories' necessário.");
                detail += ` - ${msg}`;
            }
            errors.push({ endpoint: "inventories", detail });
        }

        // Verifica progression
        if (!progressionRes.ok) {
            let detail = `Progressão (Progression) (${progressionRes.status} ${progressionRes.statusText})`;
            if (progressionRes.status === 403) {
                const msg = await getErrorMessage(progressionRes, "Permissão negada. Escopo 'progression' necessário.");
                detail += ` - ${msg}`;
            }
            errors.push({ endpoint: "progression", detail });
        }

        // Achievements é opcional (pode falhar sem quebrar tudo, mas se falhar, avisamos)
        if (!achievementsRes.ok && achievementsRes.status !== 200) {
            let detail = `Conquistas (Achievements) (${achievementsRes.status} ${achievementsRes.statusText})`;
            if (achievementsRes.status === 403) {
                const msg = await getErrorMessage(achievementsRes, "Permissão negada. Escopo 'progression'? Talvez necessário.");
                detail += ` - ${msg}`;
            }
            errors.push({ endpoint: "achievements", detail });
        }

        // Se houver qualquer erro, interrompe e exibe mensagem detalhada
        if (errors.length > 0) {
            let errorHtml = "<strong>❌ Falha ao sincronizar com a API do Guild Wars 2</strong><br><br>";
            errorHtml += "Os seguintes endpoints retornaram erro:<br><ul>";
            for (const err of errors) {
                errorHtml += `<li><strong>${err.endpoint}</strong>: ${err.detail}</li>`;
            }
            errorHtml += "</ul><br>";
            errorHtml += "🔑 <strong>Permissões necessárias para esta ferramenta:</strong> account, inventories, wallet, progression.<br>";
            errorHtml += "👉 <a href='https://account.arena.net/applications' target='_blank' style='color: #e5a93c;'>Clique aqui para criar uma nova API Key com essas permissões</a>";

            const apiError = document.getElementById('apiError');
            if (apiError) {
                apiError.style.display = 'block';
                apiError.innerHTML = errorHtml;
                setTimeout(() => apiError.style.display = 'none', 12000);
            } else {
                alert(errorHtml.replace(/<[^>]*>/g, ''));
            }
            hideLoading();
            return;
        }

        // Se tudo OK, processa os dados
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
        if (achievementsData && achievementsData.text !== "all ids provided is invalid" && !achievementsData.text?.includes("invalid")) {
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
        console.error("Erro geral:", err);
        let errorMsg = "❌ Falha inesperada ao sincronizar. ";

        if (err.name === 'AbortError') {
            errorMsg = "⏱️ Tempo limite excedido. Verifique sua conexão com a internet e tente novamente.";
        } else if (err.message.includes("Failed to fetch")) {
            errorMsg = "🌐 Não foi possível conectar à API do Guild Wars 2. Verifique sua conexão ou tente mais tarde.";
        } else {
            errorMsg += err.message;
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