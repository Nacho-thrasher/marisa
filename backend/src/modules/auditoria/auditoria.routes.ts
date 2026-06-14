import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './auditoria.controller.js';

export const auditoriaRouter = Router();

auditoriaRouter.use(authenticate, requireRole('CONTADOR'));

auditoriaRouter.get('/logs', asyncHandler(ctrl.listar));
auditoriaRouter.get('/logs/:id', asyncHandler(ctrl.obtener));
auditoriaRouter.get('/precios-insumo/:insumoId', asyncHandler(ctrl.historialPrecios));
auditoriaRouter.get('/reporte', asyncHandler(ctrl.reporte));
