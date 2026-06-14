import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { insumosRouter } from './modules/insumos/insumos.routes.js';
import { productosRouter } from './modules/productos/productos.routes.js';
import { produccionRouter } from './modules/produccion/produccion.routes.js';
import { ventasRouter } from './modules/ventas/ventas.routes.js';
import { clientesRouter } from './modules/clientes/clientes.routes.js';
import { vendedoresRouter } from './modules/vendedores/vendedores.routes.js';
import { empleadosRouter } from './modules/empleados/empleados.routes.js';
import { aportesRouter, nominaRouter } from './modules/nomina/nomina.routes.js';
import { auditoriaRouter } from './modules/auditoria/auditoria.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/insumos', insumosRouter);
apiRouter.use('/productos', productosRouter);
apiRouter.use('/produccion', produccionRouter);
apiRouter.use('/ventas', ventasRouter);
apiRouter.use('/clientes', clientesRouter);
apiRouter.use('/vendedores', vendedoresRouter);
apiRouter.use('/empleados', empleadosRouter);
apiRouter.use('/aportes-configuracion', aportesRouter);
apiRouter.use('/nomina', nominaRouter);
apiRouter.use('/auditoria', auditoriaRouter);
