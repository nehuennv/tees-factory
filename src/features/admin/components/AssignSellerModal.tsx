import React, { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { User, UserX, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Seller {
    id: string;
    name: string;
}

const MOCK_SELLERS: Seller[] = [
    { id: '1', name: 'Juan Pérez' },
    { id: '2', name: 'María García' },
    { id: '3', name: 'Carlos Rodríguez' },
];

interface AssignSellerModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    currentSellerId?: string;
    onAssign: (sellerId: string | null) => void;
}

export const AssignSellerModal: React.FC<AssignSellerModalProps> = ({
    isOpen,
    onClose,
    clientName,
    currentSellerId,
    onAssign,
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(currentSellerId || null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 800));
        onAssign(selectedId);
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Asignar Vendedor"
            description={`Selecciona el vendedor para ${clientName}`}
            maxWidth="sm"
            primaryAction={{
                label: "Confirmar Asignación",
                onClick: handleSave,
                isLoading: isSaving
            }}
            secondaryAction={{
                label: "Cancelar",
                onClick: onClose,
                variant: "ghost"
            }}
        >
            <div className="flex flex-col gap-2">
                {/* Opción Sin Vendedor */}
                <button
                    onClick={() => setSelectedId(null)}
                    className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left",
                        selectedId === null
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/10"
                            : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            selectedId === null ? "bg-white/10" : "bg-zinc-100"
                        )}>
                            <UserX className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold leading-tight">Sin Vendedor</p>
                            <p className={cn(
                                "text-[11px] mt-0.5",
                                selectedId === null ? "text-zinc-400" : "text-zinc-500"
                            )}>El cliente no tendrá un vendedor asignado</p>
                        </div>
                    </div>
                    {selectedId === null && <Check className="w-5 h-5" />}
                </button>

                <div className="h-px bg-zinc-100 my-2" />
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1 ml-1">Vendedores Disponibles</p>

                {/* Lista de Vendedores */}
                {MOCK_SELLERS.map((seller) => (
                    <button
                        key={seller.id}
                        onClick={() => setSelectedId(seller.id)}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left",
                            selectedId === seller.id
                                ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/10"
                                : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                selectedId === seller.id ? "bg-white/10" : "bg-zinc-100"
                            )}>
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-tight">{seller.name}</p>
                                <p className={cn(
                                    "text-[11px] mt-0.5",
                                    selectedId === seller.id ? "text-zinc-400" : "text-zinc-500"
                                )}>Representante de ventas activo</p>
                            </div>
                        </div>
                        {selectedId === seller.id && <Check className="w-5 h-5" />}
                    </button>
                ))}
            </div>
        </Modal>
    );
};
