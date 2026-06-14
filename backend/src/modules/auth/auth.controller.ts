import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service.js';
import { ok } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken requerido'),
});

export async function loginHandler(req: Request, res: Response) {
  const { username, password } = loginSchema.parse(req.body);
  const result = await authService.login(username, password);
  await audit(req, { accion: 'LOGIN', modulo: 'seguridad', tablaAfectada: 'usuarios', registroId: result.user.id });
  return ok(res, result, 'Login exitoso');
}

export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await authService.refresh(refreshToken);
  return ok(res, result);
}

export async function logoutHandler(req: Request, res: Response) {
  await audit(req, { accion: 'LOGOUT', modulo: 'seguridad' });
  return ok(res, null, 'Sesión cerrada');
}

export async function meHandler(req: Request, res: Response) {
  const result = await authService.me(req.user!.id);
  return ok(res, result);
}
