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
    { username: 'contador', email: 'contador@marisa.com', rol: 'CONTADOR' as const, pass: 'Contador123!' },
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

async function seedProductosYRecetas() {
  const productos = [
    { codigo: 'PAPA-45', nombre: 'Papas Fritas 45gr', categoria: 'papas_fritas', peso: 45, precio: 350 },
    { codigo: 'PAPA-90', nombre: 'Papas Fritas 90gr', categoria: 'papas_fritas', peso: 90, precio: 600 },
    { codigo: 'PAPA-500', nombre: 'Papas Fritas 500gr', categoria: 'papas_fritas', peso: 500, precio: 2200 },
    { codigo: 'MANI-90', nombre: 'Maní 90gr', categoria: 'mani', peso: 90, precio: 500 },
    { codigo: 'PREPIZZA-C', nombre: 'PrePizza común', categoria: 'panificados', peso: null, precio: 800 },
  ];
  for (const p of productos) {
    await prisma.producto.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        pesoGramos: p.peso ?? undefined,
        precioVenta: D(p.precio),
      },
    });
  }

  // Receta de Papas Fritas 90gr (rinde 50 unidades): papa, aceite, sal, envase.
  const papa90 = await prisma.producto.findUnique({ where: { codigo: 'PAPA-90' } });
  const yaTiene = papa90 && (await prisma.receta.findFirst({ where: { productoId: papa90.id } }));
  if (papa90 && !yaTiene) {
    const ins = async (codigo: string) => prisma.insumo.findUnique({ where: { codigo } });
    const papa = await ins('PAPA-001');
    const aceite = await ins('ACEITE-001');
    const sal = await ins('SAL-001');
    const env = await ins('ENV-90');
    if (papa && aceite && sal && env) {
      const detalles = [
        { insumo: papa, cant: 12, unidad: 'kg', merma: 10 },
        { insumo: aceite, cant: 3, unidad: 'litros', merma: 0 },
        { insumo: sal, cant: 0.3, unidad: 'kg', merma: 0 },
        { insumo: env, cant: 50, unidad: 'unidades', merma: 2 },
      ];
      let costoTotal = D(0);
      const detalleData = detalles.map((d, i) => {
        const costoLinea = d.insumo.costoActual.times(d.cant);
        costoTotal = costoTotal.plus(costoLinea);
        return {
          insumoId: d.insumo.id,
          cantidadRequerida: D(d.cant),
          unidadMedida: d.unidad,
          porcentajeMerma: D(d.merma),
          cantidadConMerma: D(d.cant * (1 + d.merma / 100)),
          costoUnitario: d.insumo.costoActual,
          costoTotal: costoLinea,
          orden: i + 1,
        };
      });
      await prisma.receta.create({
        data: {
          codigo: 'REC-PAPA-90-01',
          productoId: papa90.id,
          version: 1,
          rendimientoEsperado: D(50),
          unidadRendimiento: 'unidades',
          costoTotalEsperado: costoTotal,
          activa: true,
          detalles: { create: detalleData },
        },
      });
      await prisma.producto.update({
        where: { id: papa90.id },
        data: { costoPromedio: costoTotal.dividedBy(50) },
      });
    }
  }
  console.log(`✓ ${productos.length} productos (+ receta de Papas 90gr)`);
}

async function seedEmpleados() {
  const empleados = [
    { dni: '25123456', nombre: 'Juan', apellido: 'García', puesto: 'Operario de Producción', ingreso: '2018-03-15', basico: 480000 },
    { dni: '27987654', nombre: 'María', apellido: 'López', puesto: 'Encargada de Ventas', ingreso: '2021-06-01', basico: 620000 },
    { dni: '30111222', nombre: 'Carlos', apellido: 'Pérez', puesto: 'Operario de Producción', ingreso: '2023-01-10', basico: 450000 },
  ];
  for (const e of empleados) {
    const existe = await prisma.empleado.findUnique({ where: { dni: e.dni } });
    if (existe) continue;
    const emp = await prisma.empleado.create({
      data: {
        dni: e.dni,
        nombre: e.nombre,
        apellido: e.apellido,
        puesto: e.puesto,
        departamento: 'Producción',
        fechaIngreso: new Date(e.ingreso),
        estado: 'ACTIVO',
      },
    });
    await prisma.estructuraSalarial.create({
      data: {
        empleadoId: emp.id,
        sueldoBasico: D(e.basico),
        tarifaHoraria: D(Math.round(e.basico / 200)),
        bonoFijo: D(0),
        fechaInicio: new Date('2024-01-01'),
        vigente: true,
      },
    });
  }
  console.log(`✓ ${empleados.length} empleados con estructura salarial`);
}

async function main() {
  console.log('Seeding...');
  await seedUsuarios();
  await seedInsumos();
  await seedConfiguracionRRHH();
  await seedProductosYRecetas();
  await seedEmpleados();
  console.log('Seed completo ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
