import GetUser from '../../src/use-cases/GetUser';
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

describe('GetUser', () => {
  let getUser: GetUser;

  beforeEach(() => {
    jest.clearAllMocks();
    getUser = new GetUser(mockRepository);
  });

  test('should return public user data by id', async () => {
    mockRepository.findById.mockResolvedValue(mockUser);

    const result = await getUser.execute(1);

    expect(result.email).toBe('test@test.com');
    expect(result.role).toBe('RENTER');
    expect(mockRepository.findById).toHaveBeenCalledWith(1);
  });

  test('should throw error if user not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(getUser.execute(999)).rejects.toThrow('User not found');
  });
});
