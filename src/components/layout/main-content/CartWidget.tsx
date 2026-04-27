import { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, PackageOpen, ShoppingBag } from 'lucide-react';
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
import { ProductImage } from '@/components/shared/ProductImage';

const COLOR_POOL = [
    { name: "Negro", hex: "#18181b" },
    { name: "Blanco", hex: "#ffffff" },
    { name: "Gris", hex: "#9ca3af" },
    { name: "Azul", hex: "#1e3a8a" },
    { name: "Rojo", hex: "#dc2626" },
    { name: "Verde", hex: "#4d7c0f" },
    { name: "Beige", hex: "#d4c5a9" },
    { name: "Bordo", hex: "#881337" },
];

const getHexForColor = (name: string) => {
    const found = COLOR_POOL.find(c => name.toLowerCase().includes(c.name.toLowerCase()));
    return found ? found.hex : '#cccccc';
};

export function CartWidget() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { items, totalUnits, totalPrice, removeItem } = useCartStore();

    const handleGoToCheckout = () => {
        setOpen(false);
        setTimeout(() => navigate('/portal/checkout'), 300);
    };

    // Group: productId → qualityName → variants[]
    const products = Object.values(
        items.reduce((acc, item) => {
            if (!acc[item.productId]) {
                acc[item.productId] = {
                    productId: item.productId,
                    productName: item.productName,
                    image: item.image,
                    qualities: {} as Record<string, any>,
                };
            }
            if (!acc[item.productId].qualities[item.quality]) {
                const qIdx = Object.keys(acc[item.productId].qualities).length + 1;
                acc[item.productId].qualities[item.quality] = {
                    qualityName: item.quality,
                    unitPrice: item.unitPrice,
                    index: qIdx,
                    variants: [] as typeof items,
                };
            }
            acc[item.productId].qualities[item.quality].variants.push(item);
            return acc;
        }, {} as Record<string, any>)
    ) as any[];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-white border-zinc-200 shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5 hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 transition-all duration-200 group relative"
                >
                    <div className="relative">
                        <ShoppingCart className="w-4 h-4 text-zinc-700 group-hover:text-zinc-900 transition-colors" />
                        {totalUnits > 0 && (
                            <span className="absolute -top-2 -right-2 bg-zinc-900 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white">
                                {totalUnits}
                            </span>
                        )}
                    </div>
                    <span className="text-sm font-black text-zinc-900 tracking-tight border-l border-zinc-200 pl-2.5">
                        {formatPrice(totalPrice)}
                    </span>
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-[480px] flex flex-col p-0 h-full bg-zinc-50 border-l border-zinc-200 shadow-2xl gap-0">

                {/* Header */}
                <SheetHeader className="px-5 py-4 border-b border-zinc-200 shrink-0 bg-white">
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
                                <ShoppingBag className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-base font-black text-zinc-900">Mi Pedido</span>
                        </div>
                        {totalUnits > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-zinc-500">{totalUnits} prendas</span>
                                <span className="text-sm font-black text-zinc-900">{formatPrice(totalPrice)}</span>
                            </div>
                        )}
                    </SheetTitle>
                </SheetHeader>

                {/* Empty state */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-zinc-200 shadow-sm">
                            <PackageOpen className="w-7 h-7 text-zinc-300" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 mb-1">Tu pedido está vacío</h3>
                            <p className="text-xs text-zinc-400 max-w-[200px] mx-auto leading-relaxed">
                                Agregá prendas desde el catálogo para iniciar tu pedido.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-zinc-700 font-semibold border-zinc-200 bg-white"
                            onClick={() => { setOpen(false); navigate('/portal/catalogo'); }}
                        >
                            Ver Catálogo
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {products.map((product: any) => {
                                const qualities = Object.values(product.qualities) as any[];
                                const productUnits = qualities.reduce((s: number, q: any) =>
                                    s + q.variants.reduce((vs: number, v: any) => vs + v.quantity, 0), 0);
                                const productSubtotal = qualities.reduce((s: number, q: any) =>
                                    s + q.variants.reduce((vs: number, v: any) => vs + v.subtotal, 0), 0);

                                return (
                                    <div key={product.productId} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">

                                        {/* Product header row */}
                                        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
                                            <div className="w-10 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200">
                                                <ProductImage
                                                    src={product.image}
                                                    alt={product.productName}
                                                    objectContain={false}
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-zinc-900 truncate leading-tight">
                                                    {product.productName}
                                                </p>
                                                <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                                                    {productUnits} prendas · {formatPrice(productSubtotal)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quality sections */}
                                        {qualities.map((quality: any, qI: number) => {
                                            const qualUnits = quality.variants.reduce((s: number, v: any) => s + v.quantity, 0);
                                            const qualSubtotal = quality.variants.reduce((s: number, v: any) => s + v.subtotal, 0);

                                            // Group by color
                                            const byColor = quality.variants.reduce((acc: any, v: any) => {
                                                if (!acc[v.color]) acc[v.color] = [];
                                                acc[v.color].push(v);
                                                return acc;
                                            }, {} as Record<string, any[]>);

                                            return (
                                                <div
                                                    key={quality.qualityName}
                                                    className={`px-4 py-3 space-y-2.5 ${qI < qualities.length - 1 ? 'border-b border-zinc-100' : ''}`}
                                                >
                                                    {/* Quality row header */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {/* Nombre de la calidad */}
                                                            <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1 shrink-0">
                                                                <span className="text-xs font-bold text-zinc-700 leading-none">{quality.qualityName}</span>
                                                            </div>
                                                            <span className="text-[11px] text-zinc-400 font-semibold shrink-0">{formatPrice(quality.unitPrice)}/ud.</span>
                                                        </div>
                                                        <div className="flex items-baseline gap-1 shrink-0">
                                                            <span className="text-xs font-black text-zinc-900">{formatPrice(qualSubtotal)}</span>
                                                            <span className="text-[10px] text-zinc-400">· {qualUnits} un.</span>
                                                        </div>
                                                    </div>

                                                    {/* Color rows */}
                                                    <div className="space-y-2 pl-7">
                                                        {Object.entries(byColor).map(([colorName, colorVariants]: [string, any]) => (
                                                            <div key={colorName} className="flex items-center gap-2 flex-wrap">
                                                                {/* Color swatch + name */}
                                                                <div className="flex items-center gap-1.5 w-24 shrink-0">
                                                                    <span
                                                                        className="w-3 h-3 rounded-full shrink-0"
                                                                        style={{
                                                                            backgroundColor: getHexForColor(colorName),
                                                                            border: getHexForColor(colorName) === '#ffffff'
                                                                                ? '1.5px solid #d4d4d8'
                                                                                : '1px solid rgba(0,0,0,0.12)'
                                                                        }}
                                                                    />
                                                                    <span className="text-[11px] font-semibold text-zinc-600 truncate">{colorName}</span>
                                                                </div>

                                                                {/* Size pills */}
                                                                <div className="flex items-center gap-1 flex-wrap flex-1">
                                                                    {(colorVariants as any[]).map((v: any) => (
                                                                        <div key={v.id} className="group/pill flex items-center gap-0.5">
                                                                            <span className="inline-flex items-center gap-0.5 bg-zinc-100 border border-zinc-200 rounded-lg px-2 py-0.5 text-[11px] font-bold text-zinc-700 leading-5">
                                                                                <span className="text-zinc-500">{v.size}</span>
                                                                                <span className="text-zinc-300 mx-0.5 font-normal">·</span>
                                                                                <span className="text-zinc-900">{v.quantity}</span>
                                                                            </span>
                                                                            <button
                                                                                onClick={() => removeItem(v.id)}
                                                                                className="opacity-0 group-hover/pill:opacity-100 text-zinc-300 hover:text-red-400 transition-all ml-0.5"
                                                                                title="Quitar"
                                                                            >
                                                                                <Trash2 className="w-2.5 h-2.5" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                {/* Footer */}
                {items.length > 0 && (
                    <div className="px-4 py-4 border-t border-zinc-200 shrink-0 bg-white space-y-3">
                        <div className="flex items-end justify-between px-1">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Total del Pedido</p>
                                <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none">{formatPrice(totalPrice)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Prendas</p>
                                <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none">{totalUnits}</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleGoToCheckout}
                            className="w-full bg-zinc-900 hover:bg-zinc-700 text-white rounded-xl h-11 font-bold text-sm flex items-center justify-center gap-2 group"
                        >
                            Continuar al Checkout
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
