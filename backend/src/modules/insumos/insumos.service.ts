import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

const D = (n: number | string) => new Prisma.Decimal(n);

// ───────────────────────── Listado / detalle ─────────────────────────

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  categoria?: string;
  stockBajo?: boolean;
  activosSolo: boolean;
}

export async function listar(p: ListarParams) {
  const where: Prisma.InsumoWhereInput = {};
  if (p.activosSolo) where.activo = true;
  if (p.categoria) where.categoria = p.categoria;
  if (p.search) {
    where.OR = [
      { nombre: { contains: p.search, mode: 'insensitive' } },
      { codigo: { contains: p.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.insumo.findMany({
      where,
      include: { stock: true },
      orderBy: { nombre: 'asc' },
      skip: p.skip,
      take: p.limit,
    }),
    prisma.insumo.count({ where }),
  ]);

  let data = rows.map((i) => ({
    id: i.id,
    codigo: i.codigo,
    nombre: i.nombre,
    categoria: i.categoria,
    unidad_medida: i.unidadMedida,
    precio_unitario: i.precioUnitario,
    costo_actual: i.costoActual,
    stock_minimo: i.stockMinimo,
    stock_critico: i.stockCritico,
    stock_actual: i.stock?.cantidadStock ?? D(0),
    estado_stock: estadoStock(i.stock?.cantidadStock ?? D(0), i.stockMinimo, i.stockCritico),
    activo: i.activo,
  }));

  // El filtro de stock bajo se aplica en memoria (depende del join con stock).
  if (p.stockBajo) data = data.filter((d) => d.estado_stock !== 'OK');

  return { data, total };
}

export async function obtener(id: bigint) {
  const insumo = await prisma.insumo.findUnique({
    where: { id },
    include: {
      stock: true,
      movimientos: { orderBy: { fechaMovimiento: 'desc' }, take: 1 },
    },
  });
  if (!insumo) throw AppError.notFound('Insumo no encontrado');

  const cantidad = insumo.stock?.cantidadStock ?? D(0);
  const ultimo = insumo.movimientos[0];

  return {
    id: insumo.id,
    codigo: insumo.codigo,
    nombre: insumo.nombre,
    descripcion: insumo.descripcion,
    categoria: insumo.categoria,
    unidad_medida: insumo.unidadMedida,
    precio_unitario: insumo.precioUnitario,
    costo_actual: insumo.costoActual,
    stock_minimo: insumo.stockMinimo,
    stock_critico: insumo.stockCritico,
    dias_vencimiento_alerta: insumo.diasVencimientoAlerta,
    activo: insumo.activo,
    observaciones: insumo.observaciones,
    stock_actual: {
      cantidad,
      valor: insumo.stock?.valorStock ?? D(0),
      estado: estadoStock(cantidad, insumo.stockMinimo, insumo.stockCritico),
    },
    ultimo_movimiento: ultimo
      ? { fecha: ultimo.fechaMovimiento, tipo: ultimo.tipoMovimiento, cantidad: ultimo.cantidad }
      : null,
  };
}

// ───────────────────────── Crear / actualizar ─────────────────────────

interface CrearInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  unidad_medida: string;
  precio_unitario: number;
  stock_minimo?: number;
  stock_critico?: number;
  dias_vencimiento_alerta?: number;
  observaciones?: string;
}

export async function crear(req: Request, input: CrearInput) {
  const existe = await prisma.insumo.findUnique({ where: { codigo: input.codigo } });
  if (existe) {
    throw AppError.badRequest('Datos inválidos', [
      { field: 'codigo', message: 'Ya existe insumo con este código' },
    ]);
  }

  const insumo = await prisma.insumo.create({
    data: {
      codigo: input.codigo,
      nombre: input.nombre,
      descripcion: input.descripcion,
      categoria: input.categoria,
      unidadMedida: input.unidad_medida,
      precioUnitario: D(input.precio_unitario),
      costoActual: D(input.precio_unitario),
      stockMinimo: D(input.stock_minimo ?? 0),
      stockCritico: D(input.stock_critico ?? 0),
      diasVencimientoAlerta: input.dias_vencimiento_alerta ?? 30,
      observaciones: input.observaciones,
      stock: { create: { cantidadStock: D(0), valorStock: D(0) } },
    },
  });

  await audit(req, {
    accion: 'CREAR',
    modulo: 'inventario',
    tablaAfectada: 'insumos',
    registroId: insumo.id,
    valoresNuevos: input,
  });

  return insumo;
}

interface ActualizarInput {
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  unidad_medida?: string;
  precio_unitario?: number;
  stock_minimo?: number;
  stock_critico?: number;
  dias_vencimiento_alerta?: number;
  observaciones?: string;
  razon_cambio_precio?: string;
}

export async function actualizar(req: Request, id: bigint, input: ActualizarInput) {
  const actual = await prisma.insumo.findUnique({ where: { id } });
  if (!actual) throw AppError.notFound('Insumo no encontrado');

  const cambiaPrecio =
    input.precio_unitario != null && !actual.precioUnitario.equals(D(input.precio_unitario));

  const insumo = await prisma.$transaction(async (tx) => {
    const updated = await tx.insumo.update({
      where: { id },
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion,
        categoria: input.categoria,
        unidadMedida: input.unidad_medida,
        precioUnitario: input.precio_unitario != null ? D(input.precio_unitario) : undefined,
        costoActual: input.precio_unitario != null ? D(input.precio_unitario) : undefined,
        stockMinimo: input.stock_minimo != null ? D(input.stock_minimo) : undefined,
        stockCritico: input.stock_critico != null ? D(input.stock_critico) : undefined,
        diasVencimientoAlerta: input.dias_vencimiento_alerta,
        observaciones: input.observaciones,
      },
    });

    // Historial de precios (RF-AUDIT-002).
    if (cambiaPrecio) {
      await tx.historialPrecio.create({
        data: {
          insumoId: id,
          precioAnterior: actual.precioUnitario,
          precioNuevo: D(input.precio_unitario!),
          fechaCambio: new Date(),
          cambioPorId: req.user ? BigInt(req.user.id) : null,
          razonCambio: input.razon_cambio_precio ?? 'Actualización de precio',
        },
      });
    }

    return updated;
  });

  await audit(req, {
    accion: 'EDITAR',
    modulo: 'inventario',
    tablaAfectada: 'insumos',
    registroId: id,
    valoresAnteriores: { precio_unitario: actual.precioUnitario },
    valoresNuevos: input,
  });

  return insumo;
}

// ───────────────────────── Movimientos de stock ─────────────────────────

interface IngresoInput {
  cantidad: number;
  precio_unitario?: number;
  proveedor?: string;
  numero_lote?: string;
  fecha_vencimiento?: string;
  observaciones?: string;
}

export async function registrarIngreso(req: Request, id: bigint, input: IngresoInput) {
  if (input.cantidad <= 0) {
    throw AppError.badRequest('Datos inválidos', [
      { field: 'cantidad', message: 'Debe ser mayor a 0' },
    ]);
  }

  const insumo = await prisma.insumo.findUnique({ where: { id }, include: { stock: true } });
  if (!insumo) throw AppError.notFound('Insumo no encontrado');

  const precio = D(input.precio_unitario ?? Number(insumo.costoActual));
  const stockAnterior = insumo.stock?.cantidadStock ?? D(0);
  const stockNuevo = stockAnterior.plus(input.cantidad);
  const valorMovimiento = precio.times(input.cantidad);

  const movimiento = await prisma.$transaction(async (tx) => {
    const mov = await tx.movimientoInsumo.create({
      data: {
        insumoId: id,
        tipoMovimiento: 'ENTRADA',
        cantidad: D(input.cantidad),
        cantidadAnterior: stockAnterior,
        cantidadPosterior: stockNuevo,
        precioUnitario: precio,
        valorTotal: valorMovimiento,
        fechaMovimiento: new Date(),
        motivo: input.proveedor ? `Compra a ${input.proveedor}` : 'Ingreso de stock',
        numeroLote: input.numero_lote,
        fechaVencimiento: input.fecha_vencimiento ? new Date(input.fecha_vencimiento) : null,
        observaciones: input.observaciones,
        creadoPorId: BigInt(req.user!.id),
      },
    });

    await tx.stockActual.upsert({
      where: { insumoId: id },
      create: {
        insumoId: id,
        cantidadStock: stockNuevo,
        valorStock: stockNuevo.times(precio),
        ultimoMovimiento: mov.fechaMovimiento,
      },
      update: {
        cantidadStock: stockNuevo,
        valorStock: stockNuevo.times(precio),
        ultimoMovimiento: mov.fechaMovimiento,
      },
    });

    return mov;
  });

  await audit(req, {
    accion: 'CREAR',
    modulo: 'inventario',
    tablaAfectada: 'movimientos_insumos',
    registroId: movimiento.id,
    valoresNuevos: { tipo: 'ENTRADA', cantidad: input.cantidad },
  });

  return {
    movimiento_id: movimiento.id,
    tipo: 'ENTRADA',
    cantidad: input.cantidad,
    stock_anterior: stockAnterior,
    stock_nuevo: stockNuevo,
    valor_movimiento: valorMovimiento,
    fecha: movimiento.fechaMovimiento,
  };
}

interface EgresoInput {
  cantidad: number;
  motivo?: string;
  referencia_id?: number;
  referencia_tipo?: string;
  observaciones?: string;
}

export async function registrarEgreso(req: Request, id: bigint, input: EgresoInput) {
  if (input.cantidad <= 0) {
    throw AppError.badRequest('Datos inválidos', [
      { field: 'cantidad', message: 'Debe ser mayor a 0' },
    ]);
  }

  const insumo = await prisma.insumo.findUnique({ where: { id }, include: { stock: true } });
  if (!insumo) throw AppError.notFound('Insumo no encontrado');

  const stockAnterior = insumo.stock?.cantidadStock ?? D(0);
  if (stockAnterior.lessThan(input.cantidad)) {
    throw AppError.conflict('INSUFFICIENT_STOCK', 'Stock insuficiente', {
      stock_disponible: stockAnterior,
      cantidad_solicitada: input.cantidad,
      faltante: D(input.cantidad).minus(stockAnterior),
    });
  }

  const precio = insumo.costoActual;
  const stockNuevo = stockAnterior.minus(input.cantidad);

  const movimiento = await prisma.$transaction(async (tx) => {
    const mov = await tx.movimientoInsumo.create({
      data: {
        insumoId: id,
        tipoMovimiento: 'SALIDA',
        cantidad: D(input.cantidad),
        cantidadAnterior: stockAnterior,
        cantidadPosterior: stockNuevo,
        precioUnitario: precio,
        valorTotal: precio.times(input.cantidad),
        fechaMovimiento: new Date(),
        motivo: input.motivo ?? 'Egreso de stock',
        referenciaId: input.referencia_id != null ? BigInt(input.referencia_id) : null,
        referenciaTipo: input.referencia_tipo,
        observaciones: input.observaciones,
        creadoPorId: BigInt(req.user!.id),
      },
    });

    await tx.stockActual.update({
      where: { insumoId: id },
      data: {
        cantidadStock: stockNuevo,
        valorStock: stockNuevo.times(precio),
        ultimoMovimiento: mov.fechaMovimiento,
      },
    });

    return mov;
  });

  await audit(req, {
    accion: 'CREAR',
    modulo: 'inventario',
    tablaAfectada: 'movimientos_insumos',
    registroId: movimiento.id,
    valoresNuevos: { tipo: 'SALIDA', cantidad: input.cantidad, motivo: input.motivo },
  });

  return {
    movimiento_id: movimiento.id,
    tipo: 'SALIDA',
    cantidad: input.cantidad,
    stock_anterior: stockAnterior,
    stock_nuevo: stockNuevo,
    fecha: movimiento.fechaMovimiento,
  };
}

// ───────────────────────── Consultas auxiliares ─────────────────────────

interface MovimientosParams {
  page: number;
  limit: number;
  skip: number;
  fechaInicio?: string;
  fechaFin?: string;
  tipo?: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'PERDIDA';
}

export async function movimientos(id: bigint, p: MovimientosParams) {
  const where: Prisma.MovimientoInsumoWhereInput = { insumoId: id };
  if (p.tipo) where.tipoMovimiento = p.tipo;
  if (p.fechaInicio || p.fechaFin) {
    where.fechaMovimiento = {};
    if (p.fechaInicio) where.fechaMovimiento.gte = new Date(p.fechaInicio);
    if (p.fechaFin) where.fechaMovimiento.lte = new Date(p.fechaFin);
  }

  const [rows, total] = await Promise.all([
    prisma.movimientoInsumo.findMany({
      where,
      include: { creadoPor: { select: { username: true } } },
      orderBy: { fechaMovimiento: 'desc' },
      skip: p.skip,
      take: p.limit,
    }),
    prisma.movimientoInsumo.count({ where }),
  ]);

  const data = rows.map((m) => ({
    id: m.id,
    tipo: m.tipoMovimiento,
    cantidad: m.cantidad,
    precio_unitario: m.precioUnitario,
    valor_total: m.valorTotal,
    fecha: m.fechaMovimiento,
    motivo: m.motivo,
    usuario: m.creadoPor.username,
    observaciones: m.observaciones,
  }));

  return { data, total };
}

export async function resumenStock() {
  const insumos = await prisma.insumo.findMany({
    where: { activo: true },
    include: { stock: true },
    orderBy: { nombre: 'asc' },
  });

  let valorTotal = D(0);
  let alerta = 0;
  let criticos = 0;

  const detalles = insumos.map((i) => {
    const cantidad = i.stock?.cantidadStock ?? D(0);
    const valor = i.stock?.valorStock ?? D(0);
    const estado = estadoStock(cantidad, i.stockMinimo, i.stockCritico);
    valorTotal = valorTotal.plus(valor);
    if (estado === 'CRITICO') criticos++;
    else if (estado === 'BAJO') alerta++;
    return {
      insumo_id: i.id,
      nombre: i.nombre,
      cantidad,
      valor,
      estado,
    };
  });

  return {
    total_insumos: insumos.length,
    valor_total_stock: valorTotal,
    insumos_alerta: alerta,
    insumos_criticos: criticos,
    detalles,
  };
}

export async function categorias() {
  const rows = await prisma.insumo.groupBy({ by: ['categoria'], orderBy: { categoria: 'asc' } });
  return rows.map((r) => r.categoria);
}

// ───────────────────────── Helpers ─────────────────────────

function estadoStock(
  cantidad: Prisma.Decimal,
  minimo: Prisma.Decimal,
  critico: Prisma.Decimal,
): 'OK' | 'BAJO' | 'CRITICO' {
  if (cantidad.lessThanOrEqualTo(critico)) return 'CRITICO';
  if (cantidad.lessThanOrEqualTo(minimo)) return 'BAJO';
  return 'OK';
}
