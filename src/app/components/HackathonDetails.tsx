import { useState } from "react";
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
  Handshake,
  ChevronLeft,
  Building2,
  Globe,
  Zap,
  Shield,
  Crown,
  Medal,
  Award,
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
    desc: "هاكاثون وطني متخصص في ابتكار حلول تقنية لقطاع الصحة، يجمع أفضل العقول التقنية لتطوير منصات وأدوات رقمية تُحسّن جودة الرعاية الصحية في المملكة. الحدث يُقام بالشراكة مع وزارة الصحة ضمن مبادرات رؤية 2030.",
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
    desc: "منافسة تقنية مالية تجمع شركات الناشئة والمطورين المستقلين لبناء حلول مبتكرة في مجالات المدفوعات الرقمية والبلوكشين والتمويل اللامركزي. تُقدم ساب تك دعمًا تقنيًا ومرشدين متخصصين طوال فترة الهاكاثون.",
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
    desc: "هاكاثون متخصص في اكتشاف ثغرات الأمن السيبراني وبناء حلول دفاعية للتطبيقات والأنظمة. يستهدف المطورين المتخصصين في الأمن الرقمي واختبار الاختراق.",
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
    cover: "from-amber-700 via-orange-600 to-[#72112e]",
    coverText: "NEOM\n2025",
    featured: true,
    location: "نيوم، تبوك",
    duration: "72 ساعة",
    participants: 425,
    desc: "أضخم هاكاثون في المملكة لعام 2025، يُقام في قلب مدينة نيوم المستقبلية. يستهدف المبتكرين من مجالات البناء الذكي، والطاقة المستدامة، والمواصلات المستقبلية. الفائز الأول يحصل على عقد تنفيذ مشروعه في نيوم.",
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
    desc: "هاكاثون تنظمه أرامكو السعودية لاستقطاب أفضل العقول التقنية لتطوير حلول مستدامة في قطاع الطاقة المتجددة والإنترنت الصناعي للأشياء.",
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
    desc: "قمة تقنية عالمية لتطوير حلول الذكاء الاصطناعي والتعلم الآلي. تجمع المطورين والباحثين من أكثر من 20 دولة لبناء نماذج ذكاء اصطناعي تحل مشكلات حقيقية.",
    timeline: [
      { date: "20 أغسطس", label: "آخر موعد للتسجيل", done: false },
      { date: "28 أغسطس", label: "الإعلان عن الفرق المقبولة", done: false },
      { date: "5 سبتمبر", label: "انطلاق الهاكاثون", done: false },
      { date: "7 سبتمبر", label: "التسليم النهائي", done: false },
      { date: "10 سبتمبر", label: "حفل التكريم والجوائز", done: false },
    ],
  },
];

const sponsorPackages = [
  {
    id: "platinum",
    name: "بلاتينية",
    nameEn: "Platinum",
    icon: Crown,
    color: "#6366f1",
    bg: "#eef2ff",
    borderColor: "#6366f1",
    price: "50,000 ر.س",
    slots: 1,
    slotsLeft: 1,
    highlight: true,
    badge: "الأكثر تأثيراً",
    perks: [
      "الشعار الرئيسي في جميع المواد الترويجية",
      "شاشة عملاقة خلال حفل الافتتاح والختام",
      "جناح رسمي مخصص في مكان الحدث",
      "3 تذاكر VIP لحضور الحدث كاملاً",
      "خطاب ترحيبي من ممثل شركتك أمام المشاركين",
      "تقرير تفصيلي عن أثر الرعاية بعد الحدث",
      "ذكر في جميع الإعلانات الرسمية وبيانات الصحافة",
    ],
  },
  {
    id: "gold",
    name: "ذهبية",
    nameEn: "Gold",
    icon: Medal,
    color: "#f59e0b",
    bg: "#fffbeb",
    borderColor: "#f59e0b",
    price: "25,000 ر.س",
    slots: 2,
    slotsLeft: 1,
    highlight: false,
    badge: "الأكثر طلباً",
    perks: [
      "الشعار في المواد الترويجية الرئيسية",
      "شاشة خلال حفل الختام والتوزيع",
      "طاولة عرض في منطقة الراعين",
      "تذكرتان VIP لحضور الحدث",
      "ذكر في منصات التواصل الاجتماعي الرسمية",
      "تقرير مختصر عن أثر الرعاية",
    ],
  },
  {
    id: "silver",
    name: "فضية",
    nameEn: "Silver",
    icon: Award,
    color: "#64748b",
    bg: "#f8fafc",
    borderColor: "#94a3b8",
    price: "10,000 ر.س",
    slots: 4,
    slotsLeft: 2,
    highlight: false,
    badge: null,
    perks: [
      "الشعار في المواد الترويجية الثانوية",
      "ذكر في منصة المُمكّن طوال فترة الهاكاثون",
      "تذكرة حضور واحدة للحدث",
      "ذكر في منصات التواصل الاجتماعي",
    ],
  },
  {
    id: "bronze",
    name: "برونزية",
    nameEn: "Bronze",
    icon: Zap,
    color: "#92400e",
    bg: "#fef3c7",
    borderColor: "#d97706",
    price: "5,000 ر.س",
    slots: 6,
    slotsLeft: 4,
    highlight: false,
    badge: null,
    perks: [
      "الشعار في صفحة الهاكاثون الرسمية",
      "ذكر في المنصة كراعٍ داعم",
      "دعوة إلكترونية لحضور حفل التكريم",
    ],
  },
];

export function HackathonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const hackathon = hackathonsData.find((h) => h.id === Number(id)) || hackathonsData[0];

  const handleStartNegotiation = () => {
    if (!selectedPackage) return;
    navigate("/sponsor/negotiation", {
      state: {
        hackathon: hackathon.title,
        package: sponsorPackages.find((p) => p.id === selectedPackage)?.name,
      },
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f7f6]">
      {/* ── Hero Cover ── */}
      <div className={`bg-gradient-to-br ${hackathon.cover} relative overflow-hidden`}>
        {/* Decorative overlay */}
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
            onClick={() => navigate("/sponsor/opportunities")}
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
              <span className="flex items-center gap-1.5 bg-[#a41b42] text-white text-xs px-3 py-1.5 rounded-full" style={{ fontWeight: 600 }}>
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
                style={{ background: hackathon.tagColors[i % hackathon.tagColors.length] + "25", color: "white", fontWeight: 500, backdropFilter: "blur(4px)" }}
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
            <span className="text-white/80 text-sm" style={{ fontWeight: 500 }}>{hackathon.org}</span>
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
                <p className="text-white" style={{ fontWeight: 700, fontSize: "0.95rem" }}>{stat.value}</p>
                <p className="text-white/60" style={{ fontSize: "0.7rem" }}>{stat.label}</p>
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

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-gray-900 mb-5 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Calendar className="w-4 h-4 text-[#a41b42]" />
                الجدول الزمني
              </h2>
              <div className="relative">
                {/* Vertical line */}
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
                        <div className="flex items-center gap-2">
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
                        </div>
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

            {/* Sponsorship Packages */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-900 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1rem" }}>
                  <Handshake className="w-4 h-4 text-[#a41b42]" />
                  باقات الرعاية
                </h2>
                <span className="text-gray-400 text-xs">اختر الباقة المناسبة لشركتك</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {sponsorPackages.map((pkg) => {
                  const isSelected = selectedPackage === pkg.id;
                  const isFull = pkg.slotsLeft === 0;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => !isFull && setSelectedPackage(pkg.id)}
                      disabled={isFull}
                      className={`relative text-right p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isFull
                          ? "opacity-50 cursor-not-allowed border-gray-100 bg-gray-50"
                          : isSelected
                          ? "shadow-lg cursor-pointer"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm cursor-pointer"
                      }`}
                      style={{
                        borderColor: isSelected ? pkg.borderColor : undefined,
                        background: isSelected ? pkg.bg : undefined,
                      }}
                    >
                      {/* Badge */}
                      {pkg.badge && !isFull && (
                        <div
                          className="absolute -top-2.5 left-3 text-white text-xs px-2.5 py-0.5 rounded-full"
                          style={{ background: pkg.color, fontWeight: 600, fontSize: "0.65rem" }}
                        >
                          {pkg.badge}
                        </div>
                      )}

                      {/* Selected indicator */}
                      {isSelected && (
                        <div
                          className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: pkg.color }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}

                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: pkg.bg }}
                        >
                          <pkg.icon className="w-5 h-5" style={{ color: pkg.color }} />
                        </div>
                        <div>
                          <p className="text-gray-900" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                            باقة {pkg.name}
                          </p>
                          <p className="text-gray-400" style={{ fontSize: "0.7rem" }}>
                            {pkg.slotsLeft}/{pkg.slots} مقاعد متاحة
                          </p>
                        </div>
                      </div>

                      <p className="mb-3" style={{ fontWeight: 800, fontSize: "1.1rem", color: pkg.color }}>
                        {pkg.price}
                      </p>

                      <ul className="space-y-1.5">
                        {pkg.perks.slice(0, 3).map((perk, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-gray-500" style={{ fontSize: "0.72rem" }}>
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: pkg.color }} />
                            {perk}
                          </li>
                        ))}
                        {pkg.perks.length > 3 && (
                          <li className="text-gray-400" style={{ fontSize: "0.7rem", fontWeight: 500 }}>
                            +{pkg.perks.length - 3} مزايا إضافية...
                          </li>
                        )}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right Column (1/3) ── */}
          <div className="space-y-4">

            {/* CTA Card */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 sticky top-4">
              <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                ابدأ رعايتك الآن
              </h3>
              <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                اختر الباقة المناسبة لشركتك من القائمة، ثم انقر لبدء التفاوض مع المنظم
              </p>

              {/* Selected Package Preview */}
              {selectedPackage ? (
                <div
                  className="rounded-xl p-3.5 mb-4 border"
                  style={{
                    background: sponsorPackages.find((p) => p.id === selectedPackage)?.bg,
                    borderColor: sponsorPackages.find((p) => p.id === selectedPackage)?.borderColor + "50",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-xs">الباقة المختارة</span>
                    <button onClick={() => setSelectedPackage(null)} className="text-gray-400 text-xs hover:text-gray-600">✕</button>
                  </div>
                  <p className="text-gray-900" style={{ fontWeight: 700 }}>
                    باقة {sponsorPackages.find((p) => p.id === selectedPackage)?.name}
                  </p>
                  <p style={{ fontWeight: 800, color: sponsorPackages.find((p) => p.id === selectedPackage)?.color, fontSize: "1.05rem" }}>
                    {sponsorPackages.find((p) => p.id === selectedPackage)?.price}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl p-3.5 mb-4 bg-gray-50 border border-dashed border-gray-200 text-center">
                  <p className="text-gray-400 text-xs">لم تختر باقة بعد</p>
                  <p className="text-gray-300 text-xs mt-0.5">اختر من الباقات أدناه</p>
                </div>
              )}

              <button
                onClick={handleStartNegotiation}
                disabled={!selectedPackage}
                className={`w-full py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedPackage
                    ? "bg-[#a41b42] text-white hover:bg-[#8b1538] shadow-md shadow-[#a41b42]/25"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                style={{ fontWeight: 600 }}
              >
                <Handshake className="w-4 h-4" />
                ابدأ التفاوض
                {selectedPackage && <ChevronLeft className="w-4 h-4" />}
              </button>

              <p className="text-center text-gray-400 mt-3" style={{ fontSize: "0.7rem" }}>
                سيتم توجيهك لمراجعة الشروط وإتمام العقد
              </p>
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
                  <p className="text-gray-400 text-xs">جهة رسمية موثّقة</p>
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

            {/* Quick Info */}
            <div className="bg-gradient-to-br from-[#a41b42] to-[#c03c3a] rounded-2xl p-5 text-white">
              <h3 className="mb-3" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                💡 لماذا ترعى هذا الهاكاثون؟
              </h3>
              <ul className="space-y-2 text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  وصول مباشر لـ {hackathon.participants}+ مشارك متميز
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  تعزيز حضور علامتك في قطاع التقنية
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  فرصة توظيف أفضل المواهب مباشرة
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  تغطية إعلامية واسعة قبل وبعد الحدث
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
