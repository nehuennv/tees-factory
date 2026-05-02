import { useState, useEffect, useRef } from "react";
import type { Product } from "@/types/product";
import apiClient from "@/lib/apiClient";
import { CategorySelect } from "./CategorySelect";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X, ImagePlus, Shirt, Search, ChevronDown } from "lucide-react";

const BACKEND_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

const LETTER_SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL'];
const SIZE_GROUPS = {
    base:    ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    nino:    ['2', '4', '6', '8', '10', '12', '14'],
    especial:['3XL', '4XL', '5XL', '6XL', '7XL'],
} as const;

const compareSizes = (a: string, b: string): number => {
    const normA = a.trim().toUpperCase().replace(/^(\d+)\s*X\s*L$/, '$1XL');
    const normB = b.trim().toUpperCase().replace(/^(\d+)\s*X\s*L$/, '$1XL');
    const numA = parseFloat(normA);
    const numB = parseFloat(normB);
    const isNumA = !isNaN(numA) && isFinite(numA);
    const isNumB = !isNaN(numB) && isFinite(numB);
    // Numeric sizes first (children sizes: 2, 4, 6...)
    if (isNumA && isNumB) return numA - numB;
    if (isNumA) return -1;
    if (isNumB) return 1;
    // Letter sizes by canonical order
    const idxA = LETTER_SIZE_ORDER.indexOf(normA);
    const idxB = LETTER_SIZE_ORDER.indexOf(normB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return normA.localeCompare(normB, 'es');
};

const PREDEFINED_COLORS = [
    { name: "Melange 5%",      hex: "#e8e8e8" },
    { name: "Melange 25%",     hex: "#c0c0c0" },
    { name: "Negro Melange",   hex: "#2d2d2d" },
    { name: "Gris Oscuro",     hex: "#4a4a4a" },
    { name: "Classic Grey",    hex: "#9e9e9e" },
    { name: "Stone Wash",      hex: "#8b8680" },
    { name: "Negro",           hex: "#1a1a1a" },
    { name: "Blanco",          hex: "#ffffff" },
    { name: "Crema",           hex: "#f5f0e8" },
    { name: "Arena",           hex: "#c2b280" },
    { name: "Celeste",         hex: "#87ceeb" },
    { name: "Turquesa",        hex: "#35c4b8" },
    { name: "Azul Gastado",    hex: "#6b8fa3" },
    { name: "Azul Francia",    hex: "#002395" },
    { name: "Azul Oscuro",     hex: "#003087" },
    { name: "Verde Salvia",    hex: "#8f9779" },
    { name: "Verde Pistacho",  hex: "#93c572" },
    { name: "Verde Oliva",     hex: "#708238" },
    { name: "Verde Benetton",  hex: "#2e7d32" },
    { name: "Verde Inglés",    hex: "#1b4332" },
    { name: "Amarillo Suave",  hex: "#f5deb3" },
    { name: "Mostaza Dulce",   hex: "#d4ac0d" },
    { name: "Rosa",            hex: "#f9a8c0" },
    { name: "Coral",           hex: "#ff6b6b" },
    { name: "Naranja",         hex: "#ff8c00" },
    { name: "Rojo",            hex: "#dc143c" },
    { name: "Bordo",           hex: "#6d0026" },
    { name: "Fucsia",          hex: "#e5007d" },
    { name: "Violeta",         hex: "#7b2d8b" },
    { name: "Chocolate",       hex: "#5c3317" },
];

type SizeSortKey = 'none' | 'name' | 'stock' | 'price';

interface SizeVariant {
    id?: string;
    size: string;
    physicalStock: number | '';
    price: number | '' | null;
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
    const [sizeSortKey, setSizeSortKey] = useState<SizeSortKey>('name');
    const [collapsedColors, setCollapsedColors] = useState<Set<string>>(new Set());

    const toggleColorCollapse = (qualityId: string, colorName: string) => {
        const key = `${qualityId}-${colorName}`;
        setCollapsedColors(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Per color new-size inputs: key = `${qualityId}-${colorName}`
    const [newSizeInputs, setNewSizeInputs] = useState<Record<string, string>>({});
    // Per color size picker open state
    const [showSizePicker, setShowSizePicker] = useState<Record<string, boolean>>({});
    // Per picker which size groups are expanded (nino / especial)
    const [expandedSizeGroups, setExpandedSizeGroups] = useState<Record<string, Set<string>>>({});
    const toggleSizeGroup = (pickerKey: string, group: string) => {
        setExpandedSizeGroups(prev => {
            const current = new Set(prev[pickerKey] ?? []);
            current.has(group) ? current.delete(group) : current.add(group);
            return { ...prev, [pickerKey]: current };
        });
    };
    // Per quality color picker state
    const [showColorPicker, setShowColorPicker] = useState<Record<string, boolean>>({});
    const [colorSearch, setColorSearch] = useState<Record<string, string>>({});

    const [productDetails, setProductDetails] = useState({
        name: "",
        category: "",
        categoryId: "",
        description: ""
    });

    useEffect(() => {
        if (isOpen && product) {
            setProductDetails({
                name: product.name,
                category: product.category,
                categoryId: product.categoryId || "",
                description: product.description || ""
            });
            setImageUrl(product.image || '');
            fetchMatrix();
        } else {
            setQualities([]);
            setActiveTab("");
            setNewSizeInputs({});
            setShowSizePicker({});
            setExpandedSizeGroups({});
            setShowColorPicker({});
            setColorSearch({});
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
                category: data.category || "",
                categoryId: data.categoryId || "",
                description: data.description || ""
            });
            setImageUrl(data.image || data.image_url || data.imageUrl || '');

            const mapped: QualityTab[] = (data.qualities || []).map((q: any) => ({
                id: q.id,
                qualityName: q.qualityName ?? q.quality_name ?? '',
                basePrice: q.basePrice ?? q.base_price ?? 0,
                colors: (q.colors || []).map((c: any) => ({
                    colorName: c.colorName,
                    sizes: (c.sizes || []).map((s: any) => ({
                        id: s.id,
                        size: s.size,
                        physicalStock: Math.round(Number(s.physicalStock ?? s.availableStock) || 0),
                        price: s.price != null ? Number(s.price) : null,
                    })),
                })),
            }));

            console.log('[TEST] fetchMatrix raw sizes (primer color de primer quality):', data.qualities?.[0]?.colors?.[0]?.sizes);
            console.log('[TEST] prices mapeados:', mapped.flatMap(q => q.colors.flatMap(c => c.sizes.map(s => ({ size: s.size, price: s.price })))));
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

    const handleSizePriceChange = (qualityId: string, colorName: string, sizeIdx: number, value: string) => {
        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            return {
                ...q,
                colors: q.colors.map(c => {
                    if (c.colorName !== colorName) return c;
                    const newSizes = [...c.sizes];
                    const parsed = value === "" ? null : parseFloat(value);
                    newSizes[sizeIdx] = {
                        ...newSizes[sizeIdx],
                        price: parsed === null || Number.isNaN(parsed) ? null : parsed,
                    };
                    return { ...c, sizes: newSizes };
                }),
            };
        }));
    };

    const handleRemoveSize = async (qualityId: string, colorName: string, sizeIdx: number) => {
        const quality = qualities.find(q => q.id === qualityId);
        const color = quality?.colors.find(c => c.colorName === colorName);
        const variant = color?.sizes[sizeIdx];

        if (variant?.id && product) {
            try {
                await apiClient.delete(`/products/${product.id}/variants/${variant.id}`);
            } catch (err: any) {
                const msg = err?.response?.data?.error || err?.response?.data?.message || "Error al eliminar la variante";
                toast.error(msg);
                return;
            }
        }

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
                    return { ...c, sizes: [...c.sizes, { size: sizeName, physicalStock: 0, price: null }] };
                }),
            };
        }));

        setNewSizeInputs(prev => ({ ...prev, [key]: "" }));
    };

    const handleRemoveColor = async (qualityId: string, colorName: string) => {
        if (!product) return;

        const quality = qualities.find(q => q.id === qualityId);
        const color = quality?.colors.find(c => c.colorName === colorName);
        const persistedVariants = color?.sizes.filter(s => s.id) ?? [];

        if (persistedVariants.length > 0) {
            try {
                await Promise.all(
                    persistedVariants.map(s =>
                        apiClient.delete(`/products/${product.id}/variants/${s.id}`)
                    )
                );
            } catch (err: any) {
                const msg = err?.response?.data?.error || err?.response?.data?.message || "Error al eliminar las variantes del color";
                toast.error(msg);
                return;
            }
        }

        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            return { ...q, colors: q.colors.filter(c => c.colorName !== colorName) };
        }));
    };

    const handleAddColor = (qualityId: string, colorName: string) => {
        const name = colorName.trim();
        if (!name) return;

        setQualities(prev => prev.map(q => {
            if (q.id !== qualityId) return q;
            if (q.colors.some(c => c.colorName.toLowerCase() === name.toLowerCase())) {
                toast.error(`El color "${name}" ya existe en esta calidad.`);
                return q;
            }
            return { ...q, colors: [...q.colors, { colorName: name, sizes: [] }] };
        }));

        setColorSearch(prev => ({ ...prev, [qualityId]: "" }));
        setShowColorPicker(prev => ({ ...prev, [qualityId]: false }));
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
        
        if (!productDetails.name || !productDetails.categoryId) {
            toast.error("Por favor completa el nombre y la categoría.");
            return;
        }

        setIsSaving(true);

        const stockPayload: { qualityId: string; color: string; size: string; physicalStock: number; price: number | null }[] = [];

        for (const quality of qualities) {
            for (const color of quality.colors) {
                for (const size of color.sizes) {
                    stockPayload.push({
                        qualityId: quality.id,
                        color: color.colorName,
                        size: size.size,
                        physicalStock: Math.round(Number(size.physicalStock) || 0),
                        price: size.price != null && size.price !== '' ? Number(size.price) : null,
                    });
                }
            }
        }

        try {
            await apiClient.patch(`/products/${product.id}`, {
                name: productDetails.name,
                categoryId: productDetails.categoryId,
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
                console.log('[TEST] payload enviado a PUT /stock:', JSON.stringify(stockPayload, null, 2));
                const stockRes = await apiClient.put(`/products/${product.id}/stock`, stockPayload);
                console.log('[TEST] respuesta del backend:', stockRes.status, stockRes.data);
            }

            // Recalcular totalStock local
            const newTotalStock = qualities.reduce((acc, q) =>
                acc + q.colors.reduce((cAcc, c) =>
                    cAcc + c.sizes.reduce((sAcc, s) => sAcc + (s.physicalStock || 0), 0), 0), 0
            );

            const qualityPrices = qualities.map(q => Number(q.basePrice)).filter(p => p > 0);
            const newBasePrice = qualityPrices.length > 0 ? Math.min(...qualityPrices) : 0;

            onProductSaved?.({
                ...product,
                name: productDetails.name,
                category: productDetails.category,
                categoryId: productDetails.categoryId,
                description: productDetails.description,
                totalStock: newTotalStock,
                basePrice: newBasePrice
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

    const getSortedSizes = (quality: QualityTab): string[] => {
        const allSizes = new Set<string>();
        quality.colors.forEach(c => c.sizes.forEach(s => allSizes.add(s.size)));
        const sizeList = Array.from(allSizes);
        if (sizeSortKey === 'none') return sizeList;
        if (sizeSortKey === 'name') return [...sizeList].sort(compareSizes);
        if (sizeSortKey === 'stock') {
            return [...sizeList].sort((a, b) => {
                const stockOf = (sz: string) => quality.colors.reduce((sum, c) =>
                    sum + (Number(c.sizes.find(s => s.size === sz)?.physicalStock) || 0), 0);
                return stockOf(b) - stockOf(a);
            });
        }
        if (sizeSortKey === 'price') {
            return [...sizeList].sort((a, b) => {
                const priceOf = (sz: string) => {
                    for (const c of quality.colors) {
                        const sv = c.sizes.find(s => s.size === sz);
                        if (sv) return sv.price != null && sv.price !== '' ? Number(sv.price) : Number(quality.basePrice);
                    }
                    return Number(quality.basePrice);
                };
                return priceOf(a) - priceOf(b);
            });
        }
        return sizeList;
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
                                className="relative w-24 h-24 rounded-xl border-2 border-dashed border-zinc-200 overflow-hidden flex-shrink-0 cursor-pointer group hover:border-zinc-400 transition-colors"
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
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-50">
                                        <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-200/60">
                                            <Shirt className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                                        </div>
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
                                <CategorySelect
                                    value={productDetails.categoryId}
                                    onChange={(id, name) => setProductDetails(prev => ({ ...prev, categoryId: id, category: name }))}
                                    disabled={isSaving}
                                    className="h-9 text-sm"
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
                                Todos los productos deben tener 3 calidades (Calidad 1 Premium, Calidad 2, Calidad 3) creadas automáticamente por el backend.
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
                                        {q.qualityName}
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
                                            Precio {quality.qualityName}
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

                                    {/* Sort bar — canonical is default, only extra sorts shown */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ordenar por:</span>
                                        {(['stock', 'price'] as SizeSortKey[]).map(key => (
                                            <button
                                                key={key}
                                                onClick={() => setSizeSortKey(sizeSortKey === key ? 'name' : key)}
                                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                                    sizeSortKey === key
                                                        ? 'bg-zinc-900 text-white border-zinc-900'
                                                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                                                }`}
                                            >
                                                {key === 'stock' ? 'Mayor stock' : 'Mayor precio'}
                                            </button>
                                        ))}
                                    </div>

                                    {quality.colors.length === 0 && (
                                        <p className="text-sm text-zinc-400 text-center py-4 italic">
                                            Sin colores. Agregá uno abajo.
                                        </p>
                                    )}

                                    {quality.colors.map((color) => {
                                        const newSizeKey = `${quality.id}-${color.colorName}`;
                                        const collapseKey = `${quality.id}-${color.colorName}`;
                                        const isCollapsed = collapsedColors.has(collapseKey);
                                        const sortedSizes = getSortedSizes(quality).filter(sz =>
                                            color.sizes.some(s => s.size === sz)
                                        );
                                        const totalColorStock = color.sizes.reduce((s, sz) => s + (Number(sz.physicalStock) || 0), 0);

                                        return (
                                            <div
                                                key={color.colorName}
                                                className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm"
                                            >
                                                {/* Color header — clickable to collapse */}
                                                <div
                                                    className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-b border-zinc-100 cursor-pointer select-none hover:bg-zinc-100/70 transition-colors"
                                                    onClick={() => toggleColorCollapse(quality.id, color.colorName)}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <ChevronDown
                                                            className="w-3.5 h-3.5 text-zinc-400 transition-transform duration-200"
                                                            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                                                        />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 border border-zinc-300 shrink-0" />
                                                        <span className="font-semibold text-sm text-zinc-900">{color.colorName}</span>
                                                        <span className="text-xs text-zinc-400 font-medium">
                                                            {color.sizes.length} talle{color.sizes.length !== 1 ? 's' : ''}
                                                            {totalColorStock > 0 && (
                                                                <span className="ml-1.5 text-zinc-500 font-semibold">· {totalColorStock} uds</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveColor(quality.id, color.colorName); }}
                                                        className="text-zinc-300 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50"
                                                        title="Eliminar color"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {!isCollapsed && (
                                                    <div className="flex flex-col divide-y divide-zinc-100">
                                                        {/* Size table */}
                                                        {color.sizes.length > 0 && (
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="bg-zinc-50">
                                                                        <th className="text-left py-2.5 px-5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-24">Talle</th>
                                                                        <th className="text-center py-2.5 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stock</th>
                                                                        <th className="text-center py-2.5 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Precio unit.</th>
                                                                        <th className="w-10" />
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sortedSizes.map((sizeName) => {
                                                                        const sizeIdx = color.sizes.findIndex(s => s.size === sizeName);
                                                                        if (sizeIdx === -1) return null;
                                                                        const sz = color.sizes[sizeIdx];
                                                                        return (
                                                                            <tr key={sizeName} className="group/row border-t border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                                                                                <td className="py-3.5 px-5">
                                                                                    <span className="text-sm font-black text-zinc-800 uppercase tracking-wide">{sz.size}</span>
                                                                                </td>
                                                                                <td className="py-3.5 px-4">
                                                                                    <div className="flex items-center justify-center gap-2">
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={sz.physicalStock}
                                                                                            onChange={(e) => handleStockChange(quality.id, color.colorName, sizeIdx, e.target.value)}
                                                                                            onBlur={(e) => { if (e.target.value === "") handleStockChange(quality.id, color.colorName, sizeIdx, "0"); }}
                                                                                            className="w-20 h-9 text-center font-semibold rounded-lg border-zinc-200 bg-white focus-visible:ring-1 focus-visible:ring-zinc-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                            min={0}
                                                                                        />
                                                                                        <span className="text-xs text-zinc-400 font-medium w-6">uds</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3.5 px-4">
                                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                                        <span className="text-sm text-zinc-400 font-semibold">$</span>
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={sz.price ?? ''}
                                                                                            onChange={(e) => handleSizePriceChange(quality.id, color.colorName, sizeIdx, e.target.value)}
                                                                                            placeholder={String(Number(quality.basePrice).toLocaleString('es-AR'))}
                                                                                            title={`Vacío = precio de calidad ($${Number(quality.basePrice).toLocaleString('es-AR')})`}
                                                                                            className="w-28 h-9 text-center font-semibold rounded-lg border-zinc-200 bg-white focus-visible:ring-1 focus-visible:ring-zinc-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                            min={0}
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3.5 px-3 text-right">
                                                                                    <button
                                                                                        onClick={() => handleRemoveSize(quality.id, color.colorName, sizeIdx)}
                                                                                        className="text-zinc-300 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100 p-1 rounded"
                                                                                        title="Quitar talle"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        )}

                                                        {color.sizes.length === 0 && (
                                                            <p className="text-xs text-zinc-400 italic px-5 py-4">
                                                                Sin talles. Usá los botones de abajo para agregar.
                                                            </p>
                                                        )}

                                                        {/* Add size section */}
                                                        {!showSizePicker[newSizeKey] ? (
                                                            <div className="px-5 py-2.5">
                                                                <button
                                                                    onClick={() => setShowSizePicker(prev => ({ ...prev, [newSizeKey]: true }))}
                                                                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors py-1 group"
                                                                >
                                                                    <span className="w-5 h-5 rounded-md border border-zinc-200 bg-white flex items-center justify-center group-hover:border-zinc-400 transition-colors">
                                                                        <Plus className="w-3 h-3" />
                                                                    </span>
                                                                    Agregar talle
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="px-5 py-4 bg-zinc-50/60 border-t border-zinc-100 flex flex-col gap-3">
                                                                {(() => {
                                                                    const usedSizes = new Set(color.sizes.map(s => s.size.toUpperCase()));
                                                                    const addSize = (sz: string) => {
                                                                        setQualities(prev => prev.map(q => {
                                                                            if (q.id !== quality.id) return q;
                                                                            return {
                                                                                ...q,
                                                                                colors: q.colors.map(c => {
                                                                                    if (c.colorName !== color.colorName) return c;
                                                                                    if (c.sizes.some(s => s.size.toLowerCase() === sz.toLowerCase())) return c;
                                                                                    return { ...c, sizes: [...c.sizes, { size: sz, physicalStock: 0, price: null }] };
                                                                                }),
                                                                            };
                                                                        }));
                                                                    };
                                                                    const chipClass = "h-7 px-3 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all uppercase tracking-wide shadow-sm";
                                                                    const baseAvail = SIZE_GROUPS.base.filter(s => !usedSizes.has(s));
                                                                    const ninoAvail = SIZE_GROUPS.nino.filter(s => !usedSizes.has(s));
                                                                    const espAvail  = SIZE_GROUPS.especial.filter(s => !usedSizes.has(s));
                                                                    const ninoOpen  = expandedSizeGroups[newSizeKey]?.has('nino') ?? false;
                                                                    const espOpen   = expandedSizeGroups[newSizeKey]?.has('especial') ?? false;
                                                                    return (
                                                                        <div className="flex flex-col gap-2">
                                                                            {/* Base sizes — always visible */}
                                                                            {baseAvail.length > 0 && (
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {baseAvail.map(sz => (
                                                                                        <button key={sz} onClick={() => addSize(sz)} className={chipClass}>{sz}</button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            {/* Niño group */}
                                                                            {ninoAvail.length > 0 && (
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    <button
                                                                                        onClick={() => toggleSizeGroup(newSizeKey, 'nino')}
                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider hover:text-zinc-600 transition-colors w-fit"
                                                                                    >
                                                                                        <ChevronDown className="w-3 h-3 transition-transform duration-150" style={{ transform: ninoOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                                                                        Niño ({ninoAvail.length})
                                                                                    </button>
                                                                                    {ninoOpen && (
                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {ninoAvail.map(sz => (
                                                                                                <button key={sz} onClick={() => addSize(sz)} className={chipClass}>{sz}</button>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {/* Especiales group */}
                                                                            {espAvail.length > 0 && (
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    <button
                                                                                        onClick={() => toggleSizeGroup(newSizeKey, 'especial')}
                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider hover:text-zinc-600 transition-colors w-fit"
                                                                                    >
                                                                                        <ChevronDown className="w-3 h-3 transition-transform duration-150" style={{ transform: espOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                                                                        Especiales ({espAvail.length})
                                                                                    </button>
                                                                                    {espOpen && (
                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {espAvail.map(sz => (
                                                                                                <button key={sz} onClick={() => addSize(sz)} className={chipClass}>{sz}</button>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {/* Custom input row */}
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        placeholder="Personalizado: 3XL, 42..."
                                                                        value={newSizeInputs[newSizeKey] || ""}
                                                                        onChange={(e) => setNewSizeInputs(prev => ({ ...prev, [newSizeKey]: e.target.value }))}
                                                                        onKeyDown={(e) => { if (e.key === "Enter") handleAddSize(quality.id, color.colorName); }}
                                                                        className="h-8 text-sm rounded-lg border-zinc-200 bg-white flex-1"
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleAddSize(quality.id, color.colorName)}
                                                                        className="h-8 px-3 text-xs rounded-lg border-zinc-200 text-zinc-600 hover:text-zinc-900 shrink-0"
                                                                    >
                                                                        <Plus className="w-3 h-3 mr-1" />
                                                                        Agregar
                                                                    </Button>
                                                                    <button
                                                                        onClick={() => setShowSizePicker(prev => ({ ...prev, [newSizeKey]: false }))}
                                                                        className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100"
                                                                        title="Cerrar"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Add color picker */}
                                    <div className="relative">
                                        {showColorPicker[quality.id] ? (
                                            <div className="border border-zinc-200 rounded-xl bg-white shadow-md overflow-hidden">
                                                {/* Search */}
                                                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-100">
                                                    <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                                    <input
                                                        autoFocus
                                                        placeholder="Buscar color o escribir uno nuevo..."
                                                        value={colorSearch[quality.id] || ""}
                                                        onChange={e => setColorSearch(prev => ({ ...prev, [quality.id]: e.target.value }))}
                                                        onKeyDown={e => {
                                                            if (e.key === "Enter") {
                                                                const search = (colorSearch[quality.id] || "").trim();
                                                                if (search) handleAddColor(quality.id, search);
                                                            }
                                                            if (e.key === "Escape") {
                                                                setShowColorPicker(prev => ({ ...prev, [quality.id]: false }));
                                                                setColorSearch(prev => ({ ...prev, [quality.id]: "" }));
                                                            }
                                                        }}
                                                        className="flex-1 text-sm outline-none bg-transparent placeholder:text-zinc-400 text-zinc-800"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setShowColorPicker(prev => ({ ...prev, [quality.id]: false }));
                                                            setColorSearch(prev => ({ ...prev, [quality.id]: "" }));
                                                        }}
                                                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Color list */}
                                                <div className="max-h-52 overflow-y-auto p-1.5 flex flex-col gap-0.5">
                                                    {(() => {
                                                        const search = (colorSearch[quality.id] || "").toLowerCase().trim();
                                                        const usedColors = new Set(quality.colors.map(c => c.colorName.toLowerCase()));
                                                        const filtered = PREDEFINED_COLORS.filter(c =>
                                                            c.name.toLowerCase().includes(search) && !usedColors.has(c.name.toLowerCase())
                                                        );
                                                        const showCustom = search && !PREDEFINED_COLORS.some(c => c.name.toLowerCase() === search) && !usedColors.has(search);

                                                        return (
                                                            <>
                                                                {filtered.map(color => (
                                                                    <button
                                                                        key={color.name}
                                                                        onClick={() => handleAddColor(quality.id, color.name)}
                                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors text-left w-full group"
                                                                    >
                                                                        <span
                                                                            className="w-4 h-4 rounded-full border border-zinc-200/80 shrink-0 shadow-sm"
                                                                            style={{ backgroundColor: color.hex }}
                                                                        />
                                                                        <span className="text-sm text-zinc-700 font-medium group-hover:text-zinc-900">{color.name}</span>
                                                                    </button>
                                                                ))}
                                                                {showCustom && (
                                                                    <button
                                                                        onClick={() => handleAddColor(quality.id, (colorSearch[quality.id] || "").trim())}
                                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors text-left w-full group border border-dashed border-zinc-300 mt-1"
                                                                    >
                                                                        <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0" />
                                                                        <span className="text-sm font-semibold text-zinc-600 group-hover:text-white">
                                                                            Agregar "{(colorSearch[quality.id] || "").trim()}"
                                                                        </span>
                                                                    </button>
                                                                )}
                                                                {filtered.length === 0 && !showCustom && (
                                                                    <p className="text-xs text-zinc-400 text-center py-3 italic">
                                                                        {usedColors.has(search) ? `"${colorSearch[quality.id]}" ya fue agregado` : "Sin resultados"}
                                                                    </p>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowColorPicker(prev => ({ ...prev, [quality.id]: true }))}
                                                className="w-full h-9 rounded-xl border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 text-xs font-medium"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Agregar color
                                                <ChevronDown className="w-3 h-3 ml-auto text-zinc-400" />
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
