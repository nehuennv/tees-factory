import type { Product } from '@/types/product';
import { formatPrice } from '@/lib/formatters';
import { ProductImage } from '@/components/shared/ProductImage';
import { QualityBadge } from '@/components/shared/QualityBadge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react'; // <-- Agregamos un ícono

interface ProductCardProps {
    product: Product;
    actionLabel?: string;
    onAction?: (product: Product) => void;
}

/**
 * Tarjeta individual de producto para el catálogo.
 * Totalmente reutilizable: recibe un Product y callbacks opcionales.
 * Composición visual: imagen con badge → info (título, tags, precio) → acción.
 */
export function ProductCard({
    product,
    actionLabel = 'Elegir Talles', // <-- Copy mejorado
    onAction
}: ProductCardProps) {
    return (
        <div className="flex flex-col bg-white rounded-xl overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all duration-300 group border border-zinc-200/80">
            {/* Imagen compacta */}
            <div className="relative aspect-square w-full bg-[#f4f4f5] overflow-hidden">
                <ProductImage src={product.image} alt={product.name} />
                <div className="absolute top-2 right-2">
                    <QualityBadge quality={product.quality} />
                </div>
            </div>

            {/* Info Container */}
            <div className="flex flex-col flex-1 p-3 lg:p-4">
                {/* Título y SKU */}
                <div className="flex flex-col mb-2">
                    <h3 className="text-xs lg:text-sm font-bold text-zinc-900 leading-snug line-clamp-1 group-hover:text-zinc-700 transition-colors">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            SKU:
                        </span>
                        <span className="text-[9px] font-medium text-zinc-500 truncate max-w-[120px]">
                            {product.id}
                        </span>
                    </div>
                </div>

                {/* Tags: Talles y Colores */}
                <div className="flex flex-wrap items-center gap-1 mb-3">
                    <span className="bg-zinc-50 border border-zinc-100 text-zinc-600 text-[8px] lg:text-[9px] font-medium px-1.5 py-0.5 rounded tracking-wide">
                        {product.sizes || 'N/A'}
                    </span>
                    <span className="bg-zinc-50 border border-zinc-100 text-zinc-600 text-[8px] lg:text-[9px] font-medium px-1.5 py-0.5 rounded tracking-wide">
                        {product.colors || 0} Col.
                    </span>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                    {/* Precio */}
                    <div>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">
                            PRECIO DESDE
                        </p>
                        <p className="text-base lg:text-lg font-black text-zinc-900 tracking-tight">
                            {formatPrice(product.basePrice)}
                        </p>
                    </div>

                    {/* Acción */}
                    <Button
                        onClick={() => onAction?.(product)}
                        className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg h-9 lg:h-10 font-semibold shadow-sm transition-all text-[11px] lg:text-xs group/btn flex items-center justify-center gap-2"
                    >
                        {actionLabel}
                        {/* Ícono sutil que se anima en hover */}
                        <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
}