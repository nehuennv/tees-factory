# Diseño y UI/UX

Este documento define las reglas visuales, componentes y patrones de interacción de la plataforma Vantra B2B. El objetivo es mantener una estética **sobria, minimalista y altamente optimizada** para operaciones de carga masiva de datos, reduciendo la fatiga visual del usuario.

## 1. TIPOGRAFÍA Y JERARQUÍA

La fuente principal y única del proyecto es **Plus Jakarta Sans**. Fue elegida por su legibilidad excepcional en tablas de datos y su aspecto geométrico, moderno y corporativo.

- **Fuente Principal:** `font-sans` configurada como *Plus Jakarta Sans*.
- **Pesos utilizados:** * `Regular (400)`: Para cuerpo de texto y datos de tablas.
    - `Medium (500)`: Para etiquetas de inputs y headers de tablas.
    - `Semibold (600)`: Para botones y subtítulos.
    - `Bold (700)`: Para valores numéricos críticos (Precios, Totales) y Títulos de página (H1).

## 2. PALETA DE COLORES (Color Tokens)

El sistema utiliza una paleta monocromática estricta para la estructura, reservando los colores semánticos únicamente para estados de éxito, alerta o error.

**Fondos y Superficies:**

- **Background Base:** `bg-zinc-50` (o `#fafafa`). Un gris ultra claro para el fondo general de la aplicación, permite que las tarjetas blancas resalten.
- **Superficies (Cards/Modales):** `bg-white` (`#ffffff`).
- **Bordes y Separadores:** `border-zinc-200` (`#e4e4e7`). Un gris muy sutil para delimitar áreas sin ensuciar la vista.

**Texto y Tinta:**

- **Texto Principal:** `text-zinc-900` (`#18181b`). Casi negro para máxima legibilidad.
- **Texto Secundario (Mutado):** `text-zinc-500` (`#71717a`). Para SKUs, placeholders y textos descriptivos menores.

**Colores Semánticos (Estados):**

- **Acción Principal (Primary):** `bg-zinc-900` (Negro) con texto blanco.
- **Éxito / Aprobado:** Tonos esmeralda/verdes. Ej: Botón Aprobar Pago (`bg-emerald-600`), Pills de stock alto (`bg-green-100 text-green-800`).
- **Advertencia / Pendiente:** Tonos ámbar/naranjas. Ej: Alerta de verificación (`bg-amber-50 border-amber-200 text-amber-800`), Kanban "Armando Caja".
- **Error / Deuda:** Tonos rojos. Ej: Saldo deudor (`text-red-500`).

## 3. GEOMETRÍA, ESPACIADOS Y SOMBRAS

El diseño no es "redondeado en exceso", sino que busca una estructura sólida e institucional.

- **Border Radius:** * Componentes pequeños (Inputs, Botones, Pills): `rounded-lg` (8px).
    - Contenedores grandes (Cards, Modales, Sidebar): `rounded-xl` (12px).
    - *Prohibido el uso de botones completamente redondos (pill-shape) excepto para avatares de usuario.*
- **Sombras (Elevation):** Muy contenidas. Solo se usa `shadow-sm` en las tarjetas blancas sobre el fondo `zinc-50` para separarlas sutilmente. Modales y Drawers usan `shadow-xl`.

## 4. ESTADOS DE INTERACCIÓN Y CARGA (UX)

### 4.1. Skeletons (Pantallas de Carga)

En un sistema B2B no se usan "spinners" (rueditas girando) para la carga de páginas completas, ya que generan ansiedad. Se implementa el patrón de **Skeleton Loading** (Shimmer effect).

- **Comportamiento:** Al entrar al Catálogo o la Matriz, mientras la API trae el JSON, se dibuja la estructura de la tabla en color `bg-zinc-200` con la clase `animate-pulse` de Tailwind.
- **Transición:** Una vez que la data llega, el skeleton se desvanece suavemente (`transition-opacity duration-300`) dando lugar al contenido real.

### 4.2. Estados Vacíos (Empty States)

Si un tablero Kanban no tiene órdenes o un cliente no tiene facturas, NUNCA se deja la pantalla en blanco. Se utiliza un componente centralizado con un ícono gris (Lucide React), un texto breve (Ej: "No hay pagos pendientes de revisión") y, de ser posible, un botón de acción primaria (Ej: "Ir al catálogo").

### 4.3. Feedback Inmediato (Toasts y Botones)

- **Botones en proceso:** Al hacer click en "Añadir al Pedido" o "Enviar Revisión", el botón cambia su texto a "Procesando..." o muestra un pequeño loader interno, y se bloquea (`disabled:opacity-50`) para evitar doble-clicks (race conditions).
- **Toasts:** Notificaciones emergentes efímeras en la esquina inferior derecha para confirmar acciones no disruptivas (Ej: "Stock guardado correctamente").

---

## 5. INVENTARIO DE PANTALLAS Y COMPONENTES (Screens)

A continuación, se documentan las pantallas core del sistema con sus respectivos diseños de referencia para el equipo de desarrollo.

### 5.1. Matriz de Pedidos (Checkout B2B)

Vista principal de compra para el cliente. Destaca por su tabla limpia sin bordes verticales, permitiendo escanear la grilla tridimensional de Talle x Color rápidamente. La barra de totales inferior es flotante (`sticky bottom-0`) para estar siempre visible aunque la matriz sea muy larga.

![1.png](Dise%C3%B1o%20y%20UI%20UX/1.png)

### 5.2. Reporte de Pago Manual (Drawer Lateral)

Componente tipo *Slide-over* (Drawer) que se despliega desde la derecha sobre un fondo oscurecido (`backdrop-blur-sm bg-black/20`). Utiliza inputs con altura generosa (`h-11`) y un área de Dropzone para arrastrar el comprobante con bordes punteados (`border-dashed`).

![2.png](Dise%C3%B1o%20y%20UI%20UX/2.png)

### 5.3. Gestión de Inventario (ABM)

Uso de sistema de pestañas (Tabs) con indicador inferior negro (`border-b-2 border-zinc-900`) para el estado activo. Las filas de la tabla son expandibles (Accordion) revelando las variantes anidadas (Talles) de cada producto para una edición de stock rápida.

![3.png](Dise%C3%B1o%20y%20UI%20UX/3.png)

### 5.4. Tablero de Preparación (Kanban Logístico)

Estructura de columnas (Flexbox/Grid). Las tarjetas (Cards) de cada orden son arrastrables. Utilizan *Pills* (etiquetas) pequeñas y coloridas para identificar rápidamente la cantidad de artículos y el estado logístico del pedido.

![4.png](Dise%C3%B1o%20y%20UI%20UX/4.png)

### 5.5. Verificación de Comprobante (Tesorería)

Pantalla de vista dividida (Split-pane). A la izquierda, un panel de resumen con jerarquía tipográfica muy marcada (Monto en tamaño masivo) y alertas amarillas de contexto. A la derecha, un visor de documentos simulando el comprobante en un entorno oscuro para maximizar el contraste.

![5.png](Dise%C3%B1o%20y%20UI%20UX/5.png)