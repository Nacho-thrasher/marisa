-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'GERENTE', 'OPERARIO', 'RRHH', 'CONTADOR');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'PERDIDA');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PLANIFICADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('REMITO', 'FACTURA', 'NOTA_CREDITO');

-- CreateEnum
CREATE TYPE "EstadoEmpleado" AS ENUM ('ACTIVO', 'INACTIVO', 'LICENCIA', 'EGRESADO');

-- CreateEnum
CREATE TYPE "TipoAporte" AS ENUM ('APORTE_PATRONAL', 'DESCUENTO_NOMINA', 'ANTIGUEDAD', 'BONO');

-- CreateEnum
CREATE TYPE "EstadoNomina" AS ENUM ('BORRADOR', 'PROCESADA', 'PAGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDia" AS ENUM ('NORMAL', 'FERIADO', 'LICENCIA', 'FALTA', 'AUSENCIA_INJUSTIFICADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(200),
    "modulo" VARCHAR(50),
    "accion" VARCHAR(50),

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "id" BIGSERIAL NOT NULL,
    "rol" "Rol" NOT NULL,
    "permiso_id" INTEGER NOT NULL,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos" (
    "id" BIGSERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "categoria" VARCHAR(100) NOT NULL,
    "unidad_medida" VARCHAR(20) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "costo_actual" DECIMAL(10,2) NOT NULL,
    "stock_minimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock_critico" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dias_vencimiento_alerta" INTEGER NOT NULL DEFAULT 30,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_insumos" (
    "id" BIGSERIAL NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "tipo_movimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "cantidad_anterior" DECIMAL(10,3),
    "cantidad_posterior" DECIMAL(10,3),
    "precio_unitario" DECIMAL(10,2),
    "valor_total" DECIMAL(12,2),
    "fecha_movimiento" TIMESTAMP(3) NOT NULL,
    "motivo" VARCHAR(200),
    "referencia_id" BIGINT,
    "referencia_tipo" VARCHAR(50),
    "responsable_id" BIGINT,
    "numero_lote" VARCHAR(100),
    "fecha_vencimiento" DATE,
    "observaciones" TEXT,
    "creado_por_id" BIGINT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_actual" (
    "id" BIGSERIAL NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "cantidad_stock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "valor_stock" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ultimo_movimiento" TIMESTAMP(3),
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_actual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" BIGSERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "categoria" VARCHAR(100) NOT NULL,
    "peso_gramos" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "costo_promedio" DECIMAL(10,2),
    "precio_venta" DECIMAL(10,2),
    "margen_bruto_porcentaje" DECIMAL(5,2),
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
    "id" BIGSERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "rendimiento_esperado" DECIMAL(10,3) NOT NULL,
    "unidad_rendimiento" VARCHAR(20) NOT NULL,
    "costo_total_esperado" DECIMAL(10,2),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio_validez" DATE,
    "fecha_fin_validez" DATE,
    "creado_por_id" BIGINT,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receta_detalles" (
    "id" BIGSERIAL NOT NULL,
    "receta_id" BIGINT NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "cantidad_requerida" DECIMAL(10,3) NOT NULL,
    "unidad_medida" VARCHAR(20) NOT NULL,
    "porcentaje_merma" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cantidad_con_merma" DECIMAL(10,3),
    "costo_unitario" DECIMAL(10,2),
    "costo_total" DECIMAL(10,2),
    "orden" INTEGER,
    "observaciones" TEXT,

    CONSTRAINT "receta_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_produccion" (
    "id" BIGSERIAL NOT NULL,
    "numero_orden" VARCHAR(50) NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "receta_id" BIGINT NOT NULL,
    "cantidad_solicitada" DECIMAL(10,3) NOT NULL,
    "cantidad_producida" DECIMAL(10,3),
    "cantidad_defectuosa" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "fecha_produccion" DATE NOT NULL,
    "hora_inicio" TIME,
    "hora_fin" TIME,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PLANIFICADA',
    "responsable_id" BIGINT,
    "observaciones" TEXT,
    "creado_por_id" BIGINT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumo_insumos" (
    "id" BIGSERIAL NOT NULL,
    "orden_produccion_id" BIGINT NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "cantidad_prevista" DECIMAL(10,3),
    "cantidad_utilizada" DECIMAL(10,3) NOT NULL,
    "diferencia" DECIMAL(10,3),
    "porcentaje_diferencia" DECIMAL(5,2),
    "precio_unitario" DECIMAL(10,2),
    "costo_total" DECIMAL(10,2),
    "movimiento_insumo_id" BIGINT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumo_insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumen_produccion_diaria" (
    "id" BIGSERIAL NOT NULL,
    "fecha_produccion" DATE NOT NULL,
    "cantidad_ordenes" INTEGER,
    "costo_total_insumos" DECIMAL(12,2),
    "merma_total_porcentaje" DECIMAL(5,2),
    "observaciones" TEXT,
    "generado_por_id" BIGINT,
    "fecha_generacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumen_produccion_diaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" BIGSERIAL NOT NULL,
    "numero_comprobante" VARCHAR(50) NOT NULL,
    "tipo_comprobante" "TipoComprobante" NOT NULL DEFAULT 'REMITO',
    "cliente_nombre" VARCHAR(200),
    "cliente_cuit" VARCHAR(20),
    "fecha_venta" TIMESTAMP(3) NOT NULL,
    "total_bruto" DECIMAL(12,2) NOT NULL,
    "descuento_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuento_monto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_neto" DECIMAL(12,2) NOT NULL,
    "medio_pago" VARCHAR(50),
    "registrado_por_id" BIGINT NOT NULL,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_anulacion" TIMESTAMP(3),
    "motivo_anulacion" VARCHAR(200),

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_detalles" (
    "id" BIGSERIAL NOT NULL,
    "venta_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "costo_unitario" DECIMAL(10,2),
    "ganancia_unitaria" DECIMAL(10,2),
    "porcentaje_ganancia" DECIMAL(5,2),
    "observaciones" TEXT,

    CONSTRAINT "venta_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" BIGSERIAL NOT NULL,
    "dni" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "direccion" TEXT,
    "localidad" VARCHAR(100),
    "fecha_nacimiento" DATE,
    "puesto" VARCHAR(100) NOT NULL,
    "departamento" VARCHAR(100),
    "fecha_ingreso" DATE NOT NULL,
    "fecha_egreso" DATE,
    "estado" "EstadoEmpleado" NOT NULL DEFAULT 'ACTIVO',
    "cuit_empleado" VARCHAR(20),
    "numero_afiliacion" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estructura_salarial" (
    "id" BIGSERIAL NOT NULL,
    "empleado_id" BIGINT NOT NULL,
    "sueldo_basico" DECIMAL(10,2) NOT NULL,
    "tarifa_horaria" DECIMAL(10,2),
    "bono_fijo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "comision_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "anticipo_descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "cambio_anterior_id" BIGINT,
    "creado_por_id" BIGINT,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estructura_salarial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_aportes" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "tipo" "TipoAporte" NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_por_id" BIGINT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_aportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escala_antiguedad" (
    "id" BIGSERIAL NOT NULL,
    "anos_desde" INTEGER NOT NULL,
    "anos_hasta" INTEGER,
    "porcentaje_adicional" DECIMAL(5,2) NOT NULL,
    "descripcion" VARCHAR(200),
    "fecha_vigencia" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "escala_antiguedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomina_mensual" (
    "id" BIGSERIAL NOT NULL,
    "numero_nomina" VARCHAR(50) NOT NULL,
    "periodo_mes" INTEGER NOT NULL,
    "periodo_anio" INTEGER NOT NULL,
    "fecha_procesamiento" DATE,
    "estado" "EstadoNomina" NOT NULL DEFAULT 'BORRADOR',
    "procesado_por_id" BIGINT,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nomina_mensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recibo_sueldo" (
    "id" BIGSERIAL NOT NULL,
    "numero_recibo" VARCHAR(50) NOT NULL,
    "nomina_id" BIGINT NOT NULL,
    "empleado_id" BIGINT NOT NULL,
    "periodo_mes" INTEGER NOT NULL,
    "periodo_anio" INTEGER NOT NULL,
    "sueldo_basico" DECIMAL(10,2),
    "bono_fijo" DECIMAL(10,2),
    "antiguedad_monto" DECIMAL(10,2),
    "comisiones" DECIMAL(10,2),
    "horas_extras" DECIMAL(10,2),
    "otros_haberes" DECIMAL(10,2),
    "total_haberes" DECIMAL(12,2),
    "aporte_sindicato" DECIMAL(10,2),
    "descuento_otros" DECIMAL(10,2),
    "total_descuentos" DECIMAL(12,2),
    "salario_bruto" DECIMAL(12,2),
    "aporte_patronal" DECIMAL(12,2),
    "neto_a_pagar" DECIMAL(12,2),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recibo_sueldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencia" (
    "id" BIGSERIAL NOT NULL,
    "empleado_id" BIGINT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_entrada" TIME,
    "hora_salida" TIME,
    "horas_trabajadas" DECIMAL(5,2),
    "tipo_dia" "TipoDia" NOT NULL DEFAULT 'NORMAL',
    "observaciones" TEXT,
    "registrado_por_id" BIGINT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT,
    "nombre_usuario" VARCHAR(50),
    "accion" VARCHAR(100) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "tabla_afectada" VARCHAR(100),
    "registro_id" BIGINT,
    "valores_anteriores" JSONB,
    "valores_nuevos" JSONB,
    "ip_origen" VARCHAR(45),
    "user_agent" TEXT,
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_precios" (
    "id" BIGSERIAL NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "precio_anterior" DECIMAL(10,2),
    "precio_nuevo" DECIMAL(10,2) NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL,
    "cambio_por_id" BIGINT,
    "razon_cambio" VARCHAR(200),

    CONSTRAINT "historial_precios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estructura_salarial" (
    "id" BIGSERIAL NOT NULL,
    "empleado_id" BIGINT NOT NULL,
    "sueldo_basico_anterior" DECIMAL(10,2),
    "sueldo_basico_nuevo" DECIMAL(10,2),
    "tarifa_horaria_anterior" DECIMAL(10,2),
    "tarifa_horaria_nueva" DECIMAL(10,2),
    "fecha_cambio" TIMESTAMP(3) NOT NULL,
    "cambio_por_id" BIGINT,
    "razon_cambio" VARCHAR(200),

    CONSTRAINT "historial_estructura_salarial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permisos_rol_permiso_id_key" ON "rol_permisos"("rol", "permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "insumos_codigo_key" ON "insumos"("codigo");

-- CreateIndex
CREATE INDEX "insumos_categoria_idx" ON "insumos"("categoria");

-- CreateIndex
CREATE INDEX "insumos_activo_idx" ON "insumos"("activo");

-- CreateIndex
CREATE INDEX "movimientos_insumos_insumo_id_fecha_movimiento_idx" ON "movimientos_insumos"("insumo_id", "fecha_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_insumos_tipo_movimiento_idx" ON "movimientos_insumos"("tipo_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_insumos_referencia_id_referencia_tipo_idx" ON "movimientos_insumos"("referencia_id", "referencia_tipo");

-- CreateIndex
CREATE UNIQUE INDEX "stock_actual_insumo_id_key" ON "stock_actual"("insumo_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE INDEX "productos_categoria_idx" ON "productos"("categoria");

-- CreateIndex
CREATE INDEX "productos_activo_idx" ON "productos"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_codigo_key" ON "recetas"("codigo");

-- CreateIndex
CREATE INDEX "recetas_producto_id_idx" ON "recetas"("producto_id");

-- CreateIndex
CREATE INDEX "recetas_activa_idx" ON "recetas"("activa");

-- CreateIndex
CREATE INDEX "receta_detalles_receta_id_idx" ON "receta_detalles"("receta_id");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_produccion_numero_orden_key" ON "ordenes_produccion"("numero_orden");

-- CreateIndex
CREATE INDEX "ordenes_produccion_fecha_produccion_idx" ON "ordenes_produccion"("fecha_produccion");

-- CreateIndex
CREATE INDEX "ordenes_produccion_estado_idx" ON "ordenes_produccion"("estado");

-- CreateIndex
CREATE INDEX "ordenes_produccion_responsable_id_idx" ON "ordenes_produccion"("responsable_id");

-- CreateIndex
CREATE INDEX "consumo_insumos_orden_produccion_id_idx" ON "consumo_insumos"("orden_produccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "resumen_produccion_diaria_fecha_produccion_key" ON "resumen_produccion_diaria"("fecha_produccion");

-- CreateIndex
CREATE INDEX "resumen_produccion_diaria_fecha_produccion_idx" ON "resumen_produccion_diaria"("fecha_produccion");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_numero_comprobante_key" ON "ventas"("numero_comprobante");

-- CreateIndex
CREATE INDEX "ventas_fecha_venta_idx" ON "ventas"("fecha_venta");

-- CreateIndex
CREATE INDEX "ventas_cliente_nombre_idx" ON "ventas"("cliente_nombre");

-- CreateIndex
CREATE INDEX "ventas_anulada_idx" ON "ventas"("anulada");

-- CreateIndex
CREATE INDEX "venta_detalles_venta_id_idx" ON "venta_detalles"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_dni_key" ON "empleados"("dni");

-- CreateIndex
CREATE INDEX "empleados_dni_idx" ON "empleados"("dni");

-- CreateIndex
CREATE INDEX "empleados_estado_idx" ON "empleados"("estado");

-- CreateIndex
CREATE INDEX "empleados_fecha_ingreso_idx" ON "empleados"("fecha_ingreso");

-- CreateIndex
CREATE INDEX "estructura_salarial_empleado_id_idx" ON "estructura_salarial"("empleado_id");

-- CreateIndex
CREATE INDEX "estructura_salarial_vigente_idx" ON "estructura_salarial"("vigente");

-- CreateIndex
CREATE INDEX "configuracion_aportes_tipo_idx" ON "configuracion_aportes"("tipo");

-- CreateIndex
CREATE INDEX "configuracion_aportes_activo_idx" ON "configuracion_aportes"("activo");

-- CreateIndex
CREATE INDEX "escala_antiguedad_anos_desde_anos_hasta_idx" ON "escala_antiguedad"("anos_desde", "anos_hasta");

-- CreateIndex
CREATE UNIQUE INDEX "nomina_mensual_numero_nomina_key" ON "nomina_mensual"("numero_nomina");

-- CreateIndex
CREATE INDEX "nomina_mensual_periodo_anio_periodo_mes_idx" ON "nomina_mensual"("periodo_anio", "periodo_mes");

-- CreateIndex
CREATE INDEX "nomina_mensual_estado_idx" ON "nomina_mensual"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "recibo_sueldo_numero_recibo_key" ON "recibo_sueldo"("numero_recibo");

-- CreateIndex
CREATE INDEX "recibo_sueldo_empleado_id_idx" ON "recibo_sueldo"("empleado_id");

-- CreateIndex
CREATE INDEX "recibo_sueldo_periodo_anio_periodo_mes_idx" ON "recibo_sueldo"("periodo_anio", "periodo_mes");

-- CreateIndex
CREATE INDEX "asistencia_empleado_id_fecha_idx" ON "asistencia"("empleado_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asistencia_empleado_id_fecha_key" ON "asistencia"("empleado_id", "fecha");

-- CreateIndex
CREATE INDEX "auditoria_logs_usuario_id_fecha_accion_idx" ON "auditoria_logs"("usuario_id", "fecha_accion");

-- CreateIndex
CREATE INDEX "auditoria_logs_tabla_afectada_idx" ON "auditoria_logs"("tabla_afectada");

-- CreateIndex
CREATE INDEX "auditoria_logs_accion_idx" ON "auditoria_logs"("accion");

-- CreateIndex
CREATE INDEX "historial_precios_insumo_id_fecha_cambio_idx" ON "historial_precios"("insumo_id", "fecha_cambio");

-- CreateIndex
CREATE INDEX "historial_estructura_salarial_empleado_id_fecha_cambio_idx" ON "historial_estructura_salarial"("empleado_id", "fecha_cambio");

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_insumos" ADD CONSTRAINT "movimientos_insumos_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_insumos" ADD CONSTRAINT "movimientos_insumos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_insumos" ADD CONSTRAINT "movimientos_insumos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_actual" ADD CONSTRAINT "stock_actual_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_detalles" ADD CONSTRAINT "receta_detalles_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_detalles" ADD CONSTRAINT "receta_detalles_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_insumos" ADD CONSTRAINT "consumo_insumos_orden_produccion_id_fkey" FOREIGN KEY ("orden_produccion_id") REFERENCES "ordenes_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_insumos" ADD CONSTRAINT "consumo_insumos_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_insumos" ADD CONSTRAINT "consumo_insumos_movimiento_insumo_id_fkey" FOREIGN KEY ("movimiento_insumo_id") REFERENCES "movimientos_insumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estructura_salarial" ADD CONSTRAINT "estructura_salarial_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estructura_salarial" ADD CONSTRAINT "estructura_salarial_cambio_anterior_id_fkey" FOREIGN KEY ("cambio_anterior_id") REFERENCES "estructura_salarial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estructura_salarial" ADD CONSTRAINT "estructura_salarial_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina_mensual" ADD CONSTRAINT "nomina_mensual_procesado_por_id_fkey" FOREIGN KEY ("procesado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibo_sueldo" ADD CONSTRAINT "recibo_sueldo_nomina_id_fkey" FOREIGN KEY ("nomina_id") REFERENCES "nomina_mensual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibo_sueldo" ADD CONSTRAINT "recibo_sueldo_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estructura_salarial" ADD CONSTRAINT "historial_estructura_salarial_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
