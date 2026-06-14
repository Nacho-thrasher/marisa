import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import type { Rol } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

/** Proyección segura: nunca exponemos el hash de la contraseña. */
function toDTO(u: {
  id: bigint;
  username: string;
  email: string;
  rol: Rol;
  activo: boolean;
  ultimoLogin: Date | null;
  fechaCreacion: Date;
}) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    ultimo_login: u.ultimoLogin,
    fecha_creacion: u.fechaCreacion,
  };
}

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  rol?: string;
  activo?: boolean;
}

export async function listar(p: ListarParams) {
  const where: Prisma.UsuarioWhereInput = {};
  if (p.rol) where.rol = p.rol as Rol;
  if (p.activo !== undefined) where.activo = p.activo;
  if (p.search) {
    where.OR = [
      { username: { contains: p.search, mode: 'insensitive' } },
      { email: { contains: p.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.usuario.findMany({ where, orderBy: { username: 'asc' }, skip: p.skip, take: p.limit }),
    prisma.usuario.count({ where }),
  ]);

  return { data: rows.map(toDTO), total };
}

interface CrearInput {
  username: string;
  email: string;
  password: string;
  rol: Rol;
}

export async function crear(req: Request, input: CrearInput) {
  const existe = await prisma.usuario.findFirst({
    where: { OR: [{ username: input.username }, { email: input.email }] },
  });
  if (existe) {
    const campo = existe.username === input.username ? 'usuario' : 'email';
    throw AppError.conflict('USUARIO_DUPLICADO', `Ya existe un ${campo} con ese valor`);
  }

  const user = await prisma.usuario.create({
    data: {
      username: input.username,
      email: input.email,
      rol: input.rol,
      contrasenaHash: await bcrypt.hash(input.password, 10),
    },
  });

  await audit(req, {
    accion: 'CREAR',
    modulo: 'seguridad',
    tablaAfectada: 'usuarios',
    registroId: user.id,
    valoresNuevos: { username: input.username, email: input.email, rol: input.rol },
  });

  return toDTO(user);
}

interface ActualizarInput {
  email?: string;
  rol?: Rol;
  activo?: boolean;
}

export async function actualizar(req: Request, id: bigint, input: ActualizarInput) {
  const actual = await prisma.usuario.findUnique({ where: { id } });
  if (!actual) throw AppError.notFound('Usuario no encontrado');

  const esYoMismo = req.user?.id === Number(id);

  // No permitir auto-bloquearse ni auto-degradarse: evita quedar sin acceso.
  if (esYoMismo && input.activo === false) {
    throw AppError.badRequest('No podés desactivar tu propio usuario');
  }
  if (esYoMismo && input.rol && input.rol !== 'ADMIN') {
    throw AppError.badRequest('No podés quitarte el rol de administrador a vos mismo');
  }

  // No dejar el sistema sin ningún ADMIN activo.
  const dejaDeSerAdminActivo =
    actual.rol === 'ADMIN' && ((input.rol && input.rol !== 'ADMIN') || input.activo === false);
  if (dejaDeSerAdminActivo) {
    const otrosAdmins = await prisma.usuario.count({
      where: { rol: 'ADMIN', activo: true, id: { not: id } },
    });
    if (otrosAdmins === 0) {
      throw AppError.badRequest('Debe quedar al menos un administrador activo');
    }
  }

  if (input.email) {
    const dup = await prisma.usuario.findFirst({ where: { email: input.email, id: { not: id } } });
    if (dup) throw AppError.conflict('EMAIL_DUPLICADO', 'Ya existe otro usuario con ese email');
  }

  const user = await prisma.usuario.update({
    where: { id },
    data: { email: input.email, rol: input.rol, activo: input.activo },
  });

  await audit(req, {
    accion: 'EDITAR',
    modulo: 'seguridad',
    tablaAfectada: 'usuarios',
    registroId: id,
    valoresAnteriores: { email: actual.email, rol: actual.rol, activo: actual.activo },
    valoresNuevos: input,
  });

  return toDTO(user);
}

export async function resetPassword(req: Request, id: bigint, password: string) {
  const actual = await prisma.usuario.findUnique({ where: { id } });
  if (!actual) throw AppError.notFound('Usuario no encontrado');

  await prisma.usuario.update({
    where: { id },
    data: { contrasenaHash: await bcrypt.hash(password, 10) },
  });

  await audit(req, {
    accion: 'EDITAR',
    modulo: 'seguridad',
    tablaAfectada: 'usuarios',
    registroId: id,
    valoresNuevos: { password: '***' },
  });

  return { id };
}
