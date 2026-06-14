import type { Rol } from '@prisma/client';

/**
 * Permisos por rol (docs/01_REQUISITOS_FUNCIONALES.md §6 y 03_ARQUITECTURA §5.2).
 * Formato: "modulo:accion". El frontend los usa para menús y la directiva
 * hasPermission; el backend confía en requireRole para el control duro.
 */
export const rolPermisos: Record<Rol, string[]> = {
  ADMIN: ['*'],
  GERENTE: [
    'inventario:ver',
    'inventario:crear',
    'inventario:editar',
    'produccion:ver',
    'produccion:crear',
    'produccion:editar',
    'ventas:ver',
    'ventas:crear',
    'ventas:anular',
    'clientes:ver',
    'clientes:crear',
    'reportes:ver',
  ],
  OPERARIO: [
    'inventario:ver',
    'inventario:crear',
    'produccion:ver',
    'produccion:crear',
    'produccion:editar',
  ],
  RRHH: [
    'empleados:ver',
    'empleados:crear',
    'empleados:editar',
    'nomina:ver',
    'nomina:crear',
    'nomina:editar',
    'reportes:ver',
  ],
  CONTADOR: ['reportes:ver', 'auditoria:ver', 'ventas:ver', 'nomina:ver'],
};
