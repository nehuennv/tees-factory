import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Factory, Truck } from "lucide-react";
import { toast } from "sonner";

export function CheckoutPage() {
    const navigate = useNavigate();
    const { items, totalUnits, totalPrice, clearCart } = useCartStore();

    const [deliveryMethod, setDeliveryMethod] = useState("fabrica");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleConfirmOrder = () => {
        if (items.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);
            clearCart();
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">¡Pedido Confirmado!</h1>
                <p className="text-zinc-500 text-lg">
                    Hemos recibido tu pedido correctamente. Nos pondremos en contacto a la brevedad para coordinar los detalles.
                </p>
                <Button
                    className="w-full h-12 mt-6 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
                    onClick={() => navigate("/portal/catalogo")}
                >
                    Volver al Catálogo
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Confirmar Pedido</h1>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-zinc-500 text-lg mb-4">No hay productos en el carrito.</p>
                    <Button onClick={() => navigate("/portal/catalogo")}>Ir al Catálogo</Button>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Column - Details */}
                    <div className="w-full lg:w-[60%] space-y-6">

                        {/* Delivery Method Card */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-zinc-900 mb-6">Método de Entrega</h2>

                            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="grid sm:grid-cols-2 gap-4">
                                {/* Option 1 */}
                                <div>
                                    <RadioGroupItem value="fabrica" id="fabrica" className="peer sr-only" />
                                    <label
                                        htmlFor="fabrica"
                                        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 cursor-pointer peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-zinc-900 transition-all font-normal"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900">
                                            <Factory className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-zinc-900">Retiro por Fábrica</div>
                                            <div className="text-sm text-zinc-500 mt-1">Acordá el retiro en nuestras instalaciones.</div>
                                        </div>
                                    </label>
                                </div>

                                {/* Option 2 */}
                                <div>
                                    <RadioGroupItem value="transporte" id="transporte" className="peer sr-only" />
                                    <label
                                        htmlFor="transporte"
                                        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 cursor-pointer peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-zinc-900 transition-all font-normal"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-zinc-900">Envío por Expreso</div>
                                            <div className="text-sm text-zinc-500 mt-1">Despachamos por tu transporte de confianza.</div>
                                        </div>
                                    </label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Observations Card */}
                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Observaciones</h2>
                            <p className="text-sm text-zinc-500 mb-4">Dejanos cualquier nota adicional para el equipo de logística o armado.</p>
                            <Textarea
                                placeholder="Ej: Despachar por Expreso Bisonte, aclarar CUIT..."
                                className="min-h-[120px] resize-none rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-400 text-base"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                    </div>

                    {/* Right Column - Summary (Sticky) */}
                    <div className="w-full lg:w-[40%] lg:sticky lg:top-8">
                        <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 shadow-sm overflow-hidden flex flex-col">
                            <h2 className="text-xl font-semibold text-zinc-900 mb-6">Resumen del Pedido</h2>

                            {/* Items List */}
                            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start text-sm">
                                        <div className="flex-1 pr-4">
                                            <p className="font-medium text-zinc-900 line-clamp-1">{item.productName}</p>
                                            <p className="text-zinc-500 mt-0.5">
                                                {item.quantity} un. x ${item.unitPrice.toLocaleString('es-AR')}
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                {item.color} | {item.size} | {item.quality}
                                            </p>
                                        </div>
                                        <div className="font-medium text-zinc-900 whitespace-nowrap">
                                            ${item.subtotal.toLocaleString('es-AR')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <hr className="border-t border-dashed border-zinc-300 mb-6" />

                            {/* Totals */}
                            <div className="space-y-3 mb-8">
                                <div className="flex justify-between items-center text-zinc-600">
                                    <span>Total Prendas</span>
                                    <span className="font-semibold text-zinc-900">{totalUnits} un.</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-lg font-medium text-zinc-900">Total a Pagar</span>
                                    <span className="text-2xl font-black text-zinc-900 tracking-tight">
                                        ${totalPrice.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <Button
                                className="w-full h-14 bg-zinc-900 text-white rounded-xl text-lg font-medium hover:bg-zinc-800 transition-all shadow-md mt-auto relative overflow-hidden"
                                onClick={handleConfirmOrder}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Procesando...</span>
                                    </div>
                                ) : (
                                    "Confirmar Pedido"
                                )}
                            </Button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
