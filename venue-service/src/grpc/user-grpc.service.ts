import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface UserServiceClient {
  verifyToken(data: { token: string }): Observable<{
    valid: boolean;
    user_id: number;
    email: string;
    role: string;
  }>;
  getUser(data: { user_id: number }): Observable<{
    id: number;
    email: string;
    role: string;
  }>;
}

export interface VerifyTokenResult {
  valid: boolean;
  userId: number;
  email: string;
  role: string;
}

@Injectable()
export class UserGrpcService implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject('USER_GRPC_CLIENT') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');
  }

  async verifyToken(token: string): Promise<VerifyTokenResult> {
    const response = await firstValueFrom(
      this.userService.verifyToken({ token }),
    );
    return {
      valid: response.valid,
      userId: response.user_id,
      email: response.email,
      role: response.role,
    };
  }
}
