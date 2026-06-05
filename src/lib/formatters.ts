/**
 * Formatea un número como moneda argentina (ARS).
 * Reutilizable en cualquier lugar de la app que necesite formateo de precios.
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Formatea un precio para mostrar al cliente, nunca como "$0".
 * Si el precio no es válido (0, null, undefined) devuelve "Consultar precio"
 * para evitar mostrar productos como gratis/rotos por datos incompletos.
 */
export function formatPriceOrConsult(price?: number | null): string {
    return price != null && price > 0 ? formatPrice(price) : 'Consultar precio';
}
