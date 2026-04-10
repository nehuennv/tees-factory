import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionListCard } from '../components/ActionListCard';
import { Wallet, TrendingUp, TrendingDown, Receipt, Package, MessageCircle, AlertCircle } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import apiClient from '@/lib/apiClient';

// Brand Accent Colors
const COLORS = ['#42318B', '#C44A87', '#2DBDD0', '#EFBC4E'];

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

function PctBadge({ pct, color }: { pct: number | null; color: string }) {
    if (pct === null) return null;
    const isPositive = pct >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
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
        apiClient.get('/dashboard/category-distribution')
            .then(({ data }) => setCategoryData(Array.isArray(data) && data.length > 0 ? data : defaultCategory))
            .catch(() => setCategoryData(defaultCategory))
            .finally(() => setIsCategoryLoading(false));

        // Recent Payments (últimos 5 pendientes)
        apiClient.get('/payments', { params: { limit: 5, status: 'PENDING_REVIEW' } })
            .then(({ data }) => setRecentPayments(Array.isArray(data) ? data.slice(0, 5) : []))
            .catch(() => setRecentPayments([]))
            .finally(() => setIsPaymentsLoading(false));
    }, []);

    // ── Datos derivados ─────────────────────────────────────────
    const totalDebt = kpis?.totalDebt ?? 0;
    const totalRevenue = kpis?.currentMonthRevenue ?? 0;
    const pendingPayments = kpis?.pendingPaymentsCount ?? 0;
    const preparingOrders = kpis?.preparingOrdersCount ?? 0;
    const topDebtors = kpis?.topDebtors ?? [];
    const criticalStock = kpis?.criticalStock ?? [];

    const revenuePct = calcPctChange(totalRevenue, kpis?.previousMonthRevenue ?? 0);
    const debtPct = calcPctChange(totalDebt, kpis?.previousMonthDebt ?? 0);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-4 md:p-6 pb-2">
            <div className="w-full space-y-6 lg:space-y-8">

                {/* ── Row 1: KPI Cards ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both">

                    {/* Deuda Total */}
                    <Card className="shadow-sm border-zinc-200 rounded-xl overflow-hidden bg-white transition-shadow duration-300 hover:shadow-md group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-700 transition-colors">
                                Deuda Total
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
                                    <PctBadge pct={debtPct} color="#C44A87" />
                                </>
                            }
                        </CardContent>
                    </Card>

                    {/* Facturación Mes Actual */}
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
                                    <PctBadge pct={revenuePct} color="#2DBDD0" />
                                </>
                            }
                        </CardContent>
                    </Card>

                    {/* Pagos Pendientes */}
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

                    {/* Pedidos en Preparación */}
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
                </div>

                {/* ── Row 2: Gráficos ── */}
                <div className="grid gap-4 md:grid-cols-3">

                    {/* Gráfico Ingresos - últimos 6 meses */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="col-span-1 md:col-span-2 xl:col-span-2"
                    >
                        <Card className="h-full shadow-sm border-zinc-200 rounded-xl bg-white transition-all duration-300 hover:shadow-md">
                            <CardHeader className="flex flex-row items-center space-y-0 border-b border-zinc-100 py-5 px-6">
                                <CardTitle className="text-base font-bold text-zinc-900">Ingresos de los últimos 6 meses</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-0 pb-2 pt-6">
                                <div className="h-[280px] w-full mt-2">
                                    {isRevenueLoading ? (
                                        <div className="h-full flex items-center justify-center">
                                            <SkeletonBlock className="h-full w-full mx-6" />
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="99%" height={280}>
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
                        className="col-span-1"
                    >
                        <Card className="shadow-sm border-zinc-200 rounded-xl bg-white transition-all duration-300 hover:shadow-md">
                            <CardHeader className="flex flex-row items-center space-y-0 border-b border-zinc-100 py-5 px-6">
                                <CardTitle className="text-base font-bold text-zinc-900">Distribución por Categoría</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[280px] w-full flex flex-col justify-center mt-2 relative">
                                    {isCategoryLoading ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <SkeletonBlock className="h-40 w-40 rounded-full" />
                                            <SkeletonBlock className="h-4 w-32" />
                                        </div>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="99%" height={240}>
                                                <PieChart className="hover:scale-105 transition-transform duration-500">
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
                                            <div className="flex justify-center space-x-5 mt-6">
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {/* Top Deudores */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                    >
                        <ActionListCard
                            title="Top Deudores"
                            actionText="Ver todos los clientes"
                            actionRoute="/admin/clientes"
                            fakeContinuationItems={Array.from({ length: 1 }).map((_, i) => (
                                <div key={`fake-debtor-${i}`} className="flex items-center justify-between h-[60px]" style={{ opacity: 0.4 }}>
                                    <div className="flex flex-col gap-1.5 w-[60%]">
                                        <div className="h-4 bg-zinc-200/80 rounded w-full" />
                                        <div className="h-3 bg-zinc-100 rounded w-2/3" />
                                    </div>
                                    <div className="h-8 w-8 bg-zinc-100 rounded-full" />
                                </div>
                            ))}
                        >
                            {isKpisLoading
                                ? Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between h-[60px] gap-3">
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <SkeletonBlock className="h-4 w-3/4" />
                                            <SkeletonBlock className="h-3 w-1/2" />
                                        </div>
                                        <SkeletonBlock className="h-8 w-8 rounded-full" />
                                    </div>
                                ))
                                : topDebtors.length === 0
                                    ? <p className="text-sm text-zinc-400 py-4 text-center">Sin deudores registrados</p>
                                    : topDebtors.map((client) => (
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
                                    ))
                            }
                        </ActionListCard>
                    </motion.div>

                    {/* Stock Crítico */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                    >
                        <ActionListCard
                            title="Alertas de Stock"
                            actionText="Ver todo el inventario"
                            actionRoute="/admin/inventario"
                            fakeContinuationItems={Array.from({ length: 1 }).map((_, i) => (
                                <div key={`fake-stock-${i}`} className="flex items-center gap-3 h-[60px]" style={{ opacity: 0.4 }}>
                                    <div className="w-10 h-10 rounded-md bg-zinc-200/80 shrink-0" />
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="h-4 bg-zinc-200/80 rounded w-3/4" />
                                        <div className="h-5 bg-zinc-100 rounded w-1/3 mt-0.5" />
                                    </div>
                                </div>
                            ))}
                        >
                            {isKpisLoading
                                ? Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 h-[60px]">
                                        <SkeletonBlock className="w-10 h-10 rounded-md shrink-0" />
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <SkeletonBlock className="h-4 w-3/4" />
                                            <SkeletonBlock className="h-5 w-1/3" />
                                        </div>
                                    </div>
                                ))
                                : criticalStock.length === 0
                                    ? <p className="text-sm text-zinc-400 py-4 text-center">Sin alertas de stock</p>
                                    : criticalStock.map((product) => (
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
                                    ))
                            }
                        </ActionListCard>
                    </motion.div>

                    {/* Últimos Movimientos — desde API real */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                    >
                        <ActionListCard
                            title="Últimos Movimientos"
                            actionText="Ver todos los movimientos"
                            actionRoute="/admin/tesoreria"
                            fakeContinuationItems={Array.from({ length: 1 }).map((_, i) => (
                                <div key={`fake-mov-${i}`} className="flex items-center justify-between h-[60px]" style={{ opacity: 0.4 }}>
                                    <div className="flex flex-col gap-1.5 w-1/2">
                                        <div className="h-4 bg-zinc-200/80 rounded w-full" />
                                        <div className="h-3 bg-zinc-100 rounded w-1/2" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 bg-zinc-200/80 rounded w-16" />
                                        <div className="h-7 w-16 bg-zinc-100 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        >
                            {isPaymentsLoading
                                ? Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between h-[60px] gap-3">
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <SkeletonBlock className="h-4 w-3/4" />
                                            <SkeletonBlock className="h-3 w-1/2" />
                                        </div>
                                        <SkeletonBlock className="h-7 w-16 rounded-md" />
                                    </div>
                                ))
                                : recentPayments.length === 0
                                    ? <p className="text-sm text-zinc-400 py-4 text-center">Sin movimientos pendientes</p>
                                    : recentPayments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between group p-2 -mx-2 h-[60px] rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-zinc-900 truncate max-w-[140px] group-hover:text-[#2DBDD0] transition-colors" title={payment.clientName}>
                                                    {payment.clientName}
                                                </span>
                                                <div className="flex items-center text-xs text-zinc-500 gap-1.5 mt-1 font-medium group-hover:text-zinc-600 transition-colors">
                                                    <AlertCircle className="w-3 h-3 shrink-0 text-zinc-400 group-hover:text-[#2DBDD0]" />
                                                    <span>{payment.method}</span>
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
                                    ))
                            }
                        </ActionListCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
