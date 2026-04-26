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
 
const hackathonsData = [
  {
    id: 1,
    title: "هاكاثون شفاء التقني",
    org: "وزارة الصحة",
    orgLogo: "ص",
    orgColor: "#a41b42",
    tags: ["بيانات ضخمة", "الصحة الرقمية"],
    tagColors: ["#a41b42", "#6366f1"],
    type: "حضوري",
    typeColor: "#a41b42",
    typeBg: "#fef2f2",
    date: "01 يونيو 2025",
    deadline: "15 مايو 2025",
    prize: "75,000 ر.س",
    viewers: 124,
    teams: 48,
    cover: "from-green-800 via-teal-700 to-cyan-600",
    coverText: "HEALTH\nhackathon",
    featured: true,
    location: "الرياض، المملكة العربية السعودية",
    duration: "48 ساعة",
    participants: 230,
    maxTeam: 5,
    registrationOpen: true,
    desc: "هاكاثون وطني متخصص في ابتكار حلول تقنية لقطاع الصحة، يجمع أفضل العقول التقنية لتطوير منصات وأدوات رقمية تُحسّن جودة الرعاية الصحية في المملكة. الحدث يُقام بالشراكة مع وزارة الصحة ضمن مبادرات رؤية 2030.",
    skills: ["Python", "React", "Data Analysis", "Machine Learning", "Healthcare APIs"],
    prizes: [
      { rank: "المركز الأول", amount: "40,000 ر.س", icon: "🥇", color: "#f59e0b" },
      { rank: "المركز الثاني", amount: "20,000 ر.س", icon: "🥈", color: "#94a3b8" },
      { rank: "المركز الثالث", amount: "15,000 ر.س", icon: "🥉", color: "#92400e" },
    ],
    timeline: [
      { date: "15 مايو", label: "آخر موعد للتسجيل", done: true },
      { date: "22 مايو", label: "الإعلان عن الفرق المقبولة", done: true },
      { date: "01 يونيو", label: "انطلاق الهاكاثون", done: false },
      { date: "03 يونيو", label: "التسليم النهائي", done: false },
      { date: "05 يونيو", label: "حفل التكريم والجوائز", done: false },
    ],
  },
  {
    id: 2,
    title: "هاكاثون مستقبل المال 2.0",
    org: "ساب تك",
    orgLogo: "س",
    orgColor: "#6366f1",
    tags: ["التقنية المالية", "بلوكشين"],
    tagColors: ["#10b981", "#f59e0b"],
    type: "هجين",
    typeColor: "#6366f1",
    typeBg: "#eef2ff",
    date: "12 يونيو 2025",
    deadline: "28 مايو 2025",
    prize: "100,000 ر.س",
    viewers: 98,
    teams: 62,
    cover: "from-blue-800 via-indigo-700 to-purple-600",
    coverText: "FINTECH\nhackathon",
    featured: true,
    location: "جدة + إلكتروني",
    duration: "72 ساعة",
    participants: 310,
    maxTeam: 4,
    registrationOpen: true,
    desc: "منافسة تقنية مالية تجمع شركات الناشئة والمطورين المستقلين لبناء حلول مبتكرة في مجالات المدفوعات الرقمية والبلوكشين والتمويل اللامركزي.",
    skills: ["Blockchain", "Node.js", "Solidity", "Smart Contracts", "FinTech APIs"],
    prizes: [
      { rank: "المركز الأول", amount: "50,000 ر.س", icon: "🥇", color: "#f59e0b" },
      { rank: "المركز الثاني", amount: "30,000 ر.س", icon: "🥈", color: "#94a3b8" },
      { rank: "المركز الثالث", amount: "20,000 ر.س", icon: "🥉", color: "#92400e" },
    ],
    timeline: [
      { date: "28 مايو", label: "آخر موعد للتسجيل", done: true },
      { date: "04 يونيو", label: "الإعلان عن الفرق المقبولة", done: false },
      { date: "12 يونيو", label: "انطلاق الهاكاثون", done: false },
      { date: "15 يونيو", label: "التسليم النهائي", done: false },
      { date: "18 يونيو", label: "حفل التكريم والجوائز", done: false },
    ],
  },
  {
    id: 3,
    title: "هاكاثون الدرع التقني 2025",
    org: "مؤسسة ريادة",
    orgLogo: "ر",
    orgColor: "#06b6d4",
    tags: ["الأمن السيبراني", "تطبيقات الويب"],
    tagColors: ["#06b6d4", "#8b5cf6"],
    type: "إلكتروني",
    typeColor: "#10b981",
    typeBg: "#f0fdf4",
    date: "25 مايو 2025",
    deadline: "10 مايو 2025",
    prize: "16,000 ر.س",
    viewers: 76,
    teams: 31,
    cover: "from-gray-800 via-slate-700 to-gray-900",
    coverText: "CYBER\nSECURITY",
    featured: false,
    location: "إلكتروني بالكامل",
    duration: "36 ساعة",
    participants: 155,
    maxTeam: 3,
    registrationOpen: false,
    desc: "هاكاثون متخصص في اكتشاف ثغرات الأمن السيبراني وبناء حلول دفاعية للتطبيقات والأنظمة.",
    skills: ["Pentesting", "CTF", "Network Security", "Web Security"],
    prizes: [
      { rank: "المركز الأول", amount: "8,000 ر.س", icon: "🥇", color: "#f59e0b" },
      { rank: "المركز الثاني", amount: "5,000 ر.س", icon: "🥈", color: "#94a3b8" },
      { rank: "المركز الثالث", amount: "3,000 ر.س", icon: "🥉", color: "#92400e" },
    ],
    timeline: [
      { date: "10 مايو", label: "آخر موعد للتسجيل", done: true },
      { date: "18 مايو", label: "الإعلان عن الفرق المقبولة", done: true },
      { date: "25 مايو", label: "انطلاق الهاكاثون", done: false },
      { date: "26 مايو", label: "التسليم النهائي", done: false },
      { date: "28 مايو", label: "حفل التكريم والجوائز", done: false },
    ],
  },
  {
    id: 4,
    title: "هاكاثون NEOM للابتكار",
    org: "مؤسسة نيوم",
    orgLogo: "ن",
    orgColor: "#f59e0b",
    tags: ["المدن الذكية", "الاستدامة"],
    tagColors: ["#f59e0b", "#10b981"],
    type: "حضوري",
    typeColor: "#a41b42",
    typeBg: "#fef2f2",
    date: "20 يوليو 2025",
    deadline: "5 يوليو 2025",
    prize: "200,000 ر.س",
    viewers: 310,
    teams: 85,
    cover: "from-amber-700 via-orange-600 to-red-700",
    coverText: "NEOM\n2025",
    featured: true,
    location: "نيوم، تبوك",
    duration: "72 ساعة",
    participants: 425,
    maxTeam: 6,
    registrationOpen: true,
    desc: "أضخم هاكاثون في المملكة لعام 2025، يُقام في قلب مدينة نيوم المستقبلية. يستهدف المبتكرين من مجالات البناء الذكي، والطاقة المستدامة، والمواصلات المستقبلية.",
    skills: ["IoT", "AI", "Smart Systems", "Robotics", "Sustainability Tech"],
    prizes: [
      { rank: "المركز الأول", amount: "100,000 ر.س", icon: "🥇", color: "#f59e0b" },
      { rank: "المركز الثاني", amount: "60,000 ر.س", icon: "🥈", color: "#94a3b8" },
      { rank: "المركز الثالث", amount: "40,000 ر.س", icon: "🥉", color: "#92400e" },
    ],
    timeline: [
      { date: "5 يوليو", label: "آخر موعد للتسجيل", done: false },
      { date: "12 يوليو", label: "الإعلان عن الفرق المقبولة", done: false },
      { date: "20 يوليو", label: "انطلاق الهاكاثون", done: false },
      { date: "23 يوليو", label: "التسليم النهائي", done: false },
      { date: "25 يوليو", label: "حفل التكريم والجوائز", done: false },
    ],
  },
  {
    id: 5,
    title: "هاكاثون الطاقة المتجددة",
    org: "أرامكو السعودية",
    orgLogo: "أ",
    orgColor: "#10b981",
    tags: ["الطاقة", "الاستدامة", "IoT"],
    tagColors: ["#10b981", "#06b6d4", "#8b5cf6"],
    type: "هجين",
    typeColor: "#6366f1",
    typeBg: "#eef2ff",
    date: "10 أغسطس 2025",
    deadline: "25 يوليو 2025",
    prize: "150,000 ر.س",
    viewers: 189,
    teams: 54,
    cover: "from-emerald-700 via-green-600 to-teal-700",
    coverText: "ENERGY\nHACK",
    featured: false,
    location: "الظهران + إلكتروني",
    duration: "48 ساعة",
    participants: 270,
    maxTeam: 5,
    registrationOpen: true,
    desc: "هاكاثون تنظمه أرامكو السعودية لاستقطاب أفضل العقول التقنية لتطوير حلول مستدامة في قطاع الطاقة المتجددة والإنترنت الصناعي للأشياء.",
    skills: ["Embedded Systems", "Data Science", "Cloud", "IoT Protocols"],
    prizes: [
      { rank: "المركز الأول", amount: "75,000 ر.س", icon: "🥇", color: "#f59e0b" },
      { rank: "المركز الثاني", amount: "45,000 ر.س", icon: "🥈", color: "#94a3b8" },
      { rank: "المركز الثالث", amount: "30,000 ر.س", icon: "🥉", color: "#92400e" },
    ],
    timeline: [
      { date: "25 يوليو", label: "آخر موعد للتسجيل", done: false },
      { date: "1 أغسطس", label: "الإعلان عن الفرق المقبولة", done: false },
      { date: "10 أغسطس", label: "انطلاق الهاكاثون", done: false },
      { date: "12 أغسطس", label: "التسليم النهائي", done: false },
      { date: "15 أغسطس", label: "حفل التكريم والجوائز", done: false },
    ],
  },
  {
    id: 6,
    title: "قمة الذكاء الاصطناعي العالمية",
    org: "STC",
    orgLogo: "STC",
    orgColor: "#8b5cf6",
    tags: ["ذكاء اصطناعي", "تعلم آلي"],
    tagColors: ["#8b5cf6", "#a41b42"],
    type: "إلكتروني",
    typeColor: "#10b981",
    typeBg: "#f0fdf4",
    date: "5 سبتمبر 2025",
    deadline: "20 أغسطس 2025",
    prize: "120,000 ر.س",
    viewers: 241,
    teams: 70,
    cover: "from-violet-800 via-purple-700 to-indigo-800",
    coverText: "AI\nSUMMIT",
    featured: false,
    location: "إلكتروني بالكامل",
    duration: "48 ساعة",
    participants: 350,
    maxTeam: 4,
    registrationOpen: true,
    desc: "قمة تقنية عالمية لتطوير حلول الذكاء الاصطناعي والتعلم الآلي. تجمع المطورين والباحثين من أكثر من 20 دولة لبناء نماذج ذكاء اصطناعي تحل مشكلات حقيقية.",
    skills: ["Python", "TensorFlow", "LLMs", "PyTorch", "NLP"],
    prizes: [
      { rank: "المركز الأول", amount: "60,000 ر.س", icon: "🥇", color: "#f59e0b" },
      { rank: "المركز الثاني", amount: "35,000 ر.س", icon: "🥈", color: "#94a3b8" },
      { rank: "المركز الثالث", amount: "25,000 ر.س", icon: "🥉", color: "#92400e" },
    ],
    timeline: [
      { date: "20 أغسطس", label: "آخر موعد للتسجيل", done: false },
      { date: "28 أغسطس", label: "الإعلان عن الفرق المقبولة", done: false },
      { date: "5 سبتمبر", label: "انطلاق الهاكاثون", done: false },
      { date: "7 سبتمبر", label: "التسليم النهائي", done: false },
      { date: "10 سبتمبر", label: "حفل التكريم والجوائز", done: false },
    ],
  },
];
 
// ─── Registration Modal ───────────────────────────────────────────────────────
function RegistrationModal({
  hackathonTitle,
  onClose,
  onSuccess,
}: {
  hackathonTitle: string;
  onClose: () => void;
  onSuccess: (type: "solo" | "team") => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"type" | "team">("type");
  const [participationType, setParticipationType] = useState<"solo" | "team" | null>(null);
  const [teamMethod, setTeamMethod] = useState<"email" | "ai" | null>(null);
  const [email, setEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
 
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
 
  const handleConfirm = () => {
    if (participationType === "team" && teamMethod === "ai") {
      navigate("/participant/matchmaking");
      return;
    }
    onSuccess(participationType!);
    onClose();
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
                      ? "border-[#a41b42] bg-[#fef2f2]"
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
                  teamMethod === "email" ? "border-[#a41b42] bg-[#fef2f2]" : "border-gray-100"
                }`}
              >
                <input
                  type="radio"
                  name="teamMethod"
                  checked={teamMethod === "email"}
                  onChange={() => setTeamMethod("email")}
                  className="mt-0.5 accent-[#a41b42]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#a41b42]" />
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
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#a41b42]"
                          dir="ltr"
                        />
                        <button
                          onClick={handleAddEmail}
                          className="px-3 py-1.5 rounded-lg bg-[#a41b42] text-white text-xs"
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
                              className="flex items-center gap-1 bg-[#fef2f2] text-[#a41b42] px-2 py-0.5 rounded-full text-xs"
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
            disabled={!participationType || (participationType === "team" && !teamMethod)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${
              participationType && (participationType === "solo" || teamMethod)
                ? "bg-[#a41b42] text-white hover:bg-[#8a1537] shadow-md"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontWeight: 600 }}
          >
            {participationType === "team" && teamMethod === "ai" ? (
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
 
  const hackathon = hackathonsData.find((h) => h.id === Number(id)) || hackathonsData[0];
 
  // قراءة حالة التسجيل القادمة من SmartMatchmaking
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
                className="flex items-center gap-1.5 bg-[#a41b42] text-white text-xs px-3 py-1.5 rounded-full"
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
              { icon: Calendar, label: "تاريخ الانطلاق", value: hackathon.date, color: "#a41b42" },
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
                <Globe className="w-4 h-4 text-[#a41b42]" />
                عن الهاكاثون
              </h2>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: "0.9rem" }}>
                {hackathon.desc}
              </p>
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                {[
                  { label: "المشاركون", value: hackathon.participants, icon: Users, color: "#6366f1" },
                  { label: "المشاهدات", value: hackathon.viewers, icon: Eye, color: "#a41b42" },
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
                <Code className="w-4 h-4 text-[#a41b42]" />
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
                <Calendar className="w-4 h-4 text-[#a41b42]" />
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
                          background: item.done ? "#a41b42" : "white",
                          borderColor: item.done ? "#a41b42" : "#e5e7eb",
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
                            color: item.done ? "#a41b42" : "#6b7280",
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
            <div className={`bg-white rounded-2xl border-2 p-5 sticky top-4 ${registered ? "border-green-200" : "border-gray-100"}`}>
              {registered ? (
                <>
                  {/* ── Registered State ── */}
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
                      <span className="text-[#a41b42]" style={{ fontWeight: 600 }}>{hackathon.deadline}</span>
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
                    className="w-full py-3 rounded-xl text-sm bg-[#a41b42] text-white hover:bg-[#8a1537] shadow-md shadow-[#a41b42]/25 transition-all flex items-center justify-center gap-2"
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
            <div className="bg-gradient-to-br from-[#a41b42] to-[#c03c3a] rounded-2xl p-5 text-white">
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
          hackathonTitle={hackathon.title}
          onClose={() => setShowRegModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </>
  );
}