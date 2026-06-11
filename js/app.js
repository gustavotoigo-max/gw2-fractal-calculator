function detectLanguage() {
    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith('pt')) {
        return 'pt';
    }

    return 'en';
}

window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado");
    
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

    // Inicializa os ganhos diários
    if (typeof updateDailyInputs === 'function') {
        updateDailyInputs();
    }
    
    // Aplica traduções
    if (typeof changeLanguage === 'function') {
        changeLanguage();
    }

    // Botão de sincronização
    const btnSync = document.getElementById('btnSync');
    if (btnSync) {
        btnSync.addEventListener('click', function() {
            if (typeof fetchFractalData === 'function') {
                fetchFractalData();
            } else {
                console.error("fetchFractalData não está definida");
            }
        });
    }
    
    // Seletor de idioma
    const langPickerEl = document.getElementById('langPicker');
    if (langPickerEl) {
        langPickerEl.addEventListener('change', function() {
            if (typeof changeLanguage === 'function') {
                changeLanguage();
            }
        });
    }

    // Inputs de cálculo
    const inputsCalculo = ['currentTitle', 'pristine', 'relics', 'matrices', 'dailyPristine', 'dailyMatrices', 'dailyRelics'];
    inputsCalculo.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                if (typeof calculate === 'function') {
                    calculate();
                }
            });
        }
    });

    // Checkboxes de farm
    const checkboxesFarm = ['farmT4', 'farmRecs', 'farmPotions', 'cmKinfall', 'cmNightmare', 'cmShattered', 'cmSunqua', 'cmSilent', 'cmLonely'];
    checkboxesFarm.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                if (typeof updateDailyInputs === 'function') {
                    updateDailyInputs();
                }
            });
        }
    });
    
    console.log("Eventos registrados com sucesso!");
});

function changeLanguage() {
    console.log("changeLanguage chamado");
    
    const langPicker = document.getElementById('langPicker');
    const lang = langPicker ? langPicker.value : 'pt';

    localStorage.setItem('preferredLanguage', lang);
    
    // Verifica se translations existe
    if (typeof translations === 'undefined') {
        console.error("translations não está definido");
        return;
    }
    
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


    // Aviso da API
    const apiWarningTextSpan = document.getElementById('apiWarningText');
    if (apiWarningTextSpan) {
        apiWarningTextSpan.innerText = text.apiWarningText;
    }

    const apiWarningLink = document.getElementById('apiWarningLink');
    if (apiWarningLink) {
        apiWarningLink.innerText = text.apiWarningLink;
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

    // Recalcula para atualizar textos dinâmicos
    if (typeof calculate === 'function') {
        calculate();
    }
    
    console.log("Idioma alterado para:", lang);
}