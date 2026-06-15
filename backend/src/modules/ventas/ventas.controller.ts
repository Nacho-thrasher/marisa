import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './ventas.service.js';
import { ok, created, paginated, buildPagination, parsePaging } from '../../utils/response.js';
import { remitoPdf } from '../../utils/pdf.js';
import { reporteMensualXlsx, reportePeriodoXlsx } from '../../utils/excel.js';

const boolParam = (v: unknown) => v === 'true' || v === true;

const crearSchema = z.object({
  cliente_nombre: z.string().optional(),
  cliente_cuit: z.string().optional(),
  cliente_id: z.number().int().optional(),
  vendedor_id: z.number().int().optional(),
  lista_precio: z.enum(['MAYORISTA', 'REVENDEDOR', 'COMERCIO', 'PUBLICO']).optional(),
  fecha_venta: z.string().optional(),
  medio_pago: z.string().optional(),
  descuento_porcentaje: z.number().min(0).max(100).optional(),
  observaciones: z.string().optional(),
  detalles: z
    .array(
      z.object({
        producto_id: z.number().int(),
        cantidad: z.number().positive(),
        precio_unitario: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export async function crear(req: Request, res: Response) {
  const input = crearSchema.parse(req.body);
  return created(res, await service.crear(req, input), 'VENTA_CREADA');
}

export async function listar(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.listar({
    page,
    limit,
    skip,
    cliente: req.query.cliente as string | undefined,
    soloVigentes: req.query.solo_vigentes !== undefined ? boolParam(req.query.solo_vigentes) : undefined,
    fechaInicio: req.query.fecha_inicio as string | undefined,
    fechaFin: req.query.fecha_fin as string | undefined,
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function obtener(req: Request, res: Response) {
  return ok(res, await service.obtener(BigInt(req.params.id)));
}

const anularSchema = z.object({ motivo_anulacion: z.string().min(1, 'Motivo requerido') });

export async function anular(req: Request, res: Response) {
  const { motivo_anulacion } = anularSchema.parse(req.body);
  return ok(res, await service.anular(req, BigInt(req.params.id), motivo_anulacion));
}

export async function resumen(req: Request, res: Response) {
  return ok(res, await service.resumen(req.query.fecha_inicio as string, req.query.fecha_fin as string));
}

export async function reporteMensual(req: Request, res: Response) {
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;
  const anio = Number(req.query.ano) || new Date().getFullYear();
  return ok(res, await service.reporteMensual(mes, anio));
}

export async function reporteMensualExcel(req: Request, res: Response) {
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;
  const anio = Number(req.query.ano) || new Date().getFullYear();
  const r = await service.reporteMensual(mes, anio);
  await reporteMensualXlsx(res, {
    periodo: r.periodo,
    vendedores: r.vendedores,
    porVendedor: r.por_vendedor,
    matriz: r.matriz,
  });
}

const reportePeriodoSchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
});

export async function reportePeriodo(req: Request, res: Response) {
  const { desde, hasta } = reportePeriodoSchema.parse(req.query);
  return ok(res, await service.reportePeriodo(desde, hasta));
}

export async function reportePeriodoExcel(req: Request, res: Response) {
  const { desde, hasta } = reportePeriodoSchema.parse(req.query);
  const r = await service.reportePeriodo(desde, hasta);
  await reportePeriodoXlsx(res, r);
}

export async function remito(req: Request, res: Response) {
  const d = await service.datosRemito(BigInt(req.params.id));
  remitoPdf(res, d);
}
