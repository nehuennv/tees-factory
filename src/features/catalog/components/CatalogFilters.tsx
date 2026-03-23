import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CatalogFilters() {
    return (
        <div className="mb-6 flex flex-col gap-4">
            <p className="text-zinc-500 text-sm">Control de stock y variantes de productos.</p>
            <div className="flex gap-4">
                <Select>
                    <SelectTrigger className="w-[180px] rounded-xl bg-white border-zinc-200 text-zinc-900 shadow-sm h-10">
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="remeras">Remeras</SelectItem>
                        <SelectItem value="pantalones">Pantalones</SelectItem>
                        <SelectItem value="accesorios">Accesorios</SelectItem>
                    </SelectContent>
                </Select>

                <Select>
                    <SelectTrigger className="w-[180px] rounded-xl bg-white border-zinc-200 text-zinc-900 shadow-sm h-10">
                        <SelectValue placeholder="Estado de Stock" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="alto">Stock Alto</SelectItem>
                        <SelectItem value="bajo">Stock Bajo</SelectItem>
                        <SelectItem value="agotado">Agotado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
