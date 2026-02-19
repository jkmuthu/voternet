import Joi from 'joi';

export interface RegisterRequestDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export const RegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required()
});

export const LoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const RefreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});
