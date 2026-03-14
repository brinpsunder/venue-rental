import RegisterUser from '../../src/use-cases/RegisterUser';
import IUserRepository from '../../src/domain/repositories/IUserRepository';
import User from '../../src/domain/entities/User';

const mockRepository: jest.Mocked<IUserRepository> = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockUser = new User({
  id: 1,
  email: 'test@test.com',
  passwordHash: 'hashed',
  role: 'RENTER',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('RegisterUser', () => {
  let registerUser: RegisterUser;

  beforeEach(() => {
    jest.clearAllMocks();
    registerUser = new RegisterUser(mockRepository);
  });

  test('should register a new user successfully', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(mockUser);

    const result = await registerUser.execute({ email: 'test@test.com', password: 'password123', role: 'RENTER' });

    expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  test('should default role to RENTER if not provided', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(mockUser);

    await registerUser.execute({ email: 'test@test.com', password: 'password123' });

    const savedUser: User = mockRepository.save.mock.calls[0][0];
    expect(savedUser.role).toBe('RENTER');
  });

  test('should throw error if user already exists', async () => {
    mockRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(
      registerUser.execute({ email: 'test@test.com', password: 'password123' })
    ).rejects.toThrow('User already exists');
  });

  test('should hash the password before saving', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(mockUser);

    await registerUser.execute({ email: 'test@test.com', password: 'password123' });

    const savedUser: User = mockRepository.save.mock.calls[0][0];
    expect(savedUser.passwordHash).not.toBe('password123');
  });
});
