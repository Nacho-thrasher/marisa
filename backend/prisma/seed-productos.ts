import { prisma, seedProductosYRecetas } from './seed-helpers.js';

/**
 * Carga (o actualiza) el catálogo de productos y sus 4 listas de precios
 * (ver seedProductosYRecetas en seed-helpers.ts). Usa upsert por código:
 * no borra nada, se puede correr después de `reset:datos` para repoblar el
 * catálogo, o en cualquier momento para actualizar precios.
 *
 *   npm run seed:productos
 */
async function main() {
  await seedProductosYRecetas();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
