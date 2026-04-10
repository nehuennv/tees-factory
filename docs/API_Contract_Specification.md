# Especificación de Contratos API (Frontend -> Backend)

Este documento detalla exhaustivamente todos los endpoints REST que el equipo de Backend debe proveer para que la interfaz de usuario (React) funcione en su totalidad, basándose en la Arquitectura de Datos y las simulaciones (mocks) actuales de la aplicación.

Cada endpoint asume que el Backend extraerá el `user_id` y el `role` del token JWT enviado en la cabecera `Authorization: Bearer <token>`, validando los permisos internamente.

---

## 1. Autenticación y Perfil

### `POST /api/auth/login`
- **Descripción:** Inicia sesión y devuelve el token y los roles para determinar a qué sección redirigir al usuario (`/admin`, `/portal` o `/ventas/clientes`).
- **Body:** `{ "email": "...", "password": "..." }`
- **Response `200 OK`:**
  ```json
  {
    "token": "ejT...jwt...",
    "user": {
      "id": "UUID",
      "email": "correo@...",
      "role": "ADMIN | SELLER | CLIENT",
      "reference_id": "UUID_DEL_CLIENTE_O_VENDEDOR_ASOCIADO"
    }
  }
  ```

---

## 1.5. Estadísticas y Dashboard (KPIs)

### `GET /api/dashboard/kpis` *(Solo Admin)*
- **Descripción:** Las vistas administrativas (como `AdminDashboardPage`) consumen grandes volúmenes de datos. Para mantener la política de "Zero-Latency" descrita en la arquitectura Frontend, el backend no debe enviar todos los arreglos crudos. Debe enviar métricas agregadas y listas limitadas (Top 5).
- **Response `200 OK`:**
  ```json
  {
    "totalDebt": 5400000,
    "currentMonthRevenue": 15000000,
    "pendingPaymentsCount": 12,
    "preparingOrdersCount": 8,
    "topDebtors": [ { "id": "...", "name": "...", "debt": 150000 } ],
    "criticalStock": [ { "id": "...", "name": "...", "stock": 5 } ]
  }
  ```

---

## 2. Catálogo e Inventario

### `GET /api/products`
- **Descripción:** Listado liviano para tablas y grillas. Si el rol es `CLIENT` o `SELLER`, el backend automáticamente debe filtrar devolviendo solo `isActive: true`.
- **Query Params:** `?search=xx&category=xx`
- **Response `200 OK`:** Array de objetos con datos base: `{ id, name, category, image, basePrice, totalStock, isActive }`.

### `GET /api/products/{productId}`
- **Descripción:** [DEFINIDO EN ARCHITECTURE DOC] Retorna la Matriz 3D completa (Calidades -> Colores -> Talles) lista para ser renderizada en UI.

### `POST /api/products` *(Solo Admin)*
- **Descripción:** Alta de un nuevo producto en el sistema (CreateProductModal).
- **Body:** `{ "name": "...", "sku": "...", "category": "...", "basePrice": 1000, "image": "url..." }`

### `PATCH /api/products/{productId}` *(Solo Admin)*
- **Descripción:** Actualizar datos duros del producto (nombre, categoría, precio base). (ProductEditModal).

### `PATCH /api/products/{productId}/status` *(Solo Admin)*
- **Descripción:** Pausar o publicar un producto (cambiar `isActive`).
- **Body:** `{ "isActive": true/false }`

### `PUT /api/products/{productId}/stock` *(Solo Admin)*
- **Descripción:** Reemplaza la matriz de stock físico de un producto tras guardar cambios en el Drawer de Matriz del Admin.
- **Body:** Array de celdas a actualizar: `[ { qualityId, color, size, physicalStock } ]`

---

## 3. Clientes y Directorio

### `GET /api/clients`
- **Descripción:** Obtiene la lista de clientes. Si el rol es `SELLER`, el backend mapeará vía JWT y devolverá **solo** los clientes que le pertenecen a ese vendedor.
- **Response `200 OK`:** Array con `{ id, name, cuit, email, phone, balance, sellerId }`.

### `POST /api/clients` *(Admin / Seller)*
- **Descripción:** Dar de alta un nuevo cliente (vía `NewClientModal`).
- **Body:** `{ "name": "...", "cuit": "...", "email": "...", "phone": "..." }`

### `PUT /api/clients/{clientId}` *(Admin)*
- **Descripción:** Editar los datos de contacto o facturación de un comercio (vía `EditClientModal`).

### `PATCH /api/clients/{clientId}/seller` *(Admin)*
- **Descripción:** Asignar o desasignar (null) a un representante de ventas (Vendedor) a un cliente particular. Esta acción re-enlaza quién puede ver al cliente (Modo Proxy) y qué comisión/lógica le corresponde.
- **Body:** `{ "sellerId": "UUID_DEL_VENDEDOR" }` o `null`.

### `GET /api/clients/{clientId}/ledger`
- **Descripción:** Obtiene el historial de Cuenta Corriente (Movimientos, débitos y créditos del Account Ledger) para listar en `/portal` (rol Cliente) o al hacer click en "Ver Cuenta Corriente" (rol Admin).

---

## 4. Órdenes (Logística Integral)

### `POST /api/orders`
- **Descripción:** [DEFINIDO EN ARCHITECTURE DOC]. Toma del pedido "aplanado" desde el carrito hacia la base de datos bidimensional.
- **Manejo de Errores Frontend:** Si el inventario falla debido a un conflicto de concurrencia de reservas (`reserveStock` falla), el Backend DEBE responder un HTTP **`409 Conflict`**. El frontend tiene un `try/catch` para atrapar específicamente el Error 409, mostrando un Toast y rebotando al usuario al catálogo.

### `GET /api/orders`
- **Descripción:** Litado de órdenes. 
  - Si Rol = `ADMIN`, trae todas para popular el tablero logístico Kanban (Mapeando los status).
  - Si Rol = `CLIENT`, trae solo las suyas para la página "Mis Pedidos".
- **Query Params (opcional):** `?status=PAID` o `?minMonto=100000`.

### `PATCH /api/orders/{orderId}/status` *(Solo Admin)*
- **Descripción:** Al arrastrar tarjetas en el Kanban (`OrdersBoardPage`), el frontend emite esto para actualizar la logística.
- **Body:** `{ "status": "PREPARING | DISPATCHED | PAID" }`

### `POST /api/orders/express` *(Solo Admin)*
- **Descripción:** Procesamiento del Modal *Nuevo Pedido Exprés* en el Kanban. Sube una orden en estado "NEW" sin pasar por la matriz (solo con detales en texto libre plano y monto numérico).
- **Body:** `{ "clientName": "...", "totalAmount": 150000, "observations": "10 remeras..." }`

---

## 5. Tesorería y Pagos B2B

### `POST /api/payments` *(Rol Client)*
- **Descripción:** Reporte de pago desde la Cuenta Corriente B2B. **Atención:** Como puede incluir un comprobante adjunto, el Frontend usa un objeto genérico `FormData` y no un JSON limpio.
- **Headers:** `Content-Type: multipart/form-data`
- **FormData Body:** 
  - `amount`: Number
  - `method`: String
  - `reference`: String
  - `receipt`: File (blob pdf/jpg)

### `GET /api/payments` *(Solo Admin)*
- **Descripción:** Lista los pagos y conciliaciones pendientes para la pantalla de `TreasuryPage.tsx`. Trae nombre del cliente, ID del pago, estado y foto del adjunto.

### `POST /api/payments/{paymentId}/approve` *(Solo Admin)*
- **Descripción:** Conciliar el pago. Se hace POST y no PATCH porque dispara lógicas pesadas (baja de deuda en el Ledger local o contabilidad externa).
- **Body:** `{ "approvedAmount": 50000 }` (El cajero puede aprobar un parcial o un total modificado en caja).

### `POST /api/payments/{paymentId}/reject` *(Solo Admin)*
- **Descripción:** Rebota el pago por error de transferencia. Debería mandar a `{ "status" : "REJECTED" }`.
