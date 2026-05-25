import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelOrder } from '@/lib/ordersApi';
import { toast } from 'sonner';

interface CancelOrderDialogProps {
    orderId: string;
    orderNumber?: string | number;
    isOpen: boolean;
    onClose: () => void;
    onCancelled: (orderId: string) => void;
}

export function CancelOrderDialog({ orderId, orderNumber, isOpen, onClose, onCancelled }: CancelOrderDialogProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleCancel = async () => {
        if (!reason.trim()) return;
        setIsSubmitting(true);
        try {
            await cancelOrder(orderId, reason.trim());
            toast.success(`Pedido #${orderNumber || orderId.slice(0, 8)} cancelado`);
            onCancelled(orderId);
            handleClose();
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Error al cancelar el pedido';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setReason('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-zinc-900">
                            Cancelar pedido #{orderNumber || orderId.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Esta acción libera el stock reservado y genera un asiento de descuento en el ledger del cliente. No se puede deshacer.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Motivo de cancelación *
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ej: Cliente pidió cancelar, sin stock de repuesto..."
                        rows={3}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 resize-none transition-all"
                        autoFocus
                    />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-xl border-zinc-200 text-zinc-600 font-semibold"
                    >
                        Volver
                    </Button>
                    <Button
                        onClick={handleCancel}
                        disabled={!reason.trim() || isSubmitting}
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2"
                    >
                        {isSubmitting ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        ) : null}
                        Cancelar pedido
                    </Button>
                </div>
            </div>
        </div>
    );
}
