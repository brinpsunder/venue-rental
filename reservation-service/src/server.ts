import 'dotenv/config';
import { buildApp } from './app';
import { initDb } from './db/database';
import { connectPublisher } from './messaging/publisher';
import { startConsumer } from './messaging/consumer';

async function bootstrap() {
  const app = await buildApp();

  await initDb();
  app.log.info('Database initialized');

  await connectPublisher();
  app.log.info('RabbitMQ publisher connected');

  await startConsumer();
  app.log.info('RabbitMQ consumer started');

  const port = Number(process.env.PORT ?? 3003);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`reservation-service listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start reservation-service', err);
  process.exit(1);
});
