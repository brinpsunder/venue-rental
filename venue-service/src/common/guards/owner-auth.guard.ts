import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UserGrpcService } from '../../grpc/user-grpc.service';

@Injectable()
export class OwnerAuthGuard implements CanActivate {
  constructor(private readonly userGrpcService: UserGrpcService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    let result;
    try {
      result = await this.userGrpcService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Token verification failed');
    }

    if (!result.valid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (result.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can perform this action');
    }

    request.user = {
      userId: result.userId,
      email: result.email,
      role: result.role,
    };

    return true;
  }
}
