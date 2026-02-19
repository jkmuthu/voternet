import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../../libraries/config/config.js';
import { AppDataSource } from '../../../libraries/database/data-source.js';
import { User } from '../../../libraries/database/entities/User.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Please log in.'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const jwtSecret = config.get('jwt.secret') as string;
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Get user from database
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: decoded.userId, isActive: true }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
