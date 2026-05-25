# Frontend Integration Guide — Kanban v2

Branch backend: `feature/kanban-v2`
Última actualización: 2026-05-25

Esta guía documenta **todo lo que cambia o se agrega** en la API para implementar el nuevo flujo de Kanban, edición/cancelación de pedidos, cotización avanzada, archivado automático y vista logística.

> Toda la comunicación sigue siendo JSON sobre HTTP con `Authorization: Bearer <jwt>`. No hay cambios de auth.

---

## 1. Estados del Pedido

### 1.1 Lista canónica
| Status            | Columna Kanban         | Editable? | Notas |
|-------------------|------------------------|-----------|-------|
| `IN_REVIEW`       | En Revisión            | ✅        | Estado inicial. Sólo ADMIN puede aprobar y mover. |
| `APPROVED`        | Aprobados              | ✅        | Validado por admin. |
| `IN_PREPARATION`  | En Preparación         | ✅        | **Dispara email al cliente** automáticamente. |
| `SHIPPED`         | Despachados            | ❌        | Mostrar agrupado por `dispatchType`. |
| `DELIVERED`       | Entregados             | ❌        | En el board mostrar **sólo los últimos 7 días**. Filtrar con `?status=DELIVERED&deliveredWithinDays=7`. |
| `ARCHIVED`        | Archivados             | ❌        | Auto-mueve a esta columna 7d después de `delivered_at`. Vista secundaria. |
| `CANCELLED`       | (Fuera del board)      | ❌        | Histórico administrativo. |

> "Editable?" = se pueden modificar items, extras, descuento o impuesto. La columna `IN_REVIEW` es la única donde NO-admin debería ver controles de validación (botón "Aprobar"); el resto de las columnas son drag-only para admin.

### 1.2 Matriz de transiciones permitidas
```
IN_REVIEW      → APPROVED, CANCELLED*
APPROVED       → IN_PREPARATION, IN_REVIEW, CANCELLED*
IN_PREPARATION → SHIPPED, APPROVED, CANCELLED*
SHIPPED        → DELIVERED, IN_PREPARATION
DELIVERED      → ARCHIVED, SHIPPED
ARCHIVED       → DELIVERED
CANCELLED      → (terminal)
```
\* **CANCELLED no se pone vía PATCH /status.** Usar `POST /api/orders/:id/cancel` (ver §4).

Cualquier transición fuera de la matriz devuelve **409** con `{ error, allowed: [...] }`. Mostrar al usuario los estados permitidos.

### 1.3 Reglas de UI (resumen)
- Sólo `role === 'ADMIN'` ve drag handles y el botón "Aprobar pedido".
- Si la orden tiene `isLockedByPayment: true`, ocultar acciones destructivas (cancelar, editar items).
- Mostrar badge de color por `paymentStatus`: verde `PAID`, amarillo `PARTIAL`, rojo `PENDING`.
- Mostrar badge de `dispatchType` en cards de la columna `SHIPPED`.

---

## 2. Nuevos campos en `Order`

Adicionales sobre el shape previo:

```ts
type Order = {
  // ... campos previos
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING'   // default 'PENDING'
  dispatchType:  'PUNTO_PILAR' | 'CORREO' | 'ENCOMIENDA' | 'MOTOMENSAJERIA' | null
  deliveryDeadline: string | null                  // ISO date (YYYY-MM-DD)
  deliveredAt:      string | null                  // ISO datetime; se setea al pasar a DELIVERED
  cancelledAt:      string | null
  cancellationReason: string | null
  // Pricing avanzado
  taxRate:     number                              // ej. 21 = 21%
  taxAmount:   number
  extrasTotal: number
  extras: Array<{ label: string, amount: number }> // ej. [{label:'Planchado', amount:500}]
}
```

Todos los `Decimal` vienen serializados como `number` (parsed con `parseFloat` en backend).

---

## 3. Endpoints

### 3.1 `POST /api/orders` — crear orden

**Roles:** `CLIENT`, `SELLER`, `ADMIN`

**Payload nuevo:**
```json
{
  "clientId": "uuid",                  // requerido para SELLER/ADMIN; el backend lo ignora para CLIENT
  "items": [{ "variantId": "uuid", "quantity": 2 }],
  "discountPercentage": 10,
  "taxRate": 21,
  "extras": [
    { "label": "Planchado", "amount": 500 },
    { "label": "Envío",     "amount": 1000 }
  ],
  "deliveryDeadline": "2026-12-31",
  "dispatchType": "CORREO",
  "shippingAddress": "...",
  "observations": "..."
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "orderNumber": "00042",
  "clientId": "uuid",
  "subtotal": 2500,
  "extrasTotal": 1500,
  "discountPercentage": 10,
  "discountAmount": 400,
  "taxRate": 21,
  "taxAmount": 756,
  "totalAmount": 4356,
  "status": "IN_REVIEW",
  "deliveryDeadline": "2026-12-31",
  "dispatchType": "CORREO",
  "extras": [...],
  "newClientDebt": 12500,
  "createdAt": "2026-05-25T20:00:00Z"
}
```

**Validaciones de error (todas 400):**
- `extras debe ser un arreglo`
- `cada extra debe tener label no vacío`
- `extra "<label>" tiene amount inválido`
- `dispatchType inválido. Debe ser uno de: PUNTO_PILAR, CORREO, ENCOMIENDA, MOTOMENSAJERIA`

**409 Conflict:** stock insuficiente. Body trae `detail` con info de la variante.

### 3.2 `GET /api/orders` — listar con filtros nuevos

Query params soportados:

| Param                  | Tipo          | Notas |
|------------------------|---------------|-------|
| `status`               | enum          | Filtra por status |
| `minMonto`             | number        | total_amount ≥ |
| `dispatchType`         | enum          | Para vista logística agrupada |
| `paymentStatus`        | enum          | PAID/PARTIAL/PENDING |
| `deliveredWithinDays`  | int           | Limita la columna DELIVERED a los últimos N días. **Recomendado: 7.** |

Ejemplo para el tablero principal:
```
GET /api/orders?deliveredWithinDays=7
```
Devuelve todas las órdenes excepto las ARCHIVED (que se piden aparte).

Para la "vista archivados":
```
GET /api/orders?status=ARCHIVED
```

Para la columna `SHIPPED` agrupada:
```
GET /api/orders?status=SHIPPED
```
Y en el frontend, agrupar por `dispatchType` (`PUNTO_PILAR | CORREO | ENCOMIENDA | MOTOMENSAJERIA`). Usar un `<Accordion>` por grupo con contador.

### 3.3 `GET /api/orders/:id` — detalle

Sin cambios estructurales — devuelve los nuevos campos anidados (`paymentStatus`, `dispatchType`, `extras`, `extrasTotal`, `taxRate`, `taxAmount`, `deliveryDeadline`, `cancellationReason`, etc.).

### 3.4 `PATCH /api/orders/:orderId/status` — mover en el Kanban (drag & drop)

**Roles:** `ADMIN`

```http
PATCH /api/orders/abc-123/status
{ "status": "APPROVED" }
```

**Respuestas:**
- `200` — cambio aceptado. Devuelve `{ id, status, delivered_at, client_id }`.
- `409` — transición inválida. Body: `{ error, allowed: [...] }`. Mostrar al usuario los estados permitidos.
- `400` — si `status === 'CANCELLED'`. Usar `POST /api/orders/:id/cancel` en su lugar.
- `404` — orden inexistente.

**Side-effects automáticos del backend:**
- `IN_PREPARATION` → envía email "En Preparación" al cliente.
- `DELIVERED`      → setea `delivered_at = NOW()` si no estaba seteado.
- Volver desde `DELIVERED` a `SHIPPED` (corrección) limpia `delivered_at`.

### 3.5 `PATCH /api/orders/:id` — editar metadatos / extras / totales (NUEVO)

**Roles:** `ADMIN`

Permite editar campos sueltos. Cualquier subset es válido (no enviar todo el payload):

```http
PATCH /api/orders/abc-123
{
  "observations": "Nueva nota",
  "deliveryDeadline": "2026-12-15",
  "dispatchType": "MOTOMENSAJERIA",
  "paymentStatus": "PARTIAL",
  "shippingAddress": "Av. ABC 123",
  "extras": [{ "label": "Servicio especial", "amount": 5000 }],
  "taxRate": 10.5,
  "discountPercentage": 5
}
```

**Reglas:**
- Si la orden está en `SHIPPED`, `DELIVERED`, `ARCHIVED` o `CANCELLED` **no** se pueden modificar `extras`, `taxRate` ni `discountPercentage`. Devuelve **409**.
- Sí se pueden modificar `paymentStatus`, `dispatchType`, `deliveryDeadline`, `observations`, `shippingAddress` en cualquier estado (ojo: el modal de frontend debe distinguir).
- Si cambian extras/tax/discount, el backend **recalcula `subtotal`, `taxAmount`, `extrasTotal`, `totalAmount`** con la misma fórmula que `POST /orders` (§5) y **ajusta el ledger del cliente** con un asiento `DEBT_INCREASE` o `DEBT_DECREASE` por la diferencia. La deuda del cliente se actualiza automáticamente.

**Respuesta 200:** la fila completa de `orders` actualizada (snake_case directo de DB; el frontend ya parsea esto).

### 3.6 `PUT /api/orders/:id/items` — reemplazar items (NUEVO)

**Roles:** `ADMIN`

Reemplaza completamente el conjunto de items de una orden. Útil para "agregar/quitar artículos" desde el modal.

```http
PUT /api/orders/abc-123/items
{
  "items": [
    { "variantId": "v1", "quantity": 3 },
    { "variantId": "v2", "quantity": 1 }
  ]
}
```

**Comportamiento:**
1. Libera el `reserved_stock` de los items previos.
2. Reserva el `reserved_stock` de los nuevos items (con bloqueo `FOR UPDATE`).
3. Si algún item no tiene stock → **409** y rollback total.
4. Recalcula totales usando los `extras`, `taxRate`, `discountPercentage` existentes en la orden.
5. Inserta asiento de ajuste en `account_ledger` por la diferencia (`delta`).

**Respuesta 200:**
```json
{
  "id": "abc-123",
  "itemCount": 2,
  "subtotal": 8500,
  "taxAmount": 1785,
  "extrasTotal": 0,
  "totalAmount": 10285,
  "delta": 1500
}
```

**No editable si:** status ∈ `SHIPPED / DELIVERED / ARCHIVED / CANCELLED` (409).

### 3.7 `POST /api/orders/:id/cancel` — cancelar (NUEVO)

**Roles:** `ADMIN`

```http
POST /api/orders/abc-123/cancel
{ "reason": "Cliente pidió cancelar" }
```

**Comportamiento:**
1. Libera reserved_stock de todos los items.
2. Crea asiento `DEBT_DECREASE` por el `total_amount`.
3. Recalcula `current_debt` del cliente.
4. Setea `status='CANCELLED'`, `cancelled_at=NOW()`, `cancellation_reason=<reason>`.

**Errores:**
- `400` — sin `reason`.
- `409` — ya está cancelada / en `DELIVERED` o `ARCHIVED`.
- `404` — no existe.

**Frontend:** mostrar `<ConfirmDialog>` con campo de texto obligatorio para el motivo antes de llamar.

### 3.8 `POST /api/orders/express` — pedido exprés
Sin cambios.

### 3.9 `GET /api/orders/:id/pdf` — remito
Sin cambios.

---

## 4. Fórmula de cotización (alineada con `pricingService.js`)

```
subtotal       = Σ(item.qty × item.unitPrice)
extrasTotal    = Σ(extras[i].amount)
baseConExtras  = subtotal + extrasTotal
descuento      = baseConExtras × (discountPercentage / 100)
baseImponible  = baseConExtras − descuento
impuesto       = baseImponible × (taxRate / 100)
totalAmount    = baseImponible + impuesto
```

**Reglas:**
- El descuento se aplica **antes** del impuesto (norma fiscal AR: IVA sobre base neta).
- `discountPercentage` se clamp-ea a `[0, 100]`.
- `taxRate` admite cualquier número ≥ 0 (ej. `21`, `10.5`, valores personalizados).
- Todos los montos se redondean a 2 decimales.

**El frontend debe replicar esta fórmula** en su componente de carrito para previsualizar el total antes de hacer `POST`. Hay una validación en backend que rechaza extras inválidos.

---

## 5. Vista logística — UI hints

Para la columna `SHIPPED`:

```ts
// 1. fetch
const { data: shipped } = await api.get('/orders?status=SHIPPED');

// 2. agrupar
const groups = groupBy(shipped, 'dispatchType');
// { PUNTO_PILAR: [...], CORREO: [...], ENCOMIENDA: [...], MOTOMENSAJERIA: [...], null: [...] }

// 3. renderizar como Accordion
Object.entries(groups).map(([type, orders]) => (
  <AccordionItem
    title={DISPATCH_LABELS[type] || 'Sin asignar'}
    counter={orders.length}
  >
    {orders.map(o => <OrderCard order={o} />)}
  </AccordionItem>
));

const DISPATCH_LABELS = {
  PUNTO_PILAR: 'Punto Pilar',
  CORREO: 'Correo',
  ENCOMIENDA: 'Encomienda',
  MOTOMENSAJERIA: 'Motomensajería',
};
```

---

## 6. Archivado automático

- **Backend:** un scheduler in-process (`src/db/archive-delivered-orders.js`) corre cada hora y archiva órdenes con `status='DELIVERED' AND delivered_at < NOW() - INTERVAL '7 days'`.
- Se puede desactivar con `DISABLE_SCHEDULERS=true` en `.env` (útil para testing).
- Se puede correr manualmente: `node src/db/archive-delivered-orders.js`.

**Frontend:**
- En la columna `DELIVERED` mostrar sólo entregas recientes: `GET /api/orders?status=DELIVERED&deliveredWithinDays=7`.
- Pie de la columna: botón **"Ver historial de archivados"** que abre vista secundaria con `GET /api/orders?status=ARCHIVED`.
- En la vista de archivados, la card debe ser de **sólo lectura** (sin drag).

---

## 7. Resumen de cambios desde el frontend (checklist)

- [ ] Renombrar columna "Pendiente" → "En Revisión", reubicar antes de "Aprobados".
- [ ] Agregar columna "En Preparación" entre "Aprobados" y "Despachados".
- [ ] Validar transiciones del lado del cliente (matriz §1.2). Si falla, mostrar 409 al usuario.
- [ ] Ocultar drag-handle y botón "Aprobar" si `role !== 'ADMIN'`.
- [ ] Mostrar `deliveryDeadline` en cada card (con color rojo si < 3 días).
- [ ] Mostrar badge de `paymentStatus`.
- [ ] Formulario de creación/edición: campos para extras (lista dinámica), tax rate (select 21% / 10.5% / manual), discount.
- [ ] Recalcular total en el cliente con la fórmula §4 antes de enviar.
- [ ] Botón "Cancelar pedido" → diálogo con campo `reason` obligatorio → `POST /orders/:id/cancel`.
- [ ] Botón "Editar pedido" → modal con secciones: items (PUT /items), extras + tax + descuento (PATCH), metadata (PATCH).
- [ ] Columna "Despachados" agrupada por `dispatchType` en accordion con contador.
- [ ] Columna "Entregados" filtrada a 7 días + link a archivados.
- [ ] Manejo de errores 409 (transición inválida + stock insuficiente) con mensajes claros.

---

## 8. Tests del backend disponibles

```bash
node src/tests/test-pricing.js     # unit tests del servicio de pricing
node src/tests/test-kanban-v2.js   # integration tests E2E (requiere server arriba)
```

El primero corre sin DB. El segundo requiere `BASE_URL=http://localhost:3000` (default) y un admin existente. Si no es `admin@hector.com / Admin1234!`, pasar `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` por env.

---

## 9. Notas operacionales para producción

1. **Migración DB:** `node src/db/migrate-kanban-v2.js`. Es idempotente.
2. **Backfill automático:**
   - `status='PENDING'` legacy → `IN_REVIEW`.
   - `status='PICKING'` legacy → `IN_PREPARATION`.
   - `delivered_at = created_at` para órdenes ya en `DELIVERED`. ⚠ **Esto puede archivar órdenes históricas en la primera ejecución del scheduler** (si tienen >7 días desde su creación). Si esto no es deseado, antes de aplicar la migración correr manualmente:
     ```sql
     UPDATE orders SET delivered_at = NOW() WHERE status='DELIVERED';
     ```
3. **Scheduler:** el archivado corre dentro del proceso de Express. Si se escala a múltiples instancias, mover a un único worker o usar `pg_cron` para evitar carreras (la `UPDATE` es idempotente, pero los logs van a duplicarse).
4. **Email:** se sigue usando `smtp.hostinger.com` con la cuenta `ventas@portalmayoristatsf.com`.
