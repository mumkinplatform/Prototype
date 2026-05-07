import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listMyHackathons,
  checkSlug,
  createHackathon,
  getHackathon,
  getPublicHackathon,
  updateHackathon,
  publishHackathon,
  unpublishHackathon,
  replaceTracks,
  replaceCoManagers,
  replaceJudges,
  replacePrizes,
  replaceSponsorPackages,
} from '../controllers/hackathon.controller';

const router = Router();

// Public route — no auth required, must be defined before parameterized auth routes
router.get('/public/:slug', getPublicHackathon);

router.get('/', requireAuth, listMyHackathons);
router.get('/check-slug', requireAuth, checkSlug);
router.post('/', requireAuth, createHackathon);
router.get('/:id', requireAuth, getHackathon);
router.put('/:id', requireAuth, updateHackathon);
router.post('/:id/publish', requireAuth, publishHackathon);
router.post('/:id/unpublish', requireAuth, unpublishHackathon);
router.put('/:id/tracks', requireAuth, replaceTracks);
router.put('/:id/co-managers', requireAuth, replaceCoManagers);
router.put('/:id/judges', requireAuth, replaceJudges);
router.put('/:id/prizes', requireAuth, replacePrizes);
router.put('/:id/sponsor-packages', requireAuth, replaceSponsorPackages);

export default router;
