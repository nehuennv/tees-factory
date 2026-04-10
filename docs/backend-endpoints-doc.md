# HECTOR B2B - Documentación de Integración Frontend 🚀

Esta es la guía definitiva para el equipo de Frontend de Hector B2B. Todo el backend ya está subido a producción y 100% testeado.

**Entorno de Producción**
* **Base URL:** `http://200.107.200.123:3000/api`
* (Ruta estática para imágenes/comprobantes: `http://200.107.200.123:3000/uploads/...`)

---

## 🔒 1. Autenticación y Seguridad

Toda la aplicación se protege mediante **JWT (JSON Web Tokens)**. No hay un "API Key" estática. 

### Flujo de Login
El usuario ingresa credenciales, recibe un token, y debe enviarlo en el header `Authorization` en todas las demás llamadas.

#### `POST /api/auth/login`
* **Body:** `{ "email": "admin@hector.com", "password": "..." }`
* **Éxito (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "uuid-del-usuario",
    "email": "admin@hector.com",
    "role": "ADMIN", // Puede ser: 'ADMIN', 'CLIENT', 'SELLER'
    "reference_id": "uuid-del-perfil-cliente-o-vendedor" // null para ADMIN
  }
}
```

> [!IMPORTANT]
> **Autenticación en llamadas subsecuentes:**
> En cada request a cualquier endpoint protegido, debes incluir el siguiente header:
> `Authorization: Bearer <token_aqui>`

---

## 📊 2. Dashboard y KPIs

#### `GET /api/dashboard/kpis` (Solo ADMIN)
Retorna métricas maestras agregadas listas para mostrarse en las tarjetas del tablero.
* **Éxito (200 OK):**
```json
{
  "totalDebt": 5400000,
  "currentMonthRevenue": 150000,
  "pendingPaymentsCount": 3,
  "preparingOrdersCount": 10,
  "topDebtors": [{ "id": "...", "name": "Empresa SA", "debt": 150000 }],
  "criticalStock": [{ "id": "...", "name": "Remera Básica - Negro M", "stock": 5 }]
}
```

---

## 📦 3. Catálogo y Matriz 3D

#### `GET /api/products` (Cualquier rol logueado)
Devuelve lista liviana. Si entra un CLIENTE o VENDEDOR, el back **ya filtra automáticamente** los inactivos (no es necesario mandarlo en la URL).
* **Queries opcionales:** `?search=remera&category=Camperas`
* **Éxito (200 OK):**
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

#### `GET /api/products/:productId` (Cualquier rol logueado)
Trae la **Matriz 3D (Calidad → Color → Talle)** de un producto para renderizar selectores o grillas de pedidos.
* **Éxito (200 OK):**
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
              "id": "uuid-variante", // ESTE ES EL ID PARA HACER EL PEDIDO!
              "size": "42",
              "sku": "PC-PREM-NEG-42",
              "availableStock": 25 // physicalStock - reservedStock
            }
          ]
        }
      ]
    }
  ]
}
```

> [!TIP]
> Frontend **debe** usar `availableStock` para trabar el input máximo por talle, no el stock físico.

#### `POST /api/products` (Solo ADMIN)
* **Body:** `{ "name": "Buzo canguro", "category": "Buzos", "description": "xxx" }`

#### `PUT /api/products/:productId/stock` (Solo ADMIN)
Pisa la matriz con inventario físico real contado (Ej. conteo en depósito).
* **Body:** `[ { "qualityId": "uuid", "color": "Negro", "size": "M", "physicalStock": 100 } ]`

---

## 👥 4. Clientes y Cuentas Corrientes

#### `GET /api/clients` (Admin y Seller)
Si el rol es `SELLER`, el backend filtrará y devolverá **solo sus clientes**.
* **Éxito (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Tienda Moda SRL",
    "cuit": "30-12345678-9",
    "email": "comprador@tienda.com",
    "balance": 250000, // Deuda actual
    "sellerId": "uuid-del-vendedor",
    "isActive": true
  }
]
```

#### `GET /api/clients/:clientId/ledger` (Admin y Client)
Trae los movimientos (compras y aprobaciones de pagos) de ese cliente: **la cuenta corriente**.
* **Éxito (200 OK):**
```json
{
  "client": { "id": "...", "name": "...", "currentDebt": 100000 },
  "ledger": [
    {
      "id": "uuid-movimiento",
      "type": "DEBT_INCREASE", // o DEBT_DECREASE (cuando apruebas pago)
      "amount": 150000,
      "balanceAfter": 100000,
      "createdAt": "2026-04-10T12:00:00Z"
    }
  ]
}
```

---

## 🛒 5. Pedidos (Logística y Reserva Segura)

#### `POST /api/orders` (Cualquier rol)
**Muy Importante:** Este endpoint es *Concurrency-Safe*. Pide reserva de stock y lo descuenta temporalmente.
* **Body:**
```json
{
  "clientId": "uuid-del-cliente", // Opcional si token es de un CLIENT. Obligatorio si eres SELLER
  "items": [
    { "variantId": "uuid-de-get-product-matrix", "quantity": 10 }
  ],
  "discountPercentage": 5,
  "observations": "Enviar todo en caja negra"
}
```
* **Si Falla el Stock (409 Conflict):**
Retornará `409` si otro cliente/vendedor robó el stock al mismo tiempo. **Frontend debe atrapar el 409 y mostrar el aviso**.

#### `PATCH /api/orders/:orderId/status` (Solo ADMIN)
Drag-and-drop del Kanban en Frontend pegará a este endpoint.
* **Body:** `{ "status": "PICKING" }` // Valores: PENDING, PICKING, SHIPPED, DELIVERED, CANCELLED

#### `POST /api/orders/express` (Solo ADMIN)
Cargar pedido manual cuando no se quiere usar o buscar matriz de stock físico.
* **Body:** `{ "clientName": "Mostrador", "totalAmount": 15000, "observations": "2 remeras blancas M" }`

---

## 💰 6. Tesorería (Comprobantes)

#### `POST /api/payments` (Solo Client)
Reportar un pago por parte del cliente.
> [!WARNING]
> No es JSON. Tienes que mandar `multipart/form-data` para enviar el archivo adjunto.

**Campos FormData:**
* `amount`: (Number) ej. 150000
* `method`: (String) ej. "Transferencia Galicia"
* `reference`: (String) ej. "000123"
* `receipt`: (File) El explorador adjuntando archivo (JPG/PNG/PDF max 10MB)

#### `GET /api/payments` (Solo Admin)
Listado de pagos pendientes pidiendo aprobación en caja.

#### `POST /api/payments/:paymentId/approve` (Solo Admin)
Aprueba y descuenta la deuda en la cuenta corriente del cliente!
* **Body:** `{ "approvedAmount": 150000 }` // Si por error depositó menos, el admin puede forzar el monto aquí.

---

### Notas para Repositorio ✅
* El directorio incluye .gitignore asegurando `.env`, `.env.production` y carpeta `uploads/`.
* Nunca commitearemos el JWT Secret al git.

¡A codear el Front!
