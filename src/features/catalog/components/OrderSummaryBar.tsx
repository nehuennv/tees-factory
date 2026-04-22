import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSummaryBarProps {
    totalItems: number;
    totalUnits: string;
    subtotal: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function OrderSummaryBar({
    totalItems,
    totalUnits,
    subtotal,
    actionLabel = 'Continuar',
    onAction,
}: OrderSummaryBarProps) {
    return (
        <div className="w-full border-t border-zinc-200 bg-white px-4 md:px-6 lg:px-8 py-3 shrink-0 z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                {/* Resumen */}
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                {totalItems} producto{totalItems !== 1 ? 's' : ''}
                            </span>
                            <span className="text-sm font-bold text-zinc-900">{totalUnits}</span>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-8 bg-zinc-200" />

                    <div className="hidden sm:flex flex-col leading-tight">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Subtotal estimado</span>
                        <span className="text-base font-black text-zinc-900 tracking-tight">{subtotal}</span>
                    </div>
                </div>

                {/* Subtotal en mobile + botón */}
                <div className="flex items-center gap-3">
                    <div className="flex sm:hidden flex-col leading-tight text-right">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Subtotal</span>
                        <span className="text-base font-black text-zinc-900 tracking-tight">{subtotal}</span>
                    </div>

                    <Button
                        onClick={onAction}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-6 h-11 font-bold shadow-sm flex items-center gap-2 transition-all whitespace-nowrap"
                    >
                        {actionLabel}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
