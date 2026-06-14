import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as ctrl from './usuarios.controller.js';

export const usuariosRouter = Router();

// Gestión de usuarios: exclusivo de administradores.
usuariosRouter.use(authenticate, requireRole('ADMIN'));

usuariosRouter.get('/', asyncHandler(ctrl.listar));
usuariosRouter.post('/', asyncHandler(ctrl.crear));
usuariosRouter.patch('/:id', asyncHandler(ctrl.actualizar));
usuariosRouter.post('/:id/reset-password', asyncHandler(ctrl.resetPassword));
