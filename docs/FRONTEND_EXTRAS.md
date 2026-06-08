# Frontend Integration Guide — Extras / Servicios

Branch backend: `feature/kanban-v2`
Última actualización: 2026-06-08

Esta guía documenta **todo lo nuevo** para implementar el flujo de "extras" (servicios sobre prendas:
planchado, estampado, etc.) en el armado del pedido y su cotización en el Kanban.

> Toda la comunicación sigue siendo JSON sobre HTTP con `Authorization: Bearer <jwt>`. No hay cambios de auth.
> Prerrequisito: la migración `003_order_extras.sql` debe estar aplicada en el backend.

---

## 1. Contexto y flujo

El cliente arma un pedido en **2 pasos**:

1. **Paso 1 — Prendas:** elige productos, calidad, color, talle y cantidad (igual que hoy).
2. **Paso 2 — Extras:** sobre esas prendas, elige **servicios extra** de un catálogo (planchado,
   estampado, etc.). Puede aplicarlos:
   - **A una línea específica** (ej: "estampar 30 de las 50 hoodies") → se referencia por `itemIndex`.
   - **A todo el pedido** (extra global) → sin `itemIndex`.

El pedido entra en `IN_REVIEW`. Los extras quedan **"A cotizar"** (sin precio): hoy el sistema **no
calcula un estimado** (todavía no hay precios cargados). Luego, en el Kanban, **el admin (Héctor) pone
el precio final de cada extra**. Ahí el total del pedido y la deuda del cliente se ajustan, y recién
entonces se puede **aprobar**.

```
Cliente: arma prendas → elige extras (A cotizar) → POST /api/orders
        ↓
Pedido IN_REVIEW, extrasQuoteStatus = PENDING_QUOTE
        ↓
Admin: cotiza extras (precio final)  →  PUT /api/orders/:id/extras
        ↓
extrasQuoteStatus = QUOTED, total + deuda actualizados
        ↓
Admin: aprueba  →  PATCH /api/orders/:id/status { APPROVED }   ✅
```

> ⛔ **No se puede aprobar con extras sin cotizar.** Si hay algún extra `PENDING_QUOTE` y se intenta
> pasar a `APPROVED`, el backend responde **409** (ver §6).

---

## 2. Modelo de datos (TypeScript)

```ts
// Un servicio del catálogo (planchado, estampado, …)
type ExtraService = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  tiers: ExtraServiceTier[]   // tramos de precio por cantidad (hoy normalmente vacío)
}

// Tramo de precio por cantidad (a futuro; hoy puede no existir)
type ExtraServiceTier = {
  id: string
  minQty: number
  maxQty: number | null       // null = sin tope
  unitPrice: number
}

// Un extra concreto dentro de un pedido
type OrderExtra = {
  id: string
  orderItemId: string | null  // null = extra GLOBAL del pedido; si no, la línea a la que aplica
  serviceId: string | null    // null si el servicio fue borrado del catálogo (queda el nombre)
  serviceName: string         // snapshot: siempre presente aunque cambie el catálogo
  quantity: number
  notes: string | null
  estimatedUnitPrice: number | null   // hoy null ("A cotizar")
  estimatedSubtotal:  number | null
  finalUnitPrice: number | null       // lo carga el admin al cotizar
  finalSubtotal:  number | null
  status: 'PENDING_QUOTE' | 'QUOTED'
}

type ExtrasQuoteStatus = 'NONE' | 'PENDING_QUOTE' | 'QUOTED'
```

---

## 3. Catálogo de servicios — `/api/extras`

Lectura: cualquier usuario autenticado (el cliente lo necesita para el paso 2).
Escritura: **solo ADMIN**.

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/api/extras` | Todos | Lista servicios. CLIENT/SELLER ven **solo activos**; ADMIN ve todos los no borrados. |
| `GET` | `/api/extras/:id` | Todos | Detalle + tramos. |
| `POST` | `/api/extras` | ADMIN | Crea un servicio. |
| `PATCH` | `/api/extras/:id` | ADMIN | Edita `name` / `description` / `isActive`. |
| `PUT` | `/api/extras/:id/tiers` | ADMIN | Reemplaza la tabla de tramos de precio. |
| `DELETE` | `/api/extras/:id` | ADMIN | Soft delete (desactiva; no se borra físico). |

**`GET /api/extras`** → `200`
```json
[
  { "id": "uuid", "name": "Estampado", "description": "…", "isActive": true,
    "createdAt": "2026-06-08T12:00:00.000Z", "tiers": [] }
]
```

**`POST /api/extras`** (ADMIN)
```jsonc
// request
{ "name": "Estampado", "description": "Estampado de logo", "isActive": true,
  "tiers": [ { "minQty": 1, "maxQty": 49, "unitPrice": 10 },   // opcional
             { "minQty": 50, "maxQty": null, "unitPrice": 7 } ] }
// 201 → devuelve el ExtraService con sus tiers
```

**`PUT /api/extras/:id/tiers`** (ADMIN) — el body es **un arreglo**:
```json
[ { "minQty": 1, "maxQty": 49, "unitPrice": 10 },
  { "minQty": 50, "maxQty": null, "unitPrice": 7 } ]
```
> Los tramos son opcionales y hoy normalmente no se cargan. Mientras no haya tramos, el estimado de
> cualquier extra es `null` ("A cotizar"). Cuando se carguen, un tramo aplica si
> `minQty <= cantidad <= (maxQty || ∞)`.

---

## 4. Paso 2 del checkout — `POST /api/orders`

Se agrega **un campo nuevo y opcional**: `serviceExtras`. Todo lo demás del payload sigue igual.

```jsonc
{
  "clientId": "uuid",                  // si el caller es CLIENT se ignora (usa el suyo)
  "items": [
    { "variantId": "uuid-A", "quantity": 50 },   // index 0
    { "variantId": "uuid-B", "quantity": 10 }    // index 1
  ],
  "serviceExtras": [
    // Extra por línea: aplica a items[0] (las 50 hoodies), sobre 30 unidades
    { "serviceId": "uuid-estampado", "itemIndex": 0, "quantity": 30, "notes": "logo al frente" },
    // Extra global del pedido (sin itemIndex)
    { "serviceId": "uuid-planchado", "quantity": 1, "notes": "planchar todo el pedido" }
  ]
}
```

Reglas del campo `serviceExtras[]`:
- `serviceId` *(obligatorio)*: id de un servicio **activo** del catálogo.
- `itemIndex` *(opcional)*: índice dentro de `items[]`. Ausente/`null` ⇒ extra **global**.
  Debe estar en rango `0..items.length-1`.
- `quantity` *(opcional, default 1)*: entero > 0. Es la cantidad de prendas a las que se aplica el extra.
- `notes` *(opcional)*: texto libre (ej. ubicación del estampado).

**Respuesta `201`** (campos nuevos resaltados):
```jsonc
{
  "id": "uuid", "orderNumber": "00123", "status": "IN_REVIEW",
  "subtotal": 500000, "totalAmount": 500000,        // ← total = SOLO prendas (extras suman 0 hasta cotizar)
  "extrasQuoteStatus": "PENDING_QUOTE",             // ← nuevo
  "serviceExtras": [                                // ← nuevo
    { "id": "uuid", "orderItemId": "uuid", "serviceId": "uuid-estampado",
      "serviceName": "Estampado", "quantity": 30, "notes": "logo al frente",
      "estimatedUnitPrice": null, "estimatedSubtotal": null,
      "finalUnitPrice": null, "finalSubtotal": null, "status": "PENDING_QUOTE" },
    { "id": "uuid", "orderItemId": null, "serviceName": "Planchado", "quantity": 1, … }
  ],
  // … resto de campos como hoy
}
```

> El **admin** también puede mandar `serviceExtras` al crear pedidos manuales (mismo endpoint).

**Errores de validación (400):** `serviceExtras debe ser un arreglo`, `cada serviceExtra requiere
serviceId`, `serviceExtra ... itemIndex fuera de rango`, `quantity inválido`. Servicio inexistente
→ **404**; servicio inactivo → **422**.

---

## 5. Cotización en el Kanban — `/api/orders/:id/extras` (solo ADMIN)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/orders/:id/extras` | Lista los extras del pedido + estado. |
| `PUT` | `/api/orders/:id/extras` | **Cotización masiva** (flujo principal). |
| `PATCH` | `/api/orders/:id/extras/:extraId` | Cotiza/edita un extra puntual. |
| `POST` | `/api/orders/:id/extras` | Agrega un extra a un pedido existente. |
| `DELETE` | `/api/orders/:id/extras/:extraId` | Quita un extra. |

> Bloqueadas si el pedido está en estado no editable (`SHIPPED`, `DELIVERED`, `ARCHIVED`, `CANCELLED`)
> → **409**.

**`GET /api/orders/:id/extras`** → `200`
```json
{ "orderId": "uuid", "extrasQuoteStatus": "PENDING_QUOTE", "extrasServicesTotal": 0,
  "serviceExtras": [ /* OrderExtra[] */ ] }
```

**`PUT /api/orders/:id/extras`** — cotización masiva. Body = arreglo `{ id, finalUnitPrice }`:
```jsonc
// request
[ { "id": "extra-uuid-1", "finalUnitPrice": 100 },
  { "id": "extra-uuid-2", "finalUnitPrice": 50 } ]
// 200
{ "orderId": "uuid", "extrasQuoteStatus": "QUOTED",
  "extrasServicesTotal": 3050, "totalAmount": 503050,
  "serviceExtras": [ /* actualizados, status QUOTED, finalSubtotal calculado */ ] }
```
> `finalSubtotal = finalUnitPrice × quantity` lo calcula el backend. Al cotizar se **recalcula el
> total** del pedido y se **ajusta la deuda** del cliente automáticamente.

**`PATCH /api/orders/:id/extras/:extraId`** — cotizar/editar uno:
```jsonc
{ "finalUnitPrice": 120 }          // setea precio final → status QUOTED
// también acepta: "quantity": 25, "notes": "…", o "finalUnitPrice": null (descotizar → PENDING_QUOTE)
// 200 → el OrderExtra actualizado
```

**`POST /api/orders/:id/extras`** — agregar a un pedido existente:
```jsonc
{ "serviceId": "uuid", "itemId": "order-item-uuid" /* o null = global */,
  "quantity": 10, "notes": "…", "finalUnitPrice": 80 /* opcional: si va, queda QUOTED */ }
// 201 → el OrderExtra creado
```
> Ojo: acá se usa `itemId` (el id real de `order_items`), no `itemIndex`.

**`DELETE /api/orders/:id/extras/:extraId`** → `200 { "success": true }`

---

## 6. Guard de aprobación

`PATCH /api/orders/:id/status { "status": "APPROVED" }` con extras sin cotizar:
```json
// 409
{ "error": "Hay extras sin cotizar. Cotizá los extras antes de aprobar el pedido." }
```
**UI:** si `order.extrasQuoteStatus === 'PENDING_QUOTE'`, deshabilitar el botón "Aprobar" y mostrar
un aviso "Cotizá los extras primero".

---

## 7. Campos nuevos en `Order` (listado y detalle)

`GET /api/orders` y `GET /api/orders/:id` ahora incluyen, además de lo previo:

```ts
type Order = {
  // … campos previos (incluye el legacy `extras: {label,amount}[]`, que NO cambia)
  extrasQuoteStatus: 'NONE' | 'PENDING_QUOTE' | 'QUOTED'
  extrasServicesTotal: number          // Σ de los finalSubtotal cotizados
  serviceExtras: OrderExtra[]          // [] si el pedido no tiene extras
}
```

> ⚠️ No confundir:
> - `extras` (legacy) = ajustes manuales `{ label, amount }` que carga el admin en el Kanban. **Sin cambios.**
> - `serviceExtras` (nuevo) = los servicios del catálogo de esta feature.

---

## 8. Recomendaciones de UI

**Paso 2 (cliente):**
- Traer el catálogo con `GET /api/extras` (solo activos).
- Por cada prenda del carrito, permitir tildar servicios (estilo McDonald's) con cantidad y notas → se mapea a `serviceExtras[].itemIndex`.
- Permitir extras "para todo el pedido" → `serviceExtras` sin `itemIndex`.
- Mostrar el precio como **"A cotizar"** (porque `estimatedUnitPrice` es `null`). Aclarar: "El costo de los extras lo confirma el equipo y se suma al total final".

**Kanban (admin):**
- En el detalle del pedido, sección "Extras / Servicios" con la lista de `serviceExtras`.
- Inputs de `finalUnitPrice` por fila → botón "Guardar cotización" que manda `PUT /api/orders/:id/extras` con todos los `{id, finalUnitPrice}`.
- Badge de estado por `extrasQuoteStatus`: gris `NONE`, amarillo `PENDING_QUOTE`, verde `QUOTED`.
- Botón "Aprobar" deshabilitado mientras sea `PENDING_QUOTE`.

---

## 9. Resumen de endpoints

```
# Catálogo
GET    /api/extras                      (todos)   lista servicios activos/visibles
GET    /api/extras/:id                  (todos)   detalle + tramos
POST   /api/extras                      (ADMIN)   crear servicio
PATCH  /api/extras/:id                  (ADMIN)   editar servicio
PUT    /api/extras/:id/tiers            (ADMIN)   reemplazar tramos
DELETE /api/extras/:id                  (ADMIN)   soft delete

# Pedido
POST   /api/orders                      (CLIENT/SELLER/ADMIN)  + campo serviceExtras[]
GET    /api/orders                      (todos)   + extrasQuoteStatus, extrasServicesTotal, serviceExtras
GET    /api/orders/:id                  (todos)   idem detalle

# Cotización (ADMIN)
GET    /api/orders/:id/extras
POST   /api/orders/:id/extras
PUT    /api/orders/:id/extras           (cotización masiva)
PATCH  /api/orders/:id/extras/:extraId
DELETE /api/orders/:id/extras/:extraId
```
