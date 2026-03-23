import { Search } from 'lucide-react';
import type { Product } from '@/types/product';
import { ProductCard } from './ProductCard';

interface CatalogGridProps {
    products: Product[];
    actionLabel?: string;
    onProductAction?: (product: Product) => void;
    emptyMessage?: string;
    emptyDescription?: string;
}

/**
 * Grilla responsiva de ProductCards.
 * Orquesta la iteración y el estado vacío.
 * Delega la presentación individual a ProductCard.
 */
export function CatalogGrid({
    products,
    actionLabel,
    onProductAction,
    emptyMessage = 'No se encontraron productos',
    emptyDescription = 'Intenta con otros términos de búsqueda.'
}: CatalogGridProps) {
    if (products.length === 0) {
        return (
            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white border border-dashed border-zinc-300 rounded-2xl">
                <Search className="w-10 h-10 text-zinc-300 mb-4" />
                <h3 className="text-lg font-bold text-zinc-900">{emptyMessage}</h3>
                <p className="text-zinc-500 text-sm mt-1">{emptyDescription}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4 pb-6">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    actionLabel={actionLabel}
                    onAction={onProductAction}
                />
            ))}
        </div>
    );
}
