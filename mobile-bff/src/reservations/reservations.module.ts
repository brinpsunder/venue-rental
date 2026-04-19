import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationRestClient } from '../rest/reservation.client';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { UserGrpcService } from '../grpc/user-grpc.service';
import { AuthGuard } from '../common/auth.guard';

@Module({
  imports: [GrpcClientModule],
  controllers: [ReservationsController],
  providers: [ReservationRestClient, UserGrpcService, AuthGuard],
})
export class ReservationsModule {}
