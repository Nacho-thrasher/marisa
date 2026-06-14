import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { audit } from '../../utils/audit.js';
import { antiguedadAnios } from '../empleados/empleados.service.js';

const D = (n: number | string) => new Prisma.Decimal(n);

// ───────────────────────── Configuración de aportes ─────────────────────────

export async function listarAportes() {
  const rows = await prisma.configuracionAporte.findMany({ orderBy: { tipo: 'asc' } });
  return rows.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    tipo: a.tipo,
    porcentaje: a.porcentaje,
    descripcion: a.descripcion,
    vigente_desde: a.fechaInicio,
    vigente_hasta: a.fechaFin,
    activo: a.activo,
  }));
}

export async function actualizarAporte(req: Request, id: bigint, porcentaje: number, fechaInicio?: string) {
  const actual = await prisma.configuracionAporte.findUnique({ where: { id } });
  if (!actual) throw AppError.notFound('Configuración no encontrada');

  const updated = await prisma.configuracionAporte.update({
    where: { id },
    data: { porcentaje: D(porcentaje), fechaInicio: fechaInicio ? new Date(fechaInicio) : actual.fechaInicio },
  });
  await audit(req, { accion: 'EDITAR', modulo: 'nomina', tablaAfectada: 'configuracion_aportes', registroId: id, valoresAnteriores: { porcentaje: actual.porcentaje }, valoresNuevos: { porcentaje } });
  return { nombre: updated.nombre, porcentaje_anterior: actual.porcentaje, porcentaje_nuevo: updated.porcentaje, vigente_desde: updated.fechaInicio };
}

// ───────────────────────── Procesamiento ─────────────────────────

async function porcentajeAntiguedad(anios: number): Promise<Prisma.Decimal> {
  const escalas = await prisma.escalaAntiguedad.findMany({ where: { activo: true }, orderBy: { anosDesde: 'asc' } });
  const escala = escalas.find((e) => anios >= e.anosDesde && (e.anosHasta == null || anios < e.anosHasta));
  return escala ? escala.porcentajeAdicional : D(0);
}

export async function procesar(req: Request, mes: number, anio: number) {
  const existe = await prisma.nominaMensual.findFirst({ where: { periodoMes: mes, periodoAnio: anio } });
  if (existe) throw AppError.conflict('CONFLICT', `Ya existe una nómina para ${mes}/${anio}`);

  const empleados = await prisma.empleado.findMany({
    where: { estado: 'ACTIVO' },
    include: { estructuras: { where: { vigente: true }, take: 1 } },
  });
  if (empleados.length === 0) throw AppError.badRequest('No hay empleados activos para procesar');

  const aportes = await prisma.configuracionAporte.findMany({ where: { activo: true } });
  const pctPatronal = aportes.filter((a) => a.tipo === 'APORTE_PATRONAL').reduce((s, a) => s.plus(a.porcentaje), D(0));
  const pctDescuentos = aportes.filter((a) => a.tipo === 'DESCUENTO_NOMINA').reduce((s, a) => s.plus(a.porcentaje), D(0));

  const numero = `NOM-${anio}-${String(mes).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

  const result = await prisma.$transaction(async (tx) => {
    const nomina = await tx.nominaMensual.create({
      data: {
        numeroNomina: numero,
        periodoMes: mes,
        periodoAnio: anio,
        fechaProcesamiento: new Date(),
        estado: 'PROCESADA',
        procesadoPorId: BigInt(req.user!.id),
      },
    });

    let totalHaberes = D(0);
    let totalDescuentos = D(0);
    let totalNeto = D(0);
    let totalPatronal = D(0);
    let generados = 0;

    for (const e of empleados) {
      const est = e.estructuras[0];
      if (!est) continue; // sin estructura salarial vigente, se omite

      const anios = antiguedadAnios(e.fechaIngreso);
      const pctAnt = await porcentajeAntiguedad(anios);
      const antiguedadMonto = est.sueldoBasico.times(pctAnt).dividedBy(100);

      const haberes = est.sueldoBasico.plus(est.bonoFijo).plus(antiguedadMonto);
      const descuentos = haberes.times(pctDescuentos).dividedBy(100);
      const patronal = haberes.times(pctPatronal).dividedBy(100);
      const neto = haberes.minus(descuentos);

      await tx.reciboSueldo.create({
        data: {
          numeroRecibo: `REC-${anio}-${String(mes).padStart(2, '0')}-${e.id}`,
          nominaId: nomina.id,
          empleadoId: e.id,
          periodoMes: mes,
          periodoAnio: anio,
          sueldoBasico: est.sueldoBasico,
          bonoFijo: est.bonoFijo,
          antiguedadMonto,
          comisiones: D(0),
          horasExtras: D(0),
          otrosHaberes: D(0),
          totalHaberes: haberes,
          aporteSindicato: descuentos,
          descuentoOtros: D(0),
          totalDescuentos: descuentos,
          salarioBruto: haberes,
          aportePatronal: patronal,
          netoAPagar: neto,
        },
      });

      totalHaberes = totalHaberes.plus(haberes);
      totalDescuentos = totalDescuentos.plus(descuentos);
      totalNeto = totalNeto.plus(neto);
      totalPatronal = totalPatronal.plus(patronal);
      generados++;
    }

    return { nomina, totalHaberes, totalDescuentos, totalNeto, totalPatronal, generados };
  });

  await audit(req, { accion: 'CREAR', modulo: 'nomina', tablaAfectada: 'nomina_mensual', registroId: result.nomina.id, valoresNuevos: { periodo: `${mes}/${anio}`, empleados: result.generados } });

  return {
    nomina_id: result.nomina.id,
    numero_nomina: result.nomina.numeroNomina,
    periodo: `${mes}/${anio}`,
    cantidad_empleados: result.generados,
    total_haberes: result.totalHaberes,
    total_descuentos: result.totalDescuentos,
    total_neto_a_pagar: result.totalNeto,
    total_aportes_patronales: result.totalPatronal,
    costo_total_rrhh: result.totalHaberes.plus(result.totalPatronal),
    estado: result.nomina.estado,
    recibos_generados: result.generados,
  };
}

export async function listarNominas(p: { page: number; limit: number; skip: number }) {
  const [rows, total] = await Promise.all([
    prisma.nominaMensual.findMany({
      include: { _count: { select: { recibos: true } }, recibos: { select: { netoAPagar: true } } },
      orderBy: [{ periodoAnio: 'desc' }, { periodoMes: 'desc' }],
      skip: p.skip,
      take: p.limit,
    }),
    prisma.nominaMensual.count(),
  ]);

  const data = rows.map((n) => ({
    nomina_id: n.id,
    numero_nomina: n.numeroNomina,
    periodo: `${String(n.periodoMes).padStart(2, '0')}/${n.periodoAnio}`,
    periodo_mes: n.periodoMes,
    periodo_anio: n.periodoAnio,
    estado: n.estado,
    cantidad_empleados: n._count.recibos,
    total_neto: n.recibos.reduce((s, r) => s.plus(r.netoAPagar ?? D(0)), D(0)),
    fecha_procesamiento: n.fechaProcesamiento,
  }));

  return { data, total };
}

export async function recibos(nominaId: bigint) {
  const nomina = await prisma.nominaMensual.findUnique({ where: { id: nominaId } });
  if (!nomina) throw AppError.notFound('Nómina no encontrada');

  const recibos = await prisma.reciboSueldo.findMany({
    where: { nominaId },
    include: { empleado: true },
    orderBy: { empleado: { apellido: 'asc' } },
  });

  return recibos.map((r) => ({
    recibo_id: r.id,
    numero_recibo: r.numeroRecibo,
    empleado: `${r.empleado.nombre} ${r.empleado.apellido}`,
    periodo: `${String(r.periodoMes).padStart(2, '0')}/${r.periodoAnio}`,
    sueldo_basico: r.sueldoBasico,
    bono_fijo: r.bonoFijo,
    antiguedad_monto: r.antiguedadMonto,
    total_haberes: r.totalHaberes,
    total_descuentos: r.totalDescuentos,
    neto_a_pagar: r.netoAPagar,
    aporte_patronal: r.aportePatronal,
    costo_total_empleado: (r.totalHaberes ?? D(0)).plus(r.aportePatronal ?? D(0)),
  }));
}
