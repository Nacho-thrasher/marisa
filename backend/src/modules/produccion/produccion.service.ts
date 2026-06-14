import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

const D = (n: number | string) => new Prisma.Decimal(n);

/** Calcula los insumos requeridos para producir `cantidad` de un producto. */
async function calcularRequeridos(productoId: bigint, cantidad: number) {
  const receta = await prisma.receta.findFirst({
    where: { productoId, activa: true },
    include: { detalles: { include: { insumo: { include: { stock: true } } } } },
    orderBy: { version: 'desc' },
  });
  if (!receta) throw AppError.badRequest('El producto no tiene receta activa');

  const factor = D(cantidad).dividedBy(receta.rendimientoEsperado);

  const requeridos = receta.detalles.map((d) => {
    const cantidadNecesaria = (d.cantidadConMerma ?? d.cantidadRequerida).times(factor);
    const disponible = d.insumo.stock?.cantidadStock ?? D(0);
    return {
      insumo_id: d.insumoId,
      nombre: d.insumo.nombre,
      cantidad: cantidadNecesaria,
      unidad: d.unidadMedida,
      costo_unitario: d.insumo.costoActual,
      stock_disponible: disponible,
      suficiente: disponible.greaterThanOrEqualTo(cantidadNecesaria),
    };
  });

  return { receta, factor, requeridos };
}

interface CrearOrdenInput {
  producto_id: number;
  cantidad_solicitada: number;
  fecha_produccion: string;
  responsable_id?: number;
  observaciones?: string;
}

export async function crearOrden(req: Request, input: CrearOrdenInput) {
  const productoId = BigInt(input.producto_id);
  const { receta, requeridos } = await calcularRequeridos(productoId, input.cantidad_solicitada);

  const faltantes = requeridos.filter((r) => !r.suficiente);
  if (faltantes.length > 0) {
    throw AppError.conflict('INSUFFICIENT_STOCK', 'Stock insuficiente para algunos insumos', {
      insumos_faltantes: faltantes.map((f) => ({
        insumo: f.nombre,
        requerido: f.cantidad,
        disponible: f.stock_disponible,
        faltante: f.cantidad.minus(f.stock_disponible),
      })),
    });
  }

  const costoEstimado = requeridos.reduce(
    (acc, r) => acc.plus(r.costo_unitario.times(r.cantidad)),
    D(0),
  );

  const numeroOrden = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const orden = await prisma.ordenProduccion.create({
    data: {
      numeroOrden,
      productoId,
      recetaId: receta.id,
      cantidadSolicitada: D(input.cantidad_solicitada),
      fechaProduccion: new Date(input.fecha_produccion),
      estado: 'PLANIFICADA',
      responsableId: input.responsable_id != null ? BigInt(input.responsable_id) : null,
      observaciones: input.observaciones,
      creadoPorId: BigInt(req.user!.id),
    },
    include: { producto: true },
  });

  await audit(req, { accion: 'CREAR', modulo: 'produccion', tablaAfectada: 'ordenes_produccion', registroId: orden.id, valoresNuevos: input });

  return {
    orden_id: orden.id,
    numero_orden: orden.numeroOrden,
    producto: orden.producto.nombre,
    cantidad_solicitada: orden.cantidadSolicitada,
    fecha_produccion: orden.fechaProduccion,
    estado: orden.estado,
    insumos_requeridos: requeridos,
    costo_estimado: costoEstimado,
  };
}

export async function iniciar(req: Request, id: bigint) {
  const orden = await prisma.ordenProduccion.findUnique({ where: { id } });
  if (!orden) throw AppError.notFound('Orden no encontrada');
  if (orden.estado !== 'PLANIFICADA') throw AppError.badRequest('Solo se pueden iniciar órdenes planificadas');

  const updated = await prisma.ordenProduccion.update({
    where: { id },
    data: { estado: 'EN_PROCESO', horaInicio: new Date() },
  });
  await audit(req, { accion: 'EDITAR', modulo: 'produccion', tablaAfectada: 'ordenes_produccion', registroId: id, valoresNuevos: { estado: 'EN_PROCESO' } });
  return { orden_id: updated.id, estado: updated.estado, hora_inicio: updated.horaInicio };
}

interface CompletarInput {
  cantidad_producida: number;
  cantidad_defectuosa?: number;
  consumo_real: { insumo_id: number; cantidad_utilizada: number }[];
  observaciones_produccion?: string;
}

export async function completar(req: Request, id: bigint, input: CompletarInput) {
  const orden = await prisma.ordenProduccion.findUnique({
    where: { id },
    include: {
      receta: { include: { detalles: true } },
      producto: true,
    },
  });
  if (!orden) throw AppError.notFound('Orden no encontrada');
  if (orden.estado === 'COMPLETADA') throw AppError.badRequest('La orden ya está completada');
  if (orden.estado === 'CANCELADA') throw AppError.badRequest('La orden está cancelada');

  const factor = orden.cantidadSolicitada.dividedBy(orden.receta.rendimientoEsperado);
  const previstaPorInsumo = new Map(
    orden.receta.detalles.map((d) => [
      d.insumoId.toString(),
      (d.cantidadConMerma ?? d.cantidadRequerida).times(factor),
    ]),
  );

  const result = await prisma.$transaction(async (tx) => {
    let costoReal = D(0);
    const movimientos: { movimiento_id: bigint; insumo: string; cantidad: Prisma.Decimal }[] = [];

    for (const c of input.consumo_real) {
      const insumoId = BigInt(c.insumo_id);
      const insumo = await tx.insumo.findUnique({ where: { id: insumoId }, include: { stock: true } });
      if (!insumo) throw AppError.badRequest(`Insumo ${c.insumo_id} no existe`);

      const stockAnterior = insumo.stock?.cantidadStock ?? D(0);
      if (stockAnterior.lessThan(c.cantidad_utilizada)) {
        throw AppError.conflict('INSUFFICIENT_STOCK', `Stock insuficiente de ${insumo.nombre}`, {
          insumo: insumo.nombre,
          disponible: stockAnterior,
          requerido: c.cantidad_utilizada,
        });
      }
      const stockNuevo = stockAnterior.minus(c.cantidad_utilizada);
      const costoLinea = insumo.costoActual.times(c.cantidad_utilizada);
      costoReal = costoReal.plus(costoLinea);

      const mov = await tx.movimientoInsumo.create({
        data: {
          insumoId,
          tipoMovimiento: 'SALIDA',
          cantidad: D(c.cantidad_utilizada),
          cantidadAnterior: stockAnterior,
          cantidadPosterior: stockNuevo,
          precioUnitario: insumo.costoActual,
          valorTotal: costoLinea,
          fechaMovimiento: new Date(),
          motivo: 'PRODUCCION',
          referenciaId: id,
          referenciaTipo: 'orden_produccion',
          creadoPorId: BigInt(req.user!.id),
        },
      });

      await tx.stockActual.update({
        where: { insumoId },
        data: { cantidadStock: stockNuevo, valorStock: stockNuevo.times(insumo.costoActual), ultimoMovimiento: mov.fechaMovimiento },
      });

      const prevista = previstaPorInsumo.get(String(c.insumo_id)) ?? D(0);
      const diferencia = D(c.cantidad_utilizada).minus(prevista);
      const pctDif = prevista.greaterThan(0) ? diferencia.dividedBy(prevista).times(100) : D(0);

      await tx.consumoInsumo.create({
        data: {
          ordenProduccionId: id,
          insumoId,
          cantidadPrevista: prevista,
          cantidadUtilizada: D(c.cantidad_utilizada),
          diferencia,
          porcentajeDiferencia: pctDif,
          precioUnitario: insumo.costoActual,
          costoTotal: costoLinea,
          movimientoInsumoId: mov.id,
        },
      });

      movimientos.push({ movimiento_id: mov.id, insumo: insumo.nombre, cantidad: D(c.cantidad_utilizada) });
    }

    const defectuosa = input.cantidad_defectuosa ?? 0;
    const mermaPct = input.cantidad_producida > 0
      ? D(defectuosa).dividedBy(input.cantidad_producida + defectuosa).times(100)
      : D(0);

    await tx.ordenProduccion.update({
      where: { id },
      data: {
        estado: 'COMPLETADA',
        cantidadProducida: D(input.cantidad_producida),
        cantidadDefectuosa: D(defectuosa),
        horaFin: new Date(),
        observaciones: input.observaciones_produccion ?? orden.observaciones,
      },
    });

    return { costoReal, mermaPct, movimientos };
  });

  await audit(req, { accion: 'EDITAR', modulo: 'produccion', tablaAfectada: 'ordenes_produccion', registroId: id, valoresNuevos: { estado: 'COMPLETADA', cantidad_producida: input.cantidad_producida } });

  return {
    orden_id: id,
    estado: 'COMPLETADA',
    resumen: {
      cantidad_producida: input.cantidad_producida,
      merma_porcentaje: result.mermaPct,
      costo_real: result.costoReal,
    },
    movimientos_insumos: result.movimientos,
  };
}

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  estado?: string;
  productoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export async function listar(p: ListarParams) {
  const where: Prisma.OrdenProduccionWhereInput = {};
  if (p.estado) where.estado = p.estado as Prisma.OrdenProduccionWhereInput['estado'];
  if (p.productoId) where.productoId = BigInt(p.productoId);
  if (p.fechaInicio || p.fechaFin) {
    where.fechaProduccion = {};
    if (p.fechaInicio) where.fechaProduccion.gte = new Date(p.fechaInicio);
    if (p.fechaFin) where.fechaProduccion.lte = new Date(p.fechaFin);
  }

  const [rows, total] = await Promise.all([
    prisma.ordenProduccion.findMany({
      where,
      include: { producto: true, responsable: true },
      orderBy: { fechaCreacion: 'desc' },
      skip: p.skip,
      take: p.limit,
    }),
    prisma.ordenProduccion.count({ where }),
  ]);

  const data = rows.map((o) => ({
    orden_id: o.id,
    numero_orden: o.numeroOrden,
    producto: o.producto.nombre,
    cantidad_solicitada: o.cantidadSolicitada,
    cantidad_producida: o.cantidadProducida,
    fecha_produccion: o.fechaProduccion,
    estado: o.estado,
    responsable: o.responsable ? `${o.responsable.nombre} ${o.responsable.apellido}` : null,
  }));

  return { data, total };
}

export async function obtener(id: bigint) {
  const o = await prisma.ordenProduccion.findUnique({
    where: { id },
    include: {
      producto: true,
      responsable: true,
      consumos: { include: { insumo: true } },
    },
  });
  if (!o) throw AppError.notFound('Orden no encontrada');

  const costoReal = o.consumos.reduce((acc, c) => acc.plus(c.costoTotal ?? D(0)), D(0));

  return {
    orden_id: o.id,
    numero_orden: o.numeroOrden,
    producto: o.producto.nombre,
    cantidad_solicitada: o.cantidadSolicitada,
    cantidad_producida: o.cantidadProducida,
    cantidad_defectuosa: o.cantidadDefectuosa,
    fecha_produccion: o.fechaProduccion,
    estado: o.estado,
    responsable: o.responsable ? `${o.responsable.nombre} ${o.responsable.apellido}` : null,
    observaciones: o.observaciones,
    consumo_real: o.consumos.map((c) => ({
      insumo: c.insumo.nombre,
      cantidad_prevista: c.cantidadPrevista,
      cantidad_utilizada: c.cantidadUtilizada,
      diferencia: c.diferencia,
      porcentaje_diferencia: c.porcentajeDiferencia,
      costo_total: c.costoTotal,
    })),
    costo_real: costoReal,
  };
}

/** Vista previa de insumos requeridos sin crear la orden. */
export async function previsualizar(productoId: bigint, cantidad: number) {
  const { requeridos } = await calcularRequeridos(productoId, cantidad);
  const costoEstimado = requeridos.reduce((acc, r) => acc.plus(r.costo_unitario.times(r.cantidad)), D(0));
  return { insumos_requeridos: requeridos, costo_estimado: costoEstimado };
}

export async function reporte(fechaInicio: string, fechaFin: string) {
  const ordenes = await prisma.ordenProduccion.findMany({
    where: {
      estado: 'COMPLETADA',
      fechaProduccion: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
    },
    include: { producto: true, consumos: true },
  });

  const porProducto = new Map<string, { producto: string; cantidad: Prisma.Decimal; ordenes: number; costo: Prisma.Decimal }>();
  let totalProducido = D(0);
  let totalCosto = D(0);

  for (const o of ordenes) {
    const costo = o.consumos.reduce((a, c) => a.plus(c.costoTotal ?? D(0)), D(0));
    totalProducido = totalProducido.plus(o.cantidadProducida ?? D(0));
    totalCosto = totalCosto.plus(costo);
    const key = o.producto.nombre;
    const prev = porProducto.get(key) ?? { producto: key, cantidad: D(0), ordenes: 0, costo: D(0) };
    porProducto.set(key, {
      producto: key,
      cantidad: prev.cantidad.plus(o.cantidadProducida ?? D(0)),
      ordenes: prev.ordenes + 1,
      costo: prev.costo.plus(costo),
    });
  }

  return {
    periodo: `${fechaInicio} a ${fechaFin}`,
    cantidad_ordenes: ordenes.length,
    total_producido: { cantidad: totalProducido, costo: totalCosto },
    por_producto: [...porProducto.values()],
  };
}
