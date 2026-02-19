import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../libraries/database/entities/User.js';

/**
 * Authorization middleware - checks if user has required role
 * Must be used after authenticate middleware
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
};
