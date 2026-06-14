import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './ventas.controller.js';

export const ventasRouter = Router();

ventasRouter.use(authenticate);

ventasRouter.get('/resumen', asyncHandler(ctrl.resumen));
ventasRouter.get('/reporte-mensual', asyncHandler(ctrl.reporteMensual));
ventasRouter.get('/reporte-mensual/excel', asyncHandler(ctrl.reporteMensualExcel));
ventasRouter.get('/', asyncHandler(ctrl.listar));
ventasRouter.get('/:id/remito', asyncHandler(ctrl.remito));
ventasRouter.get('/:id', asyncHandler(ctrl.obtener));

ventasRouter.post('/', requireRole('GERENTE'), asyncHandler(ctrl.crear));
ventasRouter.delete('/:id', requireRole('GERENTE'), asyncHandler(ctrl.anular));
