import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_GRPC_CLIENT',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(__dirname, '..', 'proto', 'user.proto'),
          url: `${process.env.USER_SERVICE_HOST ?? 'localhost'}:${process.env.USER_GRPC_PORT ?? '50051'}`,
          loader: { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true },
        },
      },
      {
        name: 'VENUE_GRPC_CLIENT',
        transport: Transport.GRPC,
        options: {
          package: 'venue',
          protoPath: join(__dirname, '..', 'proto', 'venue.proto'),
          url: `${process.env.VENUE_SERVICE_HOST ?? 'localhost'}:${process.env.VENUE_GRPC_PORT ?? '50052'}`,
          loader: { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientModule {}
