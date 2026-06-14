# Casos de Uso y Flujos Principales - Sistema de Gestión de Producción y Nómina

## 1. IDENTIFICACIÓN DE ACTORES

### 1.1 Actores Principales

**OPERARIO DE PRODUCCIÓN**
- Registra ingresos de materia prima
- Registra egresos de materia prima
- Registra órdenes de producción
- Consulta stock disponible
- Participa en auditoría (firmando movimientos)

**GERENTE DE PRODUCCIÓN**
- Planifica la producción
- Aprueba órdenes de producción
- Revisa reportes de producción y merma
- Gestiona recetas de productos
- Configura costos de insumos

**GERENTE DE VENTAS**
- Registra ventas
- Genera remitos/facturas
- Consulta histórico de ventas
- Revisa informes de rentabilidad

**ENCARGADO DE RECURSOS HUMANOS (RRHH)**
- Gestiona datos de empleados
- Configura estructura salarial
- Define porcentajes de aportes (AFIP, sindicales)
- Procesa nómina mensual
- Genera recibos de sueldo

**ADMINISTRADOR DEL SISTEMA**
- Gestiona usuarios y permisos
- Configura parámetros globales
- Accede a auditoría completa
- Realiza mantenimiento
- Genera todos los reportes

**CONTADOR/AUDITOR**
- Consulta auditoría de operaciones
- Revisa movimientos de insumos
- Analiza costos de producción
- Verifica cálculos de nómina
- Exporta datos para auditoría externa

---

## 2. CASOS DE USO PRINCIPALES

### 2.1 MÓDULO: GESTIÓN DE INVENTARIO

#### Caso de Uso UC-INV-001: Registrar Ingreso de Materia Prima

**Actores**: Operario, Sistema

**Precondiciones**:
- Usuario autenticado como Operario
- Insumo existe en catálogo
- Usuario tiene permiso de ingreso

**Flujo Principal**:
1. Operario selecciona "Nuevo Ingreso" en menú Inventario
2. Sistema presenta formulario de ingreso
3. Operario completa:
   - Insumo (dropdown)
   - Cantidad
   - Proveedor
   - Precio unitario
   - Número de lote
   - Fecha de vencimiento
   - Observaciones
4. Operario hace click en "Guardar"
5. Sistema valida:
   - Insumo existe
   - Cantidad > 0
   - Precio unitario >= 0
6. Sistema crea registro en movimientos_insumos tipo ENTRADA
7. Sistema actualiza stock_actual
8. Sistema registra en auditoria_logs
9. Sistema muestra confirmación
10. Sistema actualiza vista de stock en tiempo real

**Flujo Alternativo - Validación Fallida**:
- En paso 5, si validación falla:
  - Sistema muestra error específico
  - Operario corrige datos
  - Regresa a paso 4

**Postcondiciones**:
- Movimiento registrado en BD
- Stock del insumo actualizado
- Auditoria registrada

---

#### Caso de Uso UC-INV-002: Registrar Egreso de Materia Prima

**Actores**: Operario, Sistema

**Precondiciones**:
- Usuario autenticado
- Insumo existe en stock
- Cantidad solicitada <= stock disponible

**Flujo Principal**:
1. Operario selecciona "Nuevo Egreso"
2. Sistema presenta formulario
3. Operario completa:
   - Insumo
   - Cantidad a retirar
   - Motivo (producción, pérdida, devolución, ajuste)
   - Referencia (orden de producción si aplica)
   - Observaciones
4. Operario confirma
5. Sistema valida:
   - Stock disponible >= cantidad
   - Motivo es válido
   - Cantidad > 0
6. Si validación exitosa:
   - Crea movimiento SALIDA en movimientos_insumos
   - Actualiza stock_actual (resta cantidad)
   - Registra auditoria
   - Muestra confirmación

**Validación Crítica - Stock Insuficiente**:
- Si cantidad > stock:
  - Sistema muestra alerta con cantidad faltante
  - Operario puede:
    a) Reducir cantidad
    b) Cancelar operación

**Postcondiciones**:
- Movimiento registrado
- Stock actualizado
- Auditoria completa

---

#### Caso de Uso UC-INV-003: Consultar Stock y Alertas

**Actores**: Operario, Gerente

**Precondiciones**:
- Usuario autenticado

**Flujo Principal**:
1. Usuario abre módulo "Inventario" → "Stock Actual"
2. Sistema consulta vista vista_stock_actualizado
3. Sistema presenta tabla con:
   - Código y nombre del insumo
   - Stock actual
   - Unidad de medida
   - Valor del stock (cantidad × costo)
   - Estado (OK, BAJO, CRÍTICO)
   - Último movimiento
4. Usuario puede:
   - Filtrar por categoría
   - Buscar por nombre
   - Ordenar por columna
   - Hacer clic en insumo para ver historial
5. Sistema resalta en rojo insumos en estado CRÍTICO
6. Sistema muestra panel de alertas en header

**Funcionalidad Adicional - Historial**:
1. Usuario hace clic en insumo
2. Sistema abre panel lateral con:
   - Últimos 20 movimientos
   - Fecha, tipo, cantidad
   - Usuario que realizó movimiento
   - Lote/vencimiento si aplica

**Postcondiciones**:
- Usuario tiene visibilidad completa de stock
- Alertas funcionales

---

#### Caso de Uso UC-INV-004: Generar Reporte de Stock

**Actores**: Gerente, Administrador

**Precondiciones**:
- Usuario con permisos de reporte
- Hay datos de stock

**Flujo Principal**:
1. Usuario abre "Reportes" → "Stock y Movimientos"
2. Usuario selecciona rango de fecha (opcional)
3. Usuario selecciona formato (PDF, Excel)
4. Sistema:
   - Consulta movimientos_insumos en rango
   - Calcula saldo final por insumo
   - Genera tabla con:
     * Insumo
     * Stock inicial
     * Entradas (cantidad, valor)
     * Salidas (cantidad, valor)
     * Stock final
     * Variación en valor
5. Sistema genera reporte en formato seleccionado
6. Usuario descarga archivo

**Postcondiciones**:
- Reporte disponible para descarga

---

### 2.2 MÓDULO: GESTIÓN DE PRODUCCIÓN

#### Caso de Uso UC-PROD-001: Crear Orden de Producción

**Actores**: Gerente de Producción, Operario

**Precondiciones**:
- Usuario autenticado con permisos
- Producto existe
- Receta vigente existe para el producto
- Stock de materia prima suficiente

**Flujo Principal**:
1. Gerente abre "Producción" → "Nueva Orden"
2. Sistema presenta formulario
3. Gerente selecciona:
   - Producto a producir (dropdown)
4. Sistema carga automáticamente:
   - Receta vigente
   - Insumos requeridos con cantidades
   - Costo total estimado de materia prima
5. Gerente completa:
   - Cantidad a producir
   - Fecha de producción
   - Responsable (Operario)
   - Observaciones
6. Sistema calcula:
   - Cantidad de insumos necesarios (cantidad × receta)
   - Validar stock disponible para cada insumo
7. Gerente revisa y hace click "Crear Orden"
8. Sistema:
   - Crea registro en ordenes_produccion (estado: PLANIFICADA)
   - Genera número de orden único
   - Registra en auditoria
   - Notifica al responsable (si está configurado email)
   - Muestra confirmación

**Validación - Stock Insuficiente**:
- Para cualquier insumo:
  - Sistema muestra alerta con insumo y cantidad faltante
  - Gerente puede:
    a) Reducir cantidad a producir
    b) Registrar ajuste de stock primero
    c) Cancelar

**Validación - Receta No Vigente**:
- Si no hay receta vigente para el producto:
  - Sistema muestra error
  - Propone crear receta o usar versión anterior

**Postcondiciones**:
- Orden creada en estado PLANIFICADA
- Stock de insumos RESERVADO (pendiente actualización)
- Notificación enviada

---

#### Caso de Uso UC-PROD-002: Registrar Consumo en Producción

**Actores**: Operario, Gerente

**Precondiciones**:
- Orden de producción existe y está en estado PLANIFICADA
- Producción ha comenzado

**Flujo Principal**:
1. Operario abre orden de producción
2. Operario cambia estado a "EN_PROCESO"
3. Sistema presenta tabla con:
   - Insumos previsto según receta
   - Campo para ingresar cantidad REAL utilizada
   - Diferencia automática (real - previsto)
4. Operario registra:
   - Cantidad real de cada insumo utilizado
   - Cantidad producida real (puede ser diferente)
   - Defectuosos/merma
   - Observaciones de producción
5. Para cada insumo, operario puede:
   - Mantener cantidad prevista
   - Ajustar a cantidad real
   - Hacer clic en "Usar actual" para actualizar
6. Sistema calcula en tiempo real:
   - Diferencia en cantidad
   - Porcentaje de diferencia
   - Costo real vs estimado
7. Operario hace click "Completar Orden"
8. Sistema:
   - Valida cantidad producida > 0
   - Crea registros en consumo_insumos
   - Crea movimientos SALIDA para cada insumo
   - Actualiza stock_actual de insumos
   - Cambia orden a estado COMPLETADA
   - Calcula merma total
   - Registra auditoría con cambios
   - Muestra resumen de producción

**Opcionalidad - Productos Defectuosos**:
- Sistema permite registrar cantidad defectuosa
- Se resta de cantidad_producida
- Se genera nota en auditoría

**Postcondiciones**:
- Orden completada
- Insumos consumidos
- Stock actualizado
- Merma registrada
- Auditoría completa

---

#### Caso de Uso UC-PROD-003: Generar Reporte de Producción

**Actores**: Gerente, Contador

**Precondiciones**:
- Usuario con permiso de reporte
- Hay órdenes procesadas

**Flujo Principal**:
1. Usuario abre "Reportes" → "Producción"
2. Usuario selecciona:
   - Rango de fechas
   - Producto (opcional, todas si no selecciona)
   - Formato (PDF, Excel)
3. Sistema consulta:
   - ordenes_produccion en rango
   - consumo_insumos relacionados
4. Sistema calcula por cada orden:
   - Cantidad producida vs prevista
   - Merma porcentual
   - Costo actual vs estimado
   - Variación
5. Sistema calcula totales:
   - Cantidad total producida por producto
   - Merma total promedio
   - Costo total de producción
   - Eficiencia general
6. Sistema genera reporte:
   - Tabla detallada de órdenes
   - Gráficos de tendencias
   - Resumen ejecutivo
7. Usuario descarga archivo

**Postcondiciones**:
- Reporte disponible

---

### 2.3 MÓDULO: GESTIÓN DE VENTAS

#### Caso de Uso UC-VENTA-001: Registrar Venta

**Actores**: Vendedor, Gerente de Ventas, Sistema

**Precondiciones**:
- Usuario autenticado
- Producto existe en catálogo
- Stock disponible >= cantidad solicitada

**Flujo Principal**:
1. Vendedor abre "Ventas" → "Nueva Venta"
2. Sistema presenta formulario
3. Vendedor completa:
   - Cliente (nombre, CUIT si tiene)
   - Fecha de venta
   - Medio de pago (efectivo, transferencia, etc.)
4. Vendedor agrega productos:
   - Selecciona producto
   - Ingresa cantidad
   - Sistema muestra precio unitario
   - Vendedor revisa
   - Hace click "Agregar a venta"
5. Sistema:
   - Valida stock disponible
   - Calcula subtotal (cantidad × precio)
   - Suma a total
   - Actualiza en tiempo real
6. Vendedor puede:
   - Agregar más productos
   - Aplicar descuento (porcentaje o monto)
   - Revisar total
7. Vendedor hace click "Guardar Venta"
8. Sistema:
   - Crea registro en ventas
   - Crea detalles en venta_detalles
   - Descuenta stock (actualiza stock_actual)
   - Crea movimiento SALIDA para cada insumo
   - Genera número de comprobante
   - Registra auditoría
   - Muestra resumen con número de comprobante
9. Sistema ofrece opciones:
   - Ver remito
   - Descargar PDF
   - Imprimir
   - Nueva venta

**Validación - Stock Insuficiente**:
- En paso 5, si stock < cantidad:
  - Sistema muestra alerta
  - Vendedor puede reducir cantidad
  - O cancelar producto

**Postcondiciones**:
- Venta registrada
- Stock de productos actualizado
- Comprobante generado
- Auditoría registrada

---

#### Caso de Uso UC-VENTA-002: Consultar Histórico de Ventas

**Actores**: Vendedor, Gerente, Contador

**Precondiciones**:
- Usuario autenticado
- Hay ventas registradas

**Flujo Principal**:
1. Usuario abre "Ventas" → "Histórico"
2. Sistema presenta tabla con:
   - Número de comprobante
   - Fecha
   - Cliente
   - Total
   - Medio de pago
   - Estado (vigente, anulada)
3. Usuario puede:
   - Filtrar por rango de fechas
   - Buscar por cliente
   - Buscar por número de comprobante
   - Ordenar por columna
4. Usuario puede hacer clic en venta para:
   - Ver detalles (productos, cantidades, precios)
   - Descargar remito
   - Anular venta (si es autorizado)
5. Sistema presenta opciones avanzadas:
   - Exportar a Excel
   - Generar reporte de ventas

**Postcondiciones**:
- Usuario tiene visibilidad de ventas

---

### 2.4 MÓDULO: GESTIÓN DE EMPLEADOS Y NÓMINA

#### Caso de Uso UC-RRHH-001: Registrar Nuevo Empleado

**Actores**: Encargado de RRHH, Administrador

**Precondiciones**:
- Usuario con permisos de RRHH
- DNI no existe en el sistema

**Flujo Principal**:
1. RRHH abre "Empleados" → "Nuevo Empleado"
2. Sistema presenta formulario con campos:
   - DNI
   - Nombre y Apellido
   - Email
   - Teléfono
   - Dirección
   - Localidad
   - Fecha de nacimiento
   - Puesto/Rol
   - Departamento
   - Fecha de ingreso
   - CUIT (si es necesario para liquidación)
   - Número de afiliación a sindicato/obra social
3. RRHH completa formulario
4. RRHH hace click "Guardar"
5. Sistema valida:
   - DNI único
   - Formato de email válido
   - Fecha de ingreso en pasado
   - Campos requeridos completos
6. Si válido:
   - Crea registro en empleados (estado: ACTIVO)
   - Sistema asigna ID único
   - Registra auditoría
   - Muestra confirmación
7. Sistema ofrece:
   - "Configurar Salario" (ir a UC-RRHH-002)
   - "Crear Usuario de Sistema" (ir a caso crear usuario)
   - "Listo"

**Postcondiciones**:
- Empleado registrado
- Listo para configuración salarial

---

#### Caso de Uso UC-RRHH-002: Configurar Estructura Salarial de Empleado

**Actores**: Encargado de RRHH

**Precondiciones**:
- Empleado existe
- Usuario con permisos de RRHH

**Flujo Principal**:
1. RRHH abre "Empleados" → "Editar" → Empleado
2. RRHH abre sección "Estructura Salarial"
3. Sistema muestra:
   - Histórico de cambios salariales (si existen)
   - Formulario para nueva estructura
4. RRHH completa:
   - Sueldo básico
   - Tarifa horaria (opcional, para cálculo de horas extras)
   - Bono fijo (opcional)
   - Comisión % (si aplica)
   - Anticipo descuento (si aplica)
   - Fecha inicio de validez
5. Sistema sugiere:
   - Valor por hora basado en sueldo básico
   - Permite editar
6. RRHH revisa y hace click "Guardar"
7. Sistema:
   - Crea registro en estructura_salarial (vigente = TRUE)
   - Si hay estructura anterior, la marca como vigente = FALSE
   - Registra en historial_estructura_salarial
   - Registra auditoría con usuario que hizo cambio
   - Muestra confirmación

**Postcondiciones**:
- Estructura salarial configurada
- Próxima nómina usará estos valores

---

#### Caso de Uso UC-RRHH-003: Configurar Aportes y Descuentos Globales

**Actores**: Administrador, Encargado de RRHH

**Precondiciones**:
- Usuario con permisos ADMIN/RRHH
- Sistema requiere actualización de aportes

**Flujo Principal**:
1. Usuario abre "Configuración" → "Aportes y Descuentos"
2. Sistema presenta tabla con:
   - Nombre del aporte/descuento
   - Tipo (aporte patronal, descuento, antigüedad)
   - Porcentaje actual
   - Fecha de vigencia
   - Estado (activo/inactivo)
3. Usuario puede:
   - Ver detalle de cada ítem
   - Editar porcentaje (crea nueva entrada con fecha fin)
   - Agregar nuevo tipo de descuento
4. Ejemplo: "El contador me dice que AFIP es 17%"
   - Usuario busca "AFIP"
   - Hace click editar
   - Cambia de 17% a nuevo porcentaje si necesario
   - Establece fecha inicio de cambio
   - Guarda
5. Sistema:
   - Mantiene histórico de cambios
   - Valida que porcentaje sea válido (0-100)
   - Registra auditoría
   - Próximas nóminas usarán nuevo porcentaje

**Ejemplo de Configuración Típica**:
```
AFIP/Aportes Patronales: 17% (Aporte Patronal)
Sindicato: 3% (Descuento de Nómina)
Antigüedad: Variable según años (Ver escala_antiguedad)
```

**Postcondiciones**:
- Configuración actualizada
- Próximas nóminas afectadas

---

#### Caso de Uso UC-RRHH-004: Procesar Nómina Mensual

**Actores**: Encargado de RRHH, Contador

**Precondiciones**:
- Usuario con permisos de nómina
- Todos los empleados activos tienen estructura salarial
- Se han registrado asistencias del mes

**Flujo Principal**:
1. RRHH abre "Nómina" → "Procesar Nómina"
2. Sistema presenta asistente con pasos:

   **Paso 1: Seleccionar Período**
   - Mes y año (pre-llenado con mes actual)
   - Validar que no existe nómina procesada para ese mes
   - RRHH confirma

   **Paso 2: Validar Empleados**
   - Sistema lista empleados activos en el período
   - Muestra si tienen estructura salarial vigente
   - Muestra asistencia registrada
   - RRHH puede:
     * Revisar y corregir datos
     * Registrar asistencias faltantes
     * Marcar empleados fuera del período (baja/licencia)
   
   **Paso 3: Aplicar Bonificaciones/Descuentos**
   - Sistema permite agregar ajustes puntuales:
     * Bonificación extraordinaria
     * Descuento por falta
     * Anticipos de sueldo
   - Registra observación de cada ajuste
   
   **Paso 4: Revisar Cálculos**
   - Sistema calcula automáticamente para cada empleado:
   ```
   HABERES:
   - Sueldo base
   - Antigüedad (años_servicio × porcentaje_antigüedad)
   - Bonos
   - Comisiones
   - Horas extras (si hay)
   = Total Haberes (Salario Bruto)
   
   DESCUENTOS:
   - Aporte sindicato
   - Otros descuentos
   = Total Descuentos
   
   NETO A PAGAR = Total Haberes - Total Descuentos
   
   COSTO EMPRESA:
   - Total Haberes + (Total Haberes × % AFIP)
   = Costo Total Empleado
   ```
   
   - Sistema muestra:
     * Tabla por empleado con todos los cálculos
     * Totales por columna
     * Comparativa con mes anterior
   
   - RRHH puede:
     * Revisar cálculos
     * Editar valores si hay error
     * Ajustar descuentos específicos
   
   **Paso 5: Generar Recibos**
   - RRHH hace click "Procesar Nómina"
   - Sistema:
     * Crea registro en nomina_mensual
     * Para cada empleado, crea registro en recibo_sueldo
     * Genera archivo con todos los recibos en PDF
     * Registra auditoría completa
     * Cambia estado a PROCESADA
   
   **Paso 6: Exportar y Archivar**
   - Sistema ofrece:
     * Descargar nómina completa (Excel)
     * Descargar recibos individuales
     * Descargar detalle de aportes patronales
     * Ver resumen para contador
   
   - RRHH puede:
     * Descargar archivos
     * Imprimir recibos
     * Archivar nómina (marcar como lista para pagar)

3. Validación Crítica:
   - Si falta datos crítico → Sistema bloquea procesamiento
   - Si hay inconsistencias → Sistema alerta y permite revisión

**Postcondiciones**:
- Nómina procesada para el período
- Recibos generados
- Auditoría completa registrada
- Listo para pagos

---

#### Caso de Uso UC-RRHH-005: Generar Reporte de Nómina

**Actores**: RRHH, Contador, Administrador

**Precondiciones**:
- Nómina procesada para el período
- Usuario con permisos

**Flujo Principal**:
1. Usuario abre "Reportes" → "Nómina"
2. Usuario selecciona:
   - Período (mes y año)
   - Tipo de reporte (Resumen, Detallado, Antigüedad, Aportes)
   - Formato (PDF, Excel)
3. Sistema genera:
   
   **Reporte Resumen**:
   - Total salarios a pagar
   - Total descuentos
   - Total neto
   - Total aportes patronales
   - Costo total de nómina
   - Cantidad de empleados
   
   **Reporte Detallado**:
   - Por cada empleado:
     * Nombres, puesto, antigüedad
     * Sueldo base, haberes, descuentos
     * Neto a pagar
     * Aporte patronal
   
   **Reporte de Antigüedad**:
   - Empleados ordenados por antigüedad
   - Años de servicio
   - Porcentaje aplicado
   - Monto de antigüedad
   
   **Reporte de Aportes** (para AFIP):
   - Detalles de aportes patronales
   - Por empleado y total
   - Para presentación en AFIP
   
4. Usuario descarga archivo

**Postcondiciones**:
- Reporte disponible

---

### 2.5 MÓDULO: AUDITORÍA

#### Caso de Uso UC-AUDIT-001: Consultar Logs de Auditoría

**Actores**: Contador, Administrador, Auditor Externo

**Precondiciones**:
- Usuario con permisos de auditoría
- Sistema tiene registros de auditoría

**Flujo Principal**:
1. Usuario abre "Auditoría" → "Logs"
2. Sistema presenta tabla filtrable con:
   - Fecha y hora
   - Usuario que realizó acción
   - Acción (CREAR, EDITAR, ELIMINAR)
   - Tabla afectada
   - ID de registro
   - IP de origen
3. Usuario puede filtrar por:
   - Rango de fechas
   - Usuario específico
   - Tipo de acción
   - Tabla afectada
   - Módulo
4. Usuario hace clic en registro para ver:
   - Valores anteriores (JSON)
   - Valores nuevos (JSON)
   - Cambios resaltados
5. Sistema permite:
   - Descargar reporte en Excel
   - Generar reporte de período

**Postcondiciones**:
- Auditoría transparente disponible

---

#### Caso de Uso UC-AUDIT-002: Revisar Historial de Cambios de Precio

**Actores**: Contador, Gerente, Auditor

**Precondiciones**:
- Usuario con permisos
- Hay cambios de precio registrados

**Flujo Principal**:
1. Usuario abre "Auditoría" → "Historial de Precios"
2. Usuario selecciona:
   - Insumo (búsqueda)
   - O rango de fechas
3. Sistema presenta:
   - Fecha del cambio
   - Precio anterior
   - Precio nuevo
   - Cambio en porcentaje
   - Usuario que hizo cambio
   - Razón del cambio
4. Usuario puede:
   - Generar gráfico de evolución de precio
   - Exportar historial
   - Revisar impacto en costo de productos

**Postcondiciones**:
- Trazabilidad de precios transparente

---

#### Caso de Uso UC-AUDIT-003: Auditar Cálculos de Nómina

**Actores**: Contador, Auditor

**Precondiciones**:
- Nómina procesada
- Usuario con permisos de auditoría

**Flujo Principal**:
1. Auditor abre "Auditoría" → "Nómina"
2. Auditor selecciona:
   - Período a auditar
   - Empleado (opcional)
3. Sistema presenta:
   - Estructura salarial del empleado en ese período
   - Todos los cálculos realizados
   - Aportes y descuentos aplicados
   - Usuario que procesó nómina
   - Fecha de procesamiento
4. Auditor puede:
   - Recalcular manualmente (sistema compara)
   - Ver historial de cambios salariales antes de procesar
   - Verificar asistencias
   - Descargar archivos de respaldo
5. Sistema proporciona:
   - PDF con recibo
   - Desglose de cálculos
   - Configuración de aportes vigente en el período

**Postcondiciones**:
- Auditoría de nómina completada

---

## 3. DIAGRAMAS DE FLUJO PRINCIPALES

### 3.1 Flujo de Producción Completo

```
┌─────────────────────┐
│  Crear Orden        │ UC-PROD-001
│  de Producción      │
└──────────┬──────────┘
           │ Validar stock
           ├─→ Stock insuficiente → Alerta → Ajustar cantidad/Cancelar
           │
           ├→ Stock suficiente
           │
           ▼
┌─────────────────────┐
│ Reservar Insumos    │
│ (estado: Planificada)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Operario Inicia     │ UC-PROD-002
│ Producción          │
│ (estado: En proceso)│
└──────────┬──────────┘
           │
           ├─→ Registra consumo REAL de insumos
           │   (puede variar vs receta)
           │
           ├─→ Registra cantidad REAL producida
           │   (puede tener defectuosos)
           │
           ▼
┌─────────────────────┐
│ Completar Orden     │
│ Actualizar Stock    │
│ Calcular Merma      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Registrar en        │
│ Auditoría           │
│ (estado: Completada)│
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Producto Listo para │
│ Venta               │
└─────────────────────┘
```

### 3.2 Flujo de Venta

```
┌──────────────┐
│ Nueva Venta  │ UC-VENTA-001
└──────┬───────┘
       │
       ├─→ Seleccionar cliente
       │
       ├─→ Agregar productos
       │   ├─→ Validar stock > cantidad
       │   │   ├─→ Stock insuficiente → Alerta
       │   │   │
       │   │   └─→ Stock OK → Agregar
       │   │
       │   └─→ Calcular subtotal
       │
       ├─→ Aplicar descuento (opcional)
       │
       ├─→ Revisar total
       │
       ▼
┌──────────────────────┐
│ Guardar Venta        │
│ - Crear comprobante  │
│ - Descontar stock    │
│ - Registrar movimientos
│ - Auditoría          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────┐
│ Remito/Factura   │ Generar PDF
│ Generado         │ Opción: Imprimir
└──────────────────┘
```

### 3.3 Flujo de Nómina

```
┌─────────────────┐
│ Mes Actual      │ UC-RRHH-004
│ Seleccionar     │
│ Período         │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ Validar Empleados│
│ Vigentes +       │
│ Estructura       │
│ Salarial        │
└────────┬────────┘
         │ ├─→ Falta datos → Bloquear
         │ │
         └─→ Datos OK
         │
         ▼
┌──────────────────────┐
│ Registrar Asistencia │
│ (si falta)           │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Para cada empleado:  │
│                      │
│ 1. Leer estructura   │
│    salarial vigente  │
│                      │
│ 2. Calcular:         │
│    - Antigüedad      │
│    - Haberes         │
│    - Descuentos      │
│    - Neto            │
│    - Aportes         │
│                      │
│ 3. Crear Recibo      │
└────────┬─────────────┘
         │
         ▼
┌────────────────────┐
│ Generar Archivos:  │
│ - Nómina Excel     │
│ - Recibos PDF      │
│ - Aportes AFIP     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Auditoría Completa │
│ Estado: PROCESADA  │
└────────────────────┘
```

---

## 4. MATRICES DE TRAZABILIDAD

### 4.1 Matriz: Requisito → Caso de Uso

| Requisito Funcional | Caso de Uso Asociado | Estado |
|---|---|---|
| RF-MP-001 (Registrar ingreso) | UC-INV-001 | ✓ |
| RF-MP-002 (Registrar egreso) | UC-INV-002 | ✓ |
| RF-MP-003 (Mantener saldo) | UC-INV-003 | ✓ |
| RF-PROD-005 (Registrar producción) | UC-PROD-001, UC-PROD-002 | ✓ |
| RF-VENTA-001 (Registrar venta) | UC-VENTA-001 | ✓ |
| RF-EMP-001 (Datos empleados) | UC-RRHH-001 | ✓ |
| RF-SAL-001 (Estructura salarial) | UC-RRHH-002 | ✓ |
| RF-NOM-001 (Calcular nómina) | UC-RRHH-004 | ✓ |
| RF-AUDIT-001 (Registrar auditoría) | UC-AUDIT-001, UC-AUDIT-002 | ✓ |

---

## 5. ESTIMACIÓN DE ESFUERZO POR CASO DE USO

| Caso de Uso | Complejidad | Días Estimados |
|---|---|---|
| UC-INV-001 | Baja | 2 |
| UC-INV-002 | Baja | 2 |
| UC-INV-003 | Media | 3 |
| UC-PROD-001 | Media | 4 |
| UC-PROD-002 | Alta | 6 |
| UC-VENTA-001 | Media | 4 |
| UC-RRHH-001 | Baja | 2 |
| UC-RRHH-002 | Media | 3 |
| UC-RRHH-004 | Alta | 8 |
| UC-AUDIT-001 | Media | 4 |

**Total estimado**: ~40-45 días de desarrollo

