import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { rolPermisos } from './permisos.js';

function signAccessToken(user: { id: bigint; username: string; rol: string }) {
  return jwt.sign({ username: user.username, rol: user.rol }, env.jwt.secret, {
    subject: String(user.id),
    expiresIn: env.jwt.expiresIn,
  } as SignOptions);
}

function signRefreshToken(userId: bigint) {
  return jwt.sign({}, env.jwt.refreshSecret, {
    subject: String(userId),
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
}

export async function login(username: string, password: string) {
  const user = await prisma.usuario.findFirst({
    where: { OR: [{ username }, { email: username }], activo: true },
  });

  if (!user || !(await bcrypt.compare(password, user.contrasenaHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos');
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimoLogin: new Date() },
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id),
    expiresIn: 3600,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      rol: user.rol,
      permisos: rolPermisos[user.rol],
    },
  };
}

export async function refresh(refreshToken: string) {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret) as jwt.JwtPayload;
  } catch {
    throw AppError.unauthorized('Refresh token inválido o expirado');
  }

  const user = await prisma.usuario.findUnique({ where: { id: BigInt(payload.sub as string) } });
  if (!user || !user.activo) throw AppError.unauthorized('Usuario no disponible');

  return { accessToken: signAccessToken(user), expiresIn: 3600 };
}

export async function me(userId: number) {
  const user = await prisma.usuario.findUnique({ where: { id: BigInt(userId) } });
  if (!user) throw AppError.notFound('Usuario no encontrado');
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    rol: user.rol,
    permisos: rolPermisos[user.rol],
  };
}
