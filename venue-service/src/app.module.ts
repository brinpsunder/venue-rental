import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { VenueModule } from './venue/venue.module';
import { VenueGrpcModule } from './grpc/venue-grpc.module';
import { Venue } from './venue/entities/venue.entity';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        database: config.get('DB_NAME', 'venues'),
        username: config.get('DB_USER', 'admin'),
        password: config.get('DB_PASSWORD', 'password'),
        entities: [Venue],
        // synchronize: true auto-creates/updates tables from entities.
        // Replace with migrations before production use.
        synchronize: true,
      }),
    }),
    VenueModule,
    VenueGrpcModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
