async function calculate() {
    const lang = document.getElementById('langPicker').value;
    const text = translations[lang] || translations['pt'];
    const currentTitle = parseInt(document.getElementById('currentTitle').value);

    const payload = {
        currentTitle,
        pristine: parseInt(document.getElementById('pristine').value) || 0,
        relics: parseInt(document.getElementById('relics').value) || 0,
        matrices: parseInt(document.getElementById('matrices').value) || 0,
        dailyPristine: parseInt(document.getElementById('dailyPristine').value) || 0,
        dailyMatrices: parseInt(document.getElementById('dailyMatrices').value) || 0,
        dailyRelics: parseInt(document.getElementById('dailyRelics').value) || 0
    };

    try {
        const res = await fetch('/api/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) return;
        const data = await res.json();

        let finalHtml = data.htmlOutput
            .replaceAll('__LBL_PRISTINES__', text.lblPristines)
            .replaceAll('__LBL_RELICS__', text.lblRelics)
            .replaceAll('__LBL_MATRICES__', text.lblMatrices)

            .replaceAll('__TIER1__', text.tier1)
            .replaceAll('__TIER2__', text.tier2)
            .replaceAll('__TIER3__', text.tier3)
            .replaceAll('__TIER4__', text.tier4)
            .replaceAll('__LBL_COMPLETED__', text.lblCompleted)
            .replaceAll('__LBL_ALREADY_DONE__', text.lblAlreadyDone)
            .replaceAll('__LBL_NEED_STOCK__', text.lblNeedStock)
            .replaceAll('__LBL_GATE__', text.lblGate)
            .replaceAll('__GATE_NONE__', text.lblGateNone)
            .replaceAll('__GATE_READY__', text.lblGateReady)
            .replaceAll('__GATE_NORMAL__', text.lblGateNormal)
            .replaceAll('__GATE_BOTH__', text.lblGateBoth)
            .replaceAll('__GATE_PRISTINE__', text.lblGatePristine)
            .replaceAll('__GATE_MATRIX__', text.lblGateMatrix)
            .replaceAll('__LBL_DAYS__', text.lblDays)
            .replaceAll('__LBL_INF_DAYS__', text.lblInfDays)
            .replaceAll('__LBL_NO_FARM__', text.lblNoFarmActive)
            .replaceAll('__LBL_READY_BUY__', text.lblReadyBuy);

        // Substitui placeholders de aviso de conversão (excedente seguro)
        finalHtml = finalHtml.replace(/__CONVERT_WARNING_(\d+)_(\d+)__/g, (match, pristines, relics) => {
            return text.lblSurplus
                .replace('{{pristines}}', parseInt(pristines).toLocaleString())
                .replace('{{relics}}', parseInt(relics).toLocaleString());
        });

        const totalDays = data.totalDaysRemaining;
        const totalWeeks = (totalDays / 7).toFixed(1);

        if (totalDays === 0 && currentTitle < 4) {
            document.getElementById('timeResult').innerText = text.lblReadyGod;
        } else if (currentTitle === 4) {
            document.getElementById('timeResult').innerText = text.lblIsGod;
        } else if (totalDays === Infinity || isNaN(totalDays)) {
            document.getElementById('timeResult').innerText = text.lblUnfTime;
        } else {
            document.getElementById('timeResult').innerText = `${totalDays} ${text.lblDays} (~${totalWeeks} ${text.lblWeeks})`;
        }

        document.getElementById('missingResources').innerHTML = finalHtml + `
            <div style="text-align: center; margin-top: 25px; font-size: 10px; color: var(--text-secondary); opacity: 0.4; letter-spacing: 0.5px; line-height: 1.5;">
                <div>${SITE_VERSION}</div>
                <div style="margin-top: 4px;">${text.lblDevBy} <strong>${USER_NICK}</strong> (${USER_EMAIL})</div>
            </div>
        `;
    } catch (e) {
        console.error("Erro na comunicação com o backend.", e);
    }
}

function updateDailyInputs() {
    let pristineSum = 0; let matrixSum = 0; let relicsSum = 0;
    if (document.getElementById('farmT4').checked) { pristineSum += 12; relicsSum += 174; }
    if (document.getElementById('farmRecs').checked) { pristineSum += 3; relicsSum += 36; }
    if (document.getElementById('farmPotions').checked) { relicsSum += 16; }
    if (document.getElementById('cmKinfall').checked) { pristineSum += 2; matrixSum += 1; relicsSum += 119; }
    if (document.getElementById('cmNightmare').checked) { pristineSum += 2; matrixSum += 1; relicsSum += 159; }
    if (document.getElementById('cmShattered').checked) { pristineSum += 2; matrixSum += 1; relicsSum += 159; }
    if (document.getElementById('cmSunqua').checked) { pristineSum += 2; matrixSum += 1; relicsSum += 139; }
    if (document.getElementById('cmSilent').checked) { pristineSum += 2; matrixSum += 1; relicsSum += 119; }
    if (document.getElementById('cmLonely').checked) { pristineSum += 2; matrixSum += 1; relicsSum += 139; }

    document.getElementById('dailyPristine').value = pristineSum;
    document.getElementById('dailyMatrices').value = matrixSum;
    document.getElementById('dailyRelics').value = relicsSum;
    calculate();
}