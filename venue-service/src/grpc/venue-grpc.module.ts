import { Module } from '@nestjs/common';
import { VenueGrpcController } from './venue-grpc.controller';
import { VenueModule } from '../venue/venue.module';

@Module({
  imports: [VenueModule],
  controllers: [VenueGrpcController],
})
export class VenueGrpcModule {}
