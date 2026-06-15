import { prisma, seedInsumos } from './seed-helpers.js';

/**
 * Carga (o completa) el catálogo de materia prima y envases.
 * Usa upsert por código: no borra nada, se puede correr después de
 * `reset:datos` para repoblar el catálogo de insumos.
 *
 * Se cargan en $0 / stock 0, marcados como "pendiente" — completar
 * precio, costo y stock real desde Inventario.
 *
 *   npm run seed:insumos
 */
async function main() {
  await seedInsumos();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
