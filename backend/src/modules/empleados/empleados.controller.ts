import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './empleados.service.js';
import { ok, created, paginated, buildPagination, parsePaging } from '../../utils/response.js';

export async function listar(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const { data, total } = await service.listar({
    page,
    limit,
    skip,
    estado: req.query.estado as string | undefined,
    buscar: req.query.buscar as string | undefined,
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

export async function obtener(req: Request, res: Response) {
  return ok(res, await service.obtener(BigInt(req.params.id)));
}

const crearSchema = z.object({
  dni: z.string().min(1).max(20),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  puesto: z.string().min(1).max(100),
  departamento: z.string().optional(),
  fecha_ingreso: z.string().min(1),
  cuit: z.string().optional(),
  numero_afiliacion: z.string().optional(),
});

export async function crear(req: Request, res: Response) {
  const input = crearSchema.parse(req.body);
  return created(res, await service.crear(req, input), 'EMPLEADO_CREADO');
}

const actualizarSchema = crearSchema.partial().extend({
  estado: z.enum(['ACTIVO', 'INACTIVO', 'LICENCIA', 'EGRESADO']).optional(),
});

export async function actualizar(req: Request, res: Response) {
  const input = actualizarSchema.parse(req.body);
  return ok(res, await service.actualizar(req, BigInt(req.params.id), input));
}

const estructuraSchema = z.object({
  sueldo_basico: z.number().nonnegative(),
  tarifa_horaria: z.number().nonnegative().optional(),
  bono_fijo: z.number().nonnegative().optional(),
  comision_porcentaje: z.number().nonnegative().optional(),
  fecha_inicio: z.string().min(1),
});

export async function configurarEstructura(req: Request, res: Response) {
  const input = estructuraSchema.parse(req.body);
  return created(res, await service.configurarEstructura(req, BigInt(req.params.id), input), 'ESTRUCTURA_CONFIGURADA');
}
