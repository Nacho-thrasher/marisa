import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './usuarios.service.js';
import { ok, created, paginated, buildPagination, parsePaging } from '../../utils/response.js';

const rolEnum = z.enum(['ADMIN', 'GERENTE', 'OPERARIO', 'RRHH', 'CONTADOR']);

export async function listar(req: Request, res: Response) {
  const { page, limit, skip } = parsePaging(req.query);
  const activoQuery = req.query.activo;
  const { data, total } = await service.listar({
    page,
    limit,
    skip,
    search: req.query.search as string | undefined,
    rol: req.query.rol as string | undefined,
    activo: activoQuery === undefined ? undefined : activoQuery === 'true',
  });
  return paginated(res, data, buildPagination(page, limit, total));
}

const crearSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50),
  email: z.string().email('Email inválido').max(100),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  rol: rolEnum,
});

export async function crear(req: Request, res: Response) {
  return created(res, await service.crear(req, crearSchema.parse(req.body)), 'CREATED', 'Usuario creado');
}

const actualizarSchema = z
  .object({
    email: z.string().email('Email inválido').max(100).optional(),
    rol: rolEnum.optional(),
    activo: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar' });

export async function actualizar(req: Request, res: Response) {
  return ok(res, await service.actualizar(req, BigInt(req.params.id), actualizarSchema.parse(req.body)));
}

const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

export async function resetPassword(req: Request, res: Response) {
  const { password } = passwordSchema.parse(req.body);
  return ok(res, await service.resetPassword(req, BigInt(req.params.id), password), 'Contraseña actualizada');
}
