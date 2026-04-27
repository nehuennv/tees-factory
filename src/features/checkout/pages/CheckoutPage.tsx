import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useOrderDraftStore } from "@/store/orderDraftStore";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
    Factory,
    Truck,
    ShoppingCart,
    ArrowRight,
    User,
    Eye,
    X,
    MapPin,
    FileText,
    Package,
    CheckCircle2,
    Bike,
    Globe,
} from "lucide-react";
import { toast } from "sonner";

export function CheckoutPage() {
    const navigate = useNavigate();
    const { items, totalUnits, totalPrice, clearCart } = useCartStore();
    const { isActive: isDraft, clientName: draftClientName, clientId: draftClientId, clearDraft } = useOrderDraftStore();

    const [deliveryMethod, setDeliveryMethod] = useState("fabrica");
    const [expressType, setExpressType] = useState<'moto' | 'correo' | ''>('');
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const deliveryLabel = deliveryMethod === 'fabrica'
        ? 'Retiro por Fábrica'
        : expressType === 'moto'
            ? 'Envío por Expreso · Moto Mensajería'
            : expressType === 'correo'
                ? 'Envío por Expreso · Correo (Andreani / CA)'
                : 'Envío por Expreso';

    const handleConfirmOrder = async () => {
        if (items.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }
        if (deliveryMethod === 'transporte' && !expressType) {
            toast.error("Seleccioná el tipo de envío", {
                description: "Elegí entre Moto Mensajería o Correo para continuar."
            });
            return;
        }

        // Validate variants
        const missingVariants = items.filter(i => !i.variantId);
        if (missingVariants.length > 0) {
            toast.error("Algunos productos no tienen una variante válida.", {
                description: "Por favor vuelve al catálogo y agrégalos nuevamente."
            });
            return;
        }

        setIsLoading(true);

        const payload = {
            clientId: isDraft && draftClientId ? draftClientId : undefined,
            items: items.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            })),
            discountPercentage: 0,
            observations: `Entrega: ${deliveryLabel}. ${notes}`
        };

        try {
            const res = await apiClient.post('/orders', payload);
            
            const orderId = res.data.orderNumber || res.data.id || "CONFIRMADO";
            
            if (isDraft) {
                clearDraft();
            } else {
                clearCart();
            }

            // Redirect to success page
            const successBase = isDraft ? "/ventas/checkout/exitoso" : "/portal/checkout/exitoso";
            navigate(successBase, { 
                state: { 
                    orderId, 
                    total: totalPrice, 
                    clientName: isDraft ? draftClientName : null,
                    isDraft 
                } 
            });
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 409) {
                const catalogPath = isDraft && draftClientId
                    ? `/ventas/pedido/${draftClientId}`
                    : "/portal/catalogo";
                toast.error("Stock insuficiente", {
                    description: error.response?.data?.error || "Alguien acaba de comprar el stock de un artículo que seleccionaste. Volvés al catálogo para revisar tu pedido.",
                    duration: 5000,
                });
                navigate(catalogPath);
            } else if (error.response?.status === 400) {
                toast.error("Pedido inválido", {
                    description: error.response?.data?.error || error.response?.data?.message || "Revisá los datos del pedido e intentá nuevamente.",
                });
            } else {
                toast.error("Error al procesar el pedido. Intenta nuevamente.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 animate-in fade-in duration-500">

            {/* Banner de contexto: pedido para un cliente (seller flow) */}
            {isDraft && draftClientName && (
                <div className="flex items-center gap-3 bg-zinc-900 text-white rounded-2xl px-5 py-3.5 mb-6 shadow-lg animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="w-9 h-9 rounded-full bg-white/15 border border-white/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-white/80" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Confirmando pedido para</span>
                        <span className="text-sm font-bold text-white leading-tight">{draftClientName}</span>
                    </div>
                </div>
            )}


            {/* PANTALLA DE CARRITO VACÍO (Empty State Premium) */}
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white border border-zinc-200 rounded-3xl shadow-sm text-center px-4">
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                        <ShoppingCart className="w-10 h-10 text-zinc-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Tu carrito está vacío</h2>
                    <p className="text-zinc-500 max-w-md mx-auto mb-8">
                        Aún no has agregado productos. Explora nuestro catálogo mayorista y arma tu pedido.
                    </p>
                    <Button
                        onClick={() => navigate("/portal/catalogo")}
                        className="h-12 px-8 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-semibold transition-colors"
                    >
                        Ir al Catálogo <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left Column - Details */}
                    <div className="w-full lg:w-[60%] space-y-6">

                        {/* Delivery Method Card */}
                        <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-zinc-900">Método de Entrega</h2>
                                <p className="text-sm text-zinc-400 mt-1">¿Cómo querés recibir tu pedido?</p>
                            </div>

                            <RadioGroup
                                value={deliveryMethod}
                                onValueChange={(v) => { setDeliveryMethod(v); setExpressType(''); }}
                                className="grid sm:grid-cols-2 gap-3"
                            >
                                {/* Retiro por Fábrica */}
                                <div>
                                    <RadioGroupItem value="fabrica" id="fabrica" className="peer sr-only" />
                                    <label
                                        htmlFor="fabrica"
                                        className="flex items-center gap-4 rounded-2xl border-2 border-zinc-200 bg-white p-4 hover:bg-zinc-50 cursor-pointer peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:bg-zinc-50 transition-all font-normal"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 border border-zinc-200 shrink-0">
                                            <Factory className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm">Retiro por Fábrica</div>
                                            <div className="text-xs text-zinc-500 mt-0.5 leading-snug">Acordá el retiro en nuestras instalaciones</div>
                                        </div>
                                    </label>
                                </div>

                                {/* Envío por Expreso */}
                                <div>
                                    <RadioGroupItem value="transporte" id="transporte" className="peer sr-only" />
                                    <label
                                        htmlFor="transporte"
                                        className="flex items-center gap-4 rounded-2xl border-2 border-zinc-200 bg-white p-4 hover:bg-zinc-50 cursor-pointer peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:bg-zinc-50 transition-all font-normal"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 border border-zinc-200 shrink-0">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm">Envío por Expreso</div>
                                            <div className="text-xs text-zinc-500 mt-0.5 leading-snug">Despachamos por tu transporte de confianza</div>
                                        </div>
                                    </label>
                                </div>
                            </RadioGroup>

                            {/* Sub-opciones de expreso */}
                            {deliveryMethod === 'transporte' && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center gap-2 mb-3 pl-1">
                                        <div className="w-px h-4 bg-zinc-300 ml-1" />
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">¿Cómo enviamos?</span>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3 pl-0">
                                        {/* Moto Mensajería */}
                                        <button
                                            type="button"
                                            onClick={() => setExpressType('moto')}
                                            className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                                                expressType === 'moto'
                                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-900'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                                expressType === 'moto'
                                                    ? 'bg-white/15 border-white/20'
                                                    : 'bg-white border-zinc-200'
                                            }`}>
                                                <Bike className={`w-4.5 h-4.5 ${expressType === 'moto' ? 'text-white' : 'text-zinc-600'}`} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm leading-tight">Moto Mensajería</div>
                                                <div className={`text-xs mt-0.5 leading-snug ${expressType === 'moto' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                    CABA y GBA
                                                </div>
                                            </div>
                                            {expressType === 'moto' && (
                                                <CheckCircle2 className="w-4 h-4 text-white ml-auto shrink-0" />
                                            )}
                                        </button>

                                        {/* Correo */}
                                        <button
                                            type="button"
                                            onClick={() => setExpressType('correo')}
                                            className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                                                expressType === 'correo'
                                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-900'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                                expressType === 'correo'
                                                    ? 'bg-white/15 border-white/20'
                                                    : 'bg-white border-zinc-200'
                                            }`}>
                                                <Globe className={`w-4.5 h-4.5 ${expressType === 'correo' ? 'text-white' : 'text-zinc-600'}`} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm leading-tight">Correo</div>
                                                <div className={`text-xs mt-0.5 leading-snug ${expressType === 'correo' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                    Andreani / Correo Argentino · Interior
                                                </div>
                                            </div>
                                            {expressType === 'correo' && (
                                                <CheckCircle2 className="w-4 h-4 text-white ml-auto shrink-0" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Observations Card */}
                        <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-zinc-900 mb-2">Observaciones</h2>
                            <p className="text-sm text-zinc-500 mb-6">Dejanos cualquier nota adicional para el equipo de logística o armado.</p>
                            <Textarea
                                placeholder="Ej: Despachar por Expreso Bisonte, aclarar CUIT en el rótulo..."
                                className="min-h-[120px] resize-none rounded-xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 text-base"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right Column - Summary (Sticky) */}
                    <div className="w-full lg:w-[40%] lg:sticky lg:top-8">
                        <div className="bg-zinc-50 rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm flex flex-col">
                            <h2 className="text-xl font-bold text-zinc-900 mb-6">Resumen del Pedido</h2>

                            {/* Items List Agrupado */}
                            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.values(items.reduce((acc: Record<string, any>, item) => {
                                    if (!acc[item.productId]) acc[item.productId] = { productName: item.productName, qualities: {} };
                                    const prod = acc[item.productId];
                                    if (!prod.qualities[item.quality]) prod.qualities[item.quality] = { qualityName: item.quality, unitPrice: item.unitPrice, variants: [] };
                                    prod.qualities[item.quality].variants.push(item);
                                    return acc;
                                }, {} as Record<string, any>)).map((product: any) => (
                                    <div key={product.productName} className="flex flex-col gap-2 bg-white/50 rounded-2xl p-3 border border-zinc-200/50">
                                        <p className="font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-1.5 leading-tight">
                                            {product.productName}
                                        </p>
                                        <div className="space-y-3">
                                            {Object.values(product.qualities).map((q: any) => (
                                                <div key={q.qualityName}>
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <div className="h-px flex-1 bg-zinc-200" />
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                                                            {q.qualityName} · ${q.unitPrice.toLocaleString('es-AR')}/ud.
                                                        </span>
                                                        <div className="h-px flex-1 bg-zinc-200" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {q.variants.map((variant: any) => (
                                                            <div key={variant.id} className="flex justify-between items-start text-[11px]">
                                                                <div className="flex-1 pr-4">
                                                                    <span className="text-zinc-600 font-medium">
                                                                        {variant.quantity} un.
                                                                    </span>
                                                                    <span className="text-zinc-400 mx-1">•</span>
                                                                    <span className="text-zinc-500">
                                                                        {variant.color} | {variant.size}
                                                                    </span>
                                                                </div>
                                                                <div className="font-bold text-zinc-900 whitespace-nowrap">
                                                                    ${variant.subtotal.toLocaleString('es-AR')}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-zinc-200/80 w-full mb-6" />

                            {/* Totals */}
                            <div className="space-y-3 mb-8">
                                <div className="flex justify-between items-center text-zinc-600">
                                    <span className="font-medium">Total Prendas</span>
                                    <span className="font-bold text-zinc-900">{totalUnits} un.</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 mt-3 border-t border-zinc-200/80">
                                    <span className="text-lg font-bold text-zinc-900">Total a Pagar</span>
                                    <span className="text-3xl font-black text-zinc-900 tracking-tight">
                                        ${totalPrice.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <Button
                                className="w-full h-14 bg-zinc-900 text-white rounded-xl text-lg font-bold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg mt-auto relative overflow-hidden disabled:opacity-50"
                                onClick={() => {
                                    if (deliveryMethod === 'transporte' && !expressType) {
                                        toast.error("Seleccioná el tipo de envío", {
                                            description: "Elegí entre Moto Mensajería o Correo para continuar."
                                        });
                                        return;
                                    }
                                    setIsPreviewOpen(true);
                                }}
                                disabled={isLoading}
                            >
                                <div className="flex items-center gap-2">
                                    <Eye className="w-5 h-5 opacity-70" />
                                    <span>Previsualizar Pedido</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>

    {/* ── MODAL PREVISUALIZACIÓN DE PEDIDO ── */}
    {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !isLoading && setIsPreviewOpen(false)}
            />

            {/* Panel */}
            <div className="relative z-10 w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Revisión del Pedido</h2>
                        <p className="text-sm text-zinc-400 mt-0.5">Confirmá los detalles antes de enviar</p>
                    </div>
                    <button
                        onClick={() => !isLoading && setIsPreviewOpen(false)}
                        className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-600" />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Cliente (solo flujo vendedor) */}
                    {isDraft && draftClientName && (
                        <div className="flex items-center gap-3 bg-zinc-900 text-white rounded-2xl px-4 py-3.5">
                            <div className="w-8 h-8 rounded-full bg-white/15 border border-white/10 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-white/80" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pedido para</p>
                                <p className="text-sm font-bold text-white leading-tight">{draftClientName}</p>
                            </div>
                        </div>
                    )}

                    {/* Items agrupados por producto → calidad */}
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Package className="w-3.5 h-3.5" /> Productos ({totalUnits} unidades)
                        </p>
                        <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100">
                            {Object.values(items.reduce((acc: Record<string, any>, item) => {
                                if (!acc[item.productId]) acc[item.productId] = { productName: item.productName, qualities: {} };
                                const prod = acc[item.productId];
                                if (!prod.qualities[item.quality]) prod.qualities[item.quality] = { qualityName: item.quality, unitPrice: item.unitPrice, variants: [] };
                                prod.qualities[item.quality].variants.push(item);
                                return acc;
                            }, {})).map((product: any) => (
                                <div key={product.productName} className="px-4 py-3 bg-white">
                                    <p className="font-bold text-zinc-900 text-sm mb-2">{product.productName}</p>
                                    <div className="space-y-3">
                                        {Object.values(product.qualities).map((q: any) => (
                                            <div key={q.qualityName}>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <div className="h-px flex-1 bg-zinc-100" />
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                                                        {q.qualityName} · ${q.unitPrice.toLocaleString('es-AR')}/ud.
                                                    </span>
                                                    <div className="h-px flex-1 bg-zinc-100" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    {q.variants.map((v: any) => (
                                                        <div key={v.id} className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2 text-zinc-500">
                                                                <span className="bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-md">
                                                                    {v.color} · {v.size}
                                                                </span>
                                                                <span className="text-zinc-400">{v.quantity} un.</span>
                                                            </div>
                                                            <span className="font-bold text-zinc-900">${v.subtotal.toLocaleString('es-AR')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Entrega y observaciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                                {deliveryMethod === 'fabrica'
                                    ? <Factory className="w-4 h-4 text-zinc-600" />
                                    : expressType === 'moto'
                                        ? <Bike className="w-4 h-4 text-zinc-600" />
                                        : expressType === 'correo'
                                            ? <Globe className="w-4 h-4 text-zinc-600" />
                                            : <Truck className="w-4 h-4 text-zinc-600" />
                                }
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Entrega</p>
                                <p className="text-sm font-semibold text-zinc-900 mt-0.5">{deliveryLabel}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                                <FileText className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Observaciones</p>
                                <p className="text-sm text-zinc-700 mt-0.5 break-words leading-snug">
                                    {notes.trim() || <span className="italic text-zinc-400">Sin observaciones</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between bg-zinc-900 text-white rounded-2xl px-5 py-4">
                        <span className="text-sm font-bold text-zinc-300">Total a Pagar</span>
                        <span className="text-2xl font-black tracking-tight">
                            ${totalPrice.toLocaleString('es-AR')}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-100 bg-white shrink-0 flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsPreviewOpen(false)}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50"
                    >
                        Volver a Editar
                    </Button>
                    <Button
                        onClick={handleConfirmOrder}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-sm"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Enviando pedido...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirmar y Enviar</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )}
        </>
    );
}