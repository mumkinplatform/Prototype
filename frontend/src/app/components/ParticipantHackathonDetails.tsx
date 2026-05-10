import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowRight,
  Calendar,
  Trophy,
  Clock,
  Users,
  Eye,
  MapPin,
  Star,
  CheckCircle2,
  Globe,
  Shield,
  Play,
  X,
  Mail,
  Sparkles,
  UserCheck,
  Building2,
  ChevronLeft,
  Code,
} from "lucide-react";
import { apiGet, apiPost, ApiError } from "../../lib/api";

interface ApiPrize {
  rank: string;
  amount: string | null;
  sortOrder: number;
}

interface ApiTimelineEntry {
  date: string;
  label: string;
  done: boolean;
}

interface ApiHackathonDetail {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
  description: string | null;
  location: string | null;
  org: string | null;
  organizerId: number | null;
  hackathonStartDate: string | null;
  hackathonEndDate: string | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  submissionDeadline: string | null;
  teamMin: number;
  teamMax: number;
  participationMode: string;
  tags: string[];
  prizes: ApiPrize[];
  prizeTotal: number;
  timeline: ApiTimelineEntry[];
  applicantsCount: number;
  registrationOpen: boolean;
  isRegistered: boolean;
  participationType: "solo" | "team" | null;
  hasTeam: boolean;
  skills: string[];
}

interface UiPrize {
  rank: string;
  amount: string;
  icon: string;
  color: string;
}

interface UiTimelineEntry {
  date: string;
  label: string;
  done: boolean;
}

interface UiHackathon {
  id: number;
  title: string;
  org: string;
  orgLogo: string;
  orgColor: string;
  tags: string[];
  tagColors: string[];
  type: string;
  typeColor: string;
  typeBg: string;
  date: string;
  deadline: string;
  prize: string;
  viewers: number;
  teams: number;
  cover: string;
  coverText: string;
  featured: boolean;
  location: string;
  duration: string;
  participants: number;
  maxTeam: number;
  registrationOpen: boolean;
  isRegistered: boolean;
  participationType: "solo" | "team" | null;
  hasTeam: boolean;
  desc: string;
  skills: string[];
  prizes: UiPrize[];
  timeline: UiTimelineEntry[];
}

const TAG_PALETTE = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6"];
const ORG_COLOR_PALETTE = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6"];

const COVER_PALETTE = [
  { gradient: "from-green-800 via-teal-700 to-cyan-600", label: "HACK\n2025" },
  { gradient: "from-blue-800 via-indigo-700 to-purple-600", label: "TECH\nhackathon" },
  { gradient: "from-violet-800 via-purple-700 to-indigo-800", label: "INNO\nVATION" },
  { gradient: "from-amber-700 via-orange-600 to-red-700", label: "CODE\nFEST" },
  { gradient: "from-emerald-700 via-green-600 to-teal-700", label: "BUILD\n2025" },
  { gradient: "from-gray-800 via-slate-700 to-gray-900", label: "DEV\nHACK" },
];

const TYPE_STYLES: Record<string, { color: string; bg: string }> = {
  "حضوري":       { color: "#e35654", bg: "#fef2f2" },
  "عبر الإنترنت": { color: "#10b981", bg: "#f0fdf4" },
};

const PRIZE_STYLE_BY_ORDER: Record<number, { icon: string; color: string }> = {
  1: { icon: "🥇", color: "#f59e0b" },
  2: { icon: "🥈", color: "#94a3b8" },
  3: { icon: "🥉", color: "#92400e" },
};

function formatDateAr(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatTimelineDate(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "numeric",
    month: "long",
  }).format(d);
}

function formatPrize(amount: number): string {
  if (!amount) return "0 ر.س";
  return `${new Intl.NumberFormat("en-US").format(amount)} ر.س`;
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return "—";
  const hours = Math.round((e - s) / (1000 * 60 * 60));
  if (hours < 48) return `${hours} ساعة`;
  const days = Math.round(hours / 24);
  return `${days} يوم`;
}

function toUiHackathon(h: ApiHackathonDetail): UiHackathon {
  const cover = COVER_PALETTE[h.id % COVER_PALETTE.length];
  const typeStyle = (h.type && TYPE_STYLES[h.type]) || { color: "#6366f1", bg: "#eef2ff" };
  const orgName = h.org ?? "—";
  const orgInitial = orgName.charAt(0) || "؟";

  const uiPrizes: UiPrize[] = h.prizes.map((p) => {
    const style = PRIZE_STYLE_BY_ORDER[p.sortOrder] ?? { icon: "🏆", color: "#6366f1" };
    return {
      rank: p.rank,
      amount: p.amount ?? "—",
      icon: style.icon,
      color: style.color,
    };
  });

  const uiTimeline: UiTimelineEntry[] = h.timeline.map((t) => ({
    date: formatTimelineDate(t.date),
    label: t.label,
    done: t.done,
  }));

  return {
    id: h.id,
    title: h.title,
    org: orgName,
    orgLogo: orgInitial,
    orgColor: ORG_COLOR_PALETTE[h.id % ORG_COLOR_PALETTE.length],
    tags: h.tags,
    tagColors: h.tags.map((_, i) => TAG_PALETTE[i % TAG_PALETTE.length]),
    type: h.type ?? "—",
    typeColor: typeStyle.color,
    typeBg: typeStyle.bg,
    date: formatDateAr(h.hackathonStartDate),
    deadline: formatDateAr(h.registrationEndDate),
    prize: formatPrize(h.prizeTotal),
    viewers: 0,
    teams: h.applicantsCount,
    cover: cover.gradient,
    coverText: cover.label,
    featured: false,
    location: h.location ?? "—",
    duration: formatDuration(h.hackathonStartDate, h.hackathonEndDate),
    participants: h.applicantsCount,
    maxTeam: h.teamMax,
    registrationOpen: h.registrationOpen,
    isRegistered: h.isRegistered,
    participationType: h.participationType,
    hasTeam: h.hasTeam,
    desc: h.description ?? "",
    skills: h.skills ?? [],
    prizes: uiPrizes,
    timeline: uiTimeline,
  };
}

// ─── Registration Modal ───────────────────────────────────────────────────────
function RegistrationModal({
  hackathonId,
  hackathonTitle,
  onClose,
  onSuccess,
}: {
  hackathonId: number;
  hackathonTitle: string;
  onClose: () => void;
  onSuccess: (type: "solo" | "team") => void;
}) {
  const navigate = useNavigate();
  const [participationType, setParticipationType] = useState<"solo" | "team" | null>(null);
  const [teamMethod, setTeamMethod] = useState<"email" | "ai" | null>(null);
  const [email, setEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const participationOptions = [
    {
      id: "solo",
      icon: "👤",
      label: "مشارك فردي",
      desc: "سجّل بمفردك وقدّم مشروعك كفرد",
    },
    {
      id: "team",
      icon: "👥",
      label: "مشارك ضمن فريق",
      desc: "أنشئ فريقاً أو انضم لفريق موجود",
    },
  ];
 
  const handleAddEmail = () => {
    if (email && !invitedEmails.includes(email)) {
      setInvitedEmails([...invitedEmails, email]);
      setEmail("");
    }
  };
 
  const trimmedTitle = ideaTitle.trim();
  const trimmedDesc = ideaDescription.trim();
  const ideaValid = trimmedTitle.length > 0 && trimmedDesc.length > 0;

  const handleConfirm = async () => {
    if (!participationType) return;
    if (participationType === "team" && !teamMethod) return;
    if (!ideaValid) {
      setSubmitError("عنوان الفكرة ونبذتها مطلوبان");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiPost(`/participants/hackathons/${hackathonId}/register`, {
        ideaTitle: trimmedTitle,
        ideaDescription: trimmedDesc,
        participationType,
      });

      if (participationType === "team" && teamMethod === "ai") {
        navigate("/participant/matchmaking");
        return;
      }
      onSuccess(participationType);
      onClose();
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "فشل تسجيل الاشتراك");
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-gray-900" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              التسجيل في الهاكاثون
            </p>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[220px]">{hackathonTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
 
        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Step 1: Participation Type */}
          <div>
            <p className="text-gray-700 text-xs mb-3" style={{ fontWeight: 600 }}>
              اختر نوع المشاركة:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {participationOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setParticipationType(opt.id as "solo" | "team");
                    setTeamMethod(null);
                  }}
                  className={`p-3 rounded-xl border-2 text-right transition-all ${
                    participationType === opt.id
                      ? "border-[#e35654] bg-[#fef2f2]"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <p className="text-gray-900 text-sm mb-1" style={{ fontWeight: 700 }}>
                    {opt.label}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: "0.65rem", lineHeight: 1.4 }}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
 
          {/* Step 2: Team Method */}
          {participationType === "team" && (
            <div className="space-y-3">
              <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>
                خيارات تكوين الفريق:
              </p>
 
              {/* Email invite */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  teamMethod === "email" ? "border-[#e35654] bg-[#fef2f2]" : "border-gray-100"
                }`}
              >
                <input
                  type="radio"
                  name="teamMethod"
                  checked={teamMethod === "email"}
                  onChange={() => setTeamMethod("email")}
                  className="mt-0.5 accent-[#e35654]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#e35654]" />
                    <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
                      دعوة أعضاء بالبريد الإلكتروني
                    </p>
                  </div>
                  <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>
                    أدخل البريد الإلكتروني وأرسل دعوات للأعضاء
                  </p>
                  {teamMethod === "email" && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                          placeholder="example@email.com"
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#e35654]"
                          dir="ltr"
                        />
                        <button
                          onClick={handleAddEmail}
                          className="px-3 py-1.5 rounded-lg bg-[#e35654] text-white text-xs"
                          style={{ fontWeight: 600 }}
                        >
                          إضافة
                        </button>
                      </div>
                      {invitedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {invitedEmails.map((em) => (
                            <span
                              key={em}
                              className="flex items-center gap-1 bg-[#fef2f2] text-[#e35654] px-2 py-0.5 rounded-full text-xs"
                              dir="ltr"
                            >
                              {em}
                              <button
                                onClick={() => setInvitedEmails(invitedEmails.filter((e) => e !== em))}
                                className="ml-0.5 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>
 
              {/* AI Matching */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  teamMethod === "ai" ? "border-[#6366f1] bg-[#eef2ff]" : "border-gray-100"
                }`}
                onClick={() => setTeamMethod("ai")}
                aria-disabled={false}
              >
                <input
                  type="radio"
                  name="teamMethod"
                  checked={teamMethod === "ai"}
                  onChange={() => setTeamMethod("ai")}
                  className="mt-0.5 accent-[#6366f1]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#6366f1]" />
                    <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
                      توفيق الفرق بالذكاء الاصطناعي
                    </p>
                    <span
                      className="text-white text-xs px-1.5 py-0.5 rounded-md"
                      style={{ background: "#6366f1", fontWeight: 700, fontSize: "0.55rem" }}
                    >
                      AI
                    </span>
                  </div>
                  <p className="text-gray-400" style={{ fontSize: "0.65rem", lineHeight: 1.4 }}>
                    دع الذكاء الاصطناعي يقترح أعضاء بناءً على مهاراتك وأهدافك
                  </p>
                  {teamMethod === "ai" && (
                    <p className="mt-1.5 text-[#6366f1]" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                      ← ستنتقل لصفحة تكوين الفرق بالذكاء الاصطناعي
                    </p>
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Step 3: Idea (required for everyone) */}
          {participationType && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>
                نبذة عن الفكرة <span className="text-[#e35654]">*</span>
              </p>
              <input
                type="text"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="عنوان الفكرة"
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654]"
              />
              <textarea
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                placeholder="نبذة تفصيلية عن الفكرة (المشكلة، الحل المقترح، الفئة المستهدفة...)"
                rows={4}
                maxLength={5000}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654] resize-none"
              />
              <p className="text-gray-300 text-left" style={{ fontSize: "0.6rem" }}>
                {trimmedDesc.length} / 5000
              </p>
            </div>
          )}

          {submitError && (
            <p className="text-red-500 text-xs" style={{ fontWeight: 500 }}>
              {submitError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <button
            onClick={onClose}
            className="text-gray-500 text-sm hover:text-gray-700"
            style={{ fontWeight: 500 }}
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              !participationType ||
              (participationType === "team" && !teamMethod) ||
              !ideaValid ||
              submitting
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${
              participationType && (participationType === "solo" || teamMethod) && ideaValid && !submitting
                ? "bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontWeight: 600 }}
          >
            {submitting ? (
              <>جاري الحفظ...</>
            ) : participationType === "team" && teamMethod === "ai" ? (
              <>
                <Sparkles className="w-4 h-4" />
                انتقل لـ AI Matching
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                تأكيد التسجيل
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── Main Component ───────────────────────────────────────────────────���───────
export function ParticipantHackathonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showRegModal, setShowRegModal] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationType, setRegistrationType] = useState<"solo" | "team" | null>(null);
  const [hackathon, setHackathon] = useState<UiHackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    apiGet<ApiHackathonDetail>(`/participants/hackathons/${id}`)
      .then((data) => {
        if (cancelled) return;
        const ui = toUiHackathon(data);
        setHackathon(ui);
        if (ui.isRegistered) {
          setRegistered(true);
          if (ui.participationType) {
            setRegistrationType(ui.participationType);
          }
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل تفاصيل الهاكاثون");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Read the just-joined hint coming from SmartMatchmaking
  useEffect(() => {
    const regType = localStorage.getItem("hackathon_registered");
    if (regType === "team") {
      setRegistered(true);
      setRegistrationType("team");
      localStorage.removeItem("hackathon_registered");
    }
  }, []);

  const handleRegistrationSuccess = (type: "solo" | "team") => {
    setRegistered(true);
    setRegistrationType(type);
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">جاري تحميل تفاصيل الهاكاثون...</div>;
  }
  if (error || !hackathon) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-red-500">{error ?? "الهاكاثون غير موجود"}</div>;
  }

  return (
    <>
      {/* ── Hero Cover ── */}
      <div className={`bg-gradient-to-br ${hackathon.cover} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="absolute inset-0 opacity-10 select-none pointer-events-none flex items-center justify-center"
          style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "10rem", color: "white", letterSpacing: "-0.05em" }}
        >
          {hackathon.coverText.split("\n")[0]}
        </div>
 
        {/* Back Button */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-5">
          <button
            onClick={() => navigate("/participant/hackathons")}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
            style={{ fontWeight: 500 }}
          >
            <ArrowRight className="w-4 h-4" />
            العودة للهاكاثونات
          </button>
        </div>
 
        {/* Hero Content */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pb-8 pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {hackathon.featured && (
              <span
                className="flex items-center gap-1.5 bg-[#e35654] text-white text-xs px-3 py-1.5 rounded-full"
                style={{ fontWeight: 600 }}
              >
                <Star className="w-3 h-3" />
                هاكاثون مميز
              </span>
            )}
            <span
              className="text-xs px-3 py-1.5 rounded-full backdrop-blur-sm"
              style={{ background: hackathon.typeBg + "ee", color: hackathon.typeColor, fontWeight: 600 }}
            >
              {hackathon.type}
            </span>
            {hackathon.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: hackathon.tagColors[i % hackathon.tagColors.length] + "25",
                  color: "white",
                  fontWeight: 500,
                  backdropFilter: "blur(4px)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
 
          <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "2rem", lineHeight: 1.2 }}>
            {hackathon.title}
          </h1>
 
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ background: hackathon.orgColor, fontSize: "0.7rem", fontWeight: 800 }}
            >
              {hackathon.orgLogo}
            </div>
            <span className="text-white/80 text-sm" style={{ fontWeight: 500 }}>
              {hackathon.org}
            </span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              {hackathon.location}
            </span>
          </div>
 
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Trophy, label: "إجمالي الجوائز", value: hackathon.prize, color: "#f59e0b" },
              { icon: Users, label: "فرق مشاركة", value: `${hackathon.teams} فريق`, color: "#10b981" },
              { icon: Clock, label: "مدة الهاكاثون", value: hackathon.duration, color: "#6366f1" },
              { icon: Calendar, label: "تاريخ الانطلاق", value: hackathon.date, color: "#e35654" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
                <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
                <p className="text-white" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {stat.value}
                </p>
                <p className="text-white/60" style={{ fontSize: "0.7rem" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
 
          {/* ── Left Column (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">
 
            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-gray-900 mb-3 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Globe className="w-4 h-4 text-[#e35654]" />
                عن الهاكاثون
              </h2>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: "0.9rem" }}>
                {hackathon.desc}
              </p>
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                {[
                  { label: "المشاركون", value: hackathon.participants, icon: Users, color: "#6366f1" },
                  { label: "المشاهدات", value: hackathon.viewers, icon: Eye, color: "#e35654" },
                  { label: "الفرق المسجلة", value: hackathon.teams, icon: Shield, color: "#10b981" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-gray-50">
                    <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
                    <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.2rem" }}>{s.value}</p>
                    <p className="text-gray-400" style={{ fontSize: "0.7rem" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Required Skills */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Code className="w-4 h-4 text-[#e35654]" />
                المهارات المطلوبة
              </h2>
              <div className="flex flex-wrap gap-2">
                {hackathon.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 text-sm"
                    style={{ fontWeight: 500 }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-4 p-3 bg-[#eef2ff] rounded-xl border border-[#6366f1]/20 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#6366f1] flex-shrink-0" />
                <p className="text-[#6366f1] text-xs" style={{ fontWeight: 500 }}>
                  استخدم AI Matching لإيجاد زملاء يكملون مهاراتك في هذا الهاكاثون
                </p>
                <button
                  onClick={() => navigate("/participant/matchmaking")}
                  className="text-[#6366f1] text-xs hover:underline flex-shrink-0"
                  style={{ fontWeight: 700 }}
                >
                  جرّبه الآن
                </button>
              </div>
            </div>
 
            {/* Prizes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Trophy className="w-4 h-4 text-[#f59e0b]" />
                توزيع الجوائز
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {hackathon.prizes.map((p, i) => (
                  <div
                    key={i}
                    className="text-center p-4 rounded-2xl border border-gray-100"
                    style={{ background: p.color + "08" }}
                  >
                    <div className="text-3xl mb-2">{p.icon}</div>
                    <p className="text-gray-600 text-xs mb-1" style={{ fontWeight: 600 }}>{p.rank}</p>
                    <p style={{ fontWeight: 800, fontSize: "1.1rem", color: p.color }}>{p.amount}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-gray-900 mb-5 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Calendar className="w-4 h-4 text-[#e35654]" />
                الجدول الزمني
              </h2>
              <div className="relative">
                <div className="absolute right-[18px] top-2 bottom-2 w-0.5 bg-gray-100" />
                <div className="space-y-4">
                  {hackathon.timeline.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2"
                        style={{
                          background: item.done ? "#e35654" : "white",
                          borderColor: item.done ? "#e35654" : "#e5e7eb",
                        }}
                      >
                        {item.done ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-md"
                          style={{
                            background: item.done ? "#fef2f2" : "#f3f4f6",
                            color: item.done ? "#e35654" : "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          {item.date}
                        </span>
                        <p
                          className="mt-1"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: item.done ? 600 : 500,
                            color: item.done ? "#111827" : "#6b7280",
                          }}
                        >
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
 
          {/* ── Right Column (1/3) ── */}
          <div className="space-y-4">
 
            {/* CTA Card */}
            <div className={`bg-white rounded-2xl border-2 p-5 sticky top-4 ${
              registered
                ? (hackathon.participationType === "team" && !hackathon.hasTeam
                    ? "border-amber-200"
                    : "border-green-200")
                : "border-gray-100"
            }`}>
              {registered && hackathon.participationType === "team" && !hackathon.hasTeam ? (
                <>
                  {/* ── Registered, Awaiting Team ── */}
                  <div className="flex flex-col items-center text-center py-2">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-amber-600" />
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full mb-3"
                      style={{ fontWeight: 700 }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تم تقديم الفكرة
                    </span>
                    <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      تبقى إيجاد فريق
                    </h3>
                    <p className="text-gray-400 text-xs mb-1">
                      {hackathon.title}
                    </p>
                    <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                      تسجيلك لم يكتمل بعد. انضم إلى فريق لإكمال مشاركتك في الهاكاثون.
                    </p>

                    <button
                      onClick={() => navigate("/participant/matchmaking")}
                      className="w-full py-3 rounded-xl text-sm bg-[#6366f1] text-white hover:bg-[#4f51d4] shadow-md shadow-[#6366f1]/25 transition-all flex items-center justify-center gap-2 mb-2"
                      style={{ fontWeight: 600 }}
                    >
                      <Sparkles className="w-4 h-4" />
                      ابحث عن فريق
                    </button>
                    <button
                      onClick={() => navigate("/participant/hackathons")}
                      className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      استكشف هاكاثونات أخرى
                    </button>
                  </div>
                </>
              ) : registered ? (
                <>
                  {/* ── Registered, Complete ── */}
                  <div className="flex flex-col items-center text-center py-2">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full mb-3"
                      style={{ fontWeight: 700 }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تم التسجيل بنجاح!
                    </span>
                    <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      أنت الآن مسجّل في الهاكاثون
                    </h3>
                    <p className="text-gray-400 text-xs mb-1">
                      {hackathon.title}
                    </p>
                    <p className="text-gray-400 text-xs mb-5">
                      نوع المشاركة: <span className="text-gray-700" style={{ fontWeight: 600 }}>
                        {registrationType === "solo" ? "مشارك فردي 👤" : "ضمن فريق 👥"}
                      </span>
                    </p>

                    <div className="w-full space-y-2 mb-4 text-right">
                      <div className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-gray-400">موعد الانطلاق</span>
                        <span className="text-gray-700" style={{ fontWeight: 600 }}>{hackathon.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-gray-400">الجائزة الكلية</span>
                        <span className="text-[#f59e0b]" style={{ fontWeight: 700 }}>{hackathon.prize}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-gray-400">المدة</span>
                        <span className="text-gray-700" style={{ fontWeight: 600 }}>{hackathon.duration}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/participant/hackathons")}
                      className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      استكشف هاكاثونات أخرى
                    </button>
                  </div>
                </>
              ) : hackathon.registrationOpen ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-[#10b981] text-xs" style={{ fontWeight: 600 }}>
                      التسجيل مفتوح
                    </span>
                  </div>
                  <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    سجّل مشاركتك الآن
                  </h3>
                  <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                    شارك فردياً أو كوّن فريقاً مع زملائك أو دع الذكاء الاصطناعي يختار لك أفضل الأعضاء
                  </p>
 
                  {/* Quick info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">آخر موعد للتسجيل</span>
                      <span className="text-[#e35654]" style={{ fontWeight: 600 }}>{hackathon.deadline}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">حجم الفريق</span>
                      <span className="text-gray-700" style={{ fontWeight: 600 }}>حتى {hackathon.maxTeam} أعضاء</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">الفرق المسجلة</span>
                      <span className="text-gray-700" style={{ fontWeight: 600 }}>{hackathon.teams} فريق</span>
                    </div>
                  </div>
 
                  <button
                    onClick={() => setShowRegModal(true)}
                    className="w-full py-3 rounded-xl text-sm bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/25 transition-all flex items-center justify-center gap-2"
                    style={{ fontWeight: 600 }}
                  >
                    <Play className="w-4 h-4" />
                    سجّل الآن
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-400 text-xs" style={{ fontWeight: 600 }}>
                      التسجيل مغلق
                    </span>
                  </div>
                  <div className="rounded-xl p-3.5 bg-gray-50 border border-dashed border-gray-200 text-center mb-4">
                    <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>انتهى وقت التسجيل</p>
                    <p className="text-gray-400 text-xs mt-1">يمكنك متابعة الهاكاثون وتشجيع المشاركين</p>
                  </div>
                  <button
                    onClick={() => navigate("/participant/hackathons")}
                    className="w-full py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    استكشف هاكاثونات أخرى
                  </button>
                </>
              )}
            </div>
 
            {/* Organizer Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-900 mb-3" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                الجهة المنظمة
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: hackathon.orgColor, fontWeight: 800 }}
                >
                  {hackathon.orgLogo}
                </div>
                <div>
                  <p className="text-gray-900" style={{ fontWeight: 700 }}>{hackathon.org}</p>
                  <p className="text-gray-400 text-xs">جهة رسمية موثّقة ✓</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {hackathon.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  آخر تسجيل: {hackathon.deadline}
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {hackathon.type}
                </div>
              </div>
            </div>
 
            {/* Why Participate */}
            <div className="bg-[#e35654] rounded-2xl p-5 text-white">
              <h3 className="mb-3" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                🚀 لماذا تشارك؟
              </h3>
              <ul className="space-y-2 text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  جوائز تصل لـ {hackathon.prize}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  تواصل مع {hackathon.participants}+ مشارك متميز
                </li>
                <li className="flex items-start gap-2">
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  شهادة مشاركة رسمية من {hackathon.org}
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  فرص توظيف وشراكات مع الرعاة
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
 
      {/* Registration Modal */}
      {showRegModal && (
        <RegistrationModal
          hackathonId={hackathon.id}
          hackathonTitle={hackathon.title}
          onClose={() => setShowRegModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </>
  );
}
