export default function handler(req, res) {

            continue;
        }

        const futurePristineNeeds = tierData
            .slice(i)
            .reduce((sum, t) => sum + t.pristine, 0);

        let simulatedWallet = {
            pristine: wallet.pristine,
            relics: wallet.relics,
            matrices: wallet.matrices
        };

        let tierDays = 0;

        while (true) {

            const pristineReserved = Math.max(
                0,
                futurePristineNeeds - tier.pristine
            );

            const usablePristine = Math.max(
                0,
                simulatedWallet.pristine - pristineReserved
            );

            const possibleRelics =
                simulatedWallet.relics +
                (usablePristine * 15);

            const hasEnough =
                simulatedWallet.matrices >= tier.matrices &&
                possibleRelics >= tier.relics &&
                simulatedWallet.pristine >= tier.pristine;

            if (hasEnough) {
                break;
            }

            if (
                dPristine === 0 &&
                dMatrices === 0 &&
                dRelics === 0
            ) {
                tierDays = Infinity;
                break;
            }

            simulatedWallet.pristine += dPristine;
            simulatedWallet.matrices += dMatrices;
            simulatedWallet.relics += dRelics;

            tierDays++;

            if (tierDays > 15000) {
                tierDays = Infinity;
                break;
            }
        }

        if (tierDays !== Infinity) {

            const pristineReserved = Math.max(
                0,
                futurePristineNeeds - tier.pristine
            );

            const usablePristine = Math.max(
                0,
                simulatedWallet.pristine - pristineReserved
            );

            const relicDeficit = Math.max(
                0,
                tier.relics - simulatedWallet.relics
            );

            const pristineToConvert = Math.min(
                usablePristine,
                Math.ceil(relicDeficit / 15)
            );

            simulatedWallet.pristine -= pristineToConvert;
