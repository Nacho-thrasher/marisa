import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './nomina.controller.js';

// Configuración de aportes (router separado por la ruta /aportes-configuracion).
export const aportesRouter = Router();
aportesRouter.use(authenticate, requireRole('RRHH'));
aportesRouter.get('/', asyncHandler(ctrl.listarAportes));
aportesRouter.patch('/:id', asyncHandler(ctrl.actualizarAporte));

export const nominaRouter = Router();
nominaRouter.use(authenticate, requireRole('RRHH'));
nominaRouter.get('/', asyncHandler(ctrl.listarNominas));
nominaRouter.post('/procesar', asyncHandler(ctrl.procesar));
nominaRouter.get('/recibos/:reciboId/pdf', asyncHandler(ctrl.reciboPdfHandler));
nominaRouter.get('/:id/recibos', asyncHandler(ctrl.recibos));
nominaRouter.get('/:id/excel', asyncHandler(ctrl.nominaExcel));
