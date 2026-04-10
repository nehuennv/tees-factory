import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateProductModal({ isOpen, onClose }: CreateProductModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        category: '',
        image: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.sku || !formData.price || !formData.category) {
            toast.error('Complete los campos obligatorios (*)');
            return;
        }

        setIsLoading(true);

        apiClient.post('/products', {
            name: formData.name,
            category: formData.category,
            description: '', // default empty
            basePrice: Number(formData.price) // Sending what we have just in case
        })
            .then(() => {
                toast.success('Producto creado con éxito', {
                    description: `${formData.name} se ha añadido al catálogo.`,
                });
                onClose();
                setFormData({ name: '', sku: '', price: '', category: '', image: '' });
                // We could dispatch an event or call a window refresh safely if needed
                window.location.reload(); 
            })
            .catch((err) => {
                toast.error('Error al crear producto');
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Nuevo Producto"
            description="Ingresa los datos base para añadir un nuevo artículo al catálogo de Tees Factory."
            maxWidth="md"
            primaryAction={{
                label: 'Crear Producto',
                onClick: handleSave,
                isLoading: isLoading,
                disabled: isLoading || !formData.name || !formData.sku || !formData.price || !formData.category
            }}
            secondaryAction={{
                label: 'Cancelar',
                onClick: onClose,
                disabled: isLoading
            }}
        >
            <div className="flex flex-col gap-5 py-2">
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del Producto *</label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Ej. Remera Oversize Classic"
                        value={formData.name}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="sku" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">SKU / ID *</label>
                        <Input
                            id="sku"
                            name="sku"
                            placeholder="Ej. REM-OVER-C"
                            value={formData.sku}
                            onChange={handleChange}
                            className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                        />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="category" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoría *</label>
                        <Input
                            id="category"
                            name="category"
                            placeholder="Ej. Remeras, Buzos..."
                            value={formData.category}
                            onChange={handleChange}
                            className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="price" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Precio Sugerido *</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">$</span>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={handleChange}
                            className="rounded-xl pl-8 bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="image" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">URL de Imagen (Opcional)</label>
                    <Input
                        id="image"
                        name="image"
                        placeholder="https://..."
                        value={formData.image}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>
            </div>
        </Modal>
    );
}
