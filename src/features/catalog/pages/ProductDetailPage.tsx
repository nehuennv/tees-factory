import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatters';
import { useCartStore, type CartItem } from '@/store/cartStore';
import { toast } from 'sonner';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { ProductImage } from '@/components/shared/ProductImage';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// Paleta de colores realista para generar variantes por producto
const COLOR_POOL = [
    { name: "Negro", hex: "#18181b" },
    { name: "Blanco", hex: "#ffffff" },
    { name: "Gris Melange", hex: "#9ca3af" },
    { name: "Azul Marino", hex: "#1e3a8a" },
    { name: "Rojo", hex: "#dc2626" },
    { name: "Verde Militar", hex: "#4d7c0f" },
    { name: "Beige", hex: "#d4c5a9" },
    { name: "Bordo", hex: "#881337" },
    { name: "Celeste", hex: "#7dd3fc" },
    { name: "Rosa Palo", hex: "#fda4af" },
    { name: "Mostaza", hex: "#ca8a04" },
    { name: "Vintage Wash", hex: "#52525b" },
];

// Calidades disponibles según categoría
const QUALITY_PRESETS: Record<string, { name: string; priceMultiplier: number }[]> = {
    Remeras: [
        { name: "Premium Cotton", priceMultiplier: 1.2 },
        { name: "Heavyweight 240g", priceMultiplier: 1.4 },
        { name: "Basic 24/1", priceMultiplier: 0.85 },
    ],
    Buzos: [
        { name: "Frisa Premium 320g", priceMultiplier: 1.15 },
        { name: "Frisa Invisible", priceMultiplier: 1.0 },
        { name: "French Terry", priceMultiplier: 1.3 },
    ],
    Pantalones: [
        { name: "Rústico Liviano", priceMultiplier: 1.0 },
        { name: "Frisa Pesada", priceMultiplier: 1.2 },
        { name: "Drill Stretch", priceMultiplier: 1.35 },
    ],
    Camperas: [
        { name: "Nylon Ripstop", priceMultiplier: 1.0 },
        { name: "Softshell Premium", priceMultiplier: 1.3 },
    ],
    Conjuntos: [
        { name: "Combo Frisa", priceMultiplier: 1.0 },
        { name: "Combo Dry Fit", priceMultiplier: 1.15 },
    ],
    Accesorios: [
        { name: "Estándar", priceMultiplier: 1.0 },
        { name: "Premium", priceMultiplier: 1.3 },
    ],
};

/**
 * Genera datos de detalle de producto a partir de un producto del catálogo.
 * Simula lo que haría una API real devolviendo calidades y colores.
 */
function generateProductDetail(catalogProduct: typeof MOCK_PRODUCTS[0]) {
    const colorCount = catalogProduct.colors || 4;
    // Seleccionar colores de la paleta de forma determinista (basado en el id)
    const seed = catalogProduct.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const shuffled = [...COLOR_POOL].sort((a, b) => {
        const hashA = (a.name.charCodeAt(0) * seed) % 100;
        const hashB = (b.name.charCodeAt(0) * seed) % 100;
        return hashA - hashB;
    });
    const selectedColors = shuffled.slice(0, Math.min(colorCount, COLOR_POOL.length));

    // Obtener calidades según la categoría
    const categoryQualities = QUALITY_PRESETS[catalogProduct.category] || QUALITY_PRESETS["Accesorios"];
    const qualities = categoryQualities.map(q => ({
        name: q.name,
        basePrice: Math.round(catalogProduct.basePrice * q.priceMultiplier / 100) * 100,
        colors: selectedColors,
    }));

    return {
        id: catalogProduct.id,
        name: catalogProduct.name,
        description: catalogProduct.description,
        image: catalogProduct.image?.startsWith("http")
            ? catalogProduct.image.replace("w=500", "w=800")
            : catalogProduct.image,
        collection: catalogProduct.quality === "NUEVO" ? "NUEVA COLECCIÓN" : "COLECCIÓN PERMANENTE",
        qualities,
    };
}

export function ProductDetailPage() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addItems } = useCartStore();

    const [selectedQualityIdx, setSelectedQualityIdx] = useState(0);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Buscar el producto en el catálogo por ID
    const catalogProduct = MOCK_PRODUCTS.find(p => p.id === productId);

    // Generar los datos de detalle dinámicamente (o null si no existe)
    const product = catalogProduct ? generateProductDetail(catalogProduct) : null;

    const activeQuality = product?.qualities[selectedQualityIdx];

    const handleQuantityChange = (colorName: string, size: string, value: string) => {
        const parsed = parseInt(value, 10);
        const qty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
        const key = `${selectedQualityIdx}-${colorName}-${size}`;

        setQuantities(prev => ({
            ...prev,
            [key]: qty
        }));
    };

    const getQuantity = (colorName: string, size: string) => {
        const key = `${selectedQualityIdx}-${colorName}-${size}`;
        return quantities[key] || '';
    };

    const getRowTotal = (colorName: string) => {
        let total = 0;
        SIZES.forEach(size => {
            const key = `${selectedQualityIdx}-${colorName}-${size}`;
            total += (quantities[key] || 0);
        });
        return total;
    };

    const { totalUnits, totalPrice } = useMemo(() => {
        let units = 0;
        let price = 0;

        if (!product) return { totalUnits: units, totalPrice: price };

        // Iteramos sobre todas las calidades por si el usuario cargó en varias
        product.qualities.forEach((quality, qIdx) => {
            quality.colors.forEach(color => {
                SIZES.forEach(size => {
                    const key = `${qIdx}-${color.name}-${size}`;
                    const qty = quantities[key] || 0;
                    units += qty;
                    price += qty * quality.basePrice;
                });
            });
        });

        return { totalUnits: units, totalPrice: price };
    }, [quantities, product]);

    const handleAddToCart = () => {
        if (!product) return;
        const cartItems: CartItem[] = [];

        Object.entries(quantities).forEach(([key, qty]) => {
            if (qty > 0) {
                const [qIdxStr, colorName, size] = key.split('-');
                const qIdx = parseInt(qIdxStr, 10);
                const quality = product.qualities[qIdx];
                const itemId = `${product.id}-${quality.name}-${colorName}-${size}`;

                cartItems.push({
                    id: itemId,
                    productId: product.id,
                    productName: product.name,
                    quality: quality.name,
                    color: colorName,
                    size: size,
                    quantity: qty,
                    unitPrice: quality.basePrice,
                    subtotal: qty * quality.basePrice
                });
            }
        });

        if (cartItems.length > 0) {
            addItems(cartItems);
            toast.success(`${cartItems.length} artículos agregados al pedido`);
            setQuantities({});
        }
    };

    // Null guard AFTER all hooks (React rules compliance)
    if (!product || !activeQuality) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8">
                <p className="text-lg font-bold text-zinc-900 mb-2">Producto no encontrado</p>
                <p className="text-sm mb-4">El producto con ID "{productId}" no existe en el catálogo.</p>
                <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl">
                    Volver al catálogo
                </Button>
            </div>
        );
    }

    return (
        // Contenedor principal: Ocupa el 100% del alto disponible y esconde el scroll general
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 h-full bg-transparent overflow-hidden p-6 lg:p-8">

            {/* --- Left Column: Product Info --- */}
            <div className="w-full lg:w-[35%] xl:w-[30%] flex flex-col gap-6 overflow-y-auto pr-2 pb-10">

                <div className="flex flex-col bg-white rounded-3xl overflow-hidden border border-zinc-200/60 shadow-sm">
                    <div className="w-full aspect-square bg-zinc-100">
                        <ProductImage src={product.image} alt={product.name} />
                    </div>

                    <div className="p-6 flex flex-col gap-3">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                            {product.collection}
                        </span>
                        <h1 className="text-2xl font-black text-zinc-900 leading-tight">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="bg-zinc-100 px-2.5 py-1 rounded-md text-xs font-semibold text-zinc-600 border border-zinc-200/50">
                                SKU: {product.id}
                            </span>
                            <span className="text-sm font-bold text-zinc-500">
                                <span className="text-zinc-900">{formatPrice(activeQuality.basePrice)}</span> / unidad
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                            {product.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- Right Column: The Order Matrix --- */}
            {/* Usamos h-full y flex-col para controlar el alto interior */}
            <div className="flex-1 flex flex-col min-w-0 h-full ">

                {/* --- Unified Interactive Card --- */}
                {/* Esta tarjeta ocupa el 100% del alto disponible */}
                <div className="flex flex-col bg-white rounded-3xl border border-zinc-200/60 shadow-sm h-full overflow-hidden relative">

                    {/* Header & Quality Selector (shrink-0 para que no se achique) */}
                    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-zinc-100 bg-white">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">
                                Matriz de Pedido
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                                Selecciona la calidad y completa las cantidades.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center p-1 bg-zinc-100/80 rounded-xl w-fit border border-zinc-200/50">
                            {product.qualities.map((quality, idx) => {
                                const isActive = idx === selectedQualityIdx;
                                return (
                                    <button
                                        key={quality.name}
                                        onClick={() => setSelectedQualityIdx(idx)}
                                        className={`px-4 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${isActive
                                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                                            : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 border border-transparent'
                                            }`}
                                    >
                                        {quality.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* The Matrix Table (flex-1 overflow-auto aisla el scroll solo a la tabla) */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/30 sticky top-0 z-10 backdrop-blur-sm">
                                    <th className="py-4 px-6 text-xs font-bold text-zinc-400 uppercase tracking-widest w-[180px]">
                                        Color / Talle
                                    </th>
                                    {SIZES.map(size => (
                                        <th key={size} className="py-4 px-3 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center w-20">
                                            {size}
                                        </th>
                                    ))}
                                    <th className="py-4 px-6 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {activeQuality.colors.map(color => (
                                    <tr key={color.name} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="py-4 px-6 flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full border border-zinc-200/80 shadow-inner"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <span className="text-sm font-semibold text-zinc-700">
                                                {color.name}
                                            </span>
                                        </td>

                                        {SIZES.map(size => (
                                            <td key={size} className="py-4 px-3 align-middle text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={getQuantity(color.name, size)}
                                                    onChange={(e) => handleQuantityChange(color.name, size, e.target.value)}
                                                    placeholder="0"
                                                    className="w-14 h-11 text-center bg-zinc-50 border border-transparent hover:bg-zinc-100 focus:bg-white focus:border-zinc-300 rounded-lg text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-zinc-300 placeholder:font-normal"
                                                />
                                            </td>
                                        ))}

                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-bold text-zinc-400">
                                                {getRowTotal(color.name)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Totals (shrink-0 asegura que siempre esté visible en la base de la tarjeta) */}
                    <div className="shrink-0 border-t border-zinc-200/80 bg-white p-4 lg:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 bg-zinc-50 px-5 py-2.5 rounded-xl border border-zinc-100 w-full sm:w-auto">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm border border-zinc-100">
                                    <TableProperties className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">
                                        Prendas Totales
                                    </span>
                                    <span className="text-sm font-bold text-zinc-900">{totalUnits} un.</span>
                                </div>
                            </div>

                            <div className="w-px h-6 bg-zinc-200"></div>

                            <div className="flex flex-col">
                                <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">
                                    Subtotal Estimado
                                </span>
                                <span className="text-base font-black text-zinc-900 tracking-tight">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleAddToCart}
                            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-8 h-12 font-bold shadow-sm flex items-center justify-center gap-2 transition-all">
                            <ShoppingBag className="w-4 h-4" />
                            Añadir al Pedido
                        </Button>
                    </div>

                </div>

            </div>
        </div>
    );
}