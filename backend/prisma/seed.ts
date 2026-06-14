import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const D = (n: number) => new Prisma.Decimal(n);

async function seedUsuarios() {
  const usuarios = [
    { username: 'admin', email: 'admin@marisa.com', rol: 'ADMIN' as const, pass: 'Admin123!' },
    { username: 'gerente', email: 'gerente@marisa.com', rol: 'GERENTE' as const, pass: 'Gerente123!' },
    { username: 'operario', email: 'operario@marisa.com', rol: 'OPERARIO' as const, pass: 'Operario123!' },
    { username: 'rrhh', email: 'rrhh@marisa.com', rol: 'RRHH' as const, pass: 'Rrhh123!' },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        rol: u.rol,
        contrasenaHash: await bcrypt.hash(u.pass, 10),
      },
    });
  }
  console.log(`✓ ${usuarios.length} usuarios`);
}

async function seedInsumos() {
  // Insumos base (docs/01_REQUISITOS_FUNCIONALES.md RF-MP-004). Precios demo.
  const insumos = [
    { codigo: 'PAPA-001', nombre: 'Papa fresca', categoria: 'papas_fritas', unidad: 'kg', precio: 250, min: 100, crit: 40 },
    { codigo: 'ACEITE-001', nombre: 'Aceite de girasol', categoria: 'papas_fritas', unidad: 'litros', precio: 1800, min: 50, crit: 20 },
    { codigo: 'SAL-001', nombre: 'Sal fina', categoria: 'general', unidad: 'kg', precio: 300, min: 30, crit: 10 },
    { codigo: 'ENV-45', nombre: 'Envase 45gr', categoria: 'envases', unidad: 'unidades', precio: 20, min: 2000, crit: 500 },
    { codigo: 'ENV-90', nombre: 'Envase 90gr', categoria: 'envases', unidad: 'unidades', precio: 28, min: 2000, crit: 500 },
    { codigo: 'HARINA-001', nombre: 'Harina 000', categoria: 'panificados', unidad: 'kg', precio: 600, min: 200, crit: 50 },
    { codigo: 'GRASA-001', nombre: 'Grasa vacuna', categoria: 'panificados', unidad: 'kg', precio: 1200, min: 40, crit: 15 },
    { codigo: 'AZUCAR-001', nombre: 'Azúcar', categoria: 'panificados', unidad: 'kg', precio: 800, min: 50, crit: 20 },
    { codigo: 'LEVADURA-001', nombre: 'Levadura', categoria: 'panificados', unidad: 'kg', precio: 2500, min: 10, crit: 3 },
    { codigo: 'MALTA-001', nombre: 'Malta', categoria: 'panificados', unidad: 'kg', precio: 1500, min: 10, crit: 3 },
    { codigo: 'MANI-001', nombre: 'Maní', categoria: 'mani', unidad: 'kg', precio: 1700, min: 80, crit: 30 },
    { codigo: 'SALSA-001', nombre: 'Salsa de tomate', categoria: 'prepizza', unidad: 'litros', precio: 900, min: 30, crit: 10 },
    { codigo: 'VINAGRE-001', nombre: 'Vinagre', categoria: 'prepizza', unidad: 'litros', precio: 500, min: 20, crit: 5 },
  ];

  for (const i of insumos) {
    const insumo = await prisma.insumo.upsert({
      where: { codigo: i.codigo },
      update: {},
      create: {
        codigo: i.codigo,
        nombre: i.nombre,
        categoria: i.categoria,
        unidadMedida: i.unidad,
        precioUnitario: D(i.precio),
        costoActual: D(i.precio),
        stockMinimo: D(i.min),
        stockCritico: D(i.crit),
      },
    });

    // Stock inicial demo: 3x el mínimo, para que casi todos estén "OK".
    const cantidad = D(i.min * 3);
    await prisma.stockActual.upsert({
      where: { insumoId: insumo.id },
      update: { cantidadStock: cantidad, valorStock: cantidad.times(i.precio) },
      create: {
        insumoId: insumo.id,
        cantidadStock: cantidad,
        valorStock: cantidad.times(i.precio),
        ultimoMovimiento: new Date(),
      },
    });
  }
  console.log(`✓ ${insumos.length} insumos con stock inicial`);
}

async function seedConfiguracionRRHH() {
  const aportes = [
    { nombre: 'AFIP/Aportes Patronales', tipo: 'APORTE_PATRONAL' as const, porcentaje: 17 },
    { nombre: 'Descuento Sindicato', tipo: 'DESCUENTO_NOMINA' as const, porcentaje: 3 },
    { nombre: 'Jubilación', tipo: 'DESCUENTO_NOMINA' as const, porcentaje: 11 },
    { nombre: 'Obra Social', tipo: 'DESCUENTO_NOMINA' as const, porcentaje: 3 },
  ];
  for (const a of aportes) {
    const existe = await prisma.configuracionAporte.findFirst({ where: { nombre: a.nombre } });
    if (!existe) {
      await prisma.configuracionAporte.create({
        data: { nombre: a.nombre, tipo: a.tipo, porcentaje: D(a.porcentaje), fechaInicio: new Date('2024-01-01') },
      });
    }
  }

  const escalas = [
    { desde: 0, hasta: 1, pct: 0 },
    { desde: 1, hasta: 5, pct: 2 },
    { desde: 5, hasta: 10, pct: 5 },
    { desde: 10, hasta: null, pct: 10 },
  ];
  const countEscala = await prisma.escalaAntiguedad.count();
  if (countEscala === 0) {
    for (const e of escalas) {
      await prisma.escalaAntiguedad.create({
        data: { anosDesde: e.desde, anosHasta: e.hasta, porcentajeAdicional: D(e.pct) },
      });
    }
  }
  console.log(`✓ configuración de aportes y escala de antigüedad`);
}

async function main() {
  console.log('Seeding...');
  await seedUsuarios();
  await seedInsumos();
  await seedConfiguracionRRHH();
  console.log('Seed completo ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
