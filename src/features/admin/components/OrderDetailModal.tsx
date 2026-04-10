import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package } from 'lucide-react';
// Replaced Order with any to accommodate backend flexible object

interface OrderDetailModalProps {
    order: any | null;
    isOpen: boolean;
    onClose: () => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: 'bg-zinc-200 text-zinc-800' },
    CONFIRMED: { label: 'Aprobado', color: 'bg-blue-100 text-blue-800' },
    SHIPPED: { label: 'Despachado', color: 'bg-amber-100 text-amber-800' },
    DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
    if (!order) return null;

    const statusInfo = statusMap[order.status as keyof typeof statusMap] || { label: order.status, color: 'bg-zinc-200 text-zinc-800' };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-3xl overflow-hidden flex flex-col max-h-[90vh] bg-white">
                <DialogHeader className="shrink-0 pb-4 border-b border-zinc-100 pr-6">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-xl">Pedido {order.id}</DialogTitle>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                        <DialogDescription className="mt-0.5 text-zinc-500">
                            Cliente: <strong className="text-zinc-900 font-semibold">{order.client?.name || order.clientName || 'Consumidor Final'}</strong> · Fecha: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden px-1 py-4 flex flex-col min-h-0">
                    <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2 shrink-0">
                        <Package className="w-4 h-4 text-zinc-500" />
                        Desglose de Artículos
                    </h3>

                    <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                        <div className="overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <Table>
                                <TableHeader className="bg-zinc-50 sticky top-0 z-10 shadow-sm">
                                    <TableRow className="border-b border-zinc-200 hover:bg-transparent">
                                        <TableHead>Producto & Calidad</TableHead>
                                        <TableHead>Color</TableHead>
                                        <TableHead>Talle</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead className="text-right">Precio Un.</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(order.items || order.orderDetails || []).map((item: any, idx: number) => (
                                        <TableRow key={item.id || idx} className="hover:bg-zinc-50/50">
                                            <TableCell>
                                                <p className="font-semibold text-zinc-900">{item.variant?.product?.name || item.productName || 'Producto Múltiple'}</p>
                                                <p className="text-xs text-zinc-500">{item.variant?.product?.category || item.quality || 'N/A'}</p>
                                            </TableCell>
                                            <TableCell className="text-zinc-700">{item.variant?.colorName || item.color || '-'}</TableCell>
                                            <TableCell className="font-medium text-zinc-900">{item.variant?.size || item.size || '-'}</TableCell>
                                            <TableCell className="text-right font-medium text-zinc-900">{item.quantity}</TableCell>
                                            <TableCell className="text-right text-zinc-600">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(item.unitPrice || item.price || 0)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-zinc-900">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format((item.unitPrice || item.price || 0) * item.quantity)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 pt-4 flex justify-between items-center bg-zinc-50 px-6 py-4 rounded-b-lg border-t border-zinc-200 -mx-6 -mb-6 shadow-inner">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Total Artículos</span>
                        <span className="text-sm font-bold text-zinc-900">{order.totalItems} prendas</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Monto Total</span>
                        <span className="text-xl font-black text-zinc-900">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(order.totalAmount)}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
