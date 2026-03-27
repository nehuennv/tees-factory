import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionListCard } from '../components/ActionListCard';
import { Wallet, TrendingUp, Receipt, Package, MessageCircle, AlertCircle } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';

import { MOCK_CLIENTS } from '@/mocks/clients';
import { MOCK_ORDERS } from '@/mocks/orders';
import { MOCK_PAYMENTS } from '@/mocks/payments';
import { MOCK_PRODUCTS } from '@/lib/mockData';

// Simulated data for charts
const REVENUE_DATA = [
    { name: 'Oct', total: 12000000 },
    { name: 'Nov', total: 15500000 },
    { name: 'Dic', total: 22000000 },
    { name: 'Ene', total: 18000000 },
    { name: 'Feb', total: 16500000 },
    { name: 'Mar', total: 24500000 },
];

const CATEGORY_DATA = [
    { name: 'Remeras', value: 55 },
    { name: 'Buzos', value: 30 },
    { name: 'Pantalones', value: 15 },
];

// Brand Accent Colors
const COLORS = ['#42318B', '#C44A87', '#2DBDD0', '#EFBC4E'];

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-zinc-200 shadow-xl rounded-xl p-3 flex flex-col gap-1.5 min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: payload[0].payload.fill }} />
                    <span className="text-sm font-bold text-zinc-900">{payload[0].name}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cuota</span>
                    <span className="text-sm font-black text-zinc-900">{payload[0].value}%</span>
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

export function AdminDashboardPage() {
    // KPIs
    const totalDebt = useMemo(() => {
        return MOCK_CLIENTS.reduce((acc, client) => {
            if (client.balance < 0) return acc + Math.abs(client.balance);
            return acc;
        }, 0);
    }, []);

    const totalRevenue = useMemo(() => {
        return MOCK_ORDERS.reduce((acc, order) => acc + order.totalAmount, 0);
    }, []);

    const pendingPayments = useMemo(() => {
        return MOCK_PAYMENTS.filter(p => p.status === 'PENDING').length;
    }, []);

    const preparingOrders = useMemo(() => {
        return MOCK_ORDERS.filter(o => o.status === 'PREPARING').length;
    }, []);

    // Action Lists
    const topDebtors = useMemo(() => {
        return [...MOCK_CLIENTS]
            .filter(c => c.balance < 0)
            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
            .slice(0, 5);
    }, []);

    const criticalStock = useMemo(() => {
        return MOCK_PRODUCTS.filter(p => p.stockStatus === 'LOW').slice(0, 5);
    }, []);

    const recentPayments = useMemo(() => {
        return MOCK_PAYMENTS.filter(p => p.status === 'PENDING').slice(0, 5);
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-4 md:p-6 pb-2">
            <div className="w-full space-y-6 lg:space-y-8">
                {/* Row 1: KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both">
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
                            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(totalDebt)}</div>
                            <p className="text-xs text-[#C44A87] mt-2 font-medium bg-[#C44A87]/10 inline-flex px-1.5 py-0.5 rounded-md">
                                +12% vs mes anterior
                            </p>
                        </CardContent>
                    </Card>

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
                            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(totalRevenue)}</div>
                            <p className="text-xs text-[#2DBDD0] mt-2 font-medium bg-[#2DBDD0]/10 inline-flex px-1.5 py-0.5 rounded-md">
                                +8% vs mes anterior
                            </p>
                        </CardContent>
                    </Card>

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
                            <div className="text-2xl font-bold text-zinc-900">{pendingPayments}</div>
                            <p className="text-xs text-[#EFBC4E] mt-2 font-medium bg-[#EFBC4E]/10 inline-flex px-1.5 py-0.5 rounded-md">
                                Esperando conciliación
                            </p>
                        </CardContent>
                    </Card>

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
                            <div className="text-2xl font-bold text-zinc-900">{preparingOrders}</div>
                            <p className="text-xs text-[#42318B] mt-2 font-medium bg-[#42318B]/10 inline-flex px-1.5 py-0.5 rounded-md">
                                En área de logística
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Row 2: Charts */}
                <div className="grid gap-4 md:grid-cols-3">
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
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#42318B" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#42318B" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis
                                                stroke="#a1a1aa"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `$${value / 1000000}M`}
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
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

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
                                    <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={0}>
                                        <PieChart className="hover:scale-105 transition-transform duration-500">
                                            <Pie
                                                data={CATEGORY_DATA}
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
                                                {CATEGORY_DATA.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomPieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-center space-x-5 mt-6">
                                        {CATEGORY_DATA.map((item, index) => (
                                            <div key={item.name} className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                                <span className="text-xs text-zinc-600 font-medium group-hover:text-zinc-900">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Row 3: Action Lists */}
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
                            {topDebtors.map((client) => (
                                <div key={client.id} className="flex items-center justify-between group p-2 -mx-2 h-[60px] rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-zinc-900 truncate max-w-[150px] group-hover:text-[#C44A87] transition-colors" title={client.name}>
                                            {client.name}
                                        </span>
                                        <span className="text-xs text-red-600 font-semibold mt-0.5">Debe {formatCurrency(Math.abs(client.balance))}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 group-hover:text-[#C44A87] group-hover:bg-[#C44A87]/10 rounded-full transition-colors">
                                        <MessageCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
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
                            {criticalStock.map((product) => (
                                <div key={product.id} className="flex items-center gap-3 group p-2 -mx-2 h-[60px] rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 group-hover:border-[#EFBC4E] transition-colors">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-zinc-700 transition-colors" title={product.name}>
                                            {product.name}
                                        </p>
                                        <div className="mt-1">
                                            <Badge variant="secondary" className="bg-red-50 text-red-600/90 border border-red-100/50 group-hover:bg-red-100 hover:bg-red-50 py-0 px-1.5 h-5 text-[10px] uppercase font-bold tracking-wider shadow-none transition-colors">
                                                Quedan {product.totalStock} uds
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </ActionListCard>
                    </motion.div>

                    {/* Últimos Movimientos */}
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
                            {recentPayments.map((payment) => (
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
                                            {formatCurrency(MOCK_ORDERS.find(o => o.id === payment.orderId)?.totalAmount || 0)}
                                        </span>
                                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 font-semibold bg-white group-hover:bg-[#2DBDD0]/10 group-hover:text-[#2DBDD0] group-hover:border-[#2DBDD0]/30 text-zinc-700 border-zinc-200 shadow-sm rounded-md transition-colors">
                                            Revisar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </ActionListCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
