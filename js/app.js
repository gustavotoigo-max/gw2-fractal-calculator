function detectLanguage() {
    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith('pt')) {
        return 'pt';
    }

    return 'en';
}

window.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const langPicker = document.getElementById('langPicker');

    langPickerEl.addEventListener('change', () => {
    console.log("Evento change disparado");
    changeLanguage();
    });
    
    if (langPicker) {
        langPicker.value = savedLanguage || detectLanguage();
    }

    const savedApiKey = localStorage.getItem('savedApiKey');

    if (savedApiKey) {
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) {
            apiKeyInput.value = savedApiKey;
        }
    }

    updateDailyInputs();
    changeLanguage();

    const btnSync = document.getElementById('btnSync');
    if (btnSync) {
        btnSync.addEventListener('click', fetchFractalData);
    }
    
    const langPickerEl = document.getElementById('langPicker');
    if (langPickerEl) {
        langPickerEl.addEventListener('change', changeLanguage);
    }

    const inputsCalculo = ['currentTitle', 'pristine', 'relics', 'matrices', 'dailyPristine', 'dailyMatrices', 'dailyRelics'];
    inputsCalculo.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculate);
        }
    });

    const checkboxesFarm = ['farmT4', 'farmRecs', 'farmPotions', 'cmKinfall', 'cmNightmare', 'cmShattered', 'cmSunqua', 'cmSilent', 'cmLonely'];
    checkboxesFarm.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateDailyInputs);
        }
    });
});

function changeLanguage() {
    const langPicker = document.getElementById('langPicker');
    const lang = langPicker ? langPicker.value : 'pt';
    console.log("Trocando idioma para:", lang);  // Debug

    localStorage.setItem('preferredLanguage', lang);
    const text = translations[lang] || translations['pt'];

    // Labels principais
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
        'lblAccountTitle': text.title + ":"
    };

    for (const [id, value] of Object.entries(labels)) {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = value;
        }
    }

    // Mensagem de excedente (se houver algum elemento específico)
    const relicInfoElement = document.getElementById('relicConversionInfo');
    if (relicInfoElement) {
        relicInfoElement.textContent = text.relicConversionInfo || '';
    }

    // Notas do site
    const notesTitle = document.getElementById('notesTitle');
    if (notesTitle) notesTitle.innerText = text.notesTitle;
    
    const note1 = document.getElementById('note1');
    if (note1) note1.innerText = text.note1;
    
    const note2 = document.getElementById('note2');
    if (note2) note2.innerText = text.note2;
    
    const note3 = document.getElementById('note3');
    if (note3) note3.innerText = text.note3;
    
    const note4 = document.getElementById('note4');
    if (note4) note4.innerText = text.note4;
    
    const note5 = document.getElementById('note5');
    if (note5) note5.innerText = text.note5;

    // Banner de desenvolvimento
    const devBanner = document.querySelector('.dev-banner');
    if (devBanner && text.devBanner) {
        devBanner.innerText = text.devBanner;
    }

    // Recalcula para atualizar textos dinâmicos
    calculate();
}