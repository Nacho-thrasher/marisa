import { prisma, wipeDatosOperativos } from './seed-helpers.js';

/**
 * RESET DE DATOS OPERATIVOS (destructivo, conserva los usuarios).
 *
 * Deja la base lista para empezar a cargar de cero, PERO mantiene tus
 * usuarios para que puedas seguir entrando con las mismas credenciales.
 *
 * CONSERVA:
 *   • usuarios (todos)
 *   • sistema de permisos (permisos / rol-permiso)
 *   • configuración de RRHH (aportes y escalas de antigüedad)
 *
 * BORRA todo lo demás: insumos, stock, movimientos, productos, recetas,
 *   órdenes de producción, ventas, clientes, vendedores, empleados,
 *   liquidaciones de sueldo y logs de auditoría.
 *
 * Protección: requiere `--force` o CONFIRM_RESET=YES.
 *   Desarrollo:  npm run reset:datos -- --force
 *   Producción:  npm run reset:datos:prod -- --force   (usa dist/ compilado)
 */
async function main() {
  const confirmado = process.argv.includes('--force') || process.env.CONFIRM_RESET === 'YES';
  if (!confirmado) {
    console.error('\n⛔  RESET ABORTADO: esto BORRA todos los datos operativos.');
    console.error('   Se CONSERVAN los usuarios, permisos y la config de RRHH.');
    console.error('   Para confirmar, ejecutá:  npm run reset:datos -- --force');
    console.error('   (o seteá la variable de entorno CONFIRM_RESET=YES)\n');
    process.exit(1);
  }

  console.log('♻️  Borrando datos operativos (se conservan los usuarios)...');
  await wipeDatosOperativos();
  console.log('Listo ✅  — base vacía para cargar desde cero. Tus usuarios siguen activos.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
