import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ProductSortKey } from '@/types/product';

const SORT_LABELS: Record<ProductSortKey, string> = {
    default: 'Ordenar',
    name_asc: 'Nombre A→Z',
    price_asc: 'Precio ↑',
    price_desc: 'Precio ↓',
    stock_asc: 'Stock ↑',
    stock_desc: 'Stock ↓',
};

interface CatalogToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    sortKey?: ProductSortKey;
    onSortChange?: (key: ProductSortKey) => void;
}

export function CatalogToolbar({
    searchTerm,
    onSearchChange,
    searchPlaceholder = 'Buscar por nombre, SKU o categoría...',
    sortKey = 'default',
    onSortChange,
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

                {onSortChange && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0">
                                {SORT_LABELS[sortKey]} <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border border-zinc-200 rounded-xl shadow-lg p-1">
                            <DropdownMenuItem onClick={() => onSortChange('default')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Relevancia</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSortChange('name_asc')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Nombre A→Z</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-100" />
                            <DropdownMenuItem onClick={() => onSortChange('price_asc')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Precio: menor primero</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSortChange('price_desc')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Precio: mayor primero</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-100" />
                            <DropdownMenuItem onClick={() => onSortChange('stock_desc')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Más stock</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSortChange('stock_asc')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Menos stock</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
