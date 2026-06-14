import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './produccion.service.js';
import { ok, created, paginated, buildPagination, parsePaging } from '../../utils/response.js';

const crearOrdenSchema = z.object({
  producto_id: z.number().int(),
  cantidad_solicitada: z.number().positive(),
  fecha_produccion: z.string().min(1),
  responsable_id: z.number().int().optional(),
  observaciones: z.string().optional(),
});

export async function crearOrden(req: Request, res: Response) {
  const input = crearOrdenSchema.parse(req.body);
  return created(res, await service.crearOrden(req, input), 'ORDEN_CREADA');
}

export async function iniciar(req: Request, res: Response) {
  return ok(res, await service.iniciar(req, BigInt(req.params.id)));
}

const completarSchema = z.object({
  cantidad_producida: z.number().nonnegative(),
  cantidad_defectuosa: z.number().nonnegative().optional(),
  consumo_real: z
    .array(z.object({ insumo_id: z.number().int(), cantidad_utilizada: z.number().nonnegative() }))
    .min(1),
  observaciones_produccion: z.string().optional(),
});

export async function completar(req: Request, res: Response) {
  const input = completarSchema.parse(req.body);
  return ok(res, await service.completar(req, BigInt(req.params.id), input), 'ORDEN_COMPLETADA');
}

export async function listar(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.listar({
    page,
    limit,
    skip,
    estado: req.query.estado as string | undefined,
    productoId: req.query.producto_id ? Number(req.query.producto_id) : undefined,
    fechaInicio: req.query.fecha_inicio as string | undefined,
    fechaFin: req.query.fecha_fin as string | undefined,
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function obtener(req: Request, res: Response) {
  return ok(res, await service.obtener(BigInt(req.params.id)));
}

const previewSchema = z.object({
  producto_id: z.number().int(),
  cantidad_solicitada: z.number().positive(),
});

export async function previsualizar(req: Request, res: Response) {
  const input = previewSchema.parse(req.body);
  return ok(res, await service.previsualizar(BigInt(input.producto_id), input.cantidad_solicitada));
}

export async function reporte(req: Request, res: Response) {
  const fi = req.query.fecha_inicio as string;
  const ff = req.query.fecha_fin as string;
  if (!fi || !ff) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'fecha_inicio y fecha_fin son requeridos' });
  }
  return ok(res, await service.reporte(fi, ff));
}
