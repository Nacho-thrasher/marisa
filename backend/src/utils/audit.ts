import type { Request } from 'express';
import { prisma } from '../config/prisma.js';

interface AuditParams {
  accion: string; // CREAR, EDITAR, ELIMINAR, ANULAR, LOGIN, etc.
  modulo: string; // inventario, produccion, nomina, ...
  tablaAfectada?: string;
  registroId?: number | bigint;
  valoresAnteriores?: unknown;
  valoresNuevos?: unknown;
}

/**
 * Registra una acción en auditoria_logs (RF-AUDIT-001).
 * Nunca lanza: la auditoría no debe tumbar la operación principal.
 */
export async function audit(req: Request, params: AuditParams): Promise<void> {
  try {
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: req.user ? BigInt(req.user.id) : null,
        nombreUsuario: req.user?.username ?? null,
        accion: params.accion,
        modulo: params.modulo,
        tablaAfectada: params.tablaAfectada ?? null,
        registroId: params.registroId != null ? BigInt(params.registroId) : null,
        valoresAnteriores: (params.valoresAnteriores ?? undefined) as object | undefined,
        valoresNuevos: (params.valoresNuevos ?? undefined) as object | undefined,
        ipOrigen: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
  } catch (e) {
    console.error('[audit] no se pudo registrar el log', e);
  }
}
