import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2, Plus, Tag } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface Category { id: string; name: string; }

const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCategoriesChanged?: () => void;
}

export function CategoryManagerModal({ isOpen, onClose, onCategoriesChanged }: CategoryManagerModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        apiClient.get('/categories')
            .then(res => setCategories(res.data.sort((a: Category, b: Category) => a.name.localeCompare(b.name))))
            .catch(() => toast.error('No se pudieron cargar las categorías'))
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await apiClient.delete(`/categories/${id}`);
            setCategories(prev => prev.filter(c => c.id !== id));
            setConfirmId(null);
            onCategoriesChanged?.();
            toast.success('Categoría eliminada');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al eliminar la categoría');
        } finally {
            setDeletingId(null);
        }
    };

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setIsCreating(true);
        try {
            const res = await apiClient.post('/categories', { name });
            setCategories(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName('');
            setShowNew(false);
            onCategoriesChanged?.();
            toast.success(`Categoría "${res.data.name}" creada`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al crear la categoría');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Categorías" maxWidth="sm">
            <div className="flex flex-col gap-4">

                {isLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Cargando...</span>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                        No hay categorías creadas.
                    </div>
                ) : (
                    <ul className="flex flex-col divide-y divide-zinc-100">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center justify-between py-2.5 gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span className="text-sm font-medium text-zinc-800 truncate">{toTitleCase(cat.name)}</span>
                                </div>

                                {confirmId === cat.id ? (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-xs text-zinc-500">¿Eliminar?</span>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={deletingId === cat.id}
                                            onClick={() => handleDelete(cat.id)}
                                            className="h-7 px-2.5 text-xs rounded-lg"
                                        >
                                            {deletingId === cat.id
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : 'Sí, borrar'
                                            }
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setConfirmId(null)}
                                            className="h-7 px-2 text-xs rounded-lg text-zinc-500"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmId(cat.id)}
                                        disabled={!!deletingId}
                                        className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                        title="Eliminar categoría"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Nueva categoría */}
                {showNew ? (
                    <div className="flex gap-2 pt-1">
                        <Input
                            placeholder="Nombre de la categoría..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleCreate();
                                if (e.key === 'Escape') { setShowNew(false); setNewName(''); }
                            }}
                            className="h-9 text-sm rounded-xl bg-zinc-50 border-zinc-200"
                            autoFocus
                            disabled={isCreating}
                        />
                        <Button
                            size="sm"
                            onClick={handleCreate}
                            disabled={isCreating || !newName.trim()}
                            className="h-9 px-3 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold shrink-0"
                        >
                            {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Crear'}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setShowNew(false); setNewName(''); }}
                            disabled={isCreating}
                            className="h-9 px-2 rounded-xl text-zinc-500 text-xs shrink-0"
                        >
                            Cancelar
                        </Button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowNew(true)}
                        className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors pt-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nueva categoría
                    </button>
                )}
            </div>
        </Modal>
    );
}
