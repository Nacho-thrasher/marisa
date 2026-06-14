import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './produccion.controller.js';

export const produccionRouter = Router();

produccionRouter.use(authenticate);

produccionRouter.get('/reportes', requireRole('GERENTE'), asyncHandler(ctrl.reporte));
produccionRouter.post('/preview', asyncHandler(ctrl.previsualizar));
produccionRouter.get('/ordenes', asyncHandler(ctrl.listar));
produccionRouter.get('/ordenes/:id', asyncHandler(ctrl.obtener));

produccionRouter.post('/ordenes', requireRole('GERENTE', 'OPERARIO'), asyncHandler(ctrl.crearOrden));
produccionRouter.patch('/ordenes/:id/iniciar', requireRole('GERENTE', 'OPERARIO'), asyncHandler(ctrl.iniciar));
produccionRouter.patch('/ordenes/:id/completar', requireRole('GERENTE', 'OPERARIO'), asyncHandler(ctrl.completar));
