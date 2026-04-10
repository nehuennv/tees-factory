# HECTOR B2B — Backend API Documentation 🚀

Documentación completa para integración Frontend ↔ Backend.
Basada en el **Backend Request Specification for Admin Dashboard Integration**.

---

## 🌐 Configuración General

| Variable | Valor |
|---|---|
| **Base URL (Producción)** | `http://200.107.200.123:3000/api` |
| **Static Files** | `http://200.107.200.123:3000/uploads/...` |
| **Content-Type** | `application/json` (excepto upload de comprobantes) |
| **Auth Header** | `Authorization: Bearer <jwt_token>` |

> Para el frontend, configurar en `.env`:
> ```
> VITE_API_URL=http://200.107.200.123:3000/api
> ```

---

## 🔒 1. Autenticación (JWT)

### `POST /api/auth/login`
Obtener token JWT. No requiere autenticación previa.

**Request Body:**
```json
{ "email": "admin@hector.com", "password": "Admin1234!" }
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@hector.com",
    "role": "ADMIN",
    "reference_id": null
  }
}
```

**Roles disponibles:** `ADMIN`, `CLIENT`, `SELLER`

> ⚠️ Guardar el token en `localStorage` como `jwt_token` y enviarlo en **todas** las siguientes llamadas:
> ```
> Authorization: Bearer <token>
> ```

**Usuarios Seed (Testing):**

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@hector.com` | `Admin1234!` |
| Seller | `vendedor@hector.com` | `Seller1234!` |
| Client | `cliente@hector.com` | `Client1234!` |
| Client 2 | `cliente2@hector.com` | `Client1234!` |

---

## 📊 2. Dashboard & KPIs (Solo ADMIN)

### 2.1 `GET /api/dashboard/kpis`
Métricas agregadas para tarjetas del dashboard.

**Response (200 OK):**
```json
{
  "totalDebt": 5400000,
  "currentMonthRevenue": 150000,
  "previousMonthRevenue": 120000,
  "previousMonthDebt": 5200000,
  "pendingPaymentsCount": 3,
  "preparingOrdersCount": 10,
  "topDebtors": [
    { "id": "uuid", "name": "Empresa SA", "debt": 150000 }
  ],
  "criticalStock": [
    { "id": "uuid", "name": "Remera Básica - Negro M", "stock": 5 }
  ]
}
```

> 💡 **`previousMonthRevenue`** y **`previousMonthDebt`** están disponibles para calcular los labels de porcentaje (`"+X% vs mes anterior"`) en las KPI cards. Fórmula frontend:
> ```js
> const pctChange = ((current - previous) / previous * 100).toFixed(1);
> ```

---

### 2.2 `GET /api/dashboard/revenue-trend`
Ingresos mensuales de los últimos 6 meses. Para el gráfico de línea/barras.

**Response (200 OK):**
```json
[
  { "month": "Oct", "total": 0 },
  { "month": "Nov", "total": 50000 },
  { "month": "Dic", "total": 120000 },
  { "month": "Ene", "total": 85000 },
  { "month": "Feb", "total": 200000 },
  { "month": "Mar", "total": 150000 }
]
```

> Siempre devuelve exactamente 6 objetos (meses sin datos = `total: 0`).

---

### 2.3 `GET /api/dashboard/category-distribution`
Distribución de unidades vendidas por categoría de producto. Para el pie chart.

**Response (200 OK):**
```json
[
  { "name": "Remeras", "value": 450 },
  { "name": "Pantalones", "value": 200 },
  { "name": "Buzos", "value": 120 }
]
```

> Si no hay órdenes aún, devuelve las categorías existentes con `value: 0`.

---

## 📦 3. Catálogo y Matriz 3D

### 3.1 `GET /api/products` (Cualquier rol autenticado)
Lista de productos. **Admin** ve todos (incluyendo inactivos). **Client/Seller** solo ven activos.

**Query Params opcionales:** `?search=remera&category=Camperas`

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Remera Básica",
    "category": "Remeras",
    "basePrice": 2800,
    "totalStock": 150,
    "isActive": true
  }
]
```

---

### 3.2 `GET /api/products/:productId` (Cualquier rol autenticado)
Devuelve la **Matriz 3D** completa: Calidad → Color → Talle. Necesario para el selector del formulario de pedidos.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Pantalón Cargo",
  "category": "Pantalones",
  "qualities": [
    {
      "id": "uuid-calidad",
      "qualityName": "Premium Reforzado",
      "basePrice": 8500,
      "colors": [
        {
          "colorName": "Negro",
          "sizes": [
            {
              "id": "uuid-variante",
              "size": "42",
              "sku": "PC-PREM-NEG-42",
              "availableStock": 25
            }
          ]
        }
      ]
    }
  ]
}
```

> ⚠️ **`id` dentro de `sizes[]`** es el `variantId` que se usa en `POST /api/orders` para armar el pedido.
> Usar `availableStock` (no el stock físico) como máximo del input quantity.

---

### 3.3 `POST /api/products` (Solo ADMIN)
```json
{ "name": "Buzo Canguro", "category": "Buzos", "description": "..." }
```

### 3.4 `PATCH /api/products/:productId` (Solo ADMIN)
```json
{ "name": "Nombre editado", "category": "Nuevo" }
```

### 3.5 `PATCH /api/products/:productId/status` (Solo ADMIN)
```json
{ "isActive": false }
```

### 3.6 `PUT /api/products/:productId/stock` (Solo ADMIN)
Pisar stock físico desde conteo en depósito:
```json
[
  { "qualityId": "uuid", "color": "Negro", "size": "M", "physicalStock": 100 }
]
```

---

## 👥 4. Clientes y Cuenta Corriente

### 4.1 `GET /api/clients` (ADMIN y SELLER)
**SELLER** recibe solo sus clientes asignados (el back filtra automáticamente).

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Tienda Moda SRL",
    "cuit": "30-12345678-9",
    "email": "comprador@tienda.com",
    "balance": 250000,
    "sellerId": "uuid-vendedor",
    "isActive": true
  }
]
```

### 4.2 `POST /api/clients` (ADMIN y SELLER)
```json
{
  "companyName": "Nueva Empresa",
  "taxId": "20-11111111-2",
  "phone": "+54 9 11 1234-5678",
  "billingAddress": "Av. Siempre Viva 123",
  "shippingAddress": "Depósito Central"
}
```

### 4.3 `PUT /api/clients/:clientId` (Solo ADMIN)
Mismos campos que POST, actualiza los datos.

### 4.4 `PATCH /api/clients/:clientId/seller` (Solo ADMIN)
Asignar vendedor:
```json
{ "sellerId": "uuid-del-vendedor" }
```

### 4.5 `GET /api/clients/:clientId/ledger` (ADMIN y CLIENT)
Cuenta corriente (movimientos de deuda).

**Response (200 OK):**
```json
{
  "client": { "id": "uuid", "name": "Tienda Moda SRL", "currentDebt": 100000 },
  "ledger": [
    {
      "id": "uuid",
      "type": "DEBT_INCREASE",
      "amount": 150000,
      "balanceAfter": 250000,
      "orderId": "uuid-orden",
      "paymentId": null,
      "createdAt": "2026-04-10T12:00:00Z"
    },
    {
      "id": "uuid",
      "type": "DEBT_DECREASE",
      "amount": 50000,
      "balanceAfter": 100000,
      "orderId": null,
      "paymentId": "uuid-pago",
      "createdAt": "2026-04-10T14:00:00Z"
    }
  ]
}
```

---

## 🛒 5. Pedidos (Logística y Reserva de Stock)

### 5.1 `POST /api/orders` (CLIENT, SELLER, ADMIN)
Crea orden con **reserva atómica de stock** (concurrency-safe via `SELECT FOR UPDATE`).

**Request Body:**
```json
{
  "clientId": "uuid-del-cliente",
  "items": [
    { "variantId": "uuid-variante-de-matriz", "quantity": 10 }
  ],
  "discountPercentage": 5,
  "observations": "Enviar todo en caja negra"
}
```

> Para rol `CLIENT`, `clientId` es opcional (lo toma del token automáticamente).

**Success (201 Created):**
```json
{
  "id": "uuid-orden",
  "clientId": "uuid",
  "subtotal": 85000,
  "discountPercentage": 5,
  "totalAmount": 80750,
  "status": "PENDING",
  "itemCount": 1,
  "createdAt": "2026-04-10T15:00:00Z"
}
```

**Stock Insuficiente (409 Conflict):**
```json
{
  "error": "Stock insuficiente",
  "detail": "Remera Básica Negro M: disponible 3, solicitado 10"
}
```

> ⚠️ **El frontend DEBE atrapar el 409** y mostrar el mensaje de `detail` al usuario.

---

### 5.2 `GET /api/orders` (Cualquier rol autenticado)
El backend filtra por rol automáticamente:
- **ADMIN**: Todas las órdenes (para Kanban board)
- **CLIENT**: Solo sus órdenes
- **SELLER**: Órdenes de sus clientes asignados

**Query params opcionales:** `?status=PENDING&minMonto=50000`

---

### 5.3 `PATCH /api/orders/:orderId/status` (Solo ADMIN)
Para el drag-and-drop del **Kanban board**.

```json
{ "status": "PICKING" }
```

**Valores válidos:** `PENDING` → `PICKING` → `SHIPPED` → `DELIVERED` → `CANCELLED`

> Si se cambia a `CANCELLED`, el stock reservado se **libera automáticamente**.

---

### 5.4 `POST /api/orders/express` (Solo ADMIN)
Pedido rápido de mostrador sin pasar por la matriz de stock.

```json
{ "clientName": "Mostrador", "totalAmount": 15000, "observations": "2 remeras blancas M" }
```

---

## 💰 6. Tesorería y Pagos

### 6.1 `POST /api/payments` (Solo CLIENT)
Reportar un pago con comprobante adjunto.

> ⚠️ **Content-Type: `multipart/form-data`** (NO `application/json`)

**Campos FormData:**
| Campo | Tipo | Descripción |
|---|---|---|
| `amount` | Number | Monto reportado |
| `method` | String | Ej: "Transferencia Galicia" |
| `reference` | String | Nro de operación (opcional) |
| `receipt` | File | Comprobante JPG/PNG/PDF (máx 10MB) |

**Response (201 Created):**
```json
{
  "id": "uuid",
  "amount": 50000,
  "method": "Transferencia",
  "status": "PENDING_REVIEW",
  "receiptUrl": "/uploads/receipts/filename.jpg",
  "reportedAt": "2026-04-10T15:00:00Z"
}
```

> Para mostrar el comprobante en el frontend:
> ```
> http://200.107.200.123:3000/uploads/receipts/filename.jpg
> ```

---

### 6.2 `GET /api/payments` (Solo ADMIN)
Lista de pagos para conciliación en tesorería.

**Query params opcionales:** `?status=PENDING_REVIEW&limit=5`

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "clientId": "uuid",
    "clientName": "Tienda Moda SRL",
    "amount": 50000,
    "method": "Transferencia",
    "bankName": null,
    "orderId": "uuid-orden-relacionada",
    "reference": "OP-123456",
    "receiptUrl": "/uploads/receipts/file.jpg",
    "paymentDate": "2026-04-10",
    "status": "PENDING_REVIEW",
    "createdAt": "2026-04-10T15:00:00Z",
    "reportedAt": "2026-04-10T15:00:00Z"
  }
]
```

> `receiptUrl` requiere prepend de la base URL para preview: `http://200.107.200.123:3000` + `receiptUrl`

---

### 6.3 `POST /api/payments/:paymentId/approve` (Solo ADMIN)
Aprueba pago y descuenta la deuda automáticamente en la cuenta corriente.

```json
{ "approvedAmount": 50000 }
```

> `approvedAmount` es opcional — si no se manda, aprueba por el monto reportado.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "approvedAmount": 50000,
  "previousDebt": 250000,
  "newDebt": 200000
}
```

---

### 6.4 `POST /api/payments/:paymentId/reject` (Solo ADMIN)
Rechaza un pago. Solo funciona si el status actual es `PENDING_REVIEW`.

**Response (200 OK):**
```json
{ "id": "uuid", "status": "REJECTED" }
```

---

## ⚠️ Códigos de Error

| Status | Significado | Acción Frontend |
|---|---|---|
| `200` | OK | Renderizar datos |
| `201` | Creado | Mostrar éxito + refreshear lista |
| `400` | Bad Request | Mostrar `error` del body |
| `401` | Token inválido/expirado | Redirect a `/login` |
| `403` | Permisos insuficientes | Toast de error |
| `404` | Recurso no encontrado | Mostrar mensaje |
| `409` | Conflicto de stock | Mostrar `detail` del body |
| `500` | Error del servidor | Toast genérico + log |

---

## 🔧 Health Check

```
GET http://200.107.200.123:3000/api/health
```
```json
{ "status": "ok", "timestamp": "2026-04-10T15:00:00Z" }
```

---

## 📁 Estructura del Proyecto

```
back/
├── src/
│   ├── config/
│   │   └── database.js          # Pool PostgreSQL (dual env)
│   ├── controllers/
│   │   ├── authController.js     # Login, register, profile
│   │   ├── dashboardController.js # KPIs, revenue-trend, category-dist
│   │   ├── productsController.js  # CRUD + Matriz 3D + Stock
│   │   ├── clientsController.js   # CRUD + Seller proxy + Ledger
│   │   ├── ordersController.js    # Órdenes con FOR UPDATE
│   │   └── paymentsController.js  # Tesorería + Multer upload
│   ├── middleware/
│   │   ├── auth.js               # JWT verify + role authorization
│   │   └── upload.js             # Multer config (receipts)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   ├── clients.js
│   │   ├── orders.js
│   │   └── payments.js
│   ├── db/
│   │   ├── migrate.js            # Schema + indexes
│   │   └── seed.js               # Datos iniciales
│   ├── tests/
│   │   ├── test-auth.js
│   │   └── test-full-api.js      # 61 tests E2E
│   └── server.js                 # Express entry point
├── .env                          # ⛔ NO SE SUBE (gitignored)
├── .env.production               # ⛔ NO SE SUBE (gitignored)
├── .gitignore
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md                     # Esta documentación
```

---

## 🚀 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levantar servidor en desarrollo |
| `npm run migrate` | Crear/actualizar tablas + índices |
| `npm run seed` | Cargar datos iniciales de prueba |
| `npm run test:auth` | Tests de autenticación |
| `npm run test:full` | Suite E2E completa (61 tests) |

---

*Documentación generada el 10/04/2026. Backend 100% testeado — 61/61 tests passing.*
