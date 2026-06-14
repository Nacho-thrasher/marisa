# Diagramas Visuales - Arquitectura del Sistema

## 1. ARQUITECTURA GENERAL DEL SISTEMA

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            CLIENTE (NAVEGADOR)                             │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND - Angular 20+                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ Inv.    │  │Prod.    │  │ Ventas  │  │ RRHH/Nómina    │  │   │
│  │  │ Insumos │  │Órdenes  │  │Remitos  │  │ Empleados      │  │   │
│  │  │ Stock   │  │Consumo  │  │Margen   │  │ Salarios       │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  │ Nómina         │  │   │
│  │                                            └──────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Auditoría      │ Reportes      │ Configuración          │   │   │
│  │  │ Logs cambios   │ PDF/Excel     │ Usuarios/Permisos      │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTPS/TLS
                         (API REST - JSON)
┌────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND - API REST                                   │
│                    (Node.js Express o Python FastAPI)                      │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      MIDDLEWARE LAYER                               │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌────────────────────────┐ │  │
│  │  │ Autenticación  │  │ Autorización │  │ Validación de Datos    │ │  │
│  │  │ JWT Tokens     │  │ RBAC (Roles) │  │ Error Handling         │ │  │
│  │  └────────────────┘  └──────────────┘  └────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLERS / ROUTERS                            │  │
│  │                                                                     │  │
│  │  /api/v1/                                                           │  │
│  │  ├─ auth/         (login, logout, refresh token)                   │  │
│  │  ├─ insumos/      (GET, POST, PATCH, ingreso, egreso)             │  │
│  │  ├─ productos/    (GET, catálogo, recetas)                        │  │
│  │  ├─ produccion/   (órdenes, consumo)                              │  │
│  │  ├─ ventas/       (crear, listar, descargar remito)               │  │
│  │  ├─ empleados/    (CRUD, estructura salarial)                     │  │
│  │  ├─ nomina/       (procesar, recibos, reportes)                   │  │
│  │  ├─ aportes/      (configuración AFIP, sindicatos)                │  │
│  │  ├─ auditoria/    (logs, historial, reportes)                     │  │
│  │  └─ reportes/     (PDF, Excel, gráficos)                          │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              BUSINESS LOGIC LAYER (Services)                        │  │
│  │                                                                     │  │
│  │  ├─ InsumoService                                                  │  │
│  │  │   ├─ registrarIngreso()                                         │  │
│  │  │   ├─ registrarEgreso()                                          │  │
│  │  │   └─ obtenerStock()                                             │  │
│  │  │                                                                 │  │
│  │  ├─ ProduccionService                                              │  │
│  │  │   ├─ crearOrden()                                               │  │
│  │  │   ├─ registrarConsumo()                                         │  │
│  │  │   ├─ calcularMerma()                                            │  │
│  │  │   └─ completarOrden()                                           │  │
│  │  │                                                                 │  │
│  │  ├─ VentaService                                                   │  │
│  │  │   ├─ crearVenta()                                               │  │
│  │  │   └─ calcularMargen()                                           │  │
│  │  │                                                                 │  │
│  │  ├─ NominaService                                                  │  │
│  │  │   ├─ calcularHaberes()                                          │  │
│  │  │   ├─ calcularAportes()                                          │  │
│  │  │   ├─ calcularDescuentos()                                       │  │
│  │  │   └─ procesarNominaMensual()                                    │  │
│  │  │                                                                 │  │
│  │  ├─ AuditoriaService                                               │  │
│  │  │   ├─ registrarCambio()                                          │  │
│  │  │   └─ obtenerHistorial()                                         │  │
│  │  │                                                                 │  │
│  │  └─ ReporteService                                                 │  │
│  │      ├─ generarPDF()                                               │  │
│  │      └─ generarExcel()                                             │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │           DATA ACCESS LAYER (Repositories/ORM)                      │  │
│  │                                                                     │  │
│  │  Abstrae todas las queries a BD                                    │  │
│  │  Usa ORM (Sequelize, TypeORM, SQLAlchemy, etc.)                   │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    ↓ Queries SQL                             │
└────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────────┐
│                       CAPA DE PERSISTENCIA                                  │
│                                                                            │
│  ┌─────────────────────┐       ┌──────────────────┐                       │
│  │   BD Principal      │       │    Cache (Redis) │                       │
│  │                     │       │                  │                       │
│  │  MySQL 8.0+         │       │ • Usuarios       │                       │
│  │  PostgreSQL 12+     │       │ • Estructura     │                       │
│  │                     │       │   Salarial       │                       │
│  │  27 Tablas          │       │ • Recetas        │                       │
│  │  • insumos          │       │ • Stock Actual   │                       │
│  │  • movimientos      │       │ • Config Aportes │                       │
│  │  • productos        │       │                  │                       │
│  │  • recetas          │       └──────────────────┘                       │
│  │  • ordenes          │                                                  │
│  │  • produccion       │       Invalidación automática                    │
│  │  • ventas           │       en cada cambio                             │
│  │  • empleados        │                                                  │
│  │  • nomina           │                                                  │
│  │  • auditoria        │                                                  │
│  │  • y más...         │                                                  │
│  │                     │                                                  │
│  │  Replicación        │                                                  │
│  │  Backup automático  │                                                  │
│  │                     │                                                  │
│  └─────────────────────┘                                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. FLUJO: INGRESO DE MATERIA PRIMA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OPERARIO                                        │
│                   (Clic en "Nuevo Ingreso")                             │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND                                          │
│      (Formulario: Insumo, Cantidad, Proveedor, Lote, Vencimiento)      │
│                   Clic en "Guardar"                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      API REST                                           │
│  POST /api/v1/insumos/{id}/ingreso                                     │
│  {                                                                      │
│    cantidad: 100,                                                       │
│    precio_unitario: 15.50,                                              │
│    numero_lote: "LOT-2024-001"                                          │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND - CONTROLLER                                  │
│              Recibe y valida request                                    │
│              ├─ ¿Existe el insumo?                                      │
│              ├─ ¿Cantidad > 0?                                          │
│              ├─ ¿Precio válido?                                         │
│              └─ ¿Usuario autenticado?                                   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND - SERVICE                                     │
│                (InsumoService)                                          │
│                                                                         │
│    1. registrarIngreso(insumo, cantidad, lote, vencimiento)            │
│       ├─ Crear registro en movimientos_insumos                         │
│       │  (tipo: ENTRADA, cantidad: 100, fecha: NOW)                    │
│       │                                                                 │
│       ├─ Actualizar stock_actual                                        │
│       │  (cantidad_stock += 100, valor_stock += 1550)                  │
│       │                                                                 │
│       ├─ Notificar al AuditObserver                                     │
│       │  (quién, qué, cuándo, valores anteriores/nuevos)               │
│       │                                                                 │
│       └─ Return movimiento_id y stock_nuevo                             │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      BD - TRANSACCIÓN                                   │
│                                                                         │
│  BEGIN TRANSACTION                                                      │
│    INSERT movimientos_insumos (100, 15.50, "LOT-2024-001", ...)        │
│    UPDATE stock_actual SET cantidad = 300, valor = 4650 WHERE id = 1   │
│    INSERT auditoria_logs (usuario, accion, tabla, valores_anteriores,  │
│                           valores_nuevos)                               │
│  COMMIT                                                                 │
│                                                                         │
│  Cache invalidado: stock:insumo:1                                       │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND - RESPONSE                                    │
│  200 OK {                                                               │
│    movimiento_id: 1245,                                                 │
│    tipo: "ENTRADA",                                                     │
│    cantidad: 100,                                                       │
│    stock_anterior: 200,                                                 │
│    stock_nuevo: 300,                                                    │
│    valor_movimiento: 1550.00,                                           │
│    fecha: "2024-01-28T10:30:45Z"                                        │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND                                          │
│                Actualiza tabla de stock                                │
│                Muestra notificación "Ingreso registrado"                │
│                Actualiza contador de stock en header                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FLUJO: PROCESAMIENTO DE NÓMINA MENSUAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│              ENCARGADO DE RRHH                                          │
│       (Abre "Nómina" → "Procesar Nómina")                               │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                ASISTENTE PASO 1: SELECCIONAR PERÍODO                    │
│                Mes: Enero 2024                                          │
│                Validar: No existe nómina ya procesada                   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              ASISTENTE PASO 2: VALIDAR EMPLEADOS                        │
│                                                                         │
│  SELECT empleados WHERE estado = 'ACTIVO' Y                            │
│  fecha_ingreso <= '2024-01-31'                                          │
│                                                                         │
│  Mostrar: Empleados activos (12)                                        │
│  Verificar: Tienen estructura salarial vigente                          │
│  Registrar: Asistencias (si falta alguna)                               │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│            ASISTENTE PASO 3: REVISAR Y PROCESAR                         │
│                                                                         │
│  Para CADA empleado activo:                                             │
│                                                                         │
│  1. Obtener estructura_salarial vigente de BD                           │
│     └─ sueldo_basico: 50000, bono_fijo: 0                              │
│                                                                         │
│  2. Calcular ANTIGÜEDAD                                                 │
│     ├─ Años = fecha_hoy - fecha_ingreso = 3 años                       │
│     └─ Monto antigüedad = sueldo_basico × 3% = 1500                    │
│                                                                         │
│  3. HABERES TOTALES                                                     │
│     ├─ Sueldo base:    50000                                            │
│     ├─ Antigüedad:      1500                                            │
│     ├─ Bono fijo:         0                                             │
│     ├─ Comisiones:        0                                             │
│     └─ TOTAL HABERES:  51500                                            │
│                                                                         │
│  4. Obtener CONFIGURACIÓN DE APORTES                                    │
│     ├─ AFIP:           17%                                              │
│     ├─ Sindicato:       3%                                              │
│     └─ Otros:           0%                                              │
│                                                                         │
│  5. DESCUENTOS DE NÓMINA                                                │
│     ├─ Descto Sindicato = 51500 × 3% = 1545                            │
│     ├─ Anticipos:        0                                              │
│     └─ TOTAL DESCTOS:   1545                                            │
│                                                                         │
│  6. NETO A PAGAR                                                        │
│     ├─ Neto = 51500 - 1545 = 49955                                      │
│                                                                         │
│  7. COSTO EMPRESA                                                       │
│     ├─ Aportes Patronales = 51500 × 17% = 8755                         │
│     └─ COSTO TOTAL = 51500 + 8755 = 60255                              │
│                                                                         │
│  Mostrar en tabla:                                                      │
│  ┌────┬──────────┬─────────┬────────┬──────────┬──────────────────┐    │
│  │Emp │ Haberes  │ Desc.   │ Neto   │ Aportes  │ Costo Empresa    │    │
│  ├────┼──────────┼─────────┼────────┼──────────┼──────────────────┤    │
│  │Jua │  51,500  │  1,545  │49,955  │  8,755   │  60,255          │    │
│  │Mar │  49,000  │  1,470  │47,530  │  8,330   │  57,330          │    │
│  │... │   ...    │   ...   │  ...   │   ...    │   ...            │    │
│  └────┴──────────┴─────────┴────────┴──────────┴──────────────────┘    │
│                                                                         │
│  TOTALES DEL MES:                                                       │
│  ├─ Total Haberes:           650,000                                    │
│  ├─ Total Descuentos:         19,500                                    │
│  ├─ Total Neto a Pagar:      630,500                                    │
│  ├─ Total Aportes Patronales: 110,500                                   │
│  └─ COSTO TOTAL RRHH:        760,500                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                CLIC EN "PROCESAR NÓMINA"                                │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND - NOMINA SERVICE                              │
│                                                                         │
│  BEGIN TRANSACTION                                                      │
│    1. INSERT nomina_mensual                                             │
│       (numero: "NOM-2024-01-001", mes: 1, año: 2024,                   │
│        estado: "PROCESADA", procesado_por: user_id)                     │
│                                                                         │
│    2. PARA CADA EMPLEADO:                                               │
│       INSERT recibo_sueldo                                              │
│       (nomina_id, empleado_id, sueldo_basico, antigüedad_monto,        │
│        total_haberes, aporte_sindicato, total_descuentos,              │
│        neto_a_pagar, aporte_patronal)                                   │
│                                                                         │
│    3. INSERT auditoria_logs                                             │
│       (accion: "PROCESAR_NOMINA", periodo: "Enero 2024",               │
│        usuario, timestamp, detalles)                                    │
│  COMMIT                                                                 │
│                                                                         │
│  ✓ 12 recibos creados                                                   │
│  ✓ Nómina estado: PROCESADA                                             │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    GENERACIÓN DE ARCHIVOS                               │
│                                                                         │
│  ├─ PDF: recibos_sueldo_enero_2024.pdf (12 páginas)                    │
│  ├─ Excel: nomina_enero_2024.xlsx (1 hoja por empleado)                │
│  ├─ Excel: aportes_afip_enero_2024.xlsx (para presentar a AFIP)        │
│  └─ JSON: resumen_nomina_enero_2024.json (para datos)                  │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                         │
│                                                                         │
│  Muestra:                                                               │
│  ✓ "Nómina procesada correctamente"                                    │
│  ✓ Botones de descarga:                                                 │
│    ├─ Descargar recibos PDF                                             │
│    ├─ Descargar nómina Excel                                            │
│    ├─ Descargar aportes AFIP                                            │
│    └─ Descargar resumen                                                 │
│                                                                         │
│  Tabla de resumen:                                                      │
│  ├─ Total salarios a pagar: $630,500                                    │
│  ├─ Total aportes patronales: $110,500                                  │
│  ├─ Costo total empresa: $760,500                                       │
│  └─ Empleados: 12                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. FLUJO: PRODUCCIÓN DE PAPAS FRITAS

```
┌─────────────────────────────────────────────────────────────────────────┐
│           GERENTE DE PRODUCCIÓN                                         │
│      (Abre "Producción" → "Nueva Orden")                                │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    CREAR ORDEN                                          │
│  Selecciona:                                                             │
│  ├─ Producto: "Papas Fritas 45gr"                                       │
│  ├─ Cantidad: 50 bolsas                                                 │
│  ├─ Fecha: 2024-01-28                                                   │
│  └─ Responsable: "Operario Juan"                                        │
│                                                                         │
│  Sistema carga automáticamente:                                         │
│  ├─ RECETA VIGENTE:                                                     │
│  │  ├─ Papa:  66 kg (con 10% merma esperada)                            │
│  │  ├─ Aceite: 5 litros                                                 │
│  │  ├─ Sal:   2 kg                                                      │
│  │  └─ Envase: 50 unidades                                              │
│  │                                                                       │
│  ├─ STOCK ACTUAL:                                                       │
│  │  ├─ Papa:  245.5 kg ✓ SUFICIENTE (66 <= 245.5)                     │
│  │  ├─ Aceite: 18.2 L ✓ SUFICIENTE (5 <= 18.2)                        │
│  │  ├─ Sal:   50 kg ✓ SUFICIENTE (2 <= 50)                             │
│  │  └─ Envase: 1000 ✓ SUFICIENTE (50 <= 1000)                          │
│  │                                                                       │
│  ├─ COSTO ESTIMADO:                                                     │
│  │  ├─ Papa (66 kg × $15.50): $1,023                                   │
│  │  ├─ Aceite (5 L × $35):     $175                                    │
│  │  ├─ Sal (2 kg × $8):        $16                                     │
│  │  ├─ Envase (50 × $0.10):    $5                                      │
│  │  └─ TOTAL: $1,219                                                    │
│                                                                         │
│  Gerente revisa y hace clic "Crear Orden"                               │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              BD - CREAR ORDEN DE PRODUCCIÓN                              │
│                                                                         │
│  INSERT ordenes_produccion (                                            │
│    numero_orden: "ORD-2024-001-105",                                    │
│    producto_id: 1,                                                      │
│    cantidad_solicitada: 50,                                             │
│    fecha_produccion: "2024-01-28",                                      │
│    responsable_id: 10,                                                  │
│    estado: "PLANIFICADA"                                                │
│  )                                                                      │
│                                                                         │
│  ✓ Orden creada (Estado: PLANIFICADA)                                   │
│  ✓ Insumos RESERVADOS (pendiente salida)                                │
│  ✓ Notificación enviada a Operario Juan                                 │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│            OPERARIO JUAN - INICIAR PRODUCCIÓN                           │
│                                                                         │
│  1. Abre orden "ORD-2024-001-105"                                       │
│  2. Clic "Iniciar Producción"                                           │
│     ├─ Registra hora inicio: 09:00                                      │
│     ├─ Cambia estado a "EN_PROCESO"                                     │
│     └─ Sistema muestra lista de insumos a usar:                         │
│                                                                         │
│  INSUMOS (previsto según receta):                                       │
│  ├─ Papa:  66 kg                                                        │
│  ├─ Aceite: 5 L                                                         │
│  ├─ Sal:   2 kg                                                         │
│  └─ Envase: 50 unds.                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│            OPERARIO - REGISTRAR CONSUMO REAL                            │
│                                                                         │
│  Conforme va usando insumos, registra:                                  │
│                                                                         │
│  Papa:  "Usé 64 kg" (en lugar de 66)                                    │
│         Diferencia: -2 kg (-3.03%)  ← FAVORABLE                         │
│                                                                         │
│  Aceite: "Usé 5.2 L" (en lugar de 5)                                    │
│         Diferencia: +0.2 L (+4%)  ← DESFAVORABLE                        │
│                                                                         │
│  Sal:    "Usé 1.9 kg" (en lugar de 2)                                   │
│         Diferencia: -0.1 kg (-5%)  ← FAVORABLE                          │
│                                                                         │
│  Envase: "Usé 48 unidades" (en lugar de 50)                             │
│         Diferencia: -2 (-4%)  ← FAVORABLE                               │
│                                                                         │
│  CANTIDAD PRODUCIDA:                                                    │
│  ├─ Producidas: 48 bolsas (esperadas 50)                                │
│  ├─ Defectuosas: 2 bolsas                                               │
│  └─ Merma: 4%                                                           │
│                                                                         │
│  COSTO REAL:                                                            │
│  ├─ Papa (64 kg × $15.50): $992                                        │
│  ├─ Aceite (5.2 L × $35): $182                                         │
│  ├─ Sal (1.9 kg × $8): $15.20                                          │
│  ├─ Envase (48 × $0.10): $4.80                                         │
│  └─ TOTAL: $1,194                                                       │
│                                                                         │
│  VARIACIÓN DE COSTO:                                                    │
│  └─ Estimado vs Real: $1,219 - $1,194 = $25 FAVORABLE                  │
│                                                                         │
│  Hora fin: 12:30                                                        │
│  Observaciones: "Producción normal, papas buena calidad"                │
│                                                                         │
│  Clic "Completar Orden"                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              BD - REGISTRAR CONSUMO Y ACTUALIZAR STOCK                  │
│                                                                         │
│  BEGIN TRANSACTION                                                      │
│    FOR EACH insumo:                                                     │
│      1. INSERT consumo_insumos (orden_id, insumo_id,                    │
│         cantidad_prevista, cantidad_utilizada, diferencia)              │
│                                                                         │
│      2. INSERT movimientos_insumos tipo SALIDA                          │
│         (cantidad_utilizada, referencia: orden_id)                      │
│                                                                         │
│      3. UPDATE stock_actual                                              │
│         (cantidad_stock -= cantidad_utilizada,                          │
│          valor_stock -= (cantidad_utilizada × precio))                  │
│                                                                         │
│    4. UPDATE ordenes_produccion                                         │
│       (cantidad_producida: 48, estado: "COMPLETADA")                    │
│                                                                         │
│    5. INSERT auditoria_logs (detalles completos del cambio)             │
│  COMMIT                                                                 │
│                                                                         │
│  NUEVO STOCK ACTUAL:                                                    │
│  ├─ Papa:  245.5 - 64 = 181.5 kg                                        │
│  ├─ Aceite: 18.2 - 5.2 = 13 L                                           │
│  ├─ Sal:   50 - 1.9 = 48.1 kg                                           │
│  └─ Envase: 1000 - 48 = 952 unds.                                       │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                 FRONTEND - RESUMEN                                      │
│                                                                         │
│  ✓ Orden completada "ORD-2024-001-105"                                  │
│  ✓ 48 bolsas de Papas Fritas 45gr producidas                            │
│  ✓ Merma: 4% (2 defectuosas)                                            │
│  ✓ Costo real: $1,194 (vs $1,219 estimado)                              │
│  ✓ Stock actualizado automáticamente                                    │
│  ✓ Auditoría registrada                                                 │
│                                                                         │
│  Las 48 bolsas están LISTAS PARA VENTA ✓                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. FLUJO: VENTA DE PRODUCTO

```
┌─────────────────────────────────────────────────────────────────────────┐
│            VENDEDOR                                                     │
│      (Abre "Ventas" → "Nueva Venta")                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    FORMULARIO DE VENTA                                  │
│  ├─ Cliente: "Supermercado García"                                      │
│  ├─ CUIT: "30-12345678-9"                                               │
│  ├─ Fecha: 2024-01-28                                                   │
│  ├─ Medio de pago: Transferencia                                        │
│                                                                         │
│  AGREGAR PRODUCTOS:                                                     │
│  ├─ Papas Fritas 45gr (cantidad: 100)                                   │
│  │  └─ Stock disponible: 48 ✓ OK                                        │
│  │  └─ Precio unitario: $15.00                                          │
│  │  └─ Costo unitario: $8.50                                            │
│  │  └─ Margen unitario: $6.50 (43.3%)                                   │
│  │  └─ Subtotal: $1,500                                                 │
│  │                                                                       │
│  ├─ Palitos 500gr (cantidad: 50)                                        │
│  │  └─ Stock disponible: 120 ✓ OK                                       │
│  │  └─ Precio unitario: $45.00                                          │
│  │  └─ Costo unitario: $22.00                                           │
│  │  └─ Margen unitario: $23.00 (51.1%)                                  │
│  │  └─ Subtotal: $2,250                                                 │
│                                                                         │
│  RESUMEN:                                                               │
│  ├─ Subtotal:        $3,750                                             │
│  ├─ Descuento (5%):   -$187.50                                          │
│  ├─ TOTAL NETO:      $3,562.50                                          │
│  │                                                                       │
│  ├─ GANANCIA BRUTA:   $950 (26.7% de margen)                            │
│  │  ├─ De Papas: $650 (100 × 6.50)                                      │
│  │  └─ De Palitos: $1,150 (50 × 23)                                     │
│                                                                         │
│  Clic "Guardar Venta"                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              BD - REGISTRAR VENTA Y ACTUALIZAR STOCK                    │
│                                                                         │
│  BEGIN TRANSACTION                                                      │
│    1. INSERT ventas (                                                   │
│         numero_comprobante: "REM-2024-001-500",                         │
│         cliente: "Supermercado García",                                 │
│         total_bruto: 3750,                                              │
│         descuento_monto: 187.50,                                        │
│         total_neto: 3562.50,                                            │
│         medio_pago: "transferencia",                                    │
│         registrado_por: user_id                                         │
│       )                                                                 │
│                                                                         │
│    2. FOR EACH producto vendido:                                        │
│       INSERT venta_detalles (venta_id, producto_id,                     │
│         cantidad, precio_unitario, costo_unitario,                      │
│         ganancia_unitaria)                                              │
│                                                                         │
│       INSERT movimientos_insumos tipo SALIDA                            │
│       (Para tracking de dónde salió cada producto)                      │
│                                                                         │
│       UPDATE stock_actual (restar cantidad de producto)                 │
│                                                                         │
│    3. INSERT auditoria_logs (detalles de venta)                         │
│  COMMIT                                                                 │
│                                                                         │
│  STOCK ACTUALIZADO:                                                     │
│  ├─ Papas Fritas 45gr: 48 - 100 = INSUFICIENTE!!!                      │
│  │                    ↑ ERROR: Se intentó vender más de lo disponible   │
│  │                    → ROLLBACK TRANSACTION                            │
│  │                    → ERROR: Stock insuficiente                       │
│  │                                                                       │
│  └─ Alternativa: Vendedor reduce a 48 bolsas                            │
│     └─ Nueva venta: 48 × 15 = 720                                       │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                FRONTEND - VENTA COMPLETADA                              │
│                                                                         │
│  ✓ Venta registrada "REM-2024-001-500"                                  │
│  ✓ Comprobante generado                                                 │
│  ├─ Botón: Descargar PDF                                                │
│  ├─ Botón: Imprimir                                                     │
│  └─ Botón: Nueva Venta                                                  │
│                                                                         │
│  Resumen de ganancia:                                                   │
│  ├─ Total vendido: $3,062.50                                            │
│  ├─ Costo total: $1,550                                                 │
│  └─ Ganancia: $1,512.50 (49.4%)                                         │
│                                                                         │
│  Stock actualizado:                                                     │
│  ├─ Papas Fritas 45gr: 0 ← STOCK CRÍTICO ALERTA!                       │
│  └─ Palitos 500gr: 70                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. ESTRUCTURA DE ROLES Y PERMISOS

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USUARIOS Y ROLES                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ADMIN                                                                   │
│  └─ Acceso total a TODO                                                 │
│     ├─ Crear usuarios                                                   │
│     ├─ Cambiar permisos                                                 │
│     ├─ Ver auditoría completa                                           │
│     └─ Cambiar configuraciones críticas                                 │
│                                                                          │
│  GERENTE                                                                │
│  └─ Planificación y reportes                                            │
│     ├─ Ver inventario completo                                          │
│     ├─ Crear órdenes de producción                                      │
│     ├─ Ver reportes de producción                                       │
│     ├─ Ver reportes de ventas                                           │
│     ├─ Ver reportes de rentabilidad                                     │
│     └─ NO: Cambiar salarios, eliminar datos                             │
│                                                                          │
│  OPERARIO                                                               │
│  └─ Operaciones diarias                                                 │
│     ├─ Registrar ingreso de insumos                                     │
│     ├─ Registrar egreso de insumos                                      │
│     ├─ Ver stock actual                                                 │
│     ├─ Registrar consumo en producción                                  │
│     ├─ Completar órdenes de producción                                  │
│     └─ NO: Cambiar precios, crear empleados, ver salarios              │
│                                                                          │
│  RRHH (Recursos Humanos)                                                │
│  └─ Gestión de personal y nómina                                        │
│     ├─ Crear/editar empleados                                           │
│     ├─ Configurar salarios                                              │
│     ├─ Procesar nómina mensual                                          │
│     ├─ Generar recibos de sueldo                                        │
│     ├─ Configurar aportes/descuentos                                    │
│     ├─ Ver reportes de nómina                                           │
│     └─ NO: Ver auditoría de otros módulos, eliminar datos              │
│                                                                          │
│  CONTADOR/AUDITOR                                                       │
│  └─ Control y auditoría                                                 │
│     ├─ Ver auditoría completa                                           │
│     ├─ Ver movimientos de inventario                                    │
│     ├─ Ver historial de precios                                         │
│     ├─ Auditar cálculos de nómina                                       │
│     ├─ Generar reportes para AFIP                                       │
│     └─ NO: Modificar datos, crear órdenes                              │
│                                                                          │
│  VENDEDOR                                                               │
│  └─ Gestión de ventas                                                   │
│     ├─ Registrar ventas                                                 │
│     ├─ Ver histórico de ventas                                          │
│     ├─ Descargar remitos                                                │
│     ├─ Ver ganancia por producto                                        │
│     └─ NO: Modificar precios, eliminar ventas (solo gerente)           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

MATRIZ DE PERMISOS:

                    ADMIN  GERENTE  OPERARIO  RRHH  CONTADOR  VENDEDOR
─────────────────────────────────────────────────────────────────────
Crear Usuario         ✓       ✗        ✗       ✗      ✗         ✗
Ver Inventario        ✓       ✓        ✓       ✗      ✓         ✗
Ingresar Insumo       ✓       ✓        ✓       ✗      ✗         ✗
Egresar Insumo        ✓       ✓        ✓       ✗      ✗         ✗
Crear Orden           ✓       ✓        ✗       ✗      ✗         ✗
Registrar Consumo     ✓       ✓        ✓       ✗      ✗         ✗
Crear Venta           ✓       ✓        ✗       ✗      ✗         ✓
Crear Empleado        ✓       ✗        ✗       ✓      ✗         ✗
Configurar Salario    ✓       ✗        ✗       ✓      ✗         ✗
Procesar Nómina       ✓       ✗        ✗       ✓      ✗         ✗
Ver Auditoría         ✓       ✗        ✗       ✗      ✓         ✗
Generar Reportes      ✓       ✓        ✗       ✓      ✓         ✓
```

---

## 7. MODELOS DE DATOS PRINCIPALES

```
INSUMO
├─ id, código, nombre
├─ categoría (papas_fritas, panificados, etc.)
├─ unidad_medida (kg, litros, unidades)
├─ precio_unitario, costo_actual
├─ stock_minimo, stock_critico
├─ activo
└─ Relaciones:
   ├─ → movimientos_insumos (muchos)
   ├─ → receta_detalles (muchos)
   └─ → consumo_insumos (muchos)

MOVIMIENTO INSUMO (Historial)
├─ id, insumo_id
├─ tipo (ENTRADA, SALIDA, AJUSTE, PERDIDA)
├─ cantidad, precio_unitario
├─ fecha_movimiento, motivo
├─ usuario_id, numero_lote
└─ Relaciones:
   └─ ← insumo (uno)

PRODUCTO
├─ id, código, nombre
├─ categoría, peso_gramos
├─ costo_promedio, precio_venta
├─ margen_bruto_porcentaje
├─ activo
└─ Relaciones:
   ├─ → recetas (muchas)
   ├─ → ordenes_produccion (muchas)
   └─ → venta_detalles (muchas)

RECETA (Fórmula de Producción)
├─ id, código, producto_id
├─ versión, rendimiento_esperado
├─ costo_total_esperado
├─ activa, fecha_inicio/fin_validez
└─ Relaciones:
   ├─ ← producto (uno)
   └─ → receta_detalles (muchos)

RECETA DETALLE (Insumos de una Receta)
├─ id, receta_id, insumo_id
├─ cantidad_requerida, unidad_medida
├─ porcentaje_merma, cantidad_con_merma
├─ costo_unitario, costo_total
└─ Relaciones:
   ├─ ← receta (uno)
   └─ ← insumo (uno)

ORDEN PRODUCCIÓN
├─ id, numero_orden, producto_id, receta_id
├─ cantidad_solicitada, cantidad_producida, cantidad_defectuosa
├─ fecha_produccion, hora_inicio, hora_fin
├─ estado (PLANIFICADA, EN_PROCESO, COMPLETADA, CANCELADA)
├─ responsable_id
└─ Relaciones:
   ├─ → consumo_insumos (muchos)
   └─ → movimientos_insumos (referencia)

CONSUMO INSUMO (Qué se usó realmente en una orden)
├─ id, orden_produccion_id, insumo_id
├─ cantidad_prevista (según receta)
├─ cantidad_utilizada (real)
├─ diferencia, porcentaje_diferencia
├─ precio_unitario, costo_total
└─ Relaciones:
   ├─ ← orden_produccion (uno)
   └─ ← insumo (uno)

VENTA
├─ id, numero_comprobante, tipo_comprobante
├─ cliente_nombre, cliente_cuit
├─ fecha_venta, total_bruto
├─ descuento_porcentaje, descuento_monto
├─ total_neto, medio_pago
├─ anulada, fecha_anulacion, motivo_anulacion
└─ Relaciones:
   ├─ → venta_detalles (muchas)
   └─ ← usuario (uno)

VENTA DETALLE
├─ id, venta_id, producto_id
├─ cantidad, precio_unitario
├─ costo_unitario, ganancia_unitaria
├─ subtotal, porcentaje_ganancia
└─ Relaciones:
   ├─ ← venta (uno)
   └─ ← producto (uno)

EMPLEADO
├─ id, dni, nombre, apellido
├─ email, telefono, direccion
├─ fecha_nacimiento, puesto, departamento
├─ fecha_ingreso, fecha_egreso
├─ estado (ACTIVO, INACTIVO, LICENCIA, EGRESADO)
├─ cuit_empleado, numero_afiliacion
└─ Relaciones:
   ├─ → estructura_salarial (muchas)
   ├─ → recibo_sueldo (muchas)
   └─ → asistencia (muchas)

ESTRUCTURA SALARIAL
├─ id, empleado_id
├─ sueldo_basico, tarifa_horaria
├─ bono_fijo, comision_porcentaje
├─ anticipo_descuento
├─ fecha_inicio, fecha_fin
├─ vigente
└─ Relaciones:
   ├─ ← empleado (uno)
   └─ historial_estructura_salarial

NÓMINA MENSUAL
├─ id, numero_nomina
├─ periodo_mes, periodo_anio
├─ fecha_procesamiento
├─ estado (BORRADOR, PROCESADA, PAGADA, CANCELADA)
├─ procesado_por_id
└─ Relaciones:
   └─ → recibo_sueldo (muchos)

RECIBO SUELDO
├─ id, numero_recibo, nomina_id, empleado_id
├─ periodo_mes, periodo_anio
├─ sueldo_basico, antigüedad_monto
├─ total_haberes
├─ aporte_sindicato, total_descuentos
├─ neto_a_pagar, aporte_patronal
├─ costo_total_empleado
└─ Relaciones:
   ├─ ← nomina_mensual (uno)
   └─ ← empleado (uno)

AUDITORIA LOG
├─ id, usuario_id, nombre_usuario
├─ accion (CREAR, EDITAR, ELIMINAR, ANULAR)
├─ modulo, tabla_afectada, registro_id
├─ valores_anteriores (JSON), valores_nuevos (JSON)
├─ ip_origen, user_agent
├─ fecha_accion
└─ Relaciones:
   └─ ← usuario (uno)
```

---

Este diagrama visual complementa toda la documentación técnica y facilita la comprensión rápida de cómo funciona el sistema.
