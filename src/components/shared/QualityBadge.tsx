interface QualityBadgeProps {
    quality?: string;
}

/**
 * Píldora visual que indica la calidad o etiqueta de un producto.
 * "PREMIUM" / "BASIC" → fondo blanco.  Otros (e.g. "NUEVO") → fondo oscuro.
 * Reutilizable en cards, tablas, detalles de producto, etc.
 */
export function QualityBadge({ quality }: QualityBadgeProps) {
    if (!quality) return null;

    const isPremium = quality === 'PREMIUM' || quality === 'BASIC';

    return (
        <span
            className={`text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-xl shadow-sm tracking-widest uppercase ${isPremium ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'
                }`}
        >
            {quality}
        </span>
    );
}
