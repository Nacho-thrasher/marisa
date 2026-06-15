import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const prisma = new PrismaClient();
export const D = (n: number) => new Prisma.Decimal(n);

// ─────────────────────────── USUARIOS ───────────────────────────

/**
 * Crea (o actualiza) el único usuario administrador a partir de variables
 * de entorno. La contraseña real se define en Railway, no en el repo.
 */
export async function crearAdmin() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const email = process.env.ADMIN_EMAIL ?? 'admin@marisa.com';
  const pass = process.env.ADMIN_PASSWORD ?? 'Admin123!';

  await prisma.usuario.upsert({
    where: { username },
    update: { email, rol: 'ADMIN', activo: true },
    create: { username, email, rol: 'ADMIN', contrasenaHash: await bcrypt.hash(pass, 10) },
  });
  console.log(`✓ admin "${username}"${process.env.ADMIN_PASSWORD ? '' : ' (contraseña por defecto Admin123! — cambiala)'}`);
}

/** Usuarios demo para desarrollo (uno por rol). No usar en producción. */
export async function seedUsuariosDemo() {
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
  console.log(`✓ ${usuarios.length} usuarios demo`);
}

// ─────────────────────── CATÁLOGO (datos reales) ───────────────────────

export async function seedInsumos() {
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

export async function seedConfiguracionRRHH() {
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

export async function seedProductosYRecetas() {
  // Productos y listas de precios reales (del Excel del cliente).
  // [revendedor, comercio, mayorista, publico] aproximados sobre el precio revendedor.
  const productos = [
    { codigo: 'PAPA-45', nombre: 'Papas Fritas x 45g', categoria: 'papas_fritas', peso: 45, rev: 550 },
    { codigo: 'PAPA-90', nombre: 'Papas Fritas x 90g', categoria: 'papas_fritas', peso: 90, rev: 950 },
    { codigo: 'PAPA-190', nombre: 'Papas Fritas x 190g', categoria: 'papas_fritas', peso: 190, rev: 1780 },
    { codigo: 'PAPA-500', nombre: 'Papas Fritas x 500g', categoria: 'papas_fritas', peso: 500, rev: 3700 },
    { codigo: 'PAPA-1K', nombre: 'Papas Fritas x 1kg', categoria: 'papas_fritas', peso: 1000, rev: 7800 },
    { codigo: 'LLUVIA-250', nombre: 'Lluvia de Papa x 250g', categoria: 'papas_fritas', peso: 250, rev: 2100 },
    { codigo: 'LLUVIA-500', nombre: 'Lluvia de Papa x 500g', categoria: 'papas_fritas', peso: 500, rev: 3700 },
    { codigo: 'LLUVIA-1K', nombre: 'Lluvia de Papa x 1kg', categoria: 'papas_fritas', peso: 1000, rev: 7800 },
    { codigo: 'PALITO-100', nombre: 'Palitos Salados x 100g', categoria: 'palitos', peso: 100, rev: 450 },
    { codigo: 'PALITO-250', nombre: 'Palitos Salados x 250g', categoria: 'palitos', peso: 250, rev: 980 },
    { codigo: 'PALITO-500', nombre: 'Palitos Salados x 500g', categoria: 'palitos', peso: 500, rev: 1650 },
    { codigo: 'PALITO-1K', nombre: 'Palitos Salados x 1kg', categoria: 'palitos', peso: 1000, rev: 3500 },
    { codigo: 'MANI-90', nombre: 'Maní Salados x 90g', categoria: 'mani', peso: 90, rev: 550 },
    { codigo: 'PREPIZZA-C', nombre: 'PrePizza común', categoria: 'panificados', peso: null, rev: 800 },
  ];
  for (const p of productos) {
    const rev = p.rev;
    await prisma.producto.upsert({
      where: { codigo: p.codigo },
      update: {
        precioVenta: D(rev),
        precioRevendedor: D(rev),
        precioMayorista: D(Math.round(rev * 0.9)),
        precioComercio: D(Math.round(rev * 1.1)),
        precioPublico: D(Math.round(rev * 1.25)),
      },
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        pesoGramos: p.peso ?? undefined,
        precioVenta: D(rev),
        precioRevendedor: D(rev),
        precioMayorista: D(Math.round(rev * 0.9)),
        precioComercio: D(Math.round(rev * 1.1)),
        precioPublico: D(Math.round(rev * 1.25)),
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

/** Vendedores reales (hojas del Excel) con zona de venta en Salta. */
export async function seedVendedores() {
  const vendedores = [
    { nombre: 'Angel', zona: 'Centro' },
    { nombre: 'Bravo', zona: 'Norte' },
    { nombre: 'Carlos', zona: 'Sur' },
    { nombre: 'Damian', zona: 'Oeste' },
    { nombre: 'Gustavo', zona: 'Norte' },
    { nombre: 'Hugo', zona: 'Centro' },
    { nombre: 'Juan', zona: 'Este' },
    { nombre: 'Lucio', zona: 'Sur' },
  ];
  for (const v of vendedores) {
    const existe = await prisma.vendedor.findFirst({ where: { nombre: v.nombre } });
    if (!existe) await prisma.vendedor.create({ data: v });
  }
  console.log(`✓ ${vendedores.length} vendedores`);
}

/** Clientes de ejemplo (demo). No usar en producción. */
export async function seedClientesDemo() {
  const vendMap = new Map<string, bigint>();
  for (const v of await prisma.vendedor.findMany()) vendMap.set(v.nombre, v.id);

  const clientes = [
    { nombre: 'Claudio', tipoLista: 'REVENDEDOR' as const, zona: 'Centro', localidad: 'Salta', vend: 'Hugo' },
    { nombre: 'Lucio Fiambrería', tipoLista: 'COMERCIO' as const, zona: 'Sur', localidad: 'Salta', vend: 'Lucio' },
    { nombre: 'Kiosco El Sol', tipoLista: 'COMERCIO' as const, zona: 'Norte', localidad: 'Salta', vend: 'Bravo' },
    { nombre: 'Distribuidora del Valle', tipoLista: 'MAYORISTA' as const, zona: 'Oeste', localidad: 'Salta', vend: 'Damian' },
    { nombre: 'Almacén Doña Rosa', tipoLista: 'COMERCIO' as const, zona: 'Este', localidad: 'Cerrillos', vend: 'Juan' },
  ];
  for (const c of clientes) {
    const existe = await prisma.cliente.findFirst({ where: { nombre: c.nombre } });
    if (!existe) {
      await prisma.cliente.create({
        data: { nombre: c.nombre, tipoLista: c.tipoLista, zona: c.zona, localidad: c.localidad, vendedorId: vendMap.get(c.vend) },
      });
    }
  }
  console.log(`✓ ${clientes.length} clientes demo`);
}

export async function seedEmpleados() {
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

// ─────────────────────────── RESET ───────────────────────────

/**
 * Borra TODOS los datos en orden seguro de claves foráneas (hijos → padres).
 * Destructivo: solo lo usa el reset de producción.
 */
export async function wipeAll() {
  await prisma.$transaction([
    prisma.auditoriaLog.deleteMany(),
    prisma.consumoInsumo.deleteMany(),
    prisma.ventaDetalle.deleteMany(),
    prisma.venta.deleteMany(),
    prisma.reciboSueldo.deleteMany(),
    prisma.nominaMensual.deleteMany(),
    prisma.asistencia.deleteMany(),
    prisma.historialEstructuraSalarial.deleteMany(),
    prisma.estructuraSalarial.deleteMany(),
    prisma.ordenProduccion.deleteMany(),
    prisma.recetaDetalle.deleteMany(),
    prisma.receta.deleteMany(),
    prisma.movimientoInsumo.deleteMany(),
    prisma.historialPrecio.deleteMany(),
    prisma.stockActual.deleteMany(),
    prisma.stockProducto.deleteMany(),
    prisma.resumenProduccionDiaria.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.vendedor.deleteMany(),
    prisma.empleado.deleteMany(),
    prisma.producto.deleteMany(),
    prisma.insumo.deleteMany(),
    prisma.configuracionAporte.deleteMany(),
    prisma.escalaAntiguedad.deleteMany(),
    prisma.rolPermiso.deleteMany(),
    prisma.permiso.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);
  console.log('✓ base de datos vaciada');
}

/**
 * Borra solo los DATOS OPERATIVOS y deja la base lista para cargar de cero.
 *
 * CONSERVA: usuarios (para seguir logueándote), el sistema de permisos
 *   (permisos / rol-permiso) y la configuración de RRHH (aportes y escalas de
 *   antigüedad), porque la app las necesita y no hay UI para recrearlas.
 *
 * BORRA: insumos, stock, movimientos, historial de precios, productos, recetas,
 *   órdenes de producción y consumos, ventas, clientes, vendedores, empleados,
 *   liquidaciones/recibos/asistencias, estructura salarial y su historial,
 *   resumen de producción y todos los logs de auditoría.
 */
export async function wipeDatosOperativos() {
  await prisma.$transaction([
    prisma.auditoriaLog.deleteMany(),
    prisma.consumoInsumo.deleteMany(),
    prisma.ventaDetalle.deleteMany(),
    prisma.venta.deleteMany(),
    prisma.reciboSueldo.deleteMany(),
    prisma.nominaMensual.deleteMany(),
    prisma.asistencia.deleteMany(),
    prisma.historialEstructuraSalarial.deleteMany(),
    prisma.estructuraSalarial.deleteMany(),
    prisma.ordenProduccion.deleteMany(),
    prisma.recetaDetalle.deleteMany(),
    prisma.receta.deleteMany(),
    prisma.movimientoInsumo.deleteMany(),
    prisma.historialPrecio.deleteMany(),
    prisma.stockActual.deleteMany(),
    prisma.stockProducto.deleteMany(),
    prisma.resumenProduccionDiaria.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.vendedor.deleteMany(),
    prisma.empleado.deleteMany(),
    prisma.producto.deleteMany(),
    prisma.insumo.deleteMany(),
  ]);
  console.log('✓ datos operativos borrados (se conservaron usuarios, permisos y config de RRHH)');
}
