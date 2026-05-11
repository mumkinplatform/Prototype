import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  suggestTeamsHandler,
  listPublishedHackathons,
  browseHackathons,
  createTeamFromSuggestion,
} from '../controllers/matchmaking.controller';

const router = Router();

router.get('/hackathons', requireAuth, listPublishedHackathons);
router.get('/browse-hackathons', requireAuth, browseHackathons);
router.post('/suggest-teams', requireAuth, suggestTeamsHandler);
router.post('/create-team-from-suggestion', requireAuth, createTeamFromSuggestion);

export default router;
