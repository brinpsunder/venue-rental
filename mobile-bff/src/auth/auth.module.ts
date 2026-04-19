import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserRestClient } from '../rest/user-rest.client';

@Module({
  controllers: [AuthController],
  providers: [UserRestClient],
})
export class AuthModule {}
