import { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatters';

export function CartWidget() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { items, totalUnits, totalPrice, removeItem } = useCartStore();

    const handleGoToCheckout = () => {
        setOpen(false);
        setTimeout(() => navigate('/portal/checkout'), 300);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-white border-zinc-200 shadow-sm rounded-xl px-5 py-2.5 flex items-center gap-3 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md active:scale-95 transition-all duration-200 group relative"
                >
                    <div className="relative flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-zinc-700 group-hover:text-zinc-900 transition-colors" />
                    </div>
                    <span className="text-sm font-black text-zinc-900 tracking-tight pl-1 border-l border-zinc-200">
                        {formatPrice(totalPrice)}
                    </span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-6 h-full bg-white border-l border-zinc-200 shadow-xl gap-0">
                <SheetHeader className="pb-4 border-b border-zinc-100 shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-xl font-black text-zinc-900">
                        <ShoppingCart className="w-5 h-5" />
                        Tu Pedido ({totalUnits})
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500">
                        <ShoppingCart className="w-12 h-12 text-zinc-200" />
                        <p className="text-sm font-medium">Tu carrito está vacío.</p>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 -mx-6 px-6 relative h-0">
                        <div className="flex flex-col gap-4 py-4 w-full">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 relative group">
                                    <div className="w-16 h-16 rounded-lg bg-white border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center">
                                        <span className="text-xl" role="img" aria-label="shirt">👕</span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h4 className="text-sm font-bold text-zinc-900 truncate">{item.productName}</h4>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {item.quality} • <span className="font-semibold text-zinc-700">{item.size} / {item.color}</span>
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-black text-zinc-900">
                                                {item.quantity} x {formatPrice(item.unitPrice)}
                                            </span>
                                            <span className="text-sm font-bold text-zinc-900">
                                                {formatPrice(item.subtotal)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute right-2 top-2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 md:opacity-0 max-md:opacity-100"
                                        aria-label="Eliminar artículo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                <div className="pt-4 border-t border-zinc-100 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-500">Total Estimado</span>
                        <span className="text-2xl font-black text-zinc-900">{formatPrice(totalPrice)}</span>
                    </div>
                    <Button
                        disabled={items.length === 0}
                        onClick={handleGoToCheckout}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                    >
                        Ir al Checkout
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
