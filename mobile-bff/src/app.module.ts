import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VenuesModule } from './venues/venues.module';
import { ReservationsModule } from './reservations/reservations.module';
import { MobileModule } from './mobile/mobile.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [HealthModule, AuthModule, VenuesModule, ReservationsModule, MobileModule, AdminModule],
})
export class AppModule {}
