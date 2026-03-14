import LoginUser from '../../src/use-cases/LoginUser';
import IUserRepository from '../../src/domain/repositories/IUserRepository';
import User from '../../src/domain/entities/User';
import bcrypt from 'bcrypt';

process.env.JWT_SECRET = 'test-secret';

const mockRepository: jest.Mocked<IUserRepository> = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

describe('LoginUser', () => {
  let loginUser: LoginUser;

  beforeEach(() => {
    jest.clearAllMocks();
    loginUser = new LoginUser(mockRepository);
  });

  test('should return token and user on successful login', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({ id: 1, email: 'test@test.com', passwordHash, role: 'RENTER', createdAt: new Date(), updatedAt: new Date() });
    mockRepository.findByEmail.mockResolvedValue(user);

    const result = await loginUser.execute({ email: 'test@test.com', password: 'password123' });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@test.com');
  });

  test('should throw error if user not found', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);

    await expect(
      loginUser.execute({ email: 'notfound@test.com', password: 'password123' })
    ).rejects.toThrow('Invalid credentials');
  });

  test('should throw error if password is incorrect', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10);
    const user = new User({ id: 1, email: 'test@test.com', passwordHash, role: 'RENTER', createdAt: new Date(), updatedAt: new Date() });
    mockRepository.findByEmail.mockResolvedValue(user);

    await expect(
      loginUser.execute({ email: 'test@test.com', password: 'wrongpassword' })
    ).rejects.toThrow('Invalid credentials');
  });
});
