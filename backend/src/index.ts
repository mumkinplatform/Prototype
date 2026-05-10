import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import hackathonRoutes from './routes/hackathon.routes';
import sponsorRoutes from './routes/sponsor.routes';
import participantRoutes from './routes/participant.routes';
import { getInvitationByToken } from './controllers/hackathon.controller';

const app = express();

app.use(cors());
// Allow larger payloads — branding base64 images (logo up to 2MB, banner up to 5MB) can
// push a single request past the default 100KB limit. 15MB gives comfortable headroom.
app.use(express.json({ limit: '15mb' }));

// Serve uploaded files (project submissions, avatars). Multer writes to backend/uploads/...
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'mumkin-backend' });
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/hackathons', hackathonRoutes);
app.use('/sponsors', sponsorRoutes);
app.use('/participants', participantRoutes);
// Public invitation lookup — no auth, used by /invite/:token landing page.
app.get('/invitations/:token', getInvitationByToken);

app.listen(env.port, () => {
  console.log(`Server on http://localhost:${env.port}`);
});
