import { useNavigate } from 'react-router-dom';
import { useOrderDraftStore } from '@/store/orderDraftStore';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Banner contextual que aparece en la parte superior del catálogo
 * cuando un vendedor está armando un pedido para un cliente.
 *
 * Responsabilidades:
 *   - Mostrar contexto visual claro: "Creando pedido para: [cliente]"
 *   - Permitir cancelar el draft y volver a la cartera.
 *   - No renderizar nada si no hay draft activo.
 */
export function OrderDraftBanner() {
    const navigate = useNavigate();
    const { clientName, isActive, clearDraft } = useOrderDraftStore();

    if (!isActive || !clientName) return null;

    const initials = clientName
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    const handleCancel = () => {
        clearDraft();
        navigate('/ventas/clientes');
    };

    return (
        <div className="mx-6 lg:mx-8 mt-6 mb-0">
            <div className="flex items-center justify-between gap-4 bg-zinc-900 text-white rounded-2xl px-5 py-3.5 shadow-lg animate-in slide-in-from-top-2 fade-in duration-300">
                {/* Lado izquierdo: contexto */}
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 border border-white/10 text-xs font-bold tracking-wide shrink-0">
                        {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                Creando pedido para
                            </span>
                        </div>
                        <span className="text-sm font-bold text-white truncate leading-tight mt-0.5">
                            {clientName}
                        </span>
                    </div>
                </div>

                {/* Lado derecho: cancelar */}
                <Button
                    variant="ghost"
                    onClick={handleCancel}
                    className="shrink-0 h-8 px-3 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all gap-1.5"
                >
                    <X className="w-3.5 h-3.5" />
                    Cancelar
                </Button>
            </div>
        </div>
    );
}
