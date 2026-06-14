# API REST - Endpoints Propuestos

## 1. ESTRUCTURA GENERAL DE LA API

### 1.1 Información Base
```
BASE URL: /api/v1
Autenticación: JWT Bearer Token
Content-Type: application/json
Versionado: /api/v1, /api/v2, etc.
```

### 1.2 Respuesta Estándar - Success
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Operación completada exitosamente",
  "data": {...},
  "timestamp": "2024-01-28T10:30:45Z"
}
```

### 1.3 Respuesta Estándar - Error
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validación fallida",
  "errors": [
    {
      "field": "cantidad",
      "message": "Debe ser mayor a 0"
    }
  ],
  "timestamp": "2024-01-28T10:30:45Z"
}
```

### 1.4 Paginación Estándar
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 2. ENDPOINTS - MÓDULO AUTENTICACIÓN

### 2.1 Login
```
POST /api/v1/auth/login
Content-Type: application/json

REQUEST:
{
  "username": "operario_juan",
  "password": "contraseña_segura"
}

RESPONSE 200:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": 5,
      "username": "operario_juan",
      "email": "juan@empresa.com",
      "rol": "OPERARIO",
      "permisos": ["inventario:ver", "produccion:crear", ...]
    }
  }
}

RESPONSE 401:
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "Usuario o contraseña incorrectos"
}
```

---

### 2.2 Logout
```
POST /api/v1/auth/logout
Headers: Authorization: Bearer {token}

RESPONSE 200:
{
  "success": true,
  "message": "Sesión cerrada"
}
```

---

### 2.3 Refresh Token
```
POST /api/v1/auth/refresh
Content-Type: application/json

REQUEST:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

RESPONSE 200:
{
  "success": true,
  "data": {
    "accessToken": "nuevo_token...",
    "expiresIn": 3600
  }
}
```

---

## 3. ENDPOINTS - MÓDULO INVENTARIO (INSUMOS)

### 3.1 Listar Insumos
```
GET /api/v1/insumos
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- page: number (default: 1)
- limit: number (default: 50)
- search: string (búsqueda en nombre/código)
- categoria: string (filtro)
- stock_bajo: boolean (solo alertas)
- sort: string (ej: nombre:ASC, stock:DESC)
- activos_solo: boolean (default: true)

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "PAPA-001",
      "nombre": "Papa fresca",
      "categoria": "papas_fritas",
      "unidad_medida": "kg",
      "precio_unitario": 15.50,
      "costo_actual": 15.50,
      "stock_minimo": 50,
      "stock_critico": 20,
      "activo": true
    }
  ],
  "pagination": {...}
}
```

---

### 3.2 Obtener Detalle de Insumo
```
GET /api/v1/insumos/{id}
Headers: Authorization: Bearer {token}

RESPONSE 200:
{
  "success": true,
  "data": {
    "id": 1,
    "codigo": "PAPA-001",
    "nombre": "Papa fresca",
    "descripcion": "Papa tipo Spunta",
    "categoria": "papas_fritas",
    "unidad_medida": "kg",
    "precio_unitario": 15.50,
    "costo_actual": 15.50,
    "stock_minimo": 50,
    "stock_critico": 20,
    "dias_vencimiento_alerta": 30,
    "activo": true,
    "observaciones": "Proveedor: García SRL",
    "stock_actual": {
      "cantidad": 245.5,
      "valor": 3806.75,
      "estado": "OK"
    },
    "ultimo_movimiento": {
      "fecha": "2024-01-27T14:30:00Z",
      "tipo": "ENTRADA",
      "cantidad": 100
    }
  }
}
```

---

### 3.3 Crear Insumo
```
POST /api/v1/insumos
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json

REQUEST:
{
  "codigo": "PAPA-002",
  "nombre": "Papa Blanca",
  "descripcion": "Papa para puré",
  "categoria": "papas_fritas",
  "unidad_medida": "kg",
  "precio_unitario": 14.50,
  "stock_minimo": 40,
  "stock_critico": 15,
  "dias_vencimiento_alerta": 30,
  "observaciones": "Proveedor local"
}

RESPONSE 201:
{
  "success": true,
  "code": "CREATED",
  "data": {
    "id": 2,
    "codigo": "PAPA-002",
    ...
  }
}

RESPONSE 400:
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "errors": [
    {"field": "codigo", "message": "Ya existe insumo con este código"}
  ]
}
```

---

### 3.4 Actualizar Insumo
```
PATCH /api/v1/insumos/{id}
Headers: Authorization: Bearer {token}

REQUEST:
{
  "precio_unitario": 16.00,
  "stock_minimo": 60,
  "observaciones": "Nuevo proveedor desde enero"
}

RESPONSE 200:
{
  "success": true,
  "data": {...}
}
```

---

### 3.5 Registrar Ingreso de Insumo
```
POST /api/v1/insumos/{id}/ingreso
Headers: Authorization: Bearer {token}

REQUEST:
{
  "cantidad": 100,
  "precio_unitario": 15.50,
  "proveedor": "García SRL",
  "numero_lote": "LOT-2024-001",
  "fecha_vencimiento": "2024-06-15",
  "observaciones": "Entrega completa, buena calidad"
}

RESPONSE 201:
{
  "success": true,
  "code": "INGRESO_REGISTRADO",
  "data": {
    "movimiento_id": 1245,
    "tipo": "ENTRADA",
    "cantidad": 100,
    "stock_anterior": 200,
    "stock_nuevo": 300,
    "valor_movimiento": 1550.00,
    "fecha": "2024-01-28T10:30:45Z"
  }
}

RESPONSE 400:
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "errors": [
    {"field": "cantidad", "message": "Debe ser mayor a 0"}
  ]
}
```

---

### 3.6 Registrar Egreso de Insumo
```
POST /api/v1/insumos/{id}/egreso
Headers: Authorization: Bearer {token}

REQUEST:
{
  "cantidad": 50,
  "motivo": "PRODUCCION",
  "referencia_id": 105,
  "referencia_tipo": "orden_produccion",
  "observaciones": "Egreso para orden #105"
}

RESPONSE 201:
{
  "success": true,
  "code": "EGRESO_REGISTRADO",
  "data": {
    "movimiento_id": 1246,
    "tipo": "SALIDA",
    "cantidad": 50,
    "stock_anterior": 300,
    "stock_nuevo": 250,
    "fecha": "2024-01-28T10:35:00Z"
  }
}

RESPONSE 400:
{
  "success": false,
  "code": "INSUFFICIENT_STOCK",
  "message": "Stock insuficiente",
  "data": {
    "stock_disponible": 300,
    "cantidad_solicitada": 400,
    "faltante": 100
  }
}
```

---

### 3.7 Obtener Historial de Movimientos de Insumo
```
GET /api/v1/insumos/{id}/movimientos
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- page: number
- limit: number
- fecha_inicio: ISO date
- fecha_fin: ISO date
- tipo: ENTRADA | SALIDA | AJUSTE | PERDIDA

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "id": 1246,
      "tipo": "SALIDA",
      "cantidad": 50,
      "precio_unitario": 15.50,
      "valor_total": 775.00,
      "fecha": "2024-01-28T10:35:00Z",
      "motivo": "PRODUCCION",
      "usuario": "operario_juan",
      "observaciones": "Egreso para orden #105"
    }
  ],
  "pagination": {...}
}
```

---

### 3.8 Obtener Stock Actual
```
GET /api/v1/insumos/stock/resumen
Headers: Authorization: Bearer {token}

RESPONSE 200:
{
  "success": true,
  "data": {
    "total_insumos": 45,
    "valor_total_stock": 125000.00,
    "insumos_alerta": 5,
    "insumos_criticos": 2,
    "insumos_vencimiento_proximo": 3,
    "detalles": [
      {
        "insumo_id": 1,
        "nombre": "Papa",
        "cantidad": 245.5,
        "valor": 3806.75,
        "estado": "OK"
      }
    ]
  }
}
```

---

## 4. ENDPOINTS - MÓDULO PRODUCCIÓN

### 4.1 Listar Productos
```
GET /api/v1/productos
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- page: number
- limit: number
- categoria: string
- search: string
- activos_solo: boolean

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "PAPA-45GR",
      "nombre": "Papas Fritas 45gr",
      "categoria": "papas_fritas",
      "peso_gramos": 45,
      "costo_promedio": 8.50,
      "precio_venta": 15.00,
      "margen_bruto_porcentaje": 43.33,
      "activo": true
    }
  ],
  "pagination": {...}
}
```

---

### 4.2 Obtener Receta de Producto
```
GET /api/v1/productos/{id}/receta
Headers: Authorization: Bearer {token}

RESPONSE 200:
{
  "success": true,
  "data": {
    "receta_id": 5,
    "codigo": "REC-PAPA-45GR-01",
    "producto": "Papas Fritas 45gr",
    "version": 1,
    "vigente": true,
    "rendimiento_esperado": 50,
    "unidad": "kg",
    "costo_total_esperado": 425.00,
    "insumos": [
      {
        "insumo_id": 1,
        "nombre": "Papa",
        "cantidad_requerida": 60,
        "unidad_medida": "kg",
        "porcentaje_merma": 10,
        "cantidad_con_merma": 66,
        "costo_unitario": 15.50,
        "costo_total": 930.00
      },
      {
        "insumo_id": 2,
        "nombre": "Aceite",
        "cantidad_requerida": 5,
        "unidad_medida": "litros",
        "porcentaje_merma": 0,
        "cantidad_con_merma": 5,
        "costo_unitario": 35.00,
        "costo_total": 175.00
      }
    ]
  }
}
```

---

### 4.3 Crear Orden de Producción
```
POST /api/v1/produccion/ordenes
Headers: Authorization: Bearer {token}

REQUEST:
{
  "producto_id": 1,
  "cantidad_solicitada": 50,
  "fecha_produccion": "2024-01-28",
  "responsable_id": 10,
  "observaciones": "Producción urgente para cliente X"
}

RESPONSE 201:
{
  "success": true,
  "code": "ORDEN_CREADA",
  "data": {
    "orden_id": 105,
    "numero_orden": "ORD-2024-001-105",
    "producto": "Papas Fritas 45gr",
    "cantidad_solicitada": 50,
    "fecha_produccion": "2024-01-28",
    "estado": "PLANIFICADA",
    "insumos_requeridos": [
      {
        "insumo_id": 1,
        "nombre": "Papa",
        "cantidad": 66,
        "unidad": "kg",
        "stock_disponible": 245,
        "suficiente": true
      }
    ],
    "costo_estimado": 425.00,
    "creado": "2024-01-28T10:30:45Z"
  }
}

RESPONSE 400:
{
  "success": false,
  "code": "INSUFFICIENT_STOCK",
  "message": "Stock insuficiente para algunos insumos",
  "data": {
    "insumos_faltantes": [
      {
        "insumo": "Papa",
        "requerido": 66,
        "disponible": 45,
        "faltante": 21
      }
    ]
  }
}
```

---

### 4.4 Obtener Orden de Producción
```
GET /api/v1/produccion/ordenes/{id}
Headers: Authorization: Bearer {token}

RESPONSE 200:
{
  "success": true,
  "data": {
    "orden_id": 105,
    "numero_orden": "ORD-2024-001-105",
    "producto": "Papas Fritas 45gr",
    "cantidad_solicitada": 50,
    "cantidad_producida": 48,
    "cantidad_defectuosa": 2,
    "fecha_produccion": "2024-01-28",
    "hora_inicio": "09:00",
    "hora_fin": "12:30",
    "estado": "COMPLETADA",
    "responsable": "operario_juan",
    "consumo_real": [
      {
        "insumo": "Papa",
        "cantidad_prevista": 66,
        "cantidad_utilizada": 64,
        "diferencia": -2,
        "porcentaje_diferencia": -3.03,
        "costo_total": 992.00
      }
    ],
    "costo_estimado": 425.00,
    "costo_real": 423.00,
    "merma_total_porcentaje": 4.17,
    "observaciones": "Producción normal"
  }
}
```

---

### 4.5 Actualizar Estado de Orden (Iniciar)
```
PATCH /api/v1/produccion/ordenes/{id}/iniciar
Headers: Authorization: Bearer {token}

REQUEST:
{
  "hora_inicio": "09:00"
}

RESPONSE 200:
{
  "success": true,
  "data": {
    "orden_id": 105,
    "estado": "EN_PROCESO",
    "hora_inicio": "09:00"
  }
}
```

---

### 4.6 Completar Orden de Producción (Registrar Consumo Real)
```
PATCH /api/v1/produccion/ordenes/{id}/completar
Headers: Authorization: Bearer {token}

REQUEST:
{
  "cantidad_producida": 48,
  "cantidad_defectuosa": 2,
  "hora_fin": "12:30",
  "consumo_real": [
    {
      "insumo_id": 1,
      "cantidad_utilizada": 64,
      "observaciones": ""
    },
    {
      "insumo_id": 2,
      "cantidad_utilizada": 4.8,
      "observaciones": ""
    }
  ],
  "observaciones_produccion": "Todo normal"
}

RESPONSE 200:
{
  "success": true,
  "code": "ORDEN_COMPLETADA",
  "data": {
    "orden_id": 105,
    "estado": "COMPLETADA",
    "resumen": {
      "cantidad_producida": 48,
      "merma_porcentaje": 4.17,
      "costo_real": 423.00,
      "variacion_costo": -2.00
    },
    "movimientos_insumos": [
      {
        "movimiento_id": 1247,
        "insumo": "Papa",
        "cantidad": 64
      }
    ]
  }
}
```

---

### 4.7 Listar Órdenes de Producción
```
GET /api/v1/produccion/ordenes
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- page: number
- limit: number
- fecha_inicio: ISO date
- fecha_fin: ISO date
- estado: PLANIFICADA | EN_PROCESO | COMPLETADA | CANCELADA
- responsable_id: number
- producto_id: number

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "orden_id": 105,
      "numero_orden": "ORD-2024-001-105",
      "producto": "Papas Fritas 45gr",
      "cantidad_producida": 48,
      "fecha_produccion": "2024-01-28",
      "estado": "COMPLETADA",
      "responsable": "operario_juan"
    }
  ],
  "pagination": {...}
}
```

---

### 4.8 Reporte de Producción
```
GET /api/v1/produccion/reportes
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- fecha_inicio: ISO date (requerido)
- fecha_fin: ISO date (requerido)
- producto_id: number (opcional)
- formato: PDF | EXCEL

RESPONSE 200 (JSON):
{
  "success": true,
  "data": {
    "periodo": "2024-01-20 a 2024-01-28",
    "cantidad_ordenes": 15,
    "total_producido": {
      "cantidad": 450,
      "costo": 3825.00
    },
    "merma_promedio": 4.2,
    "eficiencia": 95.8,
    "por_producto": [
      {
        "producto": "Papas Fritas 45gr",
        "cantidad_producida": 200,
        "ordenes": 5,
        "merma": 4.5,
        "costo_promedio": 8.50
      }
    ]
  }
}

RESPONSE 200 (PDF/EXCEL):
Archivo binario descargable
```

---

## 5. ENDPOINTS - MÓDULO VENTAS

### 5.1 Crear Venta
```
POST /api/v1/ventas
Headers: Authorization: Bearer {token}

REQUEST:
{
  "cliente_nombre": "Supermercado García",
  "cliente_cuit": "30-12345678-9",
  "fecha_venta": "2024-01-28",
  "medio_pago": "transferencia",
  "detalles": [
    {
      "producto_id": 1,
      "cantidad": 100,
      "precio_unitario": 15.00
    },
    {
      "producto_id": 2,
      "cantidad": 50,
      "precio_unitario": 18.00
    }
  ],
  "descuento_porcentaje": 5,
  "observaciones": "Cliente frecuente"
}

RESPONSE 201:
{
  "success": true,
  "code": "VENTA_CREADA",
  "data": {
    "venta_id": 500,
    "numero_comprobante": "REM-2024-001-500",
    "cliente": "Supermercado García",
    "fecha": "2024-01-28T10:30:45Z",
    "detalles": [
      {
        "producto": "Papas Fritas 45gr",
        "cantidad": 100,
        "precio_unitario": 15.00,
        "costo_unitario": 8.50,
        "ganancia_unitaria": 6.50,
        "subtotal": 1500.00
      }
    ],
    "total_bruto": 2700.00,
    "descuento": 135.00,
    "total_neto": 2565.00,
    "ganancia_bruta": 585.00,
    "margen": 22.82,
    "comprobante_url": "/descargas/REM-2024-001-500.pdf"
  }
}
```

---

### 5.2 Obtener Venta
```
GET /api/v1/ventas/{id}
Headers: Authorization: Bearer {token}

RESPONSE 200:
{
  "success": true,
  "data": {
    "venta_id": 500,
    "numero_comprobante": "REM-2024-001-500",
    "cliente": "Supermercado García",
    "cuit": "30-12345678-9",
    "fecha": "2024-01-28T10:30:45Z",
    "estado": "VIGENTE",
    "detalles": [...],
    "total_neto": 2565.00,
    "medio_pago": "transferencia",
    "registrado_por": "vendedor_maria",
    "anulada": false
  }
}
```

---

### 5.3 Listar Ventas
```
GET /api/v1/ventas
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- page: number
- limit: number
- fecha_inicio: ISO date
- fecha_fin: ISO date
- cliente: string (búsqueda)
- solo_vigentes: boolean

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "venta_id": 500,
      "numero_comprobante": "REM-2024-001-500",
      "cliente": "Supermercado García",
      "fecha": "2024-01-28",
      "total": 2565.00,
      "productos_cantidad": 2,
      "estado": "VIGENTE"
    }
  ],
  "pagination": {...}
}
```

---

### 5.4 Descargar Remito
```
GET /api/v1/ventas/{id}/descargar-remito
Headers: Authorization: Bearer {token}

RESPONSE 200:
Archivo PDF binario

Content-Type: application/pdf
Content-Disposition: attachment; filename="REM-2024-001-500.pdf"
```

---

### 5.5 Anular Venta
```
DELETE /api/v1/ventas/{id}
Headers: Authorization: Bearer {token}

REQUEST:
{
  "motivo_anulacion": "Error de ingreso de cliente"
}

RESPONSE 200:
{
  "success": true,
  "data": {
    "venta_id": 500,
    "estado": "ANULADA",
    "fecha_anulacion": "2024-01-28T10:35:00Z",
    "motivo": "Error de ingreso de cliente"
  }
}

RESPONSE 403:
{
  "success": false,
  "code": "UNAUTHORIZED_ACTION",
  "message": "No tiene permiso para anular ventas"
}
```

---

## 6. ENDPOINTS - MÓDULO NÓMINA Y EMPLEADOS

### 6.1 Listar Empleados
```
GET /api/v1/empleados
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

QUERY PARAMETERS:
- page: number
- limit: number
- estado: ACTIVO | INACTIVO | EGRESADO
- buscar: string (nombre, DNI)

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "id": 10,
      "dni": "25123456",
      "nombre": "Juan",
      "apellido": "García",
      "puesto": "Operario de Producción",
      "departamento": "Producción",
      "fecha_ingreso": "2020-03-15",
      "antiguedad_anos": 3,
      "estado": "ACTIVO",
      "email": "juan@empresa.com",
      "estructura_salarial_actual": {
        "sueldo_basico": 50000,
        "tarifa_horaria": 300,
        "bono_fijo": 0
      }
    }
  ],
  "pagination": {...}
}
```

---

### 6.2 Obtener Detalle de Empleado
```
GET /api/v1/empleados/{id}
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

RESPONSE 200:
{
  "success": true,
  "data": {
    "id": 10,
    "dni": "25123456",
    "nombre": "Juan",
    "apellido": "García",
    "email": "juan@empresa.com",
    "telefono": "0387-1234567",
    "direccion": "Calle principal 100",
    "localidad": "Salta",
    "fecha_nacimiento": "1995-06-10",
    "puesto": "Operario de Producción",
    "departamento": "Producción",
    "fecha_ingreso": "2020-03-15",
    "antiguedad_anos": 3,
    "estado": "ACTIVO",
    "cuit": "20-25123456-3",
    "numero_afiliacion": "ART-123456",
    "estructura_salarial_vigente": {
      "sueldo_basico": 50000,
      "tarifa_horaria": 300,
      "bono_fijo": 0,
      "comision_porcentaje": 0,
      "fecha_inicio": "2024-01-01",
      "vigente": true
    },
    "historial_salarial": [
      {
        "sueldo_basico": 48000,
        "fecha_inicio": "2023-01-01",
        "fecha_fin": "2023-12-31"
      }
    ]
  }
}
```

---

### 6.3 Crear Empleado
```
POST /api/v1/empleados
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

REQUEST:
{
  "dni": "25654321",
  "nombre": "María",
  "apellido": "López",
  "email": "maria@empresa.com",
  "telefono": "0387-9876543",
  "direccion": "Avenida Norte 250",
  "localidad": "Salta",
  "fecha_nacimiento": "1998-03-20",
  "puesto": "Operario de Producción",
  "departamento": "Producción",
  "fecha_ingreso": "2024-01-15",
  "cuit": "20-25654321-8",
  "numero_afiliacion": "ART-654321"
}

RESPONSE 201:
{
  "success": true,
  "code": "EMPLEADO_CREADO",
  "data": {
    "id": 11,
    "dni": "25654321",
    "nombre": "María López",
    "puesto": "Operario de Producción",
    "fecha_ingreso": "2024-01-15",
    "estado": "ACTIVO"
  }
}
```

---

### 6.4 Actualizar Empleado
```
PATCH /api/v1/empleados/{id}
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

REQUEST:
{
  "puesto": "Operario Senior",
  "email": "juan_nuevo@empresa.com"
}

RESPONSE 200:
{
  "success": true,
  "data": {...}
}
```

---

### 6.5 Configurar Estructura Salarial
```
POST /api/v1/empleados/{id}/estructura-salarial
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

REQUEST:
{
  "sueldo_basico": 52000,
  "tarifa_horaria": 310,
  "bono_fijo": 2000,
  "comision_porcentaje": 0,
  "fecha_inicio": "2024-02-01"
}

RESPONSE 201:
{
  "success": true,
  "code": "ESTRUCTURA_CONFIGURADA",
  "data": {
    "empleado": "Juan García",
    "sueldo_basico": 52000,
    "tarifa_horaria": 310,
    "bono_fijo": 2000,
    "fecha_inicio": "2024-02-01",
    "reemplaza_anterior": true
  }
}
```

---

### 6.6 Listar Configuración de Aportes
```
GET /api/v1/aportes-configuracion
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "AFIP/Aportes Patronales",
      "tipo": "APORTE_PATRONAL",
      "porcentaje": 17,
      "descripcion": "Contribuciones patronales",
      "vigente_desde": "2024-01-01",
      "vigente_hasta": null,
      "activo": true
    },
    {
      "id": 2,
      "nombre": "Descuento Sindicato",
      "tipo": "DESCUENTO_NÓMINA",
      "porcentaje": 3,
      "vigente_desde": "2024-01-01",
      "activo": true
    }
  ]
}
```

---

### 6.7 Actualizar Configuración de Aportes
```
PATCH /api/v1/aportes-configuracion/{id}
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

REQUEST:
{
  "porcentaje": 18,
  "fecha_inicio": "2024-02-01"
}

RESPONSE 200:
{
  "success": true,
  "data": {
    "nombre": "AFIP/Aportes Patronales",
    "porcentaje_anterior": 17,
    "porcentaje_nuevo": 18,
    "vigente_desde": "2024-02-01"
  }
}
```

---

### 6.8 Procesar Nómina Mensual
```
POST /api/v1/nomina/procesar
Headers: Authorization: Bearer {token}
Headers: X-Role: RRHH | ADMIN

REQUEST:
{
  "mes": 1,
  "ano": 2024
}

RESPONSE 200 (procesamiento inicial):
{
  "success": true,
  "code": "NOMINA_PROCESADA",
  "data": {
    "nomina_id": 1,
    "numero_nomina": "NOM-2024-01-001",
    "periodo": "Enero 2024",
    "cantidad_empleados": 12,
    "total_haberes": 650000,
    "total_descuentos": 29500,
    "total_neto_a_pagar": 620500,
    "total_aportes_patronales": 110500,
    "costo_total_rrhh": 760500,
    "estado": "PROCESADA",
    "procesado_por": "rrhh_ana",
    "fecha_procesamiento": "2024-01-28T14:30:00Z",
    "recibos_generados": 12
  }
}
```

---

### 6.9 Obtener Recibos de Nómina
```
GET /api/v1/nomina/{nomina_id}/recibos
Headers: Authorization: Bearer {token}

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "recibo_id": 1,
      "numero_recibo": "REC-2024-01-001",
      "empleado": "Juan García",
      "periodo": "Enero 2024",
      "sueldo_basico": 50000,
      "bono_fijo": 0,
      "antiguedad_monto": 1500,
      "total_haberes": 51500,
      "aporte_sindicato": 1545,
      "descuentos_otros": 0,
      "total_descuentos": 1545,
      "neto_a_pagar": 49955,
      "aporte_patronal": 8755,
      "costo_total_empleado": 60255
    }
  ]
}
```

---

### 6.10 Descargar Recibo de Sueldo
```
GET /api/v1/nomina/recibos/{recibo_id}/descargar
Headers: Authorization: Bearer {token}

RESPONSE 200:
Archivo PDF binario

Content-Type: application/pdf
Content-Disposition: attachment; filename="REC-2024-01-001.pdf"
```

---

### 6.11 Generar Reporte de Nómina
```
GET /api/v1/nomina/{nomina_id}/reporte
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- tipo: RESUMEN | DETALLADO | ANTIGUEDAD | APORTES
- formato: JSON | PDF | EXCEL

RESPONSE 200 (JSON):
{
  "success": true,
  "data": {
    "nomina": "NOM-2024-01-001",
    "periodo": "Enero 2024",
    "resumen": {
      "cantidad_empleados": 12,
      "total_haberes": 650000,
      "total_descuentos": 29500,
      "total_neto": 620500,
      "total_aportes_patronales": 110500,
      "costo_total": 760500
    },
    "por_empleado": [...]
  }
}

RESPONSE 200 (PDF/EXCEL):
Archivo binario descargable
```

---

## 7. ENDPOINTS - MÓDULO AUDITORÍA

### 7.1 Listar Logs de Auditoría
```
GET /api/v1/auditoria/logs
Headers: Authorization: Bearer {token}
Headers: X-Role: CONTADOR | ADMIN

QUERY PARAMETERS:
- page: number
- limit: number
- fecha_inicio: ISO date
- fecha_fin: ISO date
- usuario_id: number
- accion: CREAR | EDITAR | ELIMINAR | ANULAR
- tabla: string
- modulo: string (inventario, produccion, nomina, etc.)

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "id": 5000,
      "fecha": "2024-01-28T10:30:45Z",
      "usuario": "operario_juan",
      "accion": "CREAR",
      "modulo": "inventario",
      "tabla": "movimientos_insumos",
      "registro_id": 1245,
      "descripcion": "Ingreso de Papa (100 kg)",
      "ip_origen": "192.168.1.50",
      "cambios": {
        "nuevos": {
          "cantidad": 100,
          "precio_unitario": 15.50
        }
      }
    }
  ],
  "pagination": {...}
}
```

---

### 7.2 Obtener Detalle de Cambio
```
GET /api/v1/auditoria/logs/{id}
Headers: Authorization: Bearer {token}
Headers: X-Role: CONTADOR | ADMIN

RESPONSE 200:
{
  "success": true,
  "data": {
    "id": 5000,
    "fecha": "2024-01-28T10:30:45Z",
    "usuario": "operario_juan",
    "accion": "EDITAR",
    "tabla": "insumos",
    "registro_id": 1,
    "valores_anteriores": {
      "precio_unitario": 15.50,
      "stock_minimo": 50
    },
    "valores_nuevos": {
      "precio_unitario": 16.00,
      "stock_minimo": 60
    },
    "cambios_detalles": [
      {
        "campo": "precio_unitario",
        "anterior": 15.50,
        "nuevo": 16.00
      }
    ]
  }
}
```

---

### 7.3 Historial de Precios de Insumo
```
GET /api/v1/auditoria/precios-insumo/{insumo_id}
Headers: Authorization: Bearer {token}

QUERY PARAMETERS:
- fecha_inicio: ISO date
- fecha_fin: ISO date

RESPONSE 200:
{
  "success": true,
  "data": [
    {
      "id": 1000,
      "insumo": "Papa",
      "precio_anterior": 15.50,
      "precio_nuevo": 16.00,
      "fecha_cambio": "2024-01-28T10:30:00Z",
      "cambio_por": "gerente_carlos",
      "razon": "Aumento de proveedor",
      "porcentaje_cambio": 3.23
    }
  ]
}
```

---

### 7.4 Generar Reporte de Auditoría
```
GET /api/v1/auditoria/reporte
Headers: Authorization: Bearer {token}
Headers: X-Role: CONTADOR | ADMIN

QUERY PARAMETERS:
- fecha_inicio: ISO date (requerido)
- fecha_fin: ISO date (requerido)
- tipo: COMPLETO | INVENTARIO | PRODUCCION | NOMINA | SEGURIDAD
- formato: JSON | PDF | EXCEL

RESPONSE 200 (JSON):
{
  "success": true,
  "data": {
    "periodo": "2024-01-01 a 2024-01-28",
    "tipo_reporte": "COMPLETO",
    "resumen": {
      "total_operaciones": 5000,
      "usuarios_activos": 8,
      "modulos_afectados": ["inventario", "produccion", "ventas", "nomina"],
      "cambios_criticos": 5
    },
    "operaciones_por_tipo": {
      "CREAR": 2000,
      "EDITAR": 2500,
      "ELIMINAR": 50,
      "ANULAR": 450
    },
    "operaciones_por_modulo": {...}
  }
}

RESPONSE 200 (PDF/EXCEL):
Archivo binario descargable
```

---

## 8. CÓDIGOS DE ERROR ESTÁNDAR

| Código | HTTP | Descripción |
|--------|------|-------------|
| SUCCESS | 200 | Operación exitosa |
| CREATED | 201 | Recurso creado |
| VALIDATION_ERROR | 400 | Error de validación |
| UNAUTHORIZED | 401 | No autenticado |
| FORBIDDEN | 403 | Sin permisos |
| NOT_FOUND | 404 | Recurso no encontrado |
| CONFLICT | 409 | Conflicto (ej: stock insuficiente) |
| INSUFFICIENT_STOCK | 409 | Stock insuficiente |
| INVALID_CREDENTIALS | 401 | Credenciales inválidas |
| INTERNAL_ERROR | 500 | Error interno del servidor |

---

## 9. HEADERS COMUNES

```
Authorization: Bearer {jwt_token}
X-Role: ADMIN | GERENTE | OPERARIO | RRHH | CONTADOR
Content-Type: application/json
Accept: application/json
User-Agent: {identificación del cliente}
```

---

## 10. LÍMITES Y PAGINACIÓN

```
- Límite máximo de registros por página: 500
- Límite por defecto: 50
- Máximo de registros por operación bulk: 1000
- Rate limit: 100 requests/minuto por usuario
- Rate limit (login): 5 intentos/15 minutos

Ejemplo de respuesta paginada:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

