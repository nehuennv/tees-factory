import { useEffect, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import type { ExtraService, ExtraServiceTier } from '@/types/extra';

interface ServiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** null = crear; objeto = editar. */
    service: ExtraService | null;
    onSaved: () => void;
}

type TierRow = { minQty: string; maxQty: string; unitPrice: string };

const emptyTier = (): TierRow => ({ minQty: '', maxQty: '', unitPrice: '' });

export function ServiceFormModal({ isOpen, onClose, service, onSaved }: ServiceFormModalProps) {
    const isEdit = !!service;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [tiers, setTiers] = useState<TierRow[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setName(service?.name ?? '');
        setDescription(service?.description ?? '');
        setIsActive(service?.isActive ?? true);
        setTiers(
            (service?.tiers ?? []).map((t) => ({
                minQty: String(t.minQty ?? ''),
                maxQty: t.maxQty == null ? '' : String(t.maxQty),
                unitPrice: String(t.unitPrice ?? ''),
            }))
        );
        setIsSaving(false);
    }, [isOpen, service]);

    const nameValid = name.trim().length > 0;

    const updateTier = (i: number, field: keyof TierRow, value: string) =>
        setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
    const addTier = () => setTiers((prev) => [...prev, emptyTier()]);
    const removeTier = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i));

    /** Parsea/valida los tramos. Devuelve null si hay error (con toast). */
    const buildTiers = (): ExtraServiceTier[] | null => {
        const out: ExtraServiceTier[] = [];
        for (const t of tiers) {
            // fila vacía → se ignora
            if (t.minQty === '' && t.maxQty === '' && t.unitPrice === '') continue;
            const minQty = parseInt(t.minQty, 10);
            const unitPrice = parseFloat(t.unitPrice);
            const maxQty = t.maxQty === '' ? null : parseInt(t.maxQty, 10);
            if (Number.isNaN(minQty) || minQty < 1) { toast.error('Cada tramo necesita "desde" (cantidad ≥ 1).'); return null; }
            if (Number.isNaN(unitPrice) || unitPrice < 0) { toast.error('Cada tramo necesita un precio unitario válido.'); return null; }
            if (maxQty != null && maxQty < minQty) { toast.error('El "hasta" de un tramo no puede ser menor que el "desde".'); return null; }
            out.push({ minQty, maxQty, unitPrice });
        }
        return out;
    };

    const handleSave = async () => {
        if (!nameValid) { toast.error('El nombre es obligatorio.'); return; }
        const parsedTiers = buildTiers();
        if (parsedTiers === null) return;

        setIsSaving(true);
        try {
            if (isEdit && service) {
                await apiClient.patch(`/extras/${service.id}`, {
                    name: name.trim(),
                    description: description.trim() || null,
                    isActive,
                });
                await apiClient.put(`/extras/${service.id}/tiers`, parsedTiers);
                toast.success('Servicio actualizado', { description: name.trim() });
            } else {
                await apiClient.post('/extras', {
                    name: name.trim(),
                    description: description.trim() || null,
                    isActive,
                    tiers: parsedTiers,
                });
                toast.success('Servicio creado', { description: name.trim() });
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Error al guardar el servicio');
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { if (!isSaving) onClose(); }}
            title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
            description="Servicios sobre las prendas (planchado, estampado, etc.) que el cliente puede agregar al pedido."
            maxWidth="lg"
            preventCloseOnOutsideClick={isSaving}
            primaryAction={{
                label: isEdit ? 'Guardar cambios' : 'Crear servicio',
                onClick: handleSave,
                isLoading: isSaving,
                disabled: isSaving || !nameValid,
            }}
            secondaryAction={{ label: 'Cancelar', onClick: onClose, disabled: isSaving }}
        >
            <div className="flex flex-col gap-5 py-1">
                {/* Nombre */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del servicio *</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Estampado, Planchado, Bordado…"
                        className="rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                    />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Descripción <span className="text-zinc-400 font-normal normal-case tracking-normal">(opcional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej. Estampado de logo a una tinta al frente."
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                    />
                </div>

                {/* Activo */}
                <button
                    type="button"
                    onClick={() => setIsActive((v) => !v)}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-800">Servicio activo</span>
                        <span className="text-xs text-zinc-500">{isActive ? 'Visible para el cliente al armar el pedido.' : 'Oculto: el cliente no lo verá.'}</span>
                    </div>
                    <span className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isActive ? 'left-[18px]' : 'left-0.5'}`} />
                    </span>
                </button>

                {/* Tramos de precio */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Precios por cantidad</label>
                        <button onClick={addTier} className="flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Agregar tramo
                        </button>
                    </div>

                    {tiers.length === 0 ? (
                        <div className="flex items-start gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500">
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-400" />
                            <span>Sin precios cargados: el servicio queda <span className="font-semibold text-zinc-700">"A cotizar"</span> y el admin pone el precio final en cada pedido.</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Desde (u.)</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hasta (u.)</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">$ unitario</span>
                                <span className="w-8" />
                            </div>
                            {tiers.map((t, i) => (
                                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                    <Input type="number" min={1} value={t.minQty} onChange={(e) => updateTier(i, 'minQty', e.target.value)} placeholder="1"
                                        className="h-9 rounded-lg bg-zinc-50 border-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <Input type="number" min={1} value={t.maxQty} onChange={(e) => updateTier(i, 'maxQty', e.target.value)} placeholder="∞ (sin tope)"
                                        className="h-9 rounded-lg bg-zinc-50 border-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <Input type="number" min={0} value={t.unitPrice} onChange={(e) => updateTier(i, 'unitPrice', e.target.value)} placeholder="0"
                                        className="h-9 rounded-lg bg-zinc-50 border-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <button onClick={() => removeTier(i)} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center transition-colors" title="Quitar tramo">
                                        <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-rose-500" />
                                    </button>
                                </div>
                            ))}
                            <p className="text-[11px] text-zinc-400 px-1">Dejá "Hasta" vacío para el último tramo (sin tope). Un tramo aplica si la cantidad está dentro del rango.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
