async function fetchFractalData() {
    const apiKey = document.getElementById('apiKey').value.trim();
    localStorage.setItem('savedApiKey', apiKey);
    
    if (!apiKey) {
        alert("Por favor, insira uma API Key válida.");
        return;
    }
    
    showLoading();

    try {
        console.log("Iniciando sincronização...");

        const [walletRes, materialsRes, achievementsRes, accountRes] = await Promise.all([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=${ACHIEVEMENTS.SAVANT},${ACHIEVEMENTS.PRODIGY},${ACHIEVEMENTS.CHAMPION},${ACHIEVEMENTS.GOD}&access_token=${apiKey}`),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`)
        ]);

        // Verifica se as requisições foram bem sucedidas (ignorando achievements, pois pode retornar erro 200 com conteúdo de erro)
        if (!walletRes.ok || !materialsRes.ok || !accountRes.ok) {
            throw new Error("Erro na autenticação da API. Verifique sua API Key.");
        }

        const walletData = await walletRes.json();
        const materialsData = await materialsRes.json();
        const achievementsData = await achievementsRes.json();
        const accountData = await accountRes.json();

        console.log("Dados recebidos:", { walletData, materialsData, achievementsData, accountData });

        // Atualiza Pristine Relics
        const pristineObj = walletData.find(i => i.id === WALLET_IDS.PRISTINE);
        const pristineInput = document.getElementById('pristine');
        if (pristineInput) {
            pristineInput.value = pristineObj ? pristineObj.value : 0;
        }

        // Atualiza Fractal Relics
        const relicObj = walletData.find(i => i.id === WALLET_IDS.RELICS);
        const relicsInput = document.getElementById('relics');
        if (relicsInput) {
            relicsInput.value = relicObj ? relicObj.value : 0;
        }

        // Atualiza Integrated Matrices
        const matrixObj = materialsData.find(i => i.id === MATERIAL_IDS.INTEGRATED_MATRIX);
        const matricesInput = document.getElementById('matrices');
        if (matricesInput) {
            matricesInput.value = matrixObj ? (matrixObj.count || 0) : 0;
        }

        // Detecta título atual
        let detectedTitle = 0;

        // TRATAMENTO ESPECIAL: Se a API retornar erro de IDs inválidos, significa que o jogador não tem nenhuma conquista
        if (achievementsData && achievementsData.text === "all ids provided are invalid") {
            console.log("Nenhuma conquista encontrada (all ids invalid). Assumindo título 'Nenhum'.");
            detectedTitle = 0;
        } else if (Array.isArray(achievementsData)) {
            // Verificação normal
            if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) {
                detectedTitle = 4; // Fractal God
            } else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) {
                detectedTitle = 3; // Fractal Champion
            } else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) {
                detectedTitle = 2; // Fractal Prodigy
            } else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) {
                detectedTitle = 1; // Fractal Savant
            }
        } else {
            console.warn("Resposta inesperada das conquistas:", achievementsData);
        }

        const currentTitleSelect = document.getElementById('currentTitle');
        if (currentTitleSelect) {
            currentTitleSelect.value = detectedTitle;
        }

        const titleNames = {
            0: "Nenhum",
            1: "Fractal Savant",
            2: "Fractal Prodigy",
            3: "Fractal Champion",
            4: "Fractal God"
        };

        const accountNameSpan = document.getElementById('accountName');
        if (accountNameSpan) {
            accountNameSpan.innerText = accountData.name || "Desconhecida";
        }

        const accountTitleSpan = document.getElementById('accountTitle');
        if (accountTitleSpan) {
            accountTitleSpan.innerText = titleNames[detectedTitle];
        }

        const accountInfoDiv = document.getElementById('accountInfo');
        if (accountInfoDiv) {
            accountInfoDiv.style.display = 'block';
        }

        // Dispara o cálculo
        if (typeof calculate === 'function') {
            calculate();
        }

        console.log("Sincronização concluída com sucesso!");
        
        // Mensagem de sucesso (opcional)
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            apiStatus.style.display = 'block';
            apiStatus.innerText = "✅ Sincronizado com sucesso!";
            setTimeout(() => {
                apiStatus.style.display = 'none';
            }, 3000);
        }

    } catch (err) {
        console.error("Erro na sincronização:", err);
        
        const apiError = document.getElementById('apiError');
        if (apiError) {
            apiError.style.display = 'block';
            apiError.innerText = "❌ Falha ao sincronizar: " + (err.message || "Verifique sua API Key e tente novamente.");
            setTimeout(() => {
                apiError.style.display = 'none';
            }, 5000);
        }
        
        alert("Falha ao sincronizar os dados da API. Verifique o console para mais detalhes.");
    } finally {
        hideLoading();
    }
}