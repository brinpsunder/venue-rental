import Fastify from 'fastify';
import { swaggerPlugin } from './plugins/swagger';
import { healthRoutes } from './routes/health';
import { reservationRoutes } from './routes/reservations';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  await app.register(swaggerPlugin);
  await app.register(healthRoutes);
  await app.register(reservationRoutes, { prefix: '/reservations' });

  return app;
}
