import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { insumosRouter } from './modules/insumos/insumos.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/insumos', insumosRouter);
