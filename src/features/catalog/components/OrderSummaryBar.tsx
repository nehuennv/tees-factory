import { ArrowRight, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSummaryBarProps {
    totalItems: number;
    totalUnits: string;
    subtotal: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Barra de resumen de pedido sticky en la base del catálogo.
 * Muestra totales y un CTA para avanzar al checkout.
 * Reutilizable en cualquier flujo de compra o presupuesto.
 */
export function OrderSummaryBar({
    totalUnits,
    subtotal,
    actionLabel = 'REVISAR PEDIDO',
    onAction
}: OrderSummaryBarProps) {
    return (
        <div className="border-t border-zinc-200 bg-white p-3 lg:p-4 shrink-0 -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8 mt-auto z-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Resumen */}
                <div className="flex items-center gap-4 bg-zinc-50 px-5 py-2.5 rounded-xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-zinc-100">
                            <TableProperties className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">
                                Prendas Totales
                            </span>
                            <span className="text-sm font-bold text-zinc-900">{totalUnits}</span>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-zinc-200"></div>

                    <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">
                            Subtotal Estimado
                        </span>
                        <span className="text-base font-black text-zinc-900 tracking-tight">{subtotal}</span>
                    </div>
                </div>

                {/* Botón de Checkout */}
                <Button
                    onClick={onAction}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-12 font-bold shadow-sm flex items-center gap-2 transition-all"
                >
                    {actionLabel} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
