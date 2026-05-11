import { FastifyInstance } from 'fastify';
import { snapshot } from '../breakers/registry';

export async function adminRoutes(app: FastifyInstance) {
  app.get('/admin/breakers', async () => ({
    service: 'reservation-service',
    breakers: snapshot(),
  }));
}
