import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './nomina.service.js';
import { ok, paginated, buildPagination, parsePaging } from '../../utils/response.js';
import { reciboPdf } from '../../utils/pdf.js';
import { nominaXlsx } from '../../utils/excel.js';

export async function listarAportes(_req: Request, res: Response) {
  return ok(res, await service.listarAportes());
}

const aporteSchema = z.object({
  porcentaje: z.number().min(0).max(100),
  fecha_inicio: z.string().optional(),
});

export async function actualizarAporte(req: Request, res: Response) {
  const { porcentaje, fecha_inicio } = aporteSchema.parse(req.body);
  return ok(res, await service.actualizarAporte(req, BigInt(req.params.id), porcentaje, fecha_inicio));
}

const procesarSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000).max(2100),
});

export async function procesar(req: Request, res: Response) {
  const { mes, ano } = procesarSchema.parse(req.body);
  return ok(res, await service.procesar(req, mes, ano), 'NOMINA_PROCESADA');
}

export async function listarNominas(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.listarNominas({ page, limit, skip });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function recibos(req: Request, res: Response) {
  return ok(res, await service.recibos(BigInt(req.params.id)));
}

export async function reciboPdfHandler(req: Request, res: Response) {
  const d = await service.datosRecibo(BigInt(req.params.reciboId));
  reciboPdf(res, d);
}

export async function nominaExcel(req: Request, res: Response) {
  const nominaId = BigInt(req.params.id);
  const recibos = await service.recibos(nominaId);
  const periodo = recibos[0]?.periodo ?? '';
  await nominaXlsx(res, { periodo, recibos });
}
