import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateMyProfile,
  getMyInsights,
  uploadAvatar,
  uploadBanner,
  listOpportunities,
  getOpportunityDetail,
  applyToPackage,
  listMyApplications,
  cancelApplication,
  listMyContracts,
  listMyPayments,
  listMyConversations,
  advanceNegotiationStep,
  uploadReceipt,
  listApplicationMessages,
  sendApplicationMessage,
} from '../controllers/sponsor.controller';
import { avatarUpload, bannerUpload, receiptUpload } from '../middleware/upload.middleware';

const router = Router();

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, updateMyProfile);
router.get('/me/insights', requireAuth, getMyInsights);
router.post('/me/avatar', requireAuth, avatarUpload, uploadAvatar);
router.post('/me/banner', requireAuth, bannerUpload, uploadBanner);
router.get('/opportunities', requireAuth, listOpportunities);
router.get('/opportunities/:id', requireAuth, getOpportunityDetail);
router.get('/applications', requireAuth, listMyApplications);
router.post('/applications', requireAuth, applyToPackage);
router.delete('/applications/:id', requireAuth, cancelApplication);
router.get('/contracts', requireAuth, listMyContracts);
router.get('/payments', requireAuth, listMyPayments);
router.get('/conversations', requireAuth, listMyConversations);
router.post('/applications/:id/advance-step', requireAuth, advanceNegotiationStep);
router.post('/applications/:id/upload-receipt', requireAuth, receiptUpload, uploadReceipt);
router.get('/applications/:id/messages', requireAuth, listApplicationMessages);
router.post('/applications/:id/messages', requireAuth, sendApplicationMessage);

export default router;
