const loadingMessages = {
    pt: [
        "Entrando nas Brumas...",
        "Consultando Dessa...",
        "Escaneando Relíquias Fractais...",
        "Analisando Matrizes Integradas...",
        "Sincronizando Conta..."
    ],
    en: [
        "Entering the Mists...",
        "Consulting Dessa...",
        "Scanning Fractal Relics...",
        "Analyzing Integrated Matrices...",
        "Synchronizing Account..."
    ]
};

let loadingInterval = null;

function showLoading() {
    // Pega o idioma atual
    const langPicker = document.getElementById('langPicker');
    const lang = langPicker ? langPicker.value : 'en';
    const messages = loadingMessages[lang] || loadingMessages['en'];
    
    let index = 0;
    const loadingTextElement = document.querySelector('.loading-text');
    
    if (loadingTextElement) {
        loadingTextElement.innerText = messages[0];
    }
    
    // Limpa intervalo anterior se existir
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    
    // Inicia novo intervalo
    loadingInterval = setInterval(() => {
        index++;
        if (index >= messages.length) {
            index = 0;
        }
        
        if (loadingTextElement) {
            loadingTextElement.innerText = messages[index];
        }
    }, 1200);
    
    // Mostra o overlay
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    // Limpa o intervalo
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    
    // Esconde o overlay
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}