import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  zona?: string;
  tipoLista?: string;
}

export async function listar(p: ListarParams) {
  const where: Prisma.ClienteWhereInput = { activo: true };
  if (p.zona) where.zona = p.zona;
  if (p.tipoLista) where.tipoLista = p.tipoLista as Prisma.ClienteWhereInput['tipoLista'];
  if (p.search) {
    where.OR = [
      { nombre: { contains: p.search, mode: 'insensitive' } },
      { localidad: { contains: p.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: { vendedor: { select: { nombre: true } } },
      orderBy: { nombre: 'asc' },
      skip: p.skip,
      take: p.limit,
    }),
    prisma.cliente.count({ where }),
  ]);

  const data = rows.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo_lista: c.tipoLista,
    zona: c.zona,
    localidad: c.localidad,
    direccion: c.direccion,
    telefono: c.telefono,
    cuit: c.cuit,
    vendedor: c.vendedor?.nombre ?? null,
    vendedor_id: c.vendedorId,
  }));

  return { data, total };
}

/** Resumen por zona: cuántos clientes hay en cada una (para saber dónde ir a ofrecer). */
export async function porZona() {
  const rows = await prisma.cliente.groupBy({
    by: ['zona'],
    where: { activo: true },
    _count: { _all: true },
    orderBy: { zona: 'asc' },
  });
  return rows.map((r) => ({ zona: r.zona ?? 'Sin zona', clientes: r._count._all }));
}

export async function zonas() {
  const rows = await prisma.cliente.groupBy({ by: ['zona'], where: { activo: true } });
  return rows.map((r) => r.zona).filter((z): z is string => !!z).sort();
}

interface CrearInput {
  nombre: string;
  tipo_lista: string;
  zona?: string;
  direccion?: string;
  localidad?: string;
  telefono?: string;
  cuit?: string;
  vendedor_id?: number;
}

export async function crear(req: Request, input: CrearInput) {
  const cliente = await prisma.cliente.create({
    data: {
      nombre: input.nombre,
      tipoLista: input.tipo_lista as Prisma.ClienteCreateInput['tipoLista'],
      zona: input.zona,
      direccion: input.direccion,
      localidad: input.localidad,
      telefono: input.telefono,
      cuit: input.cuit,
      vendedorId: input.vendedor_id != null ? BigInt(input.vendedor_id) : null,
    },
  });
  await audit(req, { accion: 'CREAR', modulo: 'ventas', tablaAfectada: 'clientes', registroId: cliente.id, valoresNuevos: input });
  return cliente;
}

export async function actualizar(req: Request, id: bigint, input: Partial<CrearInput>) {
  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      nombre: input.nombre,
      tipoLista: input.tipo_lista as Prisma.ClienteUpdateInput['tipoLista'],
      zona: input.zona,
      direccion: input.direccion,
      localidad: input.localidad,
      telefono: input.telefono,
      cuit: input.cuit,
      vendedorId: input.vendedor_id != null ? BigInt(input.vendedor_id) : undefined,
    },
  });
  await audit(req, { accion: 'EDITAR', modulo: 'ventas', tablaAfectada: 'clientes', registroId: id, valoresNuevos: input });
  return cliente;
}

export async function eliminar(req: Request, id: bigint) {
  await prisma.cliente.update({ where: { id }, data: { activo: false } });
  await audit(req, { accion: 'ELIMINAR', modulo: 'ventas', tablaAfectada: 'clientes', registroId: id });
  return { id };
}
