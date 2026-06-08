/**
 * Lógica única de saldo de cuenta corriente (evita duplicar y divergir).
 *
 * Convención: saldo > 0 = el cliente DEBE; saldo < 0 = saldo a favor.
 */

type AnyTx = { type?: string; status?: string; amount?: number };

/** Recalcula el saldo sumando movimientos COMPLETED/APPROVED del ledger. */
export function recalcLedgerBalance(ledger: AnyTx[]): number {
    return (ledger || []).reduce((acc, tx) => {
        const status = (tx.status || 'COMPLETED').toUpperCase();
        if (status !== 'COMPLETED' && status !== 'APPROVED') return acc;
        return (tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER')
            ? acc + (tx.amount || 0)
            : acc - (tx.amount || 0);
    }, 0);
}

/**
 * Saldo definitivo. Prioriza el balance autoritativo del backend; si no viene
 * o es 0 (ledger/respuesta incompleta), cae al recálculo del ledger.
 * Acepta la respuesta cruda de GET /clients/:id/ledger + un fallback opcional
 * (ej. client.balance del listado).
 */
export function resolveBalance(res: any, ledger: AnyTx[], fallback?: number): number {
    const clientData = res?.client || {};
    const candidates = [
        clientData.balance, clientData.currentDebt, clientData.current_debt,
        res?.balance, res?.currentDebt, res?.current_debt,
        fallback,
    ];
    const backend = candidates.find((v) => typeof v === 'number') as number | undefined;
    const real = recalcLedgerBalance(ledger);

    // Preferir un backend autoritativo distinto de 0; si es 0/ausente, usar el recálculo.
    if (typeof backend === 'number' && backend !== 0) return backend;
    if (real !== 0) return real;
    return typeof backend === 'number' ? backend : 0;
}

/**
 * Etiquetas de los botones de ajuste según el estado de la cuenta.
 * - Con deuda (balance > 0): "Aumentar deuda" / "Reducir deuda".
 * - Al día o saldo a favor (balance <= 0): "Cargar deuda" / "Acreditar a favor".
 */
export function adjustActionLabels(balance: number): { debt: string; credit: string } {
    const hasDebt = balance > 0;
    return {
        debt: hasDebt ? 'Aumentar deuda' : 'Cargar deuda',
        credit: hasDebt ? 'Reducir deuda' : 'Acreditar a favor',
    };
}
