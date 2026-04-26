import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  ArrowRight,
  Calendar,
  Trophy,
  Eye,
  Users,
  Clock,
  Star,
  ChevronDown,
  Play,
  Sparkles,
  MapPin,
} from "lucide-react";


const hackathons = [
  {
    id: 1,
    title: "هاكاثون شفاء التقني",
    org: "وزارة الصحة",
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
    cover: "bg-gradient-to-br from-green-800 via-teal-700 to-cyan-600",
    coverText: "HEALTH\nhackathon",
    featured: true,
    location: "الرياض",
    skills: ["Python", "React", "Data Analysis"],
    maxTeam: 5,
    registrationOpen: true,
  },
  {
    id: 2,
    title: "هاكاثون مستقبل المال 2.0",
    org: "ساب تك",
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
    cover: "bg-gradient-to-br from-blue-800 via-indigo-700 to-purple-600",
    coverText: "FINTECH\nhackathon",
    featured: true,
    location: "جدة + إلكتروني",
    skills: ["Blockchain", "Node.js", "Solidity"],
    maxTeam: 4,
    registrationOpen: true,
  },
  {
    id: 3,
    title: "هاكاثون الدرع التقني 2025",
    org: "مؤسسة ريادة",
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
    cover: "bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900",
    coverText: "CYBER\nSECURITY",
    featured: false,
    location: "إلكتروني",
    skills: ["Pentesting", "CTF", "Network Security"],
    maxTeam: 3,
    registrationOpen: false,
  },
  {
    id: 4,
    title: "هاكاثون NEOM للابتكار",
    org: "مؤسسة نيوم",
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
    cover: "bg-gradient-to-br from-amber-700 via-orange-600 to-[#72112e]",
    coverText: "NEOM\n2025",
    featured: true,
    location: "نيوم، تبوك",
    skills: ["IoT", "AI", "Smart Systems"],
    maxTeam: 6,
    registrationOpen: true,
  },
  {
    id: 5,
    title: "هاكاثون الطاقة المتجددة",
    org: "أرامكو السعودية",
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
    cover: "bg-gradient-to-br from-emerald-700 via-green-600 to-teal-700",
    coverText: "ENERGY\nHACK",
    featured: false,
    location: "الظهران + إلكتروني",
    skills: ["Embedded Systems", "Data Science", "Cloud"],
    maxTeam: 5,
    registrationOpen: true,
  },
  {
    id: 6,
    title: "قمة الذكاء الاصطناعي العالمية",
    org: "STC",
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
    cover: "bg-gradient-to-br from-violet-800 via-purple-700 to-indigo-800",
    coverText: "AI\nSUMMIT",
    featured: false,
    location: "إلكتروني",
    skills: ["Python", "TensorFlow", "LLMs"],
    maxTeam: 4,
    registrationOpen: true,
  },
];

const typeOptions = ["الكل", "حضوري", "إلكتروني", "هجين"];
const sortOptions = ["الأحدث", "الجائزة الأكبر", "الأكثر مشاهدة"];

export function ParticipantHackathons() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("الكل");
  const [sort, setSort] = useState("الأحدث");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);

  const filtered = hackathons
    .filter((h) => {
      const matchSearch =
        h.title.includes(search) ||
        h.org.includes(search) ||
        h.tags.some((t) => t.includes(search));
      const matchType = activeType === "الكل" || h.type === activeType;
      const matchFeatured = !onlyFeatured || h.featured;
      const matchOpen = !onlyOpen || h.registrationOpen;
      return matchSearch && matchType && matchFeatured && matchOpen;
    })
    .sort((a, b) => {
      if (sort === "الجائزة الأكبر")
        return parseInt(b.prize.replace(/\D/g, "")) - parseInt(a.prize.replace(/\D/g, ""));
      if (sort === "الأكثر مشاهدة") return b.viewers - a.viewers;
      return b.id - a.id;
    });

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          {/* Title & Back Button */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/participant")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                الهاكاثونات
              </h1>
              <p className="text-sm text-gray-500">
                اكتشف واستكشف الهاكاثونات المتاحة
              </p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، الجهة، أو الموضوع..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#a41b42] focus:ring-2 focus:ring-[#a41b42]/10 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {typeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    activeType === t
                      ? "bg-white text-[#a41b42] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{ fontWeight: activeType === t ? 600 : 400 }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:border-[#a41b42] cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {sortOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setOnlyFeatured(!onlyFeatured)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                onlyFeatured
                  ? "bg-[#a41b42] text-white border-[#a41b42]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#a41b42]/40"
              }`}
              style={{ fontWeight: 600 }}
            >
              <Star className="w-3.5 h-3.5" />
              المميزة فقط
            </button>
            <button
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                onlyOpen
                  ? "bg-[#10b981] text-white border-[#10b981]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#10b981]/40"
              }`}
              style={{ fontWeight: 600 }}
            >
              <Play className="w-3 h-3" />
              التسجيل مفتوح
            </button>
            <span className="text-gray-400 text-xs">{filtered.length} نتيجة</span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
              لا توجد نتائج مطابقة
            </p>
            <p className="text-gray-400 text-xs mt-1">جرّب كلمة بحث مختلفة أو غيّر الفلتر</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((h) => (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col"
              >
                {/* Cover */}
                <div className={`h-44 ${h.cover} relative flex items-end p-4`}>
                  {h.featured && (
                    <div className="absolute top-3 right-3">
                      <span
                        className="flex items-center gap-1 bg-[#a41b42] text-white text-xs px-2.5 py-1 rounded-full"
                        style={{ fontWeight: 600 }}
                      >
                        <Star className="w-3 h-3" />
                        مميز
                      </span>
                    </div>
                  )}
                  {/* Registration status */}
                  <div className="absolute top-3 left-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: h.registrationOpen ? "#f0fdf4" : "#f3f4f6",
                        color: h.registrationOpen ? "#10b981" : "#9ca3af",
                        fontWeight: 600,
                      }}
                    >
                      {h.registrationOpen ? "تسجيل مفتوح" : "التسجيل مغلق"}
                    </span>
                  </div>
                  {/* Type */}
                  <div className="absolute bottom-3 left-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
                      style={{ background: h.typeBg + "dd", color: h.typeColor, fontWeight: 600 }}
                    >
                      {h.type}
                    </span>
                  </div>
                  <p
                    className="text-white/25 select-none whitespace-pre-line leading-tight"
                    style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.8rem" }}
                  >
                    {h.coverText}
                  </p>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {h.tags.map((tag, ti) => (
                      <span
                        key={ti}
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{
                          background: h.tagColors[ti % h.tagColors.length] + "15",
                          color: h.tagColors[ti % h.tagColors.length],
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-gray-900 mb-0.5" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    {h.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                    {h.org}
                    <span className="text-gray-200">•</span>
                    <MapPin className="w-3 h-3" />
                    {h.location}
                  </p>

                  {/* Skills needed */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {h.skills.map((s) => (
                      <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      {h.date}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-[#f59e0b]" />
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>{h.prize}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#a41b42]" />
                      <span>آخر تسجيل: {h.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      {h.teams} فريق • حتى {h.maxTeam} أعضاء
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-3 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        {h.viewers} مشاهدة
                      </span>
                      <button
                        onClick={() => navigate(`/participant/hackathon/${h.id}`)}
                        disabled={!h.registrationOpen}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs transition-all group-hover:shadow-md ${
                          h.registrationOpen
                            ? "bg-[#a41b42] text-white hover:bg-[#8b1538] shadow-sm shadow-[#a41b42]/20"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {h.registrationOpen ? (
                          <>
                            <Play className="w-3 h-3" />
                            سجّل الآن
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            عرض التفاصيل
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}