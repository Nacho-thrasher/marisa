import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

const D = (n: number | string) => new Prisma.Decimal(n);

interface CrearVentaInput {
  cliente_nombre?: string;
  cliente_cuit?: string;
  cliente_id?: number;
  vendedor_id?: number;
  lista_precio?: string;
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
      listaPrecio: input.lista_precio ? (input.lista_precio as Prisma.VentaCreateInput['listaPrecio']) : undefined,
      clienteId: input.cliente_id != null ? BigInt(input.cliente_id) : null,
      vendedorId: input.vendedor_id != null ? BigInt(input.vendedor_id) : null,
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

export async function datosRemito(id: bigint) {
  const v = await prisma.venta.findUnique({
    where: { id },
    include: { detalles: { include: { producto: true } }, cliente: true, vendedor: true },
  });
  if (!v) throw AppError.notFound('Venta no encontrada');
  return {
    numero: v.numeroComprobante,
    fecha: v.fechaVenta,
    cliente: v.cliente?.nombre ?? v.clienteNombre,
    cuit: v.clienteCuit,
    vendedor: v.vendedor?.nombre ?? null,
    listaPrecio: v.listaPrecio,
    detalles: v.detalles.map((d) => ({
      producto: d.producto.nombre,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal,
    })),
    totalBruto: v.totalBruto,
    descuento: v.descuentoMonto,
    totalNeto: v.totalNeto,
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

/**
 * Reporte mensual estilo planilla "MENSUAL" del Excel del cliente:
 * cuánto vendió cada vendedor (monto y unidades) y matriz producto × vendedor.
 */
export async function reporteMensual(mes: number, anio: number) {
  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 1);

  const ventas = await prisma.venta.findMany({
    where: { anulada: false, fechaVenta: { gte: desde, lt: hasta } },
    include: { vendedor: true, detalles: { include: { producto: true } } },
  });

  const porVendedor = new Map<string, { vendedor: string; ventas: number; unidades: Prisma.Decimal; monto: Prisma.Decimal }>();
  const productos = new Set<string>();
  // matriz[producto][vendedor] = unidades
  const matriz = new Map<string, Map<string, Prisma.Decimal>>();
  let totalMonto = D(0);

  for (const v of ventas) {
    const vend = v.vendedor?.nombre ?? 'Sin vendedor';
    const pv = porVendedor.get(vend) ?? { vendedor: vend, ventas: 0, unidades: D(0), monto: D(0) };
    pv.ventas += 1;
    pv.monto = pv.monto.plus(v.totalNeto);
    totalMonto = totalMonto.plus(v.totalNeto);
    for (const d of v.detalles) {
      pv.unidades = pv.unidades.plus(d.cantidad);
      const prod = d.producto.nombre;
      productos.add(prod);
      if (!matriz.has(prod)) matriz.set(prod, new Map());
      const fila = matriz.get(prod)!;
      fila.set(vend, (fila.get(vend) ?? D(0)).plus(d.cantidad));
    }
    porVendedor.set(vend, pv);
  }

  const vendedores = [...porVendedor.keys()].sort();
  const matrizArray = [...productos].sort().map((prod) => ({
    producto: prod,
    por_vendedor: Object.fromEntries(vendedores.map((vd) => [vd, matriz.get(prod)?.get(vd) ?? D(0)])),
    total: vendedores.reduce((a, vd) => a.plus(matriz.get(prod)?.get(vd) ?? D(0)), D(0)),
  }));

  return {
    periodo: `${String(mes).padStart(2, '0')}/${anio}`,
    total_monto: totalMonto,
    por_vendedor: [...porVendedor.values()].sort((a, b) => Number(b.monto) - Number(a.monto)),
    vendedores,
    matriz: matrizArray,
  };
}
