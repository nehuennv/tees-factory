/** Tramo de precio por cantidad de un servicio extra. */
export interface ExtraServiceTier {
    id?: string;
    minQty: number;
    maxQty: number | null; // null = sin tope
    unitPrice: number;
}

/** Servicio del catálogo de extras (planchado, estampado, …). */
export interface ExtraService {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt?: string;
    tiers: ExtraServiceTier[];
}
