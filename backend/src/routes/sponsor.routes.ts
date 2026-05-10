import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateMyProfile,
  listOpportunities,
  getOpportunityDetail,
  applyToPackage,
  listMyApplications,
  cancelApplication,
} from '../controllers/sponsor.controller';

const router = Router();

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, updateMyProfile);
router.get('/opportunities', requireAuth, listOpportunities);
router.get('/opportunities/:id', requireAuth, getOpportunityDetail);
router.get('/applications', requireAuth, listMyApplications);
router.post('/applications', requireAuth, applyToPackage);
router.delete('/applications/:id', requireAuth, cancelApplication);

export default router;
