import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface Category { id: string; name: string; }

const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

interface CategorySelectProps {
    value: string;
    onChange: (id: string, name: string) => void;
    disabled?: boolean;
    className?: string;
}

export function CategorySelect({ value, onChange, disabled, className }: CategorySelectProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        apiClient.get('/categories')
            .then(res => setCategories(res.data))
            .catch(() => toast.error('No se pudieron cargar las categorías'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSelectChange = (val: string) => {
        if (val === '__new__') {
            setShowNew(true);
        } else {
            const cat = categories.find(c => c.id === val);
            if (cat) onChange(cat.id, cat.name);
            setShowNew(false);
        }
    };

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setIsCreating(true);
        try {
            const res = await apiClient.post('/categories', { name });
            const created: Category = res.data;
            setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            onChange(created.id, created.name);
            setShowNew(false);
            setNewName('');
            toast.success(`Categoría "${created.name}" creada`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al crear la categoría');
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Cargando categorías...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Select
                value={value}
                onValueChange={handleSelectChange}
                disabled={disabled}
            >
                <SelectTrigger className={`rounded-xl bg-zinc-50 border-zinc-200 focus:ring-zinc-900/10 focus:border-zinc-300 h-10 text-sm ${className ?? ''}`}>
                    <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-lg cursor-pointer text-sm">
                            {toTitleCase(cat.name)}
                        </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value="__new__" className="rounded-lg cursor-pointer text-sm text-zinc-500">
                        <span className="flex items-center gap-1.5">
                            <Plus className="w-3 h-3" />
                            Nueva categoría...
                        </span>
                    </SelectItem>
                </SelectContent>
            </Select>

            {showNew && (
                <div className="flex gap-2">
                    <Input
                        placeholder="Nombre de la nueva categoría"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowNew(false); setNewName(''); } }}
                        className="rounded-xl bg-zinc-50 border-zinc-200 h-9 text-sm"
                        autoFocus
                        disabled={isCreating}
                    />
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleCreate}
                        disabled={isCreating || !newName.trim()}
                        className="h-9 px-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold shrink-0"
                    >
                        {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Crear'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowNew(false); setNewName(''); }}
                        disabled={isCreating}
                        className="h-9 px-3 rounded-xl text-zinc-500 text-xs shrink-0"
                    >
                        Cancelar
                    </Button>
                </div>
            )}
        </div>
    );
}
