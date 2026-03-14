import { Request, Response } from 'express';
import GetUser from '../../use-cases/GetUser';
import PostgresUserRepository from '../../infrastructure/database/PostgresUserRepository';
import logger from '../../logger';

const userRepository = new PostgresUserRepository();
const getUser = new GetUser(userRepository);

class UserController {
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = await getUser.execute(parseInt(req.params.id));
      logger.info('User fetched', { userId: user.id });
      res.json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'User not found';
      logger.warn('User not found', { error: message });
      res.status(404).json({ error: message });
    }
  }
}

export default new UserController();
