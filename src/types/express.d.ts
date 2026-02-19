import { JWTPayload } from '../libraries/jwt/jwt.service.js';

declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload;
    }
  }
}
