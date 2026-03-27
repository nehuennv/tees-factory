import { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { updateProductStock } from "@/api/mockAdminCatalog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProductStockDrawerProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

// Generador de mock para la matriz
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const ALL_COLORS = ["Negro", "Blanco", "Gris", "Azul Marino", "Rojo", "Verde", "Beige", "Bordó"];

export function ProductStockDrawer({ product, isOpen, onClose }: ProductStockDrawerProps) {
    // Simulamos matrices de stock con estados locales temporales
    const [stockMatrix, setStockMatrix] = useState<Record<string, Record<string, string>>>({});
    const [savingCells, setSavingCells] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (product) {
            // Inicializamos un stock aleatorio o 0 para la matriz al abrir
            const initialStock: Record<string, Record<string, string>> = {};
            const numColors = Math.min(product.colors || 3, ALL_COLORS.length);
            const sizes = ALL_SIZES.slice(1, 6); // S a XXL por defecto

            ALL_COLORS.slice(0, numColors).forEach(c => {
                initialStock[c] = {};
                sizes.forEach(s => {
                    // Un valor inicial simulado
                    initialStock[c][s] = Math.floor(Math.random() * 50).toString();
                });
            });
            setStockMatrix(initialStock);
        }
    }, [product]);

    if (!product) return null;

    const numColors = Math.min(product.colors || 3, ALL_COLORS.length);
    const activeColors = ALL_COLORS.slice(0, numColors);
    const activeSizes = ALL_SIZES.slice(1, 6); // S -> XXL

    // Simulamos tabs (El producto tiene su quality y agregamos otra para mostrar la funcionalidad de Tabs)
    const qualities = [product.quality || "Standard", "Premium"];

    const handleStockChange = (color: string, size: string, value: string) => {
        setStockMatrix(prev => ({
            ...prev,
            [color]: {
                ...(prev[color] || {}),
                [size]: value
            }
        }));
    };

    const handleBlur = async (quality: string, color: string, size: string, value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;

        const cellKey = `${quality}-${color}-${size}`;
        setSavingCells(prev => ({ ...prev, [cellKey]: true }));

        try {
            await updateProductStock(product.id, quality, color, size, numValue);
            toast.success("Stock guardado", {
                description: `${color} / ${size} actualizado a ${numValue}.`,
                duration: 2000,
            });
        } catch (error) {
            toast.error("Error al guardar stock");
        } finally {
            setSavingCells(prev => ({ ...prev, [cellKey]: false }));
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-white border-zinc-200">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-4">
                        Editar Inventario: <span className="text-zinc-500 font-medium">{product.name}</span>
                    </SheetTitle>
                </SheetHeader>

                <Tabs defaultValue={qualities[0]} className="w-full">
                    <TabsList className="mb-6 w-full justify-start bg-zinc-50 border-b border-zinc-200 rounded-none p-0 h-auto">
                        {qualities.map((q) => (
                            <TabsTrigger
                                key={q}
                                value={q}
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
                            >
                                {q}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {qualities.map((quality) => (
                        <TabsContent key={quality} value={quality} className="mt-0">
                            <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Color / Talle</th>
                                                {activeSizes.map(size => (
                                                    <th key={size} className="px-3 py-3 font-medium text-center w-20">{size}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {activeColors.map((color) => (
                                                <tr key={color} className="hover:bg-zinc-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-zinc-900">
                                                        {color}
                                                    </td>
                                                    {activeSizes.map(size => {
                                                        const val = stockMatrix[color]?.[size] || "";
                                                        const cellKey = `${quality}-${color}-${size}`;
                                                        const isSaving = savingCells[cellKey];

                                                        return (
                                                            <td key={size} className="px-2 py-2 text-center relative">
                                                                <div className="relative flex items-center justify-center">
                                                                    <Input
                                                                        type="number"
                                                                        value={val}
                                                                        onChange={(e) => handleStockChange(color, size, e.target.value)}
                                                                        onBlur={(e) => handleBlur(quality, color, size, e.target.value)}
                                                                        className="w-16 h-8 text-center text-sm p-1 border-zinc-200 bg-white focus-visible:ring-1 focus-visible:ring-zinc-900 pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    />
                                                                    {isSaving && (
                                                                        <Loader2 className="w-3 h-3 absolute right-2 text-zinc-400 animate-spin" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
