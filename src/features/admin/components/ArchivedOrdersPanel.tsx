import { useState, useEffect } from 'react';
import { X, Archive, Loader2, Package } from 'lucide-react';
import { getOrders } from '@/lib/ordersApi';
import type { Order } from '@/types/order';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

interface ArchivedOrdersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderClick: (order: Order) => void;
}

export function ArchivedOrdersPanel({ isOpen, onClose, onOrderClick }: ArchivedOrdersPanelProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        getOrders({ status: 'ARCHIVED' })
            .then(setOrders)
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-zinc-500" />
                        <h2 className="text-base font-bold text-zinc-900">Pedidos Archivados</h2>
                        {!isLoading && (
                            <span className="text-xs font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                                {orders.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-zinc-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Cargando archivados...</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-zinc-400" />
                            </div>
                            <p className="text-sm font-medium text-zinc-500">No hay pedidos archivados</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {orders.map(order => {
                                const clientName = order.client?.company_name || order.client?.name || order.clientName || order.client_name || 'Cliente';
                                const total = order.total_amount || order.totalAmount || 0;
                                const items = order.order_items || order.items || order.orderItems || [];
                                const qty = items.reduce((s: number, i: any) => s + (i.quantity || i.qty || 0), 0) || order.itemCount || order.item_count || 0;
                                const date = order.delivered_at || order.deliveredAt || order.created_at || order.createdAt;

                                return (
                                    <button
                                        key={order.id}
                                        onClick={() => onOrderClick(order)}
                                        className="w-full flex items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 hover:bg-zinc-100 transition-colors text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                                                    #{order.orderNumber || order.id?.slice(0, 8)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-900 truncate">{clientName}</p>
                                            {date && (
                                                <p className="text-xs text-zinc-400 mt-0.5">
                                                    Entregado: {new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 gap-1">
                                            <span className="text-sm font-black text-zinc-900">{formatCurrency(total)}</span>
                                            <span className="text-xs text-zinc-400">{qty} prendas</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
