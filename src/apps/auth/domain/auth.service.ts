import { AppDataSource } from '../../../libraries/database/data-source.js';
import { User, UserRole } from '../../../libraries/database/entities/User.js';
import { Session } from '../../../libraries/database/entities/Session.js';
import { AuditLog } from '../../../libraries/database/entities/AuditLog.js';
import { JWTService } from '../../../libraries/jwt/jwt.service.js';
import { AppError } from '../../../middleware/error-handler.js';
import { logger } from '../../../libraries/logger/logger.js';
import { RegisterRequestDTO, LoginRequestDTO, AuthResponseDTO } from './auth.dto.js';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private sessionRepository = AppDataSource.getRepository(Session);
  private auditRepository = AppDataSource.getRepository(AuditLog);

  async register(
    dto: RegisterRequestDTO,
    ipAddress?: string
  ): Promise<AuthResponseDTO> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    // Hash password
    const passwordHash = await JWTService.hashPassword(dto.password);

    // Create user
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.VOTER
    });

    const savedUser = await this.userRepository.save(user);

    // Log audit
    await this.auditRepository.save({
      actionByUserId: savedUser.id,
      actionType: 'user_registered',
      resourceType: 'user',
      resourceId: savedUser.id,
      ipAddress
    });

    // Generate tokens
    const tokens = JWTService.sign({
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    });

    // Create session
    const refreshTokenHash = await JWTService.hashRefreshToken(tokens.refreshToken);
    await this.sessionRepository.save({
      userId: savedUser.id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress
    });

    logger.info({ userId: savedUser.id }, 'User registered');

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role
      }
    };
  }

  async login(dto: LoginRequestDTO, ipAddress?: string): Promise<AuthResponseDTO> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: dto.email }
    });

    if (!user || !(await JWTService.comparePassword(dto.password, user.passwordHash))) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(401, 'User account is inactive');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Log audit
    await this.auditRepository.save({
      actionByUserId: user.id,
      actionType: 'user_login',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress
    });

    // Generate tokens
    const tokens = JWTService.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Create session
    const refreshTokenHash = await JWTService.hashRefreshToken(tokens.refreshToken);
    await this.sessionRepository.save({
      userId: user.id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress
    });

    logger.info({ userId: user.id }, 'User login');

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }

  async refreshToken(refreshToken: string, ipAddress?: string): Promise<AuthResponseDTO> {
    // Verify JWT
    let payload;
    try {
      payload = JWTService.verify(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Find session
    const session = await this.sessionRepository.findOne({
      where: { userId: payload.userId },
      order: { createdAt: 'DESC' }
    });

    if (!session || new Date() > session.expiresAt) {
      throw new AppError(401, 'Refresh token expired or revoked');
    }

    // Verify token hash
    const isValid = await JWTService.verifyRefreshTokenHash(
      refreshToken,
      session.refreshTokenHash
    );

    if (!isValid) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: payload.userId }
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive');
    }

    // Generate new tokens
    const newTokens = JWTService.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Update session
    const newRefreshTokenHash = await JWTService.hashRefreshToken(
      newTokens.refreshToken
    );
    session.refreshTokenHash = newRefreshTokenHash;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionRepository.save(session);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }

  async logout(userId: string, ipAddress?: string): Promise<void> {
    // Invalidate all sessions for user
    await this.sessionRepository.delete({ userId });

    // Log audit
    await this.auditRepository.save({
      actionByUserId: userId,
      actionType: 'user_logout',
      resourceType: 'user',
      resourceId: userId,
      ipAddress
    });

    logger.info({ userId }, 'User logout');
  }
}
