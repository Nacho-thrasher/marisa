import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import * as service from './vendedores.service.js';

export const vendedoresRouter = Router();

vendedoresRouter.use(authenticate);

const schema = z.object({
  nombre: z.string().min(1).max(150),
  zona: z.string().optional(),
  telefono: z.string().optional(),
});

const updateSchema = schema.partial().extend({ activo: z.boolean().optional() });

vendedoresRouter.get(
  '/',
  asyncHandler(async (req, res) => ok(res, await service.listar(req.query.activos_solo !== 'false'))),
);
vendedoresRouter.post(
  '/',
  requireRole('GERENTE'),
  asyncHandler(async (req, res) => created(res, await service.crear(req, schema.parse(req.body)))),
);
vendedoresRouter.patch(
  '/:id',
  requireRole('GERENTE'),
  asyncHandler(async (req, res) => ok(res, await service.actualizar(req, BigInt(req.params.id), updateSchema.parse(req.body)))),
);
vendedoresRouter.delete(
  '/:id',
  requireRole('GERENTE'),
  asyncHandler(async (req, res) => ok(res, await service.eliminar(req, BigInt(req.params.id)))),
);
