import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import hackathonRoutes from './routes/hackathon.routes';

const app = express();

app.use(cors());
// Allow larger payloads — branding base64 images (logo up to 2MB, banner up to 5MB) can
// push a single request past the default 100KB limit. 15MB gives comfortable headroom.
app.use(express.json({ limit: '15mb' }));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'mumkin-backend' });
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/hackathons', hackathonRoutes);

app.listen(env.port, () => {
  console.log(`Server on http://localhost:${env.port}`);
});
