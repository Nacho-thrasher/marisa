import type { Request, Response } from 'express';
import * as service from './auditoria.service.js';
import { ok, paginated, buildPagination, parsePaging } from '../../utils/response.js';

export async function listar(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.listar({
    page,
    limit,
    skip,
    accion: req.query.accion as string | undefined,
    modulo: req.query.modulo as string | undefined,
    usuarioId: req.query.usuario_id ? Number(req.query.usuario_id) : undefined,
    fechaInicio: req.query.fecha_inicio as string | undefined,
    fechaFin: req.query.fecha_fin as string | undefined,
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function obtener(req: Request, res: Response) {
  return ok(res, await service.obtener(BigInt(req.params.id)));
}

export async function historialPrecios(req: Request, res: Response) {
  return ok(res, await service.historialPrecios(BigInt(req.params.insumoId)));
}

export async function reporte(req: Request, res: Response) {
  const fi = req.query.fecha_inicio as string;
  const ff = req.query.fecha_fin as string;
  if (!fi || !ff) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'fecha_inicio y fecha_fin son requeridos' });
  }
  return ok(res, await service.reporte(fi, ff));
}
