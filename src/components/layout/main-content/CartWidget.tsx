import { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, PackageOpen } from 'lucide-react';
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
                        {/* Pequeño badge numérico si hay items */}
                        {totalUnits > 0 && (
                            <div className="absolute -top-2 -right-2 bg-zinc-900 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white">
                                {totalUnits}
                            </div>
                        )}
                    </div>
                    <span className="text-sm font-black text-zinc-900 tracking-tight pl-2 border-l border-zinc-200">
                        {formatPrice(totalPrice)}
                    </span>
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 h-full bg-white border-l border-zinc-200 shadow-2xl gap-0">
                {/* Header del Carrito */}
                <SheetHeader className="p-6 pb-4 border-b border-zinc-100 shrink-0 bg-zinc-50/50">
                    <SheetTitle className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
                        <ShoppingCart className="w-5 h-5 mr-1" />
                        Mi Pedido
                        <span className="ml-2 text-sm font-bold text-zinc-500 bg-zinc-200/50 px-2.5 py-0.5 rounded-full">
                            {totalUnits} prendas
                        </span>
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    /* Estado Vacío Premium */
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100 shadow-sm">
                            <PackageOpen className="w-10 h-10 text-zinc-300" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Carrito vacío</h3>
                            <p className="text-sm text-zinc-500 max-w-[250px] mx-auto">Agrega prendas desde el catálogo para iniciar tu pedido mayorista.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="mt-2 rounded-xl text-zinc-700 font-semibold border-zinc-200 hover:bg-zinc-50"
                            onClick={() => { setOpen(false); navigate('/portal/catalogo'); }}
                        >
                            Ver Catálogo
                        </Button>
                    </div>
                ) : (
                    /* Lista de Productos Agrupados */
                    <ScrollArea className="flex-1 w-full">
                        <div className="flex flex-col gap-5 p-6 w-full">
                            {Object.values(items.reduce((acc, item) => {
                                if (!acc[item.productId]) {
                                    acc[item.productId] = {
                                        productId: item.productId,
                                        productName: item.productName,
                                        image: item.image,
                                        variants: [],
                                        totalProductQty: 0,
                                        totalProductSubtotal: 0
                                    };
                                }
                                acc[item.productId].variants.push(item);
                                acc[item.productId].totalProductQty += item.quantity;
                                acc[item.productId].totalProductSubtotal += item.subtotal;
                                return acc;
                            }, {} as Record<string, any>)).map((product: any) => (
                                <div
                                    key={product.productId}
                                    className="flex flex-col gap-3 p-4 rounded-3xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group"
                                >
                                    {/* Header del Producto: Imagen y Nombre */}
                                    <div className="flex gap-4 items-center border-b border-zinc-50 pb-3">
                                        <div className="w-16 h-20 rounded-xl bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center relative">
                                            <img
                                                src={product.image || `https://placehold.co/100x120/f4f4f5/a1a1aa?text=${encodeURIComponent(product.productName.substring(0, 3))}`}
                                                alt={product.productName}
                                                className="w-full h-full object-cover mix-blend-multiply"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-zinc-900 truncate leading-tight mb-1">
                                                {product.productName}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                                                    ID: {product.productId}
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    {product.totalProductQty} un. totales
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-lista de Variantes (Talles y Colores) */}
                                    <div className="space-y-2 pt-1">
                                        {product.variants.map((variant: any) => (
                                            <div key={variant.id} className="flex items-center justify-between group/variant relative pl-2 border-l-2 border-zinc-100 hover:border-zinc-300 transition-colors py-1">
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded uppercase leading-none">
                                                            {variant.size}
                                                        </span>
                                                        <span className="text-[11px] text-zinc-500 font-medium">
                                                            {variant.color} • {variant.quality}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400 mt-1">
                                                        {variant.quantity} un. x {formatPrice(variant.unitPrice)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-zinc-900 tracking-tight">
                                                        {formatPrice(variant.subtotal)}
                                                    </span>
                                                    {/* Botón eliminar variante individual */}
                                                    <button
                                                        onClick={() => removeItem(variant.id)}
                                                        className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                                                        aria-label="Quitar variante"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer del producto con total parcial */}
                                    <div className="mt-1 pt-3 border-t border-zinc-50 flex justify-between items-center bg-zinc-50/50 -mx-4 px-4 py-2 rounded-b-2xl">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            Subtotal Producto
                                        </span>
                                        <span className="text-sm font-black text-zinc-900 tracking-tight">
                                            {formatPrice(product.totalProductSubtotal)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {/* Footer del Carrito */}
                <div className="p-6 border-t border-zinc-100 shrink-0 flex flex-col gap-5 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total a Pagar</span>
                            <span className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">{formatPrice(totalPrice)}</span>
                        </div>
                    </div>
                    <Button
                        disabled={items.length === 0}
                        onClick={handleGoToCheckout}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-14 font-bold shadow-md flex items-center justify-center gap-2 transition-all text-base group"
                    >
                        Continuar al Checkout
                        <ArrowRight className="w-5 h-5 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}