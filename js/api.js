async function fetchFractalData() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) return;
    showLoading();

    try {
        console.log("Iniciando sincronização de wallet e materiais...");

        const [walletRes, materialsRes, achievementsRes, accountRes] = await Promise.all([
            fetch(`https://api.guildwars2.com/v2/account/wallet?access_token=${apiKey}`),
            fetch(`https://api.guildwars2.com/v2/account/materials?access_token=${apiKey}`),
            fetch(`https://api.guildwars2.com/v2/account/achievements?ids=4001,4015,3990,4018&access_token=${apiKey}`),
            fetch(`https://api.guildwars2.com/v2/account?access_token=${apiKey}`)
        ]);

        const walletData = await walletRes.json();
        const materialsData = await materialsRes.json();
        const achievementsData = await achievementsRes.json();
        const accountData = await accountRes.json();

        // Atualização de Valores Numéricos
        const pristineObj = walletData.find(i => i.id === WALLET_IDS.PRISTINE);
        const relicObj = walletData.find(i => i.id === WALLET_IDS.RELICS);
        const matrixObj = materialsData.find(i => i.id === MATERIAL_IDS.INTEGRATED_MATRIX);

        // Aplica os valores nos inputs
        document.getElementById('pristine').value = pristineObj ? pristineObj.value : 0;
        document.getElementById('relics').value = relicObj ? relicObj.value : 0;
        document.getElementById('matrices').value = matrixObj ? (matrixObj.count || 0) : 0;

        let detectedTitle = 0;

        if (achievementsData.some(a => a.id === ACHIEVEMENTS.GOD && a.done)) {
            detectedTitle = 4; // Fractal God
        }
        else if (achievementsData.some(a => a.id === ACHIEVEMENTS.CHAMPION && a.done)) {
            detectedTitle = 3; // Fractal Champion
        }
        else if (achievementsData.some(a => a.id === ACHIEVEMENTS.PRODIGY && a.done)) {
            detectedTitle = 2; // Fractal Prodigy
        }
        else if (achievementsData.some(a => a.id === ACHIEVEMENTS.SAVANT && a.done)) {
            detectedTitle = 1; // Fractal Savant
        }

        document.getElementById('currentTitle').value = detectedTitle;
        const titleNames = {
            0: "Nenhum",
            1: "Fractal Savant",
            2: "Fractal Prodigy",
            3: "Fractal Champion",
            4: "Fractal God"
        };

        document.getElementById('accountName').innerText =
            accountData.name || "Desconhecida";

        document.getElementById('accountTitle').innerText =
            titleNames[detectedTitle];

        document.getElementById('accountInfo').style.display = 'block';

        // Dispara o cálculo final após atualizar os campos
        calculate();

        console.log("Dados sincronizados com sucesso.");
        hideLoading();
    } catch (err) {
        console.error("Erro na sincronização:", err);

        hideLoading();

        alert("Falha ao sincronizar os dados da API.");
    }
}