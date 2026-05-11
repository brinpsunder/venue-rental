import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import CircuitBreaker from 'opossum';
import { makeBreaker } from '../breakers/registry';

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

export interface UserResult {
  id: number;
  email: string;
  role: string;
}

@Injectable()
export class UserGrpcService implements OnModuleInit {
  private userService: UserServiceClient;
  private verifyTokenBreaker: CircuitBreaker<[string], VerifyTokenResult>;
  private getUserBreaker: CircuitBreaker<[number], UserResult>;

  constructor(@Inject('USER_GRPC_CLIENT') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');

    // Brez fallbacka — odpoved avtentikacije naj se propagira (401), ne pa
    // tihih lažnih uspehov.
    this.verifyTokenBreaker = makeBreaker('user.verifyToken', (token: string) =>
      firstValueFrom(this.userService.verifyToken({ token })).then((res) => ({
        valid: res.valid,
        userId: res.user_id,
        email: res.email,
        role: res.role,
      })),
    );

    this.getUserBreaker = makeBreaker(
      'user.getUser',
      (userId: number) =>
        firstValueFrom(this.userService.getUser({ user_id: userId })).then((res) => ({
          id: res.id,
          email: res.email,
          role: res.role,
        })),
      (userId: number) => ({ id: userId, email: 'unknown', role: 'UNKNOWN' }),
    );
  }

  verifyToken(token: string): Promise<VerifyTokenResult> {
    return this.verifyTokenBreaker.fire(token);
  }

  getUser(userId: number): Promise<UserResult> {
    return this.getUserBreaker.fire(userId);
  }
}
