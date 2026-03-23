import React from 'react';
import { MOCK_CLIENTS, type Client } from '@/mocks/clients';
import { Phone, ShoppingBag, Info, MoreVertical, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ClientListProps {
    role: 'ADMIN' | 'SELLER';
    clients?: Client[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(amount);
};

// Truco de UI: Sacar iniciales para darle un avatar al cliente sin necesitar fotos
const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
};

const SellerClientCard = ({ client }: { client: Client }) => {
    const isDebt = client.balance < 0;

    return (
        <div className="group bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">

            {/* Header: Avatar + Info */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-600 shrink-0">
                        {getInitials(client.name)}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-zinc-900 leading-none mb-1.5">{client.name}</h3>
                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-lg w-fit">
                            CUIT: {client.cuit}
                        </span>
                    </div>
                </div>

                {client.notes && (
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-help transition-colors">
                                    <Info className="h-4 w-4" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-zinc-900 text-zinc-50 max-w-xs text-xs p-2.5">
                                {client.notes}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {/* Saldo visualmente destacado como un "Badge" */}
            <div className="mt-auto mb-5">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border ${isDebt ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                    {formatCurrency(client.balance)}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 pt-4 border-t border-zinc-100">
                <Button
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-lg border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 shrink-0 transition-colors"
                    onClick={() => window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                >
                    <Phone className="h-4 w-4" />
                </Button>
                <Button className="flex-1 h-9 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold shadow-sm transition-transform active:scale-95">
                    <ShoppingBag className="h-3.5 w-3.5 mr-2 opacity-70" />
                    Tomar Pedido
                </Button>
            </div>
        </div>
    );
};

const AdminClientTable = ({ clients }: { clients: Client[] }) => {
    return (
        <div className="w-full bg-white border border-zinc-200/60 rounded-xl shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-zinc-100">
                        <TableHead className="h-11 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cliente</TableHead>
                        <TableHead className="h-11 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contacto</TableHead>
                        <TableHead className="h-11 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Saldo</TableHead>
                        <TableHead className="h-11 w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.length > 0 ? clients.map((client) => {
                        const isDebt = client.balance < 0;
                        return (
                            <TableRow key={client.id} className="hover:bg-zinc-50/80 border-b border-zinc-50 transition-colors group">
                                <TableCell className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                                            {getInitials(client.name)}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-semibold text-zinc-900">{client.name}</span>
                                                {client.notes && (
                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-3.5 w-3.5 text-zinc-300 hover:text-zinc-500 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-zinc-900 text-zinc-50 text-xs max-w-xs p-2.5">
                                                                {client.notes}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-zinc-400 mt-0.5">CUIT: {client.cuit}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-5 py-3 align-middle">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-zinc-700">{client.phone}</span>
                                        <span className="text-[11px] text-zinc-400 mt-0.5">{client.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-5 py-3 align-middle text-right">
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${isDebt ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                        {formatCurrency(client.balance)}
                                    </div>
                                </TableCell>
                                <TableCell className="px-2 py-3 align-middle text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 bg-white border-zinc-200 rounded-xl shadow-md">
                                            <DropdownMenuItem className="text-xs text-zinc-700 cursor-pointer focus:bg-zinc-50">Ver Cuenta Corriente</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs text-zinc-700 cursor-pointer focus:bg-zinc-50">Editar Datos</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs text-zinc-700 cursor-pointer focus:bg-zinc-50">Asignar a Vendedor</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    }) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-sm text-zinc-500">
                                No se encontraron clientes que coincidan con la búsqueda.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export const ClientList: React.FC<ClientListProps> = ({ role, clients = MOCK_CLIENTS }) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

    // Paginación optimizada para 270+ clientes (B2B): 48 tarjetas (múltiplo de 4) o 50 filas de tabla
    const itemsPerPage = role === 'SELLER' ? 48 : 50;

    const filteredAndSortedClients = React.useMemo(() => {
        let result = [...clients];

        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerQuery) ||
                c.cuit.includes(lowerQuery) ||
                c.email.toLowerCase().includes(lowerQuery)
            );
        }

        result.sort((a, b) => {
            const compare = a.name.localeCompare(b.name);
            return sortOrder === 'asc' ? compare : -compare;
        });

        return result;
    }, [clients, searchTerm, sortOrder]);

    const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage) || 1;
    const paginatedClients = filteredAndSortedClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reinicia a la página 1 cuando se busca o cambia el orden
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortOrder]);

    const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    return (
        <div className="w-full flex flex-col gap-5">
            {/* Controles: Búsqueda y Filtros */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200/60 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, CUIT o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-colors"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={toggleSort}
                        className="w-full sm:w-auto h-10 rounded-lg border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-sm transition-all"
                    >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Ordenar {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </Button>
                </div>
            </div>

            {/* Vista condicional del Listado */}
            {role === 'SELLER' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedClients.length > 0 ? (
                        paginatedClients.map((client) => (
                            <SellerClientCard key={client.id} client={client} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="h-8 w-8 text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No hay resultados</h3>
                            <p className="text-sm text-zinc-500">No encontramos ningún cliente que coincida con tu búsqueda.</p>
                        </div>
                    )}
                </div>
            ) : (
                <AdminClientTable clients={paginatedClients} />
            )}

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-5 py-3 border border-zinc-200/60 rounded-xl shadow-sm mt-1">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-zinc-500">
                                Mostrando <span className="font-semibold text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredAndSortedClients.length)}</span> de <span className="font-semibold text-zinc-900">{filteredAndSortedClients.length}</span> clientes
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex shadow-sm gap-2" aria-label="Pagination">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={currentPage === 1}
                                    className="h-9 px-3 rounded-lg border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                                    Anterior
                                </Button>
                                <div className="flex items-center justify-center px-4 h-9 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-semibold text-zinc-900">
                                    {currentPage} / {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleNext}
                                    disabled={currentPage === totalPages}
                                    className="h-9 px-3 rounded-lg border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white"
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                                </Button>
                            </nav>
                        </div>
                    </div>
                    {/* Responsive móvil */}
                    <div className="flex sm:hidden w-full justify-between items-center gap-4">
                        <Button variant="outline" onClick={handlePrev} disabled={currentPage === 1} className="flex-1 rounded-lg">Anterior</Button>
                        <span className="text-sm font-semibold text-zinc-900">{currentPage} / {totalPages}</span>
                        <Button variant="outline" onClick={handleNext} disabled={currentPage === totalPages} className="flex-1 rounded-lg">Siguiente</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientList;