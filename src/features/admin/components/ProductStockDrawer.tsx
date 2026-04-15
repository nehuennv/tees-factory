import { useState, useEffect, useRef } from "react";
import type { Product } from "@/types/product";
import apiClient from "@/lib/apiClient";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X, ImagePlus, Shirt } from "lucide-react";

const BACKEND_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

interface SizeVariant {
    id?: string;
    size: string;
    physicalStock: number | '';
}

interface ColorRow {
    colorName: string;
    sizes: SizeVariant[];
}

interface QualityTab {
    id: string;
    qualityName: string;
    basePrice: number | '';
    colors: ColorRow[];
}

interface ProductStockDrawerProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onProductSaved?: (updatedProduct: Product) => void;
}

export function ProductStockDrawer({ product, isOpen, onClose, onProductSaved }: ProductStockDrawerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [qualities, setQualities] = useState<QualityTab[]>([]);
    const [activeTab, setActiveTab] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Per color new-size inputs: key = `${qualityId}-${colorName}`
    const [newSizeInputs, setNewSizeInputs] = useState<Record<string, string>>({});
    // Per quality new-color inputs
    const [newColorInputs, setNewColorInputs] = useState<Record<string, string>>({});
    const [showNewColorInput, setShowNewColorInput] = useState<Record<string, boolean>>({});

    const [productDetails, setProductDetails] = useState({
        name: "",
        category: "",
        description: ""
    });

    useEffect(() => {
        if (isOpen && product) {
            setProductDetails({
                name: product.name,
                category: product.category,
                description: product.description || ""
            });
            setImageUrl(product.image || '');
            fetchMatrix();
        } else {
            setQualities([]);
            setActiveTab("");
            setNewSizeInputs({});
            setNewColorInputs({});
            setShowNewColorInput({});
            setImageUrl('');
        }
    }, [isOpen, product]);

    const fetchMatrix = async () => {
        if (!product) return;
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/products/${product.id}`);
            const data = res.data;

            setProductDetails({
                name: data.name,
                category: data.category,
                description: data.description || ""
            });
            setImageUrl(data.image || data.image_url || data.imageUrl || '');

            const mapped: QualityTab[] = (data.qualities || []).map((q: any) => ({
                id: q.id,
                qualityName: q.qualityName,
                basePrice: q.basePrice ?? 0,
                colors: (q.colors || []).map((c: any) => ({
                    colorName: c.colorName,
                    sizes: (c.sizes || []).map((s: any) => ({
                        id: s.id,
                        size: s.size,
                        // Usamos physicalStock (stock real), no availableStock (stock - reservado)
                        physicalStock: Math.round(Number(s.physicalStock) || 0),
                    })),
                })),
            }));

            setQualities(mapped);
            if (mapped.length > 0) setActiveTab(mapped[0].id);
        } catch {
            toast.error("Error al cargar la matriz del producto");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStockChange = (qualityId: string, colorName: string, sizeIdx: number, value: string) => {
        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            return {
                ...q,
                colors: q.colors.map(c => {
                    if (c.colorName !== colorName) return c;
                    const newSizes = [...c.sizes];
                    const parsed = value === "" ? "" : parseInt(value, 10);
                    newSizes[sizeIdx] = { 
                        ...newSizes[sizeIdx], 
                        physicalStock: Number.isNaN(parsed as number) ? 0 : parsed 
                    };
                    return { ...c, sizes: newSizes };
                }),
            };
        }));
    };

    const handleRemoveSize = (qualityId: string, colorName: string, sizeIdx: number) => {
        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            return {
                ...q,
                colors: q.colors.map(c => {
                    if (c.colorName !== colorName) return c;
                    return { ...c, sizes: c.sizes.filter((_, i) => i !== sizeIdx) };
                }),
            };
        }));
    };

    const handleAddSize = (qualityId: string, colorName: string) => {
        const key = `${qualityId}-${colorName}`;
        const sizeName = (newSizeInputs[key] || "").trim();
        if (!sizeName) return;

        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            return {
                ...q,
                colors: q.colors.map(c => {
                    if (c.colorName !== colorName) return c;
                    if (c.sizes.some(s => s.size.toLowerCase() === sizeName.toLowerCase())) {
                        toast.error(`El talle "${sizeName}" ya existe para este color.`);
                        return c;
                    }
                    return { ...c, sizes: [...c.sizes, { size: sizeName, physicalStock: 0 }] };
                }),
            };
        }));

        setNewSizeInputs(prev => ({ ...prev, [key]: "" }));
    };

    const handleRemoveColor = (qualityId: string, colorName: string) => {
        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            return { ...q, colors: q.colors.filter(c => c.colorName !== colorName) };
        }));
    };

    const handleAddColor = (qualityId: string) => {
        const colorName = (newColorInputs[qualityId] || "").trim();
        if (!colorName) return;

        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            if (q.colors.some(c => c.colorName.toLowerCase() === colorName.toLowerCase())) {
                toast.error(`El color "${colorName}" ya existe en esta calidad.`);
                return q;
            }
            return { ...q, colors: [...q.colors, { colorName, sizes: [] }] };
        }));

        setNewColorInputs(prev => ({ ...prev, [qualityId]: "" }));
        setShowNewColorInput(prev => ({ ...prev, [qualityId]: false }));
    };


    const handleQualityPriceChange = (qualityId: string, value: string) => {
        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            const parsed = value === "" ? "" : parseFloat(value);
            return { ...q, basePrice: Number.isNaN(parsed as number) ? 0 : parsed };
        }));
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !product) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploadingImage(true);
        try {
            const res = await apiClient.post(`/products/${product.id}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newUrl: string = res.data.imageUrl || res.data.image_url || res.data.image || '';
            setImageUrl(newUrl);
            onProductSaved?.({ ...product, ...productDetails, image: newUrl });
            toast.success("Imagen actualizada correctamente");
        } catch {
            toast.error("Error al subir la imagen");
        } finally {
            setIsUploadingImage(false);
            // Reset input para permitir subir el mismo archivo de nuevo si hace falta
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveAll = async () => {
        if (!product) return;
        
        if (!productDetails.name || !productDetails.category) {
            toast.error("Por favor completa el nombre y la categoría.");
            return;
        }

        setIsSaving(true);

        const stockPayload: { qualityId: string; color: string; size: string; physicalStock: number }[] = [];

        for (const quality of qualities) {
            for (const color of quality.colors) {
                for (const size of color.sizes) {
                    stockPayload.push({
                        qualityId: quality.id,
                        color: color.colorName,
                        size: size.size,
                        physicalStock: Math.round(Number(size.physicalStock) || 0),
                    });
                }
            }
        }

        try {
            // 0. Guardar detalles del producto
            await apiClient.patch(`/products/${product.id}`, {
                name: productDetails.name,
                category: productDetails.category,
                description: productDetails.description,
            });

            // 1. Guardar precios de calidades 
            await Promise.all(
                qualities.map(q => 
                    apiClient.patch(`/products/${product.id}/qualities/${q.id}`, {
                        basePrice: Number(q.basePrice) || 0
                    })
                )
            );

            // 2. Guardar stock
            if (stockPayload.length > 0) {
                await apiClient.put(`/products/${product.id}/stock`, stockPayload);
            }

            // Recalcular totalStock local
            const newTotalStock = qualities.reduce((acc, q) =>
                acc + q.colors.reduce((cAcc, c) =>
                    cAcc + c.sizes.reduce((sAcc, s) => sAcc + (s.physicalStock || 0), 0), 0), 0
            );

            onProductSaved?.({
                ...product,
                name: productDetails.name,
                category: productDetails.category,
                description: productDetails.description,
                totalStock: newTotalStock
            });

            toast.success("Producto guardado", {
                description: `Detalles, matriz y stock actualizados correctamente.`,
            });
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || "Error al guardar el producto";
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (!product) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-3xl flex flex-col bg-white border-zinc-200 p-0 overflow-hidden">
                <SheetHeader className="px-6 py-5 border-b border-zinc-100 shrink-0">
                    <SheetTitle className="text-lg font-bold text-zinc-900">
                        Gestionar Matriz:{" "}
                        <span className="text-zinc-500 font-medium">{product.name}</span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        Editá colores, talles y stock del producto {product.name}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* Basic Details Section */}
                    <div className="p-6 pb-4 border-b border-zinc-100 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">1. Detalles Básicos</h3>

                        {/* Image Upload */}
                        <div className="flex items-start gap-4">
                            <div
                                className="relative w-24 h-24 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 overflow-hidden flex-shrink-0 cursor-pointer group hover:border-zinc-400 transition-colors"
                                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                                title="Cambiar imagen"
                            >
                                {imageUrl ? (
                                    <img
                                        src={imageUrl.startsWith('http') ? imageUrl : `${BACKEND_BASE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`}
                                        alt="Imagen del producto"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Shirt className="w-8 h-8 text-zinc-300" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {isUploadingImage
                                        ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                        : <ImagePlus className="w-5 h-5 text-white" />
                                    }
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 pt-1">
                                <span className="text-xs font-semibold text-zinc-600">Imagen del Producto</span>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    JPG, PNG o WEBP. Se sube al instante<br />sin necesidad de guardar.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isUploadingImage}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-1 h-8 px-3 text-xs rounded-lg border-zinc-200 w-fit"
                                >
                                    {isUploadingImage ? (
                                        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Subiendo...</>
                                    ) : (
                                        <><ImagePlus className="w-3 h-3 mr-1.5" />{imageUrl ? 'Cambiar imagen' : 'Subir imagen'}</>
                                    )}
                                </Button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageFileChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-600">Nombre del Producto *</Label>
                                <Input
                                    value={productDetails.name}
                                    onChange={e => setProductDetails(prev => ({ ...prev, name: e.target.value }))}
                                    className="h-9 text-sm rounded-lg border-zinc-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-600">Categoría *</Label>
                                <Input
                                    value={productDetails.category}
                                    onChange={e => setProductDetails(prev => ({ ...prev, category: e.target.value }))}
                                    className="h-9 text-sm rounded-lg border-zinc-200"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-1.5">
                                <Label className="text-xs font-semibold text-zinc-600">Descripción</Label>
                                <Textarea
                                    value={productDetails.description}
                                    onChange={e => setProductDetails(prev => ({ ...prev, description: e.target.value }))}
                                    className="min-h-[80px] text-sm resize-none rounded-lg border-zinc-200"
                                    placeholder="Descripción detallada del artículo..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Matrix Section */}
                    <div className="px-6 py-4 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 mb-2">2. Matriz y Variantes</h3>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
                            <p className="text-sm text-zinc-500">Cargando matriz del producto...</p>
                        </div>
                    ) : qualities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
                            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                                <span className="text-amber-500 text-xl font-bold">!</span>
                            </div>
                            <p className="text-sm font-semibold text-zinc-800">Producto sin calidades en la base de datos</p>
                            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                                Todos los productos deben tener 3 calidades (1, 2, 3) creadas automáticamente por el backend.
                                Este producto no las tiene — pedile al dev que corra la inicialización para este registro.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchMatrix}
                                className="mt-1 rounded-xl border-zinc-200 text-zinc-600 hover:text-zinc-900 text-xs"
                            >
                                Reintentar
                            </Button>
                        </div>
                    ) : (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start bg-zinc-50 border-b border-zinc-200 rounded-none p-0 h-auto px-6">
                                {qualities.map((q) => (
                                    <TabsTrigger
                                        key={q.id}
                                        value={q.id}
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3 font-semibold text-sm text-zinc-500 data-[state=active]:text-zinc-900"
                                    >
                                        Calidad {q.qualityName}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {qualities.map((quality) => (
                                <TabsContent
                                    key={quality.id}
                                    value={quality.id}
                                    className="mt-0 px-6 py-5 flex flex-col gap-4"
                                >
                                    {/* Precio por calidad — editable, se guarda en product_qualities */}
                                    <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                                            Precio Calidad {quality.qualityName}
                                        </span>
                                        <div className="relative flex-1 max-w-[180px]">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">$</span>
                                            <Input
                                                type="number"
                                                value={quality.basePrice}
                                                onChange={(e) => handleQualityPriceChange(quality.id, e.target.value)}
                                                onBlur={(e) => {
                                                    if (e.target.value === "") handleQualityPriceChange(quality.id, "0");
                                                }}
                                                className="pl-7 h-9 text-sm rounded-lg border-zinc-200 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0"
                                                min={0}
                                            />
                                        </div>
                                        <span className="text-xs text-zinc-400">por unidad</span>
                                    </div>

                                    {quality.colors.length === 0 && (
                                        <p className="text-sm text-zinc-400 text-center py-4 italic">
                                            Sin colores. Agregá uno abajo.
                                        </p>
                                    )}

                                    {quality.colors.map((color) => {
                                        const newSizeKey = `${quality.id}-${color.colorName}`;
                                        return (
                                            <div
                                                key={color.colorName}
                                                className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm"
                                            >
                                                {/* Color header */}
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 border border-zinc-300" />
                                                        <span className="font-semibold text-sm text-zinc-900">
                                                            {color.colorName}
                                                        </span>
                                                        <span className="text-xs text-zinc-400 font-medium">
                                                            {color.sizes.length} talle{color.sizes.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveColor(quality.id, color.colorName)}
                                                        className="text-zinc-300 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50"
                                                        title="Eliminar color"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <div className="p-4 flex flex-col gap-3">
                                                    {/* Size chips */}
                                                    {color.sizes.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {color.sizes.map((sz, sizeIdx) => (
                                                                <div
                                                                    key={sizeIdx}
                                                                    className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 group/chip"
                                                                >
                                                                    <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wide min-w-[24px] text-center">
                                                                        {sz.size}
                                                                    </span>
                                                                    <Input
                                                                        type="number"
                                                                        value={sz.physicalStock}
                                                                        onChange={(e) =>
                                                                            handleStockChange(quality.id, color.colorName, sizeIdx, e.target.value)
                                                                        }
                                                                        onBlur={(e) => {
                                                                            if (e.target.value === "") handleStockChange(quality.id, color.colorName, sizeIdx, "0");
                                                                        }}
                                                                        className="w-16 h-7 text-center text-sm p-1 border-zinc-200 bg-white focus-visible:ring-1 focus-visible:ring-zinc-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                        min={0}
                                                                    />
                                                                    <span className="text-[10px] text-zinc-400 font-medium">uds</span>
                                                                    <button
                                                                        onClick={() => handleRemoveSize(quality.id, color.colorName, sizeIdx)}
                                                                        className="text-zinc-300 hover:text-red-400 transition-colors opacity-0 group-hover/chip:opacity-100"
                                                                        title="Quitar talle"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {color.sizes.length === 0 && (
                                                        <p className="text-xs text-zinc-400 italic">
                                                            Sin talles. Usá el campo de abajo para agregar.
                                                        </p>
                                                    )}

                                                    {/* Add size row */}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Input
                                                            placeholder="Ej: XL, 42, 3XL..."
                                                            value={newSizeInputs[newSizeKey] || ""}
                                                            onChange={(e) =>
                                                                setNewSizeInputs(prev => ({
                                                                    ...prev,
                                                                    [newSizeKey]: e.target.value,
                                                                }))
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleAddSize(quality.id, color.colorName);
                                                            }}
                                                            className="h-8 text-xs rounded-lg border-zinc-200 bg-zinc-50 max-w-[170px]"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAddSize(quality.id, color.colorName)}
                                                            className="h-8 px-3 text-xs rounded-lg border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Agregar talle
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Add color */}
                                    <div>
                                        {showNewColorInput[quality.id] ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Ej: Bordo, Azul Marino, Verde Botella..."
                                                    value={newColorInputs[quality.id] || ""}
                                                    onChange={(e) =>
                                                        setNewColorInputs(prev => ({
                                                            ...prev,
                                                            [quality.id]: e.target.value,
                                                        }))
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleAddColor(quality.id);
                                                    }}
                                                    className="h-9 text-sm rounded-xl border-zinc-200 bg-zinc-50 flex-1"
                                                    autoFocus
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddColor(quality.id)}
                                                    className="h-9 px-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold"
                                                >
                                                    Agregar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setShowNewColorInput(prev => ({
                                                            ...prev,
                                                            [quality.id]: false,
                                                        }))
                                                    }
                                                    className="h-9 px-3 rounded-xl text-zinc-500 hover:text-zinc-900"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setShowNewColorInput(prev => ({
                                                        ...prev,
                                                        [quality.id]: true,
                                                    }))
                                                }
                                                className="w-full h-9 rounded-xl border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 text-xs font-medium"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Agregar color
                                            </Button>
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}
                    </div>
                </div>

                {/* Footer */}
                {!isLoading && qualities.length > 0 && (
                    <div className="px-6 py-4 border-t border-zinc-100 bg-white shrink-0">
                        <Button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-sm"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando Producto...
                                </>
                            ) : (
                                "Guardar Producto"
                            )}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
