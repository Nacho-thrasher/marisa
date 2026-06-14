import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './productos.controller.js';

export const productosRouter = Router();

productosRouter.use(authenticate);

productosRouter.get('/categorias', asyncHandler(ctrl.categorias));
productosRouter.post('/simular-costo', requireRole('GERENTE', 'OPERARIO'), asyncHandler(ctrl.simularCosto));
productosRouter.get('/', asyncHandler(ctrl.listar));
productosRouter.get('/:id', asyncHandler(ctrl.obtener));
productosRouter.get('/:id/receta', asyncHandler(ctrl.receta));

productosRouter.post('/', requireRole('GERENTE'), asyncHandler(ctrl.crear));
productosRouter.post('/:id/receta', requireRole('GERENTE'), asyncHandler(ctrl.crearReceta));
productosRouter.patch('/:id/precios', requireRole('GERENTE'), asyncHandler(ctrl.actualizarPrecios));
