import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../../logger';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    logger.warn('Invalid token', { error: message });
    res.status(401).json({ error: 'Invalid token' });
  }
}

export default authenticate;
