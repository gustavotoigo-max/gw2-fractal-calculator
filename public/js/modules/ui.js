import { translations } from './translations.js';
import { calculate } from './calculator.js';

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

    for (const [id, value] of Object.entries(labels)) {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    }

    calculate();
}

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

    // Aplica traduções iniciais
    changeLanguage();
}