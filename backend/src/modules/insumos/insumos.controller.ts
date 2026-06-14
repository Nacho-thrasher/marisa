import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './insumos.service.js';
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
    stockBajo: boolParam(req.query.stock_bajo),
    activosSolo: req.query.activos_solo === undefined ? true : boolParam(req.query.activos_solo),
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function obtener(req: Request, res: Response) {
  const data = await service.obtener(BigInt(req.params.id));
  return ok(res, data);
}

const crearSchema = z.object({
  codigo: z.string().min(1).max(50),
  nombre: z.string().min(1).max(150),
  descripcion: z.string().optional(),
  categoria: z.string().min(1).max(100),
  unidad_medida: z.string().min(1).max(20),
  precio_unitario: z.number().nonnegative(),
  stock_minimo: z.number().nonnegative().optional(),
  stock_critico: z.number().nonnegative().optional(),
  dias_vencimiento_alerta: z.number().int().nonnegative().optional(),
  observaciones: z.string().optional(),
});

export async function crear(req: Request, res: Response) {
  const input = crearSchema.parse(req.body);
  const data = await service.crear(req, input);
  return created(res, data);
}

const actualizarSchema = z.object({
  nombre: z.string().min(1).max(150).optional(),
  descripcion: z.string().optional(),
  categoria: z.string().min(1).max(100).optional(),
  unidad_medida: z.string().min(1).max(20).optional(),
  precio_unitario: z.number().nonnegative().optional(),
  stock_minimo: z.number().nonnegative().optional(),
  stock_critico: z.number().nonnegative().optional(),
  dias_vencimiento_alerta: z.number().int().nonnegative().optional(),
  observaciones: z.string().optional(),
  razon_cambio_precio: z.string().optional(),
});

export async function actualizar(req: Request, res: Response) {
  const input = actualizarSchema.parse(req.body);
  const data = await service.actualizar(req, BigInt(req.params.id), input);
  return ok(res, data);
}

const ingresoSchema = z.object({
  cantidad: z.number().positive(),
  precio_unitario: z.number().nonnegative().optional(),
  proveedor: z.string().optional(),
  numero_lote: z.string().optional(),
  fecha_vencimiento: z.string().optional(),
  observaciones: z.string().optional(),
});

export async function ingreso(req: Request, res: Response) {
  const input = ingresoSchema.parse(req.body);
  const data = await service.registrarIngreso(req, BigInt(req.params.id), input);
  return created(res, data, 'INGRESO_REGISTRADO');
}

const egresoSchema = z.object({
  cantidad: z.number().positive(),
  motivo: z.string().optional(),
  referencia_id: z.number().int().optional(),
  referencia_tipo: z.string().optional(),
  observaciones: z.string().optional(),
});

export async function egreso(req: Request, res: Response) {
  const input = egresoSchema.parse(req.body);
  const data = await service.registrarEgreso(req, BigInt(req.params.id), input);
  return created(res, data, 'EGRESO_REGISTRADO');
}

export async function movimientos(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.movimientos(BigInt(req.params.id), {
    page,
    limit,
    skip,
    fechaInicio: req.query.fecha_inicio as string | undefined,
    fechaFin: req.query.fecha_fin as string | undefined,
    tipo: req.query.tipo as 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'PERDIDA' | undefined,
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function resumenStock(_req: Request, res: Response) {
  const data = await service.resumenStock();
  return ok(res, data);
}

export async function categorias(_req: Request, res: Response) {
  const data = await service.categorias();
  return ok(res, data);
}
