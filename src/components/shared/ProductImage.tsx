import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface ProductImageProps {
    src?: string;
    alt: string;
    className?: string;
    objectContain?: boolean;
}

// Base del backend sin el sufijo /api para construir URLs de /uploads
const BACKEND_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

/**
 * Imagen de producto con fallback elegante.
 * Resuelve rutas relativas del backend (/uploads/...) automáticamente.
 */
export function ProductImage({ src, alt, className = '', objectContain = false }: ProductImageProps) {
    const [error, setError] = useState(false);
    const handleError = () => {
        if (!error) {
            console.warn(`⚠️ Error de imagen: URL [${src}] falló para el producto [${alt}]`);
            setError(true);
        }
    };

    // Si la URL es relativa (ej: /uploads/products/xxx.jpg), la completamos con la base del backend
    const imageUrl = src
        ? src.startsWith('http')
            ? src
            : `${BACKEND_BASE}${src.startsWith('/') ? '' : '/'}${src}`
        : undefined;

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
