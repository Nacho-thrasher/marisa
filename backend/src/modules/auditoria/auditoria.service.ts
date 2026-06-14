import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  accion?: string;
  modulo?: string;
  usuarioId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export async function listar(p: ListarParams) {
  const where: Prisma.AuditoriaLogWhereInput = {};
  if (p.accion) where.accion = p.accion;
  if (p.modulo) where.modulo = p.modulo;
  if (p.usuarioId) where.usuarioId = BigInt(p.usuarioId);
  if (p.fechaInicio || p.fechaFin) {
    where.fechaAccion = {};
    if (p.fechaInicio) where.fechaAccion.gte = new Date(p.fechaInicio);
    if (p.fechaFin) where.fechaAccion.lte = new Date(p.fechaFin);
  }

  const [rows, total] = await Promise.all([
    prisma.auditoriaLog.findMany({ where, orderBy: { fechaAccion: 'desc' }, skip: p.skip, take: p.limit }),
    prisma.auditoriaLog.count({ where }),
  ]);

  const data = rows.map((l) => ({
    id: l.id,
    fecha: l.fechaAccion,
    usuario: l.nombreUsuario,
    accion: l.accion,
    modulo: l.modulo,
    tabla: l.tablaAfectada,
    registro_id: l.registroId,
    ip_origen: l.ipOrigen,
  }));

  return { data, total };
}

export async function obtener(id: bigint) {
  const l = await prisma.auditoriaLog.findUnique({ where: { id } });
  if (!l) throw AppError.notFound('Registro de auditoría no encontrado');
  return {
    id: l.id,
    fecha: l.fechaAccion,
    usuario: l.nombreUsuario,
    accion: l.accion,
    modulo: l.modulo,
    tabla: l.tablaAfectada,
    registro_id: l.registroId,
    valores_anteriores: l.valoresAnteriores,
    valores_nuevos: l.valoresNuevos,
    ip_origen: l.ipOrigen,
    user_agent: l.userAgent,
  };
}

export async function historialPrecios(insumoId: bigint) {
  const rows = await prisma.historialPrecio.findMany({
    where: { insumoId },
    include: { insumo: true },
    orderBy: { fechaCambio: 'desc' },
  });

  return rows.map((h) => {
    const anterior = h.precioAnterior ?? new Prisma.Decimal(0);
    const pct = anterior.greaterThan(0) ? h.precioNuevo.minus(anterior).dividedBy(anterior).times(100) : null;
    return {
      id: h.id,
      insumo: h.insumo.nombre,
      precio_anterior: h.precioAnterior,
      precio_nuevo: h.precioNuevo,
      fecha_cambio: h.fechaCambio,
      razon: h.razonCambio,
      porcentaje_cambio: pct,
    };
  });
}

export async function reporte(fechaInicio: string, fechaFin: string) {
  const where: Prisma.AuditoriaLogWhereInput = {
    fechaAccion: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
  };
  const logs = await prisma.auditoriaLog.findMany({ where });

  const porTipo: Record<string, number> = {};
  const porModulo: Record<string, number> = {};
  const usuarios = new Set<string>();

  for (const l of logs) {
    porTipo[l.accion] = (porTipo[l.accion] ?? 0) + 1;
    porModulo[l.modulo] = (porModulo[l.modulo] ?? 0) + 1;
    if (l.nombreUsuario) usuarios.add(l.nombreUsuario);
  }

  return {
    periodo: `${fechaInicio} a ${fechaFin}`,
    resumen: {
      total_operaciones: logs.length,
      usuarios_activos: usuarios.size,
      modulos_afectados: Object.keys(porModulo),
    },
    operaciones_por_tipo: porTipo,
    operaciones_por_modulo: porModulo,
  };
}
