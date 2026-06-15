// public/js/modules/gw2-api.js
import { ACHIEVEMENTS, WALLET_IDS, MATERIAL_IDS, PROGRESSION_IDS } from './constants.js';
import { showLoading, hideLoading } from './loading.js';
import { calculate } from './calculator.js';

async function getErrorMessage(response, defaultMsg) {
    try {
        const errorData = await response.json();
        return errorData.text || errorData.error || defaultMsg;
    } catch {
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
        const [walletRes, materialsRes, achievementsRes, accountRes, progressionRes] = await Promise.all([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/progression?access_token=${apiKey}`, { signal: controller.signal })
        ]);
        clearTimeout(timeoutId);

        // 1. Verifica status básico sem ler bodies
        let achievementsOk = achievementsRes.ok;
        let walletOk = walletRes.ok;
        let materialsOk = materialsRes.ok;
        let accountOk = accountRes.ok;
        let progressionOk = progressionRes.ok;

        // 2. Se achievements falhou, não temos como saber título -> erro fatal
        if (!achievementsOk) {
            const errMsg = await getErrorMessage(achievementsRes, "Erro desconhecido");
            throw new Error(`achievements: ${errMsg}`);
        }

        // 3. Lê achievements uma única vez para obter o título
        let achievementsData;
        try {
            achievementsData = await achievementsRes.json();
        } catch (e) {
            throw new Error("Erro ao ler dados de achievements");
        }

        let currentTitle = 0;
        if (Array.isArray(achievementsData)) {
            if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) currentTitle = 4;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) currentTitle = 3;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) currentTitle = 2;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) currentTitle = 1;
        }

        // 4. Monta lista de erros, respeitando regra do progression
        const erros = [];
        if (!walletOk) erros.push("wallet");
        if (!materialsOk) erros.push("materials");
        if (!accountOk) erros.push("account");
        // progression só é obrigatório se título == 0
        if (!progressionOk && currentTitle === 0) erros.push("progression");

        // 5. Se houver erros, exibe mensagem e interrompe
        if (erros.length > 0) {
            let mensagem = "Erro (Marcar ";
            if (erros.length === 1) {
                mensagem += erros[0];
            } else {
                mensagem += erros.slice(0, -1).join(", ") + " e " + erros.slice(-1);
            }
            mensagem += " na criacao da API)";

            const apiError = document.getElementById('apiError');
            if (apiError) {
                apiError.style.display = 'block';
                apiError.innerHTML = `❌ ${mensagem}<br><br>🔑 <a href="https://account.arena.net/applications" target="_blank" style="color: #e5a93c;">Clique aqui para criar ou editar sua API Key</a>`;
                setTimeout(() => apiError.style.display = 'none', 10000);
            } else {
                alert(mensagem);
            }
            hideLoading();
            return;
        }

        // 6. Se chegou aqui, todos os endpoints necessários estão OK.
        //    Lê os demais bodies (wallet, materials, account, progression)
        const walletData = await walletRes.json();
        const materialsData = await materialsRes.json();
        const accountData = await accountRes.json();

        let progressionData = {};
        if (progressionOk) {
            const progressionArray = await progressionRes.json();
            for (const item of progressionArray) {
                progressionData[item.id] = item.value;
            }
        }

        const empowermentLevel = progressionData[PROGRESSION_IDS.FRACTAL_EMPOWERMENT] || 0;
        const karmicLevel = progressionData[PROGRESSION_IDS.KARMIC_RETRIBUTION] || 0;
        const agonyLevel = progressionData[PROGRESSION_IDS.AGONY_IMPEDANCE] || 0;

        window.upgradesOwned = {
            empowerment: empowermentLevel,
            karmic: karmicLevel,
            agony: agonyLevel
        };

        // Atualiza campos da UI
        const pristineObj = walletData.find(i => i.id === WALLET_IDS.PRISTINE);
        document.getElementById('pristine').value = pristineObj ? pristineObj.value : 0;

        const relicObj = walletData.find(i => i.id === WALLET_IDS.RELICS);
        document.getElementById('relics').value = relicObj ? relicObj.value : 0;

        const matrixObj = materialsData.find(i => i.id === MATERIAL_IDS.INTEGRATED_MATRIX);
        document.getElementById('matrices').value = matrixObj ? (matrixObj.count || 0) : 0;

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
        console.error(err);
        let errorMsg = "";
        if (err.name === 'AbortError') {
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