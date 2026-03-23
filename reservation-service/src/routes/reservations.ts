import { FastifyInstance } from 'fastify';
import { ReservationService } from '../services/reservation.service';

const reservationSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    renter_id: { type: 'integer' },
    venue_id: { type: 'integer' },
    start_date: { type: 'string' },
    end_date: { type: 'string' },
    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
};

export async function reservationRoutes(app: FastifyInstance) {
  const service = new ReservationService();

  function getToken(req: any): string {
    const auth: string = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) {
      throw Object.assign(new Error('Missing or invalid authorization header'), { statusCode: 401 });
    }
    return auth.slice(7);
  }

  app.post('/reservations', {
    schema: {
      tags: ['reservations'],
      summary: 'Create a reservation (renters only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['venueId', 'startDate', 'endDate'],
        properties: {
          venueId: { type: 'integer', minimum: 1 },
          startDate: { type: 'string', description: 'YYYY-MM-DD' },
          endDate: { type: 'string', description: 'YYYY-MM-DD' },
        },
      },
      response: { 201: reservationSchema },
    },
  }, async (req, reply) => {
    const token = getToken(req);
    const body = req.body as any;
    try {
      const reservation = await service.createReservation(token, {
        venueId: body.venueId,
        startDate: body.startDate,
        endDate: body.endDate,
      });
      reply.code(201).send(reservation);
    } catch (err: any) {
      reply.code(err.statusCode ?? 500).send({ message: err.message });
    }
  });

  app.get('/reservations', {
    schema: {
      tags: ['reservations'],
      summary: 'List reservations',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          renterId: { type: 'integer' },
          venueId: { type: 'integer' },
        },
      },
      response: { 200: { type: 'array', items: reservationSchema } },
    },
  }, async (req, reply) => {
    const token = getToken(req);
    const { renterId, venueId } = req.query as any;
    try {
      const reservations = await service.listReservations(token, { renterId, venueId });
      reply.send(reservations);
    } catch (err: any) {
      reply.code(err.statusCode ?? 500).send({ message: err.message });
    }
  });

  app.get('/reservations/:id', {
    schema: {
      tags: ['reservations'],
      summary: 'Get a reservation by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
      },
      response: { 200: reservationSchema },
    },
  }, async (req, reply) => {
    const token = getToken(req);
    const { id } = req.params as any;
    try {
      const reservation = await service.getReservation(token, Number(id));
      reply.send(reservation);
    } catch (err: any) {
      reply.code(err.statusCode ?? 500).send({ message: err.message });
    }
  });

  app.patch('/reservations/:id/confirm', {
    schema: {
      tags: ['reservations'],
      summary: 'Confirm a reservation',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
      },
      response: { 200: reservationSchema },
    },
  }, async (req, reply) => {
    const token = getToken(req);
    const { id } = req.params as any;
    try {
      const reservation = await service.confirmReservation(token, Number(id));
      reply.send(reservation);
    } catch (err: any) {
      reply.code(err.statusCode ?? 500).send({ message: err.message });
    }
  });

  app.patch('/reservations/:id/cancel', {
    schema: {
      tags: ['reservations'],
      summary: 'Cancel a reservation',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
      },
      response: { 200: reservationSchema },
    },
  }, async (req, reply) => {
    const token = getToken(req);
    const { id } = req.params as any;
    try {
      const reservation = await service.cancelReservation(token, Number(id));
      reply.send(reservation);
    } catch (err: any) {
      reply.code(err.statusCode ?? 500).send({ message: err.message });
    }
  });
}
