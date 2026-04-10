---
config:
  layout: dagre
  look: neo
  theme: neo-dark
---
flowchart TB
    classDef pantalla fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    classDef decision fill:#431407,stroke:#fb923c,stroke-width:2px,shape:diamond,color:#f8fafc
    classDef accion fill:#064e3b,stroke:#4ade80,stroke-width:2px,color:#f8fafc
    classDef baseDatos fill:#334155,stroke:#94a3b8,stroke-width:2px,color:#f8fafc
    classDef alerta fill:#450a0a,stroke:#f87171,stroke-width:2px,color:#f8fafc
    classDef rol fill:#2e1065,stroke:#c084fc,stroke-width:3px,color:#f8fafc
    linkStyle default stroke:#64748b,stroke-width:2px

    subgraph Autenticacion [ ]
        direction TB
        Z_Inicio(["Landing Page / Portal B2B"]) --> Z_Login["Formulario de Login"]:::pantalla
        Z_Login --> Z_ValCred{"Credenciales Validas?"}:::decision
        Z_ValCred -- No --> Z_ErrorAuth["Acceso Denegado / Reintentar"]:::alerta
        Z_ValCred -- Si --> Z_Router{"Enrutador por Rol"}:::decision
    end

    subgraph Admin [ ]
        direction TB
        A_Dash["Panel de Control General / KPIs"]:::pantalla --> A_Menu{"Que Modulo Operar?"}:::decision
        A_Menu --> A_Kanban["Tablero Kanban Interactivo"]:::pantalla
        A_Kanban --> A_Pend["Columna: Nuevas/Pendientes"]:::pantalla
        A_Pend --> A_Eval["Abrir Detalle de Orden"]:::accion
        A_Eval --> A_PickStock{"Auditoria Fisica: Hay Stock?"}:::decision
        A_PickStock -- Faltante --> A_EditOrder["Editar Orden / Eliminar Items"]:::accion
        A_EditOrder --> A_NotifyMod["Notificar Cambio por EMAIL"]:::accion
        A_NotifyMod --> A_Armar
        A_PickStock -- Todo OK --> A_Armar["Armar Paquete / Picking"]:::accion
        A_Armar --> A_DragConf["Arrastrar a: Confirmada"]:::accion
        A_DragConf --> A_DragEnv["Arrastrar a: Enviada"]:::accion
        A_DragEnv --> DB_UpdateOrder[("DB: Actualizar Estado")]:::baseDatos
        DB_UpdateOrder --> A_NotifyEnv["Notificar Envio por EMAIL"]:::accion
        A_Menu --> A_Teso["Auditoria de Pagos y Saldos"]:::pantalla
        A_Teso --> A_ListPagos["Filtro: Pagos Pendientes"]:::pantalla
        A_ListPagos --> A_ViewPago["Ver Detalle de Pago"]:::accion
        A_ViewPago --> A_ValBank{"El monto impacto en Banco?"}:::decision
        A_ValBank -- No coincide --> A_Reject["Rechazar Pago"]:::accion
        A_Reject --> DB_Reject[("DB: Pago Rechazado")]:::baseDatos
        DB_Reject --> A_NotifyRej["Avisar Rechazo por EMAIL"]:::accion
        A_ValBank -- Acreditado --> A_Approve["Aprobar Pago"]:::accion
        A_Approve --> DB_Approve[("DB: Pago Aprobado")]:::baseDatos
        DB_Approve --> DB_Conciliar[("DB: Restar Monto del Saldo")]:::baseDatos
        A_Menu --> A_ABM["ABM Maestro de Productos"]:::pantalla
        A_ABM --> A_ConfigProd{"Gestion a realizar"}:::decision
        A_ConfigProd --> A_CrearProd["Definir Nombre, Categoria, Calidad"]:::accion
        A_CrearProd --> DB_MasterStock
        A_ConfigProd --> A_MatrizConfig["Crear Relacion: Talles y Colores"]:::accion
        A_MatrizConfig --> DB_MasterStock
        A_ConfigProd --> A_InyectStock["Ajuste Manual de Stock Fisico"]:::accion
        A_InyectStock --> DB_MasterStock[("DB: Actualizar Inventario")]:::baseDatos
    end

    subgraph Ventas [ ]
        direction TB
        V_Dash["Dashboard Vendedor: Metricas"]:::pantalla --> V_Cartera["Lista de Clientes Asignados"]:::pantalla
        V_Cartera --> V_SelClient["Seleccionar Cliente"]:::accion
        V_SelClient --> V_Accion{"Que hacer con el cliente?"}:::decision
        V_Accion -- Ver Estado --> V_ViewCtaCte["Revisar Cuenta Corriente"]:::pantalla
        V_Accion -- Tomar Pedido --> V_SetContext["Setear ID Cliente"]:::accion
        V_SetContext --> V_Cat["Seleccion en Matriz de Catalogo"]:::pantalla
        V_Cat --> V_Discount["Aplicar Descuento Manual"]:::accion
    end

    subgraph Cliente [ ]
        direction TB
        C_Dash["Dashboard Cliente: Resumen"]:::pantalla --> C_Menu{"Que accion desea realizar?"}:::decision
        C_Menu -- Editar Pedido --> C_CheckPago{"Ya reporto el pago?"}:::decision
        C_CheckPago -- Si --> C_LockEdit["Alerta: Edicion Bloqueada"]:::alerta
        C_CheckPago -- No --> C_Cat
        C_Menu -- Nuevo Pedido --> C_Cat["Catalogo: Filtros"]:::pantalla
        C_Cat --> C_Prod["Detalle de Producto Elegido"]:::pantalla
        C_Prod --> C_Matriz["Matriz de Carga Rapida"]:::pantalla
        C_Matriz --> C_Input["Ingreso de Cantidades por Celda"]:::accion
        C_Input --> C_CalcJS["Calculo JS Frontend en vivo"]:::accion
        C_CalcJS --> C_CheckMatriz{"Cantidades > 0?"}:::decision
        C_CheckMatriz -- No --> C_Matriz
        C_CheckMatriz -- Si --> C_PreCheck["Revisar Resumen del Pedido"]:::pantalla
        C_PreCheck --> C_Obs["Cargar Observaciones"]:::accion
        C_Obs --> C_SubmitOrder["Confirmar Pedido"]:::accion
        C_SubmitOrder --> API_ValStock{"API: Hay Stock Real en DB?"}:::decision
        API_ValStock -- Falta Stock --> C_ErrStock["Alerta: Stock modificado"]:::alerta
        C_ErrStock --> C_Matriz
        API_ValStock -- Stock OK --> DB_Order[("DB: Crear Orden Asignada")]:::baseDatos
        DB_Order --> DB_Restock[("DB: Descontar Stock Temporal")]:::baseDatos
        DB_Restock --> DB_Deuda[("DB: Sumar Monto a Deuda")]:::baseDatos
        DB_Deuda --> C_Success["Pantalla: Orden Generada"]:::pantalla
        C_Success --> C_EmailNotif["Accion: Enviar Confirmacion por EMAIL"]:::accion
        C_Menu -- Pagar / Ver Deuda --> C_CtaCte["Modulo Cuenta Corriente"]:::pantalla
        C_CtaCte --> C_OpcCta{"Accion a realizar?"}:::decision
        C_OpcCta -- Auditar --> C_DownPDF["Descargar Estado de Cuenta"]:::accion
        C_OpcCta -- Abonar --> C_FormPago["Formulario de Reporte de Pago"]:::pantalla
        C_FormPago --> C_DatosPago["Cargar Datos de Operacion"]:::accion
        C_DatosPago --> C_Upload["Adjuntar Comprobante"]:::accion
        C_Upload --> C_SubmitPago["Enviar Reporte de Pago"]:::accion
        C_SubmitPago --> C_LockOrder["Candado: Bloquear Edicion de Pedido"]:::accion
        C_LockOrder --> DB_Pago[("DB: Registrar Pago en Revision")]:::baseDatos
    end

    Z_Router -- Admin --> A_Dash
    Z_Router -- Vendedor --> V_Dash
    Z_Router -- Cliente --> C_Dash
    V_Discount -.-> C_PreCheck

 