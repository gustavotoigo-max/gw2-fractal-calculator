export const SITE_VERSION = "v2.6.0";
export const USER_NICK = "Nahar.5349";
export const USER_EMAIL = "gustavo.toigo@gmail.com";

export const ACHIEVEMENTS = {
    SAVANT: 4001,
    PRODIGY: 4015,
    CHAMPION: 3990,
    GOD: 4018
};

export const WALLET_IDS = {
    RELICS: 7,
    PRISTINE: 24
};

export const MATERIAL_IDS = {
    INTEGRATED_MATRIX: 79230
};

// ... (constantes existentes) ...

// IDs das melhorias no endpoint /v2/account/progression
export const PROGRESSION_IDS = {
    FRACTAL_EMPOWERMENT: "fractal_empowerment",
    KARMIC_RETRIBUTION: "fractal_karmic_retribution",
    AGONY_IMPEDANCE: "fractal_agony_impedance"
};

// Custos de cada upgrade (matrizes, relics)
export const UPGRADE_COSTS = [
    { id: "fractal_empowerment", level: 1, matrices: 1, relics: 250 },
    { id: "fractal_empowerment", level: 2, matrices: 3, relics: 500 },
    { id: "fractal_karmic_retribution", level: 1, matrices: 1, relics: 500 },
    { id: "fractal_karmic_retribution", level: 2, matrices: 5, relics: 1000 },
    { id: "fractal_agony_impedance", level: 1, matrices: 10, relics: 1000 },
    { id: "fractal_agony_impedance", level: 2, matrices: 15, relics: 2500 }
];