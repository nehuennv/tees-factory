import { useEffect, useState, useCallback, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { Search, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { ServiceFormModal } from '@/features/admin/components/ServiceFormModal';
import { formatPrice } from '@/lib/formatters';
import type { ExtraService } from '@/types/extra';

function priceSummary(s: ExtraService): { text: string; quote: boolean } {
    const tiers = s.tiers ?? [];
    if (tiers.length === 0) return { text: 'A cotizar', quote: true };
    const min = Math.min(...tiers.map((t) => t.unitPrice));
    return { text: `Desde ${formatPrice(min)} /u.`, quote: false };
}

export function ServicesPage() {
    const [services, setServices] = useState<ExtraService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ExtraService | null>(null);

    const [toDelete, setToDelete] = useState<ExtraService | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchServices = useCallback(() => {
        setIsLoading(true);
        apiClient.get('/extras')
            .then(({ data }) => setServices(Array.isArray(data) ? data : []))
            .catch((err) => {
                if (err?.response?.status !== 404) toast.error('Error al cargar los servicios');
                setServices([]);
            })
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return services;
        return services.filter((s) => s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q));
    }, [services, search]);

    const openNew = () => { setEditing(null); setFormOpen(true); };
    const openEdit = (s: ExtraService) => { setEditing(s); setFormOpen(true); };

    const confirmDelete = async () => {
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            await apiClient.delete(`/extras/${toDelete.id}`);
            setServices((prev) => prev.filter((s) => s.id !== toDelete.id));
            toast.success('Servicio eliminado', { description: toDelete.name });
            setToDelete(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Error al eliminar el servicio');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-4 lg:p-6">
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-5">

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar servicio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400 text-zinc-800 shadow-sm"
                        />
                    </div>
                    <Button onClick={openNew} className="rounded-xl h-10 px-4 bg-zinc-900 text-white hover:bg-zinc-800 font-semibold gap-2 shrink-0 shadow-sm">
                        <Plus className="w-4 h-4" /> Nuevo servicio
                    </Button>
                </div>

                {/* Lista */}
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                                <div className="w-11 h-11 rounded-xl bg-zinc-100 animate-pulse shrink-0" />
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="h-4 w-1/3 bg-zinc-100 rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-zinc-100 rounded animate-pulse" />
                                </div>
                                <div className="h-6 w-20 bg-zinc-100 rounded-lg animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border border-dashed border-zinc-300 rounded-2xl py-20 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-zinc-300" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-base font-bold text-zinc-900">{search ? 'Sin resultados' : 'Todavía no hay servicios'}</p>
                            <p className="text-sm text-zinc-500">{search ? 'Probá con otro término.' : 'Creá el primer servicio (planchado, estampado, etc.).'}</p>
                        </div>
                        {!search && (
                            <Button onClick={openNew} className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-semibold gap-2 mt-1">
                                <Plus className="w-4 h-4" /> Nuevo servicio
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map((s) => {
                            const ps = priceSummary(s);
                            return (
                                <div key={s.id} className="group bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.isActive ? 'bg-[#42318B]/10 border border-[#42318B]/20' : 'bg-zinc-100 border border-zinc-200'}`}>
                                        <Sparkles className={`w-5 h-5 ${s.isActive ? 'text-[#42318B]' : 'text-zinc-400'}`} />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-zinc-900 truncate">{s.name}</span>
                                            {!s.isActive && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">Inactivo</span>
                                            )}
                                        </div>
                                        {s.description && <span className="text-xs text-zinc-500 truncate">{s.description}</span>}
                                    </div>
                                    <span className={`text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-lg border ${ps.quote ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                        {ps.text}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => openEdit(s)} className="w-9 h-9 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors" title="Editar">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setToDelete(s)} className="w-9 h-9 rounded-lg hover:bg-rose-50 flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors" title="Eliminar">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ServiceFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                service={editing}
                onSaved={fetchServices}
            />

            <Modal
                isOpen={!!toDelete}
                onClose={() => { if (!isDeleting) setToDelete(null); }}
                title="Eliminar servicio"
                description={`¿Seguro que querés eliminar "${toDelete?.name}"? Dejará de estar disponible para nuevos pedidos.`}
                maxWidth="sm"
                hideCloseButton
                primaryAction={{ label: 'Sí, eliminar', variant: 'destructive', onClick: confirmDelete, isLoading: isDeleting, disabled: isDeleting }}
                secondaryAction={{ label: 'Cancelar', onClick: () => setToDelete(null), disabled: isDeleting }}
            />
        </div>
    );
}
