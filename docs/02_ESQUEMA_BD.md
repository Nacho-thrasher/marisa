# Esquema de Base de Datos - Sistema de Gestión de Producción y Nómina

## 1. MÓDULO DE MATERIA PRIMA E INSUMOS

### 1.1 Tabla: insumos
```sql
CREATE TABLE insumos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,  -- papas_fritas, panificados, servicios, etc.
    unidad_medida VARCHAR(20) NOT NULL,  -- kg, litros, unidades
    precio_unitario DECIMAL(10,2) NOT NULL,
    costo_actual DECIMAL(10,2) NOT NULL,  -- precio actualizado
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    stock_critico DECIMAL(10,2) DEFAULT 0,
    dias_vencimiento_alerta INT DEFAULT 30,
    activo BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo)
);
```

### 1.2 Tabla: movimientos_insumos (Historial de entradas y salidas)
```sql
CREATE TABLE movimientos_insumos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    insumo_id BIGINT NOT NULL,
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'PERDIDA') NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    cantidad_anterior DECIMAL(10,3),  -- para auditoría
    cantidad_posterior DECIMAL(10,3),  -- para auditoría
    precio_unitario DECIMAL(10,2),  -- precio al momento del movimiento
    valor_total DECIMAL(12,2),
    fecha_movimiento DATETIME NOT NULL,
    motivo VARCHAR(200),  -- producción, pérdida, devolución, etc.
    referencia_id BIGINT,  -- ID de producción o venta relacionada
    referencia_tipo VARCHAR(50),  -- tipo de referencia: produccion, venta, etc.
    responsable_id BIGINT,
    numero_lote VARCHAR(100),
    fecha_vencimiento DATE,
    observaciones TEXT,
    creado_por_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id),
    FOREIGN KEY (responsable_id) REFERENCES empleados(id),
    FOREIGN KEY (creado_por_id) REFERENCES usuarios(id),
    INDEX idx_insumo_fecha (insumo_id, fecha_movimiento),
    INDEX idx_tipo_movimiento (tipo_movimiento),
    INDEX idx_referencia (referencia_id, referencia_tipo)
);
```

### 1.3 Tabla: stock_actual (Vista materializada para performance)
```sql
CREATE TABLE stock_actual (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    insumo_id BIGINT UNIQUE NOT NULL,
    cantidad_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    valor_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
    ultimo_movimiento DATETIME,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id),
    INDEX idx_insumo (insumo_id)
);
```

---

## 2. MÓDULO DE PRODUCTOS

### 2.1 Tabla: productos
```sql
CREATE TABLE productos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) NOT NULL,  -- papas_fritas, panificados, etc.
    peso_gramos INT,  -- para productos por peso
    activo BOOLEAN DEFAULT TRUE,
    costo_promedio DECIMAL(10,2),  -- costo promedio calculado
    precio_venta DECIMAL(10,2),
    margen_bruto_porcentaje DECIMAL(5,2),
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo)
);
```

### 2.2 Tabla: recetas (Fórmulas de producción)
```sql
CREATE TABLE recetas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    producto_id BIGINT NOT NULL,
    version INT DEFAULT 1,
    rendimiento_esperado DECIMAL(10,3) NOT NULL,  -- cantidad que se produce
    unidad_rendimiento VARCHAR(20) NOT NULL,  -- kg, unidades, etc.
    costo_total_esperado DECIMAL(10,2),  -- suma de insumos
    activa BOOLEAN DEFAULT TRUE,
    fecha_inicio_validez DATE,
    fecha_fin_validez DATE,
    creado_por_id BIGINT,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (creado_por_id) REFERENCES usuarios(id),
    INDEX idx_producto (producto_id),
    INDEX idx_activa (activa)
);
```

### 2.3 Tabla: receta_detalles (Insumos que componen una receta)
```sql
CREATE TABLE receta_detalles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    receta_id BIGINT NOT NULL,
    insumo_id BIGINT NOT NULL,
    cantidad_requerida DECIMAL(10,3) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    porcentaje_merma DECIMAL(5,2) DEFAULT 0,  -- merma esperada en %
    cantidad_con_merma DECIMAL(10,3),  -- cantidad calculada con merma
    costo_unitario DECIMAL(10,2),  -- costo del insumo al momento de crear receta
    costo_total DECIMAL(10,2),  -- cantidad × costo
    orden INT,  -- orden de adición en la receta
    observaciones TEXT,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id),
    INDEX idx_receta (receta_id)
);
```

---

## 3. MÓDULO DE PRODUCCIÓN

### 3.1 Tabla: ordenes_produccion
```sql
CREATE TABLE ordenes_produccion (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    numero_orden VARCHAR(50) UNIQUE NOT NULL,
    producto_id BIGINT NOT NULL,
    receta_id BIGINT NOT NULL,
    cantidad_solicitada DECIMAL(10,3) NOT NULL,
    cantidad_producida DECIMAL(10,3),
    cantidad_defectuosa DECIMAL(10,3) DEFAULT 0,
    fecha_produccion DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    estado ENUM('PLANIFICADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA') DEFAULT 'PLANIFICADA',
    responsable_id BIGINT,
    observaciones TEXT,
    creado_por_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (receta_id) REFERENCES recetas(id),
    FOREIGN KEY (responsable_id) REFERENCES empleados(id),
    FOREIGN KEY (creado_por_id) REFERENCES usuarios(id),
    INDEX idx_fecha (fecha_produccion),
    INDEX idx_estado (estado),
    INDEX idx_responsable (responsable_id)
);
```

### 3.2 Tabla: consumo_insumos (Detalle de lo que se utilizó realmente)
```sql
CREATE TABLE consumo_insumos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    orden_produccion_id BIGINT NOT NULL,
    insumo_id BIGINT NOT NULL,
    cantidad_prevista DECIMAL(10,3),  -- según receta
    cantidad_utilizada DECIMAL(10,3) NOT NULL,  -- lo que realmente se usó
    diferencia DECIMAL(10,3),  -- cantidad_utilizada - cantidad_prevista
    porcentaje_diferencia DECIMAL(5,2),
    precio_unitario DECIMAL(10,2),  -- precio al momento de uso
    costo_total DECIMAL(10,2),
    movimiento_insumo_id BIGINT,  -- referencia al movimiento en insumos
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_produccion_id) REFERENCES ordenes_produccion(id),
    FOREIGN KEY (insumo_id) REFERENCES insumos(id),
    FOREIGN KEY (movimiento_insumo_id) REFERENCES movimientos_insumos(id),
    INDEX idx_orden (orden_produccion_id)
);
```

### 3.3 Tabla: resumen_produccion_diaria
```sql
CREATE TABLE resumen_produccion_diaria (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fecha_produccion DATE UNIQUE NOT NULL,
    cantidad_ordenes INT,
    costo_total_insumos DECIMAL(12,2),
    merma_total_porcentaje DECIMAL(5,2),
    observaciones TEXT,
    generado_por_id BIGINT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generado_por_id) REFERENCES usuarios(id),
    INDEX idx_fecha (fecha_produccion)
);
```

---

## 4. MÓDULO DE VENTAS

### 4.1 Tabla: ventas
```sql
CREATE TABLE ventas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    numero_comprobante VARCHAR(50) UNIQUE NOT NULL,
    tipo_comprobante ENUM('REMITO', 'FACTURA', 'NOTA_CREDITO') DEFAULT 'REMITO',
    cliente_nombre VARCHAR(200),
    cliente_cuit VARCHAR(20),
    fecha_venta DATETIME NOT NULL,
    total_bruto DECIMAL(12,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    descuento_monto DECIMAL(12,2) DEFAULT 0,
    total_neto DECIMAL(12,2) NOT NULL,
    medio_pago VARCHAR(50),  -- efectivo, transferencia, cheque, tarjeta
    registrado_por_id BIGINT NOT NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    anulada BOOLEAN DEFAULT FALSE,
    fecha_anulacion DATETIME,
    motivo_anulacion VARCHAR(200),
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id),
    INDEX idx_fecha (fecha_venta),
    INDEX idx_cliente (cliente_nombre),
    INDEX idx_anulada (anulada)
);
```

### 4.2 Tabla: venta_detalles
```sql
CREATE TABLE venta_detalles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    venta_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(10,2),  -- para calcular ganancia
    ganancia_unitaria DECIMAL(10,2),  -- precio - costo
    porcentaje_ganancia DECIMAL(5,2),
    observaciones TEXT,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    INDEX idx_venta (venta_id)
);
```

---

## 5. MÓDULO DE EMPLEADOS Y NÓMINA

### 5.1 Tabla: empleados
```sql
CREATE TABLE empleados (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    localidad VARCHAR(100),
    fecha_nacimiento DATE,
    puesto VARCHAR(100) NOT NULL,
    departamento VARCHAR(100),
    fecha_ingreso DATE NOT NULL,
    fecha_egreso DATE,
    estado ENUM('ACTIVO', 'INACTIVO', 'LICENCIA', 'EGRESADO') DEFAULT 'ACTIVO',
    cuit_empleado VARCHAR(20),
    numero_afiliacion VARCHAR(50),  -- para obra social/sindicato
    activo BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dni (dni),
    INDEX idx_estado (estado),
    INDEX idx_fecha_ingreso (fecha_ingreso)
);
```

### 5.2 Tabla: estructura_salarial
```sql
CREATE TABLE estructura_salarial (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empleado_id BIGINT NOT NULL,
    sueldo_basico DECIMAL(10,2) NOT NULL,
    tarifa_horaria DECIMAL(10,2),
    bono_fijo DECIMAL(10,2) DEFAULT 0,
    comision_porcentaje DECIMAL(5,2) DEFAULT 0,  -- si aplica
    anticipo_descuento DECIMAL(10,2) DEFAULT 0,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    vigente BOOLEAN DEFAULT TRUE,
    cambio_anterior_id BIGINT,  -- para historial
    creado_por_id BIGINT,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (cambio_anterior_id) REFERENCES estructura_salarial(id),
    FOREIGN KEY (creado_por_id) REFERENCES usuarios(id),
    INDEX idx_empleado (empleado_id),
    INDEX idx_vigente (vigente)
);
```

### 5.3 Tabla: configuracion_aportes (Valores de descuentos y aportes)
```sql
CREATE TABLE configuracion_aportes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    tipo ENUM('APORTE_PATRONAL', 'DESCUENTO_NÓMINA', 'ANTIGÜEDAD', 'BONO') NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    creado_por_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por_id) REFERENCES usuarios(id),
    INDEX idx_tipo (tipo),
    INDEX idx_activo (activo)
);
```

Ejemplo de registros:
- AFIP/Aportes patronales: 17% (tipo: APORTE_PATRONAL)
- Descuentos sindicales: 3% (tipo: DESCUENTO_NÓMINA)
- Antigüedad: 1% por año (tipo: ANTIGÜEDAD)

### 5.4 Tabla: escala_antiguedad
```sql
CREATE TABLE escala_antiguedad (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    anos_desde INT NOT NULL,
    anos_hasta INT,
    porcentaje_adicional DECIMAL(5,2) NOT NULL,
    descripcion VARCHAR(200),
    fecha_vigencia DATE,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_anos (anos_desde, anos_hasta)
);
```

Ejemplo:
- 0-1 años: 0%
- 1-5 años: 2%
- 5-10 años: 5%
- 10+ años: 10%

### 5.5 Tabla: nomina_mensual
```sql
CREATE TABLE nomina_mensual (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    numero_nomina VARCHAR(50) UNIQUE NOT NULL,
    periodo_mes INT NOT NULL,
    periodo_anio INT NOT NULL,
    fecha_procesamiento DATE,
    estado ENUM('BORRADOR', 'PROCESADA', 'PAGADA', 'CANCELADA') DEFAULT 'BORRADOR',
    procesado_por_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (procesado_por_id) REFERENCES usuarios(id),
    INDEX idx_periodo (periodo_anio, periodo_mes),
    INDEX idx_estado (estado)
);
```

### 5.6 Tabla: recibo_sueldo
```sql
CREATE TABLE recibo_sueldo (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    numero_recibo VARCHAR(50) UNIQUE NOT NULL,
    nomina_id BIGINT NOT NULL,
    empleado_id BIGINT NOT NULL,
    periodo_mes INT NOT NULL,
    periodo_anio INT NOT NULL,
    
    -- HABERES
    sueldo_basico DECIMAL(10,2),
    bono_fijo DECIMAL(10,2),
    antigüedad_monto DECIMAL(10,2),
    comisiones DECIMAL(10,2),
    horas_extras DECIMAL(10,2),
    otros_haberes DECIMAL(10,2),
    total_haberes DECIMAL(12,2),
    
    -- DESCUENTOS
    aporte_sindicato DECIMAL(10,2),
    descuento_otros DECIMAL(10,2),
    total_descuentos DECIMAL(12,2),
    
    -- CÁLCULOS
    salario_bruto DECIMAL(12,2),  -- total_haberes
    aporte_patronal DECIMAL(12,2),  -- para información
    neto_a_pagar DECIMAL(12,2),  -- salario_bruto - total_descuentos
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nomina_id) REFERENCES nomina_mensual(id),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    INDEX idx_empleado (empleado_id),
    INDEX idx_periodo (periodo_anio, periodo_mes)
);
```

### 5.7 Tabla: asistencia (Registro de horas trabajadas)
```sql
CREATE TABLE asistencia (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empleado_id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    horas_trabajadas DECIMAL(5,2),
    tipo_dia ENUM('NORMAL', 'FERIADO', 'LICENCIA', 'FALTA', 'AUSENCIA_INJUSTIFICADA') DEFAULT 'NORMAL',
    observaciones TEXT,
    registrado_por_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id),
    UNIQUE KEY uq_empleado_fecha (empleado_id, fecha),
    INDEX idx_empleado_fecha (empleado_id, fecha)
);
```

---

## 6. MÓDULO DE USUARIOS Y SEGURIDAD

### 6.1 Tabla: usuarios
```sql
CREATE TABLE usuarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,  -- ADMIN, GERENTE, OPERARIO, RRHH, CONTADOR
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login DATETIME,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
);
```

### 6.2 Tabla: permisos
```sql
CREATE TABLE permisos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    descripcion VARCHAR(200),
    modulo VARCHAR(50),  -- inventario, produccion, ventas, nomina, etc.
    accion VARCHAR(50)  -- crear, editar, ver, eliminar
);
```

### 6.3 Tabla: rol_permisos
```sql
CREATE TABLE rol_permisos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rol VARCHAR(50) NOT NULL,
    permiso_id INT NOT NULL,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id),
    UNIQUE KEY uq_rol_permiso (rol, permiso_id)
);
```

---

## 7. MÓDULO DE AUDITORÍA

### 7.1 Tabla: auditoria_logs
```sql
CREATE TABLE auditoria_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    usuario_id BIGINT,
    nombre_usuario VARCHAR(50),
    accion VARCHAR(100) NOT NULL,  -- CREAR, EDITAR, ELIMINAR, etc.
    modulo VARCHAR(50) NOT NULL,  -- inventario, produccion, etc.
    tabla_afectada VARCHAR(100),
    registro_id BIGINT,  -- ID del registro afectado
    valores_anteriores JSON,  -- estado anterior (para ediciones)
    valores_nuevos JSON,  -- estado nuevo
    ip_origen VARCHAR(45),
    user_agent TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_usuario_fecha (usuario_id, fecha_accion),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_accion (accion)
);
```

### 7.2 Tabla: historial_precios
```sql
CREATE TABLE historial_precios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    insumo_id BIGINT NOT NULL,
    precio_anterior DECIMAL(10,2),
    precio_nuevo DECIMAL(10,2) NOT NULL,
    fecha_cambio DATETIME NOT NULL,
    cambio_por_id BIGINT,
    razon_cambio VARCHAR(200),
    FOREIGN KEY (insumo_id) REFERENCES insumos(id),
    FOREIGN KEY (cambio_por_id) REFERENCES usuarios(id),
    INDEX idx_insumo_fecha (insumo_id, fecha_cambio)
);
```

### 7.3 Tabla: historial_estructura_salarial
```sql
CREATE TABLE historial_estructura_salarial (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empleado_id BIGINT NOT NULL,
    sueldo_basico_anterior DECIMAL(10,2),
    sueldo_basico_nuevo DECIMAL(10,2),
    tarifa_horaria_anterior DECIMAL(10,2),
    tarifa_horaria_nueva DECIMAL(10,2),
    fecha_cambio DATETIME NOT NULL,
    cambio_por_id BIGINT,
    razon_cambio VARCHAR(200),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (cambio_por_id) REFERENCES usuarios(id),
    INDEX idx_empleado_fecha (empleado_id, fecha_cambio)
);
```

---

## 8. VISTAS ÚTILES

### Vista: vista_stock_actualizado
```sql
CREATE VIEW vista_stock_actualizado AS
SELECT 
    i.id,
    i.codigo,
    i.nombre,
    i.unidad_medida,
    COALESCE(sa.cantidad_stock, 0) as stock_actual,
    COALESCE(sa.valor_stock, 0) as valor_stock,
    i.stock_minimo,
    i.stock_critico,
    CASE 
        WHEN sa.cantidad_stock <= i.stock_critico THEN 'CRITICO'
        WHEN sa.cantidad_stock <= i.stock_minimo THEN 'BAJO'
        ELSE 'OK'
    END as estado_stock,
    sa.ultimo_movimiento
FROM insumos i
LEFT JOIN stock_actual sa ON i.id = sa.insumo_id
WHERE i.activo = TRUE;
```

### Vista: vista_costo_productos
```sql
CREATE VIEW vista_costo_productos AS
SELECT 
    p.id,
    p.codigo,
    p.nombre,
    p.categoria,
    r.id as receta_id,
    SUM(rd.cantidad_requerida * rd.costo_unitario) as costo_total_receta,
    p.precio_venta,
    (p.precio_venta - SUM(rd.cantidad_requerida * rd.costo_unitario)) as ganancia_bruta,
    ROUND(((p.precio_venta - SUM(rd.cantidad_requerida * rd.costo_unitario)) / p.precio_venta * 100), 2) as margen_bruto_porcentaje
FROM productos p
LEFT JOIN recetas r ON p.id = r.producto_id AND r.activa = TRUE
LEFT JOIN receta_detalles rd ON r.id = rd.receta_id
GROUP BY p.id, p.codigo, p.nombre, p.categoria, r.id, p.precio_venta;
```

### Vista: vista_resumen_nomina_mes
```sql
CREATE VIEW vista_resumen_nomina_mes AS
SELECT 
    nm.numero_nomina,
    nm.periodo_mes,
    nm.periodo_anio,
    COUNT(rs.id) as cantidad_empleados,
    SUM(rs.total_haberes) as total_haberes,
    SUM(rs.aporte_patronal) as total_aportes_patronales,
    SUM(rs.neto_a_pagar) as total_neto_a_pagar,
    SUM(rs.total_haberes) + SUM(rs.aporte_patronal) as costo_total_rrhh
FROM nomina_mensual nm
LEFT JOIN recibo_sueldo rs ON nm.id = rs.nomina_id
GROUP BY nm.id, nm.numero_nomina, nm.periodo_mes, nm.periodo_anio;
```

---

## 9. RELACIONES PRINCIPALES

```
insumos ──→ movimientos_insumos
         ──→ receta_detalles
         ──→ consumo_insumos
         ──→ historial_precios

productos ──→ recetas ──→ receta_detalles ──→ insumos
          ──→ ordenes_produccion
          ──→ venta_detalles

ordenes_produccion ──→ consumo_insumos ──→ movimientos_insumos
                   ──→ resumen_produccion_diaria

ventas ──→ venta_detalles ──→ productos

empleados ──→ estructura_salarial
           ──→ recibo_sueldo ──→ nomina_mensual
           ──→ asistencia
           ──→ historial_estructura_salarial

usuarios ──→ auditoria_logs
          ──→ rol_permisos ──→ permisos

configuracion_aportes ──→ recibo_sueldo (referencia lógica)
```

---

## 10. ÍNDICES ESTRATÉGICOS

Los índices fueron incluidos en las definiciones de tabla para optimizar:
- Búsquedas por fecha (fundamental para reportes)
- Búsquedas por estado
- Búsquedas por usuario/empleado
- Búsquedas por producto/insumo
- Queries de auditoría

