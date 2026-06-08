import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react';
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
import { Search, ChevronDown, Plus, Archive, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { OrderCard } from '../components/OrderCard';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { AdminFastOrderModal } from '../components/AdminFastOrderModal';
import { CancelOrderDialog } from '../components/CancelOrderDialog';
import { OrderEditModal } from '../components/OrderEditModal';
import { ArchivedOrdersPanel } from '../components/ArchivedOrdersPanel';
import apiClient from '@/lib/apiClient';
import { patchOrderStatus } from '@/lib/ordersApi';
import { useAuthStore } from '@/store/authStore';
import type { Order, OrderStatus } from '@/types/order';
import { ALLOWED_TRANSITIONS, DISPATCH_LABELS } from '@/types/order';
import type { DispatchType } from '@/types/order';

type ColumnDef = {
    id: string;
    title: string;
    colorClass: string;
    dotClass: string;
    badgeClass: string;
};

const COLUMNS: ColumnDef[] = [
    { id: 'IN_REVIEW',      title: 'En Revisión',    colorClass: 'bg-zinc-100/50',    dotClass: 'bg-zinc-400',    badgeClass: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
    { id: 'APPROVED',       title: 'Aprobados',       colorClass: 'bg-emerald-50/40',  dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'IN_PREPARATION', title: 'En Preparación',  colorClass: 'bg-blue-50/40',     dotClass: 'bg-blue-500',    badgeClass: 'bg-blue-100 text-blue-600 border-blue-200' },
    { id: 'SHIPPED',        title: 'Despachados',     colorClass: 'bg-amber-50/40',    dotClass: 'bg-amber-500',   badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'DELIVERED',      title: 'Entregados',      colorClass: 'bg-purple-50/40',   dotClass: 'bg-purple-500',  badgeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
];

const STATUS_LABELS: Record<string, string> = {
    IN_REVIEW: 'En Revisión',
    APPROVED: 'Aprobados',
    IN_PREPARATION: 'En Preparación',
    SHIPPED: 'Despachados',
    DELIVERED: 'Entregados',
    ARCHIVED: 'Archivados',
    CANCELLED: 'Cancelados',
};

// Accordion for SHIPPED column grouped by dispatchType
const ShippedAccordion = memo(function ShippedAccordion({
    orders,
    onOrderClick,
    seenIds,
    isFirstVisit,
    isAdmin,
}: {
    orders: Order[];
    onOrderClick: (o: Order) => void;
    seenIds: Set<string>;
    isFirstVisit: boolean;
    isAdmin: boolean;
}) {
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['null', 'PUNTO_PILAR', 'CORREO', 'ENCOMIENDA', 'MOTOMENSAJERIA']));

    const groups = useMemo(() => {
        const map: Record<string, Order[]> = {};
        orders.forEach(o => {
            const key = (o.dispatchType || o.dispatch_type || 'null') as string;
            if (!map[key]) map[key] = [];
            map[key].push(o);
        });
        return map;
    }, [orders]);

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (orders.length === 0) {
        return <div className="text-sm text-zinc-400 italic px-1 py-4 text-center">Sin pedidos</div>;
    }

    const itemIds = orders.map(o => o.id);

    return (
        <SortableContext id="SHIPPED" items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
                {Object.entries(groups).map(([key, groupOrders]) => {
                    const label = key === 'null' ? 'Sin asignar' : (DISPATCH_LABELS[key as DispatchType] || key);
                    const isOpen = openGroups.has(key);
                    return (
                        <div key={key} className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                            <button
                                onClick={() => toggleGroup(key)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                            >
                                <span className="text-xs font-bold text-zinc-600">{label}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-zinc-500 bg-zinc-200 px-1.5 py-0.5 rounded-full">
                                        {groupOrders.length}
                                    </span>
                                    {isOpen
                                        ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                        : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                                    }
                                </div>
                            </button>
                            {isOpen && (
                                <div className="flex flex-col gap-2 p-2">
                                    {groupOrders.map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onClick={onOrderClick}
                                            isNew={!isFirstVisit && !seenIds.has(order.id)}
                                            isDragDisabled={!isAdmin}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </SortableContext>
    );
});

const BoardColumn = memo(function BoardColumn({
    column,
    orders,
    onOrderClick,
    seenIds,
    isFirstVisit,
    isAdmin,
    onOpenArchived,
}: {
    column: ColumnDef;
    orders: Order[];
    onOrderClick: (o: Order) => void;
    seenIds: Set<string>;
    isFirstVisit: boolean;
    isAdmin: boolean;
    onOpenArchived?: () => void;
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
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${column.dotClass}`} />
                    <h2 className="font-bold text-zinc-800 tracking-tight">{column.title}</h2>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm ${column.badgeClass}`}>
                    {orders.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 -mx-2 px-2">
                {column.id === 'SHIPPED' ? (
                    <ShippedAccordion
                        orders={orders}
                        onOrderClick={onOrderClick}
                        seenIds={seenIds}
                        isFirstVisit={isFirstVisit}
                        isAdmin={isAdmin}
                    />
                ) : (
                    <div className="flex flex-col gap-3 min-h-full pb-2">
                        <SortableContext id={column.id} items={itemIds} strategy={verticalListSortingStrategy}>
                            {orders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onClick={onOrderClick}
                                    isNew={!isFirstVisit && !seenIds.has(order.id)}
                                    isDragDisabled={!isAdmin}
                                />
                            ))}
                        </SortableContext>
                    </div>
                )}
            </div>

            {/* DELIVERED: link to archived */}
            {column.id === 'DELIVERED' && onOpenArchived && (
                <button
                    onClick={onOpenArchived}
                    className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors py-1.5 border-t border-zinc-200/60"
                >
                    <Archive className="w-3.5 h-3.5" />
                    Ver historial de archivados
                </button>
            )}
        </div>
    );
});

const EMPTY_COLS: Record<string, Order[]> = {
    IN_REVIEW: [], APPROVED: [], IN_PREPARATION: [], SHIPPED: [], DELIVERED: [], CANCELLED: []
};

export function OrdersBoardPage() {
    const user = useAuthStore(s => s.user);
    const isAdmin = user?.role === 'ADMIN';

    const [columns, setColumns] = useState<Record<string, Order[]>>(EMPTY_COLS);

    const SEEN_KEY = 'admin_seen_order_ids';
    const [isFirstVisit] = useState(() => !localStorage.getItem(SEEN_KEY));
    const [seenIds, setSeenIds] = useState<Set<string>>(() => {
        const stored = localStorage.getItem(SEEN_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });

    const [isLoading, setIsLoading] = useState(true);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
    const [isFastOrderModalOpen, setIsFastOrderModalOpen] = useState(false);
    const [isArchivedOpen, setIsArchivedOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [amountPopoverOpen, setAmountPopoverOpen] = useState(false);
    const amountPopoverRef = useRef<HTMLDivElement>(null);
    const amountBtnRef = useRef<HTMLButtonElement>(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (!isFirstVisit) return;
        const allIds = Object.values(columns).flat().map((o: Order) => o.id);
        if (allIds.length === 0) return;
        const newSet = new Set(allIds);
        setSeenIds(newSet);
        localStorage.setItem(SEEN_KEY, JSON.stringify([...newSet]));
    }, [columns, isFirstVisit]);

    useEffect(() => {
        return () => {
            const allIds = Object.values(columns).flat().map((o: Order) => o.id);
            const stored = localStorage.getItem(SEEN_KEY);
            const existing: Set<string> = stored ? new Set(JSON.parse(stored)) : new Set();
            allIds.forEach((id: string) => existing.add(id));
            localStorage.setItem(SEEN_KEY, JSON.stringify([...existing]));
        };
    }, [columns]);

    const fetchOrders = useCallback(() => {
        setIsLoading(true);
        apiClient.get('/orders', { params: { deliveredWithinDays: 7 } })
            .then(res => {
                const data: Order[] = Array.isArray(res.data) ? res.data : [];
                const initial: Record<string, Order[]> = { IN_REVIEW: [], APPROVED: [], IN_PREPARATION: [], SHIPPED: [], DELIVERED: [], CANCELLED: [], ARCHIVED: [] };
                data.forEach((order) => {
                    const s = order.status as string;
                    if (s in initial) initial[s].push(order);
                    // unknown status → silently ignore, don't pollute IN_REVIEW
                });
                setColumns(initial);
            })
            .catch(() => toast.error('Error al cargar pedidos'))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filteredColumns = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const min = minAmount !== '' ? parseFloat(minAmount) : null;
        const max = maxAmount !== '' ? parseFloat(maxAmount) : null;
        const result: Record<string, Order[]> = { IN_REVIEW: [], APPROVED: [], IN_PREPARATION: [], SHIPPED: [], DELIVERED: [], CANCELLED: [] };

        Object.keys(columns).forEach(status => {
            result[status] = columns[status].filter(o => {
                const clientNameStr = (o as any).client?.name || (o as any).client?.company_name || (o as any).clientName || (o as any).client_name || '';
                const matchesSearch = !searchTerm.trim()
                    || o.id.toLowerCase().includes(lowerSearch)
                    || clientNameStr.toLowerCase().includes(lowerSearch)
                    || String(o.orderNumber || '').includes(lowerSearch);
                const amount = o.total_amount || o.totalAmount || 0;
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
        return Object.keys(columns).find(key => columns[key]?.some(item => item.id === id));
    }, [columns]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!isAdmin) return;
        document.body.style.cursor = 'grabbing';
        const container = findContainer(event.active.id);
        if (!container) return;
        const order = columns[container].find((o) => o.id === event.active.id);
        if (order) setActiveOrder(order);
    }, [columns, findContainer, isAdmin]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        document.body.style.cursor = '';
        const { active, over } = event;
        const draggedOrder = activeOrder;
        setActiveOrder(null);

        if (!over || !draggedOrder) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);

        if (!activeContainer || !overContainer) return;

        if (activeContainer === overContainer) {
            const activeIndex = columns[activeContainer].findIndex(i => i.id === active.id);
            const overIndex = columns[overContainer].findIndex(i => i.id === over.id);
            if (activeIndex !== overIndex) {
                setColumns(prev => ({
                    ...prev,
                    [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
                }));
            }
            return;
        }

        // Guard: no aprobar con servicios extra sin cotizar
        if (overContainer === 'APPROVED' && (draggedOrder as any).extrasQuoteStatus === 'PENDING_QUOTE') {
            toast.error('Cotizá los extras primero', {
                description: 'El pedido tiene servicios sin precio. Cotizalos en "Editar pedido → Servicios" antes de aprobar.',
            });
            return;
        }

        // Validate transition client-side first
        const allowed = ALLOWED_TRANSITIONS[draggedOrder.status];
        if (!allowed.includes(overContainer as OrderStatus)) {
            const allowedLabels = allowed.map(s => STATUS_LABELS[s] || s).join(', ');
            toast.error(`Transición inválida`, {
                description: allowedLabels
                    ? `Desde ${STATUS_LABELS[draggedOrder.status]} solo podés mover a: ${allowedLabels}`
                    : `${STATUS_LABELS[draggedOrder.status]} no permite más movimientos`,
            });
            return;
        }

        // Optimistic update
        setColumns(prev => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex(i => i.id === active.id);
            const overIndex = overItems.findIndex(i => i.id === over.id);
            const newIndex = overIndex >= 0 ? overIndex : overItems.length;
            const activeItem = { ...activeItems[activeIndex], status: overContainer as OrderStatus };

            return {
                ...prev,
                [activeContainer]: activeItems.filter(item => item.id !== active.id),
                [overContainer]: [
                    ...overItems.slice(0, newIndex),
                    activeItem,
                    ...overItems.slice(newIndex),
                ],
            };
        });

        const colTitle = COLUMNS.find(c => c.id === overContainer)?.title;

        patchOrderStatus(draggedOrder.id, overContainer as OrderStatus)
            .then(() => {
                if (overContainer === 'IN_PREPARATION') {
                    toast.success('Pedido enviado a preparación', {
                        description: 'Se enviará el email "En Preparación" al cliente automáticamente.',
                        duration: 6000,
                    });
                } else {
                    toast.success(`Pedido movido a ${colTitle}`);
                }
            })
            .catch(err => {
                // Rollback on error
                setColumns(prev => {
                    const overItems = prev[overContainer];
                    const activeItems = prev[activeContainer];
                    const item = overItems.find(i => i.id === draggedOrder.id);
                    if (!item) return prev;
                    return {
                        ...prev,
                        [overContainer]: overItems.filter(i => i.id !== draggedOrder.id),
                        [activeContainer]: [...activeItems, { ...item, status: draggedOrder.status }],
                    };
                });

                const serverAllowed: string[] | undefined = err?.response?.data?.allowed;
                if (err?.response?.status === 409 && serverAllowed) {
                    const labels = serverAllowed.map(s => STATUS_LABELS[s] || s).join(', ');
                    toast.error('Transición no permitida', { description: `Podés mover a: ${labels}` });
                } else {
                    const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
                    toast.error('Error al mover el pedido', {
                        description: backendMsg || `HTTP ${err?.response?.status ?? 'sin respuesta'} — Refresque la página.`,
                        duration: 8000,
                    });
                }
            });
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

    const handleOrderSaved = useCallback((updated: Partial<Order> & { id: string }) => {
        setColumns(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(status => {
                next[status] = next[status].map(o => o.id === updated.id ? { ...o, ...updated } : o);
            });
            return next;
        });
        if (selectedOrder?.id === updated.id) {
            setSelectedOrder(prev => prev ? { ...prev, ...updated } : null);
        }
    }, [selectedOrder]);

    const handleOrderCancelled = useCallback((orderId: string) => {
        setColumns(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(status => {
                next[status] = next[status].filter(o => o.id !== orderId);
            });
            return next;
        });
        setSelectedOrder(null);
        setEditingOrder(null);
    }, []);

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
    };

    return (
        <div className="h-full w-full overflow-hidden bg-zinc-50 p-6 flex flex-col animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 shrink-0 z-10">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID, número o cliente..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400 text-zinc-800 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                    <div className="relative shrink-0" ref={amountPopoverRef}>
                        <button
                            ref={amountBtnRef}
                            onClick={() => {
                                const rect = amountBtnRef.current?.getBoundingClientRect();
                                if (rect) setPopoverPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                                setAmountPopoverOpen(v => !v);
                            }}
                            className={`flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium border transition-colors shadow-sm whitespace-nowrap focus:outline-none ${
                                minAmount || maxAmount
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50'
                            }`}
                        >
                            {minAmount || maxAmount ? `$${minAmount || '0'} — $${maxAmount || '∞'}` : 'Filtro Monto'}
                            <ChevronDown className="w-3 h-3 ml-2 opacity-60" />
                        </button>
                    </div>
                    <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block shrink-0" />
                    <button
                        onClick={() => { setSearchTerm(''); setMinAmount(''); setMaxAmount(''); setAmountPopoverOpen(false); }}
                        className="flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium text-zinc-500 hover:text-zinc-900 whitespace-nowrap shrink-0 transition-colors"
                    >
                        Limpiar filtros
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setIsFastOrderModalOpen(true)}
                            className="flex items-center justify-center rounded-xl h-10 px-4 ml-1 sm:ml-2 bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm whitespace-nowrap shrink-0"
                        >
                            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Pedido
                        </button>
                    )}
                </div>
            </div>

            {/* Board */}
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
                        <div className="grid grid-cols-5 gap-6 h-full min-w-[1350px]">
                            {COLUMNS.map((col) => (
                                <div key={col.id} className="min-h-0 h-full">
                                    <BoardColumn
                                        column={col}
                                        orders={filteredColumns[col.id] || []}
                                        seenIds={seenIds}
                                        isFirstVisit={isFirstVisit}
                                        isAdmin={isAdmin}
                                        onOpenArchived={col.id === 'DELIVERED' ? () => setIsArchivedOpen(true) : undefined}
                                        onOrderClick={(order) => {
                                            setSelectedOrder(order);
                                            setSeenIds(prev => {
                                                const next = new Set(prev);
                                                next.add(order.id);
                                                localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
                                                return next;
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <DragOverlay dropAnimation={dropAnimation}>
                            {activeOrder ? (
                                <div className="opacity-90 rotate-2 scale-105 transition-transform shadow-2xl cursor-grabbing">
                                    <OrderCard order={activeOrder} onClick={() => {}} isDragDisabled={false} />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>

            {/* Detail modal — with Edit + Cancel triggers */}
            <OrderDetailModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                onEdit={isAdmin ? (o) => { setEditingOrder(o); setSelectedOrder(null); } : undefined}
                onCancel={isAdmin ? (o) => { setCancellingOrder(o); setSelectedOrder(null); } : undefined}
            />

            {/* Edit modal */}
            {editingOrder && (
                <OrderEditModal
                    isOpen={!!editingOrder}
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSaved={(updated) => {
                        handleOrderSaved(updated);
                        setEditingOrder(null);
                    }}
                />
            )}

            {/* Cancel dialog */}
            {cancellingOrder && (
                <CancelOrderDialog
                    isOpen={!!cancellingOrder}
                    orderId={cancellingOrder.id}
                    orderNumber={cancellingOrder.orderNumber}
                    onClose={() => setCancellingOrder(null)}
                    onCancelled={handleOrderCancelled}
                />
            )}

            {/* Fast order */}
            <AdminFastOrderModal
                isOpen={isFastOrderModalOpen}
                onClose={() => setIsFastOrderModalOpen(false)}
                onOrderCreated={fetchOrders}
            />

            {/* Archived panel */}
            <ArchivedOrdersPanel
                isOpen={isArchivedOpen}
                onClose={() => setIsArchivedOpen(false)}
                onOrderClick={(order) => {
                    setIsArchivedOpen(false);
                    setSelectedOrder(order);
                }}
            />

            {/* Amount filter popover */}
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
