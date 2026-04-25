import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, PackageOpen, Truck, CheckCircle2, Clock, FileDown } from 'lucide-react';

export function ClientOrdersPage() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const handleDownloadPdf = async (orderId: string, orderNumber?: string) => {
        setIsDownloadingPdf(true);
        try {
            const response = await apiClient.get(`/orders/${orderId}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `remito-${orderNumber || orderId.slice(0, 8).toUpperCase()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('No se pudo generar el remito PDF');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

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
                if (err.response?.status !== 404) {
                    toast.error("Error al cargar pedidos");
                }
            })
            .finally(() => setIsLoading(false));
    }, [user?.reference_id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                        <Clock className="w-3.5 h-3.5" />
                        Pendiente
                    </div>
                );
            case 'CONFIRMED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmado
                    </div>
                );
            case 'SHIPPED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                        <Truck className="w-3.5 h-3.5" />
                        Despachado
                    </div>
                );
            case 'DELIVERED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200">
                        <PackageOpen className="w-3.5 h-3.5" />
                        Entregado
                    </div>
                );
            case 'CANCELLED':
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                        Cancelado
                    </div>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-6 animate-in fade-in duration-500">
            <div className="w-full mx-auto pb-20 flex flex-col gap-6">
                
                <div className="flex flex-col gap-1 px-1">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">Historial de Compras</h2>
                    <p className="text-sm text-zinc-500">Administra y revisa el estado de tus pedidos y envíos.</p>
                </div>

                <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-zinc-500 h-12">Nro. Pedido</TableHead>
                                    <TableHead className="font-semibold text-zinc-500 h-12">Fecha</TableHead>
                                    <TableHead className="font-semibold text-zinc-500 h-12">Estado</TableHead>
                                    <TableHead className="font-semibold text-zinc-500 h-12 text-center">Unidades</TableHead>
                                    <TableHead className="font-semibold text-zinc-500 h-12 text-right">Total</TableHead>
                                    <TableHead className="font-semibold text-zinc-500 h-12 text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                                            <div className="flex justify-center mb-4">
                                                <span className="w-6 h-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                                            </div>
                                            Cargando pedidos...
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                                            No hay pedidos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.slice(0, 10).map((order) => {
                                        const qty = order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                                        return (
                                            <TableRow key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <TableCell className="font-bold text-zinc-900 whitespace-nowrap">
                                                    {order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                                                </TableCell>
                                                <TableCell className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                                                    {formatDate(order.createdAt || new Date().toISOString())}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(order.status)}
                                                </TableCell>
                                                <TableCell className="text-center text-zinc-700 font-semibold">
                                                    {qty}
                                                </TableCell>
                                                <TableCell className="text-right text-zinc-900 font-black">
                                                    {formatPrice(order.totalAmount || 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
                                                        onClick={() => setSelectedOrder(order)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Remito
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Modal Drawer: Detalle Tipo Remito */}
            <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <SheetContent className="flex flex-col gap-0 sm:max-w-lg w-full bg-white p-0 overflow-hidden border-l border-zinc-200 shadow-xl">
                    <div className="p-6 border-b border-zinc-100 shrink-0 bg-white">
                        <SheetHeader>
                            <SheetTitle className="text-xl font-black tracking-tight">
                                Detalle de Pedido #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8).toUpperCase()}
                            </SheetTitle>
                            <SheetDescription className="text-zinc-500 font-medium text-xs">
                                Resumen tipo remito de los artículos comprados.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-50/30">
                        {selectedOrder && (
                            <div className="p-6 flex flex-col gap-6">
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fecha de emisión</span>
                                        <span className="text-sm font-bold text-zinc-900">{formatDate(selectedOrder.createdAt || new Date().toISOString())}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estado de Entrega</span>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest pl-1 border-b border-zinc-200 pb-2">
                                        Artículos ({selectedOrder.items?.length || 0})
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex flex-col p-4 bg-white rounded-xl border border-zinc-200 shadow-sm gap-3 transition-hover hover:border-zinc-300">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-bold text-zinc-900">{item.productName || item.variant?.product?.name || `Producto`}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-zinc-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] bg-zinc-50 border-zinc-200 text-zinc-600 rounded-md px-2 font-semibold">
                                                        {item.variant?.colorName || 'Default'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] bg-zinc-50 border-zinc-200 text-zinc-600 rounded-md px-2 font-black">
                                                        Talle: {item.variant?.size || 'N/A'}
                                                    </Badge>
                                                    <span className="ml-auto text-xs font-bold text-zinc-600">
                                                        {item.quantity} un. x {formatPrice(item.unitPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-zinc-200 bg-white shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total del Pedido</span>
                            <span className="text-2xl font-black text-zinc-900">{selectedOrder ? formatPrice(selectedOrder.totalAmount) : '$0'}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleDownloadPdf(selectedOrder?.id, selectedOrder?.orderNumber)}
                                disabled={isDownloadingPdf}
                                variant="outline"
                                className="flex-1 rounded-xl border-zinc-200 h-12 font-bold gap-2"
                            >
                                {isDownloadingPdf
                                    ? <span className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                                    : <FileDown className="w-4 h-4" />
                                }
                                Descargar PDF
                            </Button>
                            <Button
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white h-12 font-bold transition-all"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
