import { prisma, seedVendedores } from './seed-helpers.js';

/**
 * Carga (o completa) la lista real de vendedores con su zona de venta.
 * No borra ni reemplaza vendedores existentes: solo crea los que falten
 * (busca por nombre exacto).
 *
 *   npm run seed:vendedores
 */
async function main() {
  await seedVendedores();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
