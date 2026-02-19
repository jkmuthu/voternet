import { Request, Response, NextFunction } from 'express';
import { UserService } from '../domain/user.service.js';
import { UpdateProfileSchema } from '../domain/user.dto.js';
import { AppError } from '../../../middleware/error-handler.js';

const userService = new UserService();

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      return next(new AppError(401, 'Missing authorization'));
    }

    const profile = await userService.getProfile(req.auth.userId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) {
      return next(new AppError(401, 'Missing authorization'));
    }

    const { error, value } = UpdateProfileSchema.validate(req.body);
    if (error) {
      return next(new AppError(400, error.details[0].message));
    }

    const profile = await userService.updateProfile(
      req.auth.userId,
      value,
      req.ip
    );
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}
