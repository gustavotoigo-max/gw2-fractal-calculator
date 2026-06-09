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

let loadingInterval;

function showLoading() {
    const lang = document.getElementById('langPicker')?.value || 'en';
    const messages = loadingMessages[lang] || loadingMessages['en'];
    
    let index = 0;
    const loadingTextElement = document.querySelector('.loading-text');
    
    if (loadingTextElement) {
        loadingTextElement.innerText = messages[0];
    }
    
    loadingInterval = setInterval(() => {
        index++;
        if (index >= messages.length) index = 0;
        
        if (loadingTextElement) {
            loadingTextElement.innerText = messages[index];
        }
    }, 1200);
    
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
    }
    
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}