import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { VenueGrpcService } from '../grpc/venue-grpc.service';
import { UserGrpcService } from '../grpc/user-grpc.service';
import { VenueRestClient } from '../rest/venue-rest.client';
import { ReservationRestClient } from '../rest/reservation.client';
import { AuthGuard } from '../common/auth.guard';

@Module({
  imports: [GrpcClientModule],
  controllers: [MobileController],
  providers: [
    VenueGrpcService,
    UserGrpcService,
    VenueRestClient,
    ReservationRestClient,
    AuthGuard,
  ],
})
export class MobileModule {}
