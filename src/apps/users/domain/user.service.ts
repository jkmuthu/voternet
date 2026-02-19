import { AppDataSource } from '../../../libraries/database/data-source.js';
import { User } from '../../../libraries/database/entities/User.js';
import { AuditLog } from '../../../libraries/database/entities/AuditLog.js';
import { AppError } from '../../../middleware/error-handler.js';
import { UpdateProfileRequestDTO, UserProfileResponseDTO } from './user.dto.js';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private auditRepository = AppDataSource.getRepository(AuditLog);

  async getProfile(userId: string): Promise<UserProfileResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileRequestDTO,
    ipAddress?: string
  ): Promise<UserProfileResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const oldValue = {
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Update only provided fields
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    const updatedUser = await this.userRepository.save(user);

    // Log audit
    await this.auditRepository.save({
      actionByUserId: userId,
      actionType: 'profile_updated',
      resourceType: 'user',
      resourceId: userId,
      oldValue,
      newValue: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      },
      ipAddress
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      emailVerified: updatedUser.emailVerified,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }
}
