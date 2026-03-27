import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Package } from 'lucide-react';
import type { Order } from '@/mocks/orders';

interface OrderCardProps {
    order: Order;
    onClick: (order: Order) => void;
}

export const OrderCard = memo(function OrderCard({ order, onClick }: OrderCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: order.id,
        data: {
            type: 'Order',
            order,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-full bg-zinc-50 border-2 border-zinc-300 border-dashed rounded-xl h-[116px] opacity-60"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all group flex flex-col overflow-hidden"
        >
            {/* DRAG HANDLE: Toda la barra superior ahora es el área de agarre */}
            <div
                className="bg-zinc-50/80 hover:bg-zinc-100 border-b border-zinc-100 px-3 py-2.5 flex justify-between items-center cursor-grab active:cursor-grabbing transition-colors"
                {...attributes}
                {...listeners}
            >
                <span className="text-xs font-black text-zinc-500 tracking-wider uppercase">
                    {order.id}
                </span>
                <GripHorizontal className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>

            {/* CARD BODY: Click para abrir modal */}
            <div
                className="p-3 flex flex-col gap-2 cursor-pointer bg-white hover:bg-zinc-50/50 transition-colors"
                onClick={() => onClick(order)}
            >
                <span className="text-sm text-zinc-900 font-bold leading-tight line-clamp-2" title={order.clientName}>
                    {order.clientName}
                </span>

                <div className="flex justify-between items-end mt-1 pt-1 border-t border-zinc-100/50">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                        <Package className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">{order.totalItems} prendas</span>
                    </div>
                    <span className="text-sm font-black text-zinc-900">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(order.totalAmount)}
                    </span>
                </div>
            </div>
        </div>
    );
});