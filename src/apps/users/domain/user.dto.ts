import Joi from 'joi';

export interface UpdateProfileRequestDTO {
  firstName?: string;
  lastName?: string;
}

export interface UserProfileResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UpdateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).optional(),
  lastName: Joi.string().min(2).max(100).optional()
});
