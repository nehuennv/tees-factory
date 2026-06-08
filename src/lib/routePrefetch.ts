/**
 * Prefetch de chunks de ruta. Cuando el usuario *apunta* (hover/focus) a un
 * link del menú, bajamos el chunk de esa página en silencio para que al hacer
 * click entre instantáneo, sin el spinner del lazy-load.
 *
 * Usa los mismos import() que App.tsx → el módulo queda cacheado y reutilizado.
 * Solo red anticipada: no monta nada, no usa CPU/GPU.
 */

const ROUTE_IMPORTS: Record<string, () => Promise<unknown>> = {
    '/admin': () => import('@/features/admin/pages/AdminDashboardPage'),
    '/admin/logistica': () => import('@/features/admin/pages/OrdersBoardPage'),
    '/admin/tesoreria': () => import('@/features/admin/pages/TreasuryPage'),
    '/admin/clientes': () => import('@/pages/ClientsPage'),
    '/admin/inventario': () => import('@/features/admin/pages/CatalogManagementPage'),
    '/admin/servicios': () => import('@/features/admin/pages/ServicesPage'),
    '/portal': () => import('@/features/client/pages/CurrentAccountPage'),
    '/portal/catalogo': () => import('@/features/catalog/pages/CatalogPage'),
    '/portal/pedidos': () => import('@/features/client/pages/ClientOrdersPage'),
    '/portal/pagos': () => import('@/features/client/pages/PaymentReportPage'),
    '/ventas/clientes': () => import('@/pages/ClientsPage'),
    '/ventas/logistica': () => import('@/features/admin/pages/OrdersBoardPage'),
};

const prefetched = new Set<string>();

/** Baja el chunk de la ruta una sola vez. Silencioso ante errores. */
export function prefetchRoute(path: string): void {
    const load = ROUTE_IMPORTS[path];
    if (!load || prefetched.has(path)) return;
    prefetched.add(path);
    load().catch(() => prefetched.delete(path));
}
