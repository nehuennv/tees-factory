import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import type { Client } from '@/types/client';

interface EditClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
}

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        cuit: '',
        email: '',
        phone: '',
        gender: '',
        location: '',
    });

    // Cargar los datos del cliente cuando se abre
    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name ?? '',
                cuit: client.cuit ?? '',
                email: client.email ?? '',
                phone: client.phone ?? '',
                gender: client.gender ?? '',
                location: client.location ?? '',
            });
        }
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.cuit) {
            toast.error('Nombre y CUIT son obligatorios');
            return;
        }
        if (!client) return;

        setIsLoading(true);

        try {
            await apiClient.put(`/clients/${client.id}`, formData);
            toast.success('Cliente actualizado', {
                description: `Los datos de ${formData.name} fueron modificados con éxito.`,
            });
            onClose();
            window.location.reload(); // Simple refetch strategy
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al actualizar el cliente');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Datos del Cliente"
            description="Modifica la información de contacto o facturación del cliente."
            maxWidth="md"
            primaryAction={{
                label: 'Guardar Cambios',
                onClick: handleSave,
                isLoading: isLoading,
                disabled: isLoading || !formData.name || !formData.cuit
            }}
            secondaryAction={{
                label: 'Cancelar',
                onClick: onClose,
                disabled: isLoading
            }}
        >
            <div className="flex flex-col gap-5 py-2">
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Razón Social o Fantasía *</label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Ej. Tienda Los Álamos"
                        value={formData.name}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="cuit" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CUIT / DNI *</label>
                    <Input
                        id="cuit"
                        name="cuit"
                        placeholder="Ej. 30-12345678-9"
                        value={formData.cuit}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email de Contacto <span className="text-zinc-400 font-normal normal-case tracking-normal">(opcional)</span></label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Ej. compras@losalamos.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teléfono / WhatsApp <span className="text-zinc-400 font-normal normal-case tracking-normal">(opcional)</span></label>
                    <Input
                        id="phone"
                        name="phone"
                        placeholder="Ej. +54 9 11 1234-5678"
                        value={formData.phone}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="gender" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Género <span className="text-zinc-400 font-normal normal-case tracking-normal">(opcional)</span></label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
                    >
                        <option value="">Sin especificar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="location" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ubicación <span className="text-zinc-400 font-normal normal-case tracking-normal">(opcional)</span></label>
                    <Input
                        id="location"
                        name="location"
                        placeholder="Ej. Buenos Aires, Mendoza..."
                        value={formData.location}
                        onChange={handleChange}
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>
            </div>
        </Modal>
    );
}
