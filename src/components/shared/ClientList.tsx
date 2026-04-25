import React, { useState, useEffect, useCallback, useDeferredValue, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
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
import { EditClientModal } from '@/features/admin/components/EditClientModal';
import { ClientDetailModal } from '@/features/admin/components/ClientDetailModal';
import { Modal } from '@/components/shared/Modal';
import { useOrderDraftStore } from '@/store/orderDraftStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';


export type { Client } from '@/types/client';

export interface ClientListProps {
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(amount);
};

const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n?.[0] ?? '').join('').toUpperCase() || '?';
};

const AVATAR_COLORS = ['#42318B', '#C44A87', '#2DBDD0', '#EFBC4E', '#10b981', '#6366f1'];
const getAvatarColor = (name: string) => {
    if (!name) return AVATAR_COLORS[0];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const AdminClientTable = memo(({
    clients,
    onNewOrder,
    onEditClient,
    onDeleteClient,
    onViewAccount,
    onViewDetail,
}: {
    clients: Client[],
    onNewOrder?: (client: Client) => void,
    onEditClient?: (client: Client) => void,
    onDeleteClient?: (client: Client) => void,
    onViewAccount?: (client: Client) => void,
    onViewDetail?: (client: Client) => void,
}) => {
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
                    const isDebt = client.balance > 0;
                    return (
                        <TableRow
                            key={client.id}
                            className="cursor-pointer hover:bg-zinc-50/80 transition-colors"
                            onClick={() => onViewDetail?.(client)}
                        >
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                        style={{ backgroundColor: getAvatarColor(client.name) }}
                                    >
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
                            <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 transition-colors">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4 text-zinc-400 hover:text-zinc-900" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52 bg-white border-zinc-200 rounded-xl shadow-lg p-1.5">
                                            <DropdownMenuItem
                                                className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg transition-colors"
                                                onClick={() => onNewOrder?.(client)}
                                            >
                                                <ShoppingBag className="w-3.5 h-3.5 text-zinc-400 opacity-80" />
                                                Nuevo Pedido
                                            </DropdownMenuItem>
                                            <div className="h-px bg-zinc-100 my-1 mx-1" />
                                            <DropdownMenuItem 
                                                className="text-xs font-medium text-zinc-700 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg"
                                                onClick={() => onViewAccount?.(client)}
                                            >
                                                Ver Cuenta Corriente
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-xs font-medium text-zinc-700 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg"
                                                onClick={() => onEditClient?.(client)}
                                            >
                                                Editar Datos
                                            </DropdownMenuItem>

                                            <div className="h-px bg-zinc-100 my-1 mx-1" />
                                            <DropdownMenuItem
                                                className="text-xs font-semibold text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700 py-2 rounded-lg"
                                                onClick={() => onDeleteClient?.(client)}
                                            >
                                                Eliminar Cliente
                                            </DropdownMenuItem>
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
});

export const ClientList: React.FC<ClientListProps> = () => {
    const navigate = useNavigate();
    const startDraft = useOrderDraftStore((s) => s.startDraft);

    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentPage, setCurrentPage] = React.useState(1);
    const [searchTerm, setSearchTerm] = React.useState('');
    const deferredSearch = useDeferredValue(searchTerm);
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');



    // Estado para ClientDetailModal
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [clientToView, setClientToView] = React.useState<Client | null>(null);

    // Estado para EditClientModal
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [clientToEdit, setClientToEdit] = React.useState<Client | null>(null);
    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'DEBT'>('ALL');

    // Estado para confirmación de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Carga inicial
    useEffect(() => {
        setIsLoading(true);
        apiClient.get('/clients')
            .then(res => setClients(res.data))
            .catch(err => {
                console.error(err);
                toast.error("Error al cargar la lista de clientes");
            })
            .finally(() => setIsLoading(false));
    }, []);





    const handleViewDetail = useCallback((client: Client) => {
        setClientToView(client);
        setIsDetailModalOpen(true);
    }, []);

    const handleNewOrder = useCallback((client: Client) => {
        startDraft(client.id, client.name);
        navigate(`/ventas/pedido/${client.id}`);
    }, [startDraft, navigate]);

    const handleEditClient = useCallback((client: Client) => {
        setClientToEdit(client);
        setIsEditModalOpen(true);
    }, []);

    const handleViewAccount = useCallback((client: Client) => {
        const user = useAuthStore.getState().user;
        const prefix = user?.role === 'ADMIN' ? '/admin' : '/ventas';
        navigate(`${prefix}/clientes/${client.id}/cuenta`);
    }, [navigate]);

    const handleDeleteClient = useCallback((client: Client) => {
        setClientToDelete(client);
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDeleteClient = async () => {
        if (!clientToDelete) return;
        setIsDeleting(true);
        try {
            await apiClient.delete(`/clients/${clientToDelete.id}`);
            setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
            toast.success('Cliente eliminado', {
                description: `${clientToDelete.name} fue eliminado del sistema.`,
            });
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al eliminar el cliente');
        } finally {
            setIsDeleting(false);
        }
    };

    // Paginación optimizada para 270+ clientes (B2B): 50 filas de tabla
    const itemsPerPage = 50;

    const filteredAndSortedClients = React.useMemo(() => {
        let result = [...clients];

        if (statusFilter === 'DEBT') {
            result = result.filter(c => c.balance > 0);
        } else if (statusFilter === 'ACTIVE') {
            result = result.filter(c => c.balance <= 0);
        }

        if (deferredSearch) {
            const lowerQuery = deferredSearch.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(lowerQuery) ||
                c.cuit?.includes(lowerQuery) ||
                c.email?.toLowerCase().includes(lowerQuery)
            );
        }

        result.sort((a, b) => {
            const compare = a.name.localeCompare(b.name);
            return sortOrder === 'asc' ? compare : -compare;
        });

        return result;
    }, [clients, deferredSearch, sortOrder, statusFilter]);

    const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage) || 1;
    const paginatedClients = filteredAndSortedClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reinicia a la página 1 cuando se busca o cambia el orden
    React.useEffect(() => {
        setCurrentPage(1);
    }, [deferredSearch, sortOrder, statusFilter]);

    const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    return (
        <div className="w-full flex flex-col gap-5">

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
                    {/* Filtros visuales estandarizados con Dropdown funcionales */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0 shadow-sm transition-colors">
                                {statusFilter === 'ALL' ? 'Estado' : statusFilter === 'DEBT' ? 'Con Deuda' : 'Al día'} <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white border border-zinc-200 rounded-xl shadow-lg p-1">
                            <DropdownMenuItem onClick={() => setStatusFilter('ALL')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Todos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Al día</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('DEBT')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-semibold text-red-600 py-2 px-3 outline-none">Con Deuda</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
            {isLoading ? (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 animate-pulse shrink-0" />
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="h-3.5 bg-zinc-100 rounded animate-pulse w-1/3" />
                                <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/4" />
                            </div>
                            <div className="hidden md:flex flex-col gap-2 w-[18%]">
                                <div className="h-3.5 bg-zinc-100 rounded animate-pulse" />
                                <div className="h-3 bg-zinc-100 rounded animate-pulse w-3/4" />
                            </div>
                            <div className="hidden lg:block w-[20%] h-3 bg-zinc-100 rounded animate-pulse" />
                            <div className="ml-auto h-6 w-20 bg-zinc-100 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (
                <AdminClientTable
                    clients={paginatedClients}
                    onNewOrder={handleNewOrder}
                    onEditClient={handleEditClient}
                    onDeleteClient={handleDeleteClient}
                    onViewAccount={handleViewAccount}
                    onViewDetail={handleViewDetail}
                />
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

            <ClientDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => { setIsDetailModalOpen(false); setClientToView(null); }}
                client={clientToView}
                onEdit={(c) => { setClientToEdit(c); setIsEditModalOpen(true); }}
                onDelete={(c) => { setClientToDelete(c); setIsDeleteModalOpen(true); }}
            />

            <EditClientModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setClientToEdit(null); }}
                client={clientToEdit}
            />

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { if (!isDeleting) { setIsDeleteModalOpen(false); setClientToDelete(null); } }}
                title="Eliminar Cliente"
                description={`¿Estás seguro de que querés eliminar a "${clientToDelete?.name}"? Esta acción no se puede deshacer.`}
                maxWidth="sm"
                hideCloseButton
                primaryAction={{
                    label: 'Sí, eliminar',
                    variant: 'destructive',
                    onClick: confirmDeleteClient,
                    isLoading: isDeleting,
                    disabled: isDeleting,
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => { setIsDeleteModalOpen(false); setClientToDelete(null); },
                    disabled: isDeleting,
                }}
            />
        </div>
    );
};

export default ClientList;