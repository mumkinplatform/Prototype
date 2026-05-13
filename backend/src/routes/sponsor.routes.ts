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
  uploadReceipt,
  listApplicationMessages,
  sendApplicationMessage,
  getApplicationContract,
  saveContractTerms,
  acceptContractTerms,
  signContract,
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
router.post('/applications/:id/upload-receipt', requireAuth, receiptUpload, uploadReceipt);
router.get('/applications/:id/messages', requireAuth, listApplicationMessages);
router.post('/applications/:id/messages', requireAuth, sendApplicationMessage);
router.get('/applications/:id/contract', requireAuth, getApplicationContract);
router.put('/applications/:id/contract', requireAuth, saveContractTerms);
router.post('/applications/:id/accept-terms', requireAuth, acceptContractTerms);
router.post('/applications/:id/sign', requireAuth, signContract);

export default router;
