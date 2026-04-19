import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../grpc/userClient';

export interface AuthedRequest extends Request {
  auth?: { userId: number; email: string; role: string };
  token?: string;
}

export async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.slice(7);
  try {
    const result = await verifyToken(token);
    if (!result.valid) return res.status(401).json({ error: 'Invalid or expired token' });
    req.auth = { userId: result.userId, email: result.email, role: result.role };
    req.token = token;
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Auth verification failed', detail: err?.message });
  }
}
