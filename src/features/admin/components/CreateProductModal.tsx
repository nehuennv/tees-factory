import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { CategorySelect } from './CategorySelect';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { CheckCircle2, ArrowRight, Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductCreated?: (product: any) => void;
    onGoToProduct?: (product: any) => void;
}

export function CreateProductModal({ isOpen, onClose, onProductCreated, onGoToProduct }: CreateProductModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdProduct, setCreatedProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetAll = () => {
        setFormData({ name: '', categoryId: '', description: '' });
        setShowSuccess(false);
        setCreatedProduct(null);
    };

    const handleClose = () => {
        resetAll();
        onClose();
    };

    const handleSave = () => {
        if (!formData.name || !formData.categoryId) {
            toast.error('Completá los campos obligatorios (*)');
            return;
        }

        setIsLoading(true);

        apiClient.post('/products', {
            name: formData.name,
            categoryId: formData.categoryId,
            description: formData.description,
        })
            .then((res) => {
                const product = res.data;
                onProductCreated?.(product);
                setCreatedProduct(product);
                setShowSuccess(true);
            })
            .catch((err) => {
                toast.error(err.response?.data?.error || 'Error al crear el producto');
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleGoToProduct = () => {
        handleClose();
        onGoToProduct?.(createdProduct);
    };

    const handleCreateAnother = () => {
        resetAll();
    };

    // --- Success screen ---
    if (showSuccess && createdProduct) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} maxWidth="md">
                <div className="flex flex-col items-center text-center gap-5 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">¡Producto creado!</h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            <span className="font-semibold text-zinc-700">"{createdProduct.name}"</span> fue añadido al catálogo.
                        </p>
                    </div>

                    <div className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-left">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Próximo paso recomendado</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Configurá las <span className="font-semibold text-zinc-800">calidades, precios, colores y talles</span> del producto para que aparezca correctamente en el catálogo.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <Button
                            onClick={handleGoToProduct}
                            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold gap-2"
                        >
                            <Settings2 className="w-4 h-4" />
                            Configurar variantes y precios
                            <ArrowRight className="w-4 h-4 ml-auto" />
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCreateAnother}
                                className="flex-1 h-10 rounded-xl border-zinc-200 text-zinc-700 font-semibold gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Crear otro
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                className="flex-1 h-10 rounded-xl text-zinc-500 font-semibold"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }

    // --- Create form ---
    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Nuevo Producto"
            description="Ingresá los datos base para añadir un nuevo artículo al catálogo."
            maxWidth="md"
            primaryAction={{
                label: 'Crear Producto',
                onClick: handleSave,
                isLoading: isLoading,
                disabled: isLoading || !formData.name || !formData.categoryId,
            }}
            secondaryAction={{
                label: 'Cancelar',
                onClick: handleClose,
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

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Categoría <span className="text-red-500">*</span>
                    </label>
                    <CategorySelect
                        value={formData.categoryId}
                        onChange={(id) => setFormData(prev => ({ ...prev, categoryId: id }))}
                        disabled={isLoading}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            Descripción <span className="text-zinc-400 font-normal normal-case">(opcional)</span>
                        </label>
                        <span className={`text-xs font-medium ${formData.description.length >= 500 ? 'text-red-500' : 'text-zinc-400'}`}>
                            {formData.description.length}/500
                        </span>
                    </div>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Ej. Algodón 100%, corte regular..."
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={500}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 resize-none transition-all"
                    />
                </div>
            </div>
        </Modal>
    );
}
