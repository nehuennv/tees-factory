import { useState, useEffect } from 'react';
import { PaymentReportModal } from '../components/PaymentReportModal';
import { formatPrice } from '@/lib/formatters';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react';

import { useParams } from 'react-router-dom';

export function CurrentAccountPage() {
    const { clientId } = useParams();
    const { user } = useAuthStore();
    const [clientName, setClientName] = useState<string>('');
    
    // Determinamos el ID del cliente a consultar
    // Si hay clientId en URL, es vista administrativa. Si no, es vista propia del cliente.
    const activeClientId = clientId || user?.reference_id;
    const isAdministrativeView = !!clientId;

    const [currentDebt, setCurrentDebt] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!activeClientId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        apiClient.get(`/clients/${activeClientId}/ledger`)
            .then(res => {
                const ledger = res.data.ledger || [];
                const clientData = res.data.client || {};
                
                // Si el backend nos manda 0 de deuda pero hay movimientos aprobados,
                // calculamos el balance real nosotros para mostrar el "Saldo a Favor".
                const realBalance = ledger.reduce((acc: number, tx: any) => {
                    const status = (tx.status || 'COMPLETED').toUpperCase();
                    if (status !== 'COMPLETED' && status !== 'APPROVED') return acc;
                    
                    if (tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER') {
                        return acc + (tx.amount || 0);
                    } else {
                        return acc - (tx.amount || 0);
                    }
                }, 0);

                // Priorizamos el cálculo real si el del backend es 0 o menor
                setCurrentDebt(realBalance);
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

    const getAmountDisplay = (amount: number, type: string) => {
        if (type === 'DEBT_INCREASE' || type === 'ORDER') {
            return (
                <div className="flex items-center justify-end gap-1.5 text-zinc-900 font-bold whitespace-nowrap">
                    <span>{formatPrice(amount)}</span>
                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                </div>
            );
        }

        return (
            <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold whitespace-nowrap">
                <span>{formatPrice(amount)}</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            </div>
        );
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50/50 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-20">

                {/* Hero Card Mejorada con borde dinámico */}
                <Card className={`shadow-md overflow-hidden rounded-3xl border border-zinc-200 border-l-[8px] ${cardBorderColor}`}>
                    <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 pl-10 ${cardBgGradient}`}>
                        <div className="flex items-center gap-6">
                            {/* Ícono de Billetera dinámico */}
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/40 shadow-sm ${balanceBg}`}>
                                <Wallet className={`w-8 h-8 ${balanceColor}`} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold tracking-widest text-zinc-500 uppercase">
                                    {isAdministrativeView ? `Cuenta de ${clientName}` : balanceLabel}
                                </span>
                                <span className={`text-5xl md:text-6xl font-black tracking-tight ${balanceColor}`}>
                                    {formatPrice(Math.abs(currentDebt))}
                                </span>
                            </div>
                        </div>

                        <div className="w-full md:w-[320px] shrink-0">
                            {/* Acción de Reportar Pago solo visible para el cliente */}
                            {!isAdministrativeView && (
                                <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 p-5 shadow-sm flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-sm font-bold text-zinc-900">¿Realizaste un pago?</h4>
                                        <p className="text-xs text-zinc-500 leading-tight">Infórmalo ahora para agilizar el despacho de tus pedidos.</p>
                                    </div>
                                    <PaymentReportModal />
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Tabla de Movimientos en formato SaaS */}
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 px-1">
                        Historial de Operaciones
                    </h2>

                    <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold text-zinc-500 h-12">Fecha</TableHead>
                                        <TableHead className="font-semibold text-zinc-500 h-12">Concepto</TableHead>
                                        <TableHead className="font-semibold text-zinc-500 h-12">Estado</TableHead>
                                        <TableHead className="font-semibold text-zinc-500 h-12 text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                                                <div className="flex justify-center mb-4">
                                                    <span className="w-6 h-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                                                </div>
                                                Cargando historial...
                                            </TableCell>
                                        </TableRow>
                                    ) : transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                                                No hay movimientos registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx: any, idx: number) => (
                                            <TableRow key={tx.id || idx} className="hover:bg-zinc-50/50 transition-colors group">
                                                <TableCell className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                                                    {formatDate(tx.createdAt || tx.date)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-zinc-900">{tx.description || 'Movimiento'}</span>
                                                        <span className="text-xs text-zinc-400 font-medium mt-0.5 uppercase tracking-wider">
                                                            {tx.type === 'DEBT_INCREASE' || tx.type === 'ORDER' ? 'Nuevo Pedido' : 'Reporte de Pago'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(tx.status || 'COMPLETED')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {getAmountDisplay(tx.amount, tx.type)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}