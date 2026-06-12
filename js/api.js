async function fetchFractalData() {
    const apiKey = document.getElementById('apiKey').value.trim();
    localStorage.setItem('savedApiKey', apiKey);
    
    if (!apiKey) {
        alert("Por favor, insira uma API Key válida.");
        return;
    }
    
    showLoading();

    // Timeout de 20 segundos para evitar loading eterno
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        console.log("Iniciando sincronização...");

        const [walletRes, materialsRes, achievementsRes, accountRes] = await Promise.all([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`, { signal: controller.signal }),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`, { signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        // Verifica se as requisições foram bem sucedidas (exceto achievements que pode retornar erro 200 com conteúdo)
        if (!walletRes.ok || !materialsRes.ok || !accountRes.ok) {
            throw new Error(`Erro na API: Wallet=${walletRes.status}, Materials=${materialsRes.status}, Account=${accountRes.status}`);
        }

        const walletData = await walletRes.json();
        const materialsData = await materialsRes.json();
        const achievementsData = await achievementsRes.json();
        const accountData = await accountRes.json();

        console.log("Dados recebidos:", { walletData, materialsData, achievementsData, accountData });

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
        if (achievementsData && achievementsData.text === "all ids provided are invalid") {
            console.log("Nenhuma conquista encontrada.");
            detectedTitle = 0;
        } else if (Array.isArray(achievementsData)) {
            if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) detectedTitle = 4;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) detectedTitle = 3;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) detectedTitle = 2;
            else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) detectedTitle = 1;
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

        if (typeof calculate === 'function') calculate();

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
        } else {
            alert(errorMsg);
        }
    } finally {
        // GARANTE QUE O LOADING SEJA REMOVIDO
        hideLoading();
    }
}