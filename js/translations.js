const translations = {
    pt: {
        // Títulos e labels principais
        mainTitle: "Fractal God Timeline", 
        currentTitle: "Seu título atual", 
        none: "Nenhum", 
        secInventory: "Seu Inventário Atual", 
        pristineCart: "Pristine Fractal Relics atuais", 
        relicsCart: "Fractal Relics atuais", 
        matricesCart: "Integrated Fractal Matrices atuais", 
        secRoutine: "Sua Rotina Diária de Farm", 
        subDailies: "Dailies Padrão", 
        recsCheck: "Recomendadas (Recs)", 
        subCMs: "Challenge Modes (CMs)", 
        secGains: "Ganhos Diários Calculados (Dados Reais)", 
        pristineDay: "Pristine Relics / dia", 
        matricesDay: "Integrated Matrices / dia", 
        relicsDay: "Fractal Relics Normais / dia (Garantidos + Conversões)", 
        resultTitle: "Tempo Total Restante até o Fractal God",
        devBanner: "⚠️ Site under development - Some features may be in testing phase",
        
        // Status e mensagens dos cards
        lblCompleted: "✓ Concluído", 
        lblAlreadyDone: "Você já domina este tier ou passou dele!", 
        lblNeedStock: "Falta nesta etapa:", 
        lblReadyBuy: "Pronto para comprar", 
        lblInfDays: "Infinitos dias (Sem farm ativo)", 
        lblReadyGod: "Pronto para virar Deus!", 
        lblIsGod: "Fractal God!", 
        lblUnfTime: "Tempo Indeterminado", 
        
        // Unidades de tempo
        lblDays: "dias", 
        lblWeeks: "semanas",
        
        // Labels de recursos
        lblPristines: "Pristines",
        lblRelics: "Relics",
        lblMatrices: "Matrices",
        
        // Nomes dos tiers
        tier1: "Nenhum ➔ Fractal Savant",
        tier2: "Savant ➔ Fractal Prodigy",
        tier3: "Prodigy ➔ Fractal Champion",
        tier4: "Champion ➔ Fractal God",
        
        // API e sincronização
        apiKey: "Sincronizar Conta via GW2 API Key:", 
        btnSync: "Sincronizar Inventário", 
        apiLoading: "Buscando dados na Tyria...",
        account: "Conta",
        title: "Título",
        
        // Mensagem de excedente (cards)
        lblSurplus: "✨ Excedente seguro: {{pristines}} Pristines → +{{relics}} Relics disponíveis para conversão",
        
        // Mensagem de mantenha (cards) - já vem do backend, mas vamos manter como referência
        // As mensagens "Mantenha" estão no backend (tierData.keepMessage) e não precisam de tradução separada
        
        // Notas do rodapé
        notesTitle: "📝 Notas",
        note1: "Primeiramente o site foi desenvolvido para uso pessoal/grupo local e não tem vínculo com nenhuma outra ferramenta já existente ou empresa;",
        note2: "O site faz uma estimativa, ou seja, podem conter erros ou discrepâncias e não serve necessariamente como um guia. Use com atenção;",
        note3: "O cálculo reserva automaticamente currencies necessárias para títulos futuros. Apenas o excedente pode ser convertido;",
        note4: "A sua API deve conter minimamente as seguintes opções marcadas: account, inventories, characters, wallet e progression;",
        note5: "Sem CMs ativas, você pode comprar Integrated Fractal Matrices por 15 Fractal Relics cada uma no vendor.",
        apiWarningText: "Crie uma nova API key exclusiva para este site com ao menos estas permissões: account, inventories, wallet, progression",
        apiWarningLink: "🔑 Criar API key",
        keepMsg1: "📌 Mantenha 25.000 Fractal Relics para próximo título",
        keepMsg2: "📌 Mantenha 1.200 Pristines e 35.000 Fractal Relics para próximo título",
        keepMsg3: "📌 Mantenha 45.000 Fractal Relics para próximo título",
        keepMsg4: "📌 Mantenha 2.000 Pristines e 55.000 Fractal Relics para próximo título",
        // Rodapé
        lblDevBy: "Desenvolvido por:"
    },
    en: {
        // Títulos e labels principais
        mainTitle: "Fractal God Timeline", 
        currentTitle: "Your current title", 
        none: "None", 
        secInventory: "Your Current Inventory", 
        pristineCart: "Current Pristine Fractal Relics", 
        relicsCart: "Current Fractal Relics", 
        matricesCart: "Current Integrated Fractal Matrices", 
        secRoutine: "Your Daily Farm Routine", 
        subDailies: "Standard Dailies", 
        recsCheck: "Recommended (Recs)", 
        subCMs: "Challenge Modes (CMs)", 
        secGains: "Calculated Daily Earnings (Real Data)", 
        pristineDay: "Pristine Relics / day", 
        matricesDay: "Integrated Matrices / day", 
        relicsDay: "Normal Fractal Relics / day (Guaranteed + Melt)", 
        resultTitle: "Total Time Remaining until Fractal God",
        devBanner: "⚠️ Site under development - Some features may be in testing phase",
        apiWarningText: "Create a new dedicated API key for this site with at least these permissions: account, inventories, wallet, progression",
        apiWarningLink: "🔑 Create API key",
        // Status e mensagens dos cards
        lblCompleted: "✓ Completed", 
        lblAlreadyDone: "You already own this tier or have passed it!", 
        lblNeedStock: "Missing resources in this step:", 
        lblReadyBuy: "Ready to buy", 
        lblInfDays: "Infinite days (No active farm)", 
        lblReadyGod: "Ready to become God!", 
        lblIsGod: "Fractal God!", 
        lblUnfTime: "Undetermined Time", 
        
        // Unidades de tempo
        lblDays: "days", 
        lblWeeks: "weeks",
        
        // Labels de recursos
        lblPristines: "Pristines",
        lblRelics: "Relics",
        lblMatrices: "Matrices",
        
        // Nomes dos tiers
        tier1: "None ➔ Fractal Savant",
        tier2: "Savant ➔ Fractal Prodigy",
        tier3: "Prodigy ➔ Fractal Champion",
        tier4: "Champion ➔ Fractal God",
        
        // API e sincronização
        apiKey: "Sync Account via GW2 API Key:", 
        btnSync: "Sync Inventory", 
        apiLoading: "Fetching data from Tyria...",
        account: "Account",
        title: "Title",
        
        // Mensagem de excedente (cards)
        lblSurplus: "✨ Safe surplus: {{pristines}} Pristines → +{{relics}} Relics available for conversion",
        keepMsg1: "Keep 25,000 Fractal Relics for the next title",
        keepMsg2: "📌 Keep 1,200 Pristines and 35,000 Fractal Relics for the next title",
        keepMsg3: "📌 Keep 45,000 Fractal Relics for the next title",
        keepMsg4: "📌 Keep 2,000 Pristines and 55,000 Fractal Relics for the next title",
        // Notas do rodapé
        notesTitle: "📝 Notes",
        note1: "This site was developed for personal/local group use and is not affiliated with any existing tool or company;",
        note2: "This site provides an estimate, meaning it may contain errors or discrepancies and should not be used as a definitive guide. Use with caution;",
        note3: "The calculator automatically reserves currencies needed for future titles. Only the surplus can be converted;",
        note4: "Your API key must minimally have the following options enabled: account, inventories, characters, wallet, and progression;",
        note5: "Without active CMs, you can buy Integrated Fractal Matrices for 15 Fractal Relics each from the vendor.",
        
        // Rodapé
        lblDevBy: "Developed by:"
    }
};