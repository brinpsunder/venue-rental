import app from './app';
import logger from './logger';
import pool from './infrastructure/database/db';
import startGrpcServer from './infrastructure/grpc/grpcServer';

const PORT = process.env.PORT ?? '3001';

async function start(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'RENTER',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info('Database ready');

    app.listen(PORT, () => {
      logger.info(`user-service REST API running on port ${PORT}`);
      logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });

    startGrpcServer();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Failed to start server', { error: message });
    process.exit(1);
  }
}

start();
