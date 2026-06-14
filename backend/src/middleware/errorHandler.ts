import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'Ruta no encontrada',
    timestamp: new Date().toISOString(),
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
      timestamp,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validación fallida',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      timestamp,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'campo';
      return res.status(409).json({
        success: false,
        code: 'CONFLICT',
        message: `Ya existe un registro con ese ${target}`,
        timestamp,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Recurso no encontrado',
        timestamp,
      });
    }
  }

  console.error('[errorHandler]', err);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
    timestamp,
  });
}
