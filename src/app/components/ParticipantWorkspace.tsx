import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
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

// ── Hackathons Data ──────────────────────────────────────────────
const myHackathons = [
  {
    id: 1,
    name: "قمة الذكاء الاصطناعي العالمية",
    status: "مقبول",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    note: "تبقى 12 يوماً على الموعد النهائي لتسليم المشروع الأولي.",
    image: IMG_AI,
    track: "الذكاء الاصطناعي",
    organizer: "STC",
    location: "إلكتروني بالكامل",
    tags: ["إلكتروني", "ذكاء اصطناعي", "تعلم آلي"],
    description: "قمة تقنية عالمية لتطوير حلول الذكاء الاصطناعي والتعلم الآلي. تجمع المطورين والباحثين من أكثر من 20 دولة لبناء نماذج ذكاء اصطناعي تحل مشكلات حقيقية في مجالات الصحة والتعليم والطاقة والمالية.",
    startDate: "1 أكتوبر 2025",
    endDate: "15 أكتوبر 2025",
    submissionDate: "13 أكتوبر 2025",
    daysLeft: 10,
    hoursLeft: 5,
    minutesLeft: 32,
  },
  {
    id: 2,
    name: "تحدي المن السيبراني للمحترفين",
    status: "مقبول",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    note: "تم القبول في فريقك. يمكنك البدء في مرحلة النماذج الأولية.",
    image: IMG_CYBER,
    track: "الأمن السيبراني",
    organizer: "CITC",
    location: "الرياض، السعودية",
    tags: ["حضوري", "أمن سيبراني", "اختراق أخلاقي"],
    description: "تحدي وطني لتطوير حلول أمن سيبراني متقدمة لحماية البنية التحتية الرقمية.",
    startDate: "15 أكتوبر 2025",
    endDate: "30 أكتوبر 2025",
    submissionDate: "28 أكتوبر 2025",
    daysLeft: 25,
    hoursLeft: 10,
    minutesLeft: 45,
  },
  {
    id: 3,
    name: "هاكاثون حلول المدن الذكية",
    status: "مقبول",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    note: "انضم إلى فريقك وابدأ التخطيط للمشروع.",
    image: IMG_CITY,
    track: "المدن الذكية",
    organizer: "NEOM",
    location: "جدة، السعودية",
    tags: ["هجين", "IoT", "مدن ذكية"],
    description: "مسابقة لابتكار حلول تقنية للمدن الذكية باستخدام إنترنت الأشياء واتقنيات الحديثة.",
    startDate: "1 نوفمبر 2025",
    endDate: "20 نوفمبر 2025",
    submissionDate: "18 نوفمبر 2025",
    daysLeft: 40,
    hoursLeft: 15,
    minutesLeft: 20,
  },
];

// ─── Types ──────────────────────────────────────────────
type WorkspaceTab = "home" | "team" | "submission" | "evaluations" | "certificates" | "sessions";

// ─── Team Data ──────────────────────────────────────────
const teamMembers = [
  { name: "أحمد محمد", role: "مطوّر Full Stack", color: "#e35654", initials: "أ", you: true, online: true },
  { name: "ريم العتيبي", role: "مصممة UI/UX", color: "#6366f1", initials: "ر", online: true },
  { name: "عبدالله الغامدي", role: "مطوّر AI/ML", color: "#10b981", initials: "ع", online: false },
  { name: "نورة الشمري", role: "محللة بيانات", color: "#f59e0b", initials: "ن", online: true },
];

const chatMessages = [
  { id: 1, sender: "ريم العتيبي", avatar: "ر", color: "#6366f1", text: "خلصت تصميم الواجهة الرئيسية 🎨", time: "10:30 ص", mine: false },
  { id: 2, sender: "أنت", avatar: "أ", color: "#e35654", text: "ممتاز! أنا أشتغل على الـ API حالياً", time: "10:32 ص", mine: true },
  { id: 3, sender: "عبدالله الغامدي", avatar: "ع", color: "#10b981", text: "النموذج جاهز للتجربة، أرسلته على GitHub 💻", time: "10:45 ص", mine: false },
  { id: 4, sender: "نورة الشمري", avatar: "ن", color: "#f59e0b", text: "جمعت البيانات المطلوبة وجهزت الـ Dashboard", time: "11:00 ص", mine: false },
];

// ─── Evaluations Data ───────────────────────────────────
const evaluations = [
  {
    judge: "د. فهد العمري",
    role: "خبير ذكاء اصطناعي",
    score: 88,
    maxScore: 100,
    criteria: [
      { name: "الابتكار", score: 92 },
      { name: "الجدوى التقنية", score: 85 },
      { name: "جودة العرض", score: 90 },
      { name: "التأثير المجتمعي", score: 84 },
    ],
    comment: "مشروع متميز من ناحية الابتكار. التطبيق العملي للنموذج ممتاز وواجهة المستخدم سلسة.",
    date: "15 سبتمبر 2025",
  },
  {
    judge: "أ. سارة الحربي",
    role: "مديرة منتجات تقنية",
    score: 82,
    maxScore: 100,
    criteria: [
      { name: "الابتكار", score: 80 },
      { name: "الجدوى التقنية", score: 88 },
      { name: "جودة العرض", score: 78 },
      { name: "التأثير المجتمعي", score: 82 },
    ],
    comment: "عمل جيد في الجانب التقني. أقترح تحسين طريقة عرض البيانات وإضافة أمثلة حية.",
    date: "16 سبتمبر 2025",
  },
];

// ─── Certificates Data ──────────────────────────────────
const certificates = [
  { id: 1, title: "شهادة مشاركة", hackathon: "قمة الذكاء الاصطناعي العالمية", date: "20 سبتمبر 2025", type: "مشاركة", color: "#6366f1" },
  { id: 2, title: "شهادة المركز الثاني", hackathon: "هاكاثون التقنية المالية", date: "15 أغسطس 2025", type: "فوز", color: "#f59e0b" },
  { id: 3, title: "شهادة إكمال التدريب", hackathon: "ورشة تحضيرية - الذكاء الاصطناعي", date: "1 أغسطس 2025", type: "تدريب", color: "#10b981" },
];

// ─── Project Files ──────────────────────────────────────
const projectFiles = [
  { name: "العرض التقديمي النهائي.pdf", size: "4.2 MB", color: "#e35654", date: "18 سبتمبر 2025" },
  { name: "الكود المصدري.zip", size: "12.8 MB", color: "#6366f1", date: "18 سبتمبر 2025" },
  { name: "فيديو توضيحي.mp4", size: "45.3 MB", color: "#10b981", date: "17 سبتمبر 2025" },
];

// ─── Submission Requirements ──────────────────────────────
const submissionRequirements = [
  { id: 1, title: "العرض التقديمي", description: "عرض تقديمي شامل عن المشروع (PDF أو PPT)", completed: true },
  { id: 2, title: "الكود المصدري", description: "رابط GitHub أو ملف ZIP يحتوي على الكود الكامل", completed: true },
  { id: 3, title: "فيديو توضيحي", description: "فيديو يشرح المشروع والحل المقترح (3-5 دقائق)", completed: true },
  { id: 4, title: "ملف README", description: "وثيقة تشرح كيفية تشغيل المشروع وفكرته", completed: false },
  { id: 5, title: "البيانات التجريبية", description: "عينة من البيانات المستخدمة في التدريب (إن وجد)", completed: false },
];

// ─── Sessions Data ──────────────────────────────────────
const sessions = [
  {
    id: 1,
    title: "جلسة الافتتاح والتوجيه",
    type: "zoom",
    date: "1 أكتوبر 2025",
    time: "10:00 ص",
    duration: "ساعة واحدة",
    status: "completed",
    link: "https://zoom.us/j/123456789",
    description: "جلسة ترحيبية وتوجيهية للمشاركين مع شرح قواعد المسابقة والجدول الزمني.",
  },
  {
    id: 2,
    title: "ورشة تدريبية: مقدمة في التعلم الآلي",
    type: "zoom",
    date: "3 أكتوبر 2025",
    time: "6:00 م",
    duration: "ساعتان",
    status: "upcoming",
    link: "https://zoom.us/j/987654321",
    description: "ورشة عملية لتعلم أساسيات التعلم الآلي وتطبيقاتها العملية.",
  },
  {
    id: 3,
    title: "جلسة الإرشاد مع الخبراء",
    type: "teams",
    date: "7 أكتوبر 2025",
    time: "4:00 م",
    duration: "3 ساعات",
    status: "upcoming",
    link: "https://teams.microsoft.com/l/meetup-join/123",
    description: "جلسة استشارية مفتوحة مع خبراء في الذكاء الاصطناعي للإجابة على أسئلة الفرق.",
  },
  {
    id: 4,
    title: "العرض التقديمي النهائي",
    type: "zoom",
    date: "13 أكتوبر 2025",
    time: "2:00 م",
    duration: "4 ساعات",
    status: "scheduled",
    link: "https://zoom.us/j/456789123",
    description: "جلسة العروض التقديمية النهائية أمام لجنة التحكيم.",
  },
];

// ─── Timeline Data ──────────────────────────────────────
const timeline = [
  { phase: "التسجيل والقبول", date: "15-30 سبتمبر", status: "completed", color: "#10b981" },
  { phase: "بداية المسابقة", date: "1 أكتوبر", status: "completed", color: "#10b981" },
  { phase: "تطوير النماذج الأولية", date: "1-7 أكتوبر", status: "active", color: "#e35654" },
  { phase: "التسليم الأولي", date: "7 أكتوبر", status: "upcoming", color: "#6b7280" },
  { phase: "التطوير النهائي", date: "8-12 أكتوبر", status: "upcoming", color: "#6b7280" },
  { phase: "التسليم النهائي", date: "13 أكتوبر", status: "upcoming", color: "#6b7280" },
  { phase: "العروض التقديمية", date: "13 أكتوبر", status: "upcoming", color: "#6b7280" },
  { phase: "إعلان النتائج", date: "15 أكتوبر", status: "upcoming", color: "#6b7280" },
];

// ─── Sidebar Cards ──────────────────────────────────────
const sidebarCards: { tab: WorkspaceTab; icon: any; label: string; desc: string; color: string; bg: string; badge?: string }[] = [
  { tab: "home", icon: Home, label: "الرئيسية", desc: "نظرة عامة على الهاكاثون", color: "#6366f1", bg: "#eef2ff" },
  { tab: "team", icon: Users, label: "بيانات الفريق", desc: "التواصل مع أعضاء فريقك", color: "#10b981", bg: "#f0fdf4", badge: "4" },
  { tab: "sessions", icon: Video, label: "الجلسات", desc: "الانضمام للجلسات المباشرة", color: "#06b6d4", bg: "#ecfeff", badge: "4" },
  { tab: "submission", icon: Upload, label: "رفع المشروع", desc: "رفع ومعاينة التسليمات", color: "#e35654", bg: "#fef2f2", badge: "3" },
  { tab: "evaluations", icon: BarChart3, label: "التقييمات", desc: "تقييمات الحكام لمشروعك", color: "#f59e0b", bg: "#fffbeb", badge: "2" },
  { tab: "certificates", icon: Award, label: "الشهادات", desc: "عرض وتحميل شهاداتك", color: "#8b5cf6", bg: "#f5f3ff", badge: "3" },
];

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
export function ParticipantWorkspace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hackathonId = searchParams.get("id");
  const selectedHackathon = hackathonId ? myHackathons.find(h => h.id === Number(hackathonId)) : null;

  // إذا لم يتم اختيار هاكاثون، اعرض القائمة
  if (!hackathonId || !selectedHackathon) {
    return <WorkspacesList />;
  }

  // إذا تم اختيار هاكاثون، اعرض مساحة العمل
  return <WorkspaceDetails hackathon={selectedHackathon} />;
}

// ═══════════════════════════════════════════════════════════
// Workspaces List
// ═══════════════════════════════════════════════════════════
function WorkspacesList() {
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myHackathons.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img src={h.image} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
                <div className="absolute bottom-4 right-4 left-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-3 py-1.5 rounded-full text-white shadow-md" style={{ background: "#e35654", fontWeight: 600 }}>
                      {h.track}
                    </span>
                    <span
                      className="text-xs px-3 py-1.5 rounded-full shadow-md"
                      style={{ background: h.statusBg, color: h.statusColor, fontWeight: 600 }}
                    >
                      {h.status}
                    </span>
                  </div>
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
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Workspace Details
// ══════════════════════════════════════════════════════════
function WorkspaceDetails({ hackathon }: { hackathon: typeof myHackathons[0] }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("home");

  return (
    <div className="min-h-screen bg-[#f7f7f6]">
      {/* ═══ Hero Section ═══ */}
      <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2d1b69 0%, #4c2885 30%, #6b3fa0 60%, #8b5cf6 100%)",
          }}
        />
        {/* Overlay pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${IMG_HERO})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(45,27,105,0.85) 0%, rgba(76,40,133,0.7) 100%)" }} />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate("/participant/workspace")}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
            العودة لمساحات العمل
          </button>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {hackathon.tags.map((tag, i) => (
              <span
                key={tag}
                className="px-4 py-1.5 rounded-full text-xs text-white"
                style={{
                  background: i === 0 ? "rgba(139,92,246,0.9)" : "rgba(255,255,255,0.15)",
                  fontWeight: 600,
                  backdropFilter: "blur(10px)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            className="text-white mb-3"
            style={{ fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2.2rem)", lineHeight: 1.3 }}
          >
            {hackathon.name}
          </h1>

          {/* Info Row */}
          <div className="flex items-center gap-4 text-white/80 text-sm mb-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs" style={{ fontWeight: 800 }}>
                {hackathon.organizer.substring(0, 2)}
              </div>
              <span>{hackathon.organizer}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{hackathon.location}</span>
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
              return (
                <button
                  key={card.tab}
                  onClick={() => setActiveTab(card.tab)}
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
                        {card.badge && (
                          <span
                            className="text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: card.color, fontSize: "0.6rem", fontWeight: 700 }}
                          >
                            {card.badge}
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
            {activeTab === "team" && <TeamTab />}
            {activeTab === "submission" && <SubmissionTab />}
            {activeTab === "evaluations" && <EvaluationsTab />}
            {activeTab === "certificates" && <CertificatesTab />}
            {activeTab === "sessions" && <SessionsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Home (الرئيسية)
// ═══════════════════════════════════════════════════════════
function HomeTab({ hackathon }: { hackathon: typeof myHackathons[0] }) {
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

        // تنقيص ثانية
        seconds--;

        // تحديث العداد
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
          // انتهى الوقت
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
          {timeline.map((phase, idx) => (
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
function TeamTab() {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-5 h-5" style={{ color: "#10b981" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>أعضاء الفريق</h2>
        </div>

        <div className="grid gap-4">
          {teamMembers.map((member, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: member.color, fontWeight: 700, fontSize: "1.1rem" }}
              >
                {member.initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                    {member.name}
                    {member.you && (
                      <span className="text-xs text-gray-400 mr-2" style={{ fontWeight: 400 }}>
                        (أنت)
                      </span>
                    )}
                  </p>
                  {member.online && (
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </div>
                <p className="text-gray-400 text-xs">{member.role}</p>
              </div>

              {/* Badge */}
              <span
                className="text-xs px-3 py-1 rounded-full flex-shrink-0"
                style={{
                  background: member.online ? "#f0fdf4" : "#f9fafb",
                  color: member.online ? "#10b981" : "#6b7280",
                  fontWeight: 600,
                }}
              >
                {member.online ? "نشط الآن" : "غير متصل"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Chat */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="w-5 h-5" style={{ color: "#6366f1" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>محادثة الفريق</h2>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.mine ? "flex-row-reverse" : ""}`}>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                style={{ background: msg.color, fontWeight: 700 }}
              >
                {msg.avatar}
              </div>
              <div className={`flex-1 ${msg.mine ? "text-left" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
                    {msg.sender}
                  </p>
                  <span className="text-gray-300 text-xs">{msg.time}</span>
                </div>
                <div
                  className="inline-block px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    background: msg.mine ? "#e35654" : "#f9fafb",
                    color: msg.mine ? "#fff" : "#374151",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <input
            type="text"
            placeholder="اكتب رسالتك..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] text-sm"
          />
          <button
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-colors"
            style={{ background: "#e35654" }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Submission
// ═══════════════════════════════════════════════════════════
function SubmissionTab() {
  return (
    <div className="space-y-6">
      {/* Submission Requirements */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks className="w-5 h-5" style={{ color: "#f59e0b" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>متطلبات التسليم</h2>
        </div>

        <div className="space-y-3">
          {submissionRequirements.map((req, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: req.completed ? "#10b981" : "#e5e7eb",
                  color: "#fff",
                }}
              >
                {req.completed ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm mb-1" style={{ fontWeight: 600 }}>
                  {req.title}
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {req.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Upload className="w-5 h-5" style={{ color: "#e35654" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>رفع المشروع</h2>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed rounded-2xl p-8 text-center mb-5 hover:border-[#e35654] hover:bg-[#fef2f4]/30 transition-all cursor-pointer"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#fef2f2" }}
          >
            <Upload className="w-8 h-8" style={{ color: "#e35654" }} />
          </div>
          <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            اسحب الملفات هنا أو انقر للتحميل
          </h3>
          <p className="text-gray-400 text-sm">
            PDF, ZIP, MP4 - الحد الأقصى 100 MB
          </p>
        </div>

        <button
          className="w-full py-3 rounded-xl text-white text-sm transition-colors"
          style={{ background: "#e35654", fontWeight: 600 }}
        >
          <Plus className="w-4 h-4 inline-block ml-2" />
          إضافة ملفات
        </button>
      </div>

      {/* Uploaded Files */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-5 h-5" style={{ color: "#6366f1" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>الملفات المرفوعة</h2>
        </div>

        <div className="space-y-3">
          {projectFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${file.color}15` }}
              >
                <FileText className="w-5 h-5" style={{ color: file.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm mb-1" style={{ fontWeight: 600 }}>
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#6366f1] hover:bg-blue-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#10b981] hover:bg-green-50 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#e35654] hover:bg-[#fef2f4] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Evaluations
// ═══════════════════════════════════════════════════════════
function EvaluationsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5" style={{ color: "#f59e0b" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>تقييمات المشروع</h2>
        </div>

        {evaluations.length === 0 ? (
          <div className="text-center py-10">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
              لم يتم نشر التقييمات بعد
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {evaluations.map((ev, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-100"
                style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fff 100%)" }}
              >
                {/* Judge Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {ev.judge}
                    </h3>
                    <p className="text-gray-400 text-sm">{ev.role}</p>
                  </div>
                  <div className="text-left">
                    <div
                      className="text-2xl mb-1"
                      style={{ fontWeight: 800, color: "#f59e0b" }}
                    >
                      {ev.score}/{ev.maxScore}
                    </div>
                    <p className="text-gray-400 text-xs">{ev.date}</p>
                  </div>
                </div>

                {/* Criteria */}
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

                {/* Comment */}
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-gray-400 text-xs mb-2" style={{ fontWeight: 600 }}>
                    تعليق الحكم:
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">{ev.comment}</p>
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
// Tab: Certificates
// ═══════════════════════════════════════════════════════════
function CertificatesTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5" style={{ color: "#8b5cf6" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>شهاداتي</h2>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-10">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>لا توجد شهادات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cert.color}15` }}
                >
                  <Award className="w-6 h-6" style={{ color: cert.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 text-sm mb-1" style={{ fontWeight: 700 }}>
                    {cert.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-1">{cert.hackathon}</p>
                  <p className="text-gray-300 text-xs">{cert.date}</p>
                </div>

                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition-colors"
                  style={{ background: cert.color, fontWeight: 600 }}
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Sessions (الجلسات)
// ═══════════════════════════════════════════════════════════
function SessionsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Video className="w-5 h-5" style={{ color: "#06b6d4" }} />
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>الجلسات المباشرة</h2>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-5 rounded-2xl border transition-all ${
                session.status === "upcoming"
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
                      style={{
                        background:
                          session.status === "upcoming"
                            ? "#ecfeff"
                            : session.status === "completed"
                            ? "#f0fdf4"
                            : "#fffbeb",
                        color:
                          session.status === "upcoming"
                            ? "#06b6d4"
                            : session.status === "completed"
                            ? "#10b981"
                            : "#f59e0b",
                        fontWeight: 600,
                      }}
                    >
                      {session.status === "upcoming"
                        ? "قادم"
                        : session.status === "completed"
                        ? "مكتمل"
                        : "مجدول"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mb-2">{session.description}</p>
                </div>

                {/* Platform Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
                  style={{
                    background: session.type === "zoom" ? "#ecfeff" : "#f5f3ff",
                  }}
                >
                  <Video
                    className="w-5 h-5"
                    style={{ color: session.type === "zoom" ? "#06b6d4" : "#8b5cf6" }}
                  />
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
              {session.status === "upcoming" && (
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm transition-colors"
                  style={{ background: "#06b6d4", fontWeight: 600 }}
                  onClick={() => window.open(session.link, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  الانضمام للجلسة
                </button>
              )}

              {session.status === "completed" && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span style={{ fontWeight: 600 }}>تم الانتهاء</span>
                </div>
              )}

              {session.status === "scheduled" && (
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm transition-colors"
                  style={{ borderColor: "#06b6d4", color: "#06b6d4", fontWeight: 600 }}
                >
                  <Calendar className="w-4 h-4" />
                  إضافة للتقويم
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}