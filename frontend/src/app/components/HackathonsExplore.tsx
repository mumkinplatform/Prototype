import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiGet } from "../../lib/api";

type OpportunityResponse = {
  items: Array<{
    id: number;
    title: string;
    slug: string | null;
    type: string | null;
    startDate: string | null;
    registrationDeadline: string | null;
    org: string | null;
    prizeTotal: number;
    tags: string[];
    packagesCount: number;
  }>;
};

const COVER_GRADIENTS = [
  "bg-gradient-to-br from-green-800 via-teal-700 to-cyan-600",
  "bg-gradient-to-br from-blue-800 via-indigo-700 to-purple-600",
  "bg-gradient-to-br from-red-800 via-rose-700 to-orange-600",
  "bg-gradient-to-br from-purple-800 via-fuchsia-700 to-pink-600",
];

const TAG_COLORS = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}
import {
  Search,
  ArrowRight,
  Calendar,
  DollarSign,
  Eye,
  Handshake,
  Filter,
  MapPin,
  Users,
  Trophy,
  Clock,
  Star,
  ChevronDown,
} from "lucide-react";

const typeOptions = ["الكل", "حضوري", "إلكتروني", "هجين"];
const sortOptions = ["الأحدث", "الجائزة الأكبر", "الأكثر مشاهدة"];

type DisplayHackathon = {
  id: number;
  title: string;
  slug: string | null;
  org: string;
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
  packagesCount: number;
};

export function HackathonsExplore() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("الكل");
  const [sort, setSort] = useState("الأحدث");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [hackathons, setHackathons] = useState<DisplayHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<OpportunityResponse>("/sponsors/opportunities")
      .then((res) => {
        const mapped: DisplayHackathon[] = res.items.map((it, idx) => ({
          id: it.id,
          title: it.title,
          slug: it.slug,
          org: it.org ?? "—",
          tags: it.tags,
          tagColors: it.tags.map((_, i) => TAG_COLORS[i % TAG_COLORS.length]),
          type: it.type ?? "—",
          typeColor: "#e35654",
          typeBg: "#fef2f2",
          date: formatDate(it.startDate),
          deadline: formatDate(it.registrationDeadline),
          prize: `${it.prizeTotal.toLocaleString("ar-SA")} ر.س`,
          viewers: 0,
          teams: 0,
          cover: COVER_GRADIENTS[idx % COVER_GRADIENTS.length],
          coverText: it.title.slice(0, 20),
          featured: false,
          packagesCount: it.packagesCount,
        }));
        setHackathons(mapped);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = hackathons
    .filter((h) => {
      const matchSearch =
        h.title.includes(search) ||
        h.org.includes(search) ||
        h.tags.some((t) => t.includes(search));
      const matchType = activeType === "الكل" || h.type === activeType;
      const matchFeatured = !onlyFeatured || h.featured;
      return matchSearch && matchType && matchFeatured;
    })
    .sort((a, b) => {
      if (sort === "الجائزة الأكبر")
        return (
          parseInt(b.prize.replace(/\D/g, "")) -
          parseInt(a.prize.replace(/\D/g, ""))
        );
      if (sort === "الأكثر مشاهدة") return b.viewers - a.viewers;
      return b.id - a.id;
    });

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/sponsor")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                فرص الرعاية
              </h1>
              <p className="text-sm text-gray-500">
                استكشف الهاكاثونات المتاحة وابحث عن فرص رعاية مناسبة لشركتك
              </p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، الجهة، أو الموضوع..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
              />
            </div>

            {/* Type Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {typeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    activeType === t
                      ? "bg-white text-[#e35654] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{ fontWeight: activeType === t ? 600 : 400 }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:border-[#e35654] cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {sortOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Quick Toggle */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setOnlyFeatured(!onlyFeatured)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                onlyFeatured
                  ? "bg-[#e35654] text-white border-[#e35654]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#e35654]/40"
              }`}
              style={{ fontWeight: 600 }}
            >
              <Star className="w-3.5 h-3.5" />
              المميزة فقط
            </button>
            <span className="text-gray-400 text-xs">
              {filtered.length} نتيجة
            </span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7">
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">جاري تحميل الفرص...</div>
        ) : loadError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            تعذّر تحميل الفرص: {loadError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
              لا توجد نتائج مطابقة
            </p>
            <p className="text-gray-400 text-xs mt-1">
              جرّب كلمة بحث مختلفة أو غيّر الفلتر
            </p>
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
                  {/* Featured badge */}
                  {h.featured && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 bg-[#e35654] text-white text-xs px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>
                        <Star className="w-3 h-3" />
                        مميز
                      </span>
                    </div>
                  )}
                  {/* Type badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: h.typeBg,
                        color: h.typeColor,
                        fontWeight: 600,
                      }}
                    >
                      {h.type}
                    </span>
                  </div>
                  <p
                    className="text-white/30 select-none whitespace-pre-line leading-tight"
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                    }}
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

                  <h3
                    className="text-gray-900 mb-0.5"
                    style={{ fontWeight: 700, fontSize: "0.95rem" }}
                  >
                    {h.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">{h.org}</p>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      {h.date}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-[#f59e0b]" />
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                        {h.prize}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#e35654]" />
                      <span>آخر تسجيل: {h.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      {h.teams} فريق
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 pt-3 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        {h.viewers} مشاهدة
                      </span>
                      <button
                        onClick={() => navigate(`/sponsor/hackathon/${h.id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] shadow-sm shadow-[#e35654]/20 transition-all group-hover:shadow-md"
                        style={{ fontWeight: 600 }}
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        طلب رعاية
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}