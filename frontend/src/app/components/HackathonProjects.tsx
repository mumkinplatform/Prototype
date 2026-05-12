import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { apiGet, apiPost, apiPut, apiDelete, API_URL, ApiError } from '../../lib/api';
import { getToken } from '../../lib/auth';
import { 
  ArrowRight, 
  FileDown, 
  Users2, 
  X, 
  Eye, 
  FileText, 
  Video, 
  Link as LinkIcon,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  UserPlus,
  Mail,
  Edit,
  Trophy,
  BarChart3,
  Calendar,
  Filter,
  ChevronDown,
  Award,
  Target,
  Shield,
  Send,
  Check,
  XCircle,
  Star,
  MessageSquare,
  Settings,
  TrendingUp,
  EyeOff,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  team: string;
  track: string;
  trackId: number;
  time: string;
  stages: {
    total: number;
    completed: number;
  };
  // pending  = draft (not submitted)
  // awaiting = submitted but no judge assigned yet
  // inReview = judge assigned, evaluation pending
  // completed = evaluated
  status: 'completed' | 'inReview' | 'awaiting' | 'pending';
  score?: number;
  evaluations: number;
  totalEvaluators: number;
  hasFiles: boolean;
  hasLinks: boolean;
  description?: string;
  teamMembers?: string[];
  repoUrl?: string | null;
  demoUrl?: string | null;
  files?: Array<{ id: number; name: string; size: number; mimeType: string | null; url: string }>;
  assignedJudge?: { id: number; name: string } | null;
  icon: string;
  color: string;
}

// API-shaped types for criteria + judges + projects, kept separate from the
// rich UI types so the network layer stays simple and the UI layer maps as needed.
interface ApiCriterion {
  id: number;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
}

interface ApiJudge {
  id: number;
  fullName: string;
  email: string;
  specialty: string | null;
  inviteStatus: 'pending' | 'accepted' | 'declined';
  invitedAt: string | null;
  inviteExpiresAt: string | null;
  acceptedAt: string | null;
  memberId: number | null;
}

interface ApiProject {
  tsId: number;
  type: 'team' | 'solo';
  teamId: number | null;
  teamName: string | null;
  participantId: number | null;
  participantName: string | null;
  projectName: string | null;
  projectDescription: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  submittedAt: string | null;
  hasFiles: boolean;
  hasLinks: boolean;
  files: Array<{ id: number; name: string; size: number; mimeType: string | null; url: string }>;
  assignedJudge: { id: number; name: string } | null;
  evaluationCount: number;
  totalEvaluators: number;
  score: number | null;
  status: 'pending' | 'awaiting' | 'inReview' | 'completed';
  trackName: string | null;
}

interface ApiProjectEvaluation {
  id: number;
  judgeId: number;
  judgeName: string;
  judgeSpecialty: string | null;
  comment: string | null;
  evaluatedAt: string;
  scores: Array<{ name: string; score: number }>;
}

interface ApiDistribution {
  distributedAt: string | null;
  judgingStartDate: string | null;
  judgingEndDate: string | null;
}

interface ApiJudgeAssignment {
  tsId: number;
  type: 'team' | 'solo';
  teamName: string | null;
  participantName: string | null;
  projectName: string | null;
  projectDescription: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  submittedAt: string | null;
  hasFiles: boolean;
  hasLinks: boolean;
  files: Array<{ id: number; name: string; size: number; mimeType: string | null; url: string }>;
  trackName: string | null;
  evaluated: boolean;
  myScore: number | null;
  myEvaluation: {
    scores: Array<{ name: string; score: number }>;
    comment: string | null;
  } | null;
}

export function HackathonProjects() {
  const { id } = useParams();
  const hackathonId = id ? Number(id) : null;
  const [activeTab, setActiveTab] = useState<'submitted' | 'judges'>('submitted');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAddJudgeModal, setShowAddJudgeModal] = useState(false);
  const [showEditCriteriaModal, setShowEditCriteriaModal] = useState(false);
  const [showEditDeadlineModal, setShowEditDeadlineModal] = useState(false);
  // Controlled form state for the 4 datetime inputs in the "تعديل المواعيد"
  // modal — kept as raw "YYYY-MM-DDTHH:mm" strings (what datetime-local emits).
  // Loaded from hackathonDates when the modal opens and pushed back via the
  // existing PUT /hackathons/:id endpoint on save.
  const [editDates, setEditDates] = useState({
    submissionStart: '',
    submissionEnd: '',
    judgingStart: '',
    judgingEnd: '',
  });
  const [savingDates, setSavingDates] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  // 3-step distribution flow: preview → shuffling animation → result. Resets
  // back to 'preview' every time the modal opens.
  const [distributeStep, setDistributeStep] = useState<'preview' | 'shuffling' | 'result'>('preview');
  const [distributionResult, setDistributionResult] = useState<{
    assigned: number;
    judges: number;
    breakdown: Array<{ judgeId: number; judgeName: string; count: number }>;
  } | null>(null);
  const [showEvaluationDetailsModal, setShowEvaluationDetailsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'inReview' | 'awaiting' | 'pending'>('all');
  const [showEvaluationsToParticipants, setShowEvaluationsToParticipants] = useState(false);
  // Settings: show comments toggle + the date when results become visible
  // to participants. Loaded from the backend when the settings modal opens
  // (so toggling doesn't make a stale write).
  const [showEvaluationNotesToParticipants, setShowEvaluationNotesToParticipants] = useState(false);
  const [announcementDate, setAnnouncementDate] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Live data — loaded from the backend on mount and after each mutation
  // (invite/remove/criteria/distribute).
  const [criteria, setCriteria] = useState<ApiCriterion[]>([]);
  const [judges, setJudges] = useState<ApiJudge[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [distribution, setDistribution] = useState<ApiDistribution | null>(null);
  const [judgeAssignments, setJudgeAssignments] = useState<ApiJudgeAssignment[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const [loadingJudges, setLoadingJudges] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [distributing, setDistributing] = useState(false);

  // myAccess.role — drives the restricted "judge" view vs the full organizer
  // view of this section. Loaded from getHackathon; null while loading.
  const [myRole, setMyRole] = useState<'owner' | 'co_manager' | 'judge' | null>(null);
  // For co-managers, also track manager-vs-staff. Date editing is a manager-
  // only action even when the staff has access to the section.
  const [myCoManagerRole, setMyCoManagerRole] = useState<'manager' | 'staff' | null>(null);
  const [loadingMyRole, setLoadingMyRole] = useState(true);
  // Live submission + judging dates from the hackathon row — used by the
  // header timeline cards and as bounds for the date-chain validation in the
  // "تعديل المواعيد" and "إعدادات التقييم" modals.
  const [hackathonDates, setHackathonDates] = useState<{
    hackathonStart: string | null;
    submissionStart: string | null;
    submissionEnd: string | null;
    judgingStart: string | null;
    judgingEnd: string | null;
    winnersDate: string | null;
  }>({
    hackathonStart: null,
    submissionStart: null,
    submissionEnd: null,
    judgingStart: null,
    judgingEnd: null,
    winnersDate: null,
  });
  useEffect(() => {
    if (!hackathonId) return;
    apiGet<{
      myAccess: { role: 'owner' | 'co_manager' | 'judge'; coManagerRole?: 'manager' | 'staff' } | null;
      hackathon: {
        H_Hackathon_StartDate: string | null;
        H_Submission_StartDate: string | null;
        H_Submission_Deadline: string | null;
        H_Judging_StartDate: string | null;
        H_Judging_EndDate: string | null;
        H_Winners_Date: string | null;
      };
    }>(`/hackathons/${hackathonId}`)
      .then((r) => {
        setMyRole(r.myAccess?.role ?? null);
        setMyCoManagerRole(r.myAccess?.coManagerRole ?? null);
        setHackathonDates({
          hackathonStart: r.hackathon.H_Hackathon_StartDate,
          submissionStart: r.hackathon.H_Submission_StartDate,
          submissionEnd: r.hackathon.H_Submission_Deadline,
          judgingStart: r.hackathon.H_Judging_StartDate,
          judgingEnd: r.hackathon.H_Judging_EndDate,
          winnersDate: r.hackathon.H_Winners_Date,
        });
      })
      .catch(() => setMyRole(null))
      .finally(() => setLoadingMyRole(false));
  }, [hackathonId]);

  // Convenience flag — judges see a read-only version of this page.
  const isJudge = myRole === 'judge';

  // Pin the judge to the "submitted" tab — they don't have access to the
  // "إدارة الحكام والمتابعة" tab and we hide its trigger; this also normalizes
  // the state in case it was previously set to 'judges' by an organizer view.
  useEffect(() => {
    if (isJudge && activeTab !== 'submitted') setActiveTab('submitted');
  }, [isJudge, activeTab]);

  // Form state for the "add judge" modal — kept local so the modal stays simple.
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [newJudgeSpecialty, setNewJudgeSpecialty] = useState('');
  const [invitingJudge, setInvitingJudge] = useState(false);

  // Working copy of criteria while the edit modal is open. Saved to the backend
  // only when the user clicks "حفظ التعديلات".
  const [editingCriteria, setEditingCriteria] = useState<ApiCriterion[]>([]);
  const [savingCriteria, setSavingCriteria] = useState(false);

  // Judge evaluation form — opened from the assignments list. Scores keyed by
  // criterion name (0-100 per criterion); backend computes the weighted total.
  const [evaluatingAssignment, setEvaluatingAssignment] = useState<ApiJudgeAssignment | null>(null);
  const [evalScores, setEvalScores] = useState<Record<string, string>>({});
  const [evalComment, setEvalComment] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);

  // Organizer: real evaluations fetched on-demand when opening the details
  // modal for a completed project.
  const [projectEvaluations, setProjectEvaluations] = useState<ApiProjectEvaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  // Judge: read-only view of their own evaluation for a project they've
  // already scored. No editing — just shows what they submitted.
  const [viewingMyEvaluation, setViewingMyEvaluation] = useState<ApiJudgeAssignment | null>(null);

  // Initial load — fire requests in parallel. Skip the judges-list fetch when
  // we know the user is a judge (the endpoint requires section access and will
  // 403 a judge, which would surface as a misleading "forbidden" toast).
  useEffect(() => {
    if (!hackathonId) return;
    if (loadingMyRole) return; // wait until we know the user's role
    setLoadingCriteria(true);
    apiGet<{ items: ApiCriterion[] }>(`/hackathons/${hackathonId}/evaluation-criteria`)
      .then((r) => setCriteria(r.items))
      .catch((e) => {
        toast.error(e instanceof ApiError ? e.message : 'فشل تحميل معايير التقييم');
      })
      .finally(() => setLoadingCriteria(false));

    // Projects: organizer sees /hackathons/:id/projects (all of them); judge
    // sees /judges/me/hackathons/:id/assignments (only their own assigned ones).
    setLoadingProjects(true);
    if (myRole === 'judge') {
      apiGet<{ items: ApiJudgeAssignment[] }>(
        `/judges/me/hackathons/${hackathonId}/assignments`,
      )
        .then((r) => setJudgeAssignments(r.items))
        .catch((e) => {
          if (e instanceof ApiError && e.status === 403) return; // not assigned yet
          toast.error(e instanceof ApiError ? e.message : 'فشل تحميل المشاريع');
        })
        .finally(() => setLoadingProjects(false));
    } else {
      apiGet<{ items: ApiProject[]; distribution: ApiDistribution }>(
        `/hackathons/${hackathonId}/projects`,
      )
        .then((r) => {
          setProjects(r.items);
          setDistribution(r.distribution);
        })
        .catch((e) => {
          toast.error(e instanceof ApiError ? e.message : 'فشل تحميل المشاريع');
        })
        .finally(() => setLoadingProjects(false));
    }

    // Judges list — organizer only.
    if (myRole === 'judge') {
      setLoadingJudges(false);
      setJudges([]);
      return;
    }

    setLoadingJudges(true);
    apiGet<{ items: ApiJudge[] }>(`/hackathons/${hackathonId}/judges`)
      .then((r) => setJudges(r.items))
      .catch((e) => {
        toast.error(e instanceof ApiError ? e.message : 'فشل تحميل قائمة الحكام');
      })
      .finally(() => setLoadingJudges(false));
  }, [hackathonId, loadingMyRole, myRole]);

  // Seed the edit modal with the current criteria each time it opens (so cancel
  // restores the latest saved state).
  useEffect(() => {
    if (showEditCriteriaModal) {
      setEditingCriteria(criteria.length > 0
        ? criteria.map((c) => ({ ...c }))
        : [{ id: 0, name: '', description: '', weight: 0, sortOrder: 1 }]);
    }
  }, [showEditCriteriaModal, criteria]);

  // Mock dates
  // Format a date string from the backend ("YYYY-MM-DD HH:mm:ss" or ISO) into
  // the Arabic-friendly display used in the timeline cards. Falls back to a
  // dash when the organizer hasn't set the date yet.
  const formatHackathonDate = (raw: string | null): string => {
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' });
  };
  const submissionStart = formatHackathonDate(hackathonDates.submissionStart);
  const submissionEnd = formatHackathonDate(hackathonDates.submissionEnd);
  const evaluationStart = formatHackathonDate(hackathonDates.judgingStart);
  const evaluationEnd = formatHackathonDate(hackathonDates.judgingEnd);

  // Pre-flight checks before opening the distribute modal. Surfaced as
  // descriptive toasts inside handleDistributeProjects so the user knows
  // exactly why the click didn't open the modal.
  // Note: read from `projects` (raw API state) rather than `allProjects`
  // (the mapped UI variant) because `allProjects` is declared later in this
  // component and would trip the temporal dead zone.
  const submittedProjectsCount = projects.filter((p) => p.status !== 'pending').length;
  const activeJudgesCount = judges.filter((j) => j.inviteStatus === 'accepted').length;

  // Pre-flight check on click: cover all three blocking states (no projects,
  // no judges, or both). Only open the confirm modal when distribution is
  // actually possible.
  const handleDistributeProjects = () => {
    const noProjects = submittedProjectsCount === 0;
    const noJudges = activeJudgesCount === 0;
    const noCriteria = criteria.length === 0;

    if (noProjects && noJudges) {
      toast.error('لا يمكن التوزيع', {
        description: 'ما عندك حكام ولا مشاريع مسلَّمة. أضف حكامًا وانتظر تسليم المشاريع.',
        duration: 4500,
      });
      return;
    }
    if (noProjects) {
      toast.error('لا يمكن التوزيع', {
        description: 'لا توجد مشاريع مسلَّمة بعد. انتظر المشاركين يسلمون مشاريعهم أولاً.',
        duration: 4500,
      });
      return;
    }
    if (noJudges) {
      toast.error('لا يمكن التوزيع', {
        description: 'لا يوجد حكام مقبولين. أضف حكامًا وانتظر قبولهم قبل التوزيع.',
        duration: 4500,
      });
      return;
    }
    if (noCriteria) {
      toast.error('لا يمكن التوزيع', {
        description: 'أضف معايير التقييم أولاً من بطاقة "معايير التقييم" — بدونها لا يقدر الحكام يقيّمون المشاريع.',
        duration: 5000,
      });
      return;
    }
    // Reset flow to step 1 every time the modal opens so a previous run's
    // result doesn't bleed into the next confirmation.
    setDistributeStep('preview');
    setDistributionResult(null);
    setShowDistributeModal(true);
  };

  // Confirm distribution: hit the backend endpoint, then refresh the projects
  // list so the assigned-judge column populates immediately.
  const confirmDistribution = async () => {
    if (!hackathonId) return;
    // Step 2: show the shuffling animation while the backend does its work.
    // The animation runs in parallel with the actual API call — we then wait
    // for whichever takes longer so the user always sees the full motion.
    setDistributeStep('shuffling');
    setDistributing(true);
    const minAnimationMs = 2000;
    const animationPromise = new Promise((r) => setTimeout(r, minAnimationMs));
    try {
      const apiPromise = apiPost<{
        assigned: number;
        judges: number;
        breakdown: Array<{ judgeId: number; judgeName: string; count: number }>;
      }>(`/hackathons/${hackathonId}/distribute-judging`, {});
      const [result] = await Promise.all([apiPromise, animationPromise]);
      // Re-fetch projects so we see assigned_judge_id populated everywhere.
      const refreshed = await apiGet<{
        items: ApiProject[];
        distribution: ApiDistribution;
      }>(`/hackathons/${hackathonId}/projects`);
      setProjects(refreshed.items);
      setDistribution(refreshed.distribution);
      setDistributionResult({
        assigned: result.assigned,
        judges: result.judges,
        breakdown: result.breakdown,
      });
      setDistributeStep('result');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر التوزيع');
      setShowDistributeModal(false);
    } finally {
      setDistributing(false);
    }
  };

  // Trigger a CSV download for the registered participants. fetch() with the
  // auth header → blob → temp anchor click is the standard browser pattern
  // for authenticated downloads (regular <a href> wouldn't send the bearer
  // token).
  const handleExportData = async () => {
    if (!hackathonId) return;
    const toastId = toast.loading('جاري التصدير...');
    try {
      const res = await fetch(`${API_URL}/hackathons/${hackathonId}/export-participants`, {
        headers: { Authorization: `Bearer ${getToken() ?? ''}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${hackathonId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير بيانات المشاركين', { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل التصدير', { id: toastId });
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowDrawer(true);
  };

  const handleViewEvaluationDetails = async (project: Project) => {
    if (!hackathonId) return;
    setSelectedProject(project);
    setShowEvaluationDetailsModal(true);
    setProjectEvaluations([]);
    setLoadingEvaluations(true);
    try {
      const r = await apiGet<{ items: ApiProjectEvaluation[] }>(
        `/hackathons/${hackathonId}/projects/${project.id}/evaluations`,
      );
      setProjectEvaluations(r.items);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'فشل تحميل التقييمات');
    } finally {
      setLoadingEvaluations(false);
    }
  };

  // Judge: open the evaluation form for an assigned project. Pre-seed scores
  // with empty strings so the inputs are controlled from the first render.
  const handleOpenEvaluation = (assignment: ApiJudgeAssignment) => {
    setEvaluatingAssignment(assignment);
    const seed: Record<string, string> = {};
    for (const c of criteria) seed[c.name] = '';
    setEvalScores(seed);
    setEvalComment('');
  };

  // Submit the judge's scores. Validates that every criterion has a numeric
  // score in [0, 100] before sending — backend re-validates but failing fast
  // saves a roundtrip.
  const handleSubmitEvaluation = async () => {
    if (!hackathonId || !evaluatingAssignment) return;
    const scores: Array<{ name: string; score: number }> = [];
    for (const c of criteria) {
      const raw = evalScores[c.name];
      const n = Number(raw);
      if (raw === '' || !Number.isFinite(n)) {
        toast.error(`أدخل درجة المعيار "${c.name}"`);
        return;
      }
      if (n < 0 || n > c.weight) {
        toast.error(`درجة "${c.name}" يجب أن تكون بين ٠ و ${c.weight}`);
        return;
      }
      scores.push({ name: c.name, score: n });
    }
    setSubmittingEval(true);
    try {
      await apiPost('/judges/me/evaluations', {
        hackathonId,
        tsId: evaluatingAssignment.tsId,
        scores,
        comment: evalComment.trim(),
      });
      toast.success('تم حفظ التقييم');
      setEvaluatingAssignment(null);
      // Refresh the assignments list so the "تم التقييم" badge updates.
      const r = await apiGet<{ items: ApiJudgeAssignment[] }>(
        `/judges/me/hackathons/${hackathonId}/assignments`,
      );
      setJudgeAssignments(r.items);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'فشل حفظ التقييم');
    } finally {
      setSubmittingEval(false);
    }
  };

  // Send a reminder email to an accepted judge who hasn't finished evaluating.
  // The /remind endpoint only accepts judges in 'accepted' status — pending/declined
  // judges show "تذكير" disabled in the UI to prevent confusion.
  const handleSendReminder = async (judge: ApiJudge) => {
    if (!hackathonId) return;
    if (judge.inviteStatus !== 'accepted') {
      toast.error('الحكم لم يقبل الدعوة بعد');
      return;
    }
    try {
      await apiPost(`/hackathons/${hackathonId}/judges/${judge.id}/remind`, {});
      toast.success('تم إرسال التذكير', {
        description: `تم إرسال تذكير بالبريد الإلكتروني إلى ${judge.fullName}`,
        duration: 3000,
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر إرسال التذكير');
    }
  };

  const handleInviteJudge = async () => {
    if (!hackathonId) return;
    const fullName = newJudgeName.trim();
    const email = newJudgeEmail.trim();
    const specialty = newJudgeSpecialty.trim();

    if (!fullName) return toast.error('اسم الحكم مطلوب');
    if (!email) return toast.error('البريد الإلكتروني مطلوب');

    setInvitingJudge(true);
    try {
      const result = await apiPost<{ judge: ApiJudge }>(`/hackathons/${hackathonId}/judges`, {
        fullName,
        email,
        specialty: specialty || undefined,
      });
      setJudges((prev) => [...prev, result.judge]);
      toast.success('تم إرسال الدعوة', {
        description: `أُرسلت دعوة إلى ${email}`,
        duration: 3000,
      });
      setNewJudgeName('');
      setNewJudgeEmail('');
      setNewJudgeSpecialty('');
      setShowAddJudgeModal(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر إرسال الدعوة');
    } finally {
      setInvitingJudge(false);
    }
  };

  // Remove a judge — backend refuses if the judge has any evaluations.
  const handleRemoveJudge = async (judge: ApiJudge) => {
    if (!hackathonId) return;
    if (!confirm(`هل تريد حذف الحكم "${judge.fullName}"؟`)) return;
    try {
      await apiDelete(`/hackathons/${hackathonId}/judges/${judge.id}`);
      setJudges((prev) => prev.filter((j) => j.id !== judge.id));
      toast.success('تم حذف الحكم');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر حذف الحكم');
    }
  };

  // Resend the invite email — only valid while the judge is still in 'pending'.
  const handleResendInvite = async (judge: ApiJudge) => {
    if (!hackathonId) return;
    try {
      await apiPost(`/hackathons/${hackathonId}/judges/${judge.id}/resend-invite`, {});
      toast.success('تم إعادة إرسال الدعوة');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر إعادة الإرسال');
    }
  };

  const handleUpdateCriteria = async () => {
    if (!hackathonId) return;
    // Client-side validation — backend re-checks, but a fast local check
    // gives the organizer immediate feedback before sending.
    const items = editingCriteria
      .map((c) => ({
        name: c.name.trim(),
        description: c.description?.trim() || null,
        weight: Number(c.weight),
      }))
      .filter((c) => c.name || c.weight > 0); // ignore fully-empty rows

    if (items.length === 0) {
      toast.error('يجب إضافة معيار واحد على الأقل');
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name) {
        toast.error(`اسم المعيار رقم ${i + 1} مطلوب`);
        return;
      }
      if (!Number.isFinite(items[i].weight) || items[i].weight <= 0) {
        toast.error(`وزن المعيار رقم ${i + 1} غير صالح`);
        return;
      }
    }
    const sum = items.reduce((s, c) => s + c.weight, 0);
    if (Math.abs(sum - 100) > 0.05) {
      toast.error(`مجموع الأوزان لازم يساوي 100% (المجموع: ${sum.toFixed(2)}%)`);
      return;
    }

    setSavingCriteria(true);
    try {
      await apiPut(`/hackathons/${hackathonId}/evaluation-criteria`, { items });
      // Re-fetch to get the fresh ids/sort orders the backend generated.
      const refreshed = await apiGet<{ items: ApiCriterion[] }>(
        `/hackathons/${hackathonId}/evaluation-criteria`,
      );
      setCriteria(refreshed.items);
      toast.success('تم تحديث المعايير');
      setShowEditCriteriaModal(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر حفظ المعايير');
    } finally {
      setSavingCriteria(false);
    }
  };

  // Pre-fill the deadline form whenever the modal opens. Converts the
  // backend's "YYYY-MM-DD HH:mm:ss" / ISO formats to the "YYYY-MM-DDTHH:mm"
  // shape the datetime-local input requires.
  useEffect(() => {
    if (!showEditDeadlineModal) return;
    const toLocal = (v: string | null): string => {
      if (!v) return '';
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setEditDates({
      submissionStart: toLocal(hackathonDates.submissionStart),
      submissionEnd: toLocal(hackathonDates.submissionEnd),
      judgingStart: toLocal(hackathonDates.judgingStart),
      judgingEnd: toLocal(hackathonDates.judgingEnd),
    });
  }, [showEditDeadlineModal, hackathonDates]);

  // Inline validation for the deadline modal. Enforces the chain rule used
  // across the platform: each milestone falls after its predecessor and
  // before its successor. Returns a per-field error map (empty when valid).
  const editDateErrors = (() => {
    const errs: Partial<Record<'submissionStart' | 'submissionEnd' | 'judgingStart' | 'judgingEnd', string>> = {};
    const ts = (v: string | null | undefined): number | null => {
      if (!v) return null;
      const n = new Date(v).getTime();
      return Number.isNaN(n) ? null : n;
    };
    if (activeTab === 'judges') {
      const subEnd = ts(hackathonDates.submissionEnd);
      const winners = ts(hackathonDates.winnersDate);
      const js = ts(editDates.judgingStart);
      const je = ts(editDates.judgingEnd);
      if (js != null && subEnd != null && js < subEnd) {
        errs.judgingStart = 'يجب أن يكون بعد "إغلاق التسليم"';
      }
      // نهاية التقييم: يسمح بأن تساوي بداية التقييم (نفس اليوم) أو بعدها،
      // لكن لازم تكون قبل تاريخ إعلان الفائزين.
      if (je != null) {
        if (js != null && je < js) errs.judgingEnd = 'يجب أن يكون في نفس وقت بداية التقييم أو بعده';
        else if (winners != null && je >= winners) errs.judgingEnd = 'يجب أن يكون قبل "تاريخ إعلان الفائزين"';
      }
    } else {
      const hackStart = ts(hackathonDates.hackathonStart);
      const judgingStart = ts(hackathonDates.judgingStart);
      const ss = ts(editDates.submissionStart);
      const se = ts(editDates.submissionEnd);
      if (ss != null && hackStart != null && ss < hackStart) {
        errs.submissionStart = 'يجب أن يكون بعد "بداية الهاكاثون"';
      }
      if (se != null) {
        if (ss != null && se <= ss) errs.submissionEnd = 'يجب أن يكون بعد "فتح التسليم"';
        else if (judgingStart != null && se >= judgingStart) errs.submissionEnd = 'يجب أن يكون قبل "بداية التقييم"';
      }
    }
    return errs;
  })();
  const hasEditDateError = Object.keys(editDateErrors).length > 0;

  // Save the deadline edits. Only sends the fields relevant to the current
  // tab — the submissions banner edits submission dates, the judges banner
  // edits judging dates. Persists via the existing PUT /hackathons/:id.
  const handleUpdateDeadline = async () => {
    if (!hackathonId) return;
    if (hasEditDateError) {
      toast.error('تواريخ غير صالحة', {
        description: 'صحّح الأخطاء الظاهرة أسفل كل حقل قبل الحفظ.',
        duration: 4500,
      });
      return;
    }
    setSavingDates(true);
    try {
      const body: Record<string, string | null> =
        activeTab === 'judges'
          ? {
              judgingStart: editDates.judgingStart || null,
              judgingEnd: editDates.judgingEnd || null,
            }
          : {
              submissionStart: editDates.submissionStart || null,
              submissionEnd: editDates.submissionEnd || null,
            };
      await apiPut(`/hackathons/${hackathonId}`, body);
      // Refresh the dates that drive the timeline banners.
      setHackathonDates((prev) => ({
        ...prev,
        submissionStart: activeTab === 'judges' ? prev.submissionStart : (editDates.submissionStart || null),
        submissionEnd:   activeTab === 'judges' ? prev.submissionEnd   : (editDates.submissionEnd   || null),
        judgingStart:    activeTab === 'judges' ? (editDates.judgingStart || null) : prev.judgingStart,
        judgingEnd:      activeTab === 'judges' ? (editDates.judgingEnd   || null) : prev.judgingEnd,
      }));
      toast.success('تم تحديث المواعيد');
      setShowEditDeadlineModal(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'فشل حفظ المواعيد');
    } finally {
      setSavingDates(false);
    }
  };

  // Load settings every time the settings modal opens. Avoids showing stale
  // values if the organizer reopened it after editing elsewhere.
  useEffect(() => {
    if (!showSettingsModal || !hackathonId) return;
    apiGet<{
      showEvaluations: boolean;
      showNotes: boolean;
      announcementDate: string | null;
    }>(`/hackathons/${hackathonId}/evaluation-settings`)
      .then((r) => {
        setShowEvaluationsToParticipants(r.showEvaluations);
        setShowEvaluationNotesToParticipants(r.showNotes);
        // Datetime-local input wants "YYYY-MM-DDTHH:mm" (no seconds, no Z).
        setAnnouncementDate(
          r.announcementDate
            ? new Date(r.announcementDate).toISOString().slice(0, 16)
            : '',
        );
      })
      .catch((e) => {
        toast.error(e instanceof ApiError ? e.message : 'فشل تحميل الإعدادات');
      });
  }, [showSettingsModal, hackathonId]);

  // Inline error for the winners-announcement date input. Enforces the same
  // chain rule used in CreateHackathon: announcement must come AFTER the
  // judging end date. Returns an empty string when the field is valid (or
  // empty — empty is allowed and just means "no schedule lock").
  const announcementDateError = (() => {
    if (!announcementDate) return '';
    if (!hackathonDates.judgingEnd) return '';
    const announceMs = new Date(announcementDate).getTime();
    const judgingEndMs = new Date(hackathonDates.judgingEnd).getTime();
    if (Number.isNaN(announceMs) || Number.isNaN(judgingEndMs)) return '';
    if (announceMs <= judgingEndMs) {
      return 'يجب أن يكون بعد "نهاية التقييم". عدّل نهاية التقييم أولاً أو اختر تاريخاً لاحقاً.';
    }
    return '';
  })();

  const handleUpdateSettings = async () => {
    if (!hackathonId) return;
    // Frontend pre-check so the user gets the friendly inline error instead
    // of waiting for a server round-trip + a generic toast.
    if (announcementDateError) {
      toast.error('تاريخ إعلان الفائزين غير صالح', {
        description: announcementDateError,
        duration: 5000,
      });
      return;
    }
    setSavingSettings(true);
    try {
      await apiPut(`/hackathons/${hackathonId}/evaluation-settings`, {
        showEvaluations: showEvaluationsToParticipants,
        showNotes: showEvaluationNotesToParticipants,
        announcementDate: announcementDate || null,
      });
      toast.success('تم حفظ الإعدادات', {
        description: 'سيظهر التقييم للمشاركين بعد تاريخ إعلان النتائج',
        duration: 3000,
      });
      setShowSettingsModal(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'فشل حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    const config = {
      completed: { text: 'مكتمل التقييم', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      inReview: { text: 'قيد التقييم', color: 'bg-blue-100 text-blue-700', icon: Clock },
      awaiting: { text: 'بانتظار التوزيع', color: 'bg-amber-100 text-amber-700', icon: Clock },
      pending: { text: 'لم يُسلم', color: 'bg-gray-100 text-gray-600', icon: XCircle }
    };
    const { text, color, icon: Icon } = config[status];
    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${color}`} style={{ fontWeight: 600 }}>
        <Icon className="w-3.5 h-3.5" />
        {text}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-[#cc4a48]';
  };

  // Deterministic pastel color from the track name so every project on the
  // same track shares one badge color. Hash → index into a small palette;
  // names that don't match real tracks still get a stable color.
  const getTrackColor = (trackName: string | null | undefined): string => {
    if (!trackName) return 'bg-gray-100 text-gray-700';
    const palette = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-cyan-100 text-cyan-700',
    ];
    let hash = 0;
    for (let i = 0; i < trackName.length; i++) hash = (hash * 31 + trackName.charCodeAt(i)) | 0;
    return palette[Math.abs(hash) % palette.length];
  };

  // Map API projects → the rich UI shape the existing table expects. We keep
  // the legacy Project interface so the table JSX doesn't need to change.
  const PROJECT_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
  const allProjects: Project[] = projects.map((p, idx) => {
    const ownerName = p.type === 'team' ? (p.teamName ?? '—') : (p.participantName ?? '—');
    const projectLabel = p.projectName?.trim() || (p.type === 'team' ? `مشروع ${ownerName}` : `مشروع ${ownerName}`);
    return {
      id: p.tsId,
      name: projectLabel,
      team: ownerName,
      track: p.trackName ?? '—',
      trackId: 1,
      time: p.submittedAt
        ? new Date(p.submittedAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
        : '—',
      stages: { total: 1, completed: p.status === 'completed' ? 1 : 0 },
      status: p.status,
      score: p.score ?? undefined,
      evaluations: p.evaluationCount,
      totalEvaluators: p.totalEvaluators,
      hasFiles: p.hasFiles,
      hasLinks: p.hasLinks,
      description: p.projectDescription ?? '',
      repoUrl: p.repoUrl,
      demoUrl: p.demoUrl,
      files: p.files,
      assignedJudge: p.assignedJudge,
      icon: projectLabel.trim().charAt(0) || '·',
      color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
    };
  });

  const filteredProjects = allProjects.filter(p => {
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    const trackMatch = true; // per-project tracks not yet linked in DB
    return statusMatch && trackMatch;
  });

  // Judge: only filterStatus applies — 'completed' = evaluated, 'awaiting' =
  // not evaluated yet, 'all' = both. Track filter is a no-op for now because
  // assignments don't carry a per-project track id (only the hackathon's first
  // track is exposed for display).
  const filteredJudgeAssignments = judgeAssignments.filter((a) => {
    if (filterStatus === 'completed') return a.evaluated;
    if (filterStatus === 'awaiting') return !a.evaluated;
    return true;
  });

  const totalProjects = allProjects.length;
  const completedProjects = allProjects.filter(p => p.status === 'completed').length;
  const inReviewProjects = allProjects.filter(p => p.status === 'inReview').length;
  // awaiting = submitted, no judge assigned yet. Distinct from inReview
  // (judge assigned, awaiting evaluation) and pending (draft, not submitted).
  const awaitingProjects = allProjects.filter(p => p.status === 'awaiting').length;
  const pendingProjects = allProjects.filter(p => p.status === 'pending').length;

  // While we still don't know the user's role, render a thin loader so we don't
  // flash organizer-only controls before hiding them for a judge.
  if (loadingMyRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm" dir="rtl">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to={isJudge ? '/admin/my-hackathons' : `/admin/hackathon/${id}`}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {isJudge ? 'تقييم المشاريع' : 'إدارة المشاريع والتحكيم'}
                  </h1>
                  {isJudge && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs" style={{ fontWeight: 600 }}>
                      وضع المحكم
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {isJudge
                    ? 'هنا تجد المشاريع المسندة إليك والمعايير لتقييمها.'
                    : 'نظّم الأفكار وقيّم وتابع المشاريع عبر نظام التحكيم'}
                </p>
              </div>
            </div>
            {!isJudge && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <Settings className="w-4 h-4" />
                  إعدادات التقييم
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <FileDown className="w-4 h-4" />
                  تصدير بيانات المشاركين
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs — judges only get the "submitted projects" tab; "judges management"
            is hidden for them. */}
        {!isJudge && (
          <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('submitted')}
              className={`pb-3 text-sm transition-all relative ${
                activeTab === 'submitted'
                  ? 'text-[#e35654]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              style={{ fontWeight: 600 }}
            >
              المشاريع المسلّمة
              {activeTab === 'submitted' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e35654]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('judges')}
              className={`pb-3 text-sm transition-all relative ${
                activeTab === 'judges'
                  ? 'text-[#e35654]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              style={{ fontWeight: 600 }}
            >
              إدارة الحكام والمتابعة
              {activeTab === 'judges' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e35654]"></div>
              )}
            </button>
          </div>
        )}

        {/* Tab: Submitted Projects */}
        {activeTab === 'submitted' && (
          <>
            {/* Timeline banner — organizers see "submission" dates (when projects
                are coming in); judges see "evaluation" dates (when they should
                grade). Same banner shape, different labels + values. */}
            <div
              className={`rounded-2xl p-6 mb-6 text-white ${
                isJudge
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-800'
                  : 'bg-gradient-to-br from-[#e35654] to-[#c74543]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm opacity-90">
                        {isJudge ? 'بداية التقييم' : 'فتح التسليم'}
                      </span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>
                      {isJudge ? evaluationStart : submissionStart}
                    </p>
                  </div>
                  <div className="w-px h-12 bg-white/30"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm opacity-90">
                        {isJudge ? 'انتهاء التقييم' : 'إغلاق التسليم'}
                      </span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>
                      {isJudge ? evaluationEnd : submissionEnd}
                    </p>
                  </div>
                </div>
                {/* Edit-dates button: owners + section MANAGERS only.
                    Staff have section access but date changes affect everyone
                    in the hackathon, so we keep them at the manager tier. */}
                {!isJudge && myCoManagerRole !== 'staff' && (
                  <button
                    onClick={() => setShowEditDeadlineModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <Edit className="w-4 h-4" />
                    تعديل المواعيد
                  </button>
                )}
              </div>
            </div>

            {/* Filters row — same shell for both organizer and judge. The
                status options differ (judge only has evaluated/pending) and
                the distribute button is organizer-only. */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="appearance-none flex items-center gap-2 px-4 py-2.5 pl-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="completed">مكتمل التقييم</option>
                    {isJudge ? (
                      <option value="awaiting">بانتظار التقييم</option>
                    ) : (
                      <>
                        <option value="inReview">قيد التقييم</option>
                        <option value="awaiting">بانتظار التوزيع</option>
                        <option value="pending">لم يُسلم</option>
                      </>
                    )}
                  </select>
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {!isJudge && (
                <button
                  onClick={handleDistributeProjects}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all shadow-lg shadow-[#e35654]/30"
                  style={{ fontWeight: 600 }}
                >
                  <Users2 className="w-4 h-4" />
                  توزيع المشاريع على الحكام
                </button>
              )}
            </div>

            {/* Projects Stats - Interactive. Organizer view. */}
            {!isJudge && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              <button
                onClick={() => setFilterStatus('all')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'all' 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'border-gray-100 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {totalProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">إجمالي المشاريع</p>
              </button>
              
              <button
                onClick={() => setFilterStatus('completed')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'completed' 
                    ? 'border-green-500 shadow-lg shadow-green-500/20' 
                    : 'border-gray-100 hover:border-green-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {completedProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">مكتمل التقييم</p>
              </button>
              
              <button
                onClick={() => setFilterStatus('awaiting')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'awaiting'
                    ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'border-gray-100 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {awaitingProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">بانتظار التوزيع</p>
              </button>

              <button
                onClick={() => setFilterStatus('inReview')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'inReview'
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'border-gray-100 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {inReviewProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">قيد التقييم</p>
              </button>

              <button
                onClick={() => setFilterStatus('pending')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'pending' 
                    ? 'border-gray-500 shadow-lg shadow-gray-500/20' 
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {pendingProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">لم يُسلم بعد</p>
              </button>
            </div>
            )}

            {/* Judge-scoped stats — interactive, click to filter the table.
                Only their assigned projects count here, so totals match below. */}
            {isJudge && judgeAssignments.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                    filterStatus === 'all'
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-gray-100 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                      {judgeAssignments.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">إجمالي المشاريع المسندة</p>
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                    filterStatus === 'completed'
                      ? 'border-green-500 shadow-lg shadow-green-500/20'
                      : 'border-gray-100 hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                      {judgeAssignments.filter((a) => a.evaluated).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">مكتمل التقييم</p>
                </button>
                <button
                  onClick={() => setFilterStatus('awaiting')}
                  className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                    filterStatus === 'awaiting'
                      ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                      : 'border-gray-100 hover:border-orange-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                      {judgeAssignments.filter((a) => !a.evaluated).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">بانتظار التقييم</p>
                </button>
              </div>
            )}

            {/* Projects table — judges only see this once the organizer has
                distributed (and once evaluation has started). Until then, show
                a friendly "waiting" placeholder so the judge knows there's
                nothing for them to score yet. */}
            {isJudge ? (
              loadingProjects ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 text-sm">
                  جاري تحميل المشاريع...
                </div>
              ) : judgeAssignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>
                    لا توجد مشاريع للتقييم بعد
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed max-w-md mx-auto">
                    ستظهر هنا المشاريع المُسندة إليك من قِبل النظام فور بداية فترة
                    التقييم وتوزيع المشاريع من قبل المنظم.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>اسم المشروع</th>
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>المسار</th>
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الفريق</th>
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>وقت التسليم</th>
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الملفات</th>
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>درجة التقييم</th>
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الحالة</th>
                        <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJudgeAssignments.map((a, idx) => {
                        const owner = a.type === 'team' ? (a.teamName ?? '—') : (a.participantName ?? '—');
                        const title = a.projectName?.trim() || `مشروع ${owner}`;
                        const time = a.submittedAt
                          ? new Date(a.submittedAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
                          : '—';
                        const color = PROJECT_COLORS[idx % PROJECT_COLORS.length];
                        return (
                          <tr key={a.tsId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center text-sm`} style={{ fontWeight: 700 }}>
                                  {title.trim().charAt(0) || '·'}
                                </div>
                                <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {a.trackName ? (
                                <span className={`px-3 py-1 rounded-lg text-xs ${getTrackColor(a.trackName)}`} style={{ fontWeight: 600 }}>
                                  {a.trackName}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{owner}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-500">{time}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                {a.files.map((file) => (
                                  <a
                                    key={file.id}
                                    href={`${API_URL}${file.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title={file.name}
                                    className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </a>
                                ))}
                                {a.repoUrl && (
                                  <a
                                    href={a.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title={a.repoUrl}
                                    className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {a.demoUrl && (
                                  <a
                                    href={a.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title={a.demoUrl}
                                    className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {!a.hasFiles && !a.hasLinks && (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {a.evaluated && a.myScore !== null ? (
                                <span className={`text-lg ${getScoreColor(a.myScore)}`} style={{ fontWeight: 700 }}>
                                  {a.myScore}/100
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {a.evaluated ? (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs inline-flex items-center gap-1" style={{ fontWeight: 600 }}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  مكتمل التقييم
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs inline-flex items-center gap-1" style={{ fontWeight: 600 }}>
                                  <Clock className="w-3.5 h-3.5" />
                                  بانتظار التقييم
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {a.evaluated ? (
                                <button
                                  onClick={() => setViewingMyEvaluation(a)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-700 text-xs hover:bg-gray-100 transition-all"
                                  style={{ fontWeight: 600 }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  عرض التقييم
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenEvaluation(a)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs hover:bg-indigo-700 transition-all"
                                  style={{ fontWeight: 600 }}
                                >
                                  <Star className="w-3.5 h-3.5" />
                                  تقييم
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      اسم المشروع
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      المسار
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      الفريق
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      وقت التسليم
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      الملفات
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      المحكم
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      التقييمات
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      الحالة
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${project.color} text-white flex items-center justify-center text-sm`} style={{ fontWeight: 700 }}>
                            {project.icon}
                          </div>
                          <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                            {project.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs ${getTrackColor(project.track)}`} style={{ fontWeight: 600 }}>
                          {project.track}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{project.team}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{project.time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {project.files && project.files.length > 0 && project.files.map((file) => (
                            <a
                              key={file.id}
                              href={`${API_URL}${file.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={file.name}
                              className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          ))}
                          {project.repoUrl && (
                            <a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={project.repoUrl}
                              className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {project.demoUrl && (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={project.demoUrl}
                              className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {!project.hasFiles && !project.hasLinks && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {project.assignedJudge ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                              {project.assignedJudge.name.trim()[0] ?? 'م'}
                            </div>
                            <span className="text-sm text-gray-700">{project.assignedJudge.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg" style={{ fontWeight: 600 }}>
                            لم يوزّع
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {project.status === 'completed' ? (
                          <button
                            onClick={() => handleViewEvaluationDetails(project)}
                            className="flex items-center gap-2 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <span className={`text-lg ${getScoreColor(project.score || 0)}`} style={{ fontWeight: 700 }}>
                              {project.score}/100
                            </span>
                            <span className="text-xs text-gray-400">({project.evaluations}/{project.totalEvaluators})</span>
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        ) : project.status === 'inReview' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-600" style={{ fontWeight: 600 }}>قيد التقييم</span>
                            <span className="text-xs text-gray-400">({project.evaluations}/{project.totalEvaluators})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewProject(project)}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-[#e35654] hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}

        {/* Tab: Judges Management */}
        {activeTab === 'judges' && (
          <>
            {/* Evaluation Timeline */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm opacity-90">بداية التقييم</span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>{evaluationStart}</p>
                  </div>
                  <div className="w-px h-12 bg-white/30"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4" />
                      <span className="text-sm opacity-90">نهاية التقييم</span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>{evaluationEnd}</p>
                  </div>
                </div>
                {/* Edit-dates button: owners + section MANAGERS only. */}
                {myCoManagerRole !== 'staff' && (
                  <button
                    onClick={() => setShowEditDeadlineModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <Edit className="w-4 h-4" />
                    تعديل المواعيد
                  </button>
                )}
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                      معايير التقييم
                    </h3>
                    <p className="text-xs text-gray-500">المعايير المستخدمة لتقييم المشاريع</p>
                  </div>
                </div>
                {!isJudge && (
                  <button
                    onClick={() => setShowEditCriteriaModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <Shield className="w-4 h-4" />
                    <Edit className="w-4 h-4" />
                    تعديل المعايير
                  </button>
                )}
              </div>
              {loadingCriteria ? (
                <p className="text-sm text-gray-400 text-center py-6">جاري التحميل...</p>
              ) : criteria.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1" style={{ fontWeight: 600 }}>
                    لم يتم إضافة معايير تقييم بعد
                  </p>
                  <p className="text-xs text-gray-400">اضغط "تعديل المعايير" لإضافة المعايير</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {criteria.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                            {c.name}
                          </p>
                          <span className="text-sm text-[#e35654]" style={{ fontWeight: 700 }}>
                            {c.weight}%
                          </span>
                        </div>
                        {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Judges List */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                قائمة الحكام ({judges.length})
              </h3>
              <button
                onClick={() => setShowAddJudgeModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all"
                style={{ fontWeight: 600 }}
              >
                <UserPlus className="w-4 h-4" />
                إضافة حكم جديد
              </button>
            </div>

            {loadingJudges ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 text-sm">
                جاري تحميل الحكام...
              </div>
            ) : judges.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <Users2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-700 mb-1" style={{ fontWeight: 600 }}>
                  ما عندك حكام بعد
                </p>
                <p className="text-xs text-gray-400">اضغط "إضافة حكم جديد" لدعوة حكم</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {judges.map((judge) => {
                  // Status badge — three states from the backend: pending/accepted/declined.
                  const statusBadge = judge.inviteStatus === 'accepted'
                    ? { label: 'نشط', cls: 'bg-green-100 text-green-700' }
                    : judge.inviteStatus === 'pending'
                    ? { label: 'بانتظار القبول', cls: 'bg-orange-100 text-orange-700' }
                    : { label: 'رفض الدعوة', cls: 'bg-red-100 text-red-700' };
                  const initial = (judge.fullName.trim()[0] ?? 'م');
                  // Count projects assigned to this judge using the raw projects state.
                  const assignedToJudge = projects.filter((p) => p.assignedJudge?.id === judge.id);
                  const evaluatedByJudge = assignedToJudge.filter((p) => p.status === 'completed').length;
                  const pendingForJudge = assignedToJudge.length - evaluatedByJudge;

                  return (
                    <div key={judge.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center flex-shrink-0" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>
                                {judge.fullName}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge.cls}`} style={{ fontWeight: 600 }}>
                                {statusBadge.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1 truncate">{judge.email}</p>
                            {judge.specialty && (
                              <p className="text-xs text-gray-600 truncate">تخصص: {judge.specialty}</p>
                            )}
                          </div>
                        </div>
                        {judge.inviteStatus === 'accepted' ? (
                          <button
                            onClick={() => handleSendReminder(judge)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-xs hover:bg-blue-50 transition-colors flex-shrink-0"
                            style={{ fontWeight: 600 }}
                          >
                            <Bell className="w-3.5 h-3.5" />
                            تذكير
                          </button>
                        ) : judge.inviteStatus === 'pending' ? (
                          <button
                            onClick={() => handleResendInvite(judge)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 text-xs hover:bg-orange-50 transition-colors flex-shrink-0"
                            style={{ fontWeight: 600 }}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            إعادة إرسال
                          </button>
                        ) : null}
                      </div>

                      {judge.inviteStatus === 'accepted' && (
                        <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-gray-100">
                          <div className="text-center bg-blue-50 rounded-xl py-2">
                            <p className="text-base text-blue-600" style={{ fontWeight: 700 }}>
                              {assignedToJudge.length}
                            </p>
                            <p className="text-[10px] text-gray-500">مسندة</p>
                          </div>
                          <div className="text-center bg-green-50 rounded-xl py-2">
                            <p className="text-base text-green-600" style={{ fontWeight: 700 }}>
                              {evaluatedByJudge}
                            </p>
                            <p className="text-[10px] text-gray-500">مقيّمة</p>
                          </div>
                          <div className="text-center bg-orange-50 rounded-xl py-2">
                            <p className="text-base text-orange-600" style={{ fontWeight: 700 }}>
                              {pendingForJudge}
                            </p>
                            <p className="text-[10px] text-gray-500">متبقية</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleRemoveJudge(judge)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs hover:bg-red-50 transition-colors"
                          style={{ fontWeight: 600 }}
                        >
                          <X className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Project Details Drawer */}
      {showDrawer && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowDrawer(false)}>
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                  {selectedProject.name}
                </h2>
                <p className="text-sm text-gray-500">فريق {selectedProject.team}</p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                  وصف المشروع
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedProject.description || (
                    <span className="text-gray-400">لم يضف المشارك وصفًا للمشروع</span>
                  )}
                </p>
              </div>

              {/* Project links (repo + demo) — only show if at least one is set */}
              {(selectedProject.repoUrl || selectedProject.demoUrl) && (
                <div>
                  <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
                    الروابط
                  </h3>
                  <div className="space-y-2">
                    {selectedProject.repoUrl && (
                      <a
                        href={selectedProject.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <LinkIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>رابط المستودع</p>
                            <p className="text-xs text-gray-500 truncate" dir="ltr">{selectedProject.repoUrl}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </a>
                    )}
                    {selectedProject.demoUrl && (
                      <a
                        href={selectedProject.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Video className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>رابط العرض التجريبي</p>
                            <p className="text-xs text-gray-500 truncate" dir="ltr">{selectedProject.demoUrl}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded files — real list from the backend (each file gets a
                  click-through to preview/download). */}
              <div>
                <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
                  الملفات المرفقة ({selectedProject.files?.length ?? 0})
                </h3>
                {selectedProject.files && selectedProject.files.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProject.files.map((file) => (
                      <a
                        key={file.id}
                        href={`${API_URL}${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#e35654] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#fce7eb] flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#cc4a48]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">لم يرفع المشارك أي ملف</p>
                )}
              </div>

              {selectedProject.status === 'completed' && selectedProject.assignedJudge && (
                <div>
                  <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
                    حالة التقييم
                  </h3>
                  <div className="space-y-2">
                    {/* عرض المحكم المسؤول عن هذا المشروع فقط، مش كل حكام
                        الهاكاثون. كل مشروع يتوزع لمحكم واحد فقط. */}
                    {(() => {
                      const initial = selectedProject.assignedJudge.name.trim()[0] ?? 'م';
                      return (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center text-xs" style={{ fontWeight: 700 }}>
                              {initial}
                            </div>
                            <span className="text-sm text-gray-700">{selectedProject.assignedJudge.name}</span>
                          </div>
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {selectedProject.status === 'completed' && (
                <button
                  onClick={() => {
                    setShowDrawer(false);
                    handleViewEvaluationDetails(selectedProject);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all"
                  style={{ fontWeight: 600 }}
                >
                  عرض تفاصيل التقييم
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Details Modal — real evaluations fetched from
          /hackathons/:id/projects/:tsId/evaluations on open. Each evaluation
          row shows per-criterion scores, weighted total, and the judge's
          comment. */}
      {showEvaluationDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEvaluationDetailsModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تفاصيل التقييم</h3>
                <p className="text-sm text-gray-500">{selectedProject.name}</p>
              </div>
              <button onClick={() => setShowEvaluationDetailsModal(false)} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingEvaluations ? (
                <p className="text-sm text-gray-500 text-center py-8">جاري التحميل...</p>
              ) : projectEvaluations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">لا يوجد تقييمات بعد لهذا المشروع.</p>
              ) : (
                <>
                  {/* Overall weighted score — computed by the backend and
                      stored on the project row. */}
                  {typeof selectedProject.score === 'number' && (
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
                      <p className="text-sm opacity-90 mb-2">التقييم النهائي</p>
                      <p className="text-5xl mb-2" style={{ fontWeight: 700 }}>{selectedProject.score}</p>
                      <p className="text-sm opacity-90">من 100</p>
                    </div>
                  )}

                  {projectEvaluations.map((evaluation) => {
                    // New rubric: criterion score is 0..weight, project total
                    // is just the sum (lands on 0..100 since weights sum to 100).
                    const weightOf = (name: string) =>
                      criteria.find((c) => c.name === name)?.weight ?? 0;
                    const weightedTotal = Math.round(
                      evaluation.scores.reduce((sum, s) => sum + s.score, 0),
                    );
                    const initial = evaluation.judgeName.trim()[0] ?? 'م';
                    return (
                      <div key={evaluation.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center" style={{ fontWeight: 700 }}>
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>{evaluation.judgeName}</p>
                            <p className="text-xs text-gray-500 truncate">
                              تم التقييم في {new Date(evaluation.evaluatedAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <p className={`text-2xl ${getScoreColor(weightedTotal)}`} style={{ fontWeight: 700 }}>
                              {weightedTotal}
                            </p>
                            <p className="text-xs text-gray-500">من 100</p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          {evaluation.scores.map((s, sIdx) => {
                            const max = weightOf(s.name) || 1;
                            const pct = Math.min(100, Math.max(0, (s.score / max) * 100));
                            return (
                              <div key={sIdx} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{s.name}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-600 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-900 w-16 text-left" style={{ fontWeight: 600 }}>
                                    {s.score}/{weightOf(s.name)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {evaluation.comment && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-blue-900 mb-1" style={{ fontWeight: 600 }}>ملاحظات الحكم</p>
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">{evaluation.comment}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Judge Evaluation Modal — score every criterion (0-100) and leave a
          comment. Backend validates that the criterion names match and computes
          the weighted total when displaying to the organizer. */}
      {evaluatingAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setEvaluatingAssignment(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div className="min-w-0">
                <h3 className="text-lg text-gray-900 truncate" style={{ fontWeight: 700 }}>
                  تقييم: {evaluatingAssignment.projectName?.trim() || 'المشروع'}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {evaluatingAssignment.type === 'team'
                    ? `فريق ${evaluatingAssignment.teamName ?? ''}`
                    : `مشارك ${evaluatingAssignment.participantName ?? ''}`}
                </p>
              </div>
              <button
                onClick={() => setEvaluatingAssignment(null)}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {criteria.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  لم يحدد المنظم معايير التقييم بعد.
                </p>
              ) : (
                <>
                  {criteria.map((c) => (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{c.name}</p>
                          {c.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-[#e35654] bg-white px-2 py-1 rounded-lg flex-shrink-0" style={{ fontWeight: 700 }}>
                          من {c.weight}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={c.weight}
                          value={evalScores[c.name] ?? ''}
                          onChange={(e) => setEvalScores((s) => ({ ...s, [c.name]: e.target.value }))}
                          placeholder={`٠ - ${c.weight}`}
                          className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-xs text-gray-500">من {c.weight}</span>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      ملاحظات (اختياري)
                    </label>
                    <textarea
                      value={evalComment}
                      onChange={(e) => setEvalComment(e.target.value)}
                      rows={4}
                      placeholder="ملاحظات للفريق..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setEvaluatingAssignment(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                style={{ fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitEvaluation}
                disabled={submittingEval || criteria.length === 0}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                style={{ fontWeight: 600 }}
              >
                {submittingEval ? 'جاري الحفظ...' : 'حفظ التقييم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Judge: read-only view of my own submitted evaluation. Shows the
          weighted total, per-criterion scores, and the comment I left. */}
      {viewingMyEvaluation && viewingMyEvaluation.myEvaluation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setViewingMyEvaluation(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div className="min-w-0">
                <h3 className="text-lg text-gray-900 truncate" style={{ fontWeight: 700 }}>
                  تقييمي للمشروع: {viewingMyEvaluation.projectName?.trim() || 'المشروع'}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {viewingMyEvaluation.type === 'team'
                    ? `فريق ${viewingMyEvaluation.teamName ?? ''}`
                    : `مشارك ${viewingMyEvaluation.participantName ?? ''}`}
                </p>
              </div>
              <button
                onClick={() => setViewingMyEvaluation(null)}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {viewingMyEvaluation.myScore !== null && (
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
                  <p className="text-sm opacity-90 mb-2">الدرجة النهائية</p>
                  <p className="text-5xl mb-2" style={{ fontWeight: 700 }}>{viewingMyEvaluation.myScore}</p>
                  <p className="text-sm opacity-90">من 100</p>
                </div>
              )}

              {viewingMyEvaluation.myEvaluation.scores.map((s, idx) => {
                const weight = criteria.find((c) => c.name === s.name)?.weight ?? 0;
                const pct = weight > 0 ? Math.min(100, Math.max(0, (s.score / weight) * 100)) : 0;
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{s.name}</p>
                      <span className="text-xs text-[#e35654] bg-white px-2 py-1 rounded-lg" style={{ fontWeight: 700 }}>
                        من {weight}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 w-16 text-left" style={{ fontWeight: 700 }}>
                        {s.score}/{weight}
                      </span>
                    </div>
                  </div>
                );
              })}

              {viewingMyEvaluation.myEvaluation.comment && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-900 mb-1" style={{ fontWeight: 600 }}>ملاحظاتي</p>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{viewingMyEvaluation.myEvaluation.comment}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>إعدادات التقييم</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                      إظهار التقييم للمشاركين
                    </p>
                    <p className="text-xs text-gray-500">
                      عند التفعيل، يرى المشارك درجته بعد تاريخ إعلان النتائج
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEvaluationsToParticipants(!showEvaluationsToParticipants)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      showEvaluationsToParticipants ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      showEvaluationsToParticipants ? 'right-0.5' : 'right-6'
                    }`}></div>
                  </button>
                </div>
                {showEvaluationsToParticipants ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                    <Eye className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800">
                      سيرى المشاركون درجاتهم بعد تاريخ إعلان النتائج
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-100 border border-gray-200">
                    <EyeOff className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700">
                      التقييم مخفي عن المشاركين تماماً
                    </p>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-xl border transition-colors ${
                showEvaluationsToParticipants ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50/50 opacity-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                      إظهار ملاحظات الحكام
                    </p>
                    <p className="text-xs text-gray-500">
                      السماح للمشاركين برؤية تعليقات الحكام التفصيلية
                    </p>
                  </div>
                  <button
                    disabled={!showEvaluationsToParticipants}
                    onClick={() => setShowEvaluationNotesToParticipants(!showEvaluationNotesToParticipants)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      showEvaluationNotesToParticipants && showEvaluationsToParticipants ? 'bg-green-600' : 'bg-gray-300'
                    } ${!showEvaluationsToParticipants ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      showEvaluationNotesToParticipants && showEvaluationsToParticipants ? 'right-0.5' : 'right-6'
                    }`}></div>
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-xl border bg-gray-50 ${
                announcementDateError ? 'border-red-300' : 'border-gray-200'
              }`}>
                <label className="block text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                  تاريخ ووقت إعلان الفائزين
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  لن تظهر نتائج التقييم للمشاركين قبل هذا التاريخ، حتى لو كان التقييم مفعّلاً.
                  هذا غير "تاريخ إعلان قبول المشاركين".
                </p>
                {hackathonDates.judgingEnd && (
                  <p className="text-xs text-gray-500 mb-2">
                    <span style={{ fontWeight: 600 }}>نهاية التقييم الحالية:</span>{' '}
                    {new Date(hackathonDates.judgingEnd).toLocaleString('ar-SA', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
                {announcementDateError && (
                  <p className="text-xs text-red-600 mb-2" style={{ fontWeight: 600 }}>
                    {announcementDateError}
                  </p>
                )}
                <input
                  type="datetime-local"
                  value={announcementDate}
                  onChange={(e) => setAnnouncementDate(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none ${
                    announcementDateError
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#e35654]'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50" style={{ fontWeight: 600 }}>
                إلغاء
              </button>
              <button
                onClick={handleUpdateSettings}
                disabled={savingSettings || !!announcementDateError}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 600 }}
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Judge Modal */}
      {showAddJudgeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowAddJudgeModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>دعوة حكم جديد</h3>
              <button onClick={() => setShowAddJudgeModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>الاسم الكامل</label>
                <input
                  type="text"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654]"
                  placeholder="أدخل اسم الحكم"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newJudgeEmail}
                  onChange={(e) => setNewJudgeEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654]"
                  placeholder="judge@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  التخصص <span className="text-gray-400 text-xs">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={newJudgeSpecialty}
                  onChange={(e) => setNewJudgeSpecialty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654]"
                  placeholder="مثال: الذكاء الاصطناعي"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddJudgeModal(false)}
                disabled={invitingJudge}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleInviteJudge}
                disabled={invitingJudge}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {invitingJudge ? 'جاري الإرسال...' : 'إرسال الدعوة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Criteria Modal */}
      {showEditCriteriaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEditCriteriaModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تعديل معايير التقييم</h3>
              </div>
              <button onClick={() => setShowEditCriteriaModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-900" style={{ fontWeight: 600 }}>تنبيه: صلاحيات محدودة</p>
                <p className="text-xs text-yellow-700 mt-1">فقط المنظم الأساسي والمدراء يمكنهم تعديل معايير التقييم</p>
              </div>
            </div>

            <div className="space-y-4">
              {editingCriteria.map((c, index) => {
                const updateRow = (patch: Partial<ApiCriterion>) => {
                  setEditingCriteria((prev) =>
                    prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
                  );
                };
                const removeRow = () => {
                  setEditingCriteria((prev) => prev.filter((_, i) => i !== index));
                };
                return (
                  <div key={index} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="اسم المعيار"
                        value={c.name}
                        onChange={(e) => updateRow({ name: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                        style={{ fontWeight: 600 }}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          placeholder="الوزن"
                          value={c.weight || ''}
                          onChange={(e) => updateRow({ weight: Number(e.target.value) || 0 })}
                          className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-center"
                          style={{ fontWeight: 600 }}
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <button
                        onClick={removeRow}
                        disabled={editingCriteria.length === 1}
                        className="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                        title="حذف"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      placeholder="وصف المعيار (اختياري)"
                      value={c.description ?? ''}
                      onChange={(e) => updateRow({ description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                      rows={2}
                    />
                  </div>
                );
              })}

              <button
                onClick={() =>
                  setEditingCriteria((prev) => [
                    ...prev,
                    {
                      id: 0,
                      name: '',
                      description: '',
                      weight: 0,
                      sortOrder: prev.length + 1,
                    },
                  ])
                }
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 text-sm hover:border-[#e35654] hover:text-[#e35654] transition-colors"
                style={{ fontWeight: 600 }}
              >
                + إضافة معيار جديد
              </button>

              <div className="text-sm text-center" style={{ fontWeight: 600 }}>
                {(() => {
                  const sum = editingCriteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
                  const balanced = Math.abs(sum - 100) <= 0.05;
                  return (
                    <span className={balanced ? 'text-green-600' : 'text-red-500'}>
                      مجموع الأوزان: {sum.toFixed(2)}% {balanced ? '✓' : '— يجب أن يكون 100%'}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowEditCriteriaModal(false)}
                disabled={savingCriteria}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateCriteria}
                disabled={savingCriteria}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {savingCriteria ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deadline Modal */}
      {showEditDeadlineModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEditDeadlineModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                {activeTab === 'judges' ? 'تعديل مواعيد التقييم' : 'تعديل مواعيد التسليم'}
              </h3>
              <button onClick={() => setShowEditDeadlineModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'judges' ? (
                <>
                  {/* Show the surrounding chain bounds so the organizer knows
                      what window the date must fit into. */}
                  {(hackathonDates.submissionEnd || hackathonDates.winnersDate) && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
                      {hackathonDates.submissionEnd && (
                        <p>
                          <span style={{ fontWeight: 600 }}>إغلاق التسليم:</span>{' '}
                          {new Date(hackathonDates.submissionEnd).toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                      )}
                      {hackathonDates.winnersDate && (
                        <p>
                          <span style={{ fontWeight: 600 }}>إعلان الفائزين:</span>{' '}
                          {new Date(hackathonDates.winnersDate).toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>بداية التقييم</label>
                    {editDateErrors.judgingStart && (
                      <p className="text-xs text-red-600 mb-1.5" style={{ fontWeight: 600 }}>{editDateErrors.judgingStart}</p>
                    )}
                    <input
                      type="datetime-local"
                      value={editDates.judgingStart}
                      onChange={(e) => setEditDates((s) => ({ ...s, judgingStart: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none ${
                        editDateErrors.judgingStart ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#e35654]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>نهاية التقييم</label>
                    {editDateErrors.judgingEnd && (
                      <p className="text-xs text-red-600 mb-1.5" style={{ fontWeight: 600 }}>{editDateErrors.judgingEnd}</p>
                    )}
                    <input
                      type="datetime-local"
                      value={editDates.judgingEnd}
                      onChange={(e) => setEditDates((s) => ({ ...s, judgingEnd: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none ${
                        editDateErrors.judgingEnd ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#e35654]'
                      }`}
                    />
                  </div>
                </>
              ) : (
                <>
                  {(hackathonDates.hackathonStart || hackathonDates.judgingStart) && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
                      {hackathonDates.hackathonStart && (
                        <p>
                          <span style={{ fontWeight: 600 }}>بداية الهاكاثون:</span>{' '}
                          {new Date(hackathonDates.hackathonStart).toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                      )}
                      {hackathonDates.judgingStart && (
                        <p>
                          <span style={{ fontWeight: 600 }}>بداية التقييم:</span>{' '}
                          {new Date(hackathonDates.judgingStart).toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>بداية فتح التسليم</label>
                    {editDateErrors.submissionStart && (
                      <p className="text-xs text-red-600 mb-1.5" style={{ fontWeight: 600 }}>{editDateErrors.submissionStart}</p>
                    )}
                    <input
                      type="datetime-local"
                      value={editDates.submissionStart}
                      onChange={(e) => setEditDates((s) => ({ ...s, submissionStart: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none ${
                        editDateErrors.submissionStart ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#e35654]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>نهاية التسليم</label>
                    {editDateErrors.submissionEnd && (
                      <p className="text-xs text-red-600 mb-1.5" style={{ fontWeight: 600 }}>{editDateErrors.submissionEnd}</p>
                    )}
                    <input
                      type="datetime-local"
                      value={editDates.submissionEnd}
                      onChange={(e) => setEditDates((s) => ({ ...s, submissionEnd: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none ${
                        editDateErrors.submissionEnd ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#e35654]'
                      }`}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setShowEditDeadlineModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50" style={{ fontWeight: 600 }}>
                إلغاء
              </button>
              <button
                onClick={handleUpdateDeadline}
                disabled={savingDates || hasEditDateError}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 600 }}
              >
                {savingDates ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Projects Modal — 3 steps: preview → shuffling → result.
          The preview confirms the judges + counts. The shuffling step runs an
          animation in parallel with the actual API call so the user feels the
          randomness happen instead of seeing pre-computed numbers. The result
          step shows the actual per-judge breakdown from the backend. */}
      {showDistributeModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => {
            if (distributeStep !== 'shuffling') setShowDistributeModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            {distributeStep === 'preview' && (() => {
              const activeJudges = judges.filter((j) => j.inviteStatus === 'accepted');
              const projectCount = allProjects.filter((p) => p.status !== 'pending').length;
              const base = activeJudges.length > 0 ? Math.floor(projectCount / activeJudges.length) : 0;
              const remainder = activeJudges.length > 0 ? projectCount % activeJudges.length : 0;
              const minPerJudge = base;
              const maxPerJudge = base + (remainder > 0 ? 1 : 0);
              return (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Users2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>تأكيد قائمة المحكمين</h3>
                    <p className="text-sm text-gray-600">
                      راجع المحكمين قبل بدء التوزيع. بعد التأكيد سيتم خلط المشاريع وتوزيعها عشوائياً بشكل متساوٍ.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-2xl text-blue-700" style={{ fontWeight: 700 }}>{projectCount}</p>
                      <p className="text-xs text-gray-600 mt-1">مشروع مسلّم</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <p className="text-2xl text-purple-700" style={{ fontWeight: 700 }}>{activeJudges.length}</p>
                      <p className="text-xs text-gray-600 mt-1">حكم نشط</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <p className="text-2xl text-amber-700" style={{ fontWeight: 700 }}>
                        {minPerJudge === maxPerJudge ? minPerJudge : `${minPerJudge}-${maxPerJudge}`}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">مشروع لكل حكم</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>الحكام المشاركون:</h4>
                    <div className="space-y-2">
                      {activeJudges.map((judge) => {
                        const initial = judge.fullName.trim()[0] ?? 'م';
                        return (
                          <div key={judge.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center flex-shrink-0" style={{ fontWeight: 700 }}>
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{judge.fullName}</p>
                              {judge.specialty && (
                                <p className="text-xs text-gray-500 truncate">{judge.specialty}</p>
                              )}
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowDistributeModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50" style={{ fontWeight: 600 }}>
                      إلغاء
                    </button>
                    <button onClick={confirmDistribution} className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48]" style={{ fontWeight: 600 }}>
                      ابدأ التوزيع العشوائي
                    </button>
                  </div>
                </>
              );
            })()}

            {distributeStep === 'shuffling' && (
              <div className="py-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users2 className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>جاري التوزيع العشوائي...</h3>
                <p className="text-sm text-gray-500 mb-6">
                  يتم خلط المشاريع والحكام ثم توزيعها بشكل عادل
                </p>
                <div className="space-y-2 text-right max-w-xs mx-auto">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>تم خلط ترتيب المشاريع</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>تم خلط ترتيب الحكام</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0"></div>
                    <span>جاري الإسناد...</span>
                  </div>
                </div>
              </div>
            )}

            {distributeStep === 'result' && distributionResult && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>تم التوزيع بنجاح</h3>
                  <p className="text-sm text-gray-600">
                    وُزِّع {distributionResult.assigned} مشروع على {distributionResult.judges} حكام بشكل عشوائي
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>نتيجة التوزيع الفعلية:</h4>
                  <div className="space-y-2">
                    {distributionResult.breakdown.map((row) => {
                      const initial = row.judgeName.trim()[0] ?? 'م';
                      return (
                        <div key={row.judgeId} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center flex-shrink-0" style={{ fontWeight: 700 }}>
                              {initial}
                            </div>
                            <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{row.judgeName}</p>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <p className="text-lg text-blue-600" style={{ fontWeight: 700 }}>{row.count}</p>
                            <p className="text-xs text-gray-500">مشروع</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setShowDistributeModal(false)}
                  className="w-full px-4 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48]"
                  style={{ fontWeight: 600 }}
                >
                  موافق
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

