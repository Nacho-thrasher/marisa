import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

const D = (n: number | string) => new Prisma.Decimal(n);

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  categoria?: string;
  activosSolo: boolean;
}

export async function listar(p: ListarParams) {
  const where: Prisma.ProductoWhereInput = {};
  if (p.activosSolo) where.activo = true;
  if (p.categoria) where.categoria = p.categoria;
  if (p.search) {
    where.OR = [
      { nombre: { contains: p.search, mode: 'insensitive' } },
      { codigo: { contains: p.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
      skip: p.skip,
      take: p.limit,
      include: {
        recetas: {
          where: { activa: true },
          take: 1,
          select: { codigo: true, version: true, costoTotalEsperado: true, rendimientoEsperado: true, unidadRendimiento: true },
        },
        stock: { select: { cantidadStock: true } },
      },
    }),
    prisma.producto.count({ where }),
  ]);

  const data = rows.map(({ recetas, stock, ...producto }) => ({
    ...producto,
    recetaActiva: recetas[0] ?? null,
    stockActual: stock?.cantidadStock ?? D(0),
  }));

  return { data, total };
}

export async function obtener(id: bigint) {
  const producto = await prisma.producto.findUnique({ where: { id }, include: { stock: { select: { cantidadStock: true } } } });
  if (!producto) throw AppError.notFound('Producto no encontrado');
  const { stock, ...resto } = producto;
  return { ...resto, stockActual: stock?.cantidadStock ?? D(0) };
}

export async function listarVersionesReceta(productoId: bigint) {
  const producto = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!producto) throw AppError.notFound('Producto no encontrado');

  const recetas = await prisma.receta.findMany({
    where: { productoId },
    orderBy: { version: 'desc' },
    include: { creadoPor: { select: { username: true } } },
  });

  return recetas.map((r) => ({
    receta_id: r.id,
    codigo: r.codigo,
    version: r.version,
    vigente: r.activa,
    rendimiento_esperado: r.rendimientoEsperado,
    unidad: r.unidadRendimiento,
    costo_total_esperado: r.costoTotalEsperado,
    creado_por: r.creadoPor?.username ?? null,
    fecha_creacion: r.fechaCreacion,
  }));
}

export async function obtenerReceta(productoId: bigint) {
  const receta = await prisma.receta.findFirst({
    where: { productoId, activa: true },
    include: {
      producto: true,
      detalles: { include: { insumo: true }, orderBy: { orden: 'asc' } },
    },
    orderBy: { version: 'desc' },
  });
  if (!receta) throw AppError.notFound('El producto no tiene una receta activa');

  return {
    receta_id: receta.id,
    codigo: receta.codigo,
    producto: receta.producto.nombre,
    version: receta.version,
    vigente: receta.activa,
    rendimiento_esperado: receta.rendimientoEsperado,
    unidad: receta.unidadRendimiento,
    costo_total_esperado: receta.costoTotalEsperado,
    insumos: receta.detalles.map((d) => ({
      insumo_id: d.insumoId,
      nombre: d.insumo.nombre,
      cantidad_requerida: d.cantidadRequerida,
      unidad_medida: d.unidadMedida,
      porcentaje_merma: d.porcentajeMerma,
      cantidad_con_merma: d.cantidadConMerma,
      costo_unitario: d.costoUnitario,
      costo_total: d.costoTotal,
    })),
  };
}

interface CrearProductoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  peso_gramos?: number;
  precio_venta?: number;
  precio_mayorista?: number;
  precio_revendedor?: number;
  precio_comercio?: number;
  precio_publico?: number;
}

export async function crear(req: Request, input: CrearProductoInput) {
  const producto = await prisma.producto.create({
    data: {
      codigo: input.codigo,
      nombre: input.nombre,
      descripcion: input.descripcion,
      categoria: input.categoria,
      pesoGramos: input.peso_gramos,
      precioVenta: input.precio_venta != null ? D(input.precio_venta) : null,
      precioMayorista: input.precio_mayorista != null ? D(input.precio_mayorista) : null,
      precioRevendedor: input.precio_revendedor != null ? D(input.precio_revendedor) : null,
      precioComercio: input.precio_comercio != null ? D(input.precio_comercio) : null,
      precioPublico: input.precio_publico != null ? D(input.precio_publico) : null,
    },
  });
  await audit(req, { accion: 'CREAR', modulo: 'produccion', tablaAfectada: 'productos', registroId: producto.id, valoresNuevos: input });
  return producto;
}

interface ActualizarInput {
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  peso_gramos?: number;
  activo?: boolean;
  precio_venta?: number;
  precio_mayorista?: number;
  precio_revendedor?: number;
  precio_comercio?: number;
  precio_publico?: number;
}

export async function actualizar(req: Request, id: bigint, input: ActualizarInput) {
  const actual = await prisma.producto.findUnique({ where: { id } });
  if (!actual) throw AppError.notFound('Producto no encontrado');

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
      categoria: input.categoria,
      pesoGramos: input.peso_gramos,
      activo: input.activo,
      precioVenta: input.precio_venta != null ? D(input.precio_venta) : undefined,
      precioMayorista: input.precio_mayorista != null ? D(input.precio_mayorista) : undefined,
      precioRevendedor: input.precio_revendedor != null ? D(input.precio_revendedor) : undefined,
      precioComercio: input.precio_comercio != null ? D(input.precio_comercio) : undefined,
      precioPublico: input.precio_publico != null ? D(input.precio_publico) : undefined,
    },
  });

  const accion =
    input.activo === false ? 'DESACTIVAR' : input.activo === true && !actual.activo ? 'ACTIVAR' : 'EDITAR';

  await audit(req, {
    accion,
    modulo: 'produccion',
    tablaAfectada: 'productos',
    registroId: id,
    valoresAnteriores: {
      precio_venta: actual.precioVenta,
      precio_mayorista: actual.precioMayorista,
      precio_revendedor: actual.precioRevendedor,
      precio_comercio: actual.precioComercio,
      precio_publico: actual.precioPublico,
      activo: actual.activo,
    },
    valoresNuevos: input,
  });
  return producto;
}

/**
 * Simula el costo de un producto nuevo a partir de una lista de insumos,
 * sin crearlo (caso "papas 150g que no tenemos" del cliente).
 */
export async function simularCosto(insumos: { insumo_id: number; cantidad: number }[]) {
  const ids = insumos.map((i) => BigInt(i.insumo_id));
  const catalogo = await prisma.insumo.findMany({ where: { id: { in: ids } } });
  const map = new Map(catalogo.map((i) => [i.id.toString(), i]));

  let costoTotal = D(0);
  const detalle = insumos.map((i) => {
    const insumo = map.get(String(i.insumo_id));
    if (!insumo) throw AppError.badRequest(`Insumo ${i.insumo_id} no existe`);
    const costo = insumo.costoActual.times(i.cantidad);
    costoTotal = costoTotal.plus(costo);
    return {
      insumo: insumo.nombre,
      cantidad: i.cantidad,
      unidad: insumo.unidadMedida,
      costo_unitario: insumo.costoActual,
      costo_total: costo,
    };
  });

  return { costo_total: costoTotal, detalle };
}

interface RecetaInsumoInput {
  insumo_id: number;
  cantidad_requerida: number;
  unidad_medida: string;
  porcentaje_merma?: number;
}

interface CrearRecetaInput {
  codigo: string;
  rendimiento_esperado: number;
  unidad_rendimiento: string;
  insumos: RecetaInsumoInput[];
}

export async function crearReceta(req: Request, productoId: bigint, input: CrearRecetaInput) {
  const producto = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!producto) throw AppError.notFound('Producto no encontrado');
  if (input.insumos.length === 0) throw AppError.badRequest('La receta debe tener al menos un insumo');

  const insumoIds = input.insumos.map((i) => BigInt(i.insumo_id));
  const insumos = await prisma.insumo.findMany({ where: { id: { in: insumoIds } } });
  const insumoMap = new Map(insumos.map((i) => [i.id.toString(), i]));

  // Calcular costos.
  let costoTotal = D(0);
  const detalles = input.insumos.map((det, idx) => {
    const insumo = insumoMap.get(String(det.insumo_id));
    if (!insumo) throw AppError.badRequest(`Insumo ${det.insumo_id} no existe`);
    const merma = det.porcentaje_merma ?? 0;
    const cantidadConMerma = D(det.cantidad_requerida).times(1 + merma / 100);
    const costoLinea = insumo.costoActual.times(cantidadConMerma);
    costoTotal = costoTotal.plus(costoLinea);
    return {
      insumoId: insumo.id,
      cantidadRequerida: D(det.cantidad_requerida),
      unidadMedida: det.unidad_medida,
      porcentajeMerma: D(merma),
      cantidadConMerma,
      costoUnitario: insumo.costoActual,
      costoTotal: costoLinea,
      orden: idx + 1,
    };
  });

  // Desactivar recetas previas y crear la nueva versión.
  const versionPrevia = await prisma.receta.findFirst({
    where: { productoId },
    orderBy: { version: 'desc' },
  });

  const receta = await prisma.$transaction(async (tx) => {
    await tx.receta.updateMany({ where: { productoId, activa: true }, data: { activa: false } });
    return tx.receta.create({
      data: {
        codigo: input.codigo,
        productoId,
        version: (versionPrevia?.version ?? 0) + 1,
        rendimientoEsperado: D(input.rendimiento_esperado),
        unidadRendimiento: input.unidad_rendimiento,
        costoTotalEsperado: costoTotal,
        activa: true,
        creadoPorId: BigInt(req.user!.id),
        detalles: { create: detalles },
      },
      include: { detalles: true },
    });
  });

  // Actualizar costo promedio del producto (por unidad de rendimiento).
  const costoUnitario = costoTotal.dividedBy(input.rendimiento_esperado || 1);
  await prisma.producto.update({
    where: { id: productoId },
    data: { costoPromedio: costoUnitario },
  });

  await audit(req, { accion: 'CREAR', modulo: 'produccion', tablaAfectada: 'recetas', registroId: receta.id, valoresNuevos: input });
  return receta;
}

export async function categorias() {
  const rows = await prisma.producto.groupBy({ by: ['categoria'], orderBy: { categoria: 'asc' } });
  return rows.map((r) => r.categoria);
}

/** Ajuste manual del stock de producto terminado (ej. conteo físico inicial o corrección). */
export async function ajustarStock(req: Request, id: bigint, cantidad: number, motivo?: string) {
  const producto = await prisma.producto.findUnique({ where: { id }, include: { stock: true } });
  if (!producto) throw AppError.notFound('Producto no encontrado');

  const anterior = producto.stock?.cantidadStock ?? D(0);
  const nuevo = D(cantidad);

  const stock = await prisma.stockProducto.upsert({
    where: { productoId: id },
    create: { productoId: id, cantidadStock: nuevo },
    update: { cantidadStock: nuevo },
  });

  await audit(req, {
    accion: 'AJUSTE_STOCK',
    modulo: 'produccion',
    tablaAfectada: 'stock_productos',
    registroId: id,
    valoresAnteriores: { cantidad_stock: anterior },
    valoresNuevos: { cantidad_stock: nuevo, motivo },
  });

  return { producto_id: id, stock_anterior: anterior, stock_actual: stock.cantidadStock };
}
