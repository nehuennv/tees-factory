import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CatalogToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
}

/**
 * Barra de herramientas del catálogo: campo de búsqueda + filtros.
 * Acepta el estado de búsqueda externamente (controlled component).
 * Los filtros por ahora son visuales; se pueden conectar a lógica real después.
 */
export function CatalogToolbar({
    searchTerm,
    onSearchChange,
    searchPlaceholder = 'Buscar por nombre, SKU o categoría...'
}: CatalogToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            {/* Search — left side */}
            <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400 text-zinc-800 shadow-sm"
                />
            </div>

            {/* Filters — right side */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0">
                    Categoría <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                </Button>
                <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0">
                    Calidad <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                </Button>
                <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0">
                    Estado <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                </Button>

                <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block shrink-0"></div>

                <Button variant="ghost" className="rounded-xl h-10 px-4 text-zinc-500 hover:text-zinc-900 whitespace-nowrap shrink-0">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Más filtros
                </Button>
            </div>
        </div>
    );
}
