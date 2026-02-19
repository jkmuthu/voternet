import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../domain/auth.service.js';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema
} from '../domain/auth.dto.js';
import { AppError } from '../../../middleware/error-handler.js';

const authService = new AuthService();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = RegisterSchema.validate(req.body);
    if (error) {
      return next(new AppError(400, error.details[0].message));
    }

    const result = await authService.register(value, req.ip);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = LoginSchema.validate(req.body);
    if (error) {
      return next(new AppError(400, error.details[0].message));
    }

    const result = await authService.login(value, req.ip);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { error, value } = RefreshTokenSchema.validate(req.body);
    if (error) {
      return next(new AppError(400, error.details[0].message));
    }

    const result = await authService.refreshToken(value.refreshToken, req.ip);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      return next(new AppError(401, 'Missing authorization'));
    }

    await authService.logout(req.auth.userId, req.ip);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}
