function showLoading() {

    let index = 0;

    document.querySelector('.loading-text').innerText =
        loadingMessages[0];

    loadingInterval = setInterval(() => {

        index++;

        if (index >= loadingMessages.length)
            index = 0;

        document.querySelector('.loading-text').innerText =
            loadingMessages[index];

    }, 1200);

    document.getElementById('loadingOverlay')
        .classList.add('active');
}

function hideLoading() {

    clearInterval(loadingInterval);

    document.getElementById('loadingOverlay')
        .classList.remove('active');
}

const loadingMessages = [
    "Entering the Mists...",
    "Consulting Dessa...",
    "Scanning Fractal Relics...",
    "Analyzing Integrated Matrices...",
    "Synchronizing Account..."
];

let loadingInterval;