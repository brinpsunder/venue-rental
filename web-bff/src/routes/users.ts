import { Router } from 'express';
import { authenticate, AuthedRequest } from '../middleware/auth';
import { getUser } from '../grpc/userClient';

const router = Router();

router.get('/me', authenticate, async (req: AuthedRequest, res) => {
  try {
    const user = await getUser(req.auth!.userId);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to fetch user' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const user = await getUser(id);
    res.json(user);
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? 'User not found' });
  }
});

export default router;
