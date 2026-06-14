import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

const D = (n: number | string) => new Prisma.Decimal(n);

interface CrearVentaInput {
  cliente_nombre?: string;
  cliente_cuit?: string;
  fecha_venta?: string;
  medio_pago?: string;
  descuento_porcentaje?: number;
  observaciones?: string;
  detalles: { producto_id: number; cantidad: number; precio_unitario: number }[];
}

export async function crear(req: Request, input: CrearVentaInput) {
  if (input.detalles.length === 0) throw AppError.badRequest('La venta debe tener al menos un producto');

  const productoIds = input.detalles.map((d) => BigInt(d.producto_id));
  const productos = await prisma.producto.findMany({ where: { id: { in: productoIds } } });
  const map = new Map(productos.map((p) => [p.id.toString(), p]));

  let totalBruto = D(0);
  const detalles = input.detalles.map((d) => {
    const prod = map.get(String(d.producto_id));
    if (!prod) throw AppError.badRequest(`Producto ${d.producto_id} no existe`);
    const subtotal = D(d.precio_unitario).times(d.cantidad);
    const costoUnit = prod.costoPromedio ?? D(0);
    const gananciaUnit = D(d.precio_unitario).minus(costoUnit);
    const pctGanancia = d.precio_unitario > 0 ? gananciaUnit.dividedBy(d.precio_unitario).times(100) : D(0);
    totalBruto = totalBruto.plus(subtotal);
    return {
      productoId: prod.id,
      cantidad: D(d.cantidad),
      precioUnitario: D(d.precio_unitario),
      subtotal,
      costoUnitario: costoUnit,
      gananciaUnitaria: gananciaUnit,
      porcentajeGanancia: pctGanancia,
    };
  });

  const descPct = input.descuento_porcentaje ?? 0;
  const descMonto = totalBruto.times(descPct).dividedBy(100);
  const totalNeto = totalBruto.minus(descMonto);
  const numero = `REM-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const venta = await prisma.venta.create({
    data: {
      numeroComprobante: numero,
      tipoComprobante: 'REMITO',
      clienteNombre: input.cliente_nombre,
      clienteCuit: input.cliente_cuit,
      fechaVenta: input.fecha_venta ? new Date(input.fecha_venta) : new Date(),
      totalBruto,
      descuentoPorcentaje: D(descPct),
      descuentoMonto: descMonto,
      totalNeto,
      medioPago: input.medio_pago,
      registradoPorId: BigInt(req.user!.id),
      observaciones: input.observaciones,
      detalles: { create: detalles },
    },
    include: { detalles: { include: { producto: true } } },
  });

  await audit(req, { accion: 'CREAR', modulo: 'ventas', tablaAfectada: 'ventas', registroId: venta.id, valoresNuevos: { numero, total: totalNeto } });

  const gananciaBruta = venta.detalles.reduce(
    (acc, d) => acc.plus((d.gananciaUnitaria ?? D(0)).times(d.cantidad)),
    D(0),
  );

  return {
    venta_id: venta.id,
    numero_comprobante: venta.numeroComprobante,
    cliente: venta.clienteNombre,
    fecha: venta.fechaVenta,
    detalles: venta.detalles.map((d) => ({
      producto: d.producto.nombre,
      cantidad: d.cantidad,
      precio_unitario: d.precioUnitario,
      subtotal: d.subtotal,
    })),
    total_bruto: venta.totalBruto,
    descuento: venta.descuentoMonto,
    total_neto: venta.totalNeto,
    ganancia_bruta: gananciaBruta,
  };
}

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  cliente?: string;
  soloVigentes?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
}

export async function listar(p: ListarParams) {
  const where: Prisma.VentaWhereInput = {};
  if (p.soloVigentes) where.anulada = false;
  if (p.cliente) where.clienteNombre = { contains: p.cliente, mode: 'insensitive' };
  if (p.fechaInicio || p.fechaFin) {
    where.fechaVenta = {};
    if (p.fechaInicio) where.fechaVenta.gte = new Date(p.fechaInicio);
    if (p.fechaFin) where.fechaVenta.lte = new Date(p.fechaFin);
  }

  const [rows, total] = await Promise.all([
    prisma.venta.findMany({
      where,
      include: { _count: { select: { detalles: true } } },
      orderBy: { fechaVenta: 'desc' },
      skip: p.skip,
      take: p.limit,
    }),
    prisma.venta.count({ where }),
  ]);

  const data = rows.map((v) => ({
    venta_id: v.id,
    numero_comprobante: v.numeroComprobante,
    cliente: v.clienteNombre,
    fecha: v.fechaVenta,
    total: v.totalNeto,
    productos_cantidad: v._count.detalles,
    medio_pago: v.medioPago,
    estado: v.anulada ? 'ANULADA' : 'VIGENTE',
  }));

  return { data, total };
}

export async function obtener(id: bigint) {
  const v = await prisma.venta.findUnique({
    where: { id },
    include: { detalles: { include: { producto: true } }, registradoPor: { select: { username: true } } },
  });
  if (!v) throw AppError.notFound('Venta no encontrada');

  return {
    venta_id: v.id,
    numero_comprobante: v.numeroComprobante,
    cliente: v.clienteNombre,
    cuit: v.clienteCuit,
    fecha: v.fechaVenta,
    estado: v.anulada ? 'ANULADA' : 'VIGENTE',
    detalles: v.detalles.map((d) => ({
      producto: d.producto.nombre,
      cantidad: d.cantidad,
      precio_unitario: d.precioUnitario,
      subtotal: d.subtotal,
      ganancia_unitaria: d.gananciaUnitaria,
    })),
    total_bruto: v.totalBruto,
    descuento: v.descuentoMonto,
    total_neto: v.totalNeto,
    medio_pago: v.medioPago,
    registrado_por: v.registradoPor.username,
    anulada: v.anulada,
    motivo_anulacion: v.motivoAnulacion,
  };
}

export async function anular(req: Request, id: bigint, motivo: string) {
  const v = await prisma.venta.findUnique({ where: { id } });
  if (!v) throw AppError.notFound('Venta no encontrada');
  if (v.anulada) throw AppError.badRequest('La venta ya está anulada');

  const updated = await prisma.venta.update({
    where: { id },
    data: { anulada: true, fechaAnulacion: new Date(), motivoAnulacion: motivo },
  });
  await audit(req, { accion: 'ANULAR', modulo: 'ventas', tablaAfectada: 'ventas', registroId: id, valoresNuevos: { motivo } });
  return { venta_id: updated.id, estado: 'ANULADA', fecha_anulacion: updated.fechaAnulacion, motivo };
}

export async function resumen(fechaInicio?: string, fechaFin?: string) {
  const where: Prisma.VentaWhereInput = { anulada: false };
  if (fechaInicio || fechaFin) {
    where.fechaVenta = {};
    if (fechaInicio) where.fechaVenta.gte = new Date(fechaInicio);
    if (fechaFin) where.fechaVenta.lte = new Date(fechaFin);
  }
  const ventas = await prisma.venta.findMany({ where, include: { detalles: true } });

  let totalVendido = D(0);
  let gananciaTotal = D(0);
  for (const v of ventas) {
    totalVendido = totalVendido.plus(v.totalNeto);
    for (const d of v.detalles) {
      gananciaTotal = gananciaTotal.plus((d.gananciaUnitaria ?? D(0)).times(d.cantidad));
    }
  }

  return {
    cantidad_ventas: ventas.length,
    total_vendido: totalVendido,
    ganancia_total: gananciaTotal,
  };
}
