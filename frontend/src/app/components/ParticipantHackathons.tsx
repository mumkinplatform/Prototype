import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  ArrowRight,
  Calendar,
  Trophy,
  Eye,
  Users,
  User,
  Clock,
  ChevronDown,
  Play,
  MapPin,
} from "lucide-react";
import { apiGet, ApiError } from "../../lib/api";
import { HackathonCover, BrandingPayload } from "./HackathonCover";

interface ApiHackathon {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
  location: string | null;
  org: string | null;
  startDate: string | null;
  registrationDeadline: string | null;
  prizeTotal: number;
  tags: string[];
  skills: string[];
  teamMin: number;
  teamMax: number;
  participationMode: 'teams_only' | 'individuals_and_teams' | 'individuals_only';
  applicantsCount: number;
  registrationOpen: boolean;
  branding: BrandingPayload | null;
}

interface HackathonCard {
  id: number;
  title: string;
  org: string;
  tags: string[];
  tagColors: string[];
  type: string;
  typeColor: string;
  typeBg: string;
  date: string;
  deadline: string;
  prize: string;
  teams: number;
  branding: BrandingPayload | null;
  location: string;
  skills: string[];
  teamMin: number;
  maxTeam: number;
  participationMode: 'teams_only' | 'individuals_and_teams' | 'individuals_only';
  registrationOpen: boolean;
}

const TAG_PALETTE = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6"];

const TYPE_STYLES: Record<string, { color: string; bg: string }> = {
  "حضوري":       { color: "#e35654", bg: "#fef2f2" },
  "عبر الإنترنت": { color: "#10b981", bg: "#f0fdf4" },
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

function formatPrize(amount: number): string {
  if (!amount) return "0 ر.س";
  return `${new Intl.NumberFormat("en-US").format(amount)} ر.س`;
}

function toCard(h: ApiHackathon): HackathonCard {
  const typeStyle = (h.type && TYPE_STYLES[h.type]) || { color: "#6366f1", bg: "#eef2ff" };
  return {
    id: h.id,
    title: h.title,
    org: h.org ?? "—",
    tags: h.tags,
    tagColors: h.tags.map((_, i) => TAG_PALETTE[i % TAG_PALETTE.length]),
    type: h.type ?? "—",
    typeColor: typeStyle.color,
    typeBg: typeStyle.bg,
    date: formatDateAr(h.startDate),
    deadline: formatDateAr(h.registrationDeadline),
    prize: formatPrize(h.prizeTotal),
    teams: h.applicantsCount,
    branding: h.branding,
    location: h.location ?? "—",
    skills: h.skills ?? [],
    teamMin: h.teamMin,
    maxTeam: h.teamMax,
    participationMode: h.participationMode,
    registrationOpen: h.registrationOpen,
  };
}

const typeOptions = ["الكل", "حضوري", "عبر الإنترنت"];
const sortOptions = ["الأحدث", "الجائزة الأكبر"];

export function ParticipantHackathons() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("الكل");
  const [sort, setSort] = useState("الأحدث");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [hackathons, setHackathons] = useState<HackathonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiHackathon[] }>("/participants/hackathons")
      .then((data) => {
        if (cancelled) return;
        setHackathons(data.items.map(toCard));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل الهاكاثونات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = hackathons
    .filter((h) => {
      const matchSearch =
        h.title.includes(search) ||
        h.org.includes(search) ||
        h.tags.some((t) => t.includes(search));
      const matchType = activeType === "الكل" || h.type === activeType;
      const matchOpen = !onlyOpen || h.registrationOpen;
      return matchSearch && matchType && matchOpen;
    })
    .sort((a, b) => {
      if (sort === "الجائزة الأكبر")
        return parseInt(b.prize.replace(/\D/g, "")) - parseInt(a.prize.replace(/\D/g, ""));
      return a.id - b.id;
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
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
              />
            </div>

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

          {/* Quick Toggles */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
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
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">جاري تحميل الهاكاثونات...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
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
                <div className="h-44 relative overflow-hidden">
                  <HackathonCover branding={h.branding} id={h.id} />
                  {/* Registration status */}
                  <div className="absolute top-3 left-3 z-10">
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
                  <div className="absolute bottom-3 left-3 z-10">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
                      style={{ background: h.typeBg + "dd", color: h.typeColor, fontWeight: 600 }}
                    >
                      {h.type}
                    </span>
                  </div>
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
                  <p className="text-gray-400 text-xs mb-1 flex items-center gap-1 flex-wrap">
                    <span>{h.org}</span>
                    <span className="text-gray-200">•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {h.location}
                    </span>
                    <span className="text-gray-200">•</span>
                    {h.participationMode === 'individuals_only' ? (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 shrink-0" />
                        مشاركة فردية
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3 shrink-0" />
                        {h.teamMin === h.maxTeam ? (
                          `${h.maxTeam} أعضاء`
                        ) : (
                          <>
                            {/* Source order is reversed (max-min) so the LTR-rendered range
                                reads naturally as min-max when scanned right-to-left in Arabic. */}
                            <bdi dir="ltr">{`${h.maxTeam}-${h.teamMin}`}</bdi> أعضاء
                          </>
                        )}
                      </span>
                    )}
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
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#e35654]" />
                      <span>آخر تسجيل: {h.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      {h.teams} متقدم
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-3 mt-auto">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => navigate(`/participant/hackathon/${h.id}`)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs transition-all group-hover:shadow-md ${
                          h.registrationOpen
                            ? "bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-sm shadow-[#e35654]/20"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-[#e35654] hover:text-[#e35654]"
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