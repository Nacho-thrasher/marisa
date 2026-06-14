import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './clientes.controller.js';

export const clientesRouter = Router();

clientesRouter.use(authenticate);

clientesRouter.get('/por-zona', asyncHandler(ctrl.porZona));
clientesRouter.get('/zonas', asyncHandler(ctrl.zonas));
clientesRouter.get('/', asyncHandler(ctrl.listar));

clientesRouter.post('/', requireRole('GERENTE'), asyncHandler(ctrl.crear));
clientesRouter.patch('/:id', requireRole('GERENTE'), asyncHandler(ctrl.actualizar));
clientesRouter.delete('/:id', requireRole('GERENTE'), asyncHandler(ctrl.eliminar));
