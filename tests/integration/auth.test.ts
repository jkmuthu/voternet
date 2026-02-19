import request from 'supertest';
import app from '../../main';
import { AppDataSource } from '../../libraries/database/data-source';
import { User } from '../../libraries/database/entities/User';

describe('Authentication Endpoints', () => {
  let userRepository: any;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    userRepository = AppDataSource.getRepository(User);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Doe'
        });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Smith'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already registered');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('POST /auth/logout', () => {
    let token: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      token = registerResponse.body.accessToken;
    });

    it('should logout with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(401);
    });
  });
});
