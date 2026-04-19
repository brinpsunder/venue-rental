import { Router } from 'express';
import { authenticate, AuthedRequest } from '../middleware/auth';
import * as reservationRest from '../rest/reservationClient';

const router = Router();

router.post('/', authenticate, async (req: AuthedRequest, res) => {
  const { status, data } = await reservationRest.createReservation(req.body, req.token!);
  res.status(status).json(data);
});

router.get('/', authenticate, async (req: AuthedRequest, res) => {
  const { renterId, venueId } = req.query as any;
  const { status, data } = await reservationRest.listReservations(
    {
      renterId: renterId ? Number(renterId) : undefined,
      venueId: venueId ? Number(venueId) : undefined,
    },
    req.token!,
  );
  res.status(status).json(data);
});

router.get('/:id', authenticate, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { status, data } = await reservationRest.getReservation(id, req.token!);
  res.status(status).json(data);
});

router.patch('/:id/confirm', authenticate, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { status, data } = await reservationRest.confirmReservation(id, req.token!);
  res.status(status).json(data);
});

router.patch('/:id/cancel', authenticate, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { status, data } = await reservationRest.cancelReservation(id, req.token!);
  res.status(status).json(data);
});

export default router;
