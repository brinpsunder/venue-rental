import { Router } from 'express';
import { authenticate, AuthedRequest } from '../middleware/auth';
import * as venueRest from '../rest/venueRestClient';
import { getVenue as getVenueGrpc, checkAvailability } from '../grpc/venueClient';
import { getUser } from '../grpc/userClient';

const router = Router();

router.get('/', async (req, res) => {
  const { location, minCapacity } = req.query as any;
  const { status, data } = await venueRest.listVenues({
    location,
    minCapacity: minCapacity ? Number(minCapacity) : undefined,
  });
  res.status(status).json(data);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const venue = await getVenueGrpc(id);
    let owner: any = null;
    try {
      owner = await getUser(venue.ownerId);
    } catch {
      owner = { id: venue.ownerId };
    }
    res.json({ ...venue, owner });
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? 'Venue not found' });
  }
});

router.get('/:id/details', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const venue = await getVenueGrpc(id);

    const ownerPromise = getUser(venue.ownerId).catch(() => ({ id: venue.ownerId }));

    const today = new Date();
    const calendarChecks = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const start = d.toISOString().slice(0, 10);
      const end = next.toISOString().slice(0, 10);
      return checkAvailability(id, start, end)
        .then((available) => ({ date: start, available }))
        .catch(() => ({ date: start, available: false }));
    });

    const [owner, availability] = await Promise.all([
      ownerPromise,
      Promise.all(calendarChecks),
    ]);

    res.json({ ...venue, owner, availability });
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? 'Venue not found' });
  }
});

router.get('/:id/availability', async (req, res) => {
  const id = Number(req.params.id);
  const { startDate, endDate } = req.query as any;
  if (Number.isNaN(id) || !startDate || !endDate) {
    return res.status(400).json({ error: 'Invalid id, startDate, or endDate' });
  }
  try {
    const available = await checkAvailability(id, startDate, endDate);
    res.json({ venueId: id, startDate, endDate, available });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Availability check failed' });
  }
});

router.post('/', authenticate, async (req: AuthedRequest, res) => {
  const { status, data } = await venueRest.createVenue(req.body, req.token!);
  res.status(status).json(data);
});

router.put('/:id', authenticate, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { status, data } = await venueRest.updateVenue(id, req.body, req.token!);
  res.status(status).json(data);
});

router.delete('/:id', authenticate, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const { status, data } = await venueRest.deleteVenue(id, req.token!);
  res.status(status).send(data);
});

export default router;
