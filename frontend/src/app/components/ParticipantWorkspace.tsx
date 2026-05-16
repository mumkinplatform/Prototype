import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { apiGet, apiPut, apiDelete, apiPost, apiUpload, API_URL, ApiError } from "../../lib/api";
import { HackathonCover, BrandingPayload } from "./HackathonCover";
import { LogoPattern } from "./LogoPatterns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Globe,
  Upload,
  FileText,
  Star,
  MessageSquare,
  ChevronLeft,
  CheckCircle2,
  Play,
  Send,
  X,
  Plus,
  Eye,
  Download,
  BarChart3,
  ArrowRight,
  Home,
  CalendarDays,
  Target,
  Flag,
  CheckCircle,
  Circle,
  ListChecks,
  Mail,
  Trash2,
  RefreshCw,
  LogOut,
  UserCog,
} from "lucide-react";

// ── API Types ────────────────────────────────────────────────────
interface ApiMyHackathon {
  id: number;
  title: string;
  description: string | null;
  type: string | null;
  location: string | null;
  org: string | null;
  registrationStartDate: string | null;
  registrationDeadline: string | null;
  hackathonStartDate: string | null;
  hackathonEndDate: string | null;
  submissionDeadline: string | null;
  announcementDate: string | null;
  winnersDate: string | null;
  status: string;
  teamMin: number;
  teamMax: number;
  myTeamId: number | null;
  participationType: "solo" | "team";
  teamMethod: "ai" | "manual" | null;
  applicationStatus: "pending" | "accepted" | "rejected";
  myIdeaTitle: string | null;
  myIdeaDescription: string | null;
  appliedAt: string | null;
  tags: string[];
  branding: BrandingPayload | null;
}

interface UiTimelinePhase {
  phase: string;
  date: string;
  status: "completed" | "active" | "upcoming";
  color: string;
}

interface UiMyHackathon {
  id: number;
  name: string;
  status: string;
  statusColor: string;
  statusBg: string;
  note: string;
  branding: BrandingPayload | null;
  track: string;
  organizer: string;
  location: string;
  tags: string[];
  description: string;
  submissionDeadlineRaw: string | null;
  hackathonStartDateRaw: string | null;
  hackathonEndDateRaw: string | null;
  winnersDateRaw: string | null;
  hasTeam: boolean;
  participationType: "solo" | "team";
  teamMethod: "ai" | "manual" | null;
  registrationDeadlineRaw: string | null;
  applicationStatus: "pending" | "accepted" | "rejected";
  myIdeaTitle: string | null;
  myIdeaDescription: string | null;
  appliedAt: string | null;
  teamMin: number;
  teamMax: number;
  hackathonStatus: string;
  timeline: UiTimelinePhase[];
}

function formatDateAr(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Date + time formatter for moments where the exact instant matters
// (e.g., submission confirmation, matching what the organizer sees).
function formatDateTimeAr(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  if (start && end && new Date(start).getTime() !== new Date(end).getTime()) {
    return `${formatDateAr(start)} — ${formatDateAr(end)}`;
  }
  return formatDateAr(start ?? end);
}

function buildTimeline(h: ApiMyHackathon): UiTimelinePhase[] {
  const now = Date.now();

  const phases: Array<{
    phase: string;
    start: string | null;
    end: string | null;
  }> = [
    { phase: "التسجيل والقبول", start: h.registrationStartDate, end: h.registrationDeadline },
    { phase: "بداية المسابقة", start: h.hackathonStartDate, end: h.hackathonStartDate },
    { phase: "التسليم النهائي", start: h.submissionDeadline, end: h.submissionDeadline },
    { phase: "إعلان النتائج", start: h.winnersDate, end: h.winnersDate },
  ];

  return phases
    .filter((p) => p.start || p.end)
    .map((p): UiTimelinePhase => {
      const startMs = p.start ? new Date(p.start).getTime() : null;
      const endMs = p.end ? new Date(p.end).getTime() : null;

      let status: UiTimelinePhase["status"];
      let color: string;
      if (endMs !== null && now > endMs) {
        status = "completed";
        color = "#10b981";
      } else if (startMs !== null && now >= startMs) {
        status = "active";
        color = "#e35654";
      } else {
        status = "upcoming";
        color = "#6b7280";
      }

      return {
        phase: p.phase,
        date: formatRange(p.start, p.end),
        status,
        color,
      };
    });
}

function toUiMyHackathon(h: ApiMyHackathon, _index: number): UiMyHackathon {
  // Status badge derives from application_status first — pending/rejected take
  // precedence over team-state messaging because the participant has no access
  // to the workspace until the organizer accepts.
  let status: string;
  let statusColor: string;
  let statusBg: string;
  let note: string;
  if (h.applicationStatus === "pending") {
    status = "قيد المراجعة";
    statusColor = "#f59e0b";
    statusBg = "#fffbeb";
    note = "طلب تسجيلك قيد المراجعة من قِبل المنظم. ستتلقى إيميلاً عند اتخاذ القرار.";
  } else if (h.applicationStatus === "rejected") {
    status = "مرفوض";
    statusColor = "#ef4444";
    statusBg = "#fef2f2";
    note = "نأسف، لم يتم قبول طلب مشاركتك في هذا الهاكاثون.";
  } else if (h.myTeamId || h.participationType === "solo") {
    status = "مقبول";
    statusColor = "#10b981";
    statusBg = "#f0fdf4";
    note = h.myTeamId
      ? "تم القبول في فريقك. يمكنك البدء في العمل على المشروع."
      : "أنت مسجّل بشكل فردي. ابدأ في إعداد مشروعك.";
  } else {
    status = "بانتظار فريق";
    statusColor = "#f59e0b";
    statusBg = "#fffbeb";
    note = "تم قبولك. تبقى إيجاد فريق لإكمال مشاركتك.";
  }

  return {
    id: h.id,
    name: h.title,
    status,
    statusColor,
    statusBg,
    note,
    branding: h.branding,
    track: h.tags[0] ?? (h.type ?? "هاكاثون"),
    organizer: h.org ?? "—",
    location: h.location ?? "—",
    tags: h.tags.length > 0 ? h.tags : (h.type ? [h.type] : []),
    description: h.description ?? "",
    submissionDeadlineRaw: h.submissionDeadline,
    hackathonStartDateRaw: h.hackathonStartDate,
    hackathonEndDateRaw: h.hackathonEndDate,
    winnersDateRaw: h.winnersDate,
    hasTeam: h.myTeamId !== null,
    participationType: h.participationType,
    teamMethod: h.teamMethod,
    registrationDeadlineRaw: h.registrationDeadline,
    applicationStatus: h.applicationStatus,
    myIdeaTitle: h.myIdeaTitle,
    myIdeaDescription: h.myIdeaDescription,
    appliedAt: h.appliedAt,
    teamMin: h.teamMin,
    teamMax: h.teamMax,
    hackathonStatus: h.status,
    timeline: buildTimeline(h),
  };
}

/**
 * Phase the accepted participant is currently in, derived from the hackathon's
 * date milestones. This is meaningful inside the workspace where the
 * participant has already passed acceptance — we want to surface "what's next?"
 * rather than the organizer-facing H_status label.
 */
function computeCurrentPhase(h: UiMyHackathon): { value: string; color: string } {
  const now = Date.now();
  const ms = (iso: string | null): number | null => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : null;
  };
  const hackStart = ms(h.hackathonStartDateRaw);
  const hackEnd = ms(h.hackathonEndDateRaw);
  const submissionEnd = ms(h.submissionDeadlineRaw);
  const winnersAt = ms(h.winnersDateRaw);

  if (hackStart !== null && now < hackStart) {
    return { value: "بانتظار بدء الهاكاثون", color: "#3b82f6" };
  }
  if (hackEnd !== null && now < hackEnd) {
    return { value: "الهاكاثون جارٍ", color: "#10b981" };
  }
  if (submissionEnd !== null && now < submissionEnd) {
    return { value: "فترة التسليم", color: "#e35654" };
  }
  if (winnersAt !== null && now < winnersAt) {
    return { value: "تحت التحكيم", color: "#f59e0b" };
  }
  return { value: "انتهى الهاكاثون", color: "#6b7280" };
}

// ── Hackathons Data (legacy mock — kept for reference, unused) ───

// ─── Types ──────────────────────────────────────────────
type WorkspaceTab = "home" | "team" | "submission" | "evaluations";

// ─── Team Chat ────────────────────────────────────────────
interface ApiTeamMessage {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  createdAt: string;
  isMine: boolean;
}

// ─── Evaluations ──────────────────────────────────────────
interface ApiEvaluation {
  id: number;
  judgeName: string;
  judgeSpecialty: string | null;
  comment: string | null;
  evaluatedAt: string;
  criteria: { name: string; score: number; max: number }[];
  totalScore: number;
  maxScore: number;
}

interface ApiEvaluationsVisibility {
  visible: boolean;
  showEvaluations: boolean;
  showNotes: boolean;
  winnersDate: string | null;
  reason: 'evaluations_hidden' | 'before_winners_date' | null;
}

interface ApiEvaluationsResponse {
  items: ApiEvaluation[];
  teamId: number | null;
  isRegistered: boolean;
  visibility: ApiEvaluationsVisibility;
}

// ─── Submission ───────────────────────────────────────────
export interface ApiSubmissionFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string | null;
  uploadedAt: string;
  uploaderName?: string | null;
}

export interface ApiSubmission {
  submissionId: number;
  projectName: string | null;
  projectDescription: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  submittedAt: string | null;
  submissionStartDate: string | null;
  submissionDeadline: string | null;
  maxFileSizeMb: number;
  submissionFields: string[];
  requirements: string[];
  expectedProjectsDescription: string | null;
  files: ApiSubmissionFile[];
}

type SubmissionWindowState = "before_start" | "open" | "closed";

function computeSubmissionWindow(s: ApiSubmission): SubmissionWindowState {
  const now = Date.now();
  const start = s.submissionStartDate ? new Date(s.submissionStartDate).getTime() : null;
  const deadline = s.submissionDeadline ? new Date(s.submissionDeadline).getTime() : null;
  if (start !== null && now < start) return "before_start";
  if (deadline !== null && now > deadline) return "closed";
  return "open";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const SUBMISSION_FIELD_LABELS: Record<string, string> = {
  title: "عنوان المشروع",
  desc: "وصف المشروع",
  video: "فيديو توضيحي",
  demo: "رابط النسخة التجريبية",
  github: "رابط GitHub",
  presentation: "عرض تقديمي (PDF)",
  images: "صور المشروع",
};

const FILE_COLOR_PALETTE = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6"];



// ─── Timeline Data ──────────────────────────────────────
// ─── Sidebar Cards ──────────────────────────────────────
const sidebarCards: { tab: WorkspaceTab; icon: any; label: string; desc: string; color: string; bg: string }[] = [
  { tab: "home", icon: Home, label: "الرئيسية", desc: "نظرة عامة على الهاكاثون", color: "#6366f1", bg: "#eef2ff" },
  { tab: "team", icon: Users, label: "بيانات الفريق", desc: "التواصل مع أعضاء فريقك", color: "#10b981", bg: "#f0fdf4" },
  { tab: "submission", icon: Upload, label: "رفع المشروع", desc: "رفع ومعاينة التسليمات", color: "#e35654", bg: "#fef2f2" },
  { tab: "evaluations", icon: BarChart3, label: "التقييمات", desc: "تقييمات الحكام لمشروعك", color: "#f59e0b", bg: "#fffbeb" },
];

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
export function ParticipantWorkspace() {
  const [searchParams] = useSearchParams();
  const hackathonId = searchParams.get("id");

  const [hackathons, setHackathons] = useState<UiMyHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHackathons = async () => {
    try {
      const data = await apiGet<{ items: ApiMyHackathon[] }>("/participants/my-hackathons");
      setHackathons(data.items.map(toUiMyHackathon));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل تحميل مساحات العمل");
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchHackathons().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#f7f7f6] flex items-center justify-center text-gray-500 text-sm">جاري تحميل مساحات العمل...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-[#f7f7f6] flex items-center justify-center text-red-500 text-sm">{error}</div>;
  }

  const selectedHackathon = hackathonId ? hackathons.find((h) => h.id === Number(hackathonId)) : null;

  if (!hackathonId || !selectedHackathon) {
    return <WorkspacesList hackathons={hackathons} onRefresh={fetchHackathons} />;
  }

  return <WorkspaceDetails hackathon={selectedHackathon} />;
}

// ═══════════════════════════════════════════════════════════
// Workspaces List
// ═══════════════════════════════════════════════════════════
function WorkspacesList({
  hackathons,
  onRefresh,
}: {
  hackathons: UiMyHackathon[];
  onRefresh: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [viewingRegistration, setViewingRegistration] = useState<UiMyHackathon | null>(null);
  const [managingTeam, setManagingTeam] = useState<UiMyHackathon | null>(null);

  const handleEnterWorkspace = (hackathonId: number) => {
    navigate(`/participant/workspace?id=${hackathonId}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/participant")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                مساحات العمل
              </h1>
              <p className="text-sm text-gray-500">
                اختر هاكاثوناً للدخول إلى مساحة عمله
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {hackathons.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-2xl border border-dashed border-gray-200 bg-white">
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
              ما عندك أي هاكاثونات مسجّل فيها بعد
            </p>
            <p className="text-gray-400 text-xs mt-1">
              تصفّح الهاكاثونات وسجّل في أي واحد لتظهر هنا.
            </p>
            <button
              onClick={() => navigate("/participant/hackathons")}
              className="mt-4 px-5 py-2 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors"
              style={{ fontWeight: 600 }}
            >
              تصفّح الهاكاثونات
            </button>
          </div>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full"
            >
              {/* Cover */}
              <div className="h-48 relative overflow-hidden">
                <HackathonCover branding={h.branding} id={h.id} />
                <div className="absolute top-3 right-3 z-10">
                  <span className="text-xs px-3 py-1.5 rounded-full text-white shadow-md" style={{ background: "#e35654", fontWeight: 600 }}>
                    {h.track}
                  </span>
                </div>
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className="text-xs px-3 py-1.5 rounded-full shadow-md"
                    style={{ background: h.statusBg, color: h.statusColor, fontWeight: 600 }}
                  >
                    {h.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-gray-900 text-base mb-2" style={{ fontWeight: 700 }}>{h.name}</h2>
                
                {/* Info — wraps so a long address doesn't get clipped */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                  <div className="inline-flex items-center gap-1">
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] flex-shrink-0" style={{ fontWeight: 700 }}>
                      {h.organizer.substring(0, 2)}
                    </div>
                    <span>{h.organizer}</span>
                  </div>
                  <div className="inline-flex items-start gap-1 min-w-0">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{h.location}</span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{h.note}</p>

                <div className="mt-auto space-y-2">
                  {h.applicationStatus === "accepted" ? (
                    <button
                      onClick={() => handleEnterWorkspace(h.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors shadow-md shadow-[#e35654]/20"
                      style={{ fontWeight: 600 }}
                    >
                      <Play className="w-4 h-4" />
                      دخول مساحة العمل
                    </button>
                  ) : h.applicationStatus === "pending" ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-50 text-amber-700 text-sm cursor-not-allowed border border-amber-200"
                      style={{ fontWeight: 600 }}
                    >
                      <Clock className="w-4 h-4" />
                      قيد المراجعة
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 text-sm cursor-not-allowed border border-red-200"
                      style={{ fontWeight: 600 }}
                    >
                      <X className="w-4 h-4" />
                      تم رفض طلبك
                    </button>
                  )}
                  {/* Manage team button — appears for manual team registrations
                      while the registration window is still open. This is the
                      single entry point for all team editing actions. */}
                  {h.participationType === "team" &&
                    h.teamMethod === "manual" &&
                    h.applicationStatus !== "rejected" &&
                    h.registrationDeadlineRaw !== null &&
                    new Date(h.registrationDeadlineRaw).getTime() > Date.now() && (
                      <button
                        onClick={() => setManagingTeam(h)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#eef2ff] text-[#6366f1] text-xs hover:bg-[#e0e7ff] transition-colors border border-[#c7d2fe]"
                        style={{ fontWeight: 600 }}
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        إدارة الفريق
                      </button>
                    )}
                  <button
                    onClick={() => setViewingRegistration(h)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    عرض طلب التسجيل
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Registration details modal — read-only view of what the participant
          submitted at registration time. No editing for now (deferred). */}
      {viewingRegistration && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-gray-900 text-base" style={{ fontWeight: 700 }}>
                  طلب التسجيل
                </p>
                <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[280px]">
                  {viewingRegistration.name}
                </p>
              </div>
              <button
                onClick={() => setViewingRegistration(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: viewingRegistration.statusBg,
                    color: viewingRegistration.statusColor,
                    fontWeight: 600,
                  }}
                >
                  {viewingRegistration.status}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700" style={{ fontWeight: 600 }}>
                  {viewingRegistration.participationType === "team" ? "مشاركة جماعية" : "مشاركة فردية"}
                </span>
                {viewingRegistration.appliedAt && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    تاريخ التسجيل: {formatDateAr(viewingRegistration.appliedAt)}
                  </span>
                )}
              </div>

              {viewingRegistration.myIdeaTitle ? (
                <div>
                  <p className="text-gray-500 text-xs mb-1.5" style={{ fontWeight: 600 }}>
                    عنوان الفكرة
                  </p>
                  <p className="text-gray-900 text-sm leading-relaxed" style={{ fontWeight: 600 }}>
                    {viewingRegistration.myIdeaTitle}
                  </p>
                </div>
              ) : null}

              {viewingRegistration.myIdeaDescription ? (
                <div>
                  <p className="text-gray-500 text-xs mb-1.5" style={{ fontWeight: 600 }}>
                    نبذة عن الفكرة
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {viewingRegistration.myIdeaDescription}
                  </p>
                </div>
              ) : null}

              {!viewingRegistration.myIdeaTitle && !viewingRegistration.myIdeaDescription && (
                <p className="text-gray-400 text-sm text-center py-6">
                  لا توجد بيانات إضافية لطلب التسجيل.
                </p>
              )}

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
                هذه نسخة للقراءة فقط من طلب تسجيلك. لا يمكن التعديل بعد إرسال الطلب.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setViewingRegistration(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
                style={{ fontWeight: 600 }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team management dialog — single home for invite/leave/transfer actions. */}
      {managingTeam && (
        <ManageTeamDialog
          hackathonId={managingTeam.id}
          onClose={() => setManagingTeam(null)}
          onChanged={onRefresh}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Workspace Details
// ══════════════════════════════════════════════════════════
// localStorage key prefix for the last count the user has acknowledged per tab.
// Stored per hackathon so badges are independent across hackathons.
const SEEN_STORAGE_PREFIX = "mumkin_workspace_seen_";

function loadSeenCounts(hackathonId: number): Partial<Record<WorkspaceTab, number>> {
  try {
    const raw = localStorage.getItem(`${SEEN_STORAGE_PREFIX}${hackathonId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSeenCounts(hackathonId: number, seen: Partial<Record<WorkspaceTab, number>>) {
  try {
    localStorage.setItem(`${SEEN_STORAGE_PREFIX}${hackathonId}`, JSON.stringify(seen));
  } catch {
    /* localStorage not available — ignore silently */
  }
}

// Tabs that may be deep-linked from a notification. The Team tab is the most
// likely candidate (chat notifications), but other tabs are honoured too if a
// future notification type targets them.
const WORKSPACE_TAB_VALUES: WorkspaceTab[] = ["home", "team", "submission", "evaluations"];

function parseTabParam(raw: string | null, fallback: WorkspaceTab): WorkspaceTab {
  if (raw && (WORKSPACE_TAB_VALUES as string[]).includes(raw)) {
    return raw as WorkspaceTab;
  }
  return fallback;
}

function WorkspaceDetails({ hackathon }: { hackathon: UiMyHackathon }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // If a notification (or any deep link) passes ?tab=, honour it on first
  // render so the participant lands on the right place. Hide the Team tab for
  // solo participants — they shouldn't accidentally deep-link there.
  const desiredTab = parseTabParam(searchParams.get("tab"), "home");
  const initialTab: WorkspaceTab =
    desiredTab === "team" && hackathon.participationType === "solo" ? "home" : desiredTab;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);

  // Gate the workspace by application status. Backend already 403s every
  // workspace endpoint for non-accepted participants, but we render a clean
  // status screen here so the participant gets a clear explanation instead of
  // a wall of failing tabs.
  if (hackathon.applicationStatus !== "accepted") {
    const isPending = hackathon.applicationStatus === "pending";
    return (
      <div className="min-h-screen bg-[#f7f7f6] flex flex-col">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/participant/workspace")}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  {hackathon.name}
                </h1>
                <p className="text-sm text-gray-500">{hackathon.organizer}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: isPending ? "#fffbeb" : "#fef2f2" }}
            >
              {isPending ? (
                <Clock className="w-8 h-8" style={{ color: "#f59e0b" }} />
              ) : (
                <X className="w-8 h-8" style={{ color: "#ef4444" }} />
              )}
            </div>
            <h2 className="text-gray-900 text-lg mb-2" style={{ fontWeight: 700 }}>
              {isPending ? "طلبك قيد المراجعة" : "تم رفض طلبك"}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {isPending
                ? "طلب مشاركتك قيد المراجعة من قِبل المنظم. ستتلقى إيميلاً فور اتخاذ القرار."
                : "نأسف، لم يتم قبول طلبك للمشاركة في هذا الهاكاثون. نشكرك على اهتمامك ونتمنى لك التوفيق في الفعاليات القادمة."}
            </p>
            <button
              onClick={() => navigate("/participant/workspace")}
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
              style={{ fontWeight: 600 }}
            >
              العودة لقائمة الهاكاثونات
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Real badge counts per tab
  const [counts, setCounts] = useState<Record<WorkspaceTab, number>>({
    home: 0,
    team: 0,
    submission: 0,
    evaluations: 0,
  });
  // True only after counts have been loaded from the API (not initial zeros)
  const [countsLoaded, setCountsLoaded] = useState(false);

  // Last count the user has seen per tab — persisted in localStorage
  const [seenCounts, setSeenCounts] = useState<Partial<Record<WorkspaceTab, number>>>(() =>
    loadSeenCounts(hackathon.id)
  );

  const handleTabChange = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    // Note: seen-counts are updated in the effect below (depends on activeTab + counts)
    // to avoid saving a stale value if the tab is clicked before the API responds.
  };

  // Fetch real counts for each tab in parallel
  useEffect(() => {
    const hid = hackathon.id;
    let cancelled = false;

    interface TeamResp { team: { members: unknown[] } | null }
    interface SubmissionResp { files: unknown[] }
    interface EvalResp { items: unknown[] }

    Promise.allSettled([
      apiGet<TeamResp>(`/participants/hackathons/${hid}/my-team`),
      apiGet<SubmissionResp>(`/participants/hackathons/${hid}/submission`),
      apiGet<EvalResp>(`/participants/hackathons/${hid}/evaluations`),
    ]).then((results) => {
      if (cancelled) return;
      const next: Record<WorkspaceTab, number> = {
        home: 0, team: 0, submission: 0, evaluations: 0,
      };

      // Team: number of members (if a team exists)
      if (results[0].status === 'fulfilled') {
        next.team = results[0].value.team?.members.length ?? 0;
      }

      // Submission: number of uploaded files
      if (results[1].status === 'fulfilled') {
        next.submission = results[1].value.files.length;
      }

      // Evaluations: number of published evaluations
      if (results[2].status === 'fulfilled') {
        next.evaluations = results[2].value.items.length;
      }

      setCounts(next);
      setCountsLoaded(true);
    });

    return () => { cancelled = true; };
  }, [hackathon.id]);

  // Sync seen-counts after counts arrive from the API:
  //   1) Active tab: seen = current count (user is viewing it, so it's "seen")
  //   2) Other tabs: clamp seen down to count if it exceeds (e.g., a file was deleted)
  useEffect(() => {
    if (!countsLoaded) return;
    setSeenCounts((prev) => {
      let changed = false;
      const next = { ...prev };

      // Active tab: sync seen with current count
      if (next[activeTab] !== counts[activeTab]) {
        next[activeTab] = counts[activeTab];
        changed = true;
      }

      // Other tabs: clamp seen down if higher than count
      (Object.keys(counts) as WorkspaceTab[]).forEach((tab) => {
        if (tab === activeTab) return;
        const seen = next[tab];
        if (seen !== undefined && seen > counts[tab]) {
          next[tab] = counts[tab];
          changed = true;
        }
      });

      if (changed) saveSeenCounts(hackathon.id, next);
      return changed ? next : prev;
    });
  }, [counts, countsLoaded, activeTab, hackathon.id]);

  return (
    <div className="min-h-screen bg-[#f7f7f6]">
      {/* ═══ Hero Section — same layout as organizer's preview ═══ */}
      <div className="relative overflow-hidden h-72">
        {/* Background — organizer's branding */}
        <HackathonCover branding={hackathon.branding} id={hackathon.id} />

        {/* Top bar: back button (right in RTL) + type/tags chips */}
        <div className="absolute top-6 right-4 sm:right-8 left-4 sm:left-8 flex items-start justify-between gap-4 z-10">
          <button
            onClick={() => navigate("/participant/workspace")}
            className="flex items-center gap-2 text-white/90 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
            العودة لمساحات العمل
          </button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {hackathon.tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs"
                style={{ fontWeight: 600 }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom info: logo + (title + organizer · location) */}
        <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/70 to-transparent px-4 sm:px-8 py-6 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            {(() => {
              const b = hackathon.branding;
              if (b?.logoMode === 'upload' && b.logoUploadDataUrl) {
                return (
                  <div className="w-14 h-14 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={b.logoUploadDataUrl} alt="" className="w-full h-full object-cover rounded-md" />
                  </div>
                );
              }
              if (b?.logoMode === 'pattern' && b.logoPattern) {
                return (
                  <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <LogoPattern pattern={b.logoPattern} colorPalette={b.colorPalette || 'red'} />
                  </div>
                );
              }
              return null;
            })()}
            <div className="flex-1 min-w-0">
              <h1
                className="text-white mb-0.5 truncate"
                style={{ fontWeight: 700, fontSize: "clamp(1.25rem, 3vw, 1.75rem)", lineHeight: 1.3 }}
              >
                {hackathon.name}
              </h1>
              <div className="flex items-center gap-3 text-white/85 text-sm flex-wrap">
                <span>{hackathon.organizer}</span>
                <span className="text-white/40">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {hackathon.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Body ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* ── Sidebar Cards ── */}
          <div className="lg:col-span-1 space-y-3 order-2 lg:order-1">
            {/* Hide the Team tab entirely for solo participants — no team
                exists, so the section has nothing to show. */}
            {sidebarCards
              .filter((card) => !(card.tab === "team" && hackathon.participationType === "solo"))
              .map((card) => {
              const Icon = card.icon;
              const isActive = activeTab === card.tab;
              const realCount = counts[card.tab];
              const seen = seenCounts[card.tab] ?? 0;
              // Show badge only when there are new items the user hasn't seen yet
              const showBadge = realCount > seen;
              return (
                <button
                  key={card.tab}
                  onClick={() => handleTabChange(card.tab)}
                  className="w-full text-right rounded-2xl p-4 transition-all hover:shadow-md group"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${card.color}15 0%, ${card.color}08 100%)`
                      : "#fff",
                    border: isActive ? `2px solid ${card.color}40` : "1px solid #f3f4f6",
                    transform: isActive ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: card.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                          {card.label}
                        </p>
                        {showBadge && (
                          <span
                            className="text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: card.color, fontSize: "0.6rem", fontWeight: 700 }}
                          >
                            {realCount}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400" style={{ fontSize: "0.68rem" }}>
                        {card.desc}
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {activeTab === "home" && <HomeTab hackathon={hackathon} />}
            {activeTab === "team" && <TeamTab hackathonId={hackathon.id} hackathonHasTeam={hackathon.hasTeam} />}
            {activeTab === "submission" && <SubmissionTab hackathonId={hackathon.id} />}
            {activeTab === "evaluations" && <EvaluationsTab hackathonId={hackathon.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Home
// ═══════════════════════════════════════════════════════════

/**
 * Picks the earliest hackathon date that's still in the future. The countdown
 * in the home tab targets this so the participant always sees "time until the
 * next thing happens" instead of being stuck on the submission deadline.
 * Returns null when every milestone has passed (the hackathon is over).
 *
 * The labels include their own preposition ("لانتهاء", "لبدء", …) so they slot
 * straight into "الوقت المتبقي {label}" — Arabic adds the prefix differently
 * depending on the noun, so this keeps it readable instead of doing string
 * concatenation gymnastics at the call site.
 */
function getNextHackathonMilestone(
  h: UiMyHackathon,
): { label: string; date: number } | null {
  const now = Date.now();
  const ms = (iso: string | null): number | null => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : null;
  };
  const candidates = [
    { label: "لانتهاء التسجيل", date: ms(h.registrationDeadlineRaw) },
    { label: "لبدء الهاكاثون", date: ms(h.hackathonStartDateRaw) },
    { label: "لنهاية الهاكاثون", date: ms(h.hackathonEndDateRaw) },
    { label: "للتسليم النهائي", date: ms(h.submissionDeadlineRaw) },
    { label: "لإعلان النتائج", date: ms(h.winnersDateRaw) },
  ];
  const upcoming = candidates
    .filter((m): m is { label: string; date: number } => m.date !== null && m.date > now)
    .sort((a, b) => a.date - b.date);
  return upcoming.length > 0 ? upcoming[0] : null;
}

function diffParts(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function HomeTab({ hackathon }: { hackathon: UiMyHackathon }) {
  const initial = getNextHackathonMilestone(hackathon);
  const [milestone, setMilestone] = useState(initial);
  const [timeLeft, setTimeLeft] = useState(() =>
    initial ? diffParts(initial.date, Date.now()) : { days: 0, hours: 0, minutes: 0, seconds: 0 },
  );

  useEffect(() => {
    // Recompute from "now" each tick so the display can't drift over time, and
    // re-pick the next milestone when one expires (countdown rolls forward).
    const tick = () => {
      const next = getNextHackathonMilestone(hackathon);
      setMilestone(next);
      setTimeLeft(next ? diffParts(next.date, Date.now()) : { days: 0, hours: 0, minutes: 0, seconds: 0 });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hackathon]);

  return (
    <div className="space-y-6">
      {/* About Hackathon */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5" style={{ color: "#6366f1" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            عن الهاكاثون
          </h2>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-5">
          {hackathon.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(() => {
            const phase = computeCurrentPhase(hackathon);
            return [
              { label: "المسار", value: hackathon.track, color: "#6366f1" },
              { label: "الحالة", value: phase.value, color: phase.color },
              {
                label: "نوع المشاركة",
                value: hackathon.participationType === "solo"
                  ? "فردي"
                  : hackathon.teamMin === hackathon.teamMax
                  ? `فريق (${hackathon.teamMax} أعضاء)`
                  : `فريق (${hackathon.teamMin}–${hackathon.teamMax} أعضاء)`,
                color: "#e35654",
              },
            ];
          })().map((info, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-gray-400 text-xs mb-1">{info.label}</p>
              <p style={{ color: info.color, fontWeight: 600, fontSize: "0.82rem" }}>{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown Timer — target follows the next milestone on the timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" style={{ color: "#e35654" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {milestone ? `الوقت المتبقي ${milestone.label}` : "انتهى الهاكاثون"}
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: timeLeft.days.toString().padStart(2, "0"), label: "أيام" },
            { value: timeLeft.hours.toString().padStart(2, "0"), label: "ساعة" },
            { value: timeLeft.minutes.toString().padStart(2, "0"), label: "دقيقة" },
            { value: timeLeft.seconds.toString().padStart(2, "0"), label: "ثانية" },
          ].map((t, i) => (
            <div
              key={i}
              className="text-center p-4 rounded-xl"
              style={{ background: "linear-gradient(135deg, #fef2f2 0%, #fff 100%)", border: "1px solid rgba(227,86,84,0.15)" }}
            >
              <p style={{ fontWeight: 800, fontSize: "1.5rem", color: "#e35654" }}>{t.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="w-5 h-5" style={{ color: "#f59e0b" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            الجدول الزمني
          </h2>
        </div>

        <div className="space-y-3">
          {hackathon.timeline.map((phase, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: phase.status === "completed" ? "#f0fdf4" : phase.status === "active" ? "#fef2f2" : "#f9fafb",
                  border: `2px solid ${phase.color}`,
                }}
              >
                {phase.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: phase.color }} />
                ) : phase.status === "active" ? (
                  <Target className="w-4 h-4" style={{ color: phase.color }} />
                ) : (
                  <Flag className="w-4 h-4" style={{ color: phase.color }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className="text-gray-900 text-sm"
                    style={{ fontWeight: phase.status === "active" ? 700 : 600 }}
                  >
                    {phase.phase}
                  </h3>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{
                      background: phase.status === "completed" ? "#f0fdf4" : phase.status === "active" ? "#fef2f2" : "#f9fafb",
                      color: phase.color,
                      fontWeight: 600,
                    }}
                  >
                    {phase.status === "completed" ? "مكتمل" : phase.status === "active" ? "حالياً" : "قادم"}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">{phase.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Team
// ═══════════════════════════════════════════════════════════
interface ApiTeamDetail {
  team: {
    id: number;
    name: string;
    leaderId: number;
    minMembers: number;
    maxMembers: number;
    registrationEndDate: string | null;
    members: Array<{
      id: number;
      fullName: string;
      email: string;
      isLeader: boolean;
      isMe: boolean;
    }>;
  } | null;
  participationType: "solo" | "team";
  teamMethod: "ai" | "manual" | null;
}

interface ApiTeamInvite {
  id: number;
  email: string;
  status: "pending" | "accepted" | "declined" | "expired";
  invitedAt: string;
  expiresAt: string | null;
  respondedAt: string | null;
}

interface ApiTeamInvitesResponse {
  items: ApiTeamInvite[];
  isLeader: boolean;
  teamId: number;
}

const TEAM_MEMBER_COLORS = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"];

const INVITE_STATUS_STYLES: Record<ApiTeamInvite["status"], { label: string; bg: string; color: string }> = {
  pending: { label: "قيد الانتظار", bg: "#fef3c7", color: "#92400e" },
  accepted: { label: "مقبولة", bg: "#dcfce7", color: "#166534" },
  declined: { label: "مرفوضة", bg: "#fee2e2", color: "#991b1b" },
  expired: { label: "منتهية", bg: "#e5e7eb", color: "#374151" },
};

function InviteStatusBadge({ status }: { status: ApiTeamInvite["status"] }) {
  const s = INVITE_STATUS_STYLES[status];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, fontWeight: 600 }}
    >
      {s.label}
    </span>
  );
}

function formatTeamDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Read-only view of the team inside the post-acceptance workspace. All team
// management (add/cancel/resend invites, leave, transfer leadership) lives in
// ManageTeamDialog, opened from the WorkspacesList card while registration is
// still open. Once registration closes, the team is final and only the chat
// remains active.
function TeamTab({ hackathonId, hackathonHasTeam }: { hackathonId: number; hackathonHasTeam: boolean }) {
  const navigate = useNavigate();
  const [data, setData] = useState<ApiTeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<ApiTeamDetail>(`/participants/hackathons/${hackathonId}/my-team`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "فشل تحميل بيانات الفريق");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hackathonId, hackathonHasTeam]);

  if (loading) {
    return <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 text-sm">جاري تحميل بيانات الفريق...</div>;
  }
  if (error) {
    return <div className="bg-white rounded-2xl border border-red-100 p-6 text-center text-red-500 text-sm">{error}</div>;
  }

  // Solo participation — no team
  if (data?.participationType === "solo") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>
          أنت مسجّل كمشارك فردي
        </p>
        <p className="text-gray-400 text-xs mt-1">
          لا يوجد فريق لهذه المشاركة.
        </p>
      </div>
    );
  }

  // Team mode but no team yet
  if (!data?.team) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 bg-amber-50/30 p-12 text-center">
        <Users className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>
          ما عندك فريق بعد
        </p>
        <p className="text-gray-500 text-xs mt-1 mb-4">
          ابحث عن فريق متاح للانضمام، أو اطلب من قائد فريق إضافتك.
        </p>
        <button
          onClick={() => navigate("/participant/matchmaking", { state: { hackathonId } })}
          className="px-5 py-2.5 rounded-xl bg-[#6366f1] text-white text-sm hover:bg-[#4f51d4] transition-colors"
          style={{ fontWeight: 600 }}
        >
          ابحث عن فريق
        </button>
      </div>
    );
  }

  const team = data.team;
  const members = team.members;

  return (
    <div className="space-y-6">
      {/* Team Members (read-only post-acceptance view) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#10b981" }} />
            <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{team.name}</h2>
          </div>
          <span className="text-gray-400 text-xs">
            {members.length} / {team.maxMembers} أعضاء
          </span>
        </div>

        <div className="grid gap-4">
          {members.map((member, i) => {
            const color = TEAM_MEMBER_COLORS[i % TEAM_MEMBER_COLORS.length];
            const initial = member.fullName.charAt(0) || "؟";
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: color, fontWeight: 700, fontSize: "1.1rem" }}
                >
                  {initial}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                      {member.fullName}
                      {member.isMe && (
                        <span className="text-xs text-gray-400 mr-2" style={{ fontWeight: 400 }}>
                          (أنت)
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-gray-400 text-xs" dir="ltr">{member.email}</p>
                </div>

                {member.isLeader && (
                  <span
                    className="text-xs px-3 py-1 rounded-full flex-shrink-0"
                    style={{ background: "#fef2f2", color: "#e35654", fontWeight: 600 }}
                  >
                    قائد الفريق
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Chat */}
      <TeamChat hackathonId={hackathonId} memberColors={members.map((m, i) => ({ id: m.id, color: TEAM_MEMBER_COLORS[i % TEAM_MEMBER_COLORS.length] }))} />
    </div>
  );
}

// ─── Add Invites Dialog ──────────────────────────────────
function AddInvitesDialog({
  hackathonId,
  maxNewInvites,
  onClose,
  onSuccess,
}: {
  hackathonId: number;
  maxNewInvites: number;
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEmail = () => {
    const e = input.trim().toLowerCase();
    if (!e) return;
    if (emails.includes(e)) {
      setInput("");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("صيغة الإيميل غير صحيحة");
      return;
    }
    if (emails.length >= maxNewInvites) {
      setError(`الحد الأقصى ${maxNewInvites} دعوة في هذا الوقت`);
      return;
    }
    setEmails([...emails, e]);
    setInput("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (emails.length === 0) {
      setError("أضف إيميل واحد على الأقل");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(`/participants/hackathons/${hackathonId}/team-invites`, { inviteEmails: emails });
      onSuccess(emails.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل إرسال الدعوات");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-gray-900" style={{ fontWeight: 700 }}>إضافة دعوات جديدة</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-gray-500">
            أضف الإيميلات الي تبغى ترسل لها دعوات. لديك {maxNewInvites} مقعد متاح.
          </p>

          <div className="flex gap-2">
            <input
              type="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
              placeholder="example@email.com"
              dir="ltr"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#6366f1]"
            />
            <button
              onClick={addEmail}
              className="px-3 py-2 rounded-lg bg-[#6366f1] text-white text-sm"
              style={{ fontWeight: 600 }}
            >
              إضافة
            </button>
          </div>

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {emails.map((em) => (
                <span
                  key={em}
                  className="flex items-center gap-1 bg-[#eef2ff] text-[#6366f1] px-2 py-0.5 rounded-full text-xs"
                  dir="ltr"
                >
                  {em}
                  <button
                    onClick={() => setEmails(emails.filter((e) => e !== em))}
                    className="ml-0.5 hover:text-[#4f51d4]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <p className="text-red-600 text-xs">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || emails.length === 0}
            className="px-5 py-2 rounded-xl bg-[#6366f1] text-white text-sm hover:bg-[#4f51d4] disabled:opacity-50 flex items-center gap-2"
            style={{ fontWeight: 600 }}
          >
            {submitting ? "جاري الإرسال..." : `إرسال ${emails.length || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer Leadership Dialog ──────────────────────────
function TransferLeadershipDialog({
  hackathonId,
  members,
  onClose,
  onSuccess,
}: {
  hackathonId: number;
  members: Array<{ id: number; fullName: string; email: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(`/participants/hackathons/${hackathonId}/transfer-leadership`, {
        newLeaderId: selectedId,
      });
      onSuccess();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل نقل القيادة");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-gray-900" style={{ fontWeight: 700 }}>نقل قيادة الفريق</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-gray-500 mb-2">
            اختر العضو الذي سيصبح القائد الجديد. سيكون له صلاحية إدارة الفريق بعد النقل.
          </p>

          {members.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-6">لا يوجد أعضاء آخرون</p>
          ) : (
            members.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedId === m.id ? "border-[#e35654] bg-[#fef2f2]" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="newLeader"
                  checked={selectedId === m.id}
                  onChange={() => setSelectedId(m.id)}
                  className="accent-[#e35654]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{m.fullName}</p>
                  <p className="text-gray-400 text-xs" dir="ltr">{m.email}</p>
                </div>
              </label>
            ))
          )}

          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedId}
            className="px-5 py-2 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            {submitting ? "جاري النقل..." : "نقل القيادة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog (destructive actions) ────────────────
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5">
          <p className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>{title}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-white text-sm disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#e35654] hover:bg-[#cc4a48]"
            }`}
            style={{ fontWeight: 600 }}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Team Dialog (the single place for team management) ──────────────
// Opened from the WorkspacesList card during the registration window. Holds
// everything that used to live in TeamTab: members, invites, leave/withdraw/
// transfer-leadership actions. The workspace's TeamTab is read-only after
// registration closes, so no UI is duplicated.
function ManageTeamDialog({
  hackathonId,
  onClose,
  onChanged,
}: {
  hackathonId: number;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const navigate = useNavigate();
  const [data, setData] = useState<ApiTeamDetail | null>(null);
  const [invites, setInvites] = useState<ApiTeamInvitesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddInvites, setShowAddInvites] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    | { kind: "leave" }
    | { kind: "withdraw_lone_leader" }
    | { kind: "cancel_invite"; inviteId: number; email: string }
    | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const d = await apiGet<ApiTeamDetail>(`/participants/hackathons/${hackathonId}/my-team`);
      setData(d);
      if (d.teamMethod === "manual" && d.team) {
        const inv = await apiGet<ApiTeamInvitesResponse>(
          `/participants/hackathons/${hackathonId}/team-invites`,
        );
        setInvites(inv);
      } else {
        setInvites(null);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل تحميل بيانات الفريق");
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAll().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathonId]);

  const refresh = async () => {
    await fetchAll();
    onChanged?.();
  };

  const handleCancelInvite = async (inviteId: number) => {
    setActionLoading(true);
    try {
      await apiDelete(`/participants/team-invites/${inviteId}`);
      toast.success("تم إلغاء الدعوة");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "فشل إلغاء الدعوة");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleResendInvite = async (inviteId: number) => {
    setActionLoading(true);
    try {
      await apiPost(`/participants/team-invites/${inviteId}/resend`, {});
      toast.success("تم إعادة إرسال الدعوة");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "فشل إعادة إرسال الدعوة");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await apiDelete(`/participants/hackathons/${hackathonId}/my-registration`);
      toast.success("غادرت الفريق");
      onChanged?.();
      onClose();
      navigate("/participant/hackathons");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "فشل الانسحاب");
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const renderBody = () => {
    if (loading) {
      return <p className="text-center text-gray-500 text-sm py-12">جاري تحميل بيانات الفريق...</p>;
    }
    if (error) {
      return <p className="text-center text-red-500 text-sm py-12">{error}</p>;
    }
    if (data?.participationType === "solo") {
      return (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>
            أنت مسجّل كمشارك فردي
          </p>
          <p className="text-gray-400 text-xs mt-1">لا يوجد فريق لهذه المشاركة.</p>
        </div>
      );
    }
    if (!data?.team) {
      return (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>ما عندك فريق بعد</p>
          <p className="text-gray-500 text-xs mt-1">ابحث عن فريق أو اطلب من قائد فريق إضافتك.</p>
        </div>
      );
    }

    const team = data.team;
    const members = team.members;
    const isLeader = members.find((m) => m.isMe)?.isLeader ?? false;
    const isManual = data.teamMethod === "manual";
    const regStillOpen = team.registrationEndDate
      ? new Date(team.registrationEndDate).getTime() > Date.now()
      : false;
    const acceptedCount = members.length;
    const pendingCount = invites?.items.filter((i) => i.status === "pending").length ?? 0;
    const slotsLeft = team.maxMembers - (acceptedCount + pendingCount);
    const belowMin = acceptedCount < team.minMembers;

    return (
      <div className="space-y-6">
        {/* Members section */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "#10b981" }} />
              <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{team.name}</h3>
            </div>
            <span className="text-gray-400 text-xs">
              {acceptedCount} / {team.maxMembers} أعضاء
            </span>
          </div>

          {belowMin && regStillOpen && isManual && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                عدد أعضاء فريقك {acceptedCount}، والحد الأدنى للمشاركة {team.minMembers} أعضاء. أكمل عدد الأعضاء قبل {formatTeamDate(team.registrationEndDate)}، وإلا سيُستبعد فريقك من الهاكاثون تلقائياً.
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {members.map((member, i) => {
              const color = TEAM_MEMBER_COLORS[i % TEAM_MEMBER_COLORS.length];
              const initial = member.fullName.charAt(0) || "؟";
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: color, fontWeight: 700 }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                      {member.fullName}
                      {member.isMe && (
                        <span className="text-xs text-gray-400 mr-2" style={{ fontWeight: 400 }}>
                          (أنت)
                        </span>
                      )}
                    </p>
                    <p className="text-gray-400 text-xs" dir="ltr">{member.email}</p>
                  </div>
                  {member.isLeader && (
                    <span
                      className="text-xs px-3 py-1 rounded-full flex-shrink-0"
                      style={{ background: "#fef2f2", color: "#e35654", fontWeight: 600 }}
                    >
                      قائد
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {regStillOpen && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
              {isLeader && acceptedCount > 1 && (
                <button
                  onClick={() => setShowTransfer(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs hover:bg-gray-50 disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  نقل القيادة
                </button>
              )}
              {isLeader && acceptedCount === 1 ? (
                <button
                  onClick={() => setConfirmAction({ kind: "withdraw_lone_leader" })}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs hover:bg-red-50 disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف الفريق والانسحاب
                </button>
              ) : !isLeader ? (
                <button
                  onClick={() => setConfirmAction({ kind: "leave" })}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs hover:bg-red-50 disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  غادر الفريق
                </button>
              ) : null}
            </div>
          )}
        </section>

        {/* Invites section (manual only) */}
        {isManual && invites && (
          <section className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" style={{ color: "#6366f1" }} />
                <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
                  الدعوات <span className="text-gray-400 text-xs">({invites.items.length})</span>
                </h3>
              </div>
              {isLeader && regStillOpen && slotsLeft > 0 && (
                <button
                  onClick={() => setShowAddInvites(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6366f1] text-white text-xs hover:bg-[#4f51d4] disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  دعوة جديدة
                </button>
              )}
            </div>

            {invites.items.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">لا توجد دعوات</p>
            ) : (
              <div className="space-y-2">
                {invites.items.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 flex-wrap"
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-gray-700 text-sm truncate" dir="ltr" style={{ fontWeight: 500 }}>
                        {inv.email}
                      </span>
                      <InviteStatusBadge status={inv.status} />
                    </div>
                    {isLeader && regStillOpen && (
                      <div className="flex items-center gap-1.5">
                        {inv.status === "pending" && (
                          <button
                            onClick={() => setConfirmAction({ kind: "cancel_invite", inviteId: inv.id, email: inv.email })}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 disabled:opacity-50"
                            style={{ fontWeight: 600 }}
                          >
                            <X className="w-3 h-3" />
                            إلغاء
                          </button>
                        )}
                        {inv.status === "expired" && (
                          <button
                            onClick={() => handleResendInvite(inv.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-[#6366f1] text-[#6366f1] text-xs hover:bg-[#eef2ff] disabled:opacity-50"
                            style={{ fontWeight: 600 }}
                          >
                            <RefreshCw className="w-3 h-3" />
                            إعادة
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* When registration is closed, show a hint that the team is locked. */}
        {!regStillOpen && (
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 text-xs">
            انتهى وقت التسجيل — الفريق مغلق ولا يمكن تعديل الأعضاء أو الدعوات.
          </div>
        )}
      </div>
    );
  };

  // Pull the manual-only members list once so the transfer modal has it.
  const transferCandidates = data?.team?.members.filter((m) => !m.isMe).map((m) => ({
    id: m.id,
    fullName: m.fullName,
    email: m.email,
  })) ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <p className="text-gray-900" style={{ fontWeight: 700, fontSize: "1rem" }}>
            إدارة الفريق
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">{renderBody()}</div>
      </div>

      {/* Nested action modals — rendered on top of the management modal. */}
      {showAddInvites && data?.team && (
        <AddInvitesDialog
          hackathonId={hackathonId}
          maxNewInvites={data.team.maxMembers - (data.team.members.length + (invites?.items.filter((i) => i.status === "pending").length ?? 0))}
          onClose={() => setShowAddInvites(false)}
          onSuccess={async (count) => {
            setShowAddInvites(false);
            toast.success(`تم إرسال ${count} دعوة`);
            await refresh();
          }}
        />
      )}

      {showTransfer && (
        <TransferLeadershipDialog
          hackathonId={hackathonId}
          members={transferCandidates}
          onClose={() => setShowTransfer(false)}
          onSuccess={async () => {
            setShowTransfer(false);
            toast.success("تم نقل القيادة");
            await refresh();
          }}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.kind === "leave"
              ? "مغادرة الفريق"
              : confirmAction.kind === "withdraw_lone_leader"
              ? "حذف الفريق والانسحاب"
              : "إلغاء الدعوة"
          }
          message={
            confirmAction.kind === "leave"
              ? "هل أنت متأكد من مغادرة الفريق؟ سيتم حذف تسجيلك في هذا الهاكاثون."
              : confirmAction.kind === "withdraw_lone_leader"
              ? "أنت القائد الوحيد. سيُحذف الفريق وكل دعواته المعلّقة، ويُلغى تسجيلك في الهاكاثون."
              : `إلغاء الدعوة المرسلة إلى ${confirmAction.email}؟`
          }
          confirmLabel={
            confirmAction.kind === "leave"
              ? "مغادرة"
              : confirmAction.kind === "withdraw_lone_leader"
              ? "حذف وانسحاب"
              : "إلغاء الدعوة"
          }
          danger
          loading={actionLoading}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.kind === "leave" || confirmAction.kind === "withdraw_lone_leader") {
              handleLeave();
            } else {
              handleCancelInvite(confirmAction.inviteId);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Team Chat Component ──────────────────────────────────
function TeamChat({
  hackathonId,
  memberColors,
}: {
  hackathonId: number;
  memberColors: { id: number; color: string }[];
}) {
  const [messages, setMessages] = useState<ApiTeamMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const colorFor = (memberId: number): string => {
    const found = memberColors.find((m) => m.id === memberId);
    return found?.color ?? "#6366f1";
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ar-SA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  };

  const fetchMessages = async (silent = false) => {
    try {
      const data = await apiGet<{ items: ApiTeamMessage[] }>(
        `/participants/hackathons/${hackathonId}/team-messages`
      );
      setMessages(data.items);
      if (!silent) setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof ApiError ? e.message : "فشل تحميل الرسائل");
    }
  };

  // Initial load + poll every 5 seconds
  useEffect(() => {
    fetchMessages();
    const t = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathonId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await apiPost(`/participants/hackathons/${hackathonId}/team-messages`, { text });
      setDraft("");
      await fetchMessages();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-5 h-5" style={{ color: "#6366f1" }} />
        <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>محادثة الفريق</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            لا توجد رسائل بعد — ابدأ المحادثة مع فريقك
          </p>
        ) : (
          messages.map((msg) => {
            const initial = msg.senderName.charAt(0) || "؟";
            const color = colorFor(msg.senderId);
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.isMine ? "flex-row-reverse" : ""}`}>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                  style={{ background: color, fontWeight: 700 }}
                >
                  {initial}
                </div>
                <div className={`flex-1 ${msg.isMine ? "text-left" : ""}`}>
                  <div className={`flex items-center gap-2 mb-1 ${msg.isMine ? "justify-end" : ""}`}>
                    <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
                      {msg.isMine ? "أنت" : msg.senderName}
                    </p>
                    <span className="text-gray-300 text-xs">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div
                    className="inline-block px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap break-words max-w-[80%]"
                    style={{
                      background: msg.isMine ? "#e35654" : "#f9fafb",
                      color: msg.isMine ? "#fff" : "#374151",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs text-center mb-2">{error}</p>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <input
          type="text"
          placeholder="اكتب رسالتك..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sending}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] text-sm disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-colors disabled:opacity-50"
          style={{ background: "#e35654" }}
          title="إرسال"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Submission
// ═══════════════════════════════════════════════════════════

// Maps organizer submissionFields keys to actual editable DB columns.
// Only the four entries here render as inputs; the remaining keys
// (video / presentation / images) are file-typed and handled by the
// uploader inside the same unified form below.
const PROJECT_TEXT_FIELDS: Record<
  string,
  {
    apiField: 'projectName' | 'projectDescription' | 'repoUrl' | 'demoUrl';
    type: 'text' | 'textarea' | 'url';
    label: string;
    placeholder: string;
  }
> = {
  title:  { apiField: 'projectName',        type: 'text',     label: 'عنوان المشروع',         placeholder: 'اكتب اسم المشروع' },
  desc:   { apiField: 'projectDescription', type: 'textarea', label: 'وصف المشروع',           placeholder: 'اشرح فكرة المشروع باختصار' },
  github: { apiField: 'repoUrl',            type: 'url',      label: 'رابط GitHub',          placeholder: 'https://github.com/...' },
  demo:   { apiField: 'demoUrl',            type: 'url',      label: 'رابط النسخة التجريبية', placeholder: 'https://...' },
};

export interface ProjectFormState {
  projectName: string;
  projectDescription: string;
  repoUrl: string;
  demoUrl: string;
}

// Returns a per-field readiness snapshot used by:
//   (a) the dynamic checklist in the requirements section (informational +
//       progress indicator in one), and
//   (b) the submit button's enabled state (allFilled = can submit).
// Text/URL fields are read from local form state (instant feedback while
// typing); file-type fields are checked against the server's file list —
// since we can't distinguish "this PDF is the presentation" from "this PDF
// is the video", any uploaded file marks all file-type entries as filled.
export function computeSubmissionFieldStates(
  data: ApiSubmission,
  form: ProjectFormState,
): Array<{ id: string; label: string; isFilled: boolean }> {
  return data.submissionFields.map((fId) => {
    const label = SUBMISSION_FIELD_LABELS[fId] ?? fId;
    const textField = PROJECT_TEXT_FIELDS[fId];
    if (textField) {
      const val = form[textField.apiField];
      return { id: fId, label, isFilled: !!(val && val.trim() !== '') };
    }
    // File-type fields (video / presentation / images) — match by MIME prefix
    // so each required type is verified independently. The previous version
    // treated any single uploaded file as satisfying every file requirement,
    // which let the user submit half-empty when the organizer asked for
    // multiple file types.
    const isFilled = data.files.some((f) => fileMatchesField(fId, f.mimeType, f.name));
    return { id: fId, label, isFilled };
  });
}

// Heuristic: decide whether an uploaded file qualifies for a specific
// submission field. MIME type is the primary signal; the filename extension
// is a fallback for older browsers that don't send a useful MIME.
function fileMatchesField(fieldId: string, mime: string | null, name: string): boolean {
  const m = (mime ?? "").toLowerCase();
  const n = name.toLowerCase();
  if (fieldId === "video") {
    return m.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi)$/.test(n);
  }
  if (fieldId === "images") {
    return m.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(n);
  }
  if (fieldId === "presentation") {
    return (
      m === "application/pdf" ||
      m.includes("presentation") ||
      m.includes("powerpoint") ||
      /\.(pdf|pptx?|key)$/.test(n)
    );
  }
  // Unknown file field — any file counts (graceful fallback).
  return true;
}

function SubmissionTab({ hackathonId }: { hackathonId: number }) {
  const [data, setData] = useState<ApiSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Form is collapsed by default — the participant clicks the CTA to open it.
  // This makes "submit" feel like a deliberate task rather than always-visible
  // inputs. After a successful send the form auto-collapses and the CTA flips
  // to "view/edit submission".
  const [formOpen, setFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata form state lives at this level so the single submit handler
  // can save inputs + call the confirm endpoint in one click. Hydrated
  // once from server data; we don't re-sync on refetch to preserve
  // unsaved typing.
  const [form, setForm] = useState<ProjectFormState>({
    projectName: '',
    projectDescription: '',
    repoUrl: '',
    demoUrl: '',
  });
  const formInitialized = useRef(false);

  const refetch = async () => {
    try {
      const fresh = await apiGet<ApiSubmission>(`/participants/hackathons/${hackathonId}/submission`);
      setData(fresh);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل تحميل بيانات التسليم");
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiGet<ApiSubmission>(`/participants/hackathons/${hackathonId}/submission`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل بيانات التسليم");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hackathonId]);

  useEffect(() => {
    if (data && !formInitialized.current) {
      setForm({
        projectName: data.projectName ?? '',
        projectDescription: data.projectDescription ?? '',
        repoUrl: data.repoUrl ?? '',
        demoUrl: data.demoUrl ?? '',
      });
      formInitialized.current = true;
    }
  }, [data]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        await apiUpload(`/participants/hackathons/${hackathonId}/submission/files`, file);
        uploaded++;
      }
      await refetch();
      toast.success(uploaded === 1 ? "تم رفع الملف بنجاح" : `تم رفع ${uploaded} ملفات بنجاح`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "فشل رفع الملف";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: number) => {
    try {
      await apiDelete(`/participants/hackathons/${hackathonId}/submission/files/${fileId}`);
      await refetch();
      toast.error("تم حذف الملف");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "فشل حذف الملف";
      setUploadError(msg);
      toast.error(msg);
    }
  };

  // One-shot submit action. Submission is final — no edits after, so this
  // handler is only ever called once per participant. Saves any pending
  // metadata changes, then fires the confirm endpoint which sets
  // TS_SubmittedAt and creates the in-app notification.
  const handleSubmit = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const fId of data.submissionFields) {
        const m = PROJECT_TEXT_FIELDS[fId];
        if (!m) continue;
        const current = form[m.apiField].trim();
        const original = (data[m.apiField] ?? '').trim();
        if (current !== original) {
          payload[m.apiField] = current || null;
        }
      }
      if (Object.keys(payload).length > 0) {
        await apiPut(`/participants/hackathons/${hackathonId}/submission`, payload);
      }
      await apiPost(`/participants/hackathons/${hackathonId}/submission/submit`, {});

      await refetch();
      // Collapse the form back to the CTA view so the participant lands on
      // their success state, not on the inputs they just submitted.
      setFormOpen(false);
      toast.success("تم إرسال المشروع");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "فشل الإرسال";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">جاري تحميل التسليم...</div>;
  }
  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-6 text-center text-red-500 text-sm">
        {error ?? "تعذّر تحميل التسليم"}
      </div>
    );
  }

  const maxBytes = data.maxFileSizeMb * 1024 * 1024;
  const windowState = computeSubmissionWindow(data);
  const canEdit = windowState === "open";
  const isSubmitted = data.submittedAt !== null;
  const fieldStates = computeSubmissionFieldStates(data, form);
  const allFilled = fieldStates.every((f) => f.isFilled);
  const fieldsToRender = data.submissionFields
    .filter((id) => id in PROJECT_TEXT_FIELDS)
    .map((id) => ({ id, ...PROJECT_TEXT_FIELDS[id] }));

  return (
    <div className="space-y-6">
      {/* Submission window banner — visible state changes the entire tab. */}
      {windowState === "before_start" && data.submissionStartDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-blue-900 text-sm" style={{ fontWeight: 700 }}>التسليم لم يبدأ بعد</p>
            <p className="text-blue-700 text-xs mt-1">
              يبدأ استقبال التسليمات في {formatDateAr(data.submissionStartDate)}.
            </p>
          </div>
        </div>
      )}
      {windowState === "open" && data.submissionDeadline && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-900 text-sm" style={{ fontWeight: 700 }}>التسليم متاح حالياً</p>
            <p className="text-green-700 text-xs mt-1">
              ارفع ملفاتك قبل إقفال التسليم في {formatDateAr(data.submissionDeadline)}.
            </p>
          </div>
        </div>
      )}
      {windowState === "closed" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-900 text-sm" style={{ fontWeight: 700 }}>انتهى موعد التسليم</p>
            <p className="text-red-700 text-xs mt-1">
              لا يمكن رفع ملفات أو تعديل البيانات بعد {formatDateAr(data.submissionDeadline)}.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks className="w-5 h-5" style={{ color: "#f59e0b" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>متطلبات التسليم</h2>
        </div>

        {/* Project briefing — neutral grey, not alert-coloured. */}
        {data.expectedProjectsDescription && (
          <div className="p-4 rounded-xl mb-5 bg-gray-50 border border-gray-100">
            <p className="text-gray-500 text-xs mb-2" style={{ fontWeight: 600 }}>
              نبذة عن المشاريع
            </p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {data.expectedProjectsDescription}
            </p>
          </div>
        )}

        {/* Deadline + max file size — compact informational chips, side by
            side. Icon containers use the section's amber accent via the
            ${color}15 opacity pattern (matches HomeTab info chips and the
            team-member cards) so the styling is consistent across tabs. */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {data.submissionDeadline && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: "#f59e0b15", color: "#f59e0b" }}>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs">موعد الإغلاق</p>
                <p className="text-gray-900 text-sm truncate" style={{ fontWeight: 600 }}>
                  {formatDateAr(data.submissionDeadline)}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: "#f59e0b15", color: "#f59e0b" }}>
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs">الحد الأقصى للملف</p>
              <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>
                {data.maxFileSizeMb} MB
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic submission checklist — informational + progress in one.
            Pending uses neutral grey (not amber, which read as warning). */}
        {fieldStates.length > 0 && (
          <div className="pt-5 mt-1 border-t border-gray-100 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>
                متطلبات الإرسال
              </p>
              <p className="text-gray-400 text-xs">
                {fieldStates.filter((f) => f.isFilled).length} من {fieldStates.length} مكتمل
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {fieldStates.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    f.isFilled
                      ? 'border-green-100 bg-green-50/40'
                      : 'border-gray-100 bg-gray-50/60'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: f.isFilled ? '#10b98115' : '#9ca3af15',
                      color: f.isFilled ? '#10b981' : '#9ca3af',
                    }}
                  >
                    {f.isFilled
                      ? <CheckCircle className="w-3.5 h-3.5" />
                      : <Circle      className="w-3.5 h-3.5" />}
                  </div>
                  <p className={`text-sm flex-1 ${f.isFilled ? 'text-gray-800' : 'text-gray-500'}`}>
                    {f.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions — kept amber but compact (no boxed rows) so it reads as
            a brief checklist rather than competing for attention. */}
        {data.requirements.length > 0 && (
          <div className="pt-5 border-t border-gray-100">
            <p className="text-gray-700 text-xs mb-3" style={{ fontWeight: 600 }}>
              شروط إضافية
            </p>
            <ul className="space-y-2">
              {data.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-amber-500 flex-shrink-0 leading-relaxed mt-0.5">•</span>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">{req}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.submissionFields.length === 0 && data.requirements.length === 0 && !data.submissionDeadline && !data.expectedProjectsDescription && (
          <p className="text-gray-400 text-sm text-center py-6">لم يحدّد المنظّم متطلبات بعد</p>
        )}
      </div>

      {/* Success banner — sits above the form so participants see
          confirmation before scrolling. The submission is final, so we
          surface that explicitly to set expectations. */}
      {isSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-900 text-sm" style={{ fontWeight: 700 }}>
              تم إرسال مشروعك بنجاح
            </p>
            <p className="text-green-700 text-xs mt-1">
              تاريخ التسليم: {formatDateTimeAr(data.submittedAt)}
            </p>
          </div>
        </div>
      )}

      {/* Collapsed CTA — the entry point. Form stays hidden until the
          participant clicks; after a successful send the form auto-collapses
          back to this same card and the CTA flips to "view/edit". */}
      {!formOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: isSubmitted ? "#6366f115" : "#10b98115" }}>
                <Upload className="w-5 h-5" style={{ color: isSubmitted ? "#6366f1" : "#10b981" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                  {isSubmitted ? "تسليمك مُرسَل" : "أرسل مشروعك"}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  {isSubmitted
                    ? "اضغط لعرض ما أرسلته"
                    : "أكمل البيانات وارفع الملفات لإرسال مشروعك"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFormOpen(true)}
              disabled={!canEdit && !isSubmitted}
              className="px-5 py-2.5 rounded-xl text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              style={{ background: isSubmitted ? "#6366f1" : "#10b981", fontWeight: 600 }}
            >
              {isSubmitted ? "عرض التسليم" : "إرسال المشروع"}
            </button>
          </div>
        </div>
      )}

      {/* Expanded form view — fills inputs and uploads when editable
          (pre-submission), purely a read-only summary after submission. */}
      {formOpen && (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" style={{ color: "#e35654" }} />
            <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {isSubmitted ? "عرض التسليم" : "تسليم المشروع"}
            </h2>
          </div>
          <button
            onClick={() => setFormOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text/URL inputs — only the ones the organizer requested */}
        {fieldsToRender.length > 0 && (
          <div className="space-y-4 mb-5">
            {fieldsToRender.map((f) => (
              <div key={f.id}>
                <label className="block text-gray-700 text-xs mb-2" style={{ fontWeight: 600 }}>
                  {f.label} <span className="text-red-500">*</span>
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={form[f.apiField]}
                    onChange={(e) => setForm({ ...form, [f.apiField]: e.target.value })}
                    disabled={!canEdit || submitting}
                    rows={4}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                ) : (
                  <input
                    type={f.type}
                    dir={f.type === 'url' ? 'ltr' : 'rtl'}
                    value={form[f.apiField]}
                    onChange={(e) => setForm({ ...form, [f.apiField]: e.target.value })}
                    disabled={!canEdit || submitting}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* File uploader — hidden after submission since the submission is
            final. The files list below stays visible (read-only). */}
        <p className="block text-gray-700 text-xs mb-2" style={{ fontWeight: 600 }}>
          ملفات المشروع
        </p>
        {!isSubmitted && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              onClick={() => canEdit && !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (canEdit) handleFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center mb-3 transition-all ${
                !canEdit
                  ? "opacity-50 cursor-not-allowed"
                  : uploading
                  ? "opacity-50 cursor-wait"
                  : "cursor-pointer hover:border-[#e35654] hover:bg-[#fef2f4]/30"
              }`}
              style={{ borderColor: "#e5e7eb" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#fef2f2" }}>
                <Upload className="w-6 h-6" style={{ color: "#e35654" }} />
              </div>
              <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>
                {!canEdit
                  ? "الرفع غير متاح حالياً"
                  : uploading
                  ? "جاري الرفع..."
                  : "اسحب الملفات هنا أو انقر للتحميل"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                أقصى حجم لكل ملف: {formatFileSize(maxBytes)}
              </p>
            </div>

            {uploadError && (
              <p className="text-red-500 text-sm mb-3 text-center">{uploadError}</p>
            )}
          </>
        )}

        {/* Uploaded files — inline list, no separate section */}
        {data.files.length > 0 && (
          <div className="space-y-2 mb-5">
            {data.files.map((file, i) => {
              const color = FILE_COLOR_PALETTE[i % FILE_COLOR_PALETTE.length];
              const fullUrl = `${API_URL}${file.url}`;
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <FileText className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm mb-0.5 truncate" style={{ fontWeight: 600 }}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDateAr(file.uploadedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#6366f1] hover:bg-blue-50 transition-colors"
                      title="معاينة"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <a
                      href={fullUrl}
                      download={file.name}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#10b981] hover:bg-green-50 transition-colors"
                      title="تحميل"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {!isSubmitted && (
                      <button
                        onClick={() => handleDelete(file.id)}
                        disabled={!canEdit}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#e35654] hover:bg-[#fef2f4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={canEdit ? "حذف" : "الحذف غير متاح حالياً"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit button — hidden after submission since edits aren't
            allowed. Disabled outside the window, mid-flight, or while the
            checklist isn't fully green. */}
        {!isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={!canEdit || submitting || !allFilled}
            className="w-full py-3 rounded-xl text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#10b981", fontWeight: 600 }}
          >
            {submitting ? "جاري الإرسال..." : "إرسال المشروع"}
          </button>
        )}
      </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Evaluations
// ═══════════════════════════════════════════════════════════
function EvaluationsTab({ hackathonId }: { hackathonId: number }) {
  const [evaluations, setEvaluations] = useState<ApiEvaluation[]>([]);
  const [visibility, setVisibility] = useState<ApiEvaluationsVisibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<ApiEvaluationsResponse>(
      `/participants/hackathons/${hackathonId}/evaluations`
    )
      .then((data) => {
        if (cancelled) return;
        setEvaluations(data.items);
        setVisibility(data.visibility);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل التقييمات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hackathonId]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5" style={{ color: "#f59e0b" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>تقييمات المشروع</h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">جاري تحميل التقييمات...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 text-sm">{error}</div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-10">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            {visibility?.reason === 'before_winners_date' && visibility.winnersDate ? (
              <>
                <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
                  ستظهر النتائج بتاريخ {formatDateAr(visibility.winnersDate)}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  لم يحن موعد إعلان النتائج بعد
                </p>
              </>
            ) : visibility?.reason === 'evaluations_hidden' ? (
              <>
                <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
                  لم يُتح المنظم ظهور التقييمات بعد
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  ستظهر هنا تقييمات الحكّام بعد إتاحتها من جهة التنظيم
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
                  لم يتم نشر التقييمات بعد
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  ستظهر هنا تقييمات الحكّام بعد التحكيم
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-2xl border border-gray-100"
                style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fff 100%)" }}
              >
                {/* Judge Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {ev.judgeName}
                    </h3>
                    {ev.judgeSpecialty && (
                      <p className="text-gray-400 text-sm">{ev.judgeSpecialty}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <div
                      className="text-2xl mb-1"
                      style={{ fontWeight: 800, color: "#f59e0b" }}
                    >
                      {ev.totalScore}/{ev.maxScore}
                    </div>
                    <p className="text-gray-400 text-xs">{formatDateAr(ev.evaluatedAt)}</p>
                  </div>
                </div>

                {/* Criteria — each scored 0..max where max = criterion weight.
                    Bar fill is score/max so the visual matches the rubric. */}
                {ev.criteria.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {ev.criteria.map((c, idx) => {
                      const pct = c.max > 0 ? Math.min(100, Math.max(0, (c.score / c.max) * 100)) : 0;
                      return (
                        <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-600 text-xs">{c.name}</p>
                            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#f59e0b" }}>
                              {c.score}/{c.max}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, background: "#f59e0b" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment */}
                {ev.comment && (
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-gray-400 text-xs mb-2" style={{ fontWeight: 600 }}>
                      تعليق الحكم:
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed">{ev.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

