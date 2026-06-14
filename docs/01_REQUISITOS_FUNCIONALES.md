# Requisitos Funcionales - Sistema de Gestión de Producción y Nómina

## 1. Módulo de Gestión de Materia Prima e Insumos

### 1.1 Inventario de Materia Prima
**RF-MP-001**: El sistema debe permitir registrar el ingreso de materia prima con los siguientes datos:
- Identificación única del insumo
- Nombre del insumo
- Unidad de medida (kg, litros, unidades)
- Cantidad ingresada
- Fecha de ingreso
- Proveedor
- Precio unitario
- Lote/Número de identificación
- Fecha de vencimiento (si aplica)

**RF-MP-002**: El sistema debe permitir registrar el egreso de materia prima con:
- Identificación del insumo
- Cantidad utilizada
- Fecha de egreso
- Producto generado
- Responsable del retiro
- Motivo del retiro (producción, pérdida, devolución, etc.)

**RF-MP-003**: El sistema debe mantener un saldo actualizado de cada materia prima:
- Cantidad en stock
- Valor del stock
- Alertas de stock bajo (configurable por insumo)
- Alertas de próximo vencimiento

### 1.2 Catálogo de Materia Prima e Insumos
**RF-MP-004**: El sistema debe mantener un catálogo con clasificación de insumos:
- Papas fritas: papa, aceite, sal, envase
- Panificados: harina, grasa, azúcar, sal, levadura, aceite, malta, antimoho, aditivos, envase
- PrePizza: harina, grasa, aceite, salsa, azúcar, sal, levadura, vinagre, antimoho, alcohol, envase
- Chatas: grasa, harina, levadura
- Palitos salados: grasa, harina, sal, levadura, envase
- Maní: maní, sal, envase
- Chizos y Puflitos: envase
- Servicios: luz, gas, agua, impuestos

**RF-MP-005**: Cada insumo debe tener un costo unitario configurable y actualizable.

---

## 2. Módulo de Gestión de Productos

### 2.1 Catálogo de Productos
**RF-PROD-001**: El sistema debe mantener un catálogo de productos finales con:
- Identificación única del producto
- Nombre y descripción
- Peso/tamaño del producto
- Categoría (papas fritas, panificados, etc.)
- Composición (qué materia prima utiliza)

**RF-PROD-002**: Productos permitidos en el sistema:
- Papas fritas: 45gr, 90gr, 190gr, 500gr, 850gr, 1kg
- Palitos: 100gr, 250gr, 500gr, 1kg
- Maní: 90gr, 190gr, 500gr, 1kg
- Chizitos y Puflitos: 150gr, 300gr, 1kg
- Mix cervecero: 90gr, 190gr, 500gr
- PrePizza común
- PrePizza especial
- Pan de hamburguesa grande
- Pan de hamburguesa chica
- Pan de Viena
- Pan de patynesa
- Chatas con semillas
- Chatas simples

### 2.2 Recetas/Fórmulas de Producción
**RF-PROD-003**: El sistema debe permitir definir recetas con:
- Identificación de la receta
- Producto asociado
- Matriz de insumos requeridos (insumo + cantidad)
- Rendimiento esperado
- Fecha de validez

**RF-PROD-004**: El sistema debe calcular automáticamente el costo de producción:
- Costo total de materia prima por unidad
- Costo prorrateado de servicios (luz, gas, agua)
- Costo de impuestos asignado
- Costo total de producto

### 2.3 Registro de Producción
**RF-PROD-005**: El sistema debe permitir registrar la producción diaria con:
- Fecha de producción
- Producto elaborado
- Cantidad producida
- Insumos utilizados (con trazabilidad)
- Responsable de la producción
- Merma/desperdicio reportado
- Observaciones

**RF-PROD-006**: El sistema debe validar que:
- Haya suficiente materia prima disponible
- Se respete la fórmula de la receta
- Se registre la salida de materia prima automáticamente

**RF-PROD-007**: El sistema debe calcularse automáticamente:
- Diferencia entre insumos esperados vs reales
- Porcentaje de merma
- Costo total de la producción

---

## 3. Módulo de Ventas

### 3.1 Registro de Ventas
**RF-VENTA-001**: El sistema debe permitir registrar ventas con:
- Identificación de la venta
- Productos vendidos (producto + cantidad)
- Fecha de venta
- Cliente
- Precio de venta unitario
- Descuento (si aplica)
- Total de venta
- Medio de pago

**RF-VENTA-002**: El sistema debe permitir:
- Generar remitos/comprobantes
- Agrupar ventas por período
- Listar ventas por cliente

### 3.2 Reportes de Ventas
**RF-VENTA-003**: El sistema debe generar reportes de:
- Ventas por producto (cantidad y monto)
- Ventas por período (diario, semanal, mensual)
- Clientes principales
- Productos más vendidos
- Margen de ganancia por producto

---

## 4. Módulo de Gestión de Empleados y Nómina

### 4.1 Registro de Empleados
**RF-EMP-001**: El sistema debe mantener información de empleados:
- Identificación única (DNI, nombre)
- Puesto/rol
- Fecha de ingreso
- Antigüedad calculada automáticamente
- Estado (activo, inactivo, licencia)
- Datos de contacto

### 4.2 Estructura Salarial
**RF-SAL-001**: El sistema debe permitir configurar:
- Sueldo básico por empleado
- Tarifa horaria
- Bonificaciones fijas
- Comisiones (si aplica)

**RF-SAL-002**: El sistema debe soportar cargas sociales/aportes:
- Porcentaje de AFIP/contribuciones patronales (configurable)
- Porcentaje de descuentos de nómina (sindicales, etc.)
- Antigüedad como porcentaje adicional (configurable)
- Otros descuentos específicos

**RF-SAL-003**: El sistema debe permitir definir bonificaciones por antigüedad:
- Porcentaje adicional por años de servicio
- Topes máximos (si aplica)

### 4.3 Cálculo de Nómina
**RF-NOM-001**: El sistema debe calcular automáticamente:
- Salario bruto = Sueldo base + bonificaciones + comisiones + antigüedad
- Aportes patronales = Salario bruto × % AFIP
- Descuentos de nómina = Salario bruto × % descuentos
- Neto a pagar = Salario bruto - Descuentos
- Costo total empleado = Salario bruto + Aportes patronales

**RF-NOM-002**: El sistema debe generar recibos de sueldo con:
- Período de liquidación
- Salario bruto
- Descuentos especificados
- Neto a pagar
- Fecha de pago

### 4.4 Procesamiento de Nómina Mensual
**RF-NOM-003**: El sistema debe permitir:
- Generar nómina mensual completa
- Aplicar cambios en tarifa horaria
- Registrar ausentismos/licencias
- Calcular proporcionales en altas/bajas

**RF-NOM-004**: El sistema debe generar reportes de:
- Total de salarios a pagar por mes
- Total de aportes patronales
- Resumen por empleado
- Comparativas mensuales

---

## 5. Módulo de Auditoría e Historial

### 5.1 Trazabilidad General
**RF-AUDIT-001**: El sistema debe registrar automáticamente:
- Quién realizó cada acción (usuario)
- Qué acción se realizó
- Cuándo se realizó (fecha y hora)
- Valores anteriores y nuevos (en caso de cambios)
- Dirección IP del usuario

**RF-AUDIT-002**: El sistema debe mantener un historial de:
- Cambios de precio de materia prima
- Cambios de recetas
- Cambios en estructura salarial
- Anulaciones/modificaciones de comprobantes
- Movimientos de inventario

### 5.2 Reportes de Auditoría
**RF-AUDIT-003**: El sistema debe generar reportes de:
- Movimientos de un insumo específico (entrada/salida)
- Cambios en la estructura de costos
- Cambios en datos de empleados
- Acciones por usuario
- Operaciones por período

---

## 6. Módulo de Seguridad y Control de Acceso

### 6.1 Autenticación y Autorización
**RF-SEG-001**: El sistema debe implementar roles con permisos específicos:
- Administrador: acceso total
- Gerente: gestión de producción, ventas y reportes
- Operario: registro de producción e inventario
- Recursos Humanos: gestión de empleados y nómina
- Contador: acceso a reportes financieros y auditoría

**RF-SEG-002**: El sistema debe permitir:
- Login con usuario y contraseña
- Cambio de contraseña
- Recuperación de contraseña

### 6.2 Control de Cambios Críticos
**RF-SEG-003**: Ciertas operaciones requieren autorización adicional:
- Eliminación de comprobantes
- Cambios en estructura salarial
- Modificación de recetas de producción

---

## 7. Módulo de Reportes y Análisis

### 7.1 Reportes de Producción
**RF-REP-001**: El sistema debe generar:
- Producción diaria por producto
- Producción mensual con acumulado
- Análisis de merma por producto
- Eficiencia de producción

### 7.2 Reportes Financieros
**RF-REP-002**: El sistema debe generar:
- Estado de costo de producción
- Margen por producto
- Rentabilidad por línea de producto
- Análisis de gastos operativos

### 7.3 Reportes de Recursos Humanos
**RF-REP-003**: El sistema debe generar:
- Resumen de nómina mensual
- Proyección de costos de personal
- Antigüedad de empleados
- Movimientos de personal (altas/bajas)

---

## 8. Requisitos No Funcionales

**RNF-001**: El sistema debe ser accesible desde navegador web (desktop y mobile responsive)

**RNF-002**: El sistema debe mantener integridad referencial entre módulos

**RNF-003**: El sistema debe soportar mínimo 50 usuarios concurrentes

**RNF-004**: Tiempo de respuesta: máximo 2 segundos en operaciones normales

**RNF-005**: El sistema debe realizar backups automáticos diariamente

**RNF-006**: El sistema debe generar reportes en PDF y Excel

**RNF-007**: Cumplimiento con regulaciones laborales argentinas (AFIP, ART, etc.)

**RNF-008**: Los datos deben ser encriptados en tránsito (HTTPS)

**RNF-009**: Las contraseñas deben cumplir políticas de seguridad mínimas

**RNF-010**: El sistema debe mantener logs de acceso y operaciones por mínimo 2 años
