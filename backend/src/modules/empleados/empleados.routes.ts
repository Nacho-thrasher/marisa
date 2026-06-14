import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './empleados.controller.js';

export const empleadosRouter = Router();

empleadosRouter.use(authenticate, requireRole('RRHH'));

empleadosRouter.get('/', asyncHandler(ctrl.listar));
empleadosRouter.get('/:id', asyncHandler(ctrl.obtener));
empleadosRouter.post('/', asyncHandler(ctrl.crear));
empleadosRouter.patch('/:id', asyncHandler(ctrl.actualizar));
empleadosRouter.post('/:id/estructura-salarial', asyncHandler(ctrl.configurarEstructura));
