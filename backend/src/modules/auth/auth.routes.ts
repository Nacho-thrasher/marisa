import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import * as ctrl from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(ctrl.loginHandler));
authRouter.post('/refresh', asyncHandler(ctrl.refreshHandler));
authRouter.post('/logout', authenticate, asyncHandler(ctrl.logoutHandler));
authRouter.get('/me', authenticate, asyncHandler(ctrl.meHandler));
