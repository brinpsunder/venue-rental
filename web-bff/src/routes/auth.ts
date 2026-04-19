import { Router } from 'express';
import * as userRest from '../rest/userRestClient';

const router = Router();

router.post('/register', async (req, res) => {
  const { status, data } = await userRest.registerUser(req.body);
  res.status(status).json(data);
});

router.post('/login', async (req, res) => {
  const { status, data } = await userRest.loginUser(req.body);
  res.status(status).json(data);
});

export default router;
