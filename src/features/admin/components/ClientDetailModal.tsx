import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Wallet, Pencil, Trash2, MapPin, User2, Phone, Mail, FileText, Building2, X, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { useOrderDraftStore } from '@/store/orderDraftStore';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import type { Client } from '@/types/client';
import { AddDebtModal, type DebtAdjustMode } from './AddDebtModal';

interface ClientDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n?.[0] ?? '').join('').toUpperCase() || '?';
};

const GENDER_LABELS: Record<string, string> = {
    MALE: 'Masculino', FEMALE: 'Femenino', OTHER: 'Otro',
    male: 'Masculino', female: 'Femenino', other: 'Otro',
};
const normalizeGender = (g?: string) => g ? (GENDER_LABELS[g] ?? g) : undefined;

const AVATAR_COLORS = ['#42318B', '#C44A87', '#2DBDD0', '#EFBC4E', '#10b981', '#6366f1'];
const getAvatarColor = (name: string) => {
    if (!name) return AVATAR_COLORS[0];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(iso));

function InfoItem({ icon: Icon, label, value, copyable }: { icon: React.ElementType; label: string; value?: string | null; copyable?: boolean }) {
    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        toast.success('Copiado al portapapeles');
    };
    return (
        <div className="flex items-start gap-2.5 min-w-0">
            <Icon className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider leading-none mb-0.5">{label}</span>
                {value ? (
                    copyable ? (
                        <button onClick={handleCopy} className="text-sm text-zinc-800 font-medium truncate text-left hover:text-zinc-500 transition-colors cursor-copy" title={`Copiar: ${value}`}>
                            {value}
                        </button>
                    ) : (
                        <span className="text-sm text-zinc-800 font-medium truncate" title={value}>{value}</span>
                    )
                ) : (
                    <span className="text-sm text-zinc-300 italic">Sin registrar</span>
                )}
            </div>
        </div>
    );
}

export function ClientDetailModal({ isOpen, onClose, client, onEdit, onDelete }: ClientDetailModalProps) {
    const navigate = useNavigate();
    const startDraft = useOrderDraftStore((s) => s.startDraft);
    const role = useAuthStore((s) => s.user?.role);
    const isAdmin = role === 'ADMIN';

    const [movements, setMovements] = useState<any[]>([]);
    const [balance, setBalance] = useState<number>(client?.balance ?? 0);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [adjustMode, setAdjustMode] = useState<DebtAdjustMode | null>(null);

    const fetchLedger = useCallback(() => {
        if (!client) return;
        setLoadingLedger(true);
        apiClient.get(`/clients/${client.id}/ledger`)
            .then(res => {
                const ledger = res.data.ledger || [];
                const realBalance = ledger.reduce((acc: number, tx: any) => {
                    const status = (tx.status || 'COMPLETED').toUpperCase();
                    if (status !== 'COMPLETED' && status !== 'APPROVED') return acc;
                    return (tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER')
                        ? acc + (tx.amount || 0)
                        : acc - (tx.amount || 0);
                }, 0);
                setMovements(ledger);
                setBalance(realBalance);
            })
            .catch(() => { /* silencioso: si falla, queda el balance del listado */ })
            .finally(() => setLoadingLedger(false));
    }, [client]);

    useEffect(() => {
        if (isOpen && client) {
            setBalance(client.balance ?? 0);
            setMovements([]);
            fetchLedger();
        }
    }, [isOpen, client, fetchLedger]);

    if (!client) return null;

    const isDebt = balance > 0;
    const avatarColor = getAvatarColor(client.name);

    const handleNewOrder = () => { onClose(); startDraft(client.id, client.name); navigate(`/ventas/pedido/${client.id}`); };
    const handleViewAccount = () => {
        onClose();
        const prefix = isAdmin ? '/admin' : '/ventas';
        navigate(`${prefix}/clientes/${client.id}/cuenta`);
    };
    const handleEdit = () => { onClose(); onEdit(client); };
    const handleDelete = () => { onClose(); onDelete(client); };

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" hideCloseButton>
            <div className="flex flex-col">

                {/* Encabezado */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                        {getInitials(client.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-zinc-900 leading-tight truncate">{client.name}</p>
                        <p className="text-xs font-mono mt-0.5">
                            {client.cuit ? <span className="text-zinc-400">CUIT {client.cuit}</span> : <span className="text-zinc-300 italic">CUIT no registrado</span>}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors shrink-0" aria-label="Cerrar">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Banner de saldo */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-4 ${isDebt ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDebt ? 'text-red-400' : 'text-emerald-500'}`}>
                            {isDebt ? 'Deuda actual' : 'Saldo a favor'}
                        </span>
                        <span className={`text-xl font-bold mt-0.5 ${isDebt ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatCurrency(Math.abs(balance))}
                        </span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isDebt ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isDebt ? 'Con deuda' : 'Al día'}
                    </span>
                </div>

                {/* Acciones de cuenta — solo Admin */}
                {isAdmin && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <Button onClick={() => setAdjustMode('debt')} className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 h-10 text-sm font-semibold gap-2">
                            <ArrowUpRight className="w-4 h-4" /> Aumentar deuda
                        </Button>
                        <Button onClick={() => setAdjustMode('credit')} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 h-10 text-sm font-semibold gap-2">
                            <ArrowDownLeft className="w-4 h-4" /> Reducir deuda
                        </Button>
                    </div>
                )}

                {/* Movimientos recientes */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Últimos movimientos</span>
                        <button onClick={handleViewAccount} className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Ver todo →</button>
                    </div>
                    <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
                        {loadingLedger ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                                    <div className="h-3 w-32 bg-zinc-100 rounded animate-pulse" />
                                    <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                                </div>
                            ))
                        ) : movements.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic px-3 py-4 text-center">Sin movimientos registrados.</p>
                        ) : (
                            movements.slice(0, 5).map((tx: any, i: number) => {
                                const isManual = (tx.origin || '').toUpperCase() === 'MANUAL';
                                const isIncrease = tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER';
                                const label = isManual
                                    ? (isIncrease ? 'Deuda cargada por admin' : 'Ajuste a favor')
                                    : (isIncrease ? 'Pedido' : 'Pago');
                                return (
                                    <div key={tx.id || i} className="flex items-center justify-between px-3 py-2.5 gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isManual && <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-zinc-800 truncate">{tx.description || label}</span>
                                                <span className="text-[10px] text-zinc-400">{label} · {formatDate(tx.createdAt || tx.date)}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold whitespace-nowrap flex items-center gap-0.5 ${isIncrease ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {isIncrease ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                            {formatCurrency(tx.amount || 0)}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
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
                        <ShoppingBag className="w-4 h-4" /> Nuevo Pedido
                    </Button>
                    <Button onClick={handleViewAccount} variant="outline" className="rounded-xl border-zinc-200 h-10 text-sm font-semibold gap-2 text-zinc-700">
                        <Wallet className="w-4 h-4" /> Cuenta Corriente
                    </Button>
                    <Button onClick={handleEdit} variant="outline" className="rounded-xl border-zinc-200 h-10 text-sm font-semibold gap-2 text-zinc-700">
                        <Pencil className="w-4 h-4" /> Editar Datos
                    </Button>
                    <Button onClick={handleDelete} variant="outline" className="rounded-xl border-red-100 h-10 text-sm font-semibold gap-2 text-red-600 hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </Button>
                </div>
            </div>
        </Modal>

        {isAdmin && (
            <AddDebtModal
                isOpen={adjustMode !== null}
                onClose={() => setAdjustMode(null)}
                clientId={client.id}
                clientName={client.name}
                currentDebt={balance}
                mode={adjustMode ?? 'debt'}
                onDone={() => fetchLedger()}
            />
        )}
        </>
    );
}
