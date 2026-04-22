import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OrderDetailModalProps {
    order: any | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderDetailModal({ order: initialOrder, isOpen, onClose }: OrderDetailModalProps) {
    const [order, setOrder] = useState<any>(initialOrder);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        if (!order?.id) return;
        setIsDownloadingPdf(true);
        try {
            const response = await apiClient.get(`/orders/${order.id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `remito-${order.id.slice(0, 8).toUpperCase()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('No se pudo generar el remito PDF');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    // Sync local state with prop
    useEffect(() => {
        setOrder(initialOrder);
        setError(null);
    }, [initialOrder]);

    // Fetch full order detail (with items) when modal opens
    useEffect(() => {
        if (!isOpen || !order?.id) return;

        const items = order.order_items || order.items || order.orderItems || order.orderDetails || [];
        if (items.length > 0) return; // ya tenemos los items, no hace falta volver a pedir

        setIsFetching(true);
        apiClient.get(`/orders/${order.id}`)
            .then(res => {
                setOrder((prev: any) => ({ ...prev, ...res.data }));
            })
            .catch(err => {
                console.error("Error fetching order details:", err);
                setError("No se pudieron cargar los productos de este pedido.");
            })
            .finally(() => setIsFetching(false));
    }, [isOpen, order?.id]);

    if (!order) return null;

    const items = order.order_items || order.items || order.orderItems || order.orderDetails || [];

    const getStatusInfo = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return { label: 'Pendiente', color: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
            case 'PICKING': return { label: 'En Preparación', color: 'bg-amber-50 text-amber-600 border-amber-200' };
            case 'SHIPPED': return { label: 'Despachado', color: 'bg-blue-50 text-blue-600 border-blue-200' };
            case 'DELIVERED': return { label: 'Entregado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
            case 'CANCELLED': return { label: 'Cancelado', color: 'bg-rose-50 text-rose-600 border-rose-200' };
            default: return { label: status || 'Desconocido', color: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
        }
    };

    const statusInfo = getStatusInfo(order.status);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="shrink-0 mb-4 pr-8">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900">
                                Pedido #{order.id?.slice(0, 8).toUpperCase() || '---'}
                            </DialogTitle>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                        <DialogDescription className="mt-0.5 text-zinc-500">
                            Cliente: <strong className="text-zinc-900 font-semibold">{order.client?.company_name || order.company_name || order.clientName || order.client_name || order.client?.name || 'Consumidor Final'}</strong> · Fecha: {order.created_at || order.createdAt || order.date ? new Date(order.created_at || order.createdAt || order.date).toLocaleDateString() : '---'}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
                            <p className="text-sm font-medium text-zinc-500">Cargando productos...</p>
                        </div>
                    ) : items.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-zinc-100">
                                    <TableHead className="w-[40%] text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Producto</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Color</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Talle</TableHead>
                                    <TableHead className="text-right text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Cant.</TableHead>
                                    <TableHead className="text-right text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item: any, idx: number) => {
                                    const qty = item.quantity || item.qty || 0;
                                    const price = item.unit_price || item.unitPrice || item.price || 0;
                                    const subtotal = item.row_subtotal || item.rowSubtotal || (qty * price) || 0;
                                    const prodName = item.variant?.product?.name || item.product_name || item.productName || item.product?.name || 'Producto';
                                    const color = item.variant?.color_name || item.color_name || item.colorName || item.color || '-';
                                    const size = item.variant?.size_name || item.size_name || item.sizeName || item.size || '-';
                                    const quality = item.variant?.product?.category || item.quality_name || item.qualityName || item.quality || 'N/A';

                                    return (
                                        <TableRow key={item.id || idx} className="hover:bg-zinc-50/50">
                                            <TableCell>
                                                <p className="font-semibold text-zinc-900">{prodName}</p>
                                                <p className="text-xs text-zinc-500">{quality}</p>
                                            </TableCell>
                                            <TableCell className="text-zinc-700">{color}</TableCell>
                                            <TableCell className="font-medium text-zinc-900">{size}</TableCell>
                                            <TableCell className="text-right font-medium text-zinc-900">{qty}</TableCell>
                                            <TableCell className="text-right text-zinc-600 font-bold">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                            <div className="p-3 bg-white rounded-full shadow-sm border border-zinc-100">
                                <Package className="w-6 h-6 text-zinc-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-zinc-900">{error || "No hay productos cargados"}</p>
                                <p className="text-xs text-zinc-500 px-8">Este pedido no contiene items o no se pudieron recuperar del servidor.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 mt-6 pt-4 flex flex-col gap-4 border-t border-zinc-200">
                    {order.observations && (
                        <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">Observaciones</span>
                            <p className="text-xs text-zinc-700 italic">"{order.observations}"</p>
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-zinc-900 px-6 py-4 rounded-xl shadow-lg shadow-zinc-200">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Total Artículos</span>
                            <span className="text-sm font-bold text-white">{(order as any).item_count || (order as any).itemCount || (order as any).totalItems || items.length} prendas</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Monto Final</span>
                            <span className="text-2xl font-black text-white leading-none">
                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format((order as any).total_amount || order.totalAmount || 0)}
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={handleDownloadPdf}
                        disabled={isDownloadingPdf}
                        variant="outline"
                        className="w-full rounded-xl border-zinc-200 h-11 font-bold gap-2"
                    >
                        {isDownloadingPdf
                            ? <span className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                            : <FileDown className="w-4 h-4" />
                        }
                        Descargar Remito PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
