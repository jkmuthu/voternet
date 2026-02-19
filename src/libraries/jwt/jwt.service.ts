import jwt, { SignOptions } from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { config } from '../config/config.js';
import { logger } from '../logger/logger.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export class JWTService {
  static sign(payload: { userId: string; email: string; role: string }) {
    const secret = config.get('jwt.secret') as string;
    const expiresIn = config.get('jwt.expiresIn');

    const signOptions: any = {
      expiresIn,
      algorithm: 'HS256'
    };

    const accessToken = jwt.sign(payload, secret, signOptions);

    const refreshSignOptions: any = {
      expiresIn: config.get('jwt.refreshExpiresIn'),
      algorithm: 'HS256'
    };

    const refreshToken = jwt.sign(payload, secret, refreshSignOptions);

    return { accessToken, refreshToken };
  }

  static verify(token: string): JWTPayload {
    const secret = config.get('jwt.secret') as string;
    return jwt.verify(token, secret, {
      algorithms: ['HS256']
    }) as JWTPayload;
  }

  static async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, 10);
  }

  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcryptjs.compare(password, hash);
  }

  static async hashRefreshToken(token: string): Promise<string> {
    return bcryptjs.hash(token, 10);
  }

  static async verifyRefreshTokenHash(
    token: string,
    hash: string
  ): Promise<boolean> {
    return bcryptjs.compare(token, hash);
  }
}
