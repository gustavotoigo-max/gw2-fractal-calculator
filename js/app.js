function detectLanguage() {
    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith('pt')) {
        return 'pt';
    }

    return 'en';
}

window.addEventListener('DOMContentLoaded', () => {
    const savedLanguage =
        localStorage.getItem('preferredLanguage');

    document.getElementById('langPicker').value =
        savedLanguage || detectLanguage();

    updateDailyInputs();
    changeLanguage();

    document.getElementById('btnSync').addEventListener('click', fetchFractalData);
    document.getElementById('langPicker').addEventListener('change', changeLanguage);

    const inputsCalculo = ['currentTitle', 'pristine', 'relics', 'matrices', 'dailyPristine', 'dailyMatrices', 'dailyRelics'];
    inputsCalculo.forEach(id => {
        document.getElementById(id).addEventListener('input', calculate);
    });

    const checkboxesFarm = ['farmT4', 'farmRecs', 'farmPotions', 'cmKinfall', 'cmNightmare', 'cmShattered', 'cmSunqua', 'cmSilent', 'cmLonely'];
    checkboxesFarm.forEach(id => {
        document.getElementById(id).addEventListener('change', updateDailyInputs);
    });
});

function changeLanguage() {    
    const lang = document.getElementById('langPicker').value;

    localStorage.setItem('preferredLanguage', lang);
    const text = translations[lang] || translations['pt'];

    document.getElementById('lblMainTitle').innerText = text.mainTitle;
    document.getElementById('lblSubtitle').innerHTML = text.subtitle;
    document.getElementById('lblCurrentTitle').innerText = text.currentTitle;
    document.getElementById('optNone').innerText = text.none;
    document.getElementById('lblSectionInventory').innerText = text.secInventory;
    document.getElementById('lblPristineCart').innerText = text.pristineCart;
    document.getElementById('lblRelicsCart').innerText = text.relicsCart;
    document.getElementById('lblMatricesCart').innerText = text.matricesCart;
    document.getElementById('lblSectionRoutine').innerText = text.secRoutine;
    document.getElementById('lblSubDailies').innerText = text.subDailies;
    document.getElementById('lblRecsCheck').innerText = text.recsCheck;
    document.getElementById('lblSubCMs').innerText = text.subCMs;
    document.getElementById('lblSectionGains').innerText = text.secGains;
    document.getElementById('lblPristineDay').innerText = text.pristineDay;
    document.getElementById('lblMatricesDay').innerText = text.matricesDay;
    document.getElementById('lblRelicsDay').innerText = text.relicsDay;
    document.getElementById('lblResultTitle').innerText = text.resultTitle;
    document.getElementById('lblApiKey').innerText = text.apiKey;
    document.getElementById('btnSync').innerText = text.btnSync;
}