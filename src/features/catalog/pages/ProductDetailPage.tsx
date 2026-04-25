import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, TableProperties, ChevronDown, CheckCircle2, ArrowRight, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatters';
import { useCartStore, type CartItem } from '@/store/cartStore';
import { useOrderDraftStore } from '@/store/orderDraftStore';
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
    const { addItems, items: cartItemsInStore } = useCartStore();
    const draftIsActive = useOrderDraftStore((s) => s.isActive);
    const draftClientId = useOrderDraftStore((s) => s.clientId);

    const [selectedQualityIdx, setSelectedQualityIdx] = useState(0);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [justAdded, setJustAdded] = useState(false);
    const [addedUnits, setAddedUnits] = useState(0);
    const [descExpanded, setDescExpanded] = useState(false);

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
                setProduct({
                    ...data,
                    image: data.image || data.image_url || data.imageUrl || undefined,
                });
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
            c.sizes?.forEach((s: any) => set.add(s.size?.toString().trim().toUpperCase()));
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

        let hasErrors = false;

        Object.entries(quantities).forEach(([key, qty]) => {
            if (qty > 0) {
                const [qIdxStr, colorName, size] = key.split('-');
                const qIdx = parseInt(qIdxStr, 10);
                const quality = product.qualities[qIdx];
                const colorData = quality.colors.find((c: any) => c.colorName === colorName);
                const sizeData = colorData?.sizes?.find((s: any) => s.size?.toString().trim().toUpperCase() === size);

                if (!sizeData) {
                    toast.error(`Variante ${colorName}-${size} no encontrada`);
                    hasErrors = true;
                    return;
                }

                const itemId = `${product.id}-${quality.qualityName}-${colorName}-${size}`;
                
                // Buscar si ya tenemos unidades de esta variante en el carrito
                const existingItemInCart = cartItemsInStore.find(item => item.id === itemId);
                const existingQty = existingItemInCart ? existingItemInCart.quantity : 0;
                
                const totalRequestedQty = existingQty + qty;

                // Validamos sumando lo que ya tenemos en el carrito + lo que queremos agregar
                if (totalRequestedQty > sizeData.availableStock) {
                    if (existingQty > 0) {
                        toast.error(`Stock superado en ${colorName} - Talle ${size}. Ya tienes ${existingQty} en la bolsa. Solo puedes agregar ${sizeData.availableStock - existingQty} más.`);
                    } else {
                        toast.error(`No hay suficiente stock de ${colorName} - Talle ${size}. Máx disponible: ${sizeData.availableStock}`);
                    }
                    hasErrors = true;
                    return;
                }

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

        if (hasErrors) {
            // Si hubo errores (superó stock), abortamos todo para que el usuario corrija
            return;
        }

        if (cartItems.length > 0) {
            addItems(cartItems);
            const units = cartItems.reduce((sum, i) => sum + i.quantity, 0);
            setAddedUnits(units);
            setJustAdded(true);
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

                        {/* Descripción con colapso si es muy larga */}
                        {product.description && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Descripción del Producto</h4>
                                <div className="relative">
                                    <p className={`text-[15px] text-zinc-500 leading-relaxed font-medium break-words transition-all ${descExpanded ? '' : 'line-clamp-4'}`}>
                                        {product.description}
                                    </p>
                                    {!descExpanded && product.description.length > 200 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                                    )}
                                </div>
                                {product.description.length > 200 && (
                                    <button
                                        onClick={() => setDescExpanded(v => !v)}
                                        className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
                                    >
                                        {descExpanded ? <><ChevronUp className="w-3 h-3" /> Ver menos</> : <><ChevronDown className="w-3 h-3" /> Ver más</>}
                                    </button>
                                )}
                            </div>
                        )}
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

                    {/* The Matrix Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="text-left border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/30 sticky top-0 z-10 backdrop-blur-sm">
                                    <th className="py-4 px-5 text-xs font-bold text-zinc-400 uppercase tracking-widest" style={{ minWidth: 140 }}>
                                        Color / Talle
                                    </th>
                                    {activeSizes.map((size: string) => (
                                        <th key={size} className="py-4 px-2 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center" style={{ minWidth: 64 }}>
                                            {size}
                                        </th>
                                    ))}
                                    <th className="py-4 px-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right" style={{ minWidth: 72 }}>
                                        Uds.
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {activeQuality.colors?.map((color: any) => (
                                    <tr key={color.colorName} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-3.5 h-3.5 rounded-full border border-zinc-200/80 shadow-inner shrink-0"
                                                    style={{ backgroundColor: getHexForColor(color.colorName) }}
                                                />
                                                <span className="text-sm font-semibold text-zinc-700 whitespace-nowrap">
                                                    {color.colorName}
                                                </span>
                                            </div>
                                        </td>

                                        {activeSizes.map((size: string) => {
                                            const sizeData = color.sizes?.find((s: any) => s.size?.toString().trim().toUpperCase() === size);
                                            const maxStock = sizeData?.availableStock || 0;
                                            const inputDisabled = maxStock === 0;

                                            return (
                                                <td key={size} className="py-3 px-2 align-middle text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxStock}
                                                        disabled={inputDisabled}
                                                        title={inputDisabled ? "Sin stock" : `Máx: ${maxStock}`}
                                                        value={getQuantity(color.colorName, size)}
                                                        onChange={(e) => handleQuantityChange(color.colorName, size, e.target.value)}
                                                        placeholder={inputDisabled ? "–" : "0"}
                                                        className={`w-12 h-10 text-center bg-zinc-50 border border-transparent
                                                            ${inputDisabled ? 'opacity-40 cursor-not-allowed text-zinc-400 bg-zinc-100' : 'hover:bg-zinc-100 focus:bg-white focus:border-zinc-300 text-zinc-900'}
                                                            rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-zinc-300 placeholder:font-normal`}
                                                    />
                                                </td>
                                            );
                                        })}

                                        <td className="py-3 px-5 text-right">
                                            <span className="text-sm font-bold text-zinc-400 tabular-nums">
                                                {getRowTotal(color.colorName) || '–'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {justAdded ? (
                        <div className="shrink-0 border-t border-emerald-100 bg-emerald-50 px-4 lg:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:min-h-[72px]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                        ¿Qué querés hacer ahora?
                                    </span>
                                    <span className="text-sm font-bold text-emerald-900">{addedUnits} unidades agregadas al pedido</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (draftIsActive && draftClientId) {
                                            navigate(`/ventas/pedido/${draftClientId}`);
                                        } else {
                                            navigate('/portal/catalogo');
                                        }
                                    }}
                                    className="flex-1 sm:flex-none rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-100 h-11 font-semibold gap-2"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Seguir agregando
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (draftIsActive) {
                                            navigate('/ventas/checkout');
                                        } else {
                                            navigate('/portal/checkout');
                                        }
                                    }}
                                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-bold gap-2"
                                >
                                    Ver pedido
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="shrink-0 border-t border-zinc-200/80 bg-white px-4 lg:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:min-h-[72px]">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                                        <TableProperties className="w-4 h-4 text-zinc-600" />
                                    </div>
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Prendas Totales</span>
                                        <span className="text-sm font-bold text-zinc-900">{totalUnits} un.</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-zinc-200" />
                                <div className="flex flex-col leading-tight">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Subtotal Estimado</span>
                                    <span className="text-base font-black text-zinc-900 tracking-tight">{formatPrice(totalPrice)}</span>
                                </div>
                            </div>
                            <Button
                                onClick={handleAddToCart}
                                disabled={totalUnits === 0}
                                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl px-8 h-11 font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Añadir al Pedido
                            </Button>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}