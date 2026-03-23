import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venue } from './entities/venue.entity';
import { VenueService } from './venue.service';
import { VenueController } from './venue.controller';
import { GrpcClientModule } from '../grpc/grpc-client.module';
import { UserGrpcService } from '../grpc/user-grpc.service';
import { OwnerAuthGuard } from '../common/guards/owner-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Venue]), GrpcClientModule],
  providers: [VenueService, UserGrpcService, OwnerAuthGuard],
  controllers: [VenueController],
  exports: [VenueService],
})
export class VenueModule {}
