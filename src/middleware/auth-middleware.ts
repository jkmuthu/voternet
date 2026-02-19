import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../libraries/jwt/jwt.service.js';
import { AppError } from './error-handler.js';

declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError(401, 'Missing authorization token'));
  }

  try {
    const payload = JWTService.verify(token);
    req.auth = payload;
    next();
  } catch (error) {
    next(new AppError(401, 'Invalid or expired token'));
  }
}
