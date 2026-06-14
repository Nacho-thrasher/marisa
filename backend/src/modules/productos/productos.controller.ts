import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './productos.service.js';
import { ok, created, paginated, buildPagination, parsePaging } from '../../utils/response.js';

const boolParam = (v: unknown) => v === 'true' || v === true;

export async function listar(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.listar({
    page,
    limit,
    skip,
    search: req.query.search as string | undefined,
    categoria: req.query.categoria as string | undefined,
    activosSolo: req.query.activos_solo === undefined ? true : boolParam(req.query.activos_solo),
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function obtener(req: Request, res: Response) {
  return ok(res, await service.obtener(BigInt(req.params.id)));
}

export async function receta(req: Request, res: Response) {
  return ok(res, await service.obtenerReceta(BigInt(req.params.id)));
}

const crearSchema = z.object({
  codigo: z.string().min(1).max(50),
  nombre: z.string().min(1).max(150),
  descripcion: z.string().optional(),
  categoria: z.string().min(1).max(100),
  peso_gramos: z.number().int().positive().optional(),
  precio_venta: z.number().nonnegative().optional(),
});

export async function crear(req: Request, res: Response) {
  const input = crearSchema.parse(req.body);
  return created(res, await service.crear(req, input));
}

const recetaSchema = z.object({
  codigo: z.string().min(1).max(50),
  rendimiento_esperado: z.number().positive(),
  unidad_rendimiento: z.string().min(1).max(20),
  insumos: z
    .array(
      z.object({
        insumo_id: z.number().int(),
        cantidad_requerida: z.number().positive(),
        unidad_medida: z.string().min(1),
        porcentaje_merma: z.number().nonnegative().optional(),
      }),
    )
    .min(1),
});

export async function crearReceta(req: Request, res: Response) {
  const input = recetaSchema.parse(req.body);
  return created(res, await service.crearReceta(req, BigInt(req.params.id), input));
}

export async function categorias(_req: Request, res: Response) {
  return ok(res, await service.categorias());
}
