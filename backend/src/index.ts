import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'mumkin-backend' });
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);

app.listen(env.port, () => {
  console.log(`Server on http://localhost:${env.port}`);
});
