import { useState, useMemo, memo, useCallback } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    useDndContext,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { MOCK_ORDERS } from '@/mocks/orders';
import type { Order, OrderStatus } from '@/mocks/orders';
import { OrderCard } from '../components/OrderCard';
import { OrderDetailModal } from '../components/OrderDetailModal';

type ColumnDef = {
    id: OrderStatus;
    title: string;
    colorClass: string;
};

const COLUMNS: ColumnDef[] = [
    { id: 'NEW', title: 'Nuevos', colorClass: 'bg-zinc-100/50' },
    { id: 'PAID', title: 'Pagados', colorClass: 'bg-blue-50/40' },
    { id: 'PREPARING', title: 'En Preparación', colorClass: 'bg-amber-50/40' },
    { id: 'DISPATCHED', title: 'Despachados', colorClass: 'bg-emerald-50/40' },
];

const BoardColumn = memo(function BoardColumn({
    column,
    orders,
    onOrderClick
}: {
    column: ColumnDef;
    orders: Order[];
    onOrderClick: (o: Order) => void
}) {
    const { setNodeRef } = useDroppable({ id: column.id });
    const { over } = useDndContext();
    const itemIds = useMemo(() => orders.map(o => o.id), [orders]);

    const isOverColumn = over?.id === column.id || itemIds.includes(over?.id as string);

    const highlightStyle = isOverColumn
        ? 'ring-2 ring-inset ring-zinc-400 bg-zinc-200/60'
        : `ring-1 ring-inset ring-zinc-200/50 ${column.colorClass}`;

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-xl p-4 h-full shadow-sm transition-colors duration-200 border border-zinc-200/60 ${highlightStyle}`}
        >
            <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                <h2 className="font-bold text-zinc-800 tracking-tight">{column.title}</h2>
                <span className="bg-white text-zinc-500 text-xs font-bold px-2.5 py-1 rounded-full border border-zinc-200 shadow-sm">
                    {orders.length}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 -mx-2 px-2">
                <div className="flex flex-col gap-3 min-h-full pb-2">
                    <SortableContext id={column.id} items={itemIds} strategy={verticalListSortingStrategy}>
                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} onClick={onOrderClick} />
                        ))}
                    </SortableContext>
                </div>
            </div>
        </div>
    );
});

export function OrdersBoardPage() {
    const [columns, setColumns] = useState<Record<OrderStatus, Order[]>>(() => {
        const initial = { NEW: [], PAID: [], PREPARING: [], DISPATCHED: [] } as Record<OrderStatus, Order[]>;
        MOCK_ORDERS.forEach(order => initial[order.status].push(order));
        return initial;
    });

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [minAmountFilter, setMinAmountFilter] = useState<number | null>(null);

    const filteredColumns = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const result = { NEW: [], PAID: [], PREPARING: [], DISPATCHED: [] } as Record<OrderStatus, Order[]>;

        (Object.keys(columns) as OrderStatus[]).forEach(status => {
            result[status] = columns[status].filter(
                o => {
                    const matchesSearch = !searchTerm.trim() || o.id.toLowerCase().includes(lowerSearch) || o.clientName.toLowerCase().includes(lowerSearch);
                    const matchesAmount = minAmountFilter === null || o.totalAmount >= minAmountFilter;
                    return matchesSearch && matchesAmount;
                }
            );
        });
        return result;
    }, [columns, searchTerm, minAmountFilter]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = useCallback((id: string | number) => {
        if (COLUMNS.some(c => c.id === id)) return id as OrderStatus;
        return (Object.keys(columns) as OrderStatus[]).find(key =>
            columns[key].some(item => item.id === id)
        );
    }, [columns]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        document.body.style.cursor = 'grabbing'; // Fija el cursor globalmente
        const container = findContainer(event.active.id);
        if (!container) return;
        const order = columns[container].find((o) => o.id === event.active.id);
        if (order) setActiveOrder(order);
    }, [columns, findContainer]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        document.body.style.cursor = ''; // Restaura el cursor
        const { active, over } = event;
        const draggedOrder = activeOrder;
        setActiveOrder(null);

        if (!over) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);

        if (!activeContainer || !overContainer) return;

        if (activeContainer === overContainer) {
            const activeIndex = columns[activeContainer].findIndex(i => i.id === active.id);
            const overIndex = columns[overContainer].findIndex(i => i.id === over.id);

            if (activeIndex !== overIndex) {
                setColumns((prev) => ({
                    ...prev,
                    [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
                }));
            }
        } else {
            setColumns((prev) => {
                const activeItems = prev[activeContainer];
                const overItems = prev[overContainer];
                const activeIndex = activeItems.findIndex(i => i.id === active.id);
                const overIndex = overItems.findIndex(i => i.id === over.id);

                const newIndex = overIndex >= 0 ? overIndex : overItems.length;
                const activeItem = { ...activeItems[activeIndex], status: overContainer };

                return {
                    ...prev,
                    [activeContainer]: activeItems.filter(item => item.id !== active.id),
                    [overContainer]: [
                        ...overItems.slice(0, newIndex),
                        activeItem,
                        ...overItems.slice(newIndex)
                    ]
                };
            });
        }

        if (draggedOrder && draggedOrder.status !== overContainer) {
            const colTitle = COLUMNS.find(c => c.id === overContainer)?.title;
            toast.success(`Pedido movido a ${colTitle}`);
        }
    }, [activeOrder, columns, findContainer]);

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
    };

    return (
        <div className="h-full w-full overflow-hidden bg-zinc-50 p-6 flex flex-col animate-in fade-in duration-500">
            {/* Toolbar Estandarizada */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 shrink-0 z-10">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID o cliente..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400 text-zinc-800 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium text-zinc-600 border border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:ring-offset-2">
                            {minAmountFilter === null ? 'Filtro Monto' : `> $${minAmountFilter / 1000}k`} <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border border-zinc-200 rounded-xl shadow-lg p-1">
                            <DropdownMenuItem onClick={() => setMinAmountFilter(null)} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 focus:bg-zinc-100 focus:text-zinc-900 outline-none">
                                Ver Todos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMinAmountFilter(1000000)} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 focus:bg-zinc-100 focus:text-zinc-900 outline-none">
                                Mayores a $1.000.000
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMinAmountFilter(2000000)} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 focus:bg-zinc-100 focus:text-zinc-900 outline-none">
                                Mayores a $2.000.000
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block shrink-0"></div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setMinAmountFilter(null);
                        }}
                        className="flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium text-zinc-500 hover:text-zinc-900 whitespace-nowrap shrink-0 transition-colors">
                        Limpiar filtros
                    </button>
                    <button className="flex items-center justify-center rounded-xl h-10 px-4 ml-1 sm:ml-2 bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm whitespace-nowrap shrink-0">
                        <Plus className="w-4 h-4 mr-1.5" /> Nuevo Pedido
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 overflow-x-auto custom-scrollbar pb-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-4 gap-6 h-full min-w-[1100px]">
                        {COLUMNS.map((col) => (
                            <div key={col.id} className="min-h-0 h-full">
                                <BoardColumn
                                    column={col}
                                    orders={filteredColumns[col.id]}
                                    onOrderClick={(order) => setSelectedOrder(order)}
                                />
                            </div>
                        ))}
                    </div>

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeOrder ? (
                            <div className="opacity-90 rotate-2 scale-105 transition-transform shadow-2xl cursor-grabbing">
                                <OrderCard order={activeOrder} onClick={() => { }} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <OrderDetailModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
        </div>
    );
}