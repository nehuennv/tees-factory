import { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "./CategorySelect";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

interface ProductEditModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
}

export function ProductEditModal({ product, isOpen, onClose, onSave }: ProductEditModalProps) {
    const [formData, setFormData] = useState<Partial<Product>>({});

    useEffect(() => {
        if (product && isOpen) {
            setFormData(product);
        }
    }, [product, isOpen]);

    if (!product) return null;

    const handleChange = (field: keyof Product, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.categoryId) {
            toast.error("Por favor completa los campos obligatorios.");
            return;
        }

        try {
            await apiClient.patch(`/products/${product.id}`, {
                name: formData.name,
                categoryId: formData.categoryId,
                description: formData.description,
            });

            toast.success("Producto actualizado");
            onSave({ ...product, ...formData } as Product);
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || "Error al actualizar producto";
            toast.error(msg);
            console.error(err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white rounded-2xl">
                <div className="p-6 border-b border-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-zinc-900">
                            Editar Producto
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-sm mt-1">
                            Modifica la información base de {product.name}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto mt-2 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-zinc-900">Nombre del Producto *</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className="h-11 rounded-xl border-zinc-200 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all bg-white"
                                placeholder="Ej: Remera Lisa Premium Algodón"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-zinc-900">Categoría *</Label>
                            <CategorySelect
                                value={formData.categoryId || ""}
                                onChange={(id, name) => setFormData(prev => ({ ...prev, categoryId: id, category: name }))}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description" className="text-sm font-medium text-zinc-900">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ""}
                                onChange={(e) => handleChange("description", e.target.value)}
                                className="min-h-[100px] resize-none rounded-xl border-zinc-200 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all bg-white"
                                placeholder="Descripción detallada del producto..."
                            />
                        </div>

                    </div>
                </div>

                <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 rounded-b-2xl">
                    <DialogFooter className="flex sm:justify-end gap-3 flex-col sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 h-11 px-6 font-medium w-full sm:w-auto transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-6 font-medium w-full sm:w-auto shadow-sm transition-all"
                        >
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
