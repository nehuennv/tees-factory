import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatters';
import { useCartStore, type CartItem } from '@/store/cartStore';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { ProductImage } from '@/components/shared/ProductImage';

const SIZES_FALLBACK = ['S', 'M', 'L', 'XL', 'XXL'];

// Paleta de colores para asignar HEX visual según nombre
const COLOR_POOL = [
    { name: "Negro", hex: "#18181b" },
    { name: "Blanco", hex: "#ffffff" },
    { name: "Gris", hex: "#9ca3af" },
    { name: "Azul", hex: "#1e3a8a" },
    { name: "Rojo", hex: "#dc2626" },
    { name: "Verde", hex: "#4d7c0f" },
    { name: "Beige", hex: "#d4c5a9" },
    { name: "Bordo", hex: "#881337" },
];

const getHexForColor = (name: string) => {
    const found = COLOR_POOL.find(c => name.toLowerCase().includes(c.name.toLowerCase()));
    return found ? found.hex : '#cccccc';
};

export function ProductDetailPage() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addItems } = useCartStore();

    const [selectedQualityIdx, setSelectedQualityIdx] = useState(0);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        apiClient.get(`/products/${productId}`)
            .then(res => {
                const data = res.data;
                // Si el backend devuelve 'variants' en lugar de 'qualities',
                // o la estructura difiere, lo normalizamos aquí.
                if (data && !data.qualities && data.variants) {
                    // Agrupar variants planos en estructura qualities[].colors[].sizes[]
                    const qualityMap: Record<string, any> = {};
                    data.variants.forEach((v: any) => {
                        const qName = v.quality || v.qualityName || 'Estándar';
                        if (!qualityMap[qName]) {
                            qualityMap[qName] = { qualityName: qName, basePrice: v.price || v.unitPrice || data.basePrice || 0, colors: {} };
                        }
                        const cName = v.color || v.colorName || 'Default';
                        if (!qualityMap[qName].colors[cName]) {
                            qualityMap[qName].colors[cName] = { colorName: cName, sizes: [] };
                        }
                        qualityMap[qName].colors[cName].sizes.push({
                            id: v.id,
                            size: v.size,
                            sku: v.sku || '',
                            availableStock: v.availableStock ?? v.stock ?? 0,
                        });
                    });
                    data.qualities = Object.values(qualityMap).map((q: any) => ({
                        ...q,
                        colors: Object.values(q.colors),
                    }));
                }
                setProduct(data);
            })
            .catch(err => {
                console.error(err);
                if (err.response?.status !== 404) {
                     toast.error("Error al cargar producto");
                }
            })
            .finally(() => setIsLoading(false));
    }, [productId]);

    const activeQuality = product?.qualities?.[selectedQualityIdx];

    // Dynamic sizes for table headers
    const activeSizes = useMemo(() => {
        if (!activeQuality) return SIZES_FALLBACK;
        const set = new Set<string>();
        activeQuality.colors?.forEach((c: any) => {
            c.sizes?.forEach((s: any) => set.add(s.size));
        });
        const arr = Array.from(set);
        return arr.length > 0 ? arr : SIZES_FALLBACK;
    }, [activeQuality]);

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
        activeSizes.forEach(size => {
            const key = `${selectedQualityIdx}-${colorName}-${size}`;
            total += (quantities[key] || 0);
        });
        return total;
    };

    const { totalUnits, totalPrice } = useMemo(() => {
        let units = 0;
        let price = 0;

        if (!product || !product.qualities) return { totalUnits: units, totalPrice: price };

        product.qualities.forEach((quality: any, qIdx: number) => {
            quality.colors?.forEach((color: any) => {
                activeSizes.forEach(size => {
                    const key = `${qIdx}-${color.colorName}-${size}`;
                    const qty = quantities[key] || 0;
                    units += qty;
                    price += qty * quality.basePrice;
                });
            });
        });

        return { totalUnits: units, totalPrice: price };
    }, [quantities, product, activeSizes]);

    const handleAddToCart = () => {
        if (!product) return;
        const cartItems: CartItem[] = [];

        Object.entries(quantities).forEach(([key, qty]) => {
            if (qty > 0) {
                const [qIdxStr, colorName, size] = key.split('-');
                const qIdx = parseInt(qIdxStr, 10);
                const quality = product.qualities[qIdx];
                const colorData = quality.colors.find((c: any) => c.colorName === colorName);
                const sizeData = colorData?.sizes?.find((s: any) => s.size === size);

                if (!sizeData) {
                    toast.error(`Variante ${colorName}-${size} no encontrada`);
                    return;
                }

                // If asking for more than physical available stock
                if (qty > sizeData.availableStock) {
                    toast.error(`No hay suficiente stock de ${colorName} - Talle ${size}. Máx: ${sizeData.availableStock}`);
                    return;
                }

                const itemId = `${product.id}-${quality.qualityName}-${colorName}-${size}`;

                cartItems.push({
                    id: itemId,
                    variantId: sizeData.id,
                    productId: product.id,
                    productName: product.name,
                    quality: quality.qualityName,
                    color: colorName,
                    size: size,
                    quantity: qty,
                    unitPrice: quality.basePrice,
                    subtotal: qty * quality.basePrice,
                    image: product.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2600&auto=format&fit=crop'
                });
            }
        });

        if (cartItems.length > 0) {
            addItems(cartItems);
            toast.success(`${cartItems.length} variantes agregadas al pedido`);
            setQuantities({});
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-zinc-500">
                <span className="w-8 h-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin mb-4" />
                <p className="font-medium animate-pulse">Cargando matriz de talles...</p>
            </div>
        );
    }

    if (!product) {
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

    if (!activeQuality) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8">
                <p className="text-lg font-bold text-zinc-900 mb-2">Sin variantes disponibles</p>
                <p className="text-sm mb-4">Este producto no tiene talles ni calidades configuradas aún. Contactá al administrador.</p>
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
            <div className="w-full lg:w-[38%] xl:w-[32%] flex flex-col gap-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">

                <div className="flex flex-col bg-white rounded-[2rem] overflow-hidden border border-zinc-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
                    {/* Contenedor de Imagen con mejor proporción para ropa y bordes redondeados */}
                    <div className="w-full aspect-[3/4] bg-zinc-50/50 relative group/img overflow-hidden rounded-[2rem] border border-zinc-100">
                        <ProductImage
                            src={product.image}
                            alt={product.name}
                            objectContain={false}
                            className="h-full w-full"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-zinc-400 uppercase border border-zinc-200/50 shadow-sm">
                                {product.collection || 'COLECCIÓN'}
                            </span>
                        </div>
                    </div>

                    <div className="p-8 pt-4 flex flex-col gap-6">
                        {/* Título y SKU */}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-zinc-900 leading-[1.1] tracking-tight">
                                {product.name}
                            </h1>
                            <span className="inline-block bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-400 border border-zinc-200/30 uppercase tracking-widest">
                                SKU: {product.id}
                            </span>
                        </div>

                        {/* PRECIO: Más suave y elegante */}
                        <div className="bg-zinc-50 rounded-2xl p-6 text-zinc-900 border border-zinc-200/60 shadow-sm transform transition-transform hover:scale-[1.01] duration-300">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 opacity-80">Precio Mayorista</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black tracking-tighter text-zinc-900">
                                        {formatPrice(activeQuality.basePrice)}
                                    </span>
                                    <span className="text-zinc-500 font-bold text-sm">/ unidad</span>
                                </div>
                            </div>
                        </div>

                        {/* Descripción sin recortes y con wrap asegurado */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Descripción del Producto</h4>
                            <p className="text-[15px] text-zinc-500 leading-relaxed font-medium break-words">
                                {product.description}
                            </p>
                        </div>
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
                            {product.qualities?.map((quality: any, idx: number) => {
                                const isActive = idx === selectedQualityIdx;
                                return (
                                    <button
                                        key={quality.qualityName || idx}
                                        onClick={() => setSelectedQualityIdx(idx)}
                                        className={`px-4 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${isActive
                                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                                            : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 border border-transparent'
                                            }`}
                                    >
                                        {quality.qualityName}
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
                                    {activeSizes.map((size: string) => (
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
                                {activeQuality.colors?.map((color: any) => (
                                    <tr key={color.colorName} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="py-4 px-6 flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full border border-zinc-200/80 shadow-inner"
                                                style={{ backgroundColor: getHexForColor(color.colorName) }}
                                            />
                                            <span className="text-sm font-semibold text-zinc-700">
                                                {color.colorName}
                                            </span>
                                        </td>

                                        {activeSizes.map((size: string) => {
                                            const sizeData = color.sizes?.find((s: any) => s.size === size);
                                            const maxStock = sizeData?.availableStock || 0;
                                            const inputDisabled = maxStock === 0;

                                            return (
                                                <td key={size} className="py-4 px-3 align-middle text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxStock}
                                                        disabled={inputDisabled}
                                                        title={inputDisabled ? "Sin stock" : `Máx: ${maxStock}`}
                                                        value={getQuantity(color.colorName, size)}
                                                        onChange={(e) => handleQuantityChange(color.colorName, size, e.target.value)}
                                                        placeholder={inputDisabled ? "-" : "0"}
                                                        className={`w-14 h-11 text-center bg-zinc-50 border border-transparent 
                                                            ${inputDisabled ? 'opacity-50 cursor-not-allowed text-zinc-400 bg-zinc-100' : 'hover:bg-zinc-100 focus:bg-white focus:border-zinc-300 text-zinc-900'} 
                                                            rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-zinc-300 placeholder:font-normal`}
                                                    />
                                                </td>
                                            );
                                        })}

                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-bold text-zinc-400">
                                                {getRowTotal(color.colorName)}
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