import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { UserGrpcService } from '../src/grpc/user-grpc.service';

const mockGrpcClient = {
  getService: jest.fn(),
};

const mockUserServiceStub = {
  verifyToken: jest.fn(),
};

describe('UserGrpcService', () => {
  let service: UserGrpcService;

  beforeEach(async () => {
    mockGrpcClient.getService.mockReturnValue(mockUserServiceStub);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGrpcService,
        {
          provide: 'USER_GRPC_CLIENT',
          useValue: mockGrpcClient,
        },
      ],
    }).compile();

    service = module.get<UserGrpcService>(UserGrpcService);
    service.onModuleInit();
    jest.clearAllMocks();
    mockGrpcClient.getService.mockReturnValue(mockUserServiceStub);
    service.onModuleInit();
  });

  describe('verifyToken', () => {
    it('should return valid result when token is valid', async () => {
      mockUserServiceStub.verifyToken.mockReturnValue(
        of({ valid: true, user_id: 42, email: 'owner@test.com', role: 'OWNER' }),
      );

      const result = await service.verifyToken('valid-token');

      expect(mockUserServiceStub.verifyToken).toHaveBeenCalledWith({
        token: 'valid-token',
      });
      expect(result).toEqual({
        valid: true,
        userId: 42,
        email: 'owner@test.com',
        role: 'OWNER',
      });
    });

    it('should return invalid result when token is invalid', async () => {
      mockUserServiceStub.verifyToken.mockReturnValue(
        of({ valid: false, user_id: 0, email: '', role: '' }),
      );

      const result = await service.verifyToken('bad-token');

      expect(result.valid).toBe(false);
    });

    it('should propagate error when gRPC call fails', async () => {
      mockUserServiceStub.verifyToken.mockReturnValue(
        throwError(() => new Error('gRPC connection failed')),
      );

      await expect(service.verifyToken('some-token')).rejects.toThrow(
        'gRPC connection failed',
      );
    });
  });
});
