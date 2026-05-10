import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { apiGet, apiPut, apiDelete, apiPost, apiUpload, API_URL, ApiError } from "../../lib/api";
import { HackathonCover, BrandingPayload } from "./HackathonCover";
import { LogoPattern } from "./LogoPatterns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Trophy,
  MapPin,
  Globe,
  Award,
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
  UserCheck,
  Sparkles,
  ArrowRight,
  Home,
  Video,
  ExternalLink,
  CalendarDays,
  Target,
  Flag,
  CheckCircle,
  ListChecks,
} from "lucide-react";

const IMG_HERO = "https://images.unsplash.com/photo-1660165458059-57cfb6cc87e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMGFydGlmaWNpYWwlMjBpbnRlbGxpZ2VuY2UlMjBkaWdpتالJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcyOTg4ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

// ─── Images ───────────────────────────────────────────────────────────────────
const IMG_AI = "https://images.unsplash.com/photo-1540058404349-2e5fabf32d75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_CYBER = "https://images.unsplash.com/photo-1768839721176-2fa91fdce725?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_CITY = "https://images.unsplash.com/photo-1758640098400-061795902273?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

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
  startDate: string;
  endDate: string;
  submissionDate: string;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  submissionDeadlineRaw: string | null;
  hasTeam: boolean;
  participationType: "solo" | "team";
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

function computeCountdown(deadline: string | null): { days: number; hours: number; minutes: number } {
  if (!deadline) return { days: 0, hours: 0, minutes: 0 };
  const target = new Date(deadline).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
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
  const cd = computeCountdown(h.submissionDeadline);
  const note = h.myTeamId
    ? "تم القبول في فريقك. يمكنك البدء في العمل على المشروع."
    : h.participationType === "team"
    ? "تسجيلك لم يكتمل — تبقى إيجاد فريق."
    : "أنت مسجّل بشكل فردي. ابدأ في إعداد مشروعك.";

  return {
    id: h.id,
    name: h.title,
    status: h.myTeamId || h.participationType === "solo" ? "مقبول" : "بانتظار فريق",
    statusColor: h.myTeamId || h.participationType === "solo" ? "#10b981" : "#f59e0b",
    statusBg: h.myTeamId || h.participationType === "solo" ? "#f0fdf4" : "#fffbeb",
    note,
    branding: h.branding,
    track: h.tags[0] ?? (h.type ?? "هاكاثون"),
    organizer: h.org ?? "—",
    location: h.location ?? "—",
    tags: h.tags.length > 0 ? h.tags : (h.type ? [h.type] : []),
    description: h.description ?? "",
    startDate: formatDateAr(h.hackathonStartDate),
    endDate: formatDateAr(h.hackathonEndDate),
    submissionDate: formatDateAr(h.submissionDeadline),
    daysLeft: cd.days,
    hoursLeft: cd.hours,
    minutesLeft: cd.minutes,
    submissionDeadlineRaw: h.submissionDeadline,
    hasTeam: h.myTeamId !== null,
    participationType: h.participationType,
    timeline: buildTimeline(h),
  };
}

// ── Hackathons Data (legacy mock — kept for reference, unused) ───

// ─── Types ──────────────────────────────────────────────
type WorkspaceTab = "home" | "team" | "submission" | "evaluations" | "certificates" | "sessions";

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
  criteria: { name: string; score: number }[];
  totalScore: number;
  maxScore: number;
}

// ─── Certificates ─────────────────────────────────────────
interface ApiCertificate {
  id: number;
  hackathonId: number;
  hackathonTitle: string;
  title: string;
  type: "participation" | "win" | "completion";
  position: string | null;
  fileUrl: string | null;
  issuedAt: string;
}

const CERT_TYPE_STYLE: Record<ApiCertificate["type"], { color: string; label: string }> = {
  participation: { color: "#6366f1", label: "مشاركة" },
  win:           { color: "#f59e0b", label: "فوز" },
  completion:    { color: "#10b981", label: "تدريب" },
};

// ─── Submission ───────────────────────────────────────────
interface ApiSubmissionFile {
  id: number;
  name: string;
  url: string;
  size: number;
  mimeType: string | null;
  uploadedAt: string;
  uploaderName?: string | null;
}

interface ApiSubmission {
  submissionId: number;
  projectName: string | null;
  projectDescription: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  submittedAt: string | null;
  submissionDeadline: string | null;
  allowLateSubmission: boolean;
  maxFileSizeMb: number;
  submissionFields: string[];
  requirements: string[];
  files: ApiSubmissionFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const FILE_COLOR_PALETTE = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6"];

// ─── Sessions ─────────────────────────────────────────────
type SessionPlatform = "zoom" | "teams" | "meet" | "other";
type SessionStatus = "completed" | "live" | "soon" | "scheduled";

interface ApiSession {
  id: number;
  title: string;
  description: string | null;
  type: SessionPlatform;
  startAt: string;
  durationMinutes: number;
  link: string | null;
}

interface UiSession {
  id: number;
  title: string;
  description: string;
  type: SessionPlatform;
  date: string;
  time: string;
  duration: string;
  status: SessionStatus;
  link: string | null;
}

function formatTimeAr(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 1 && m === 0) return "ساعة واحدة";
  if (h === 2 && m === 0) return "ساعتان";
  if (m === 0) return `${h} ساعات`;
  return `${h} س ${m} د`;
}

function computeSessionStatus(startAt: string, durationMinutes: number): SessionStatus {
  const startMs = new Date(startAt).getTime();
  const endMs = startMs + durationMinutes * 60 * 1000;
  const now = Date.now();
  if (now >= endMs) return "completed";
  if (now >= startMs) return "live";
  // Starts within 24 hours
  if (startMs - now <= 24 * 60 * 60 * 1000) return "soon";
  return "scheduled";
}

function toUiSession(s: ApiSession): UiSession {
  return {
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    type: s.type,
    date: formatDateAr(s.startAt),
    time: formatTimeAr(s.startAt),
    duration: formatDuration(s.durationMinutes),
    status: computeSessionStatus(s.startAt, s.durationMinutes),
    link: s.link,
  };
}

// ─── Timeline Data ──────────────────────────────────────
// ─── Sidebar Cards ──────────────────────────────────────
const sidebarCards: { tab: WorkspaceTab; icon: any; label: string; desc: string; color: string; bg: string }[] = [
  { tab: "home", icon: Home, label: "الرئيسية", desc: "نظرة عامة على الهاكاثون", color: "#6366f1", bg: "#eef2ff" },
  { tab: "team", icon: Users, label: "بيانات الفريق", desc: "التواصل مع أعضاء فريقك", color: "#10b981", bg: "#f0fdf4" },
  { tab: "sessions", icon: Video, label: "الجلسات", desc: "الانضمام للجلسات المباشرة", color: "#06b6d4", bg: "#ecfeff" },
  { tab: "submission", icon: Upload, label: "رفع المشروع", desc: "رفع ومعاينة التسليمات", color: "#e35654", bg: "#fef2f2" },
  { tab: "evaluations", icon: BarChart3, label: "التقييمات", desc: "تقييمات الحكام لمشروعك", color: "#f59e0b", bg: "#fffbeb" },
  { tab: "certificates", icon: Award, label: "الشهادات", desc: "عرض وتحميل شهاداتك", color: "#8b5cf6", bg: "#f5f3ff" },
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

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiMyHackathon[] }>("/participants/my-hackathons")
      .then((data) => {
        if (cancelled) return;
        setHackathons(data.items.map(toUiMyHackathon));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل مساحات العمل");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#f7f7f6] flex items-center justify-center text-gray-500 text-sm">جاري تحميل مساحات العمل...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-[#f7f7f6] flex items-center justify-center text-red-500 text-sm">{error}</div>;
  }

  const selectedHackathon = hackathonId ? hackathons.find((h) => h.id === Number(hackathonId)) : null;

  if (!hackathonId || !selectedHackathon) {
    return <WorkspacesList hackathons={hackathons} />;
  }

  return <WorkspaceDetails hackathon={selectedHackathon} />;
}

// ═══════════════════════════════════════════════════════════
// Workspaces List
// ═══════════════════════════════════════════════════════════
function WorkspacesList({ hackathons }: { hackathons: UiMyHackathon[] }) {
  const navigate = useNavigate();

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
                
                {/* Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px]" style={{ fontWeight: 700 }}>
                      {h.organizer.substring(0, 2)}
                    </div>
                    <span>{h.organizer}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{h.location}</span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{h.note}</p>

                <button
                  onClick={() => handleEnterWorkspace(h.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors shadow-md shadow-[#e35654]/20 mt-auto"
                  style={{ fontWeight: 600 }}
                >
                  <Play className="w-4 h-4" />
                  دخول مساحة العمل
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
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

function WorkspaceDetails({ hackathon }: { hackathon: UiMyHackathon }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("home");

  // Real badge counts per tab
  const [counts, setCounts] = useState<Record<WorkspaceTab, number>>({
    home: 0,
    team: 0,
    sessions: 0,
    submission: 0,
    evaluations: 0,
    certificates: 0,
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
    interface SessionsResp { items: { startAt: string; durationMinutes: number }[] }
    interface SubmissionResp { files: unknown[] }
    interface EvalResp { items: unknown[] }
    interface CertResp { items: { hackathonId: number }[] }

    Promise.allSettled([
      apiGet<TeamResp>(`/participants/hackathons/${hid}/my-team`),
      apiGet<SessionsResp>(`/participants/hackathons/${hid}/sessions`),
      apiGet<SubmissionResp>(`/participants/hackathons/${hid}/submission`),
      apiGet<EvalResp>(`/participants/hackathons/${hid}/evaluations`),
      apiGet<CertResp>(`/participants/certificates`),
    ]).then((results) => {
      if (cancelled) return;
      const next: Record<WorkspaceTab, number> = {
        home: 0, team: 0, sessions: 0, submission: 0, evaluations: 0, certificates: 0,
      };

      // Team: number of members (if a team exists)
      if (results[0].status === 'fulfilled') {
        next.team = results[0].value.team?.members.length ?? 0;
      }

      // Sessions: count of sessions that haven't ended yet
      if (results[1].status === 'fulfilled') {
        const now = Date.now();
        next.sessions = results[1].value.items.filter((s) => {
          const end = new Date(s.startAt).getTime() + s.durationMinutes * 60_000;
          return end > now;
        }).length;
      }

      // Submission: number of uploaded files
      if (results[2].status === 'fulfilled') {
        next.submission = results[2].value.files.length;
      }

      // Evaluations: number of published evaluations
      if (results[3].status === 'fulfilled') {
        next.evaluations = results[3].value.items.length;
      }

      // Certificates: only those for this hackathon
      if (results[4].status === 'fulfilled') {
        next.certificates = results[4].value.items.filter((c) => c.hackathonId === hid).length;
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
            {sidebarCards.map((card) => {
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
            {activeTab === "certificates" && <CertificatesTab />}
            {activeTab === "sessions" && <SessionsTab hackathonId={hackathon.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Home
// ═══════════════════════════════════════════════════════════
function HomeTab({ hackathon }: { hackathon: UiMyHackathon }) {
  const [timeLeft, setTimeLeft] = useState({
    days: hackathon.daysLeft,
    hours: hackathon.hoursLeft,
    minutes: hackathon.minutesLeft,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        // Decrement one second
        seconds--;

        // Update countdown
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          // Time's up
          clearInterval(interval);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
          {[
            { label: "المسار", value: hackathon.track, color: "#6366f1" },
            { label: "الحالة", value: "نشط - قيد التنفيذ", color: "#10b981" },
            { label: "نوع المشاركة", value: "فريق (4 أعضاء)", color: "#e35654" },
          ].map((info, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-gray-400 text-xs mb-1">{info.label}</p>
              <p style={{ color: info.color, fontWeight: 600, fontSize: "0.82rem" }}>{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" style={{ color: "#e35654" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            الوقت المتبقي للتسليم
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
    maxMembers: number;
    members: Array<{
      id: number;
      fullName: string;
      email: string;
      isLeader: boolean;
      isMe: boolean;
    }>;
  } | null;
  participationType: "solo" | "team";
}

const TEAM_MEMBER_COLORS = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"];

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
        if (cancelled) return;
        setData(d);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل بيانات الفريق");
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
          onClick={() => navigate("/participant/matchmaking")}
          className="px-5 py-2.5 rounded-xl bg-[#6366f1] text-white text-sm hover:bg-[#4f51d4] transition-colors"
          style={{ fontWeight: 600 }}
        >
          ابحث عن فريق
        </button>
      </div>
    );
  }

  const members = data.team.members;

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#10b981" }} />
            <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{data.team.name}</h2>
          </div>
          <span className="text-gray-400 text-xs">
            {members.length} / {data.team.maxMembers} أعضاء
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
function SubmissionTab({ hackathonId }: { hackathonId: number }) {
  const [data, setData] = useState<ApiSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await apiUpload(`/participants/hackathons/${hackathonId}/submission/files`, file);
      }
      await refetch();
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : "فشل رفع الملف");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: number) => {
    try {
      await apiDelete(`/participants/hackathons/${hackathonId}/submission/files/${fileId}`);
      await refetch();
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : "فشل حذف الملف");
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

  return (
    <div className="space-y-6">
      {/* Submission Requirements */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks className="w-5 h-5" style={{ color: "#f59e0b" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>متطلبات التسليم</h2>
        </div>

        {data.requirements.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">لم يحدّد المنظّم متطلبات بعد</p>
        ) : (
          <div className="space-y-3">
            {data.requirements.map((req, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#f59e0b15", color: "#f59e0b" }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1">{req}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Upload className="w-5 h-5" style={{ color: "#e35654" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>رفع المشروع</h2>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Upload Area */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center mb-5 transition-all ${
            uploading ? "opacity-50 cursor-wait" : "cursor-pointer hover:border-[#e35654] hover:bg-[#fef2f4]/30"
          }`}
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#fef2f2" }}>
            <Upload className="w-8 h-8" style={{ color: "#e35654" }} />
          </div>
          <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            {uploading ? "جاري الرفع..." : "اسحب الملفات هنا أو انقر للتحميل"}
          </h3>
          <p className="text-gray-400 text-sm">
            الحد الأقصى لكل ملف: {data.maxFileSizeMb} MB
          </p>
        </div>

        {uploadError && (
          <p className="text-red-500 text-sm mb-3 text-center">{uploadError}</p>
        )}

        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 rounded-xl text-white text-sm transition-colors disabled:opacity-50"
          style={{ background: "#e35654", fontWeight: 600 }}
        >
          <Plus className="w-4 h-4 inline-block ml-2" />
          إضافة ملفات
        </button>
        <p className="text-gray-300 text-xs text-center mt-2">
          أقصى حجم لكل ملف: {formatFileSize(maxBytes)}
        </p>
      </div>

      {/* Uploaded Files */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-5 h-5" style={{ color: "#6366f1" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            الملفات المرفوعة ({data.files.length})
          </h2>
        </div>

        {data.files.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>لم يتم رفع أي ملف بعد</p>
            <p className="text-gray-400 text-xs mt-1">الملفات اللي ترفعها بتظهر هنا</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.files.map((file, i) => {
              const color = FILE_COLOR_PALETTE[i % FILE_COLOR_PALETTE.length];
              const fullUrl = `${API_URL}${file.url}`;
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <FileText className="w-5 h-5" style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm mb-1 truncate" style={{ fontWeight: 600 }}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDateAr(file.uploadedAt)}</span>
                      {file.uploaderName && (
                        <>
                          <span>•</span>
                          <span>{file.uploaderName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#6366f1] hover:bg-blue-50 transition-colors"
                      title="معاينة"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <a
                      href={fullUrl}
                      download={file.name}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#10b981] hover:bg-green-50 transition-colors"
                      title="تحميل"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#e35654] hover:bg-[#fef2f4] transition-colors"
                      title="حذف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Evaluations
// ═══════════════════════════════════════════════════════════
function EvaluationsTab({ hackathonId }: { hackathonId: number }) {
  const [evaluations, setEvaluations] = useState<ApiEvaluation[]>([]);
  const [hasTeam, setHasTeam] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiEvaluation[]; teamId: number | null }>(
      `/participants/hackathons/${hackathonId}/evaluations`
    )
      .then((data) => {
        if (cancelled) return;
        setEvaluations(data.items);
        setHasTeam(data.teamId !== null);
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
        ) : !hasTeam ? (
          <div className="text-center py-10">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
              التقييمات تظهر بعد الانضمام لفريق
            </p>
            <p className="text-gray-400 text-xs mt-1">
              الحكّام يقيّمون مشاريع الفِرَق، لذا يجب الانضمام لفريق أولاً
            </p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-10">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
              لم يتم نشر التقييمات بعد
            </p>
            <p className="text-gray-400 text-xs mt-1">ستظهر هنا تقييمات الحكّام بعد التحكيم</p>
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

                {/* Criteria */}
                {ev.criteria.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {ev.criteria.map((c, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-600 text-xs">{c.name}</p>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#f59e0b" }}>
                            {c.score}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${c.score}%`, background: "#f59e0b" }}
                          />
                        </div>
                      </div>
                    ))}
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

// ═══════════════════════════════════════════════════════════
// Tab: Certificates
// ═══════════════════════════════════════════════════════════
function CertificatesTab() {
  const [certificates, setCertificates] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiCertificate[] }>("/participants/certificates")
      .then((data) => {
        if (cancelled) return;
        setCertificates(data.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل الشهادات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = (cert: ApiCertificate) => {
    if (cert.fileUrl) {
      window.open(cert.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5" style={{ color: "#8b5cf6" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>شهاداتي</h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">جاري تحميل الشهادات...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 text-sm">{error}</div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-10">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>لا توجد شهادات بعد</p>
            <p className="text-gray-400 text-xs mt-1">ستظهر هنا شهاداتك بعد المشاركة في الهاكاثونات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => {
              const style = CERT_TYPE_STYLE[cert.type];
              return (
                <div
                  key={cert.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${style.color}15` }}
                  >
                    <Award className="w-6 h-6" style={{ color: style.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                        {cert.title}
                      </h3>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: `${style.color}15`, color: style.color, fontWeight: 600 }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-1">{cert.hackathonTitle}</p>
                    <p className="text-gray-300 text-xs">{formatDateAr(cert.issuedAt)}</p>
                  </div>

                  <button
                    onClick={() => handleDownload(cert)}
                    disabled={!cert.fileUrl}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: style.color, fontWeight: 600 }}
                    title={cert.fileUrl ? "تحميل الشهادة" : "ملف الشهادة غير متاح"}
                  >
                    <Download className="w-4 h-4" />
                    تحميل
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Sessions
// ═══════════════════════════════════════════════════════════
function SessionsTab({ hackathonId }: { hackathonId: number }) {
  const [sessions, setSessions] = useState<UiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiSession[] }>(`/participants/hackathons/${hackathonId}/sessions`)
      .then((data) => {
        if (cancelled) return;
        setSessions(data.items.map(toUiSession));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل الجلسات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hackathonId]);

  // Status colors and labels
  const statusStyle = (status: SessionStatus) => {
    if (status === "live")      return { bg: "#fef2f2", color: "#e35654", label: "مباشر الآن" };
    if (status === "soon")      return { bg: "#ecfeff", color: "#06b6d4", label: "قادم" };
    if (status === "completed") return { bg: "#f0fdf4", color: "#10b981", label: "مكتمل" };
    return { bg: "#fffbeb", color: "#f59e0b", label: "مجدول" };
  };

  const platformStyle = (type: SessionPlatform) => {
    if (type === "zoom")  return { bg: "#ecfeff", color: "#06b6d4" };
    if (type === "teams") return { bg: "#eef2ff", color: "#6366f1" };
    if (type === "meet")  return { bg: "#f0fdf4", color: "#10b981" };
    return { bg: "#f5f3ff", color: "#8b5cf6" };
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Video className="w-5 h-5" style={{ color: "#06b6d4" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>الجلسات المباشرة</h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">جاري تحميل الجلسات...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 text-sm">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>لا توجد جلسات مجدولة</p>
            <p className="text-gray-400 text-xs mt-1">ستظهر هنا جلسات الهاكاثون عند جدولتها</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const sStyle = statusStyle(session.status);
              const pStyle = platformStyle(session.type);
              const isJoinable = (session.status === "live" || session.status === "soon") && !!session.link;
              return (
                <div
                  key={session.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    session.status === "soon" || session.status === "live"
                      ? "border-[#06b6d4]/30 bg-cyan-50/30"
                      : session.status === "completed"
                      ? "border-gray-100 bg-gray-50/30"
                      : "border-gray-100"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                          {session.title}
                        </h3>
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full"
                          style={{ background: sStyle.bg, color: sStyle.color, fontWeight: 600 }}
                        >
                          {sStyle.label}
                        </span>
                      </div>
                      {session.description && (
                        <p className="text-gray-500 text-xs mb-2">{session.description}</p>
                      )}
                    </div>

                    {/* Platform Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
                      style={{ background: pStyle.bg }}
                    >
                      <Video className="w-5 h-5" style={{ color: pStyle.color }} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>{session.duration}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {isJoinable && (
                    <button
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm transition-colors"
                      style={{ background: "#06b6d4", fontWeight: 600 }}
                      onClick={() => session.link && window.open(session.link, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {session.status === "live" ? "انضم الآن" : "الانضمام للجلسة"}
                    </button>
                  )}

                  {session.status === "completed" && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span style={{ fontWeight: 600 }}>تم الانتهاء</span>
                    </div>
                  )}

                  {session.status === "scheduled" && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm"
                      style={{ borderColor: "#f59e0b", color: "#f59e0b", fontWeight: 600 }}
                    >
                      <Calendar className="w-4 h-4" />
                      مجدول لاحقاً
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
