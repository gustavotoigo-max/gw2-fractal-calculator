// public/js/modules/ui.js
import { translations } from './translations.js';
import { SITE_VERSION, USER_NICK, USER_EMAIL } from './constants.js';
import { calculate } from './calculator.js';

// Atualiza os ganhos diários com base nos checkboxes selecionados
export function updateDailyInputs() {
    let pristineSum = 0, matrixSum = 0, relicsSum = 0;
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

// Aplica as traduções em todos os elementos textuais da página
export function changeLanguage() {
    const langPicker = document.getElementById('langPicker');
    const lang = langPicker ? langPicker.value : 'pt';
    localStorage.setItem('preferredLanguage', lang);
    
    const text = translations[lang] || translations['pt'];

    const labels = {
        'lblMainTitle': text.mainTitle,
        'lblCurrentTitle': text.currentTitle,
        'optNone': text.none,
        'lblSectionInventory': text.secInventory,
        'lblPristineCart': text.pristineCart,
        'lblRelicsCart': text.relicsCart,
        'lblMatricesCart': text.matricesCart,
        'lblSectionRoutine': text.secRoutine,
        'lblSubDailies': text.subDailies,
        'lblRecsCheck': text.recsCheck,
        'lblSubCMs': text.subCMs,
        'lblSectionGains': text.secGains,
        'lblPristineDay': text.pristineDay,
        'lblMatricesDay': text.matricesDay,
        'lblRelicsDay': text.relicsDay,
        'lblResultTitle': text.resultTitle,
        'lblApiKey': text.apiKey,
        'btnSync': text.btnSync,
        'lblAccount': text.account + ":",
        'lblAccountTitle': text.title + ":",
        'apiWarningText': text.apiWarningText,
        'apiWarningLink': text.apiWarningLink,
        'notesTitle': text.notesTitle,
        'note1': text.note1,
        'note2': text.note2,
        'note3': text.note3,
        'note4': text.note4,
        'note5': text.note5
    };
    translateDynamicElements();
    for (const [id, value] of Object.entries(labels)) {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    }

    // Recalcula para atualizar textos dinâmicos dos cards
    calculate();
    
    // Atualiza o rodapé com o idioma correto
    updateVersionFooter();
}

// Atualiza o rodapé com versão e dados do desenvolvedor (sempre visível)
export function updateVersionFooter() {
    const langPicker = document.getElementById('langPicker');
    const lang = langPicker ? langPicker.value : 'pt';
    const text = translations[lang] || translations['pt'];
    const versionFooter = document.getElementById('versionFooter');
    if (versionFooter) {
        versionFooter.innerHTML = `
            <div style="text-align: center; margin-top: 25px; font-size: 10px; color: var(--text-secondary); opacity: 0.4; letter-spacing: 0.5px; line-height: 1.5;">
                <div>${SITE_VERSION}</div>
                <div style="margin-top: 4px;">${text.lblDevBy} <strong>${USER_NICK}</strong> (${USER_EMAIL})</div>
            </div>
        `;
    }
}

// Inicialização da interface (idioma, API key salva, rodapé)
export function initUI() {
    // Detecta idioma salvo ou do navegador
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const browserLang = navigator.language.toLowerCase();
    const defaultLang = browserLang.startsWith('pt') ? 'pt' : 'en';
    const langPicker = document.getElementById('langPicker');
    if (langPicker) {
        langPicker.value = savedLanguage || defaultLang;
    }

    // API key salva
    const savedApiKey = localStorage.getItem('savedApiKey');
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput && savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Aplica traduções iniciais (inclui rodapé)
    changeLanguage();
}

export function translateDynamicElements() {
    const lang = document.getElementById('langPicker').value;
    const text = translations[lang] || translations['pt'];

    // Dev banner
    const devBanner = document.getElementById('devBanner');
    if (devBanner) devBanner.innerText = text.devBanner;

    // Elementos com data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (text[key]) el.innerText = text[key];
    });
}