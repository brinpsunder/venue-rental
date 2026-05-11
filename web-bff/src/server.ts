import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import venueRoutes from './routes/venues';
import reservationRoutes from './routes/reservations';
import { snapshot } from './breakers/registry';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[web-bff] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'web-bff' });
});

// Diagnostika: stanje vseh odklopnikov (Circuit Breaker pattern).
app.get('/admin/breakers', (_req, res) => {
  res.json({ service: 'web-bff', breakers: snapshot() });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/venues', venueRoutes);
app.use('/reservations', reservationRoutes);

app.listen(config.port, () => {
  console.log(`web-bff listening on :${config.port}`);
});
