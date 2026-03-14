import express from 'express';
import authRoutes from './api/routes/authRoutes';
import userRoutes from './api/routes/userRoutes';
import { swaggerUi, swaggerSpec } from './api/swagger';
import logger from './logger';

const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

export default app;
