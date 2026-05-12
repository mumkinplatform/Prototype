import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listMyJudgeAssignments,
  submitJudgeEvaluation,
} from '../controllers/hackathon.controller';

const router = Router();

// All routes scoped to /judges/me — what the logged-in judge can see/do.
router.get('/me/hackathons/:id/assignments', requireAuth, listMyJudgeAssignments);
router.post('/me/evaluations', requireAuth, submitJudgeEvaluation);

export default router;
