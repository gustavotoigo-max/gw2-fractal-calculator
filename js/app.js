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
        'currencyReserveInfo': text.currencyReserveInfo
    };

    for (const [id, value] of Object.entries(labels)) {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = value;
        }
    }

    const relicInfoElement = document.getElementById('relicConversionInfo');
    if (relicInfoElement) {
        relicInfoElement.textContent = text.relicConversionInfo || '';
    }

    calculate();
}