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
  listMyContracts,
  listMyConversations,
  listApplicationMessages,
  sendApplicationMessage,
  getApplicationContract,
  saveContractTerms,
  acceptContractTerms,
  signContract,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/sponsor.controller';
import { avatarUpload, bannerUpload, chatFileUpload } from '../middleware/upload.middleware';

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
router.get('/contracts', requireAuth, listMyContracts);
router.get('/conversations', requireAuth, listMyConversations);
router.get('/applications/:id/messages', requireAuth, listApplicationMessages);
// Chat messages accept text and/or a file (multipart) — chatFileUpload middleware (Ruba's).
router.post('/applications/:id/messages', requireAuth, chatFileUpload, sendApplicationMessage);
// Organizer/sponsor contract flow (our work) — coexists with Ruba's work:
router.get('/applications/:id/contract', requireAuth, getApplicationContract);
router.put('/applications/:id/contract', requireAuth, saveContractTerms);
router.post('/applications/:id/accept-terms', requireAuth, acceptContractTerms);
router.post('/applications/:id/sign', requireAuth, signContract);

// In-platform notifications for the sponsor — reads the real `notification` table
// (the same table the organizer reads from). Filter to the current sponsor by M_ID.
router.get('/notifications', requireAuth, listNotifications);
router.put('/notifications/read-all', requireAuth, markAllNotificationsRead);
router.put('/notifications/:id/read', requireAuth, markNotificationRead);
router.delete('/notifications/:id', requireAuth, deleteNotification);

export default router;
