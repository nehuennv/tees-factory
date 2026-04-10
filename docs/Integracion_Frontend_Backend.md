# 🔌 Plan de Integración Frontend ↔ Backend

**Objetivo:** Reemplazar todos los datos mock (`.ts` estáticos) por llamadas reales a la API de producción usando `apiClient` (Axios) ya configurado en `src/lib/apiClient.ts`.

**Base URL de Producción:** `http://200.107.200.123:3000/api`

> [!IMPORTANT]
> Este documento está organizado **endpoint por endpoint**. Cada sección detalla exactamente qué archivo del frontend consume datos mock, qué mock reemplazar, y cómo debe quedar el código para consumir la API real.

---

## 📋 Índice de Endpoints

| # | Endpoint | Prioridad | Archivos Afectados |
|---|----------|-----------|---------------------|
| 1 | `POST /api/auth/login` | 🔴 Crítica | `authStore.ts`, `LoginPageB2B.tsx`, `apiClient.ts` |
| 2 | `GET /api/dashboard/kpis` | 🟡 Alta | `AdminDashboardPage.tsx` |
| 3 | `GET /api/products` | 🔴 Crítica | `CatalogPage.tsx`, `CatalogManagementPage.tsx`, `mockData.ts` |
| 4 | `GET /api/products/:id` | 🔴 Crítica | `ProductDetailPage.tsx` |
| 5 | `POST /api/products` | 🟡 Alta | `CreateProductModal.tsx` |
| 6 | `PUT /api/products/:id/stock` | 🟡 Alta | `ProductStockDrawer.tsx` |
| 7 | `GET /api/clients` | 🔴 Crítica | `ClientList.tsx`, `clients.ts` (mock) |
| 8 | `POST /api/clients` | 🟡 Alta | `NewClientModal.tsx` |
| 9 | `PUT /api/clients/:id` | 🟢 Media | `EditClientModal.tsx` |
| 10 | `GET /api/clients/:id/ledger` | 🔴 Crítica | `CurrentAccountPage.tsx`, `account.ts` (mock) |
| 11 | `POST /api/orders` | 🔴 Crítica | `CheckoutPage.tsx`, `cartStore.ts` |
| 12 | `GET /api/orders` | 🔴 Crítica | `ClientOrdersPage.tsx`, `OrdersBoardPage.tsx`, `orders.ts` (mock) |
| 13 | `PATCH /api/orders/:id/status` | 🟡 Alta | `OrdersBoardPage.tsx` |
| 14 | `POST /api/orders/express` | 🟢 Media | `AdminFastOrderModal.tsx` |
| 15 | `POST /api/payments` | 🔴 Crítica | `PaymentReportPage.tsx`, `PaymentReportModal.tsx` |
| 16 | `GET /api/payments` | 🟡 Alta | `TreasuryPage.tsx`, `payments.ts` (mock) |
| 17 | `POST /api/payments/:id/approve` | 🟡 Alta | `TreasuryPage.tsx` |

---

## 🔴 PRIORIDAD CRÍTICA — PASO 0: Configuración Base

### 0.1 Variable de Entorno (`.env`)

**Archivo:** `.env`
**Estado actual:** `VITE_API_URL=http://localhost:8080/api`
**Acción:** Cambiar al servidor real de producción.

```env
VITE_API_URL=http://200.107.200.123:3000/api
```

### 0.2 Persistencia del Token en `apiClient.ts`

**Archivo:** `src/lib/apiClient.ts`
**Estado actual:** Ya lee `localStorage.getItem('jwt_token')` y lo inyecta como `Bearer`. ✅ Listo.
**Acción:** Verificar que el interceptor de respuesta 401 funcione contra el servidor real y redirija a `/login` correctamente.

### 0.3 Refactorizar `authStore.ts` para API Real

**Archivo:** `src/store/authStore.ts`
**Estado actual:** Login usa `mockUsers` hardcodeados y acepta un `role` string en vez de credenciales.
**Acción:**

1.  **Agregar campos al User:** El backend devuelve `reference_id` (UUID del perfil CLIENTE o VENDEDOR). Añadir este campo a la interfaz `User`.
2.  **Reescribir `login()`:** Debe recibir `email` y `password`, llamar a `POST /api/auth/login`, guardar el `token` en `localStorage`, y setear el `user` desde la respuesta.
3.  **Reescribir `logout()`:** Debe limpiar el token de `localStorage`.
4.  **Eliminar** el objeto `mockUsers`.

```typescript
// Interfaz User actualizada
interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'CLIENT' | 'SELLER';
    reference_id: string | null; // UUID del perfil asociado
}

// Login real
login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('jwt_token', data.token);
    set({ user: data.user, isAuthenticated: true });
}

// Logout
logout: () => {
    localStorage.removeItem('jwt_token');
    set({ user: null, isAuthenticated: false });
}
```

---

## 1️⃣ `POST /api/auth/login`

**Archivo(s):** `src/features/auth/pages/LoginPageB2B.tsx`
**Mock actual:** `handleRegularLogin()` muestra un toast de error falso. `handleDebugLogin()` usa `login(role)` con datos ficticios.
**Acción:**

1. Conectar `handleRegularLogin()` al `authStore.login(email, password)` refactorizado.
2. Envolver en `try/catch`: si la API retorna 401, mostrar `toast.error("Credenciales inválidas")`.
3. En caso de éxito, usar el `user.role` de la respuesta para navegar al dashboard correcto (`ROLE_ROUTES[user.role]`).
4. **Conservar** los botones Debug para `import.meta.env.DEV`, pero hacer que también llamen a la API real con credenciales de prueba pre-configuradas (o eliminarlos).

```typescript
const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        setGlobalLoading(true);
        await login(email, password); // authStore.login refactorizado
        const user = useAuthStore.getState().user;
        navigate(ROLE_ROUTES[user!.role], { replace: true });
        setTimeout(() => setGlobalLoading(false), 150);
    } catch (err: any) {
        setGlobalLoading(false);
        const msg = err?.response?.data?.message || "Credenciales inválidas.";
        toast.error(msg);
    } finally {
        setIsLoading(false);
    }
};
```

---

## 2️⃣ `GET /api/dashboard/kpis`

**Archivo(s):** `src/features/admin/pages/AdminDashboardPage.tsx`
**Mock actual:** Importa `MOCK_CLIENTS`, `MOCK_ORDERS`, `MOCK_PAYMENTS`, `MOCK_PRODUCTS` y calcula KPIs con `useMemo` localmente (deuda total, facturación, pagos pendientes, top deudores, stock crítico).
**Acción:**

1. **Eliminar** los imports de mocks (`MOCK_CLIENTS`, `MOCK_ORDERS`, `MOCK_PAYMENTS`, `MOCK_PRODUCTS`).
2. **Crear un hook o un `useEffect`** que llame a `apiClient.get('/dashboard/kpis')`.
3. Usar estado de carga (skeleton o spinner) mientras se resuelve la petición.
4. Mapear la respuesta directamente a los componentes de KPI:
   - `data.totalDebt` → Card "Deuda Total"
   - `data.currentMonthRevenue` → Card "Facturación Mes Actual"
   - `data.pendingPaymentsCount` → Card "Pagos Pendientes"
   - `data.preparingOrdersCount` → Card "Pedidos en Preparación"
   - `data.topDebtors[]` → Lista "Top Deudores"
   - `data.criticalStock[]` → Lista "Alertas de Stock"
5. Los datos de gráficos (`REVENUE_DATA`, `CATEGORY_DATA`) todavía son estáticos, **pueden mantenerse mock** hasta que el backend lo implemente como un endpoint separado.

---

## 3️⃣ `GET /api/products`

**Archivo(s):** `src/features/catalog/pages/CatalogPage.tsx`, `src/features/admin/pages/CatalogManagementPage.tsx`
**Mock actual:** Ambos importan `MOCK_PRODUCTS` de `src/lib/mockData.ts` — un array estático de ~23 productos.
**Acción:**

1. **En `CatalogPage.tsx`:** Reemplazar con `useEffect` + `apiClient.get('/products', { params: { search, category } })`.
   - El backend ya filtra `isActive` automáticamente según el rol del token JWT.
   - Pasar `searchTerm` como query param `?search=xxx` en vez de filtrar localmente.
2. **En `CatalogManagementPage.tsx`:** Reemplazar con la misma llamada, pero el Admin verá todos (activos e inactivos).

**Diferencias de shape entre Mock y API:**

| Campo Mock (`Product`) | Campo API Real | Notas |
|---|---|---|
| `id: "REM-001"` | `id: "uuid"` | Cambia a UUIDs reales |
| `quality: "BASIC"` | *(no viene en listado)* | La calidad está dentro de la Matriz 3D |
| `stockStatus: "HIGH"` | *(no viene)* | El frontend puede derivar del `totalStock` |
| `sizes: ["S","M"]` | *(no viene en listado)* | Solo viene en GET /:id |
| `colors: 15` | *(no viene en listado)* | Solo viene en GET /:id |
| `basePrice` | `basePrice` | ✅ Igual |
| `totalStock` | `totalStock` | ✅ Igual |
| `image` | *(no mencionado)* | ⚠️ Chequear si vuelve del backend o se maneja estáticamente |

> [!WARNING]
> **Atención con las imágenes:** El mock usa URLs de Unsplash. La API no define un campo `image` en `GET /products`. Se debe confirmar con el backend si devuelve una URL de imagen o si se necesita agregar ese campo a la DB.

---

## 4️⃣ `GET /api/products/:productId` (Matriz 3D)

**Archivo(s):** `src/features/catalog/pages/ProductDetailPage.tsx`
**Mock actual:** Genera **la Matriz 3D completa con datos aleatorios** en el frontend usando `COLOR_POOL`, `QUALITY_PRESETS` y `Math.floor(Math.random() * 300)` para el stock. Es la refactorización más importante.
**Acción:**

1. **Eliminar** toda la generación client-side de `colorPool`, `QUALITY_PRESETS`, `generateProductQualities()`, etc.
2. **Agregar** un `useEffect` con `apiClient.get(`/products/${productId}`)`.
3. **Mapear** la respuesta del backend a la UI:
   - `data.qualities[]` → Tabs de calidad
   - `data.qualities[n].colors[]` → Filas de la matriz
   - `data.qualities[n].colors[m].sizes[]` → Columnas por talle
   - Cada `sizes[x].availableStock` → Límite máximo del `<input>`, **NO el stock físico crudo**.
   - Cada `sizes[x].id` → **Este es el `variantId`** que se mandará al `POST /api/orders`.
4. **Actualizar `CartItem`** en `cartStore.ts`: agregar un campo `variantId: string` (el UUID de la variante en backend), ya que el `POST /api/orders` necesita `items: [{ variantId, quantity }]`.

**Mapping visual:**

```
Respuesta Backend                    →   UI Frontend
─────────────────────────────────────────────────────
qualities[0].qualityName             →   Tab "Premium Reforzado"
qualities[0].basePrice               →   Precio por unidad
qualities[0].colors[0].colorName     →   Fila "Negro"
qualities[0].colors[0].sizes[0].size →   Columna "42"
qualities[0].colors[0].sizes[0].availableStock → max input
qualities[0].colors[0].sizes[0].id   →   variantId para POST /orders
```

---

## 5️⃣ `POST /api/products`

**Archivo(s):** `src/features/admin/components/CreateProductModal.tsx`
**Mock actual:** Simula con `setTimeout` y `toast.success`.
**Acción:**

1. Reemplazar el `setTimeout` por `apiClient.post('/products', { name, category, description })`.
2. Al resolver, desencadenar un refetch del listado de productos (invalidar cache o re-llamar GET /products).
3. **NOTA:** El backend solo acepta `name`, `category` y `description`. Los campos SKU y Precio Base del modal actual **no se envían en este endpoint** (esos se crean como `PRODUCT_QUALITIES` / `PRODUCT_VARIANTS`). Validar con backend.

---

## 6️⃣ `PUT /api/products/:productId/stock`

**Archivo(s):** `src/features/admin/components/ProductStockDrawer.tsx`
**Mock actual:** `src/api/mockAdminCatalog.ts` — `updateProductStock()` que solo hace `console.log`.
**Acción:**

1. Reemplazar la llamada mock por `apiClient.put(`/products/${productId}/stock`, matrixData)`.
2. El body debe ser un array: `[{ qualityId, color, size, physicalStock }]`.
3. Este endpoint "pisa" el stock real contado en depósito.

---

## 7️⃣ `GET /api/clients`

**Archivo(s):** `src/components/shared/ClientList.tsx`
**Mock actual:** Importa `MOCK_CLIENTS` de `src/mocks/clients.ts` (270+ clientes estáticos).
**Acción:**

1. Reemplazar por `apiClient.get('/clients')`.
2. **Importante:** El backend ya filtra por vendedor automáticamente si el token es de un `SELLER`.
3. La paginación del lado del cliente (50 items por página) puede mantenerse si el backend no pagina. Pero si hay muchos clientes, considerar query params de paginación.
4. Los campos de respuesta son compatibles: `id`, `name`, `cuit`, `email`, `balance`, `sellerId`, `isActive`. ✅

---

## 8️⃣ `POST /api/clients` (Nuevo Cliente)

**Archivo(s):** `src/features/admin/components/NewClientModal.tsx`
**Mock actual:** Simula con `setTimeout`.
**Acción:**

1. Reemplazar por `apiClient.post('/clients', { name, cuit, email, phone })`.
2. Al éxito, refrescar la lista de clientes.

---

## 9️⃣ `PUT /api/clients/:clientId` (Editar)

**Archivo(s):** `src/features/admin/components/EditClientModal.tsx`
**Mock actual:** Simula con `setTimeout`.
**Acción:**

1. Reemplazar por `apiClient.put(`/clients/${client.id}`, formData)`.
2. Al éxito, refrescar la lista y cerrar el modal.

---

## 🔟 `GET /api/clients/:clientId/ledger`

**Archivo(s):** `src/features/client/pages/CurrentAccountPage.tsx`
**Mock actual:** Importa `MOCK_CURRENT_BALANCE` y `MOCK_TRANSACTIONS` de `src/mocks/account.ts`.
**Acción:**

1. El cliente tiene su `reference_id` del authStore (es el UUID del perfil CLIENTS). Usar ese ID.
2. Reemplazar por `apiClient.get(`/clients/${referenceId}/ledger`)`.
3. **Mapear la respuesta:**
   - `data.client.currentDebt` → Reemplaza `MOCK_CURRENT_BALANCE`.
   - `data.ledger[]` → Reemplaza `MOCK_TRANSACTIONS`.

**Mapping de campos del Ledger:**

| Campo API | Campo Mock Actual | Uso en UI |
|---|---|---|
| `type: "DEBT_INCREASE"` | `type: "ORDER"` | Ícono de flecha roja ↗ |
| `type: "DEBT_DECREASE"` | `type: "PAYMENT"` | Ícono de flecha verde ↙ |
| `amount` | `amount` | ✅ Igual |
| `balanceAfter` | *(no existía)* | Se puede mostrar como saldo parcial |
| `createdAt` | `date` | Renombrar en el mappeo |

> [!TIP]
> No existe un campo `description` ni `status` en la respuesta del ledger real. Hablar con backend para ver si se agrega un campo `reference_order_id` o `reference_payment_id` para poder mostrar "Pedido #ORD-xxx" como concepto.

---

## 1️⃣1️⃣ `POST /api/orders` (Confirmar Pedido)

**Archivo(s):** `src/features/checkout/pages/CheckoutPage.tsx`
**Mock actual:** `handleConfirmOrder()` genera un N° de orden random y simula concurrencia con 30% de probabilidad.
**Acción:**

1. Reemplazar `setTimeout` por llamada real:
```typescript
try {
    const payload = {
        clientId: isDraft ? draftClientId : authStore.user.reference_id,
        items: items.map(item => ({
            variantId: item.variantId, // ← campo nuevo en CartItem
            quantity: item.quantity
        })),
        discountPercentage: 0, // o del input si existe
        observations: notes
    };
    const { data } = await apiClient.post('/orders', payload);
    // Éxito: mostrar pantalla de confirmación
} catch (err) {
    if (err.response?.status === 409) {
        toast.error("Inventario insuficiente", {
            description: "Alguien acaba de comprar ese stock.",
            action: { label: "Volver", onClick: () => navigate("/portal/catalogo") }
        });
    }
}
```

2. **Eliminación de la simulación aleatoria** de `Math.random() < 0.3`.
3. El carrito ya tiene toda la data necesaria, solo falta agregar `variantId` al type `CartItem` (viene del paso 4 — Matriz 3D).

---

## 1️⃣2️⃣ `GET /api/orders`

**Archivo(s):** `src/features/client/pages/ClientOrdersPage.tsx`, `src/features/admin/pages/OrdersBoardPage.tsx`
**Mock actual:** Ambos importan `MOCK_ORDERS` de `src/mocks/orders.ts`.
**Acción:**

1. **`ClientOrdersPage`:** Llamar `apiClient.get('/orders')`. El backend filtra por token CLIENT.
2. **`OrdersBoardPage`:** Llamar `apiClient.get('/orders')`. El backend devuelve TODOS para ADMIN.
   - Mapear los status del backend (`PENDING, PICKING, SHIPPED, DELIVERED, CANCELLED`) a las columnas del Kanban.

**Diferencias de status entre Mock y Backend:**

| Columna Kanban (Frontend) | Status Mock | Status Backend Real |
|---|---|---|
| Nuevos | `NEW` | `PENDING` |
| Pagados | `PAID` | *(no existe)* ⚠️ |
| En Preparación | `PREPARING` | `PICKING` |
| Despachados | `DISPATCHED` | `SHIPPED` |

> [!WARNING]
> El backend usa `PENDING, PICKING, SHIPPED, DELIVERED, CANCELLED` pero el frontend Kanban tiene columnas `NEW, PAID, PREPARING, DISPATCHED`. Hay que **alinear los nombres** o **crear un mapping** para traducir. Coordinar con backend si existe un status `PAID`.

---

## 1️⃣3️⃣ `PATCH /api/orders/:orderId/status`

**Archivo(s):** `src/features/admin/pages/OrdersBoardPage.tsx`
**Mock actual:** El drag-and-drop solo actualiza el estado local (`setColumns`).
**Acción:**

1. En `handleDragEnd()`, después de mover visualmente, hacer `apiClient.patch(`/orders/${orderId}/status`, { status: newStatus })`.
2. Si falla, revertir el movimiento visual (optimistic update con rollback).
3. Mapear los nombres de columnas del Kanban al enum que espera el backend.

---

## 1️⃣4️⃣ `POST /api/orders/express`

**Archivo(s):** `src/features/admin/components/AdminFastOrderModal.tsx`
**Mock actual:** Simula con `setTimeout`.
**Acción:**

1. Reemplazar por `apiClient.post('/orders/express', { clientName, totalAmount, observations })`.

---

## 1️⃣5️⃣ `POST /api/payments` (Reportar Pago - FormData)

**Archivo(s):** `src/features/client/pages/PaymentReportPage.tsx`, `src/features/client/components/PaymentReportModal.tsx`
**Mock actual:** Arma un `FormData` pero solo hace `console.log` y `setTimeout`.
**Acción:**

1. El código ya arma el `FormData` correctamente. Solo falta reemplazar el `setTimeout` por la llamada real:
```typescript
const formData = new FormData();
formData.append('amount', amount);
formData.append('method', method); // ej: "Transferencia Galicia"
formData.append('reference', reference); // Nro de operación - FALTA en los inputs actuales
formData.append('receipt', file);

await apiClient.post('/payments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
```

2. **⚠️ Campo faltante:** El backend espera un campo `reference` (Nro de operación bancaria). El formulario actual tiene `bank` como input de banco pero no tiene un input separado para el número de referencia. **Hay que agregar un `<Input>` para "Nro. de Operación / Referencia".**

---

## 1️⃣6️⃣ `GET /api/payments` (Lista de Pagos - Admin)

**Archivo(s):** `src/features/admin/pages/TreasuryPage.tsx`
**Mock actual:** Importa `MOCK_PAYMENTS` de `src/mocks/payments.ts`.
**Acción:**

1. Reemplazar por `apiClient.get('/payments')`.
2. Mapear la respuesta al tipo `PaymentReport` existente.

---

## 1️⃣7️⃣ `POST /api/payments/:paymentId/approve`

**Archivo(s):** `src/features/admin/pages/TreasuryPage.tsx`
**Mock actual:** Llama a `updatePaymentStatus()` de `src/api/mockTreasury.ts` que solo cambia estado local.
**Acción:**

1. Reemplazar por `apiClient.post(`/payments/${paymentId}/approve`, { approvedAmount })`.
2. El admin puede aprobar un monto parcial (si el cliente depositó menos).
3. Al éxito, refrescar la lista o actualizar localmente.

---

## 🗑️ Archivos Mock a Eliminar (Post-Integración)

Una vez que **todos** los endpoints estén conectados, estos archivos ya no serán necesarios:

| Archivo Mock | Reemplazado por |
|---|---|
| `src/mocks/clients.ts` | `GET /api/clients` |
| `src/mocks/orders.ts` | `GET /api/orders` |
| `src/mocks/payments.ts` | `GET /api/payments` |
| `src/mocks/account.ts` | `GET /api/clients/:id/ledger` |
| `src/lib/mockData.ts` | `GET /api/products` |
| `src/api/mockAdminCatalog.ts` | `POST/PUT /api/products/*` |
| `src/api/mockTreasury.ts` | `POST /api/payments/:id/approve` |

> [!CAUTION]
> **No eliminar los mocks hasta que TODOS los endpoints de esa sección estén verificados.** Mantenerlos como fallback durante el desarrollo gradual.

---

## ⚠️ Discrepancias Detectadas (Requieren Coordinación con Backend)

### 1. Campo `image` en Productos
El mock actual muestra imágenes de Unsplash. La API `GET /api/products` no incluye un campo `image` en la respuesta documentada. **Preguntar al backend** si devuelve URLs de la carpeta `/uploads/` o si hay que agregarlo.

### 2. Status de Órdenes
El frontend usa `NEW`, `PAID`, `PREPARING`, `DISPATCHED`. El backend usa `PENDING`, `PICKING`, `SHIPPED`, `DELIVERED`, `CANCELLED`. Hay que crear un **mapping bidireccional** o pedir al backend que agregue un status `PAID`.

### 3. Campo `reference` en Reporte de Pago
El backend espera `reference` (Nro. de operación). El formulario actual no tiene este input. **Hay que agregar el campo al formulario** de `PaymentReportPage.tsx`.

### 4. Campo `variantId` en el Carrito
El `CartItem` actual no tiene `variantId`. Hay que agregarlo para que el `POST /api/orders` pueda enviar `{ variantId, quantity }` correctamente.

### 5. Detalle de Órdenes (Items)
La respuesta de `GET /api/orders` no documenta si trae los `items[]` de cada orden. `ClientOrdersPage` los necesita para el drawer "Remito". **Confirmar con backend.**

### 6. Comprobantes de Pago (Recibos)
La URL estática de archivos es `http://200.107.200.123:3000/uploads/...`. El componente `ReceiptViewerModal` necesita saber la ruta completa del comprobante. **Confirmar** que `GET /api/payments` devuelve un campo con la ruta del archivo adjunto.
