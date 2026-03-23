import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { ReservationService } from '../services/reservation.service';
import { CreateReservationBody, ReservationResponse, ReservationListResponse } from '../schemas/reservation.schema';

export async function reservationRoutes(app: FastifyInstance) {
  const service = new ReservationService();

  function getToken(req: any): string {
    const auth: string = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) {
      throw Object.assign(new Error('Missing or invalid authorization header'), { statusCode: 401 });
    }
    return auth.slice(7);
  }

  app.post('/', {
    schema: {
      tags: ['reservations'],
      summary: 'Create a reservation (renters only)',
      security: [{ bearerAuth: [] }],
      body: CreateReservationBody,
      response: { 201: ReservationResponse },
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

  app.get('/', {
    schema: {
      tags: ['reservations'],
      summary: 'List reservations',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        renterId: Type.Optional(Type.Integer()),
        venueId: Type.Optional(Type.Integer()),
      }),
      response: { 200: ReservationListResponse },
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

  app.get('/:id', {
    schema: {
      tags: ['reservations'],
      summary: 'Get a reservation by ID',
      security: [{ bearerAuth: [] }],
      params: Type.Object({ id: Type.Integer() }),
      response: { 200: ReservationResponse },
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

  app.patch('/:id/confirm', {
    schema: {
      tags: ['reservations'],
      summary: 'Confirm a reservation',
      security: [{ bearerAuth: [] }],
      params: Type.Object({ id: Type.Integer() }),
      response: { 200: ReservationResponse },
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

  app.patch('/:id/cancel', {
    schema: {
      tags: ['reservations'],
      summary: 'Cancel a reservation',
      security: [{ bearerAuth: [] }],
      params: Type.Object({ id: Type.Integer() }),
      response: { 200: ReservationResponse },
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
