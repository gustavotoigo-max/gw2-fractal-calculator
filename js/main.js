import { initUI, updateDailyInputs, changeLanguage } from './modules/ui.js';
import { fetchFractalData } from './modules/gw2-api.js';
import { calculate } from './modules/calculator.js';

window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado");

    // Inicializa UI (idioma, API key salva, etc.)
    initUI();

    // Botão de sincronização
    const btnSync = document.getElementById('btnSync');
    if (btnSync) {
        btnSync.addEventListener('click', () => fetchFractalData());
    }

    // Seletor de idioma
    const langPicker = document.getElementById('langPicker');
    if (langPicker) {
        langPicker.addEventListener('change', () => changeLanguage());
    }

    // Inputs de cálculo
    const inputsCalculo = ['currentTitle', 'pristine', 'relics', 'matrices', 'dailyPristine', 'dailyMatrices', 'dailyRelics'];
    inputsCalculo.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => calculate());
        }
    });

    // Checkboxes de farm
    const checkboxesFarm = ['farmT4', 'farmRecs', 'farmPotions', 'cmKinfall', 'cmNightmare', 'cmShattered', 'cmSunqua', 'cmSilent', 'cmLonely'];
    checkboxesFarm.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => updateDailyInputs());
        }
    });

    // Primeira atualização dos ganhos e cálculo
    updateDailyInputs();
    changeLanguage();
    console.log("Eventos registrados com sucesso!");
});