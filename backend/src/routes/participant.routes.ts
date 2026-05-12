import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { submissionUploadDynamic, avatarUpload } from '../middleware/upload.middleware';
import {
  getMyProfile,
  updateMyProfile,
  addSkill,
  removeSkill,
  changePassword,
  getStats,
  listHackathons,
  getHackathonDetail,
  registerForHackathon,
  listMyRegisteredHackathons,
  listHackathonTeams,
  joinTeam,
  getMyTeamInHackathon,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  listMyEvaluations,
  getMySubmission,
  updateMySubmission,
  uploadSubmissionFile,
  deleteSubmissionFile,
  confirmSubmission,
  listTeamMessages,
  sendTeamMessage,
  uploadAvatar,
  deleteAvatar,
  addTeamInvites,
  resendTeamInvite,
  cancelTeamInvite,
  listTeamInvites,
  withdrawFromHackathon,
  transferTeamLeadership,
} from '../controllers/participant.controller';

const router = Router();

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, updateMyProfile);
router.put('/me/password', requireAuth, changePassword);
router.post('/me/avatar', requireAuth, avatarUpload, uploadAvatar);
router.delete('/me/avatar', requireAuth, deleteAvatar);
router.post('/skills', requireAuth, addSkill);
router.delete('/skills/:skill', requireAuth, removeSkill);
router.get('/stats', requireAuth, getStats);
router.get('/hackathons', requireAuth, listHackathons);
router.get('/hackathons/:id', requireAuth, getHackathonDetail);
router.post('/hackathons/:id/register', requireAuth, registerForHackathon);
router.get('/my-hackathons', requireAuth, listMyRegisteredHackathons);
router.get('/hackathons/:id/teams', requireAuth, listHackathonTeams);
router.post('/hackathons/:id/join-team', requireAuth, joinTeam);
router.get('/hackathons/:id/my-team', requireAuth, getMyTeamInHackathon);

router.get('/notifications', requireAuth, listNotifications);
router.put('/notifications/read-all', requireAuth, markAllNotificationsRead);
router.put('/notifications/:id/read', requireAuth, markNotificationRead);
router.delete('/notifications/:id', requireAuth, deleteNotification);

router.get('/hackathons/:id/evaluations', requireAuth, listMyEvaluations);

router.get('/hackathons/:id/submission', requireAuth, getMySubmission);
router.put('/hackathons/:id/submission', requireAuth, updateMySubmission);
router.post('/hackathons/:id/submission/files', requireAuth, submissionUploadDynamic, uploadSubmissionFile);
router.delete('/hackathons/:id/submission/files/:fileId', requireAuth, deleteSubmissionFile);
router.post('/hackathons/:id/submission/submit', requireAuth, confirmSubmission);

router.get('/hackathons/:id/team-messages', requireAuth, listTeamMessages);
router.post('/hackathons/:id/team-messages', requireAuth, sendTeamMessage);

// Team management (manual team formation)
router.get('/hackathons/:id/team-invites', requireAuth, listTeamInvites);
router.post('/hackathons/:id/team-invites', requireAuth, addTeamInvites);
router.post('/team-invites/:inviteId/resend', requireAuth, resendTeamInvite);
router.delete('/team-invites/:inviteId', requireAuth, cancelTeamInvite);
router.post('/hackathons/:id/transfer-leadership', requireAuth, transferTeamLeadership);
router.delete('/hackathons/:id/my-registration', requireAuth, withdrawFromHackathon);

export default router;
