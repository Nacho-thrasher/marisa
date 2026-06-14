import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './insumos.controller.js';

export const insumosRouter = Router();

insumosRouter.use(authenticate);

// Lectura: cualquier rol autenticado con acceso a inventario.
insumosRouter.get('/stock/resumen', asyncHandler(ctrl.resumenStock));
insumosRouter.get('/categorias', asyncHandler(ctrl.categorias));
insumosRouter.get('/', asyncHandler(ctrl.listar));
insumosRouter.get('/:id', asyncHandler(ctrl.obtener));
insumosRouter.get('/:id/movimientos', asyncHandler(ctrl.movimientos));

// Escritura: OPERARIO y GERENTE (ADMIN siempre pasa).
insumosRouter.post('/', requireRole('OPERARIO', 'GERENTE'), asyncHandler(ctrl.crear));
insumosRouter.patch('/:id', requireRole('GERENTE'), asyncHandler(ctrl.actualizar));
insumosRouter.post('/:id/ingreso', requireRole('OPERARIO', 'GERENTE'), asyncHandler(ctrl.ingreso));
insumosRouter.post('/:id/egreso', requireRole('OPERARIO', 'GERENTE'), asyncHandler(ctrl.egreso));
