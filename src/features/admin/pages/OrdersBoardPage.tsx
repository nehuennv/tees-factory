import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react';
import apiClient from '@/lib/apiClient';
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

import { OrderCard } from '../components/OrderCard';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { AdminFastOrderModal } from '../components/AdminFastOrderModal';

type ColumnDef = {
    id: string;
    title: string;
    colorClass: string;
};

const COLUMNS: ColumnDef[] = [
    { id: 'PENDING', title: 'Pendientes', colorClass: 'bg-zinc-100/50' },
    { id: 'PICKING', title: 'Aprobados', colorClass: 'bg-blue-50/40' },
    { id: 'SHIPPED', title: 'Despachados', colorClass: 'bg-amber-50/40' },
    { id: 'DELIVERED', title: 'Entregados', colorClass: 'bg-emerald-50/40' },
];

const BoardColumn = memo(function BoardColumn({
    column,
    orders,
    onOrderClick
}: {
    column: ColumnDef;
    orders: any[];
    onOrderClick: (o: any) => void
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
    const [columns, setColumns] = useState<Record<string, any[]>>({
        PENDING: [], PICKING: [], SHIPPED: [], DELIVERED: []
    });

    const [isLoading, setIsLoading] = useState(true);
    const [activeOrder, setActiveOrder] = useState<any | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [isFastOrderModalOpen, setIsFastOrderModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [amountPopoverOpen, setAmountPopoverOpen] = useState(false);
    const amountPopoverRef = useRef<HTMLDivElement>(null);
    const amountBtnRef = useRef<HTMLButtonElement>(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });

    useEffect(() => {
        setIsLoading(true);
        apiClient.get('/orders')
            .then(res => {
                if (res.data.length > 0) {
                    console.log('[OrdersBoard] Primer orden recibida:', res.data[0]);
                }
                const initial: Record<string, any[]> = { PENDING: [], PICKING: [], SHIPPED: [], DELIVERED: [], CANCELLED: [] };
                res.data.forEach((order: any) => {
                    if (initial[order.status]) {
                        initial[order.status].push(order);
                    } else {
                        initial['PENDING'].push(order);
                    }
                });
                setColumns(initial);
            })
            .catch(err => {
                console.error(err);
                toast.error("Error al cargar pedidos");
            })
            .finally(() => setIsLoading(false));
    }, []);

    const filteredColumns = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const result: Record<string, any[]> = { PENDING: [], PICKING: [], SHIPPED: [], DELIVERED: [], CANCELLED: [] };

        const min = minAmount !== '' ? parseFloat(minAmount) : null;
        const max = maxAmount !== '' ? parseFloat(maxAmount) : null;

        (Object.keys(columns)).forEach(status => {
            result[status] = columns[status].filter(o => {
                const clientNameStr = o.client?.name || o.clientName || "";
                const matchesSearch = !searchTerm.trim() || o.id.toLowerCase().includes(lowerSearch) || clientNameStr.toLowerCase().includes(lowerSearch);
                const amount = o.totalAmount ?? 0;
                const matchesMin = min === null || amount >= min;
                const matchesMax = max === null || amount <= max;
                return matchesSearch && matchesMin && matchesMax;
            });
        });
        return result;
    }, [columns, searchTerm, minAmount, maxAmount]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = useCallback((id: string | number) => {
        if (COLUMNS.some(c => c.id === id)) return id as string;
        return (Object.keys(columns)).find(key =>
            columns[key]?.some(item => item.id === id)
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

            apiClient.patch(`/orders/${draggedOrder.id}/status`, { status: overContainer })
                .then(() => {
                    if (overContainer === 'PICKING') {
                        toast.success('Pedido aprobado — pago conciliado', {
                            description: 'Se está enviando el email "En Preparación" al cliente automáticamente.',
                            duration: 6000,
                        });
                    } else {
                        toast.success(`Pedido movido a ${colTitle}`);
                    }
                })
                .catch(err => {
                    console.error(err);
                    toast.error("Error al mover el pedido. Refresque la página.");
                });
        }
    }, [activeOrder, columns, findContainer]);

    useEffect(() => {
        if (!amountPopoverOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (amountPopoverRef.current && !amountPopoverRef.current.contains(e.target as Node)) {
                setAmountPopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [amountPopoverOpen]);

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
                    {/* Filtro Monto — popover con min/max */}
                    <div className="relative shrink-0" ref={amountPopoverRef}>
                        <button
                            ref={amountBtnRef}
                            onClick={() => {
                                const rect = amountBtnRef.current?.getBoundingClientRect();
                                if (rect) {
                                    setPopoverPos({
                                        top: rect.bottom + 8,
                                        right: window.innerWidth - rect.right,
                                    });
                                }
                                setAmountPopoverOpen(v => !v);
                            }}
                            className={`flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium border transition-colors shadow-sm whitespace-nowrap focus:outline-none ${
                                minAmount || maxAmount
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50'
                            }`}
                        >
                            {minAmount || maxAmount
                                ? `$${minAmount || '0'} — $${maxAmount || '∞'}`
                                : 'Filtro Monto'
                            }
                            <ChevronDown className="w-3 h-3 ml-2 opacity-60" />
                        </button>
                    </div>
                    <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block shrink-0"></div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setMinAmount('');
                            setMaxAmount('');
                            setAmountPopoverOpen(false);
                        }}
                        className="flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium text-zinc-500 hover:text-zinc-900 whitespace-nowrap shrink-0 transition-colors">
                        Limpiar filtros
                    </button>
                    <button 
                        onClick={() => setIsFastOrderModalOpen(true)}
                        className="flex items-center justify-center rounded-xl h-10 px-4 ml-1 sm:ml-2 bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm whitespace-nowrap shrink-0"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Nuevo Pedido
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 overflow-x-auto custom-scrollbar pb-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-zinc-500 h-full">
                        <span className="w-8 h-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin mb-4" />
                        <p className="font-medium animate-pulse">Cargando tablero...</p>
                    </div>
                ) : (
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
                )}
            </div>

            <OrderDetailModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
            <AdminFastOrderModal
                isOpen={isFastOrderModalOpen}
                onClose={() => setIsFastOrderModalOpen(false)}
            />

            {/* Popover de filtro monto — fixed para escapar del overflow */}
            {amountPopoverOpen && (
                <div
                    ref={amountPopoverRef}
                    style={{ position: 'fixed', top: popoverPos.top, right: popoverPos.right, zIndex: 9999 }}
                    className="bg-white border border-zinc-200 rounded-2xl shadow-xl p-4 w-64"
                >
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Rango de monto ($)</p>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-600">Mínimo</label>
                            <input
                                type="number"
                                min={0}
                                placeholder="Ej: 500000"
                                value={minAmount}
                                onChange={e => setMinAmount(e.target.value)}
                                className="h-9 rounded-lg border border-zinc-200 px-3 text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-600">Máximo</label>
                            <input
                                type="number"
                                min={0}
                                placeholder="Ej: 3000000"
                                value={maxAmount}
                                onChange={e => setMaxAmount(e.target.value)}
                                className="h-9 rounded-lg border border-zinc-200 px-3 text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => { setMinAmount(''); setMaxAmount(''); setAmountPopoverOpen(false); }}
                            className="flex-1 h-8 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={() => setAmountPopoverOpen(false)}
                            className="flex-1 h-8 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}