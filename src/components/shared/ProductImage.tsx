import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface ProductImageProps {
    src?: string;
    alt: string;
    className?: string;
    objectContain?: boolean;
}

/**
 * Imagen de producto con fallback elegante.
 */
export function ProductImage({ src, alt, className = '', objectContain = false }: ProductImageProps) {
    const [error, setError] = useState(false);
    const handleError = () => {
        if (!error) {
            console.warn(`⚠️ Error de imagen: URL [${src}] falló para el producto [${alt}]`);
            setError(true);
        }
    };

    // Normalizar la URL de la imagen para evitar problemas con rutas relativas en URLs profundas
    const imageUrl = src && !src.startsWith('http') && !src.startsWith('/') 
        ? `/${src}` 
        : src;

    if (!imageUrl || error) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-zinc-300 bg-zinc-50 ${className}`}>
                <Shirt className="w-12 h-12 mb-2" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold tracking-wider">SIN FOTO</span>
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            onError={handleError}
            className={`w-full h-full ${objectContain ? 'object-contain' : 'object-cover'} transition-transform duration-700 group-hover:scale-105 ${className}`}
        />
    );
}
