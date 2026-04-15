import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BankDetailsCard } from "@/components/shared/BankDetailsCard";
import { 
    CheckCircle2, 
    ArrowRight, 
    Package, 
    CreditCard, 
    UploadCloud, 
    Home,
    FileText,
    ShoppingBag
} from "lucide-react";

export function CheckoutSuccessPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId, total, clientName, isDraft } = location.state || { 
        orderId: "CONFIRMADO", 
        total: 0, 
        clientName: null, 
        isDraft: false 
    };

    return (
        <div className="flex-1 w-full bg-[#fafafa] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-700">
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-stretch">
                
                {/* Left Column: Success Message & Quick Actions */}
                <div className="flex-1 flex flex-col justify-center gap-8">
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in-50 duration-500">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        
                        <div className="space-y-3">
                            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
                                ¡Pedido registrado <br/> con éxito!
                            </h1>
                            <div className="text-zinc-500 text-lg md:text-xl font-medium max-w-md">
                                {isDraft && clientName ? (
                                    <p>Se ha generado el pedido <span className="text-zinc-900 font-bold">#{orderId}</span> para <span className="text-zinc-900 font-bold">{clientName}</span>.</p>
                                ) : (
                                    <p>Tu orden <span className="text-zinc-900 font-bold">#{orderId}</span> ya está siendo procesada por nuestro equipo.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {isDraft ? (
                            <Button 
                                onClick={() => navigate("/ventas/clientes")}
                                className="h-14 px-8 bg-zinc-900 text-white rounded-2xl text-lg font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 group"
                            >
                                Volver a Mi Cartera <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    onClick={() => navigate("/portal/pedidos")}
                                    className="h-14 px-8 bg-zinc-900 text-white rounded-2xl text-lg font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 group"
                                >
                                    Ver Mis Pedidos <FileText className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => navigate("/portal/catalogo")}
                                    className="h-14 px-8 bg-white border-2 border-zinc-100 text-zinc-600 rounded-2xl text-lg font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
                                >
                                    Seguir Comprando <ShoppingBag className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </Button>
                            </>
                        )}
                        <Button 
                            variant="ghost"
                            onClick={() => navigate("/")}
                            className="h-14 px-6 text-zinc-400 hover:text-zinc-600 rounded-2xl font-bold"
                        >
                            <Home className="mr-2 w-5 h-5" /> Inicio
                        </Button>
                    </div>
                </div>

                {/* Right Column: Instructions & Bank Details */}
                <div className="w-full lg:w-[480px] space-y-6">
                    <div className="bg-white border border-zinc-200/60 rounded-[32px] p-8 shadow-xl shadow-zinc-200/40 space-y-8">
                        <div>
                            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Instrucciones de Despacho</h3>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                        <Package className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 leading-tight">Preparación</p>
                                        <p className="text-sm text-zinc-500 mt-1">Estamos separando tu mercadería en el depósito.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 leading-tight">Pago de ${total.toLocaleString('es-AR')}</p>
                                        <p className="text-sm text-zinc-500 mt-1">Realiza la transferencia para liberar el pedido.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                                        <UploadCloud className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 leading-tight">Reporte</p>
                                        <p className="text-sm text-zinc-500 mt-1">Informa el pago desde tu panel de control.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <BankDetailsCard />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
