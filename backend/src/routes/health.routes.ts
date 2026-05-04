import { Router } from 'express';
import { getDbHealth } from '../controllers/health.controller';

const router = Router();

router.get('/db', getDbHealth);

export default router;
