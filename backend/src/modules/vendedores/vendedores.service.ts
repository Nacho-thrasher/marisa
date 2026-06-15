import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { audit } from '../../utils/audit.js';

export async function listar(activosSolo = true) {
  const rows = await prisma.vendedor.findMany({
    where: activosSolo ? { activo: true } : {},
    include: { _count: { select: { clientes: true } } },
    orderBy: { nombre: 'asc' },
  });
  return rows.map((v) => ({
    id: v.id,
    nombre: v.nombre,
    zona: v.zona,
    telefono: v.telefono,
    activo: v.activo,
    clientes: v._count.clientes,
  }));
}

interface CrearInput {
  nombre: string;
  zona?: string;
  telefono?: string;
}

export async function crear(req: Request, input: CrearInput) {
  const v = await prisma.vendedor.create({ data: input });
  await audit(req, { accion: 'CREAR', modulo: 'ventas', tablaAfectada: 'vendedores', registroId: v.id, valoresNuevos: input });
  return v;
}

export async function actualizar(req: Request, id: bigint, input: Partial<CrearInput> & { activo?: boolean }) {
  const v = await prisma.vendedor.update({ where: { id }, data: input });
  await audit(req, { accion: 'EDITAR', modulo: 'ventas', tablaAfectada: 'vendedores', registroId: id, valoresNuevos: input });
  return v;
}

export async function eliminar(req: Request, id: bigint) {
  await prisma.vendedor.update({ where: { id }, data: { activo: false } });
  await audit(req, { accion: 'ELIMINAR', modulo: 'ventas', tablaAfectada: 'vendedores', registroId: id });
  return { id };
}
