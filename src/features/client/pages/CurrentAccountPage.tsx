import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/formatters';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    XCircle,
    ShieldAlert,
    ShoppingBag,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { AddDebtModal, type DebtAdjustMode } from '@/features/admin/components/AddDebtModal';

export function CurrentAccountPage() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [clientName, setClientName] = useState<string>('');
    
    // Determinamos el ID del cliente a consultar
    // Si hay clientId en URL, es vista administrativa. Si no, es vista propia del cliente.
    const activeClientId = clientId || user?.reference_id;
    const isAdministrativeView = !!clientId;
    // Cargar deuda manual: solo ADMIN (no VENDEDOR ni cliente).
    const canAddDebt = isAdministrativeView && user?.role === 'ADMIN';

    const [currentDebt, setCurrentDebt] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adjustMode, setAdjustMode] = useState<DebtAdjustMode | null>(null);

    const fetchLedger = useCallback(() => {
        if (!activeClientId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        apiClient.get(`/clients/${activeClientId}/ledger`)
            .then(res => {
                const ledger = res.data.ledger || [];
                const clientData = res.data.client || {};

                // Saldo recalculado del ledger (fallback).
                const realBalance = ledger.reduce((acc: number, tx: any) => {
                    const status = (tx.status || 'COMPLETED').toUpperCase();
                    if (status !== 'COMPLETED' && status !== 'APPROVED') return acc;
                    if (tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER') {
                        return acc + (tx.amount || 0);
                    } else {
                        return acc - (tx.amount || 0);
                    }
                }, 0);

                // Fuente de verdad = balance del backend (consistente en admin y cliente).
                // Busca el campo en varias formas posibles; si no viene, usa el recalculado.
                const candidates = [
                    clientData.balance, clientData.currentDebt, clientData.current_debt,
                    res.data.balance, res.data.currentDebt, res.data.current_debt,
                ];
                const backendBalance = candidates.find((v) => typeof v === 'number');
                // Si el recálculo da un número (cliente), se respeta; si da 0 (admin con
                // ledger incompleto), se usa el balance del backend.
                const finalBalance = realBalance !== 0
                    ? realBalance
                    : (typeof backendBalance === 'number' ? backendBalance : 0);

                setCurrentDebt(finalBalance);
                setClientName(clientData.name || '');
                setTransactions(ledger);
            })
            .catch(err => {
                console.error(err);
                if (err.response?.status !== 404) {
                    toast.error("Error al cargar la cuenta corriente");
                }
            })
            .finally(() => setIsLoading(false));
    }, [activeClientId]);

    useEffect(() => { fetchLedger(); }, [fetchLedger]);

    // LÓGICA DE NEGOCIO
    // En la API nueva, currentDebt > 0 significa que debe plata.
    const isDebt = currentDebt > 0;
    const balanceLabel = isDebt ? 'Saldo Deudor Actual' : 'Saldo a Favor';
    const balanceColor = isDebt ? 'text-rose-600' : 'text-emerald-600';
    const balanceBg = isDebt ? 'bg-rose-50' : 'bg-emerald-50';

    // Clases dinámicas para la tarjeta principal (Borde izquierdo y gradiente sutil)
    const cardBorderColor = isDebt ? 'border-l-rose-500' : 'border-l-emerald-500';
    const cardBgGradient = isDebt ? 'bg-gradient-to-r from-rose-50/40 to-white' : 'bg-gradient-to-r from-emerald-50/40 to-white';

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'COMPLETED':
            case 'APPROVED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aprobado
                    </div>
                );
            case 'PENDING':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200/50">
                        <Clock className="w-3.5 h-3.5" />
                        Pendiente
                    </div>
                );
            case 'REJECTED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/50">
                        <XCircle className="w-3.5 h-3.5" />
                        Rechazado
                    </div>
                );
            default:
                return null;
        }
    };

    const getConceptVisual = (tx: any) => {
        const isManual = (tx.origin || '').toUpperCase() === 'MANUAL';
        const isIncrease = tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER';
        if (isManual && isIncrease) return { Icon: ShieldAlert, color: '#d97706', bg: 'bg-amber-50', ring: 'border-amber-100' };
        if (!isIncrease) return { Icon: ArrowDownLeft, color: '#059669', bg: 'bg-emerald-50', ring: 'border-emerald-100' };
        return { Icon: ShoppingBag, color: '#42318B', bg: 'bg-[#42318B]/10', ring: 'border-[#42318B]/20' };
    };

    const completedTx = transactions.filter((tx: any) => {
        const s = (tx.status || 'COMPLETED').toUpperCase();
        return s === 'COMPLETED' || s === 'APPROVED';
    });
    const totalCargos = completedTx.filter((t: any) => t.type === 'DEBT_INCREASE' || t.type === 'ORDER').reduce((a: number, t: any) => a + (t.amount || 0), 0);
    const totalPagos = completedTx.filter((t: any) => !(t.type === 'DEBT_INCREASE' || t.type === 'ORDER')).reduce((a: number, t: any) => a + (t.amount || 0), 0);

    // Agrupa movimientos por mes (ya vienen ordenados del más reciente)
    const groups: { key: string; label: string; items: any[] }[] = [];
    for (const tx of transactions) {
        const d = new Date(tx.createdAt || tx.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(d);
        const last = groups[groups.length - 1];
        if (!last || last.key !== key) groups.push({ key, label, items: [tx] });
        else last.items.push(tx);
    }
    const dayChip = (iso: string) =>
        new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(iso));

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-4 lg:p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-5">

                {/* ── SALDO (protagonista, ancho completo) ── */}
                <div className={`rounded-2xl border border-zinc-200 border-l-[8px] ${cardBorderColor} ${cardBgGradient} p-6 lg:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/40 ${balanceBg}`}>
                            <Wallet className={`w-7 h-7 lg:w-8 lg:h-8 ${balanceColor}`} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                {isAdministrativeView ? `Cuenta de ${clientName}` : balanceLabel}
                            </span>
                            <span className={`text-5xl lg:text-6xl font-black tracking-tight ${balanceColor}`}>
                                {formatPrice(Math.abs(currentDebt))}
                            </span>
                        </div>
                    </div>
                    <span className={`self-start sm:self-center text-xs font-semibold px-3 py-1.5 rounded-full ${isDebt ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isDebt ? 'Con deuda' : 'Al día'}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

                {/* ── IZQUIERDA: Timeline de movimientos ── */}
                <div className="order-2 lg:order-1 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                        <h2 className="text-base font-bold text-zinc-900">Movimientos</h2>
                        {!isLoading && <span className="text-xs font-semibold text-zinc-400">{transactions.length}</span>}
                    </div>

                    {isLoading ? (
                        <div className="p-4 flex flex-col gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 animate-pulse shrink-0" />
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="h-3.5 bg-zinc-100 rounded animate-pulse w-1/3" />
                                        <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/4" />
                                    </div>
                                    <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-2 text-center">
                            <div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-zinc-300" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-500">Sin movimientos</p>
                            <p className="text-xs text-zinc-400">Todavía no hay actividad en esta cuenta.</p>
                        </div>
                    ) : (
                        <div className="p-2 sm:p-3">
                            {groups.map((group) => (
                                <div key={group.key} className="mb-2 last:mb-0">
                                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-3 py-2">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{group.label}</span>
                                    </div>
                                    {group.items.map((tx: any, idx: number) => {
                                        const isManual = (tx.origin || '').toUpperCase() === 'MANUAL';
                                        const isIncrease = tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER';
                                        const label = isManual
                                            ? (isIncrease ? 'Deuda cargada por administrador' : 'Ajuste a favor (administrador)')
                                            : (isIncrease ? 'Nuevo Pedido' : 'Reporte de Pago');
                                        const cv = getConceptVisual(tx);
                                        return (
                                            <div key={tx.id || idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                                                <div className={`w-10 h-10 rounded-xl ${cv.bg} border ${cv.ring} flex items-center justify-center shrink-0`}>
                                                    <cv.Icon className="w-5 h-5" style={{ color: cv.color }} />
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm text-zinc-900">{tx.description || label}</span>
                                                        {isManual && (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                                                <ShieldAlert className="w-2.5 h-2.5" /> Manual
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                                                        <span>{dayChip(tx.createdAt || tx.date)}</span>
                                                        <span>·</span>
                                                        {getStatusBadge(tx.status || 'COMPLETED')}
                                                    </div>
                                                    {isManual && tx.reason && (
                                                        <span className="text-xs text-zinc-500 italic truncate">“{tx.reason}”{tx.createdBy ? ` — ${tx.createdBy}` : ''}</span>
                                                    )}
                                                </div>
                                                <span className={`text-sm font-bold whitespace-nowrap flex items-center gap-1 ${isIncrease ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {isIncrease ? '+' : '−'}{formatPrice(tx.amount || 0)}
                                                    {isIncrease ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── DERECHA: Resumen + acciones (sticky) ── */}
                <div className="order-1 lg:order-2 lg:sticky lg:top-6 flex flex-col gap-4">

                    {/* Acciones */}
                    {!isAdministrativeView && (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm flex flex-col gap-3">
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-sm font-bold text-zinc-900">¿Realizaste un pago?</h4>
                                <p className="text-xs text-zinc-500 leading-tight">Informalo para agilizar el despacho.</p>
                            </div>
                            <Button onClick={() => navigate('/portal/pagos')} className="w-full rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 h-10 font-bold">
                                Informar Pago
                            </Button>
                        </div>
                    )}
                    {canAddDebt && (
                        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm flex flex-col gap-3">
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-sm font-bold text-zinc-900">Ajuste de cuenta</h4>
                                <p className="text-xs text-zinc-500 leading-tight">Aumentar = debe más · Reducir = debe menos.</p>
                            </div>
                            <Button onClick={() => setAdjustMode('debt')} className="w-full rounded-xl bg-rose-600 text-white hover:bg-rose-700 h-10 font-bold gap-2">
                                <ArrowUpRight className="w-4 h-4" /> Aumentar deuda
                            </Button>
                            <Button onClick={() => setAdjustMode('credit')} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 h-10 font-bold gap-2">
                                <ArrowDownLeft className="w-4 h-4" /> Reducir deuda
                            </Button>
                        </div>
                    )}

                    {/* Mini-stats cargos / pagos */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3 text-rose-500" /> Cargos
                            </span>
                            <span className="text-base font-black text-rose-600 leading-tight">{formatPrice(totalCargos)}</span>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <ArrowDownLeft className="w-3 h-3 text-emerald-500" /> Pagos
                            </span>
                            <span className="text-base font-black text-emerald-600 leading-tight">{formatPrice(totalPagos)}</span>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            {canAddDebt && activeClientId && (
                <AddDebtModal
                    isOpen={adjustMode !== null}
                    onClose={() => setAdjustMode(null)}
                    clientId={activeClientId}
                    clientName={clientName}
                    currentDebt={currentDebt}
                    mode={adjustMode ?? 'debt'}
                    onDone={() => fetchLedger()}
                />
            )}
        </div>
    );
}