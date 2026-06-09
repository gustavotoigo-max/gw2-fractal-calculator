// No início, após definir dMatrices (ganho diário de CMs)
// Adicionar flag para permitir compra de Matrices com Relics
const canBuyMatricesWithRelics = true; // Sempre true, é mecânica do jogo
const relicsPerMatrix = 15;

// Dentro da simulação diária (while loop), modificar a lógica de verificação:

// Em vez de verificar apenas dMatrices, considerar que sempre pode comprar com Relics
const effectiveDailyMatrices = dMatrices; // Matrices gratuitas por dia
const canGetMatrices = effectiveDailyMatrices > 0 || dRelics > 0; // Pode ganhar de CM ou comprar

// Na condição de impossibilidade:
if (
    (neededPristine > 0 && dPristine === 0) ||
    (neededMatrices > 0 && !canGetMatrices) ||  // Modificado
    (neededRelics > 0 && dRelics === 0 && dPristine === 0)
) {
    tierDays = Infinity;
}

// Dentro do loop de compra, ao invés de apenas adicionar dMatrices, 
// precisamos simular a compra de Matrices quando necessário