import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import MainLayout from "@/components/layout/MainLayout"
import { CatalogPage } from "@/features/catalog/pages/CatalogPage"
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage"
import { CheckoutPage } from "@/features/checkout/pages/CheckoutPage"
import { LoginPageB2B } from "@/features/auth/pages/LoginPageB2B"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuthStore } from "@/store/authStore"
import SplashScreen from "@/components/shared/SplashScreen"
import ClientsPage from "@/pages/ClientsPage"
import { CurrentAccountPage } from "@/features/client/pages/CurrentAccountPage"
import { ClientOrdersPage } from "@/features/client/pages/ClientOrdersPage"
import { PaymentReportPage } from "@/features/client/pages/PaymentReportPage"
import { CatalogManagementPage } from "@/features/admin/pages/CatalogManagementPage"
import { OrdersBoardPage } from "@/features/admin/pages/OrdersBoardPage"
import { TreasuryPage } from "@/features/admin/pages/TreasuryPage"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"
import { NewClientModal } from "@/features/admin/components/NewClientModal"



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
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPageB2B />} />

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

        {/* Catch-all route mapping to root to rely on Role routing or authentication state */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>

      {/* Global Modals for App Level Actions */}
      <NewClientModal 
        isOpen={isNewClientModalOpen} 
        onClose={() => setIsNewClientModalOpen(false)} 
      />
    </>
  );
}

export default App