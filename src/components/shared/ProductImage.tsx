import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface ProductImageProps {
    src?: string;
    alt: string;
    className?: string;
}

/**
 * Imagen de producto con fallback elegante.
 * Si la URL está vacía o falla al cargar, muestra un placeholder con ícono.
 * Reutilizable en cualquier contexto donde se renderice una foto de prenda.
 */
export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-zinc-300 bg-zinc-50 ${className}`}>
                <Shirt className="w-12 h-12 mb-2" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold tracking-wider">SIN FOTO</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            className={`w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105 ${className}`}
        />
    );
}
