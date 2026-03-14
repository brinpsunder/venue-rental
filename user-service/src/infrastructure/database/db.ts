import { Pool } from 'pg';
import logger from '../../logger';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME ?? 'users',
  user: process.env.DB_USER ?? 'admin',
  password: process.env.DB_PASSWORD ?? 'password',
});

pool.on('connect', () => logger.info('Connected to PostgreSQL'));
pool.on('error', (err: Error) => logger.error('PostgreSQL error', { error: err.message }));

export default pool;
