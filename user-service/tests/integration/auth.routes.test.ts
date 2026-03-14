import request from 'supertest';
import bcrypt from 'bcrypt';
import User from '../../src/domain/entities/User';
import PostgresUserRepository from '../../src/infrastructure/database/PostgresUserRepository';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/infrastructure/database/PostgresUserRepository');
jest.mock('../../src/infrastructure/database/db', () => ({ query: jest.fn(), on: jest.fn() }));

import app from '../../src/app';

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    test('should register a new user and return 201', async () => {
      const savedUser = new User({ id: 1, email: 'test@test.com', passwordHash: 'h', role: 'RENTER', createdAt: new Date(), updatedAt: new Date() });
      jest.spyOn(PostgresUserRepository.prototype, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(PostgresUserRepository.prototype, 'save').mockResolvedValue(savedUser);

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123', role: 'RENTER' });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('test@test.com');
    });

    test('should return 400 if user already exists', async () => {
      const existing = new User({ id: 1, email: 'existing@test.com', passwordHash: 'h', role: 'RENTER', createdAt: new Date(), updatedAt: new Date() });
      jest.spyOn(PostgresUserRepository.prototype, 'findByEmail').mockResolvedValue(existing);

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'existing@test.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    test('should return token on successful login', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = new User({ id: 1, email: 'test@test.com', passwordHash, role: 'RENTER', createdAt: new Date(), updatedAt: new Date() });
      jest.spyOn(PostgresUserRepository.prototype, 'findByEmail').mockResolvedValue(user);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test('should return 401 with wrong credentials', async () => {
      jest.spyOn(PostgresUserRepository.prototype, 'findByEmail').mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });
});
