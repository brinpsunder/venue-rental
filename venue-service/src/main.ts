import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'venue',
      protoPath: join(__dirname, 'proto', 'venue.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT ?? '50052'}`,
    },
  });

  await app.startAllMicroservices();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Venue Service API')
    .setDescription('API for managing venues')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3002;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`venue-service REST running on port ${port}`);
  logger.log(`venue-service gRPC running on port ${process.env.GRPC_PORT ?? '50052'}`);
}

bootstrap();
