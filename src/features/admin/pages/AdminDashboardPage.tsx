import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionListCard } from '../components/ActionListCard';
import { Wallet, TrendingUp, TrendingDown, Receipt, Package, MessageCircle } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import apiClient from '@/lib/apiClient';

// Brand Accent Colors
const COLORS = ['#42318B', '#C44A87', '#2DBDD0', '#EFBC4E'];

const LIST_ITEMS = 4;

// ── Tipos para los KPIs del backend ────────────────────────────
interface DashboardKpis {
    totalDebt: number;
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    previousMonthDebt: number;
    pendingPaymentsCount: number;
    preparingOrdersCount: number;
    topDebtors: { id: string; name: string; debt: number }[];
    criticalStock: { id: string; name: string; stock: number }[];
}

interface RevenueTrendItem {
    month: string;
    total: number;
}

interface CategoryDistributionItem {
    name: string;
    value: number;
}

interface RecentPayment {
    id: string;
    clientName: string;
    amount: number;
    method: string;
    orderId: string | null;
    reference: string | null;
    status: string;
    receiptUrl: string | null;
    createdAt: string;
}

// ── Calcular variación porcentual ───────────────────────────────
function calcPctChange(current: number, previous: number): number | null {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
}

function PctBadge({ pct, color, invertTrend = false }: { pct: number | null; color: string; invertTrend?: boolean }) {
    if (pct === null) return null;
    const isPositive = pct >= 0;
    // Para deuda: subir es malo → invertimos el ícono
    const isGood = invertTrend ? !isPositive : isPositive;
    const Icon = isGood ? TrendingDown : TrendingUp;
    const label = `${isPositive ? '+' : ''}${pct.toFixed(1)}% vs mes anterior`;
    return (
        <p
            className="text-xs mt-2 font-medium inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
            style={{ color, backgroundColor: `${color}1A` }}
        >
            <Icon className="w-3 h-3" />
            {label}
        </p>
    );
}

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-zinc-200 shadow-xl rounded-xl p-3 flex flex-col gap-1.5 min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: payload[0].payload.fill }} />
                    <span className="text-sm font-bold text-zinc-900">{payload[0].name}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Unidades</span>
                    <span className="text-sm font-black text-zinc-900">{payload[0].value}</span>
                </div>
            </div>
        );
    }
    return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-zinc-200 shadow-xl rounded-xl p-3 flex flex-col gap-1.5 min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-100 pb-2">{label}</span>
                <div className="flex items-center gap-2 pt-1">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: payload[0].color }} />
                    <span className="text-sm font-black text-zinc-900">
                        ${(payload[0].value / 1000000).toFixed(1)}M
                    </span>
                    <span className="text-xs font-medium text-zinc-500 ml-1">ARS</span>
                </div>
            </div>
        );
    }
    return null;
};

// ── Skeleton genérico ───────────────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
    return <div className={`bg-zinc-100 rounded animate-pulse ${className ?? ''}`} />;
}

export function AdminDashboardPage() {
    const navigate = useNavigate();

    // ── KPIs ────────────────────────────────────────────────────
    const [kpis, setKpis] = useState<DashboardKpis | null>(null);
    const [isKpisLoading, setIsKpisLoading] = useState(true);

    // ── Gráfico de Ingresos ─────────────────────────────────────
    const [revenueData, setRevenueData] = useState<RevenueTrendItem[]>([]);
    const [isRevenueLoading, setIsRevenueLoading] = useState(true);

    // ── Distribución por Categoría ──────────────────────────────
    const [categoryData, setCategoryData] = useState<CategoryDistributionItem[]>([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(true);

    // ── Últimos Movimientos ─────────────────────────────────────
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
    const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);

    useEffect(() => {
        // KPIs
        apiClient.get('/dashboard/kpis')
            .then(({ data }) => setKpis(data))
            .catch(() => setKpis(null))
            .finally(() => setIsKpisLoading(false));

        // Revenue Trend
        const defaultRevenue = [
            { month: "Oct", total: 0 }, { month: "Nov", total: 0 }, { month: "Dic", total: 0 },
            { month: "Ene", total: 0 }, { month: "Feb", total: 0 }, { month: "Mar", total: 0 }
        ];
        apiClient.get('/dashboard/revenue-trend')
            .then(({ data }) => setRevenueData(Array.isArray(data) && data.length > 0 ? data : defaultRevenue))
            .catch(() => setRevenueData(defaultRevenue))
            .finally(() => setIsRevenueLoading(false));

        // Category Distribution
        const defaultCategory = [
            { name: "Remeras", value: 0 }, { name: "Pantalones", value: 0 }, { name: "Buzos", value: 0 }
        ];
        apiClient.get('/dashboard/category-chart')
            .then(({ data }) => setCategoryData(Array.isArray(data) && data.length > 0 ? data : defaultCategory))
            .catch(() => setCategoryData(defaultCategory))
            .finally(() => setIsCategoryLoading(false));

        // Últimos movimientos: trae los más recientes, pendientes primero
        apiClient.get('/payments', { params: { limit: 20 } })
            .then(({ data }) => {
                if (!Array.isArray(data)) { setRecentPayments([]); return; }
                const pending = data.filter((p: RecentPayment) => p.status === 'PENDING_REVIEW' || p.status === 'PENDING');
                const rest = data.filter((p: RecentPayment) => p.status !== 'PENDING_REVIEW' && p.status !== 'PENDING');
                setRecentPayments([...pending, ...rest].slice(0, LIST_ITEMS));
            })
            .catch(() => setRecentPayments([]))
            .finally(() => setIsPaymentsLoading(false));
    }, []);

    // ── Datos derivados ─────────────────────────────────────────
    const totalDebt = kpis?.totalDebt ?? 0;
    const totalRevenue = kpis?.currentMonthRevenue ?? 0;
    const pendingPayments = kpis?.pendingPaymentsCount ?? 0;
    const preparingOrders = kpis?.preparingOrdersCount ?? 0;
    const topDebtors = [...(kpis?.topDebtors ?? [])].sort((a, b) => b.debt - a.debt).slice(0, LIST_ITEMS);
    const criticalStock = [...(kpis?.criticalStock ?? [])].sort((a, b) => a.stock - b.stock).slice(0, LIST_ITEMS);

    const revenuePct = calcPctChange(totalRevenue, kpis?.previousMonthRevenue ?? 0);
    const debtPct = calcPctChange(totalDebt, kpis?.previousMonthDebt ?? 0);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-4">
            <div className="min-h-full flex flex-col gap-4">

                {/* ── Row 1: KPI Cards ── */}
                <motion.div
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
                >

                    {/* Deuda de Clientes */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}>
                        <Card className="shadow-sm border-zinc-200 rounded-xl overflow-hidden bg-white transition-shadow duration-300 hover:shadow-md group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-700 transition-colors">
                                    Deuda de Clientes
                                </CardTitle>
                                <div className="p-2 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#C44A8715' }}>
                                    <Wallet className="h-4 w-4" color="#C44A87" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isKpisLoading
                                    ? <><SkeletonBlock className="h-8 w-32 mb-2" /><SkeletonBlock className="h-5 w-40" /></>
                                    : <>
                                        <div className="text-2xl font-bold text-zinc-900">{formatCurrency(totalDebt)}</div>
                                        {debtPct !== null
                                            ? <PctBadge pct={debtPct} color="#C44A87" invertTrend />
                                            : <p className="text-xs mt-2 font-medium inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ color: '#C44A87', backgroundColor: '#C44A871A' }}>Total acumulada</p>
                                        }
                                    </>
                                }
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Facturación Mes Actual */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}>
                        <Card className="shadow-sm border-zinc-200 rounded-xl overflow-hidden bg-white transition-shadow duration-300 hover:shadow-md group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-700 transition-colors">
                                    Facturación Mes Actual
                                </CardTitle>
                                <div className="p-2 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#2DBDD015' }}>
                                    <TrendingUp className="h-4 w-4" color="#2DBDD0" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isKpisLoading
                                    ? <><SkeletonBlock className="h-8 w-32 mb-2" /><SkeletonBlock className="h-5 w-40" /></>
                                    : <>
                                        <div className="text-2xl font-bold text-zinc-900">{formatCurrency(totalRevenue)}</div>
                                        {revenuePct !== null
                                            ? <PctBadge pct={revenuePct} color="#2DBDD0" />
                                            : <p className="text-xs mt-2 font-medium inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ color: '#2DBDD0', backgroundColor: '#2DBDD01A' }}>Mes en curso</p>
                                        }
                                    </>
                                }
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Pagos Pendientes */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}>
                        <Card className="shadow-sm border-zinc-200 rounded-xl overflow-hidden bg-white transition-shadow duration-300 hover:shadow-md group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-700 transition-colors">
                                    Pagos Pendientes
                                </CardTitle>
                                <div className="p-2 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#EFBC4E15' }}>
                                    <Receipt className="h-4 w-4" color="#EFBC4E" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isKpisLoading
                                    ? <><SkeletonBlock className="h-8 w-16 mb-2" /><SkeletonBlock className="h-5 w-36" /></>
                                    : <>
                                        <div className="text-2xl font-bold text-zinc-900">{pendingPayments}</div>
                                        <p className="text-xs text-[#EFBC4E] mt-2 font-medium bg-[#EFBC4E]/10 inline-flex px-1.5 py-0.5 rounded-md">
                                            Esperando conciliación
                                        </p>
                                    </>
                                }
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Pedidos en Preparación */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}>
                        <Card className="shadow-sm border-zinc-200 rounded-xl overflow-hidden bg-white transition-shadow duration-300 hover:shadow-md group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-700 transition-colors">
                                    Pedidos en Preparación
                                </CardTitle>
                                <div className="p-2 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#42318B15' }}>
                                    <Package className="h-4 w-4" color="#42318B" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isKpisLoading
                                    ? <><SkeletonBlock className="h-8 w-16 mb-2" /><SkeletonBlock className="h-5 w-36" /></>
                                    : <>
                                        <div className="text-2xl font-bold text-zinc-900">{preparingOrders}</div>
                                        <p className="text-xs text-[#42318B] mt-2 font-medium bg-[#42318B]/10 inline-flex px-1.5 py-0.5 rounded-md">
                                            En área de logística
                                        </p>
                                    </>
                                }
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* ── Row 2: Gráficos ── */}
                <div className="flex-1 min-h-0 grid gap-4 md:grid-cols-3" style={{ minHeight: 240 }}>

                    {/* Gráfico Ingresos - últimos 6 meses */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="col-span-1 md:col-span-2 flex flex-col"
                    >
                        <Card className="flex-1 flex flex-col shadow-sm border-zinc-200 rounded-xl bg-white transition-all duration-300 hover:shadow-md">
                            <CardHeader className="shrink-0 flex flex-row items-center space-y-0 border-b border-zinc-100 py-4 px-6">
                                <CardTitle className="text-base font-bold text-zinc-900">Ingresos de los últimos 6 meses</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 pl-0 pb-3 pt-2">
                                <div className="h-full w-full">
                                    {isRevenueLoading ? (
                                        <div className="h-full flex items-center justify-center">
                                            <SkeletonBlock className="h-full w-full mx-6" />
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="99%" height="100%">
                                            <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#42318B" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#42318B" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis
                                                    stroke="#a1a1aa"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    domain={[0, 'auto']}
                                                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                                                    dx={-10}
                                                />
                                                <RechartsTooltip content={<CustomAreaTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="total"
                                                    stroke="#42318B"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorTotal)"
                                                    isAnimationActive={true}
                                                    animationDuration={2000}
                                                    animationEasing="ease-in-out"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Pie Chart - Distribución por Categoría */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="col-span-1 flex flex-col"
                    >
                        <Card className="flex-1 flex flex-col shadow-sm border-zinc-200 rounded-xl bg-white transition-all duration-300 hover:shadow-md">
                            <CardHeader className="shrink-0 flex flex-row items-center space-y-0 border-b border-zinc-100 py-4 px-6">
                                <CardTitle className="text-base font-bold text-zinc-900">Distribución por Categoría</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 pt-2 pb-3">
                                <div className="h-full w-full flex flex-col">
                                    {isCategoryLoading ? (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                            <SkeletonBlock className="h-40 w-40 rounded-full" />
                                            <SkeletonBlock className="h-4 w-32" />
                                        </div>
                                    ) : !categoryData.some(d => d.value > 0) ? (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
                                            <div className="w-20 h-20 rounded-full border-4 border-dashed border-zinc-200 flex items-center justify-center">
                                                <Package className="w-8 h-8 text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-medium text-zinc-400">Sin datos de categorías</p>
                                        </div>
                                    ) : (
                                        <>
                                            <motion.div className="flex-1 min-h-0" whileHover={{ scale: 1.03 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
                                            <ResponsiveContainer width="99%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={categoryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={65}
                                                        outerRadius={90}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        stroke="none"
                                                        isAnimationActive={true}
                                                        animationDuration={1500}
                                                        animationBegin={600}
                                                    >
                                                        {categoryData.map((_entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip content={<CustomPieTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            </motion.div>
                                            <div className="shrink-0 flex justify-center space-x-5 mt-2">
                                                {categoryData.map((item, index) => (
                                                    <div key={item.name} className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                                        <span className="text-xs text-zinc-600 font-medium group-hover:text-zinc-900">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* ── Row 3: Action Lists ── */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                    {/* Top Deudores */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        className="flex flex-col"
                    >
                        <ActionListCard
                            title="Top Deudores"
                            actionText="Ver todos los clientes"
                            actionRoute="/admin/clientes"
                        >
                            {isKpisLoading
                                ? Array.from({ length: LIST_ITEMS }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between h-[60px] gap-3">
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <SkeletonBlock className="h-4 w-3/4" />
                                            <SkeletonBlock className="h-3 w-1/2" />
                                        </div>
                                        <SkeletonBlock className="h-8 w-8 rounded-full" />
                                    </div>
                                ))
                                : <>
                                    {topDebtors.map((client) => (
                                        <div key={client.id} className="flex items-center justify-between group p-2 -mx-2 h-[60px] rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-zinc-900 truncate max-w-[150px] group-hover:text-[#C44A87] transition-colors" title={client.name}>
                                                    {client.name}
                                                </span>
                                                <span className="text-xs text-red-600 font-semibold mt-0.5">Debe {formatCurrency(client.debt)}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 group-hover:text-[#C44A87] group-hover:bg-[#C44A87]/10 rounded-full transition-colors">
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {Array.from({ length: LIST_ITEMS - topDebtors.length }).map((_, i) => (
                                        <div key={`fill-debtor-${i}`} className="flex items-center justify-between h-[60px] gap-3">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <SkeletonBlock className="h-4 w-3/4" />
                                                <SkeletonBlock className="h-3 w-1/2" />
                                            </div>
                                            <SkeletonBlock className="h-8 w-8 rounded-full" />
                                        </div>
                                    ))}
                                </>
                            }
                        </ActionListCard>
                    </motion.div>

                    {/* Stock Crítico */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                        className="flex flex-col"
                    >
                        <ActionListCard
                            title="Alertas de Stock"
                            actionText="Ver todo el inventario"
                            actionRoute="/admin/inventario"
                        >
                            {isKpisLoading
                                ? Array.from({ length: LIST_ITEMS }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 h-[60px]">
                                        <SkeletonBlock className="w-10 h-10 rounded-md shrink-0" />
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <SkeletonBlock className="h-4 w-3/4" />
                                            <SkeletonBlock className="h-5 w-1/3" />
                                        </div>
                                    </div>
                                ))
                                : <>
                                    {criticalStock.map((product) => (
                                        <div key={product.id} className="flex items-center gap-3 group p-2 -mx-2 h-[60px] rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                                            <div className="w-10 h-10 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 group-hover:border-[#EFBC4E] transition-colors flex items-center justify-center">
                                                <Package className="w-5 h-5 text-zinc-400" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-zinc-700 transition-colors" title={product.name}>
                                                    {product.name}
                                                </p>
                                                <div className="mt-1">
                                                    <Badge variant="secondary" className="bg-red-50 text-red-600/90 border border-red-100/50 group-hover:bg-red-100 hover:bg-red-50 py-0 px-1.5 h-5 text-[10px] uppercase font-bold tracking-wider shadow-none transition-colors">
                                                        Quedan {product.stock} uds
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {Array.from({ length: LIST_ITEMS - criticalStock.length }).map((_, i) => (
                                        <div key={`fill-stock-${i}`} className="flex items-center gap-3 h-[60px]">
                                            <SkeletonBlock className="w-10 h-10 rounded-md shrink-0" />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <SkeletonBlock className="h-4 w-3/4" />
                                                <SkeletonBlock className="h-5 w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            }
                        </ActionListCard>
                    </motion.div>

                    {/* Últimos Movimientos — desde API real */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                        className="flex flex-col"
                    >
                        <ActionListCard
                            title="Últimos Movimientos"
                            actionText="Ver todos los movimientos"
                            actionRoute="/admin/tesoreria"
                        >
                            {isPaymentsLoading
                                ? Array.from({ length: LIST_ITEMS }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between h-[60px] gap-3">
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <SkeletonBlock className="h-4 w-3/4" />
                                            <SkeletonBlock className="h-3 w-1/2" />
                                        </div>
                                        <SkeletonBlock className="h-7 w-16 rounded-md" />
                                    </div>
                                ))
                                : <>
                                    {recentPayments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between group p-2 -mx-2 h-[60px] rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-zinc-900 truncate max-w-[140px] group-hover:text-[#2DBDD0] transition-colors" title={payment.clientName}>
                                                    {payment.clientName}
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {(() => {
                                                        const s = payment.status;
                                                        const isPending = s === 'PENDING' || s === 'PENDING_REVIEW';
                                                        const isApproved = s === 'APPROVED';
                                                        const isRejected = s === 'REJECTED';
                                                        return (
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                                                isPending ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                isApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                isRejected ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                'bg-zinc-100 text-zinc-500'
                                                            }`}>
                                                                {isPending ? 'Pendiente' : isApproved ? 'Aprobado' : isRejected ? 'Rechazado' : s}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 lg:gap-3">
                                                <span className="text-sm font-bold text-zinc-900 whitespace-nowrap hidden sm:inline-block border-r border-zinc-200 pr-2 lg:pr-3">
                                                    {formatCurrency(payment.amount)}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate('/admin/tesoreria')}
                                                    className="h-7 text-[11px] px-3 font-semibold bg-white group-hover:bg-[#2DBDD0]/10 group-hover:text-[#2DBDD0] group-hover:border-[#2DBDD0]/30 text-zinc-700 border-zinc-200 shadow-sm rounded-md transition-colors"
                                                >
                                                    Revisar
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {Array.from({ length: LIST_ITEMS - recentPayments.length }).map((_, i) => (
                                        <div key={`fill-mov-${i}`} className="flex items-center justify-between h-[60px] gap-3">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <SkeletonBlock className="h-4 w-3/4" />
                                                <SkeletonBlock className="h-3 w-1/2" />
                                            </div>
                                            <SkeletonBlock className="h-7 w-16 rounded-md" />
                                        </div>
                                    ))}
                                </>
                            }
                        </ActionListCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
