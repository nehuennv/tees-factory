import { Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import MainLayout from "@/components/layout/MainLayout"
import { CatalogPage } from "@/features/catalog/pages/CatalogPage"
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage"
import { CheckoutPage } from "@/features/checkout/pages/CheckoutPage"
import LoginPage from "@/pages/auth/LoginPage"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuthStore } from "@/store/authStore"
import SplashScreen from "@/components/shared/SplashScreen"
import ClientsPage from "@/pages/ClientsPage"
function DummyPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[500px] text-zinc-500 overflow-y-auto">
      <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 rounded-2xl mb-6 flex items-center justify-center text-zinc-400 transition-transform duration-300 hover:scale-105">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-zinc-900 mb-2">{title}</h2>
      <p className="max-w-md text-center">{description}</p>
    </div>
  );
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

  return (
    <>
      <AnimatePresence>
        {isGlobalLoading && <SplashScreen key="splash" />}
      </AnimatePresence>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{ title: 'Admin Dashboard' }}>
              <DummyPage title="Admin Dashboard" description="Resumen principal para el administrador." />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/logistica" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{ title: 'Tablero de Preparación', searchPlaceholder: 'Buscar pedido...' }}>
              <DummyPage title="Tablero de Preparación" description="Tablero de preparación de pedidos." />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/tesoreria" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{ title: 'Tesorería' }}>
              <DummyPage title="Tesorería" description="Aprobación de pagos y resumen financiero." />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/clientes" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout headerProps={{
              title: 'Gestión de Clientes',
              searchPlaceholder: 'Buscar cliente...',
              primaryAction: {
                label: '+ Nuevo Cliente',
                onClick: () => alert('Nuevo Cliente')
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
              searchPlaceholder: 'Buscar por SKU o Nombre...',
              tabs: [
                { id: 'prod', label: 'Productos', isActive: true },
                { id: 'cat', label: 'Categorías' },
                { id: 'stock', label: 'Ajustes de Stock' },
              ],
              primaryAction: {
                label: '+ Nuevo Producto',
                onClick: () => alert('Nuevo Producto Clicked')
              }
            }}>
              <CatalogPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* CLIENT ROUTES */}
        <Route path="/portal" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{ title: 'Resumen y Deuda' }}>
              <DummyPage title="Resumen y Deuda" description="Estado de cuenta del cliente y límite disponible." />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/catalogo" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{ title: 'Catálogo' }}>
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
            <MainLayout headerProps={{ title: 'Mis Pedidos', searchPlaceholder: 'Buscar en mis pedidos...' }}>
              <DummyPage title="Mis Pedidos" description="Historial de compras." />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/checkout" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{ title: 'Tu Pedido' }}>
              <CheckoutPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/portal/pagos" element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <MainLayout headerProps={{
              title: 'Reportar Pago',
              primaryAction: {
                label: 'Subir Comprobante',
                onClick: () => alert('Subir Comprobante')
              }
            }}>
              <DummyPage title="Reportar Pago" description="Cargar comprobante de transferencia." />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* SELLER ROUTES */}
        <Route path="/ventas/clientes" element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <MainLayout headerProps={{
              title: 'Mi Cartera de Clientes',
              searchPlaceholder: 'Buscar cliente...',
              primaryAction: {
                label: '+ Nuevo Cliente',
                onClick: () => alert('Nuevo Cliente')
              }
            }}>
              <ClientsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/ventas/catalogo" element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <MainLayout headerProps={{ title: 'Catálogo de Vendedores', searchPlaceholder: 'Buscar producto...' }}>
              <CatalogPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/ventas/catalogo/:clientId" element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <MainLayout headerProps={{ title: 'Tomar Pedido para Cliente', searchPlaceholder: 'Buscar producto...' }}>
              <CatalogPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/ventas/catalogo/:productId" element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <MainLayout headerProps={{ title: 'Volver al Catálogo', showBack: true, backUrl: '/ventas/catalogo' }}>
              <ProductDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all route mapping to root to rely on Role routing or authentication state */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
}

export default App