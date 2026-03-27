import { PaymentReportModal } from '../components/PaymentReportModal';
import { MOCK_CURRENT_BALANCE, MOCK_TRANSACTIONS, type Transaction } from '@/mocks/account';
import { formatPrice } from '@/lib/formatters';
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

export function CurrentAccountPage() {
    // LÓGICA DE NEGOCIO
    const isDebt = MOCK_CURRENT_BALANCE < 0;
    const balanceLabel = isDebt ? 'Saldo Deudor Actual' : 'Saldo a Favor';
    const balanceColor = isDebt ? 'text-rose-600' : 'text-emerald-600';
    const balanceBg = isDebt ? 'bg-rose-50' : 'bg-emerald-50';

    // Clases dinámicas para la tarjeta principal (Borde izquierdo y gradiente sutil)
    const cardBorderColor = isDebt ? 'border-l-rose-500' : 'border-l-emerald-500';
    const cardBgGradient = isDebt ? 'bg-gradient-to-r from-rose-50/40 to-white' : 'bg-gradient-to-r from-emerald-50/40 to-white';

    const getStatusBadge = (status: Transaction['status']) => {
        switch (status) {
            case 'COMPLETED':
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

    const getAmountDisplay = (amount: number, type: Transaction['type']) => {
        if (type === 'ORDER') {
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
                                    {balanceLabel}
                                </span>
                                <span className={`text-5xl md:text-6xl font-black tracking-tight ${balanceColor}`}>
                                    {formatPrice(Math.abs(MOCK_CURRENT_BALANCE))}
                                </span>
                            </div>
                        </div>

                        <div className="w-full md:w-[320px] shrink-0">
                            {/* Acción de Reportar Pago con mejor diseño */}
                            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 p-5 shadow-sm flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <h4 className="text-sm font-bold text-zinc-900">¿Realizaste un pago?</h4>
                                    <p className="text-xs text-zinc-500 leading-tight">Infórmalo ahora para agilizar el despacho de tus pedidos.</p>
                                </div>
                                <PaymentReportModal />
                            </div>
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
                                    {MOCK_TRANSACTIONS.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                                                No hay movimientos registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        MOCK_TRANSACTIONS.map((tx) => (
                                            <TableRow key={tx.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                <TableCell className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                                                    {formatDate(tx.date)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-zinc-900">{tx.description}</span>
                                                        <span className="text-xs text-zinc-400 font-medium mt-0.5 uppercase tracking-wider">
                                                            {tx.type === 'ORDER' ? 'Nuevo Pedido' : 'Reporte de Pago'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(tx.status)}
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