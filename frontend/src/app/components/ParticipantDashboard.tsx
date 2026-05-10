import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiGet, ApiError } from "../../lib/api";
import { HackathonCover, BrandingPayload } from "./HackathonCover";
import {
  Trophy,
  Users,
  Sparkles,
  Award,
  Bookmark,
  Github,
  Mail,
  Star,
  Play,
  CheckCircle,
} from "lucide-react";

// ─── API Types ───────────────────────────────────────────────────────────────
interface ApiMyHackathonHome {
  id: number;
  title: string;
  status: string;
  hackathonStartDate: string | null;
  submissionDeadline: string | null;
  myTeamId: number | null;
  participationType: "solo" | "team";
  tags: string[];
  branding: BrandingPayload | null;
}

interface UiHomeHackathon {
  id: number;
  name: string;
  status: string;
  statusColor: string;
  statusBg: string;
  note: string;
  progress: number;
  branding: BrandingPayload | null;
  track: string;
  rawStatus: string;
}

function toUiHomeHackathon(h: ApiMyHackathonHome): UiHomeHackathon {
  // status mapping
  let status = "نشط";
  let statusColor = "#10b981";
  let statusBg = "#f0fdf4";
  if (h.status === "published") {
    if (h.myTeamId || h.participationType === "solo") {
      status = "مقبول";
    } else {
      status = "بانتظار فريق";
      statusColor = "#f59e0b";
      statusBg = "#fffbeb";
    }
  } else if (h.status === "ongoing") {
    status = "نشط";
  } else if (h.status === "completed") {
    status = "مكتمل";
    statusColor = "#6b7280";
    statusBg = "#f3f4f6";
  }

  // note
  let note = "";
  if (h.status === "completed") {
    note = "انتهى الهاكاثون. يمكنك مراجعة المشروع والتقييمات.";
  } else if (h.myTeamId) {
    note = "تم القبول في فريقك. تابع تقدّمك في مساحة العمل.";
  } else if (h.participationType === "team") {
    note = "تسجيلك لم يكتمل — تبقى إيجاد فريق.";
  } else {
    note = "أنت مسجّل بشكل فردي. ابدأ في إعداد مشروعك.";
  }

  // Progress: simple linear estimate between start and submission deadline
  const now = Date.now();
  const start = h.hackathonStartDate ? new Date(h.hackathonStartDate).getTime() : null;
  const end = h.submissionDeadline ? new Date(h.submissionDeadline).getTime() : null;
  let progress = 0;
  if (start !== null && end !== null && end > start) {
    if (now <= start) progress = 0;
    else if (now >= end) progress = 100;
    else progress = Math.round(((now - start) / (end - start)) * 100);
  }

  return {
    id: h.id,
    name: h.title,
    status,
    statusColor,
    statusBg,
    note,
    progress,
    branding: h.branding,
    track: h.tags[0] ?? "هاكاثون",
    rawStatus: h.status,
  };
}

// ─── Home View ───────────────────────────────────────────────────────────────
function HomeView() {
  const navigate = useNavigate();
  const [hackTab, setHackTab] = useState("نشط");
  const [hackathons, setHackathons] = useState<UiHomeHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiMyHackathonHome[] }>("/participants/my-hackathons")
      .then((data) => {
        if (cancelled) return;
        setHackathons(data.items.map((h) => toUiHomeHackathon(h)));
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

  // Filter by tab — driven by the displayed status badge:
  //   "active" = hackathon running + participant accepted
  //   "pending review" = registered but no team yet
  //   "completed" = hackathon finished
  const filteredHackathons = hackathons.filter((h) => {
    if (hackTab === "نشط") return h.status === "نشط" || h.status === "مقبول";
    if (hackTab === "قيد المراجعة") return h.status === "بانتظار فريق";
    if (hackTab === "مكتمل") return h.status === "مكتمل";
    return true;
  });

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Soft gradient blobs */}
          <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
            <div
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.4) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            <div
              className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.4) 0%, rgba(250, 187, 91, 0.25) 50%, transparent 70%)' }}
            ></div>
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.3) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            <div
              className="absolute -bottom-20 -left-20 w-[550px] h-[550px] rounded-full opacity-28 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.35) 0%, rgba(250, 187, 91, 0.2) 50%, transparent 70%)' }}
            ></div>
            <div
              className="absolute -bottom-28 -right-28 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.35) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            <div
              className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full opacity-22 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.3) 0%, rgba(250, 187, 91, 0.15) 50%, transparent 70%)' }}
            ></div>
          </div>

          {/* Simple curved lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            <path d="M 0 200 Q 200 180, 400 200 T 800 200 T 1200 200 T 1600 200" stroke="#e3565410" strokeWidth="2" fill="none" />
            <path d="M 0 220 Q 200 200, 400 220 T 800 220 T 1200 220 T 1600 220" stroke="#00bcd415" strokeWidth="2" fill="none" />
            <path d="M 0 240 Q 200 220, 400 240 T 800 240 T 1200 240 T 1600 240" stroke="#8b5cf610" strokeWidth="2" fill="none" />
            <path d="M 900 100 Q 950 150, 1000 100 T 1200 100" stroke="#e3565412" strokeWidth="1.5" fill="none" />
            <path d="M 920 120 Q 970 170, 1020 120 T 1220 120" stroke="#00bcd418" strokeWidth="1.5" fill="none" />
          </svg>

          {/* Small decorative shapes */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <div className="absolute top-20 left-32 w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
            <div className="absolute top-40 right-48 w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
            <div className="absolute bottom-32 left-48 w-2.5 h-2.5 bg-green-400 rounded-full opacity-70"></div>
            <div className="absolute bottom-48 right-32 w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
            <div className="absolute top-1/2 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
            <div className="absolute top-1/3 right-20 w-2 h-2 bg-cyan-300 rounded-full opacity-50"></div>
            <div className="absolute top-24 left-1/4 w-4 h-4 bg-orange-400 opacity-70 transform rotate-45"></div>
            <div className="absolute top-56 right-1/4 w-3 h-3 bg-yellow-400 opacity-60"></div>
            <div className="absolute bottom-40 left-1/3 w-3.5 h-3.5 bg-cyan-400 opacity-70 transform rotate-12"></div>
            <div className="absolute bottom-56 right-1/3 w-4 h-4 bg-green-400 opacity-60 transform rotate-45"></div>
            <div className="absolute top-32 right-56 w-6 h-6 border-2 border-cyan-400 opacity-60 transform rotate-45"></div>
            <div className="absolute bottom-36 left-64 w-7 h-7 border-2 border-green-400 opacity-50 transform rotate-45"></div>
          </div>

          {/* Floating Icons */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <div className="absolute top-20 right-32 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="absolute top-32 left-24 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="absolute top-1/2 right-16 w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
              <Star className="w-7 h-7 text-orange-600" />
            </div>
            <div className="absolute top-1/3 left-16 w-11 h-11 bg-cyan-100 rounded-lg flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3s' }}>
              <Sparkles className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="absolute bottom-24 right-28 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 5.5s ease-in-out infinite 1.5s' }}>
              <Award className="w-5 h-5 text-pink-600" />
            </div>
            <div className="absolute bottom-32 left-20 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6.5s ease-in-out infinite 2.5s' }}>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-float" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}>
              <Bookmark className="w-4 h-4 text-blue-600" />
            </div>
            <div className="absolute bottom-20 left-1/3 w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3.5s' }}>
              <Github className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="absolute top-24 right-1/3 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 7s ease-in-out infinite 4s' }}>
              <Mail className="w-5 h-5 text-[#e35654]" />
            </div>
          </div>

          {/* Content */}
          <div className="relative text-center max-w-3xl mx-auto" style={{ zIndex: 2 }}>
            <h1 className="text-5xl text-gray-900 mb-6 leading-tight" style={{ fontWeight: 700 }}>
              ابدأ رحلتك في الابتكار<br />
              <span className="text-[#e35654]">واصنع المستقبل</span>
            </h1>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              انضم إلى أفضل الهاكاثونات التقنية وطوّر مهاراتك من خلال تحديات حقيقية،<br />
              تنافس مع المبدعين واربح جوائز قيّمة.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate("/participant/hackathons")}
                className="px-10 py-4 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ fontWeight: 600 }}
              >
                استكشف الهاكاثونات
              </button>
              <button
                onClick={() => navigate("/participant/workspace")}
                className="px-10 py-4 rounded-xl bg-white text-gray-700 border-2 border-gray-200 hover:border-[#e35654] hover:text-[#e35654] hover:bg-red-50 transition-all hover:-translate-y-0.5"
                style={{ fontWeight: 600 }}
              >
                مساحة العمل
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }
        `}</style>
      </section>

      {/* Quick Services */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>الخدمات السريعة</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/participant/hackathons")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#e35654] transition-all cursor-pointer text-right block w-full"
            >
              <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#e35654]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>استكشاف الهاكاثونات</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                ابحث عن الهاكاثونات المتاحة وتعرّف على المسارات والجوائز ومواعيد المشاركة ثم سجّل بسهولة.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#e35654] text-sm hover:bg-red-50 hover:border-[#e35654] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                استكشف
              </span>
            </button>

            <button
              onClick={() => navigate("/participant/workspace")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#00bcd4] transition-all cursor-pointer text-right block w-full"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#00bcd4]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>مساحات العمل</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                ادخل إلى الهاكاثونات التي تم قبولك فيها وتابع عمل فريقك، واطلع على المهام والإعلانات، وقم برفع المشاريع ومتابعة مراحل العمل.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                عرض المساحات
              </span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {/* My Hackathons */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>هاكاثوناتي</h2>
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
              {["نشط", "قيد المراجعة", "مكتمل"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHackTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    hackTab === tab ? "bg-white shadow-sm text-gray-900 border border-gray-100" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{ fontWeight: hackTab === tab ? 600 : 400 }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-400 text-sm text-center py-6">جاري التحميل...</p>
            ) : error ? (
              <p className="text-red-500 text-sm text-center py-6">{error}</p>
            ) : filteredHackathons.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">لا توجد هاكاثونات في هذه الحالة</p>
            ) : (
              filteredHackathons.map((h) => (
                <div key={h.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="relative w-16 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <HackathonCover branding={h.branding} id={h.id} compact />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: h.statusBg, color: h.statusColor, fontWeight: 600 }}
                      >
                        {h.status}
                      </span>
                      <h3 className="text-gray-900 text-sm truncate" style={{ fontWeight: 600 }}>{h.name}</h3>
                    </div>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-1">{h.note}</p>
                    <div>
                      <p className="text-gray-400 mb-1" style={{ fontSize: "0.65rem" }}>نسبة الاكتمال</p>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${h.progress}%`, background: "#e35654" }}
                        />
                      </div>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.65rem" }}>{h.progress}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/participant/workspace?id=${h.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] transition-colors flex-shrink-0"
                    style={{ fontWeight: 600 }}
                  >
                    <Play className="w-3 h-3" />
                    دخول مساحة العمل
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ParticipantDashboard() {
  return (
    <main>
      <HomeView />
    </main>
  );
}
