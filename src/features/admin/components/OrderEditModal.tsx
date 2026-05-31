import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { patchOrder, putOrderItems, calcPricing } from '@/lib/ordersApi';
import type { Order, OrderExtra, DispatchType, PaymentStatus } from '@/types/order';
import { LOCKED_STATUSES, DISPATCH_LABELS } from '@/types/order';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const TAX_PRESETS = [
    { label: '21%', value: 21 },
    { label: '10.5%', value: 10.5 },
    { label: 'Sin IVA', value: 0 },
];

type Tab = 'items' | 'pricing' | 'meta';

interface OrderEditModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSaved: (updated: Partial<Order> & { id: string }) => void;
}

export function OrderEditModal({ order, isOpen, onClose, onSaved }: OrderEditModalProps) {
    const [tab, setTab] = useState<Tab>('meta');

    const isLocked = LOCKED_STATUSES.includes(order.status);
    const isPricingLocked = isLocked;

    // ── Metadata tab state ────────────────────────────────────────
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
        order.paymentStatus || order.payment_status || 'PENDING'
    );
    const [dispatchType, setDispatchType] = useState<DispatchType | ''>(
        (order.dispatchType || order.dispatch_type || '') as DispatchType | ''
    );
    const [deliveryDeadline, setDeliveryDeadline] = useState(
        order.deliveryDeadline || order.delivery_deadline || ''
    );
    const [shippingAddress, setShippingAddress] = useState(
        order.shippingAddress || order.shipping_address || ''
    );
    const [observations, setObservations] = useState(order.observations || '');
    const [isSavingMeta, setIsSavingMeta] = useState(false);

    // ── Pricing tab state ─────────────────────────────────────────
    const [extras, setExtras] = useState<OrderExtra[]>(order.extras || []);
    const [taxRate, setTaxRate] = useState(order.taxRate ?? order.tax_rate ?? 0);
    const [taxRateCustom, setTaxRateCustom] = useState(false);
    const [discountPercentage, setDiscountPercentage] = useState(
        order.discountPercentage ?? order.discount_percentage ?? 0
    );
    const [isSavingPricing, setIsSavingPricing] = useState(false);

    const subtotal = useMemo(() => {
        const items = order.items || order.order_items || order.orderItems || [];
        return items.reduce((s: number, i: any) => {
            const qty = i.quantity || i.qty || 0;
            const price = i.unit_price || i.unitPrice || i.price || 0;
            return s + qty * price;
        }, 0) || order.subtotal || 0;
    }, [order]);

    const pricingPreview = useMemo(
        () => calcPricing(subtotal, extras, discountPercentage, taxRate),
        [subtotal, extras, discountPercentage, taxRate]
    );

    // ── Items tab state ───────────────────────────────────────────
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [isFetchingItems, setIsFetchingItems] = useState(false);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [isSavingItems, setIsSavingItems] = useState(false);
    const [itemsChanged, setItemsChanged] = useState(false);

    // Reset state when order changes
    useEffect(() => {
        if (!isOpen) return;
        setPaymentStatus(order.paymentStatus || order.payment_status || 'PENDING');
        setDispatchType((order.dispatchType || order.dispatch_type || '') as DispatchType | '');
        setDeliveryDeadline(order.deliveryDeadline || order.delivery_deadline || '');
        setShippingAddress(order.shippingAddress || order.shipping_address || '');
        setObservations(order.observations || '');
        setExtras(order.extras || []);
        setTaxRate(order.taxRate ?? order.tax_rate ?? 0);
        setDiscountPercentage(order.discountPercentage ?? order.discount_percentage ?? 0);
        setItemsChanged(false);
        setTab('meta');
    }, [isOpen, order.id]);

    // Fetch full order items when items tab opens
    useEffect(() => {
        if (tab !== 'items' || isLocked) return;
        const existing = order.items || order.order_items || order.orderItems || [];
        if (existing.length > 0 && !itemsChanged) {
            setOrderItems(existing);
            return;
        }
        if (orderItems.length > 0) return;
        setIsFetchingItems(true);
        apiClient.get(`/orders/${order.id}`)
            .then(res => {
                const items = res.data.items || res.data.order_items || res.data.orderItems || [];
                setOrderItems(items);
            })
            .catch(() => toast.error('Error al cargar items'))
            .finally(() => setIsFetchingItems(false));
    }, [tab, order.id]);

    // Fetch products for items tab (reserved for future add-item UI)
    useEffect(() => {
        if (tab !== 'items' || isLocked || allProducts.length > 0) return;
        apiClient.get('/products')
            .then(res => setAllProducts(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, [tab]);

    if (!isOpen) return null;

    // ── Handlers ──────────────────────────────────────────────────
    const handleSaveMeta = async () => {
        setIsSavingMeta(true);
        try {
            const updated = await patchOrder(order.id, {
                paymentStatus,
                dispatchType: dispatchType || null,
                deliveryDeadline: deliveryDeadline || null,
                shippingAddress: shippingAddress || null,
                observations,
            });
            toast.success('Metadatos actualizados');
            onSaved({ ...updated, id: order.id });
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Error al guardar');
        } finally {
            setIsSavingMeta(false);
        }
    };

    const handleSavePricing = async () => {
        setIsSavingPricing(true);
        try {
            const updated = await patchOrder(order.id, {
                extras,
                taxRate,
                discountPercentage,
            });
            toast.success('Cotización actualizada');
            onSaved({ ...updated, id: order.id });
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Error al guardar cotización';
            toast.error(msg);
        } finally {
            setIsSavingPricing(false);
        }
    };

    const handleSaveItems = async () => {
        if (!itemsChanged) { toast.info('Sin cambios en items'); return; }
        const payload = orderItems
            .filter(i => (i.quantity || i.qty || 0) > 0)
            .map(i => ({ variantId: i.variantId || i.variant_id || i.id, quantity: i.quantity || i.qty }));
        if (payload.length === 0) { toast.error('Agregá al menos un item'); return; }

        setIsSavingItems(true);
        try {
            const res = await putOrderItems(order.id, { items: payload });
            toast.success(`Items actualizados. Delta: ${formatCurrency(res.delta)}`);
            onSaved({ id: order.id, totalAmount: res.totalAmount, total_amount: res.totalAmount });
            setItemsChanged(false);
        } catch (err: any) {
            if (err?.response?.status === 409) {
                toast.error('Stock insuficiente', { description: err.response.data?.error });
            } else {
                toast.error(err?.response?.data?.error || 'Error al guardar items');
            }
        } finally {
            setIsSavingItems(false);
        }
    };

    const addExtra = () => setExtras(prev => [...prev, { label: '', amount: 0 }]);
    const removeExtra = (i: number) => setExtras(prev => prev.filter((_, idx) => idx !== i));
    const updateExtra = (i: number, field: keyof OrderExtra, val: string | number) =>
        setExtras(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

    const updateItemQty = (idx: number, qty: number) => {
        setOrderItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
        setItemsChanged(true);
    };

    const removeItem = (idx: number) => {
        setOrderItems(prev => prev.filter((_, i) => i !== idx));
        setItemsChanged(true);
    };

    const TABS: { id: Tab; label: string }[] = [
        { id: 'meta', label: 'Metadatos' },
        { id: 'pricing', label: 'Cotización' },
        { id: 'items', label: 'Items' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-zinc-900">
                            Editar pedido #{order.orderNumber || order.id?.slice(0, 8)}
                        </h2>
                        {isLocked && (
                            <p className="text-xs text-amber-600 mt-0.5 font-medium">
                                Solo metadatos editables en este estado
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-100 px-6 shrink-0">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                                tab === t.id
                                    ? 'border-zinc-900 text-zinc-900'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* ── Metadata tab ── */}
                    {tab === 'meta' && (
                        <div className="p-6 flex flex-col gap-4">
                            {/* Payment status */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado de Pago</label>
                                <div className="flex gap-2">
                                    {(['PENDING', 'PARTIAL', 'PAID'] as PaymentStatus[]).map(ps => (
                                        <button
                                            key={ps}
                                            onClick={() => setPaymentStatus(ps)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                paymentStatus === ps
                                                    ? ps === 'PAID' ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : ps === 'PARTIAL' ? 'bg-amber-500 text-white border-amber-500'
                                                        : 'bg-rose-500 text-white border-rose-500'
                                                    : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                                            }`}
                                        >
                                            {ps === 'PAID' ? 'Pagado' : ps === 'PARTIAL' ? 'Parcial' : 'Pendiente'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dispatch type */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de Despacho</label>
                                <select
                                    value={dispatchType}
                                    onChange={e => setDispatchType(e.target.value as DispatchType | '')}
                                    className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                                >
                                    <option value="">Sin asignar</option>
                                    {(Object.keys(DISPATCH_LABELS) as DispatchType[]).map(dt => (
                                        <option key={dt} value={dt}>{DISPATCH_LABELS[dt]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Delivery deadline */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fecha Límite de Entrega</label>
                                <input
                                    type="date"
                                    value={deliveryDeadline}
                                    onChange={e => setDeliveryDeadline(e.target.value)}
                                    className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                                />
                            </div>

                            {/* Shipping address */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dirección de Envío</label>
                                <input
                                    type="text"
                                    value={shippingAddress}
                                    onChange={e => setShippingAddress(e.target.value)}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                                />
                            </div>

                            {/* Observations */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Observaciones</label>
                                <textarea
                                    value={observations}
                                    onChange={e => setObservations(e.target.value)}
                                    rows={3}
                                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                                    placeholder="Notas internas sobre el pedido..."
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Pricing tab ── */}
                    {tab === 'pricing' && (
                        <div className="p-6 flex flex-col gap-5">
                            {isPricingLocked && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
                                    Extras, impuesto y descuento no editables en estado {order.status}.
                                </div>
                            )}

                            {/* Extras */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Extras</label>
                                    {!isPricingLocked && (
                                        <button
                                            onClick={addExtra}
                                            className="flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Agregar
                                        </button>
                                    )}
                                </div>
                                {extras.length === 0 ? (
                                    <p className="text-sm text-zinc-400 italic">Sin extras</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {extras.map((extra, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={extra.label}
                                                    onChange={e => updateExtra(i, 'label', e.target.value)}
                                                    placeholder="Descripción"
                                                    disabled={isPricingLocked}
                                                    className="flex-1 h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50"
                                                />
                                                <input
                                                    type="number"
                                                    value={extra.amount || ''}
                                                    onChange={e => updateExtra(i, 'amount', parseFloat(e.target.value) || 0)}
                                                    placeholder="Monto"
                                                    disabled={isPricingLocked}
                                                    className="w-28 h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                {!isPricingLocked && (
                                                    <button
                                                        onClick={() => removeExtra(i)}
                                                        className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-rose-500" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tax rate */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">IVA</label>
                                <div className="flex gap-2 flex-wrap">
                                    {TAX_PRESETS.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => { setTaxRate(p.value); setTaxRateCustom(false); }}
                                            disabled={isPricingLocked}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${
                                                !taxRateCustom && taxRate === p.value
                                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setTaxRateCustom(true)}
                                        disabled={isPricingLocked}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${
                                            taxRateCustom
                                                ? 'bg-zinc-900 text-white border-zinc-900'
                                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                        }`}
                                    >
                                        Manual
                                    </button>
                                </div>
                                {taxRateCustom && (
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                        disabled={isPricingLocked}
                                        placeholder="Ej: 15.5"
                                        className="h-9 w-32 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                )}
                            </div>

                            {/* Discount */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descuento (%)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={discountPercentage || ''}
                                    onChange={e => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                                    disabled={isPricingLocked}
                                    placeholder="0"
                                    className="h-9 w-32 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>

                            {/* Preview */}
                            <div className="bg-zinc-900 rounded-xl px-5 py-4 flex flex-col gap-2 text-white text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Subtotal artículos</span>
                                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                                </div>
                                {extras.length === 0 ? (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Extras</span>
                                        <span className="font-semibold">{formatCurrency(0)}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 border-l-2 border-zinc-700 pl-3 ml-0.5">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Extras</span>
                                        {extras.map((extra, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span className="text-zinc-400 truncate pr-2">{extra.label?.trim() || 'Extra'}</span>
                                                <span className="font-semibold whitespace-nowrap">+{formatCurrency(extra.amount || 0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Descuento ({discountPercentage}%)</span>
                                    <span className="font-semibold text-rose-400">-{formatCurrency(pricingPreview.discountAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">IVA ({taxRate}%)</span>
                                    <span className="font-semibold">{formatCurrency(pricingPreview.taxAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-zinc-700 pt-2 mt-1">
                                    <span className="font-bold">Total</span>
                                    <span className="font-black text-lg">{formatCurrency(pricingPreview.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Items tab ── */}
                    {tab === 'items' && (
                        <div className="p-6 flex flex-col gap-4">
                            {isLocked ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
                                    Items no editables en estado {order.status}.
                                </div>
                            ) : isFetchingItems ? (
                                <div className="flex items-center justify-center py-12 gap-2 text-zinc-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">Cargando items...</span>
                                </div>
                            ) : orderItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                    <Package className="w-8 h-8 text-zinc-300" />
                                    <p className="text-sm text-zinc-500">Sin items cargados</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                        Items actuales — editar cantidad o eliminar
                                    </p>
                                    {orderItems.map((item: any, idx: number) => {
                                        const name = item.variant?.product?.name || item.product_name || item.productName || 'Producto';
                                        const color = item.variant?.color_name || item.color_name || item.color || '-';
                                        const size = item.variant?.size_name || item.size_name || item.size || '-';
                                        const qty = item.quantity || item.qty || 0;
                                        const price = item.unit_price || item.unitPrice || 0;

                                        return (
                                            <div key={item.id || idx} className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-zinc-900 truncate">{name}</p>
                                                    <p className="text-xs text-zinc-400">{color} · Talle {size} · {formatCurrency(price)}/u</p>
                                                </div>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={qty || ''}
                                                    onChange={e => updateItemQty(idx, parseInt(e.target.value) || 0)}
                                                    className="w-16 h-8 text-center rounded-lg border border-zinc-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-rose-500" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {itemsChanged && (
                                        <p className="text-xs text-amber-600 font-medium">
                                            Cambios pendientes — guardá para aplicar y ajustar el ledger del cliente.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-100 shrink-0 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl border-zinc-200 text-zinc-600 font-semibold"
                    >
                        Cerrar
                    </Button>
                    {tab === 'meta' && (
                        <Button
                            onClick={handleSaveMeta}
                            disabled={isSavingMeta}
                            className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold gap-2"
                        >
                            {isSavingMeta && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                            Guardar metadatos
                        </Button>
                    )}
                    {tab === 'pricing' && !isPricingLocked && (
                        <Button
                            onClick={handleSavePricing}
                            disabled={isSavingPricing}
                            className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold gap-2"
                        >
                            {isSavingPricing && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                            Guardar cotización
                        </Button>
                    )}
                    {tab === 'items' && !isLocked && (
                        <Button
                            onClick={handleSaveItems}
                            disabled={isSavingItems || !itemsChanged}
                            className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold gap-2"
                        >
                            {isSavingItems && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                            Guardar items
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
