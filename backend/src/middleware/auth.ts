import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import type { Rol } from '@prisma/client';

export interface AuthUser {
  id: number;
  username: string;
  rol: Rol;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Verifica el JWT del header Authorization y popula req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token no provisto');
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwt.secret) as jwt.JwtPayload;
    req.user = {
      id: Number(payload.sub),
      username: String(payload.username),
      rol: payload.rol as Rol,
    };
    next();
  } catch {
    throw AppError.unauthorized('Token inválido o expirado');
  }
}

/** Restringe el acceso a los roles indicados. ADMIN siempre pasa. */
export function requireRole(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (req.user.rol !== 'ADMIN' && !roles.includes(req.user.rol)) {
      throw AppError.forbidden('No tiene permisos para esta acción');
    }
    next();
  };
}
