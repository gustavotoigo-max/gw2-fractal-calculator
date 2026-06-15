import { translations } from './translations.js';
import { SITE_VERSION, USER_NICK, USER_EMAIL } from './constants.js';

export async function calculate() {
    const lang = document.getElementById('langPicker').value;
    const text = translations[lang] || translations['pt'];
    const currentTitle = parseInt(document.getElementById('currentTitle').value);

    const payload = {
        lang,
        currentTitle,
        pristine: parseInt(document.getElementById('pristine').value) || 0,
        relics: parseInt(document.getElementById('relics').value) || 0,
        matrices: parseInt(document.getElementById('matrices').value) || 0,
        dailyPristine: parseInt(document.getElementById('dailyPristine').value) || 0,
        dailyMatrices: parseInt(document.getElementById('dailyMatrices').value) || 0,
        dailyRelics: parseInt(document.getElementById('dailyRelics').value) || 0,
        upgrades: {
            empowerment: window.upgradesOwned.fractal_empowerment || 0,
            karmic: window.upgradesOwned.fractal_karmic_retribution || 0,
            agony: window.upgradesOwned.fractal_agony_impedance || 0
        }
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
            .replaceAll('__LBL_DAYS__', text.lblDays)
            .replaceAll('__LBL_INF_DAYS__', text.lblInfDays)
            .replaceAll('__LBL_READY_BUY__', text.lblReadyBuy)
            .replaceAll('__KEEP_MSG_1__', text.keepMsg1 || "📌 Mantenha 25.000 Fractal Relics para próximo título")
            .replaceAll('__KEEP_MSG_2__', text.keepMsg2 || "📌 Mantenha 1.200 Pristines e 35.000 Fractal Relics para próximo título")
            .replaceAll('__KEEP_MSG_3__', text.keepMsg3 || "📌 Mantenha 45.000 Fractal Relics para próximo título")
            .replaceAll('__KEEP_MSG_4__', text.keepMsg4 || "📌 Mantenha 2.000 Pristines e 55.000 Fractal Relics para próximo título");

        finalHtml = finalHtml.replace(/__CONVERT_WARNING_(\d+)_(\d+)__/g, (match, pristines, relics) => {
            const message = text.lblSurplus
                .replace('{{pristines}}', parseInt(pristines).toLocaleString())
                .replace('{{relics}}', parseInt(relics).toLocaleString());
            return `<br><div style="margin-top: 4px;">${message}</div>`;
        });

        const totalDays = data.totalDaysRemaining;
        const totalWeeks = (totalDays / 7).toFixed(1);

        const timeResultEl = document.getElementById('timeResult');
        if (totalDays === 0 && currentTitle < 4) {
            timeResultEl.innerText = text.lblReadyGod;
        } else if (currentTitle === 4) {
            timeResultEl.innerText = text.lblIsGod;
        } else if (totalDays === Infinity || isNaN(totalDays)) {
            timeResultEl.innerText = text.lblUnfTime;
        } else {
            timeResultEl.innerText = `${totalDays} ${text.lblDays} (~${totalWeeks} ${text.lblWeeks})`;
        }

        // Preenche os cards dos tiers (sem o rodapé)
        document.getElementById('missingResources').innerHTML = finalHtml;

       
    } catch (e) {
        console.error("Erro na comunicação com o backend.", e);
    }
}