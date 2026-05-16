import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  Sparkles,
  Brain,
  Users,
  Code,
  Cpu,
  Layers,
  Globe,
  Database,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Star,
  MessageCircle,
} from "lucide-react";
import { apiPost, ApiError } from "../../lib/api";
import { toast } from "sonner";

const skillOptions = [
  { id: "frontend", label: "Frontend", icon: Code, color: "#6366f1" },
  { id: "backend", label: "Backend", icon: Database, color: "#10b981" },
  { id: "ai", label: "AI/ML", icon: Cpu, color: "#f59e0b" },
  { id: "uiux", label: "UI/UX", icon: Layers, color: "#e35654" },
  { id: "mobile", label: "Mobile", icon: Smartphone, color: "#8b5cf6" },
  { id: "devops", label: "DevOps", icon: Globe, color: "#06b6d4" },
  { id: "data", label: "Data Science", icon: Brain, color: "#ec4899" },
  { id: "blockchain", label: "Blockchain", icon: Zap, color: "#f97316" },
];

const palette = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];
const teamColors = ["#e35654", "#6366f1", "#f97316", "#10b981", "#8b5cf6"];

interface ApiTeamMember {
  id: number;
  fullName: string;
  skills: string[];
  matchScore: number;
}

interface ApiTeam {
  id: string;
  score: number;
  members: ApiTeamMember[];
  tags: string[];
  reason: string;
}

interface ApiResponse {
  candidatesCount: number;
  suggestedTeams: ApiTeam[];
}

type Phase = "skills" | "loading" | "results";

export function SmartMatchmaking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const urlHackathonId = searchParams.get("hackathonId");
  const stateHackathonId = (location.state as { hackathonId?: number } | null)?.hackathonId ?? null;
  const fixedHackathonId =
    stateHackathonId && Number.isInteger(stateHackathonId)
      ? stateHackathonId
      : urlHackathonId && /^\d+$/.test(urlHackathonId)
      ? Number(urlHackathonId)
      : null;

  const [phase, setPhase] = useState<Phase>("skills");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [suggestedTeams, setSuggestedTeams] = useState<ApiTeam[]>([]);
  const [candidatesCount, setCandidatesCount] = useState(0);

  const handleJoinTeam = async (team: ApiTeam) => {
    if (!fixedHackathonId || joining) return;
    setJoining(true);
    try {
      const memberIds = team.members.map((m) => m.id);
      const result = await apiPost<{
        teamId: number;
        teamName: string;
        addedMemberIds: number[];
        skippedMemberIds: number[];
      }>("/matchmaking/create-team-from-suggestion", {
        hackathonId: fixedHackathonId,
        memberIds,
      });
      setJoined(true);
      if (result.skippedMemberIds.length > 0) {
        toast.success(
          `تم إنشاء "${result.teamName}". تم تجاوز ${result.skippedMemberIds.length} عضواً لم يعد متاحاً.`
        );
      } else {
        toast.success(`تم إنشاء "${result.teamName}" وانضممت إليه!`);
      }
      setTimeout(() => {
        localStorage.setItem("hackathon_registered", "team");
        navigate(-1);
      }, 1400);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "تعذّر إنشاء الفريق. حاول مجدداً.";
      toast.error(msg);
      setJoining(false);
    }
  };

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const startAnalysis = async () => {
    if (!fixedHackathonId) {
      toast.error("الرجاء فتح خدمة الماتشنق من داخل صفحة الهاكاثون.");
      return;
    }

    setPhase("loading");
    setLoadingProgress(0);

    const interval = setInterval(() => {
      setLoadingProgress((prev) => (prev >= 90 ? 90 : prev + 6));
    }, 150);

    const skillLabels = selectedSkills
      .map((id) => skillOptions.find((o) => o.id === id)?.label)
      .filter((l): l is string => Boolean(l));

    try {
      const data = await apiPost<ApiResponse>("/matchmaking/suggest-teams", {
        skills: skillLabels,
        hackathonId: fixedHackathonId,
      });
      setSuggestedTeams(data.suggestedTeams);
      setCandidatesCount(data.candidatesCount);
      clearInterval(interval);
      setLoadingProgress(100);
      setTimeout(() => setPhase("results"), 300);
    } catch (err) {
      clearInterval(interval);
      const msg =
        err instanceof ApiError
          ? err.message
          : "تعذّر جلب الاقتراحات. حاول مجدداً.";
      toast.error(msg);
      setPhase("skills");
    }
  };

  const colorForIndex = (i: number) => palette[i % palette.length];

  const steps = [
    "تحليل مهاراتك...",
    "مطابقة البيانات...",
    "تقييم التوافق...",
    "توليد الفرق...",
    "ترتيب النتائج...",
  ];

  return (
    <div dir="rtl" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          رجوع
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[#e35654] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#e35654]/25">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl text-gray-900 mb-3" style={{ fontWeight: 800 }}>
          Smart Matchmaking
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          أخبرنا بمهاراتك، وسيقترح الذكاء الاصطناعي لك أفضل الفرق المتكاملة خلال ثوانٍ.
        </p>
      </div>

      {!fixedHackathonId && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-800 text-sm">
          ⚠️ خدمة الماتشنق متاحة فقط داخل صفحة هاكاثون محدد. الرجاء فتحها من زر "AI Matching" في صفحة الهاكاثون.
        </div>
      )}

      {/* Skills Phase */}
      {phase === "skills" && (
        <div>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["اختر مهاراتك", "التحليل الذكي", "اكتشف فريقك"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${i === 0 ? "bg-[#e35654] text-white" : "bg-gray-100 text-gray-400"}`} style={{ fontWeight: 500 }}>
                  <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs" style={{ fontWeight: 700 }}>{i + 1}</span>
                  {step}
                </div>
                {i < 2 && <div className="w-6 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#e35654]/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#e35654]" />
              </div>
              <div>
                <h2 className="text-gray-900" style={{ fontWeight: 700 }}>
                  ما هي مهاراتك؟
                </h2>
                <p className="text-gray-400 text-sm">اختر مهارة أو أكثر</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {skillOptions.map((skill) => {
                const active = selectedSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      active
                        ? "border-[#e35654] bg-[#e35654]/5 shadow-sm"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: active ? skill.color : skill.color + "15",
                      }}
                    >
                      <skill.icon
                        className="w-5 h-5"
                        style={{ color: active ? "white" : skill.color }}
                      />
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        color: active ? "#e35654" : "#374151",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {skill.label}
                    </span>
                    {active && (
                      <CheckCircle2 className="w-4 h-4 text-[#e35654]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                {selectedSkills.length > 0
                  ? `${selectedSkills.length} مهارة محددة`
                  : "لم تختر مهارات بعد"}
              </p>
              <button
                onClick={startAnalysis}
                disabled={selectedSkills.length === 0 || !fixedHackathonId}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm transition-all duration-200 ${
                  selectedSkills.length > 0 && fixedHackathonId
                    ? "bg-[#e35654] hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/25"
                    : "bg-gray-200 cursor-not-allowed"
                }`}
                style={{ fontWeight: 600 }}
              >
                <Sparkles className="w-4 h-4" />
                ابدأ التحليل
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Phase */}
      {phase === "loading" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-gray-100" />
            <div
              className="absolute inset-0 rounded-full border-4 border-[#e35654] border-t-transparent"
              style={{
                transform: "rotate(-90deg)",
                background: `conic-gradient(#e35654 ${loadingProgress}%, transparent 0%)`,
                borderRadius: "50%",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#e35654] animate-pulse" />
            </div>
          </div>

          <h2 className="text-gray-900 text-xl mb-2" style={{ fontWeight: 700 }}>
            جارٍ تحليل بياناتك...
          </h2>
          <p className="text-gray-400 mb-6">
            {steps[Math.min(Math.floor(loadingProgress / 20), 4)]}
          </p>

          <div className="max-w-sm mx-auto">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#e35654] rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm text-left" dir="ltr">{loadingProgress}%</p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["تحليل المهارات ✓", "مشاركو الهاكاثون ✓", "خوارزمية التوافق ✓"].map((item, i) => (
              <span
                key={i}
                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-500 ${
                  loadingProgress > (i + 1) * 25
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
                style={{ fontWeight: 500 }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results Phase */}
      {phase === "results" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 text-xl" style={{ fontWeight: 700 }}>
                🎉 الفرق المقترحة لك
              </h2>
              <p className="text-gray-400 text-sm">
                بناءً على تحليل {candidatesCount} مشاركاً متاحاً في هذا الهاكاثون
              </p>
            </div>
            <button
              onClick={() => { setPhase("skills"); setSelectedTeam(null); setJoined(false); }}
              className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة البحث
            </button>
          </div>

          {suggestedTeams.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-700" style={{ fontWeight: 600 }}>
                لا يوجد مرشحون مناسبون حالياً
              </p>
              <p className="text-gray-400 text-sm mt-1">
                جرّب اختيار مهارات مختلفة، أو انتظر انضمام مشاركين جدد لهذا الهاكاثون.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {suggestedTeams.map((team, teamIndex) => {
              const teamColor = teamColors[teamIndex % teamColors.length];
              return (
              <div
                key={team.id}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-200 cursor-pointer ${
                  selectedTeam === team.id
                    ? "border-[#e35654] shadow-md shadow-[#e35654]/10"
                    : "border-gray-100 hover:border-gray-200"
                }`}
                onClick={() => setSelectedTeam(team.id)}
              >
                <div className="h-1" style={{ background: teamColor }} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: teamColor + "15" }}
                      >
                        <Users className="w-6 h-6" style={{ color: teamColor }} />
                      </div>
                      <div>
                        <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
                          فريق مقترح #{teamIndex + 1}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: teamColor + "15",
                                color: teamColor,
                                fontWeight: 500,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-2xl"
                        style={{ color: teamColor, fontWeight: 800 }}
                      >
                        {team.score}%
                      </div>
                      <p className="text-gray-400 text-xs">توافق</p>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm mb-5 p-3 bg-gray-50 rounded-xl">
                    💡 {team.reason}
                  </p>

                  {/* Members */}
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {team.members.map((member, i) => {
                      const memberColor = colorForIndex(i);
                      const initial = member.fullName.trim().charAt(0) || "?";
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
                            style={{ background: memberColor, fontWeight: 700 }}
                          >
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-sm truncate" style={{ fontWeight: 500 }}>
                              {member.fullName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-xs truncate"
                                style={{ color: memberColor, fontWeight: 500 }}
                              >
                                {member.skills.slice(0, 3).join(" • ")}
                              </span>
                              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden min-w-[40px]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${member.matchScore}%`,
                                    background: memberColor,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{member.matchScore}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedTeam === team.id && (
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        تواصل مع الفريق
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinTeam(team);
                        }}
                        disabled={joining || joined}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-all duration-200 flex-1 justify-center ${
                          joined
                            ? "bg-green-100 text-green-700"
                            : joining
                            ? "bg-gray-300 text-gray-600 cursor-wait"
                            : "bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {joined ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            انضممت إلى الفريق! 🎉
                          </>
                        ) : joining ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            جارٍ الإنشاء...
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4" />
                            انضم إلى هذا الفريق
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {/* How it works info */}
          <div className="mt-8 bg-gradient-to-br from-[#e35654]/5 to-[#e35654]/10 rounded-2xl p-6 border border-[#e35654]/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#e35654]/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-[#e35654]" />
              </div>
              <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                كيف يعمل النظام؟
              </h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Cpu, title: "تحليل المهارات", desc: "يحلل النظام مهاراتك وخبراتك وأسلوب عملك" },
                { icon: Brain, title: "خوارزمية التوافق", desc: "يطابق بياناتك مع المشاركين الأفراد داخل الهاكاثون لإيجاد التوافق المثالي" },
                { icon: Star, title: "فرق متوازنة", desc: "يقترح فرقًا تجمع مهارات تكميلية لتحقيق أفضل النتائج" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e35654]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-[#e35654]" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm mb-1" style={{ fontWeight: 600 }}>
                      {item.title}
                    </p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
