import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { MOCK_PAYMENTS, type PaymentReport } from '@/mocks/payments';
import { updatePaymentStatus } from '@/api/mockTreasury';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, CheckCircle2 } from "lucide-react";

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function TreasuryPage() {
    const [payments, setPayments] = useState<PaymentReport[]>(MOCK_PAYMENTS);
    const [selectedPayment, setSelectedPayment] = useState<PaymentReport | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const truncateText = (text: string, maxLength: number = 25) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleApprove = async (id: string, approvedAmount: number) => {
        const payment = payments.find(p => p.id === id);
        if (!payment) return;

        setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED', approvedAmount } : p));
        toast.success(`Pago conciliado por ${formatPrice(approvedAmount)}`);

        try {
            await updatePaymentStatus(id, 'APPROVED', approvedAmount);
        } catch (error) {
            setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'PENDING', approvedAmount: undefined } : p));
            toast.error(`Error al aprobar el pago de ${payment.clientName}`);
        }
    };

    const handleReject = async (id: string) => {
        const payment = payments.find(p => p.id === id);
        if (!payment) return;

        setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
        toast.success(`Pago de ${payment.clientName} rechazado`);

        try {
            await updatePaymentStatus(id, 'REJECTED');
        } catch (error) {
            setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'PENDING' } : p));
            toast.error(`Error al rechazar el pago de ${payment.clientName}`);
        }
    };

    const openReceiptModal = (payment: PaymentReport) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: PaymentReport['status']) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200/60 text-[11px] font-bold tracking-wide uppercase">Pendiente</span>;
            case 'APPROVED':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-[11px] font-bold tracking-wide uppercase">Aprobado</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/60 text-[11px] font-bold tracking-wide uppercase">Rechazado</span>;
        }
    };

    const getTabContent = (status: StatusFilter) => {
        if (status === 'ALL') return 'Todos';
        const count = payments.filter(p => p.status === status).length;

        switch (status) {
            case 'PENDING': return (
                <span className="flex items-center gap-2">
                    Pendientes
                    {count > 0 && <span className="bg-amber-100/80 text-amber-700 py-0.5 px-1.5 rounded-md text-[10px] font-bold leading-none">{count}</span>}
                </span>
            );
            case 'APPROVED': return (
                <span className="flex items-center gap-2">
                    Aprobados
                    {count > 0 && <span className="bg-emerald-100/80 text-emerald-700 py-0.5 px-1.5 rounded-md text-[10px] font-bold leading-none">{count}</span>}
                </span>
            );
            case 'REJECTED': return (
                <span className="flex items-center gap-2">
                    Rechazados
                    {count > 0 && <span className="bg-rose-100/80 text-rose-700 py-0.5 px-1.5 rounded-md text-[10px] font-bold leading-none">{count}</span>}
                </span>
            );
        }
    };

    const renderTable = () => {
        let filteredPayments = statusFilter === 'ALL'
            ? payments
            : payments.filter(p => p.status === statusFilter);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredPayments = filteredPayments.filter(p =>
                p.clientName.toLowerCase().includes(query) ||
                p.transactionId.toLowerCase().includes(query)
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Nro Oper.</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Observaciones</TableHead>
                        <TableHead className="text-right font-semibold">Monto Confirmado</TableHead>
                        <TableHead className="w-[80px] text-right pr-6">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPayments.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-zinc-500 py-16 bg-zinc-50/30">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                                        <Search className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <p className="text-[15px] font-medium text-zinc-900">No hay pagos para mostrar</p>
                                    <p className="text-sm text-zinc-500 mt-1">Intenta con otros filtros de búsqueda o estado.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredPayments.map((payment) => (
                            <TableRow
                                key={payment.id}
                                className={`cursor-pointer transition-colors ${payment.status === 'PENDING' ? 'hover:bg-amber-50/30' :
                                    payment.status === 'APPROVED' ? 'hover:bg-emerald-50/30' :
                                        'hover:bg-rose-50/30'
                                    }`}
                                onClick={() => openReceiptModal(payment)}
                            >
                                <TableCell className="whitespace-nowrap text-zinc-600">{formatDate(payment.date)}</TableCell>
                                <TableCell className="font-semibold text-zinc-900">{payment.clientName}</TableCell>
                                <TableCell>
                                    <span className="font-mono text-zinc-700 text-xs font-semibold bg-white px-2 py-1 rounded border border-zinc-200/80 shadow-sm">
                                        {payment.transactionId}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(payment.status)}
                                </TableCell>
                                <TableCell>
                                    {payment.observation ? (
                                        <span className="text-zinc-500 text-[13px] italic" title={payment.observation}>
                                            "{truncateText(payment.observation)}"
                                        </span>
                                    ) : (
                                        <span className="text-zinc-300 text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {payment.status === 'PENDING' ? (
                                        <span className="text-zinc-400 text-sm font-normal"><span className="text-xs mr-1 opacity-50">$</span>--</span>
                                    ) : payment.approvedAmount !== undefined ? (
                                        <span className="text-zinc-900">{formatPrice(payment.approvedAmount)}</span>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-zinc-400 hover:text-zinc-900 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-white border-zinc-200 rounded-xl shadow-lg">
                                            {payment.status === 'PENDING' ? (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openReceiptModal(payment);
                                                    }}
                                                    className="cursor-pointer font-semibold text-zinc-900 hover:bg-zinc-50 focus:bg-zinc-50 py-2.5"
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                                    <span>Conciliar Pago</span>
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openReceiptModal(payment);
                                                    }}
                                                    className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 focus:bg-zinc-50 py-2.5"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    <span>Ver Detalle</span>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-6">
            <div className="w-full mx-auto space-y-6 pb-20">
                {/* Controles: Búsqueda y Filtros estandarizados estilo ClientList */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-2">
                    <div className="relative w-full xl:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o Nro. Operación..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value !== '') setStatusFilter('ALL');
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200/80 rounded-lg text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400 text-zinc-800 shadow-sm"
                        />
                    </div>

                    <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-hide p-1 bg-white rounded-xl border border-zinc-200/60 shadow-sm max-w-full">
                        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map(status => (
                            <Button
                                key={status}
                                variant="ghost"
                                onClick={() => setStatusFilter(status)}
                                className={`rounded-lg h-9 px-4 whitespace-nowrap shrink-0 transition-all ${statusFilter === status
                                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm border border-zinc-200/50'
                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium'
                                    }`}
                            >
                                {getTabContent(status)}
                            </Button>
                        ))}
                    </div>
                </div>

                {renderTable()}

                <ReceiptViewerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    payment={selectedPayment}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            </div>
        </div>
    );
}
