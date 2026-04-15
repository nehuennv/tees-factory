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
    User
} from "lucide-react";
import { toast } from "sonner";

export function CheckoutPage() {
    const navigate = useNavigate();
    const { items, totalUnits, totalPrice, clearCart } = useCartStore();
    const { isActive: isDraft, clientName: draftClientName, clientId: draftClientId, clearDraft } = useOrderDraftStore();

    const [deliveryMethod, setDeliveryMethod] = useState("fabrica");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirmOrder = async () => {
        if (items.length === 0) {
            toast.error("El carrito está vacío");
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
            observations: `Entrega: ${deliveryMethod}. ${notes}`
        };

        try {
            const res = await apiClient.post('/orders', payload);
            
            const orderId = res.data.id || "CONFIRMADO";
            
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
            if (error.response?.status === 400 || error.response?.status === 409) {
                toast.error("Inventario insuficiente", {
                    description: error.response?.data?.error || "Alguien acaba de comprar el stock de un artículo que seleccionaste. Revisa tu pedido.",
                    duration: 5000,
                    action: {
                        label: "Volver a Editar",
                        onClick: () => navigate("/portal/catalogo"),
                    },
                });
            } else {
                toast.error("Error al procesar el pedido. Intenta nuevamente.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
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
                            <h2 className="text-xl font-bold text-zinc-900 mb-6">Método de Entrega</h2>

                            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="grid sm:grid-cols-2 gap-4">
                                {/* Option 1 */}
                                <div>
                                    <RadioGroupItem value="fabrica" id="fabrica" className="peer sr-only" />
                                    <label
                                        htmlFor="fabrica"
                                        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 cursor-pointer peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-zinc-900 transition-all font-normal"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200 shadow-sm">
                                            <Factory className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900">Retiro por Fábrica</div>
                                            <div className="text-sm text-zinc-500 mt-1 leading-snug">Acordá el retiro en nuestras instalaciones.</div>
                                        </div>
                                    </label>
                                </div>

                                {/* Option 2 */}
                                <div>
                                    <RadioGroupItem value="transporte" id="transporte" className="peer sr-only" />
                                    <label
                                        htmlFor="transporte"
                                        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 cursor-pointer peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-zinc-900 transition-all font-normal"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200 shadow-sm">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900">Envío por Expreso</div>
                                            <div className="text-sm text-zinc-500 mt-1 leading-snug">Despachamos por tu transporte de confianza.</div>
                                        </div>
                                    </label>
                                </div>
                            </RadioGroup>
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
                                    if (!acc[item.productId]) {
                                        acc[item.productId] = {
                                            productName: item.productName,
                                            variants: []
                                        };
                                    }
                                    acc[item.productId].variants.push(item);
                                    return acc;
                                }, {} as Record<string, any>)).map((product: any) => (
                                    <div key={product.productName} className="flex flex-col gap-2 bg-white/50 rounded-2xl p-3 border border-zinc-200/50">
                                        <p className="font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-1.5 leading-tight">
                                            {product.productName}
                                        </p>
                                        <div className="space-y-1.5">
                                            {product.variants.map((variant: any) => (
                                                <div key={variant.id} className="flex justify-between items-start text-[11px]">
                                                    <div className="flex-1 pr-4">
                                                        <span className="text-zinc-600 font-medium">
                                                            {variant.quantity} un. x ${variant.unitPrice.toLocaleString('es-AR')}
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
                                className="w-full h-14 bg-zinc-900 text-white rounded-xl text-lg font-bold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg mt-auto relative overflow-hidden"
                                onClick={handleConfirmOrder}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Procesando...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Confirmar Pedido</span>
                                        <ArrowRight className="w-5 h-5 opacity-70" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
}