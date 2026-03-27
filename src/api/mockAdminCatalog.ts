/**
 * Mock API para el módulo de Administración de Catálogo y Stock.
 * Simula retrasos de red y devuelve success para el Optimistic UI.
 */

const SIMULATED_DELAY = 800; // 800ms para simular petición al servidor

/**
 * Simula la mutación para activar/desactivar un producto del catálogo.
 * @param productId ID del producto a modificar
 * @param isActive Nuevo estado booleano
 * @returns Promesa que se resuelve a un objeto con resultado exitoso
 */
export async function updateProductStatus(productId: string, isActive: boolean): Promise<{ success: boolean; productId: string; status: boolean }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[Mock API] updateProductStatus: Producto ${productId} -> status: ${isActive ? 'Activo' : 'Inactivo'}`);
            resolve({ success: true, productId, status: isActive });
        }, SIMULATED_DELAY);
    });
}

/**
 * Simula la mutación para actualizar de manera asíncrona un SKU de matriz de producto.
 * @param productId ID del producto a modificar
 * @param quality Calidad seleccionada (ej. Algodón Peinado 24/1)
 * @param color Color del producto en la matriz
 * @param size Talle en la matriz
 * @param newStock Nueva cantidad de stock a definir
 * @returns Promesa resolviendo éxito con un timestamp simulado.
 */
export async function updateProductStock(
    productId: string,
    quality: string,
    color: string,
    size: string,
    newStock: number
): Promise<{ success: boolean; timestamp: string }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[Mock API] updateProductStock: ${productId} | ${quality} | ${color} | ${size} -> Nuevo stock: ${newStock}`);
            resolve({ success: true, timestamp: new Date().toISOString() });
        }, SIMULATED_DELAY);
    });
}
