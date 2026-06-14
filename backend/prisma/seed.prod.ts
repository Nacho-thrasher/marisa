import {
  prisma,
  wipeAll,
  crearAdmin,
  seedInsumos,
  seedConfiguracionRRHH,
  seedProductosYRecetas,
  seedVendedores,
} from './seed-helpers.js';

/**
 * RESET DE PRODUCCIÓN (destructivo).
 *
 * Borra TODOS los datos y deja la base lista para arrancar:
 *   • 1 usuario administrador (de ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD)
 *   • catálogo: insumos + stock, productos con listas de precios, recetas,
 *     vendedores y configuración de aportes/antigüedad.
 *
 * NO crea: clientes, empleados, ventas ni nómina (se cargan desde la app).
 *
 * Protección: requiere `--force` o CONFIRM_RESET=YES para ejecutarse.
 *   npm run seed:reset -- --force
 */
async function main() {
  const confirmado = process.argv.includes('--force') || process.env.CONFIRM_RESET === 'YES';
  if (!confirmado) {
    console.error('\n⛔  RESET ABORTADO: este script BORRA todos los datos.');
    console.error('   Para confirmar, ejecutá:  npm run seed:reset -- --force');
    console.error('   (o seteá la variable de entorno CONFIRM_RESET=YES)\n');
    process.exit(1);
  }

  console.log('♻️  Reset de producción...');
  await wipeAll();
  await crearAdmin();
  await seedInsumos();
  await seedConfiguracionRRHH();
  await seedProductosYRecetas();
  await seedVendedores();
  console.log('Reset completo ✅  — base lista con 1 admin + catálogo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
