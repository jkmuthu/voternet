import { Router } from 'express';
import * as userController from './user.controller.js';
import { authMiddleware } from '../../../middleware/auth-middleware.js';

export const userRoutes = Router();

userRoutes.get('/me', authMiddleware, userController.getProfile);
userRoutes.put('/me', authMiddleware, userController.updateProfile);
