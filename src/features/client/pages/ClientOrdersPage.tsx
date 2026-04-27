import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, PackageOpen, Truck, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';
import { OrderDetailModal } from '@/features/admin/components/OrderDetailModal';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

export function ClientOrdersPage() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    useEffect(() => {
        if (!user?.reference_id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        apiClient.get('/orders', { params: { clientId: user.reference_id } })
            .then(res => setOrders(res.data))
            .catch(err => {
                console.error(err);
                if (err.response?.status !== 404) toast.error("Error al cargar pedidos");
            })
            .finally(() => setIsLoading(false));
    }, [user?.reference_id]);

    const getItemCount = (order: any) =>
        ((order.order_items || order.items || order.orderItems || [])
            .reduce((acc: number, item: any) => acc + (item.quantity || item.qty || 0), 0)) ||
        order.item_count || order.itemCount || order.totalItems || 0;

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDING':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                        <Clock className="w-3 h-3" /> Pendiente
                    </div>
                );
            case 'CONFIRMED':
            case 'PICKING':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Aprobado
                    </div>
                );
            case 'SHIPPED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                        <Truck className="w-3 h-3" /> Despachado
                    </div>
                );
            case 'DELIVERED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100">
                        <PackageOpen className="w-3 h-3" /> Entregado
                    </div>
                );
            case 'CANCELLED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
                        Cancelado
                    </div>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) =>
        new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
            .format(new Date(dateString));

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-6">
            <div className="w-full mx-auto space-y-6 pb-20">

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nro. Pedido</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Prendas</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right pr-6">Detalle</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-zinc-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <span className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                                        <span className="text-sm">Cargando pedidos...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-zinc-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShoppingBag className="w-8 h-8 text-zinc-300" />
                                        <span className="text-sm font-medium">No hay pedidos registrados</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <span className="font-semibold text-zinc-900">
                                            #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-sm">
                                        {formatDate(order.createdAt || order.created_at || new Date().toISOString())}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(order.status)}
                                    </TableCell>
                                    <TableCell className="text-zinc-700 font-medium">
                                        {getItemCount(order)} uds.
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-zinc-900">
                                        {formatCurrency(order.total_amount || order.totalAmount || 0)}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-3 text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                                            Ver
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <OrderDetailModal
                isOpen={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                hideClient
                hidePdf
            />
        </div>
    );
}
