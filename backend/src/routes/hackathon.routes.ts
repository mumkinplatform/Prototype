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
  deleteHackathon,
  replaceTracks,
  replaceCoManagers,
  addCoManager,
  updateCoManager,
  removeCoManager,
  resendCoManagerInvite,
  replaceJudges,
  replacePrizes,
  replaceSponsorPackages,
  listHackathonRegistrations,
  updateRegistrationStatus,
  notifyRegistrationDecision,
  listEvaluationCriteria,
  replaceEvaluationCriteria,
  listHackathonJudges,
  addHackathonJudge,
  removeHackathonJudge,
  resendJudgeInvite,
  remindJudge,
  listHackathonProjects,
  distributeJudging,
  listProjectEvaluations,
  getEvaluationSettings,
  updateEvaluationSettings,
  exportParticipantsCsv,
  listHackathonSponsorApplications,
  startSponsorNegotiation,
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
router.delete('/:id', requireAuth, deleteHackathon);
router.put('/:id/tracks', requireAuth, replaceTracks);
router.put('/:id/co-managers', requireAuth, replaceCoManagers);
router.post('/:id/co-managers', requireAuth, addCoManager);
router.put('/:id/co-managers/:hcmId', requireAuth, updateCoManager);
router.delete('/:id/co-managers/:hcmId', requireAuth, removeCoManager);
router.post('/:id/co-managers/:hcmId/resend-invite', requireAuth, resendCoManagerInvite);
router.put('/:id/judges', requireAuth, replaceJudges);
router.put('/:id/prizes', requireAuth, replacePrizes);
router.put('/:id/sponsor-packages', requireAuth, replaceSponsorPackages);
router.get('/:id/registrations', requireAuth, listHackathonRegistrations);
router.put('/:id/registrations/:pmId/status', requireAuth, updateRegistrationStatus);
router.post('/:id/registrations/notify', requireAuth, notifyRegistrationDecision);

// Evaluation criteria (structured: name + weight) for the projects section.
router.get('/:id/evaluation-criteria', requireAuth, listEvaluationCriteria);
router.put('/:id/evaluation-criteria', requireAuth, replaceEvaluationCriteria);

// Judge management — invite, list, remove, resend, remind.
router.get('/:id/judges', requireAuth, listHackathonJudges);
router.post('/:id/judges', requireAuth, addHackathonJudge);
router.delete('/:id/judges/:hjId', requireAuth, removeHackathonJudge);
router.post('/:id/judges/:hjId/resend-invite', requireAuth, resendJudgeInvite);
router.post('/:id/judges/:hjId/remind', requireAuth, remindJudge);

// Projects + distribution + evaluations
router.get('/:id/projects', requireAuth, listHackathonProjects);
router.post('/:id/distribute-judging', requireAuth, distributeJudging);
router.get('/:id/projects/:tsId/evaluations', requireAuth, listProjectEvaluations);

// Evaluation visibility settings (toggle + announcement date).
router.get('/:id/evaluation-settings', requireAuth, getEvaluationSettings);
router.put('/:id/evaluation-settings', requireAuth, updateEvaluationSettings);

// CSV export of registered participants for this hackathon.
router.get('/:id/export-participants', requireAuth, exportParticipantsCsv);

// Sponsor applications — organizer's view of who's applied to sponsor their hackathon.
router.get('/:id/sponsor-applications', requireAuth, listHackathonSponsorApplications);
router.post('/:id/sponsor-applications/:saId/start-negotiation', requireAuth, startSponsorNegotiation);
// شات الراعي/المنظم متمركز في sponsor.routes.ts الآن (endpoint مشترك للجهتين
// مع guard ذكي). راجعي ensureChatParticipant في sponsor.controller.ts.

export default router;
