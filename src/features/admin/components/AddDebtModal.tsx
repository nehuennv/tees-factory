import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { HoldToConfirmButton } from '@/components/shared/HoldToConfirmButton';
import { formatPrice } from '@/lib/formatters';
import apiClient from '@/lib/apiClient';
import { ArrowRight, Mail, AlertTriangle } from 'lucide-react';

interface AddDebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName?: string;
    /** Deuda actual (para preview previo → nuevo). */
    currentDebt: number;
    /** Se llama al confirmar OK; recibe la nueva deuda devuelta por el back (o estimada). */
    onDone: (newDebt?: number) => void;
}

const REASON_MAX = 240;

export function AddDebtModal({ isOpen, onClose, clientId, clientName, currentDebt, onDone }: AddDebtModalProps) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [notify, setNotify] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset al abrir
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setReason('');
            setNotify(true);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const parsedAmount = parseFloat(amount);
    const amountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
    const reasonValid = reason.trim().length > 0;
    const canSubmit = amountValid && reasonValid && !isSubmitting;

    const newDebt = currentDebt + (amountValid ? parsedAmount : 0);

    const handleConfirm = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
            const res = await apiClient.post(`/clients/${clientId}/debt`, {
                amount: Math.round(parsedAmount * 100) / 100,
                reason: reason.trim(),
                notify,
            });
            const data = res.data || {};
            const resultDebt = data.newDebt ?? newDebt;
            toast.success('Deuda cargada', {
                description: `${formatPrice(data.previousDebt ?? currentDebt)} → ${formatPrice(resultDebt)}${data.notified ?? notify ? ' · Cliente notificado por mail' : ''}`,
            });
            onDone(resultDebt);
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error al cargar la deuda';
            toast.error(msg);
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { if (!isSubmitting) onClose(); }}
            title="Agregar deuda manual"
            description={clientName ? `Cuenta de ${clientName}` : undefined}
            maxWidth="md"
            preventCloseOnOutsideClick={isSubmitting}
            footer={
                <div className="flex w-full items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-xl font-semibold border-zinc-200"
                    >
                        Cancelar
                    </Button>
                    <HoldToConfirmButton
                        onConfirm={handleConfirm}
                        disabled={!canSubmit}
                        isLoading={isSubmitting}
                        label={amountValid ? `Cargar ${formatPrice(parsedAmount)}` : 'Cargar deuda'}
                        holdingLabel="Sostené para confirmar…"
                        loadingLabel="Cargando…"
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Monto */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Monto a cargar *</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                        <input
                            type="number"
                            autoFocus
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            min={0}
                            step="0.01"
                            className="w-full h-12 rounded-xl border border-zinc-200 bg-white pl-8 pr-4 text-lg font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                </div>

                {/* Observación */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Observación *</label>
                        <span className="text-[10px] text-zinc-400 font-medium">{reason.length}/{REASON_MAX}</span>
                    </div>
                    <textarea
                        value={reason}
                        maxLength={REASON_MAX}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ej: Ajuste por diferencia de cambio, flete especial, devolución, etc."
                        rows={3}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                    />
                    <p className="text-[11px] text-zinc-400">Queda registrado en el historial del cliente y es visible para él.</p>
                </div>

                {/* Notificar */}
                <button
                    type="button"
                    onClick={() => setNotify(v => !v)}
                    className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                >
                    <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${notify ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300'}`}>
                        {notify && <span className="w-2 h-2 rounded-sm bg-white" />}
                    </span>
                    <span className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-800 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            Notificar al cliente por mail
                        </span>
                        <span className="text-xs text-zinc-500">
                            {notify ? 'Recibirá un email con el monto y la observación.' : 'No se enviará email; solo queda en el panel.'}
                        </span>
                    </span>
                </button>

                {/* Preview previo → nuevo */}
                <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-5 py-4 text-white">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Deuda actual</span>
                        <span className="text-base font-bold">{formatPrice(currentDebt)}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-500" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nueva deuda</span>
                        <span className="text-xl font-black text-rose-400">{formatPrice(newDebt)}</span>
                    </div>
                </div>

                {/* Aviso sin reverso */}
                <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Revisá el monto: cargar deuda impacta la cuenta del cliente de inmediato. Mantené presionado el botón para confirmar.</span>
                </div>
            </div>
        </Modal>
    );
}
