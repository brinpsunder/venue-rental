import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { VenueGrpcService } from '../grpc/venue-grpc.service';
import { UserGrpcService } from '../grpc/user-grpc.service';
import { VenueRestClient } from '../rest/venue-rest.client';
import { AuthGuard } from '../common/auth.guard';

@Module({
  imports: [GrpcClientModule],
  controllers: [VenuesController],
  providers: [VenueGrpcService, UserGrpcService, VenueRestClient, AuthGuard],
})
export class VenuesModule {}
