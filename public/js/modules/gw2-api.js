// public/js/modules/gw2-api.js
import { ACHIEVEMENTS, WALLET_IDS, MATERIAL_IDS, PROGRESSION_IDS } from './constants.js';
import { showLoading, hideLoading } from './loading.js';
import { calculate } from './calculator.js';
import { translations } from './translations.js';

// Função auxiliar para obter texto traduzido
function getText(lang, key, fallback) {
    return (translations[lang] && translations[lang][key]) || fallback || key;
}

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
        const results = await Promise.allSettled([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/progression?access_token=${apiKey}`, { signal: controller.signal })
        ]);
        clearTimeout(timeoutId);

        const isSuccess = (r) => r.status === 'fulfilled' && r.value && isOk(r.value);
        const lang = document.getElementById('langPicker').value;

        // Account (obrigatório)
        if (!isSuccess(results[3])) throw new Error("account");
        // Wallet (obrigatório)
        if (!isSuccess(results[0])) throw new Error("wallet");
        // Materials (obrigatório)
        if (!isSuccess(results[1])) throw new Error("inventories");

        // Lê dados essenciais
        const walletData = await results[0].value.json();
        const materialsData = await results[1].value.json();
        const accountData = await results[3].value.json();

        // Achievements (tentativa de título, não obrigatório)
        let currentTitle = parseInt(document.getElementById('currentTitle').value) || 0;
        if (isSuccess(results[2])) {
            try {
                const achData = await results[2].value.json();
                if (Array.isArray(achData) && achData.length > 0 && !achData.text) {
                    let hasSavant = false, hasProdigy = false, hasChampion = false, hasGod = false;
                    for (const a of achData) {
                        if (a.id === ACHIEVEMENTS.SAVANT && a.done === true) hasSavant = true;
                        if (a.id === ACHIEVEMENTS.PRODIGY && a.done === true) hasProdigy = true;
                        if (a.id === ACHIEVEMENTS.CHAMPION && a.done === true) hasChampion = true;
                        if (a.id === ACHIEVEMENTS.GOD && a.done === true) hasGod = true;
                    }
                    if (hasGod) currentTitle = 4;
                    else if (hasChampion) currentTitle = 3;
                    else if (hasProdigy) currentTitle = 2;
                    else if (hasSavant) currentTitle = 1;
                    else currentTitle = 0;
                } else {
                    currentTitle = 0;
                }
            } catch (e) {
                console.warn("Erro ao parsear achievements", e);
                currentTitle = 0;
            }
        }

        // Progression só obrigatório se título == 0
        const progressionResult = results[4];
        const progressionOk = isSuccess(progressionResult);
        if (currentTitle === 0 && !progressionOk) {
            throw new Error("progression");
        }

        let progressionData = {};
        if (progressionOk) {
            const progArray = await progressionResult.value.json();
            for (const item of progArray) {
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

        // Atualiza UI
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
        console.error("Erro na sincronização:", err);
        const lang = document.getElementById('langPicker').value;
        const t = translations[lang] || translations['pt'];
        let missingScope = "";
        if (err.message.includes("account")) missingScope = "account";
        else if (err.message.includes("wallet")) missingScope = "wallet";
        else if (err.message.includes("inventories")) missingScope = "inventories";
        else if (err.message.includes("progression")) missingScope = "progression";

        let errorMsg = "";
        if (missingScope) {
            const scopes = missingScope;
            errorMsg = lang === 'pt'
                ? `Erro (Marcar ${scopes} na criação da API)`
                : `Error (Mark ${scopes} when creating the API)`;
        } else if (err.name === 'AbortError') {
            errorMsg = t.apiErrorTimeout || (lang === 'pt' ? "⏱️ Tempo limite excedido." : "⏱️ Timeout exceeded.");
        } else if (err.message.includes("Failed to fetch")) {
            errorMsg = t.apiErrorNetwork || (lang === 'pt'
                ? "🌐 Não foi possível conectar à API do GW2. Verifique sua internet, firewall ou extensões."
                : "🌐 Unable to connect to GW2 API. Check your internet, firewall or extensions.");
        } else {
            errorMsg = (lang === 'pt' ? "❌ Falha inesperada: " : "❌ Unexpected failure: ") + err.message;
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