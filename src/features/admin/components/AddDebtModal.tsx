import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { HoldToConfirmButton } from '@/components/shared/HoldToConfirmButton';
import { formatPrice } from '@/lib/formatters';
import apiClient from '@/lib/apiClient';
import { ArrowRight, Mail, AlertTriangle } from 'lucide-react';

export type DebtAdjustMode = 'debt' | 'credit';

interface AddDebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName?: string;
    /** Deuda actual (para preview previo → nuevo). */
    currentDebt: number;
    /** 'debt' = cargar deuda (suma); 'credit' = ajuste a favor (resta). */
    mode?: DebtAdjustMode;
    /** Se llama al confirmar OK; recibe la nueva deuda devuelta por el back (o estimada). */
    onDone: (newDebt?: number) => void;
}

const REASON_MAX = 240;

const COPY: Record<DebtAdjustMode, {
    title: string;
    endpoint: (id: string) => string;
    actionLabel: (amt: string) => string;
    placeholder: string;
    accent: string;        // color del monto nuevo
    confirmClass: string;  // color del botón / barra de progreso
    sign: 1 | -1;
}> = {
    debt: {
        title: 'Agregar deuda manual',
        endpoint: (id) => `/clients/${id}/debt`,
        actionLabel: (amt) => amt ? `Cargar ${amt}` : 'Cargar deuda',
        placeholder: 'Ej: Ajuste por diferencia de cambio, flete especial, etc.',
        accent: 'text-rose-400',
        confirmClass: '',
        sign: 1,
    },
    credit: {
        title: 'Ajuste a favor del cliente',
        endpoint: (id) => `/clients/${id}/credit`,
        actionLabel: (amt) => amt ? `Acreditar ${amt}` : 'Acreditar a favor',
        placeholder: 'Ej: Devolución, bonificación, corrección de un cargo previo, etc.',
        accent: 'text-emerald-400',
        confirmClass: '[&>span:first-child]:!bg-emerald-600',
        sign: -1,
    },
};

export function AddDebtModal({ isOpen, onClose, clientId, clientName, currentDebt, mode = 'debt', onDone }: AddDebtModalProps) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [notify, setNotify] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Idempotency-Key estable por intento de modal: se regenera al abrir.
    const [idempotencyKey, setIdempotencyKey] = useState('');

    const cfg = COPY[mode];

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setReason('');
            setNotify(true);
            setIsSubmitting(false);
            setIdempotencyKey(
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
            );
        }
    }, [isOpen]);

    const parsedAmount = parseFloat(amount);
    const amountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
    const reasonValid = reason.trim().length > 0;
    const canSubmit = amountValid && reasonValid && !isSubmitting;

    const newDebt = currentDebt + cfg.sign * (amountValid ? parsedAmount : 0);

    const handleConfirm = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
            const res = await apiClient.post(
                cfg.endpoint(clientId),
                {
                    amount: Math.round(parsedAmount * 100) / 100,
                    reason: reason.trim(),
                    notify,
                },
                { headers: { 'Idempotency-Key': idempotencyKey } }
            );
            const data = res.data || {};
            const resultDebt = data.newDebt ?? newDebt;
            const wasNotified = data.notified ?? notify;
            toast.success(mode === 'debt' ? 'Deuda cargada' : 'Ajuste acreditado', {
                description: `${formatPrice(data.previousDebt ?? currentDebt)} → ${formatPrice(resultDebt)}${wasNotified ? ' · Cliente notificado por mail' : ''}`,
            });
            onDone(resultDebt);
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error al procesar el ajuste';
            toast.error(msg);
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { if (!isSubmitting) onClose(); }}
            title={cfg.title}
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
                        label={cfg.actionLabel(amountValid ? formatPrice(parsedAmount) : '')}
                        holdingLabel="Sostené para confirmar…"
                        loadingLabel="Procesando…"
                        className={cfg.confirmClass}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Monto */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {mode === 'debt' ? 'Monto a cargar *' : 'Monto a acreditar *'}
                    </label>
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
                        placeholder={cfg.placeholder}
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {currentDebt < 0 ? 'Saldo a favor' : 'Deuda actual'}
                        </span>
                        <span className="text-base font-bold">{formatPrice(Math.abs(currentDebt))}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-500" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {newDebt < 0 ? 'Saldo a favor' : 'Nueva deuda'}
                        </span>
                        <span className={`text-xl font-black ${newDebt < 0 ? 'text-emerald-400' : cfg.accent}`}>
                            {formatPrice(Math.abs(newDebt))}
                        </span>
                    </div>
                </div>

                {/* Aviso */}
                <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Revisá el monto: impacta la cuenta del cliente de inmediato. Mantené presionado el botón para confirmar.</span>
                </div>
            </div>
        </Modal>
    );
}
