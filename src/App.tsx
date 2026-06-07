import { useState, useEffect, lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import MainLayout from "@/components/layout/MainLayout"
import { LoginPageB2B } from "@/features/auth/pages/LoginPageB2B"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuthStore } from "@/store/authStore"
import SplashScreen from "@/components/shared/SplashScreen"
import { NewClientModal } from "@/features/admin/components/NewClientModal"

// Páginas con carga diferida (lazy): cada ruta baja su propio chunk on-demand.
// Las que usan named export se adaptan a default con .then(...).
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })))
const CatalogPage = lazy(() => import("@/features/catalog/pages/CatalogPage").then(m => ({ default: m.CatalogPage })))
const ProductDetailPage = lazy(() => import("@/features/catalog/pages/ProductDetailPage").then(m => ({ default: m.ProductDetailPage })))
const CheckoutPage = lazy(() => import("@/features/checkout/pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })))
const CheckoutSuccessPage = lazy(() => import("@/features/checkout/pages/CheckoutSuccessPage").then(m => ({ default: m.CheckoutSuccessPage })))
const ClientsPage = lazy(() => import("@/pages/ClientsPage"))
const CurrentAccountPage = lazy(() => import("@/features/client/pages/CurrentAccountPage").then(m => ({ default: m.CurrentAccountPage })))
const ClientOrdersPage = lazy(() => import("@/features/client/pages/ClientOrdersPage").then(m => ({ default: m.ClientOrdersPage })))
const PaymentReportPage = lazy(() => import("@/features/client/pages/PaymentReportPage").then(m => ({ default: m.PaymentReportPage })))
const CatalogManagementPage = lazy(() => import("@/features/admin/pages/CatalogManagementPage").then(m => ({ default: m.CatalogManagementPage })))
const OrdersBoardPage = lazy(() => import("@/features/admin/pages/OrdersBoardPage").then(m => ({ default: m.OrdersBoardPage })))
const TreasuryPage = lazy(() => import("@/features/admin/pages/TreasuryPage").then(m => ({ default: m.TreasuryPage })))
const AdminDashboardPage = lazy(() => import("@/features/admin/pages/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })))

function PageLoader() {
  return (
    <div className="h-full w-full flex items-center justify-center py-24 text-zinc-400">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  )
}

// Root component to route authenticated users to their home
function RootRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const defaultRoutes = {
    ADMIN: '/admin',
    CLIENT: '/portal',
    SELLER: '/ventas/clientes',
  };

  return <Navigate to={defaultRoutes[user.role]} replace />;
}

function App() {
  const isGlobalLoading = useAuthStore(state => state.isGlobalLoading);
  const rehydrate = useAuthStore(state => state.rehydrate);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  useEffect(() => {
    rehydrate();
  }, []);

  return (
    <>
      <AnimatePresence>
        {isGlobalLoading && <SplashScreen key="splash" />}
      </AnimatePresence>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPageB2B />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{ title: 'Visión General', tooltipInfo: 'Resumen de operaciones de Tees Factory.' }}>
              <AdminDashboardPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/logistica" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{ title: 'Tablero de Preparación', tooltipInfo: 'Arrastra las tarjetas para cambiar el estado logístico de los pedidos.' }}>
              <OrdersBoardPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/tesoreria" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{ title: 'Tesorería', tooltipInfo: 'Revisión técnica de transferencias y conciliación de pagos.' }}>
              <TreasuryPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/clientes/:clientId/cuenta" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{ 
              title: 'Cuenta Corriente', 
              showBack: true, 
              backUrl: '/admin/clientes',
              tooltipInfo: 'Historial financiero y saldo deudor del cliente seleccionado.'
            }}>
              <CurrentAccountPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/clientes" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{
              title: 'Gestión de Clientes',
              searchPlaceholder: 'Buscar cliente...',
              tooltipInfo: 'Directorio completo de cuentas B2B activas e inactivas.',
              primaryAction: {
                label: '+ Nuevo Cliente',
                onClick: () => setIsNewClientModalOpen(true)
              }
            }}>
              <ClientsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/inventario" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{
              title: 'Gestión de Inventario',
              tooltipInfo: 'Administra el catálogo, activa productos y ajusta el stock de matriz.'
            }}>
              <CatalogManagementPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* CLIENT ROUTES */}
        <Route path="/portal" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{
              title: 'Mi Cuenta Corriente',
              tooltipInfo: 'Resumen de tu saldo deudor, historial de movimientos y reporte de pagos.'
            }}>
              <CurrentAccountPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/catalogo" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{ title: 'Catálogo', tooltipInfo: 'Navegá todo nuestro catálogo de productos.' }}>
              <CatalogPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/catalogo/:productId" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{ title: 'Volver al Catálogo', showBack: true, backUrl: '/portal/catalogo' }}>
              <ProductDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/pedidos" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{ title: 'Mis Pedidos', searchPlaceholder: 'Buscar en mis pedidos...', tooltipInfo: 'Historial completo de tus compras.' }}>
              <ClientOrdersPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/checkout" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{ title: 'Tu Pedido', tooltipInfo: 'Resumen final de la compra.' }}>
              <CheckoutPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/checkout/exitoso" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout hideHeader={true}>
              <CheckoutSuccessPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/pagos" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{
              title: 'Reportar Pago',
              tooltipInfo: 'Área para informar transferencias e impactar pagos.',
            }}>
              <PaymentReportPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* SELLER ROUTES */}
        <Route path="/ventas/clientes/:clientId/cuenta" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}>
            <MainLayout headerProps={{ 
              title: 'Cuenta Corriente', 
              showBack: true, 
              backUrl: '/ventas/clientes',
              tooltipInfo: 'Historial financiero y saldo deudor del cliente seleccionado.'
            }}>
              <CurrentAccountPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/ventas/clientes" element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <MainLayout headerProps={{
              title: 'Mi Cartera de Clientes',
              searchPlaceholder: 'Buscar cliente...',
              tooltipInfo: 'Directorio asignado de comercios B2B.',
              primaryAction: {
                label: '+ Nuevo Cliente',
                onClick: () => setIsNewClientModalOpen(true)
              }
            }}>
              <ClientsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        {/* Flujo de toma de pedido para un cliente específico */}
        <Route path="/ventas/pedido/:clientId" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}>
            <MainLayout headerProps={{ title: 'Tomar Pedido', searchPlaceholder: 'Buscar producto...', tooltipInfo: 'Armá el pedido seleccionando productos del catálogo.' }}>
              <CatalogPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/ventas/pedido/:clientId/:productId" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}>
            <MainLayout headerProps={{ title: 'Volver al Pedido', showBack: true }}>
              <ProductDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/ventas/checkout" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}>
            <MainLayout headerProps={{ title: 'Confirmar Pedido', tooltipInfo: 'Revisá el pedido antes de confirmarlo.' }}>
              <CheckoutPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/ventas/checkout/exitoso" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}>
            <MainLayout hideHeader={true}>
              <CheckoutSuccessPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/ventas/logistica" element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <MainLayout headerProps={{ title: 'Tablero de Pedidos', tooltipInfo: 'Arrastrá las tarjetas para actualizar el estado logístico de los pedidos.' }}>
              <OrdersBoardPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all route mapping to root to rely on Role routing or authentication state */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
      </Suspense>

      {/* Global Modals for App Level Actions */}
      <NewClientModal 
        isOpen={isNewClientModalOpen} 
        onClose={() => setIsNewClientModalOpen(false)} 
      />
    </>
  );
}

export default App