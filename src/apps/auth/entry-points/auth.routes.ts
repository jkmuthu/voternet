import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authMiddleware } from '../../../middleware/auth-middleware.js';

export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.post('/refresh', authController.refreshToken);
authRoutes.post('/logout', authMiddleware, authController.logout);
