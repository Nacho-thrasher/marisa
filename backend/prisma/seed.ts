import {
  prisma,
  seedUsuariosDemo,
  seedInsumos,
  seedConfiguracionRRHH,
  seedProductosYRecetas,
  seedEmpleados,
  seedVendedores,
  seedClientesDemo,
} from './seed-helpers.js';

/** Seed de DESARROLLO: usuarios demo + catálogo + datos de ejemplo. */
async function main() {
  console.log('Seeding (desarrollo)...');
  await seedUsuariosDemo();
  await seedInsumos();
  await seedConfiguracionRRHH();
  await seedProductosYRecetas();
  await seedEmpleados();
  await seedVendedores();
  await seedClientesDemo();
  console.log('Seed completo ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
