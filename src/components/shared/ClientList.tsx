import React from 'react';
import { MOCK_CLIENTS, type Client } from '@/mocks/clients';
import { ShoppingBag, MoreHorizontal, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
import { AssignSellerModal } from '@/features/admin/components/AssignSellerModal';


export interface ClientListProps {
    role: 'ADMIN' | 'SELLER';
    clients?: Client[];
    currentUserId?: string;
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

const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const AdminClientTable = ({ clients, role }: { clients: Client[], role: 'ADMIN' | 'SELLER' }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Saldo</TableHead>
                    <TableHead className="w-[80px] text-right pr-6">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {clients.length > 0 ? clients.map((client: Client) => {
                    const isDebt = client.balance < 0;
                    return (
                        <TableRow key={client.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                                        {getInitials(client.name)}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-semibold text-zinc-900">{client.name}</span>
                                        </div>
                                        <span className="text-[11px] text-zinc-400 mt-0.5">CUIT: {client.cuit}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-zinc-700">{client.phone}</span>
                                    <span className="text-[11px] text-zinc-400 mt-0.5">{client.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {client.notes ? (
                                    <span className="text-zinc-500 text-[13px] italic">
                                        "{truncateText(client.notes)}"
                                    </span>
                                ) : (
                                    <span className="text-zinc-300 text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${isDebt ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                    {formatCurrency(client.balance)}
                                </div>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                                <div className="flex items-center justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 transition-colors">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4 text-zinc-400 hover:text-zinc-900" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52 bg-white border-zinc-200 rounded-xl shadow-lg p-1.5">
                                            <DropdownMenuItem className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg transition-colors">
                                                <ShoppingBag className="w-3.5 h-3.5 text-zinc-400 opacity-80" />
                                                Nuevo Pedido
                                            </DropdownMenuItem>
                                            <div className="h-px bg-zinc-100 my-1 mx-1" />
                                            <DropdownMenuItem className="text-xs font-medium text-zinc-700 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg">Ver Cuenta Corriente</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-medium text-zinc-700 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg">Editar Datos</DropdownMenuItem>
                                            {role === 'ADMIN' && (
                                                <DropdownMenuItem
                                                    className="text-xs font-medium text-zinc-700 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg"
                                                    onClick={() => {
                                                        // This will be handled by the parent state
                                                        (window as any).openAssignSellerModal?.(client);
                                                    }}
                                                >
                                                    Asignar a Vendedor
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                }) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-sm text-zinc-500">
                            No se encontraron clientes que coincidan con la búsqueda.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export const ClientList: React.FC<ClientListProps> = ({ role, clients = MOCK_CLIENTS, currentUserId }) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

    // Estado para el modal de asignación
    const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
    const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);

    // Exponer el modal al componente hijo (AdminClientTable) mediante window para evitar prop drilling complejo en este mock
    // En una app real usaríamos Context o pasaríamos callbacks.
    React.useEffect(() => {
        (window as any).openAssignSellerModal = (client: Client) => {
            setSelectedClient(client);
            setIsAssignModalOpen(true);
        };
        return () => {
            delete (window as any).openAssignSellerModal;
        };
    }, []);

    const handleAssign = (sellerId: string | null) => {
        console.log(`Asignando vendedor ${sellerId} al cliente ${selectedClient?.id}`);
        // Aquí iría la lógica de actualización
        setIsAssignModalOpen(false);
    };

    // Paginación optimizada para 270+ clientes (B2B): 50 filas de tabla
    const itemsPerPage = 50;

    const filteredAndSortedClients = React.useMemo(() => {
        let result = [...clients];

        // Filtrado por rol: El vendedor solo ve sus clientes asignados
        if (role === 'SELLER' && currentUserId) {
            result = result.filter(c => c.sellerId === currentUserId);
        }

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
            {selectedClient && (
                <AssignSellerModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    clientName={selectedClient.name}
                    onAssign={handleAssign}
                />
            )}
            {/* Controles: Búsqueda y Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-2">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, CUIT o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400 text-zinc-800 shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {/* Filtros visuales estandarizados */}
                    <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0">
                        Estado <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                    </Button>
                    <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block shrink-0"></div>
                    <Button
                        variant="outline"
                        onClick={toggleSort}
                        className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0 shadow-sm"
                    >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Ordenar {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </Button>
                </div>
            </div>

            {/* Vista unificada: Tabla para ambos roles */}
            <AdminClientTable clients={paginatedClients} role={role} />

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