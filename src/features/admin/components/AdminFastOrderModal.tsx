import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X, Search, Plus, ChevronDown, ChevronRight,
    ShoppingBag, Package, Loader2, Factory, Truck,
    User, ArrowRight, Trash2, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { formatPrice } from '@/lib/formatters';
import type { Product, ProductDetail } from '@/types/product';

// ── Client type (matches GET /clients response) ─────────────────
interface Client {
    id: string;
    name: string;
    cuit: string;
    email: string;
    phone: string;
    address: string;
    balance: number;
    isActive: boolean;
}

// ── Color mapping (same as ProductDetailPage) ────────────────────
const COLOR_POOL = [
    { name: 'Negro',  hex: '#18181b' },
    { name: 'Blanco', hex: '#ffffff' },
    { name: 'Gris',   hex: '#9ca3af' },
    { name: 'Azul',   hex: '#1e3a8a' },
    { name: 'Rojo',   hex: '#dc2626' },
    { name: 'Verde',  hex: '#4d7c0f' },
    { name: 'Beige',  hex: '#d4c5a9' },
    { name: 'Bordo',  hex: '#881337' },
];

const getHexForColor = (name: string) =>
    COLOR_POOL.find(c => name.toLowerCase().includes(c.name.toLowerCase()))?.hex ?? '#cccccc';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

// ── Local cart item ──────────────────────────────────────────────
interface LocalCartItem {
    variantId: string;
    productId: string;
    productName: string;
    quality: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
}

interface AdminFastOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Normalize product detail (handles flat `variants` array from some backends)
function normalizeDetail(data: any): ProductDetail {
    if (data && !data.qualities && data.variants) {
        const qualityMap: Record<string, any> = {};
        data.variants.forEach((v: any) => {
            const qName = v.quality || v.qualityName || 'Estándar';
            if (!qualityMap[qName]) {
                qualityMap[qName] = {
                    id: v.qualityId || qName,
                    qualityName: qName,
                    basePrice: v.price || v.unitPrice || data.basePrice || 0,
                    colors: {},
                };
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
        return {
            ...data,
            qualities: Object.values(qualityMap).map((q: any) => ({
                ...q,
                colors: Object.values(q.colors),
            })),
        };
    }
    return data;
}

export function AdminFastOrderModal({ isOpen, onClose }: AdminFastOrderModalProps) {
    const [step, setStep] = useState<1 | 2>(1);

    // ── Client search ────────────────────────────────────────────
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientSearchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Product browser ──────────────────────────────────────────
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [detailCache, setDetailCache] = useState<Record<string, ProductDetail>>({});
    const [detailLoading, setDetailLoading] = useState(false);
    const [qualityIdxMap, setQualityIdxMap] = useState<Record<string, number>>({});
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // ── Cart ─────────────────────────────────────────────────────
    const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);

    // ── Step 2 ───────────────────────────────────────────────────
    const [deliveryMethod, setDeliveryMethod] = useState<'fabrica' | 'transporte'>('fabrica');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Fetch clients and products on open ───────────────────────
    useEffect(() => {
        if (!isOpen) return;

        setClientsLoading(true);
        apiClient.get('/clients')
            .then(res => setAllClients(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error('Error al cargar clientes'))
            .finally(() => setClientsLoading(false));

        setProductsLoading(true);
        apiClient.get('/products')
            .then(res => {
                const mapped = (Array.isArray(res.data) ? res.data : []).map((p: any) => ({
                    ...p,
                    image: p.image || p.image_url || p.imageUrl || undefined,
                }));
                setAllProducts(mapped);
            })
            .catch(() => toast.error('Error al cargar productos'))
            .finally(() => setProductsLoading(false));
    }, [isOpen]);

    // Close client dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)
            ) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Client filtering ─────────────────────────────────────────
    const filteredClients = useMemo(() => {
        if (!clientSearch.trim()) return allClients.slice(0, 8);
        const q = clientSearch.toLowerCase();
        return allClients
            .filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.cuit?.includes(q) ||
                c.email?.toLowerCase().includes(q)
            )
            .slice(0, 8);
    }, [allClients, clientSearch]);

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setClientSearch('');
        setShowClientDropdown(false);
    };

    // ── Product filtering ────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return allProducts;
        const q = productSearch.toLowerCase();
        return allProducts.filter(p =>
            p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
        );
    }, [allProducts, productSearch]);

    // ── Product detail ───────────────────────────────────────────
    const handleExpandProduct = async (productId: string) => {
        if (expandedId === productId) { setExpandedId(null); return; }
        setExpandedId(productId);
        if (detailCache[productId]) return;
        setDetailLoading(true);
        try {
            const res = await apiClient.get(`/products/${productId}`);
            const normalized = normalizeDetail({
                ...res.data,
                image: res.data.image || res.data.image_url || res.data.imageUrl || undefined,
            });
            setDetailCache(prev => ({ ...prev, [productId]: normalized }));
        } catch {
            toast.error('Error al cargar variantes del producto');
            setExpandedId(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const getQualityIdx = (productId: string) => qualityIdxMap[productId] ?? 0;
    const setQualityIdx = (productId: string, idx: number) =>
        setQualityIdxMap(prev => ({ ...prev, [productId]: idx }));

    // Key: productId::qualityIdx::colorName::size (UUIDs and color/size names never contain '::')
    const qKey = (pid: string, qi: number, color: string, size: string) =>
        `${pid}::${qi}::${color}::${size}`;

    const getQty = (pid: string, qi: number, color: string, size: string) =>
        quantities[qKey(pid, qi, color, size)] ?? 0;

    const handleQtyChange = (pid: string, qi: number, color: string, size: string, val: string) => {
        const qty = Math.max(0, parseInt(val, 10) || 0);
        setQuantities(prev => ({ ...prev, [qKey(pid, qi, color, size)]: qty }));
    };

    const getActiveSizes = (detail: ProductDetail, qi: number) => {
        const quality = detail.qualities[qi];
        if (!quality) return [];
        const s = new Set<string>();
        quality.colors.forEach(c => c.sizes.forEach(v => s.add(v.size.toString().trim().toUpperCase())));
        return Array.from(s);
    };

    const getRowTotal = (pid: string, qi: number, color: string, sizes: string[]) =>
        sizes.reduce((sum, size) => sum + getQty(pid, qi, color, size), 0);

    // ── Add product to local cart ────────────────────────────────
    const handleAddProductToCart = (productId: string) => {
        const detail = detailCache[productId];
        if (!detail) return;
        const qi = getQualityIdx(productId);
        const quality = detail.qualities[qi];
        if (!quality) return;

        const sizes = getActiveSizes(detail, qi);
        const newItems: LocalCartItem[] = [];
        let hasErrors = false;

        quality.colors.forEach(color => {
            sizes.forEach(size => {
                const qty = getQty(productId, qi, color.colorName, size);
                if (qty <= 0) return;
                const variant = color.sizes.find(s => s.size.toString().trim().toUpperCase() === size);
                if (!variant) { hasErrors = true; return; }
                if (qty > variant.availableStock) {
                    toast.error(`Stock insuficiente: ${color.colorName} · Talle ${size} (máx. ${variant.availableStock})`);
                    hasErrors = true;
                    return;
                }
                newItems.push({
                    variantId: variant.id,
                    productId: detail.id,
                    productName: detail.name,
                    quality: quality.qualityName,
                    color: color.colorName,
                    size,
                    quantity: qty,
                    unitPrice: quality.basePrice,
                });
            });
        });

        if (hasErrors) return;
        if (newItems.length === 0) { toast.error('Ingresá al menos una cantidad antes de agregar'); return; }

        setCartItems(prev => {
            const updated = [...prev];
            newItems.forEach(item => {
                const idx = updated.findIndex(i => i.variantId === item.variantId);
                if (idx >= 0) {
                    updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
                } else {
                    updated.push(item);
                }
            });
            return updated;
        });

        // Clear quantities for this product+quality
        setQuantities(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => { if (k.startsWith(`${productId}::${qi}::`)) delete next[k]; });
            return next;
        });

        toast.success(`${newItems.length} variante${newItems.length > 1 ? 's' : ''} agregada${newItems.length > 1 ? 's' : ''} al pedido`);
        setExpandedId(null);
    };

    const removeCartItem = (variantId: string) =>
        setCartItems(prev => prev.filter(i => i.variantId !== variantId));

    // ── Totals ───────────────────────────────────────────────────
    const totalUnits = cartItems.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = cartItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    // ── Submit ───────────────────────────────────────────────────
    const handleConfirm = async () => {
        if (!selectedClient) { toast.error('Seleccioná un cliente'); return; }
        if (cartItems.length === 0) { toast.error('Agregá al menos un producto'); return; }

        setIsSubmitting(true);
        try {
            await apiClient.post('/orders', {
                clientId: selectedClient.id,
                items: cartItems.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
                discountPercentage: 0,
                observations: `Pedido Exprés. Entrega: ${
                    deliveryMethod === 'fabrica' ? 'Retiro por Fábrica' : 'Envío por Expreso'
                }${notes.trim() ? '. ' + notes.trim() : ''}`,
            });

            toast.success(`Pedido creado para ${selectedClient.name}`, {
                description: 'El stock fue descontado automáticamente.',
            });

            handleClose();
            window.location.reload();
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error('Stock insuficiente', {
                    description: error.response?.data?.error || 'Algún artículo ya no tiene stock disponible.',
                });
            } else {
                toast.error(error.response?.data?.error || 'Error al crear el pedido');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Reset on close ───────────────────────────────────────────
    const handleClose = () => {
        if (isSubmitting) return;
        setStep(1);
        setSelectedClient(null);
        setClientSearch('');
        setShowClientDropdown(false);
        setProductSearch('');
        setExpandedId(null);
        setQuantities({});
        setCartItems([]);
        setDeliveryMethod('fabrica');
        setNotes('');
        onClose();
    };

    if (!isOpen) return null;

    // ── Pending qty badge per product ────────────────────────────
    const pendingForProduct = (productId: string) =>
        Object.entries(quantities)
            .filter(([k, v]) => k.startsWith(`${productId}::`) && v > 0)
            .reduce((s, [, v]) => s + v, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Nuevo Pedido Exprés</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            {step === 1 ? 'Seleccioná el cliente y los productos' : 'Revisá y confirmá el pedido'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-zinc-900' : 'bg-zinc-300'}`} />
                            <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-zinc-900' : 'bg-zinc-300'}`} />
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-600" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">
                    {step === 1 ? (
                        <div className="flex flex-col">

                            {/* ── Client selector ── */}
                            <div className="px-6 pt-5 pb-4 border-b border-zinc-100">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                                    Cliente *
                                </label>

                                {selectedClient ? (
                                    /* Selected client card */
                                    <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                                        <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                            {selectedClient.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-900 truncate">{selectedClient.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-xs text-zinc-400">CUIT: {selectedClient.cuit}</span>
                                                {selectedClient.phone && (
                                                    <span className="text-xs text-zinc-400">· {selectedClient.phone}</span>
                                                )}
                                                {selectedClient.balance > 0 && (
                                                    <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-md">
                                                        Debe {formatCurrency(selectedClient.balance)}
                                                    </span>
                                                )}
                                                {selectedClient.balance <= 0 && (
                                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                                                        Al día
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedClient(null)}
                                            className="shrink-0 text-xs text-zinc-400 hover:text-zinc-700 underline transition-colors"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    /* Client search input + dropdown */
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <Input
                                                ref={clientSearchRef}
                                                placeholder="Buscar por nombre, CUIT o email..."
                                                value={clientSearch}
                                                onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                                                onFocus={() => setShowClientDropdown(true)}
                                                className="pl-9 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                                            />
                                            {clientsLoading && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
                                            )}
                                        </div>

                                        {showClientDropdown && filteredClients.length > 0 && (
                                            <div
                                                ref={dropdownRef}
                                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-56 overflow-y-auto"
                                            >
                                                {filteredClients.map(client => (
                                                    <button
                                                        key={client.id}
                                                        onClick={() => handleSelectClient(client)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {client.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-900 truncate">{client.name}</p>
                                                            <p className="text-xs text-zinc-400 truncate">
                                                                CUIT: {client.cuit}
                                                                {client.email ? ` · ${client.email}` : ''}
                                                            </p>
                                                        </div>
                                                        {client.balance > 0 && (
                                                            <span className="text-[10px] font-bold text-red-500 shrink-0">
                                                                {formatCurrency(client.balance)}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {showClientDropdown && !clientsLoading && filteredClients.length === 0 && clientSearch.trim() && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 px-4 py-3 text-sm text-zinc-400">
                                                No se encontraron clientes
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Product search ── */}
                            <div className="px-6 pt-4 pb-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input
                                        placeholder="Buscar producto por nombre o categoría..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        className="pl-9 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                                    />
                                </div>
                            </div>

                            {/* ── Product list ── */}
                            <div className="flex flex-col divide-y divide-zinc-100">
                                {productsLoading ? (
                                    <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Cargando productos...</span>
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                                        <Package className="w-8 h-8 text-zinc-300" />
                                        <p className="text-sm">No se encontraron productos</p>
                                    </div>
                                ) : (
                                    filteredProducts.map(product => {
                                        const isExpanded = expandedId === product.id;
                                        const detail = detailCache[product.id];
                                        const qi = getQualityIdx(product.id);
                                        const activeQuality = detail?.qualities?.[qi];
                                        const activeSizes = detail ? getActiveSizes(detail, qi) : [];
                                        const pending = pendingForProduct(product.id);

                                        return (
                                            <div key={product.id} className="flex flex-col">
                                                {/* Product row */}
                                                <button
                                                    onClick={() => handleExpandProduct(product.id)}
                                                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-zinc-50 transition-colors text-left w-full group"
                                                >
                                                    <div className="shrink-0 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                                        {isExpanded
                                                            ? <ChevronDown className="w-4 h-4 text-zinc-600" />
                                                            : <ChevronRight className="w-4 h-4" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-900 truncate">{product.name}</p>
                                                        <p className="text-xs text-zinc-400">{product.category}</p>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-2">
                                                        {pending > 0 && (
                                                            <span className="text-xs font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                                                                {pending} un.
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-bold text-zinc-600">
                                                            {formatPrice(product.basePrice)}
                                                        </span>
                                                    </div>
                                                </button>

                                                {/* Expanded: quality tabs + matrix */}
                                                <AnimatePresence initial={false}>
                                                    {isExpanded && (
                                                        <motion.div
                                                            key="expanded"
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden bg-zinc-50/60 border-t border-zinc-100"
                                                        >
                                                            {(!detail || (detailLoading && !detailCache[product.id])) ? (
                                                                <div className="flex items-center justify-center py-8 text-zinc-400 gap-2">
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    <span className="text-sm">Cargando variantes...</span>
                                                                </div>
                                                            ) : !activeQuality ? (
                                                                <p className="px-6 py-4 text-sm text-zinc-400">Sin variantes configuradas.</p>
                                                            ) : (
                                                                <div className="px-6 py-4 flex flex-col gap-3">
                                                                    {/* Quality tabs */}
                                                                    {detail.qualities.length > 1 && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {detail.qualities.map((q, idx) => (
                                                                                <button
                                                                                    key={q.qualityName}
                                                                                    onClick={() => setQualityIdx(product.id, idx)}
                                                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                                                                        qi === idx
                                                                                            ? 'bg-zinc-900 text-white shadow-sm'
                                                                                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                                                                    }`}
                                                                                >
                                                                                    {q.qualityName} · {formatPrice(q.basePrice)}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Size matrix */}
                                                                    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                                                                        <table className="w-full text-left border-collapse min-w-[420px]">
                                                                            <thead>
                                                                                <tr className="border-b border-zinc-100 bg-zinc-50">
                                                                                    <th className="py-2.5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-[150px]">
                                                                                        Color
                                                                                    </th>
                                                                                    {activeSizes.map(size => (
                                                                                        <th key={size} className="py-2.5 px-2 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center w-16">
                                                                                            {size}
                                                                                        </th>
                                                                                    ))}
                                                                                    <th className="py-2.5 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">
                                                                                        Total
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-zinc-100">
                                                                                {activeQuality.colors.map(color => (
                                                                                    <tr key={color.colorName} className="hover:bg-zinc-50/50 transition-colors">
                                                                                        <td className="py-2.5 px-4">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div
                                                                                                    className="w-3.5 h-3.5 rounded-full border border-zinc-300 shrink-0"
                                                                                                    style={{ backgroundColor: getHexForColor(color.colorName) }}
                                                                                                />
                                                                                                <span className="text-xs font-semibold text-zinc-700 truncate">
                                                                                                    {color.colorName}
                                                                                                </span>
                                                                                            </div>
                                                                                        </td>
                                                                                        {activeSizes.map(size => {
                                                                                            const variant = color.sizes.find(
                                                                                                s => s.size.toString().trim().toUpperCase() === size
                                                                                            );
                                                                                            const maxStock = variant?.availableStock ?? 0;
                                                                                            const disabled = maxStock === 0;
                                                                                            return (
                                                                                                <td key={size} className="py-2.5 px-2 text-center">
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min="0"
                                                                                                        max={maxStock}
                                                                                                        disabled={disabled}
                                                                                                        title={disabled ? 'Sin stock' : `Disponible: ${maxStock}`}
                                                                                                        value={getQty(product.id, qi, color.colorName, size) || ''}
                                                                                                        onChange={e => handleQtyChange(product.id, qi, color.colorName, size, e.target.value)}
                                                                                                        placeholder={disabled ? '–' : '0'}
                                                                                                        className={`w-12 h-9 text-center rounded-lg text-sm font-bold border transition-all outline-none
                                                                                                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                                                                                            ${disabled
                                                                                                                ? 'bg-zinc-100 border-transparent text-zinc-300 cursor-not-allowed'
                                                                                                                : 'bg-zinc-50 border-zinc-200 text-zinc-900 hover:border-zinc-300 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10'
                                                                                                            }`}
                                                                                                    />
                                                                                                </td>
                                                                                            );
                                                                                        })}
                                                                                        <td className="py-2.5 px-4 text-right text-xs font-bold text-zinc-500">
                                                                                            {getRowTotal(product.id, qi, color.colorName, activeSizes)}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>

                                                                    <div className="flex justify-end">
                                                                        <Button
                                                                            onClick={() => handleAddProductToCart(product.id)}
                                                                            className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-9 px-5 text-sm font-semibold flex items-center gap-2"
                                                                        >
                                                                            <Plus className="w-3.5 h-3.5" />
                                                                            Agregar al pedido
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Sticky cart summary */}
                            {cartItems.length > 0 && (
                                <div className="sticky bottom-0 mx-6 mb-4 mt-3 bg-zinc-900 text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <ShoppingBag className="w-4 h-4 text-zinc-300" />
                                        <span className="text-sm font-semibold">
                                            {totalUnits} prenda{totalUnits !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-zinc-500">·</span>
                                        <span className="text-sm font-black">{formatPrice(totalPrice)}</span>
                                    </div>
                                    <span className="text-xs text-zinc-400">
                                        {cartItems.length} variante{cartItems.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── Step 2: Review & Confirm ── */
                        <div className="px-6 py-5 flex flex-col gap-5">
                            {/* Client banner */}
                            <div className="flex items-center gap-3 bg-zinc-900 text-white rounded-2xl px-4 py-3.5">
                                <div className="w-9 h-9 rounded-full bg-white/15 border border-white/10 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-white/80" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pedido para</p>
                                    <p className="text-sm font-bold text-white leading-tight truncate">{selectedClient?.name}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                        CUIT: {selectedClient?.cuit}
                                        {selectedClient?.phone ? ` · ${selectedClient.phone}` : ''}
                                    </p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            </div>

                            {/* Items grouped by product */}
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5" /> Productos ({totalUnits} unidades)
                                </p>
                                <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100">
                                    {Object.values(
                                        cartItems.reduce((acc: Record<string, { productName: string; variants: LocalCartItem[] }>, item) => {
                                            if (!acc[item.productId]) acc[item.productId] = { productName: item.productName, variants: [] };
                                            acc[item.productId].variants.push(item);
                                            return acc;
                                        }, {})
                                    ).map(group => (
                                        <div key={group.productName} className="px-4 py-3 bg-white">
                                            <p className="font-bold text-zinc-900 text-sm mb-2">{group.productName}</p>
                                            <div className="space-y-1.5">
                                                {group.variants.map(v => (
                                                    <div key={v.variantId} className="flex items-center justify-between text-xs gap-2">
                                                        <div className="flex items-center gap-2 text-zinc-500 flex-1 min-w-0 flex-wrap">
                                                            <span className="bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-md shrink-0">
                                                                {v.quality}
                                                            </span>
                                                            <span className="shrink-0 font-medium text-zinc-600">{v.color} · Talle {v.size}</span>
                                                            <span className="text-zinc-400 shrink-0">
                                                                {v.quantity} un. × {formatPrice(v.unitPrice)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="font-bold text-zinc-900">{formatPrice(v.quantity * v.unitPrice)}</span>
                                                            <button
                                                                onClick={() => removeCartItem(v.variantId)}
                                                                className="w-5 h-5 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors group"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-3 h-3 text-zinc-300 group-hover:text-red-400 transition-colors" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery method */}
                            <div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Método de entrega</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['fabrica', 'transporte'] as const).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setDeliveryMethod(method)}
                                            className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                                deliveryMethod === method
                                                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                                                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                                deliveryMethod === method ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                                            }`}>
                                                {method === 'fabrica' ? <Factory className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                            </div>
                                            <p className="text-sm font-bold text-zinc-900">
                                                {method === 'fabrica' ? 'Retiro por Fábrica' : 'Envío por Expreso'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                                    Observaciones
                                </label>
                                <Textarea
                                    placeholder="Ej. Llamar antes de despachar, aclarar CUIT en el rótulo..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 resize-none min-h-[80px]"
                                />
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between bg-zinc-900 text-white rounded-2xl px-5 py-4">
                                <span className="text-sm font-bold text-zinc-300">Total Estimado</span>
                                <span className="text-2xl font-black tracking-tight">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-zinc-100 bg-white shrink-0 flex items-center justify-between gap-3">
                    {step === 1 ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="rounded-xl border-zinc-200 text-zinc-600 font-semibold"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => setStep(2)}
                                disabled={cartItems.length === 0 || !selectedClient}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold flex items-center gap-2"
                            >
                                Revisar pedido <ArrowRight className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                disabled={isSubmitting}
                                className="rounded-xl border-zinc-200 text-zinc-600 font-semibold"
                            >
                                ← Volver
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creando pedido...
                                    </>
                                ) : (
                                    'Confirmar Pedido'
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
