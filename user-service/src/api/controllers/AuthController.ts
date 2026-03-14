import { Request, Response } from 'express';
import RegisterUser from '../../use-cases/RegisterUser';
import LoginUser from '../../use-cases/LoginUser';
import PostgresUserRepository from '../../infrastructure/database/PostgresUserRepository';
import logger from '../../logger';

const userRepository = new PostgresUserRepository();
const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository);

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body as { email: string; password: string; role?: 'OWNER' | 'RENTER' };
      const user = await registerUser.execute({ email, password, role });
      logger.info('User registered', { userId: user.id, email: user.email });
      res.status(201).json(user.toPublic());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      logger.warn('Registration failed', { error: message });
      res.status(400).json({ error: message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await loginUser.execute({ email, password });
      logger.info('User logged in', { userId: result.user.id });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      logger.warn('Login failed', { error: message });
      res.status(401).json({ error: message });
    }
  }
}

export default new AuthController();
