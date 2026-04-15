import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Receipt, Building2, User, Hash, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import type { PaymentReport } from '@/mocks/payments'

interface ReceiptViewerModalProps {
    payment: any | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string, amount: number) => void;
    onReject: (id: string, reason?: string) => void;
}

function TransferSkeleton({ transactionId, clientName, date }: { transactionId: string, clientName: string, date: string }) {
    return (
        <div className="w-full max-w-sm mx-auto bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-200"></div>

            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                    <Building2 className="w-6 h-6 text-zinc-400" />
                </div>
                <h3 className="text-zinc-900 font-semibold mb-1">Comprobante no disponible</h3>
                <p className="text-xs text-zinc-500">Datos informados por el cliente</p>
            </div>

            <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Ordenante</p>
                        <p className="text-sm font-medium text-zinc-900">{clientName}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nro. de Operación</p>
                        <p className="text-sm font-mono text-zinc-900 font-medium">{transactionId}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Fecha informada</p>
                        <p className="text-sm text-zinc-900">
                            {new Date(date).toLocaleDateString('es-AR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>

                {/* Skeleton lines to simulate standard receipt text */}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                    <div className="h-2 bg-zinc-100 rounded-full w-3/4"></div>
                    <div className="h-2 bg-zinc-100 rounded-full w-full"></div>
                    <div className="h-2 bg-zinc-100 rounded-full w-5/6"></div>
                    <div className="h-2 bg-zinc-100 rounded-full w-4/6"></div>
                </div>
            </div>
        </div>
    );
}

export function ReceiptViewerModal({ payment, isOpen, onClose, onApprove, onReject }: ReceiptViewerModalProps) {
    const [amount, setAmount] = useState<string>('');
    const [rejectReason, setRejectReason] = useState<string>('');
    const [imageError, setImageError] = useState(false);

    if (!payment) return null;

    // Reset local state when a new payment is opened
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setAmount('');
            setRejectReason('');
            setImageError(false);
            onClose();
        } else {
            setImageError(false);
        }
    };

    const parsedAmount = parseFloat(amount);
    const isApproveDisabled = isNaN(parsedAmount) || parsedAmount <= 0;
    const isRejectDisabled = rejectReason.trim().length === 0;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-zinc-200 shadow-xl sm:rounded-xl">
                <DialogTitle className="sr-only">Detalle de Pago</DialogTitle>
                <DialogDescription className="sr-only">
                    Visualice los datos del reporte de pago y proceda a su conciliación o revisión.
                </DialogDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 h-[80vh] max-h-[750px] divide-y md:divide-y-0 md:divide-x divide-zinc-200 overflow-hidden">

                    {/* LEFT COL: Data & Actions (Admin side) */}
                    <div className="flex flex-col bg-white w-full h-full relative overflow-hidden">
                        {/* Scrollable Content Area */}
                        <div className="p-8 pb-4 flex-1 overflow-y-auto w-full">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-zinc-900">{payment.clientName}</h2>
                                <p className="text-sm font-medium text-zinc-500 mt-1">
                                    Reportado el {new Date(payment.date).toLocaleDateString('es-AR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            <div className="bg-zinc-50/80 border border-zinc-100 rounded-xl p-5 space-y-4 mb-6">
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Monto Informado por Cliente</p>
                                    <p className="text-zinc-900 font-bold text-xl">${payment.amount ? payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Método de Pago</p>
                                    <p className="text-zinc-900 font-semibold text-sm">{payment.method}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Nro. de Operación / ID</p>
                                    <div className="bg-white border border-zinc-200/80 rounded-lg px-3 py-2 mt-1 flex items-center shadow-sm">
                                        <span className="font-mono text-zinc-900 font-semibold select-all text-sm">
                                            {payment.transactionId}
                                        </span>
                                    </div>
                                </div>

                                {payment.observation && (
                                    <div>
                                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Observación del Cliente</p>
                                        <p className="text-zinc-700 text-sm whitespace-pre-wrap bg-white p-3 rounded-lg border border-zinc-200/80 shadow-sm leading-relaxed">
                                            {payment.observation}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {payment.status === 'PENDING' && (
                                <div className="flex-1 flex flex-col mb-4">
                                    <label className="block text-sm font-bold text-zinc-900 mb-2">
                                        Monto recibido en cuenta ($)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full h-12 rounded-lg border border-zinc-200/80 bg-white px-4 py-2 text-lg font-semibold tracking-wide text-zinc-900 placeholder:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:border-zinc-300 transition-all shadow-sm mb-2"
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-medium">
                                        Ingrese el importe exacto acreditado en el banco para la conciliación final.
                                    </p>

                                    <label className="block text-sm font-bold text-zinc-900 mb-2">
                                        Motivo de Rechazo <span className="text-zinc-400 font-normal ml-1">(Obligatorio para rechazar)</span>
                                    </label>
                                    <textarea
                                        placeholder="Indique el motivo por el cual invalida este pago..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="w-full h-20 rounded-lg border border-zinc-200/80 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:border-zinc-300 transition-all shadow-sm resize-none"
                                    />
                                </div>
                            )}

                            {payment.status === 'APPROVED' && (
                                <div className="flex-1 mt-2 flex flex-col">
                                    <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            <h3 className="text-emerald-900 font-semibold">Pago Conciliado</h3>
                                        </div>
                                        <p className="text-emerald-700/90 text-[14px] leading-relaxed ml-8">
                                            Este pago fue aprobado y acreditado en la cuenta corriente del cliente por un total de <strong className="font-bold text-emerald-900">${payment.approvedAmount?.toLocaleString('es-AR')}</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {payment.status === 'REJECTED' && (
                                <div className="flex-1 mt-2 flex flex-col">
                                    <div className="bg-rose-50/80 border border-rose-200/60 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <XCircle className="w-5 h-5 text-rose-600" />
                                            <h3 className="text-rose-900 font-semibold">Pago Rechazado</h3>
                                        </div>
                                        <p className="text-rose-700/90 text-[14px] leading-relaxed ml-8">
                                            Este comprobante fue invalidado y no se acreditó saldo en la cuenta del ordenante.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-8 pt-5 pb-6 mt-auto border-t border-zinc-100 bg-white">
                            {payment.status === 'PENDING' ? (
                                <div className="space-y-3">
                                    <Button
                                        onClick={() => { onApprove(payment.id, Number(amount)); handleOpenChange(false); }}
                                        disabled={isApproveDisabled}
                                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-12 text-[15px] font-semibold disabled:bg-zinc-100 disabled:text-zinc-400 shadow-sm transition-all rounded-lg"
                                    >
                                        Aprobar y Acreditar
                                    </Button>
                                    <Button
                                        onClick={() => { onReject(payment.id, rejectReason); handleOpenChange(false); }}
                                        disabled={isRejectDisabled}
                                        variant="outline"
                                        className="w-full border-zinc-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-11 text-[15px] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:bg-white disabled:text-red-300 disabled:border-zinc-100"
                                    >
                                        Rechazar Pago
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => handleOpenChange(false)}
                                    variant="outline"
                                    className="w-full h-11 text-[15px] font-semibold rounded-lg bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm"
                                >
                                    Cerrar y Volver
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COL: Receipt Viewer (Clear mode) */}
                    <div className="bg-zinc-50/50 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
                        {payment.receiptUrl && !imageError ? (
                            <div className="w-full h-full relative flex items-center justify-center rounded-xl bg-white shadow-sm border border-zinc-200/80 p-2">
                                <img
                                    src={payment.receiptUrl}
                                    alt={`Comprobante ${payment.transactionId}`}
                                    onError={() => setImageError(true)}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <TransferSkeleton
                                    transactionId={payment.transactionId}
                                    clientName={payment.clientName}
                                    date={payment.date}
                                />
                            </div>
                        )}

                        <div className="absolute top-4 left-4 py-1.5 px-3 bg-white shadow-sm rounded-lg border border-zinc-200/80">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5" />
                                Archivo Adjunto
                            </span>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
