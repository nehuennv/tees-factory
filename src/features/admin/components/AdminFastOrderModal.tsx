import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface AdminFastOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminFastOrderModal({ isOpen, onClose }: AdminFastOrderModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        client: '',
        details: '',
        amount: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!formData.client || !formData.details) {
            toast.error('Cliente y detalles son obligatorios');
            return;
        }

        setIsLoading(true);

        try {
            await apiClient.post('/orders/express', {
                clientName: formData.client,
                totalAmount: formData.amount ? Number(formData.amount) : 0,
                observations: formData.details
            });
            
            toast.success('Pedido Exprés creado', {
                description: `Pedido cargado en Novedades para ${formData.client}.`,
            });
            
            onClose();
            setFormData({ client: '', details: '', amount: '' });
            window.location.reload(); // Simple refetch strategy
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al crear el pedido exprés');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nuevo Pedido Exprés (Admin)"
            description="Carga rápida de pedido telefónico o por mostrador directo a preparación."
            maxWidth="sm"
            primaryAction={{
                label: 'Ingresar al Tablero',
                onClick: handleSave,
                isLoading: isLoading,
                disabled: isLoading || !formData.client || !formData.details
            }}
            secondaryAction={{
                label: 'Cancelar',
                onClick: onClose,
                disabled: isLoading
            }}
        >
            <div className="flex flex-col gap-5 py-2">
                <div className="flex flex-col gap-2">
                    <label htmlFor="client" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cliente / Razón Social *</label>
                    <Input
                        id="client"
                        name="client"
                        placeholder="Ej. Comercial Los Ángeles"
                        value={formData.client}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="amount" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Monto Total Estimado ($)</label>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="details" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Detalle del Pedido *</label>
                    <Textarea
                        id="details"
                        name="details"
                        placeholder="Ej. 10x Remeras Oversize Negras XXL..."
                        value={formData.details}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 min-h-[100px] resize-none"
                    />
                </div>
            </div>
        </Modal>
    );
}
