import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';

const D = (n: number | string) => new Prisma.Decimal(n);

export function antiguedadAnios(fechaIngreso: Date): number {
  const ms = Date.now() - fechaIngreso.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
}

interface ListarParams {
  page: number;
  limit: number;
  skip: number;
  estado?: string;
  buscar?: string;
}

export async function listar(p: ListarParams) {
  const where: Prisma.EmpleadoWhereInput = {};
  if (p.estado) where.estado = p.estado as Prisma.EmpleadoWhereInput['estado'];
  if (p.buscar) {
    where.OR = [
      { nombre: { contains: p.buscar, mode: 'insensitive' } },
      { apellido: { contains: p.buscar, mode: 'insensitive' } },
      { dni: { contains: p.buscar } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.empleado.findMany({
      where,
      include: { estructuras: { where: { vigente: true }, take: 1 } },
      orderBy: { apellido: 'asc' },
      skip: p.skip,
      take: p.limit,
    }),
    prisma.empleado.count({ where }),
  ]);

  const data = rows.map((e) => ({
    id: e.id,
    dni: e.dni,
    nombre: e.nombre,
    apellido: e.apellido,
    puesto: e.puesto,
    departamento: e.departamento,
    fecha_ingreso: e.fechaIngreso,
    antiguedad_anos: antiguedadAnios(e.fechaIngreso),
    estado: e.estado,
    email: e.email,
    estructura_salarial_actual: e.estructuras[0]
      ? {
          sueldo_basico: e.estructuras[0].sueldoBasico,
          tarifa_horaria: e.estructuras[0].tarifaHoraria,
          bono_fijo: e.estructuras[0].bonoFijo,
        }
      : null,
  }));

  return { data, total };
}

export async function obtener(id: bigint) {
  const e = await prisma.empleado.findUnique({
    where: { id },
    include: { estructuras: { orderBy: { fechaInicio: 'desc' } } },
  });
  if (!e) throw AppError.notFound('Empleado no encontrado');
  const vigente = e.estructuras.find((s) => s.vigente);

  return {
    id: e.id,
    dni: e.dni,
    nombre: e.nombre,
    apellido: e.apellido,
    email: e.email,
    telefono: e.telefono,
    direccion: e.direccion,
    localidad: e.localidad,
    fecha_nacimiento: e.fechaNacimiento,
    puesto: e.puesto,
    departamento: e.departamento,
    fecha_ingreso: e.fechaIngreso,
    antiguedad_anos: antiguedadAnios(e.fechaIngreso),
    estado: e.estado,
    cuit: e.cuitEmpleado,
    numero_afiliacion: e.numeroAfiliacion,
    estructura_salarial_vigente: vigente
      ? {
          sueldo_basico: vigente.sueldoBasico,
          tarifa_horaria: vigente.tarifaHoraria,
          bono_fijo: vigente.bonoFijo,
          comision_porcentaje: vigente.comisionPorcentaje,
          fecha_inicio: vigente.fechaInicio,
          vigente: true,
        }
      : null,
    historial_salarial: e.estructuras
      .filter((s) => !s.vigente)
      .map((s) => ({ sueldo_basico: s.sueldoBasico, fecha_inicio: s.fechaInicio, fecha_fin: s.fechaFin })),
  };
}

interface CrearInput {
  dni: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  localidad?: string;
  fecha_nacimiento?: string;
  puesto: string;
  departamento?: string;
  fecha_ingreso: string;
  cuit?: string;
  numero_afiliacion?: string;
}

export async function crear(req: Request, input: CrearInput) {
  const empleado = await prisma.empleado.create({
    data: {
      dni: input.dni,
      nombre: input.nombre,
      apellido: input.apellido,
      email: input.email,
      telefono: input.telefono,
      direccion: input.direccion,
      localidad: input.localidad,
      fechaNacimiento: input.fecha_nacimiento ? new Date(input.fecha_nacimiento) : null,
      puesto: input.puesto,
      departamento: input.departamento,
      fechaIngreso: new Date(input.fecha_ingreso),
      cuitEmpleado: input.cuit,
      numeroAfiliacion: input.numero_afiliacion,
    },
  });
  await audit(req, { accion: 'CREAR', modulo: 'nomina', tablaAfectada: 'empleados', registroId: empleado.id, valoresNuevos: { dni: input.dni } });
  return empleado;
}

export async function actualizar(req: Request, id: bigint, input: Partial<CrearInput> & { estado?: string }) {
  const e = await prisma.empleado.update({
    where: { id },
    data: {
      nombre: input.nombre,
      apellido: input.apellido,
      email: input.email,
      telefono: input.telefono,
      direccion: input.direccion,
      localidad: input.localidad,
      puesto: input.puesto,
      departamento: input.departamento,
      cuitEmpleado: input.cuit,
      numeroAfiliacion: input.numero_afiliacion,
      estado: input.estado as Prisma.EmpleadoUpdateInput['estado'],
    },
  });
  await audit(req, { accion: 'EDITAR', modulo: 'nomina', tablaAfectada: 'empleados', registroId: id, valoresNuevos: input });
  return e;
}

interface EstructuraInput {
  sueldo_basico: number;
  tarifa_horaria?: number;
  bono_fijo?: number;
  comision_porcentaje?: number;
  fecha_inicio: string;
}

export async function configurarEstructura(req: Request, empleadoId: bigint, input: EstructuraInput) {
  const empleado = await prisma.empleado.findUnique({ where: { id: empleadoId } });
  if (!empleado) throw AppError.notFound('Empleado no encontrado');

  const anterior = await prisma.estructuraSalarial.findFirst({ where: { empleadoId, vigente: true } });

  const nueva = await prisma.$transaction(async (tx) => {
    if (anterior) {
      await tx.estructuraSalarial.update({
        where: { id: anterior.id },
        data: { vigente: false, fechaFin: new Date(input.fecha_inicio) },
      });
      await tx.historialEstructuraSalarial.create({
        data: {
          empleadoId,
          sueldoBasicoAnterior: anterior.sueldoBasico,
          sueldoBasicoNuevo: D(input.sueldo_basico),
          tarifaHorariaAnterior: anterior.tarifaHoraria,
          tarifaHorariaNueva: input.tarifa_horaria != null ? D(input.tarifa_horaria) : null,
          fechaCambio: new Date(),
          cambioPorId: BigInt(req.user!.id),
          razonCambio: 'Actualización de estructura salarial',
        },
      });
    }
    return tx.estructuraSalarial.create({
      data: {
        empleadoId,
        sueldoBasico: D(input.sueldo_basico),
        tarifaHoraria: input.tarifa_horaria != null ? D(input.tarifa_horaria) : null,
        bonoFijo: D(input.bono_fijo ?? 0),
        comisionPorcentaje: D(input.comision_porcentaje ?? 0),
        fechaInicio: new Date(input.fecha_inicio),
        vigente: true,
        cambioAnteriorId: anterior?.id ?? null,
        creadoPorId: BigInt(req.user!.id),
      },
    });
  });

  await audit(req, { accion: 'EDITAR', modulo: 'nomina', tablaAfectada: 'estructura_salarial', registroId: nueva.id, valoresAnteriores: anterior ? { sueldo_basico: anterior.sueldoBasico } : undefined, valoresNuevos: input });

  return {
    empleado: `${empleado.nombre} ${empleado.apellido}`,
    sueldo_basico: nueva.sueldoBasico,
    tarifa_horaria: nueva.tarifaHoraria,
    bono_fijo: nueva.bonoFijo,
    fecha_inicio: nueva.fechaInicio,
    reemplaza_anterior: !!anterior,
  };
}
