# Análisis y Auditoría del Estado Frontend-Backend

Este documento recopila la auditoría componente por componente del sistema actual. Como se descubrió en la última revisión, aún existen varias lógicas, flujos o modales que se encuentran incompletos o en formato *dummy/alert*. Este documento sirve como "Backlog" u hoja de ruta definitiva para finalizar el desarrollo de la Interfaz antes/durante la integración de los endpoints reales. 

---

## 1. Problemas de Lógica, Rutas y Accesos

### 1.1 Catálogo Genérico para Vendedores (Violación de Regla de Negocio)
* **Archivo(s) Implicado(s):** `src/components/layout/Sidebar.tsx`, `src/App.tsx`
* **Problema:** Actualmente existe un botón en la Sidebar llamado "Catálogo Vendedores" (`/ventas/catalogo`). Esto permite al vendedor ingresar al catálogo sin un cliente objetivo definido. 
* **Solución Esperada:** Eliminar esta ruta genérica de la Sidebar. El vendedor **sólo** debe poder acceder al catálogo cuando se encuentra en "Mi Cartera de Clientes" y selecciona un cliente específico para tomarle un pedido (iniciando el `useOrderDraftStore`).

---

## 2. Formularios de Creación (CRUD Faltantes)

### 2.1 Alta de Nuevo Cliente
* **Archivo(s) Implicado(s):** `src/App.tsx`, (Posiblemente `ClientList.tsx`)
* **Problema:** El botón "+ Nuevo Cliente" en el layout o vistas de gestión actualmente tiene un `onClick: () => alert('Nuevo Cliente')`. No existe interfaz para crearlo.
* **Solución Esperada:** Crear el componente `NewClientModal.tsx` o `NewClientPage.tsx` que agrupe los campos necesarios (Razón Social, CUIT, Email, Teléfono) y envíe un POST al backend, además de actualizar el listado visual en tiempo real.

### 2.2 Alta de Nuevo Producto (Admin)
* **Archivo(s) Implicado(s):** `src/features/admin/pages/CatalogManagementPage.tsx`
* **Problema:** Si bien se pueden editar, borrar o ajustar el stock de productos existentes, **no existe botón ni interfaz general** para crear un producto desde cero (Ej. "+ Nuevo Producto").
* **Solución Esperada:** Agregar el botón correspondiente en la Action Bar y crear el `CreateProductModal` o formulario que pida Imagen, SKU, Nombre, Precio, etc., antes de acceder a la matriz 3D.

### 2.3 Creación de Pedido Manual (Admin Board)
* **Archivo(s) Implicado(s):** `src/features/admin/pages/OrdersBoardPage.tsx`
* **Problema:** En el tablero Kanban (`OrdersBoardPage`), existe un botón superior `<button><Plus /> Nuevo Pedido</button>` estático y totalmente decorativo.
* **Solución Esperada:** Asignar una acción (ej. un modal sencillo o redirigir a un flujo que le permita al administrador crear/imputar un pedido de forma exprés o telefónica).

---

## 3. Acciones Secundarias y Menús Incompletos

### 3.1 Dropdowns Administrativos de Clientes
* **Archivo(s) Implicado(s):** `src/components/shared/ClientList.tsx`
* **Problema:** Dentro de las acciones (3 puntitos) en la tabla del Directorio de Clientes y Cartera de Vendedores, las opciones **"Ver Cuenta Corriente"** y **"Editar Datos"** son etiquetas huérfanas sin evento (`onClick`) asignado. 
* **Solución Esperada:** 
  1. Conectar "Ver CC" a una vista del historial contable de dicho cliente desde la óptica del administrador.
  2. Conectar "Editar Datos" a un `EditClientModal`.

### 3.2 Filtros Visuales sin Funcionalidad (Catálogo y Clientes)
* **Archivo(s) Implicado(s):** `CatalogManagementPage.tsx`, `ClientList.tsx`
* **Problema:** Existen botones decorativos en la parte superior como `Categoría`, `Estado`, o `Más filtros` que solo son de tipo `<Button>` pero no despliegan ningún menú ni filtran información real.
* **Solución Esperada:** Sustituir los botones huecos por componentes de `<DropdownMenu>` / `<Select>` funcionales que interactúen con el estado de `searchQuery` de su respectiva tabla.

---

## 4. Próxima Etapa: Integración Axios Total

Se han incorporado `.env` y el archivo `lib/apiClient.ts` que captura fallos de concurrencia y maneja el token JWT. El paso crucial que falta para dar vida al sistema es reemplazar todos los `setTimeout` y estados mutables (como `MOCK_PRODUCTS` o `MOCK_CLIENTS`) por peticiones asincrónicas (Ej: `apiClient.get('/catalog')`).

**Estrategia a futuro (TBD):**
Será conveniente agregar `React Query` (@tanstack/react-query) o valerse estrictamente de hooks nativos (`useEffect`/`Axios`) con el Zustand global para evitar parpadeos y re-peticionar los datos correctamente una vez la API esté online.
