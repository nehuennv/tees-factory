/**
 * Lógica única de saldo de cuenta corriente (evita duplicar y divergir).
 *
 * Convención: saldo > 0 = el cliente DEBE; saldo < 0 = saldo a favor.
 */

type AnyTx = { type?: string; status?: string; amount?: number };

/**
 * ¿El movimiento impacta el saldo? Cuentan todos salvo los anulados/pendientes
 * (rechazado, cancelado, pendiente, revertido). Así incluye COMPLETED, APPROVED
 * y cualquier estado "firme" del backend (ej. los ajustes manuales).
 */
export function countsToBalance(status?: string): boolean {
    const s = (status || 'COMPLETED').toUpperCase();
    return s !== 'REJECTED' && s !== 'CANCELLED' && s !== 'PENDING'
        && s !== 'PENDING_REVIEW' && s !== 'REVERSED' && s !== 'VOID';
}

export function isIncrease(tx: AnyTx): boolean {
    return tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER';
}

/** Recalcula el saldo sumando los movimientos firmes del ledger. */
export function recalcLedgerBalance(ledger: AnyTx[]): number {
    return (ledger || []).reduce((acc, tx) => {
        if (!countsToBalance(tx.status)) return acc;
        return isIncrease(tx) ? acc + (Number(tx.amount) || 0) : acc - (Number(tx.amount) || 0);
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
