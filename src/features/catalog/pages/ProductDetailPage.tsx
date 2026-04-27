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

                    {/* Header & Quality Selector */}
                    <div className="shrink-0 p-5 border-b border-zinc-100 bg-white space-y-4">
                        {/* Top row: title + quality selector */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                                    Matriz de Pedido
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Elegí la calidad y completá las cantidades por talle.
                                </p>
                            </div>

                            {/* Quality selector: CALIDAD: [1] [2] [3] */}
                            {product.qualities?.length > 1 && (
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                                        Calidad
                                    </span>
                                    <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/70">
                                        {product.qualities.map((quality: any, idx: number) => {
                                            const isActive = idx === selectedQualityIdx;
                                            return (
                                                <button
                                                    key={quality.qualityName || idx}
                                                    onClick={() => setSelectedQualityIdx(idx)}
                                                    title={quality.qualityName}
                                                    className={`w-9 h-9 rounded-lg text-sm font-black transition-all duration-200 ${isActive
                                                        ? 'bg-zinc-900 text-white shadow-sm scale-105'
                                                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200'
                                                    }`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active quality info pill */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-900 shrink-0" />
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    {product.qualities?.length > 1 ? `Calidad ${selectedQualityIdx + 1}` : 'Calidad'}
                                </span>
                                <span className="text-xs font-black text-zinc-900">
                                    {activeQuality?.qualityName}
                                </span>
                                <span className="text-zinc-300">·</span>
                                <span className="text-xs font-black text-zinc-900">
                                    {formatPrice(activeQuality?.basePrice)}
                                    <span className="font-normal text-zinc-400"> / ud.</span>
                                </span>
                            </div>
                            {product.qualities?.length > 1 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {product.qualities.map((q: any, idx: number) => idx !== selectedQualityIdx && (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedQualityIdx(idx)}
                                            className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100"
                                        >
                                            Cal. {idx + 1}: {formatPrice(q.basePrice)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* The Matrix Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="text-left border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
                            <thead>
                                <tr className="border-b-2 border-zinc-100 bg-white sticky top-0 z-10">
                                    <th className="py-3 px-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]" style={{ minWidth: 160 }}>
                                        Color
                                    </th>
                                    {activeSizes.map((size: string) => (
                                        <th key={size} className="py-3 px-2 text-center" style={{ minWidth: 72 }}>
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 text-xs font-black text-zinc-600 border border-zinc-200/80 uppercase">
                                                {size}
                                            </span>
                                        </th>
                                    ))}
                                    <th className="py-3 px-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] text-right" style={{ minWidth: 80 }}>
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {activeQuality.colors?.map((color: any) => {
                                    const rowTotal = getRowTotal(color.colorName);
                                    return (
                                        <tr key={color.colorName} className={`transition-colors ${rowTotal > 0 ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}>
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                                                        style={{
                                                            backgroundColor: getHexForColor(color.colorName),
                                                            border: getHexForColor(color.colorName) === '#ffffff' ? '2px solid #d4d4d8' : '1.5px solid rgba(0,0,0,0.08)'
                                                        }}
                                                    />
                                                    <span className="text-sm font-bold text-zinc-800 whitespace-nowrap">
                                                        {color.colorName}
                                                    </span>
                                                </div>
                                            </td>

                                            {activeSizes.map((size: string) => {
                                                const sizeData = color.sizes?.find((s: any) => s.size?.toString().trim().toUpperCase() === size);
                                                const maxStock = sizeData?.availableStock || 0;
                                                const itemId = `${product.id}-${activeQuality.qualityName}-${color.colorName}-${size}`;
                                                const inCartQty = cartItemsInStore.find(item => item.id === itemId)?.quantity || 0;
                                                const effectiveMax = Math.max(0, maxStock - inCartQty);
                                                const noStock = maxStock === 0;
                                                const allInCart = effectiveMax === 0 && inCartQty > 0;
                                                const inputDisabled = noStock || allInCart;
                                                const currentQty = Number(getQuantity(color.colorName, size)) || 0;
                                                const isHighlighted = currentQty > 0;

                                                return (
                                                    <td key={size} className="py-3.5 px-2 align-middle text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={effectiveMax}
                                                                disabled={inputDisabled}
                                                                title={
                                                                    noStock ? "Sin stock disponible"
                                                                    : allInCart ? `${inCartQty} en tu bolsa — sin stock adicional`
                                                                    : `Disponible: ${effectiveMax}${inCartQty > 0 ? ` (${inCartQty} ya en bolsa)` : ''}`
                                                                }
                                                                value={getQuantity(color.colorName, size)}
                                                                onChange={(e) => handleQuantityChange(color.colorName, size, e.target.value)}
                                                                placeholder={inputDisabled ? "–" : "0"}
                                                                className={`w-12 h-10 text-center border transition-all outline-none mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                                                    ${inputDisabled
                                                                        ? 'opacity-30 cursor-not-allowed text-zinc-400 bg-zinc-100 border-transparent rounded-lg'
                                                                        : isHighlighted
                                                                            ? 'bg-zinc-900 text-white border-zinc-900 rounded-lg font-black text-sm shadow-sm'
                                                                            : 'bg-zinc-50 border-zinc-200/60 hover:border-zinc-300 hover:bg-zinc-100 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-zinc-900 rounded-lg text-sm font-bold'
                                                                    }`}
                                                            />
                                                            {allInCart ? (
                                                                <span className="text-[9px] font-bold text-emerald-500 leading-none">✓ {inCartQty} bolsa</span>
                                                            ) : inCartQty > 0 && !noStock ? (
                                                                <span className="text-[9px] font-semibold text-zinc-400 leading-none">{inCartQty}✓ / {effectiveMax} disp.</span>
                                                            ) : !noStock ? (
                                                                <span className={`text-[9px] font-semibold tabular-nums leading-none ${effectiveMax <= 5 ? 'text-amber-500' : 'text-zinc-300'}`}>
                                                                    {effectiveMax <= 5 ? `¡${effectiveMax} disp.!` : `${effectiveMax}`}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            <td className="py-3.5 px-5 text-right">
                                                {rowTotal > 0 ? (
                                                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-black tabular-nums">
                                                        {rowTotal}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-200 text-sm font-bold">–</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                        <div className={`shrink-0 border-t px-4 lg:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:min-h-[76px] transition-colors duration-300 ${totalUnits > 0 ? 'border-zinc-900/10 bg-zinc-50' : 'border-zinc-100 bg-white'}`}>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${totalUnits > 0 ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-100 border-zinc-200'} border`}>
                                        <TableProperties className={`w-4 h-4 ${totalUnits > 0 ? 'text-white' : 'text-zinc-500'}`} />
                                    </div>
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Prendas</span>
                                        <span className={`text-lg font-black tabular-nums leading-none ${totalUnits > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>
                                            {totalUnits > 0 ? `${totalUnits} un.` : '0 un.'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-zinc-200" />
                                <div className="flex flex-col leading-tight">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Subtotal</span>
                                    <span className={`text-lg font-black tracking-tight tabular-nums leading-none ${totalUnits > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                                {totalUnits > 0 && (
                                    <>
                                        <div className="w-px h-8 bg-zinc-200" />
                                        <div className="flex flex-col leading-tight">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Precio unit.</span>
                                            <span className="text-sm font-bold text-zinc-500 tabular-nums leading-none">
                                                {formatPrice(activeQuality.basePrice)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <Button
                                onClick={handleAddToCart}
                                disabled={totalUnits === 0}
                                className={`w-full sm:w-auto rounded-xl px-8 h-12 font-black shadow-sm flex items-center justify-center gap-2 transition-all text-sm ${
                                    totalUnits > 0
                                        ? 'bg-zinc-900 hover:bg-zinc-700 text-white scale-[1.02] shadow-md'
                                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-60'
                                }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                {totalUnits > 0 ? `Añadir ${totalUnits} prenda${totalUnits !== 1 ? 's' : ''} al Pedido` : 'Añadir al Pedido'}
                            </Button>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}