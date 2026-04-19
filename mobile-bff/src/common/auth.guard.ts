import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserGrpcService } from '../grpc/user-grpc.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userGrpcService: UserGrpcService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] ?? '';

    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    let result;
    try {
      result = await this.userGrpcService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Token verification failed');
    }

    if (!result.valid) throw new UnauthorizedException('Invalid or expired token');

    req.user = { userId: result.userId, email: result.email, role: result.role };
    req.token = token;
    return true;
  }
}
