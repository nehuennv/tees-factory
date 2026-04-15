import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductCreated?: (product: any) => void;
}

export function CreateProductModal({ isOpen, onClose, onProductCreated }: CreateProductModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetForm = () => setFormData({ name: '', category: '', description: '' });


    const handleSave = () => {
        if (!formData.name || !formData.category) {
            toast.error('Completá los campos obligatorios (*)');
            return;
        }

        setIsLoading(true);

        apiClient.post('/products', {
            name: formData.name,
            category: formData.category,
            description: formData.description,
        })
            .then((res) => {
                toast.success('Producto creado', {
                    description: `"${formData.name}" se añadió al catálogo.`,
                });
                onProductCreated?.(res.data);
                onClose();
                resetForm();
            })
            .catch((err) => {
                toast.error(err.response?.data?.error || 'Error al crear el producto');
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); resetForm(); }}
            title="Crear Nuevo Producto"
            description="Ingresá los datos base para añadir un nuevo artículo al catálogo."
            maxWidth="md"
            primaryAction={{
                label: 'Crear Producto',
                onClick: handleSave,
                isLoading: isLoading,
                disabled: isLoading || !formData.name || !formData.category,

            }}
            secondaryAction={{
                label: 'Cancelar',
                onClick: () => { onClose(); resetForm(); },
                disabled: isLoading,
            }}
        >
            <div className="flex flex-col gap-5 py-2">
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Nombre del Producto <span className="text-red-500">*</span>
                    </label>
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
                        <label htmlFor="category" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            Categoría <span className="text-red-500">*</span>
                        </label>
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
                    <label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Descripción <span className="text-zinc-400 font-normal normal-case">(opcional)</span>
                    </label>
                    <Input
                        id="description"
                        name="description"
                        placeholder="Ej. Algodón 100%, corte regular..."
                        value={formData.description}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

            </div>
        </Modal>
    );
}
