/**
 * Representación de un producto dentro del catálogo mayorista.
 * Define la forma canónica que consume toda la feature de catálogo.
 */
export interface Product {
    id: string;
    name: string;
    category: string;
    quality?: string;
    description: string;
    basePrice: number;
    image?: string;
    stockStatus: 'HIGH' | 'LOW' | 'OUT_OF_STOCK';
    totalStock: number;
    sizes?: string;
    colors?: number;
}
