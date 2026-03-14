import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../../src/domain/entities/User';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/infrastructure/database/PostgresUserRepository');
import PostgresUserRepository from '../../src/infrastructure/database/PostgresUserRepository';

import app from '../../src/app';

const MockedRepo = PostgresUserRepository as jest.MockedClass<typeof PostgresUserRepository>;

describe('User Routes', () => {
  let token: string;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ userId: 1, email: 'test@test.com', role: 'RENTER' }, 'test-secret');
  });

  describe('GET /users/:id', () => {
    test('should return user by id', async () => {
      const user = new User({ id: 1, email: 'test@test.com', passwordHash: 'h', role: 'RENTER', createdAt: new Date(), updatedAt: new Date() });
      MockedRepo.prototype.findById = jest.fn().mockResolvedValue(user);

      const res = await request(app)
        .get('/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@test.com');
    });

    test('should return 401 if no token provided', async () => {
      const res = await request(app).get('/users/1');
      expect(res.status).toBe(401);
    });

    test('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/users/1')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });

    test('should return 404 if user not found', async () => {
      MockedRepo.prototype.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .get('/users/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
