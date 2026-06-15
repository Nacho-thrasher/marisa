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
  // Catálogo y listas de precios reales (Excel "LISTA MARZO 26", hoja
  // REV-COM-MOS-MATI-FIAMB, actualizada al 11/05/26).
  // Mapeo de columnas del Excel -> listas del sistema (de menor a mayor precio):
  //   MATIAS -> Mayorista | REVEND -> Revendedor | COMER -> Comercio | MOSTRA -> Público
  // (La columna FIAMBR del Excel coincide casi siempre con REVEND, así que no
  // se usa como lista aparte: "Fiambrería" sería un cliente más con lista Revendedor.)
  const productos = [
    { codigo: 'PAPA-45', nombre: 'Papas Fritas x 45g', categoria: 'papas_fritas', peso: 45, mayo: 590, rev: 600, com: 800, pub: 1500 },
    { codigo: 'PAPA-90', nombre: 'Papas Fritas x 90g', categoria: 'papas_fritas', peso: 90, mayo: 1010, rev: 1050, com: 1200, pub: 2000 },
    { codigo: 'PAPA-190', nombre: 'Papas Fritas x 190g', categoria: 'papas_fritas', peso: 190, mayo: 1770, rev: 1960, com: 2500, pub: 3500 },
    { codigo: 'PAPA-500', nombre: 'Papas Fritas x 500g', categoria: 'papas_fritas', peso: 500, mayo: 3650, rev: 4100, com: 4800, pub: 5500 },
    { codigo: 'PAPA-1K', nombre: 'Papas Fritas x 1kg', categoria: 'papas_fritas', peso: 1000, mayo: 8050, rev: 8600, com: 9000, pub: 10000 },
    { codigo: 'LLUVIA-150', nombre: 'Lluvia de Papa x 150g', categoria: 'papas_fritas', peso: 150, mayo: 1450, rev: 1400, com: 1600, pub: 2500 },
    { codigo: 'LLUVIA-250', nombre: 'Lluvia de Papa x 250g', categoria: 'papas_fritas', peso: 250, mayo: 2300, rev: 2300, com: 3000, pub: 3500 },
    { codigo: 'LLUVIA-500', nombre: 'Lluvia de Papa x 500g', categoria: 'papas_fritas', peso: 500, mayo: 3650, rev: 4100, com: 4800, pub: 5500 },
    { codigo: 'LLUVIA-1K', nombre: 'Lluvia de Papa x 1kg', categoria: 'papas_fritas', peso: 1000, mayo: 8050, rev: 8600, com: 9000, pub: 10000 },
    { codigo: 'PALITO-100', nombre: 'Palitos Salados x 100g', categoria: 'palitos', peso: 100, mayo: 470, rev: 500, com: 800, pub: 1500 },
    { codigo: 'PALITO-250', nombre: 'Palitos Salados x 250g', categoria: 'palitos', peso: 250, mayo: 1060, rev: 1100, com: 1300, pub: 2500 },
    { codigo: 'PALITO-500', nombre: 'Palitos Salados x 500g', categoria: 'palitos', peso: 500, mayo: 1770, rev: 1800, com: 2500, pub: 3500 },
    { codigo: 'PALITO-1K', nombre: 'Palitos Salados x 1kg', categoria: 'palitos', peso: 1000, mayo: 3800, rev: 3900, com: 4500, pub: 5500 },
    { codigo: 'MANI-90', nombre: 'Maní Salados x 90g', categoria: 'mani', peso: 90, mayo: 650, rev: 660, com: 900, pub: 1500 },
    { codigo: 'MANI-190', nombre: 'Maní Salados x 190g', categoria: 'mani', peso: 190, mayo: 1180, rev: 1200, com: 1400, pub: 2500 },
    { codigo: 'MANI-500', nombre: 'Maní Salados x 500g', categoria: 'mani', peso: 500, mayo: 2600, rev: 2600, com: 3000, pub: 4000 },
    { codigo: 'MANI-1K', nombre: 'Maní Salados x 1kg', categoria: 'mani', peso: 1000, mayo: 4700, rev: 4800, com: 5400, pub: 6000 },
    { codigo: 'CHIZITO-150', nombre: 'Chizitos x 150g', categoria: 'snacks', peso: 150, mayo: 1000, rev: 1050, com: 1400, pub: 2500 },
    { codigo: 'CHIZITO-300', nombre: 'Chizitos x 300g', categoria: 'snacks', peso: 300, mayo: 2000, rev: 2100, com: 2800, pub: 4000 },
    { codigo: 'PUFLITO-150', nombre: 'Puflitos x 150g', categoria: 'snacks', peso: 150, mayo: 1000, rev: 1050, com: 1400, pub: 2500 },
    { codigo: 'PUFLITO-300', nombre: 'Puflitos x 300g', categoria: 'snacks', peso: 300, mayo: 2000, rev: 2100, com: 2800, pub: 4000 },
    { codigo: 'CHIZO-PUFLO-1K', nombre: 'Chizo - Puflo x Kg', categoria: 'snacks', peso: 1000, mayo: 5200, rev: 6100, com: 9000, pub: 10000 },
    { codigo: 'PREPIZZA-ESP', nombre: 'Pizza Especial x 300g', categoria: 'panificados', peso: 300, mayo: 880, rev: 950, com: 1200, pub: 1500 },
    { codigo: 'PREPIZZA-C', nombre: 'Pizza Común x 200g', categoria: 'panificados', peso: 200, mayo: 650, rev: 660, com: 900, pub: 1200 },
    { codigo: 'PAN-VIENA-6', nombre: 'Pan de Viena x 6 u', categoria: 'panificados', peso: null, mayo: 760, rev: 800, com: 1100, pub: 1400 },
    { codigo: 'PAN-HAMB-6', nombre: 'Pan de Hamburguesa x 6 u', categoria: 'panificados', peso: null, mayo: 900, rev: 970, com: 1200, pub: 1500 },
    { codigo: 'PAN-PATY-4', nombre: 'Pan de Paty x 4 u', categoria: 'panificados', peso: null, mayo: 760, rev: 800, com: 1100, pub: 1400 },
    // ⚠ Mayorista estimado en 920: el Excel trae 2900 en esta celda, que
    // parece un copy-paste del valor de "Pan de Hamburguesa x 20" (fila 35).
    // Se usa la misma proporción Mayorista/Revendedor (~0,97) que el Mix
    // Cervecero x190.
    { codigo: 'MIX-CERV-90', nombre: 'Mix Cervecero x 90g', categoria: 'snacks', peso: 90, mayo: 920, rev: 950, com: 1200, pub: 2000 },
    { codigo: 'MIX-CERV-190', nombre: 'Mix Cervecero x 190g', categoria: 'snacks', peso: 190, mayo: 1650, rev: 1700, com: 2000, pub: 3000 },
    // ⚠ Revendedor/Comercio/Mayorista estimados: el Excel solo trae el precio
    // Mostrador (5500) para esta presentación. Se estimaron con la misma
    // proporción que el Mix Cervecero x190 respecto de su Mostrador.
    { codigo: 'MIX-CERV-500', nombre: 'Mix Cervecero x 500g', categoria: 'snacks', peso: 500, mayo: 3000, rev: 3100, com: 3700, pub: 5500 },
    // ⚠ Comercio/Mayorista estimados: el Excel solo trae Revendedor (15800) y
    // Mostrador (17000). Se usa el precio Revendedor también para Comercio y
    // Mayorista (combo pensado para venta a revendedores).
    { codigo: 'BOLSON-1-GRANDE', nombre: 'Bolsón I Grande', categoria: 'combos', peso: null, mayo: 15800, rev: 15800, com: 15800, pub: 17000 },
    // ⚠ Comercio/Mayorista estimados con el mismo criterio que el Bolsón I
    // (el Excel solo trae Revendedor 7960 y Mostrador 12000).
    { codigo: 'BOLSON-2-CHICO', nombre: 'Bolsón II Chico', categoria: 'combos', peso: null, mayo: 7960, rev: 7960, com: 7960, pub: 12000 },
    // ⚠ Revendedor/Comercio/Mostrador estimados: el Excel solo trae Mayorista
    // (2900) para esta presentación. Se escala el precio de "Pan de
    // Hamburguesa x 6" con el mismo factor (~3,2) que separa los 2900 de los
    // 900 de Mayorista x6.
    { codigo: 'PAN-HAMB-20', nombre: 'Pan de Hamburguesa x 20 u', categoria: 'panificados', peso: null, mayo: 2900, rev: 3100, com: 3850, pub: 4800 },
  ];
  for (const p of productos) {
    await prisma.producto.upsert({
      where: { codigo: p.codigo },
      update: {
        precioVenta: D(p.rev),
        precioRevendedor: D(p.rev),
        precioMayorista: D(p.mayo),
        precioComercio: D(p.com),
        precioPublico: D(p.pub),
      },
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        pesoGramos: p.peso ?? undefined,
        precioVenta: D(p.rev),
        precioRevendedor: D(p.rev),
        precioMayorista: D(p.mayo),
        precioComercio: D(p.com),
        precioPublico: D(p.pub),
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
