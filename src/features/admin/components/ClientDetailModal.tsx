import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Wallet, Pencil, Trash2, MapPin, User2, Phone, Mail, FileText, Building2, X } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { useOrderDraftStore } from '@/store/orderDraftStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { Client } from '@/types/client';

interface ClientDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n?.[0] ?? '').join('').toUpperCase() || '?';
};

const GENDER_LABELS: Record<string, string> = {
    MALE: 'Masculino',
    FEMALE: 'Femenino',
    OTHER: 'Otro',
    male: 'Masculino',
    female: 'Femenino',
    other: 'Otro',
};
const normalizeGender = (g?: string) => g ? (GENDER_LABELS[g] ?? g) : undefined;

const AVATAR_COLORS = ['#42318B', '#C44A87', '#2DBDD0', '#EFBC4E', '#10b981', '#6366f1'];
const getAvatarColor = (name: string) => {
    if (!name) return AVATAR_COLORS[0];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

function InfoItem({ icon: Icon, label, value, copyable }: { icon: React.ElementType; label: string; value?: string | null; copyable?: boolean }) {
    if (!value) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast.success('Copiado al portapapeles');
    };

    return (
        <div className="flex items-start gap-2.5 min-w-0">
            <Icon className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider leading-none mb-0.5">{label}</span>
                {copyable ? (
                    <button
                        onClick={handleCopy}
                        className="text-sm text-zinc-800 font-medium truncate text-left hover:text-zinc-500 transition-colors cursor-copy"
                        title={`Copiar: ${value}`}
                    >
                        {value}
                    </button>
                ) : (
                    <span className="text-sm text-zinc-800 font-medium truncate" title={value}>{value}</span>
                )}
            </div>
        </div>
    );
}

export function ClientDetailModal({ isOpen, onClose, client, onEdit, onDelete }: ClientDetailModalProps) {
    const navigate = useNavigate();
    const startDraft = useOrderDraftStore((s) => s.startDraft);

    if (!client) return null;

    const isDebt = client.balance > 0;
    const avatarColor = getAvatarColor(client.name);

    const handleNewOrder = () => {
        onClose();
        startDraft(client.id, client.name);
        navigate(`/ventas/pedido/${client.id}`);
    };

    const handleViewAccount = () => {
        onClose();
        const user = useAuthStore.getState().user;
        const prefix = user?.role === 'ADMIN' ? '/admin' : '/ventas';
        navigate(`${prefix}/clientes/${client.id}/cuenta`);
    };

    const handleEdit = () => {
        onClose();
        onEdit(client);
    };

    const handleDelete = () => {
        onClose();
        onDelete(client);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" hideCloseButton>
            <div className="flex flex-col">

                {/* Encabezado */}
                <div className="flex items-center gap-4 mb-5">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
                        style={{ backgroundColor: avatarColor }}
                    >
                        {getInitials(client.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-zinc-900 leading-tight truncate">{client.name}</p>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">CUIT {client.cuit}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors shrink-0"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Banner de saldo */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-5 ${isDebt ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDebt ? 'text-red-400' : 'text-emerald-500'}`}>Saldo actual</span>
                        <span className={`text-xl font-bold mt-0.5 ${isDebt ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatCurrency(client.balance)}
                        </span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isDebt ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isDebt ? 'Con deuda' : 'Al día'}
                    </span>
                </div>

                {/* Info de contacto */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
                    <InfoItem icon={Phone} label="Teléfono" value={client.phone} copyable />
                    <InfoItem icon={Mail} label="Email" value={client.email} copyable />
                    <InfoItem icon={Building2} label="Dirección" value={client.address} />
                    <InfoItem icon={MapPin} label="Ubicación" value={client.location} />
                    <InfoItem icon={User2} label="Género" value={normalizeGender(client.gender)} />
                </div>

                {client.notes && (
                    <div className="flex items-start gap-2.5 bg-zinc-50 rounded-xl px-4 py-3 mb-5">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-zinc-500 italic leading-relaxed">"{client.notes}"</p>
                    </div>
                )}

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button onClick={handleNewOrder} className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 h-10 text-sm font-semibold gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Nuevo Pedido
                    </Button>
                    <Button onClick={handleViewAccount} variant="outline" className="rounded-xl border-zinc-200 h-10 text-sm font-semibold gap-2 text-zinc-700">
                        <Wallet className="w-4 h-4" />
                        Cuenta Corriente
                    </Button>
                    <Button onClick={handleEdit} variant="outline" className="rounded-xl border-zinc-200 h-10 text-sm font-semibold gap-2 text-zinc-700">
                        <Pencil className="w-4 h-4" />
                        Editar Datos
                    </Button>
                    <Button onClick={handleDelete} variant="outline" className="rounded-xl border-red-100 h-10 text-sm font-semibold gap-2 text-red-600 hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                    </Button>
                </div>

            </div>
        </Modal>
    );
}
