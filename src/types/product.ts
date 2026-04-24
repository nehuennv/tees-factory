/**
 * Representación de un producto dentro del catálogo mayorista.
 * Define la forma canónica que consume toda la feature de catálogo.
 *
 * Compatible con la respuesta de GET /api/products del backend.
 * Campos opcionales mantienen retrocompatibilidad con datos mock.
 */
export interface Product {
    id: string;
    name: string;
    category: string;
    categoryId?: string;
    basePrice: number;
    totalStock: number;
    isActive?: boolean;

    // Campos que vienen solo del mock (se irán eliminando progresivamente)
    quality?: string;
    description?: string;
    image?: string;
    stockStatus?: 'HIGH' | 'LOW' | 'OUT_OF_STOCK';
    sizes?: string[];
    colors?: number;
}

/**
 * Respuesta de GET /api/products/:productId (Matriz 3D)
 * Estructura jerárquica: Producto → Calidad → Color → Talle (Variante)
 */
export interface ProductDetail {
    id: string;
    name: string;
    category: string;
    categoryId?: string;
    qualities: ProductQuality[];
}

export interface ProductQuality {
    id: string;
    qualityName: string;
    basePrice: number;
    colors: ProductColor[];
}

export interface ProductColor {
    colorName: string;
    sizes: ProductVariant[];
}

export interface ProductVariant {
    /** UUID de la variante — Este es el ID para hacer el pedido */
    id: string;
    size: string;
    sku: string;
    availableStock: number;
}
