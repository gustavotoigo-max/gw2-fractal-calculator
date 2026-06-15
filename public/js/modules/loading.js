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

export function showLoading() {
    const langPicker = document.getElementById('langPicker');
    const lang = langPicker ? langPicker.value : 'en';
    const messages = loadingMessages[lang] || loadingMessages['en'];
    
    let index = 0;
    const loadingTextElement = document.querySelector('.loading-text');
    
    if (loadingTextElement) {
        loadingTextElement.innerText = messages[0];
    }
    
    if (loadingInterval) clearInterval(loadingInterval);
    
    loadingInterval = setInterval(() => {
        index = (index + 1) % messages.length;
        if (loadingTextElement) {
            loadingTextElement.innerText = messages[index];
        }
    }, 1200);
    
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

export function hideLoading() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}