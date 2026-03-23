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
