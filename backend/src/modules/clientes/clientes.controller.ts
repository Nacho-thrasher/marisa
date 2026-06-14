import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './clientes.service.js';
import { ok, created, paginated, buildPagination, parsePaging } from '../../utils/response.js';

export async function listar(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.listar({
    page,
    limit,
    skip,
    search: req.query.search as string | undefined,
    zona: req.query.zona as string | undefined,
    tipoLista: req.query.tipo_lista as string | undefined,
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function porZona(_req: Request, res: Response) {
  return ok(res, await service.porZona());
}

export async function zonas(_req: Request, res: Response) {
  return ok(res, await service.zonas());
}

const crearSchema = z.object({
  nombre: z.string().min(1).max(200),
  tipo_lista: z.enum(['MAYORISTA', 'REVENDEDOR', 'COMERCIO', 'PUBLICO']),
  zona: z.string().optional(),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  telefono: z.string().optional(),
  cuit: z.string().optional(),
  vendedor_id: z.number().int().optional(),
});

export async function crear(req: Request, res: Response) {
  return created(res, await service.crear(req, crearSchema.parse(req.body)));
}

export async function actualizar(req: Request, res: Response) {
  return ok(res, await service.actualizar(req, BigInt(req.params.id), crearSchema.partial().parse(req.body)));
}

export async function eliminar(req: Request, res: Response) {
  return ok(res, await service.eliminar(req, BigInt(req.params.id)));
}
