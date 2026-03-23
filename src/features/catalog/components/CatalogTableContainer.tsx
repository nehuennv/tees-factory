import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CatalogFilters from './CatalogFilters';
import CatalogPagination from './CatalogPagination';
import { Image as ImageIcon, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function CatalogTableContainer() {
    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col w-full max-w-6xl">
            <CatalogFilters />

            <div className="rounded-2xl border border-zinc-100 overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-zinc-50/50">
                        <TableRow className="border-b border-zinc-100 hover:bg-transparent">
                            <TableHead className="text-xs font-bold text-zinc-400 uppercase tracking-wider py-4 pl-4 w-[35%] py-4">Producto</TableHead>
                            <TableHead className="text-xs font-bold text-zinc-400 uppercase tracking-wider py-4">SKU</TableHead>
                            <TableHead className="text-xs font-bold text-zinc-400 uppercase tracking-wider py-4">Categoría</TableHead>
                            <TableHead className="text-xs font-bold text-zinc-400 uppercase tracking-wider py-4">Stock Total</TableHead>
                            <TableHead className="text-xs font-bold text-zinc-400 uppercase tracking-wider py-4 pr-4 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Fila Modelo 1 - Alto Stock */}
                        <TableRow className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                            <TableCell className="py-4 pl-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 flex-shrink-0">
                                        <ImageIcon className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-zinc-900 text-[15px]">Remera Lisa Premium</span>
                                        <span className="text-sm text-zinc-500">Algodón 100% Pima</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-zinc-500 font-medium text-[15px]">REM-001</TableCell>
                            <TableCell className="py-4 text-zinc-500 font-medium text-[15px]">Remeras</TableCell>
                            <TableCell className="py-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
                                    2.450 un.
                                </span>
                            </TableCell>
                            <TableCell className="py-4 pr-4 text-right">
                                <div className="flex items-center justify-end gap-2 text-zinc-400">
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors text-zinc-900"><ChevronUp className="w-4 h-4" /></button>
                                </div>
                            </TableCell>
                        </TableRow>

                        {/* Expandido Variants */}
                        <TableRow className="border-b border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50">
                            <TableCell colSpan={5} className="py-6 px-4 pl-16">
                                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm px-6 py-4 max-w-4xl">
                                    {/* Variant 1 */}
                                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                                        <div className="flex gap-4 items-center">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest w-24">Variante</span>
                                            <span className="text-[15px] text-zinc-500">Color: <strong className="text-zinc-900 font-medium">Negro</strong> <span className="text-zinc-300 mx-2">|</span> Talle: <strong className="text-zinc-900 font-medium">L</strong></span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Stock</span>
                                                <input type="text" defaultValue="150" className="w-16 h-8 text-center text-sm border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-400" />
                                            </div>
                                            <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Guardar Stock</button>
                                        </div>
                                    </div>
                                    {/* Variant 2 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4 items-center">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest w-24">Variante</span>
                                            <span className="text-[15px] text-zinc-500">Color: <strong className="text-zinc-900 font-medium">Negro</strong> <span className="text-zinc-300 mx-2">|</span> Talle: <strong className="text-zinc-900 font-medium">XL</strong></span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Stock</span>
                                                <input type="text" defaultValue="85" className="w-16 h-8 text-center text-sm border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-400" />
                                            </div>
                                            <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Guardar Stock</button>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>

                        {/* Fila Modelo 2 - Bajo Stock */}
                        <TableRow className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                            <TableCell className="py-4 pl-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 flex-shrink-0">
                                        <ImageIcon className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-zinc-900 text-[15px]">Jean Skinny Fit</span>
                                        <span className="text-sm text-zinc-500">Denim Elastizado</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-zinc-500 font-medium text-[15px]">PNT-452</TableCell>
                            <TableCell className="py-4 text-zinc-500 font-medium text-[15px]">Pantalones</TableCell>
                            <TableCell className="py-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-700">
                                    12 un.
                                </span>
                            </TableCell>
                            <TableCell className="py-4 pr-4 text-right">
                                <div className="flex items-center justify-end gap-2 text-zinc-400">
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"><ChevronDown className="w-4 h-4" /></button>
                                </div>
                            </TableCell>
                        </TableRow>

                        {/* Fila Modelo 3 - Agotado */}
                        <TableRow className="border-none hover:bg-zinc-50/50 transition-colors">
                            <TableCell className="py-4 pl-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 flex-shrink-0">
                                        <ImageIcon className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-zinc-900 text-[15px]">Gorra Urbana Minimal</span>
                                        <span className="text-sm text-zinc-500">Gris Melange</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-zinc-500 font-medium text-[15px]">ACC-019</TableCell>
                            <TableCell className="py-4 text-zinc-500 font-medium text-[15px]">Accesorios</TableCell>
                            <TableCell className="py-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700">
                                    0 un.
                                </span>
                            </TableCell>
                            <TableCell className="py-4 pr-4">
                                <div className="flex items-center justify-end gap-2 text-zinc-400">
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    <button className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"><ChevronDown className="w-4 h-4 text-zinc-300 pointer-events-none" /></button>
                                </div>
                            </TableCell>
                        </TableRow>

                    </TableBody>
                </Table>
            </div>

            <CatalogPagination />
        </div>
    );
}
