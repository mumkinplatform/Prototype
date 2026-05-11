import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  Trophy,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  Handshake,
  ChevronLeft,
  Building2,
  Globe,
  Zap,
  Crown,
  Medal,
  Award,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiGet, apiPost, ApiError } from "../../lib/api";
import { SponsorApplyDialog } from "./sponsor-apply/SponsorApplyDialog";
import { HackathonCover, BrandingPayload } from "./HackathonCover";

// ── Types ────────────────────────────────────────────────────

interface ApiHackathon {
  id: number;
  title: string;
  slug: string | null;
  type: string | null;
  description: string | null;
  startDate: string | null;
  registrationDeadline: string | null;
  org: string | null;
  branding: BrandingPayload | null;
}

interface ApiTrack {
  id: number;
  name: string;
  description: string | null;
}

interface ApiPrize {
  position: string;
  amount: string | null;
  sortOrder: number;
}

interface ApiPackage {
  id: number;
  name: string;
  type: string;
  description: string | null;
  duration: string | null;
  price: number | null;
  sponsorOffer: string | null;
  resources: string | null;
  benefits: string[];
  hasApplied: boolean;
}

interface OpportunityDetail {
  hackathon: ApiHackathon;
  tracks: ApiTrack[];
  prizes: ApiPrize[];
  packages: ApiPackage[];
  myApplicationPackageId: number | null;
}

interface ApplyResponse {
  id: number;
  sponsorId: number;
  packageId: number;
  status: "pending" | "accepted" | "rejected";
}

// Shape that the rich UI expects (mapped from API + visual defaults)
interface DisplayPackage {
  id: number;
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  borderColor: string;
  price: string;
  badge: string | null;
  perks: string[];
  hasApplied: boolean;
}

interface DisplayTimeline {
  date: string;
  label: string;
  done: boolean;
}

// ── Visual helpers ───────────────────────────────────────────

const PACKAGE_VISUALS: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; borderColor: string }
> = {
  financial: { icon: Crown, color: "#6366f1", bg: "#eef2ff", borderColor: "#6366f1" },
  technical: { icon: Medal, color: "#f59e0b", bg: "#fffbeb", borderColor: "#f59e0b" },
  logistic: { icon: Award, color: "#10b981", bg: "#f0fdf4", borderColor: "#10b981" },
  hospitality: { icon: Award, color: "#06b6d4", bg: "#ecfeff", borderColor: "#06b6d4" },
  media: { icon: Star, color: "#e35654", bg: "#fef2f2", borderColor: "#e35654" },
  other: { icon: Zap, color: "#64748b", bg: "#f8fafc", borderColor: "#94a3b8" },
};

const TAG_COLORS = ["#e35654", "#6366f1", "#10b981", "#f59e0b", "#06b6d4"];

function formatPrice(value: number | null): string {
  if (value === null || value === 0) return "حسب التفاوض";
  return `${value.toLocaleString("ar-SA")} ر.س`;
}

function formatTimelineDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ar-SA", { day: "numeric", month: "long" });
}

function buildTimeline(h: ApiHackathon): DisplayTimeline[] {
  const now = Date.now();
  const items: { iso: string | null; label: string }[] = [
    { iso: h.registrationDeadline, label: "آخر موعد للتسجيل" },
    { iso: h.startDate, label: "انطلاق الهاكاثون" },
  ];
  return items
    .filter((i) => i.iso)
    .map((i) => ({
      date: formatTimelineDate(i.iso),
      label: i.label,
      done: i.iso ? new Date(i.iso).getTime() < now : false,
    }));
}

function totalPrizes(prizes: ApiPrize[]): string {
  const total = prizes.reduce((sum, p) => {
    const num = p.amount ? Number(String(p.amount).replace(/[^\d.]/g, "")) : 0;
    return sum + (Number.isFinite(num) ? num : 0);
  }, 0);
  if (total === 0) return "حسب الإعلان";
  return `${total.toLocaleString("ar-SA")} ر.س`;
}

function firstChar(text: string | null): string {
  if (!text) return "م";
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed[0] : "م";
}

// ── Component ────────────────────────────────────────────────

export function HackathonDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [confirmingApply, setConfirmingApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    apiGet<OpportunityDetail>(`/sponsors/opportunities/${id}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err.message : "تعذّر تحميل بيانات الهاكاثون"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Map API packages to the shape the rich UI expects
  const displayPackages: DisplayPackage[] = useMemo(() => {
    if (!data) return [];
    return data.packages.map((p, idx) => {
      const visual = PACKAGE_VISUALS[p.type] ?? PACKAGE_VISUALS.other;
      return {
        id: p.id,
        name: p.name,
        icon: visual.icon,
        color: visual.color,
        bg: visual.bg,
        borderColor: visual.borderColor,
        price: formatPrice(p.price),
        badge: idx === 0 ? "الأكثر تأثيراً" : null,
        perks: p.benefits,
        hasApplied: p.hasApplied,
      };
    });
  }, [data]);

  const handleApplyClick = () => {
    if (selectedPackage === null) return;
    setConfirmingApply(true);
  };

  const handleConfirmApply = async () => {
    if (selectedPackage === null) return;
    const target = displayPackages.find((p) => p.id === selectedPackage);
    if (!target || !data) return;

    setSubmitting(true);
    try {
      await apiPost<ApplyResponse>("/sponsors/applications", {
        packageId: selectedPackage,
      });
      toast.success(`تم تقديم طلبك على ${target.name} بنجاح`, {
        description: "سيتم نقلك لمرحلة التفاوض مع المنظم.",
      });
      // Navigate to negotiation page with hackathon + package context
      navigate("/sponsor/negotiation", {
        state: {
          hackathonId: data.hackathon.id,
          hackathonTitle: data.hackathon.title,
          packageId: selectedPackage,
          packageName: target.name,
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "حدث خطأ، حاول لاحقاً";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render guards ──────────────────────────────────────────

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center text-gray-500 text-sm"
      >
        <Loader2 className="w-5 h-5 animate-spin ml-2" />
        جاري تحميل بيانات الهاكاثون...
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="max-w-md bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold">
            {loadError ?? "تعذّر تحميل البيانات"}
          </p>
          <button
            onClick={() => navigate("/sponsor/opportunities")}
            className="mt-4 text-sm text-[#e35654] hover:underline"
          >
            رجوع لقائمة الفرص
          </button>
        </div>
      </div>
    );
  }

  // ── Mapped values for the rich UI ──────────────────────────
  const apiHackathon = data.hackathon;
  const orgName = apiHackathon.org ?? "—";
  const hackathon = {
    id: apiHackathon.id,
    title: apiHackathon.title,
    org: orgName,
    orgLogo: firstChar(orgName),
    orgColor: "#e35654",
    tags: data.tracks.map((t) => t.name),
    tagColors: data.tracks.map((_, i) => TAG_COLORS[i % TAG_COLORS.length]),
    type: apiHackathon.type ?? "—",
    typeColor: "#e35654",
    typeBg: "#ffffff",
    date: formatTimelineDate(apiHackathon.startDate),
    deadline: formatTimelineDate(apiHackathon.registrationDeadline),
    prize: totalPrizes(data.prizes),
    teams: 0,
    location: apiHackathon.type ?? "—",
    duration: "حسب الإعلان",
    participants: 0,
    viewers: 0,
    desc: apiHackathon.description ?? "",
    timeline: buildTimeline(apiHackathon),
    branding: apiHackathon.branding,
    featured: false,
  };
  const sponsorPackages = displayPackages;
  const selectedPackageData = sponsorPackages.find(
    (p) => p.id === selectedPackage
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f7f6]">
      {/* ── Hero Cover — uses organizer-uploaded image/pattern/palette from branding ── */}
      <div className="relative overflow-hidden min-h-[320px]">
        {/* HackathonCover renders absolute-positioned cover behind everything */}
        <HackathonCover branding={hackathon.branding} id={hackathon.id} />
        {/* Dark overlay so text on top stays readable across any banner image/pattern */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

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
              <span className="flex items-center gap-1.5 bg-[#e35654] text-white text-xs px-3 py-1.5 rounded-full" style={{ fontWeight: 600 }}>
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
              { icon: Calendar, label: "تاريخ الانطلاق", value: hackathon.date, color: "#e35654" },
              { icon: Clock, label: "آخر تسجيل", value: hackathon.deadline, color: "#10b981" },
              { icon: Building2, label: "نوع الهاكاثون", value: hackathon.type, color: "#6366f1" },
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
                <Globe className="w-4 h-4 text-[#e35654]" />
                عن الهاكاثون
              </h2>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: "0.9rem" }}>
                {hackathon.desc || "—"}
              </p>

              {hackathon.tags.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-gray-500 text-xs mb-2">المسارات</p>
                  <div className="flex flex-wrap gap-2">
                    {hackathon.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          background: hackathon.tagColors[i % hackathon.tagColors.length] + "15",
                          color: hackathon.tagColors[i % hackathon.tagColors.length],
                          fontWeight: 600,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-gray-900 mb-5 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Calendar className="w-4 h-4 text-[#e35654]" />
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
                        <div className="flex items-center gap-2">
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
                  <Handshake className="w-4 h-4 text-[#e35654]" />
                  باقات الرعاية
                </h2>
                <span className="text-gray-400 text-xs">اختر الباقة المناسبة لشركتك</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {sponsorPackages.length === 0 ? (
                  <p className="col-span-2 text-center text-gray-500 text-sm py-8">
                    لا توجد باقات متاحة لهذا الهاكاثون حالياً.
                  </p>
                ) : (
                  sponsorPackages.map((pkg) => {
                    const isSelected = selectedPackage === pkg.id;
                    const isApplied = pkg.hasApplied;
                    const isLocked =
                      data.myApplicationPackageId !== null && !isApplied;
                    const isDisabled = isApplied || isLocked;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => !isDisabled && setSelectedPackage(pkg.id)}
                        disabled={isDisabled}
                        className={`relative text-right p-4 rounded-2xl border-2 transition-all duration-200 ${
                          isApplied
                            ? "cursor-not-allowed"
                            : isLocked
                            ? "cursor-not-allowed opacity-60"
                            : isSelected
                            ? "shadow-lg cursor-pointer"
                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm cursor-pointer"
                        }`}
                        style={{
                          borderColor: isApplied
                            ? "#10b981"
                            : isLocked
                            ? "#e5e7eb"
                            : isSelected
                            ? pkg.borderColor
                            : undefined,
                          background: isApplied
                            ? "#f0fdf4"
                            : isLocked
                            ? "#fafafa"
                            : isSelected
                            ? pkg.bg
                            : undefined,
                        }}
                      >
                        {/* Badge */}
                        {pkg.badge && !isApplied && !isLocked && (
                          <div
                            className="absolute -top-2.5 left-3 text-white text-xs px-2.5 py-0.5 rounded-full"
                            style={{ background: pkg.color, fontWeight: 600, fontSize: "0.65rem" }}
                          >
                            {pkg.badge}
                          </div>
                        )}

                        {/* Applied or Locked or Selected indicator */}
                        {isApplied ? (
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#10b981] text-white text-xs px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            تم التقديم
                          </div>
                        ) : isLocked ? (
                          <div className="absolute top-3 left-3 bg-gray-400 text-white text-[10px] px-2 py-0.5 rounded-full">
                            غير متاحة — قدّمت على باقة أخرى
                          </div>
                        ) : (
                          isSelected && (
                            <div
                              className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: pkg.color }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          )
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
                              {pkg.name}
                            </p>
                          </div>
                        </div>

                        <p className="mb-3" style={{ fontWeight: 800, fontSize: "1.1rem", color: pkg.color }}>
                          {pkg.price}
                        </p>

                        {pkg.perks.length > 0 && (
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
                        )}
                      </button>
                    );
                  })
                )}
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
                اختر الباقة المناسبة لشركتك من القائمة، ثم اضغط على زر التقديم
              </p>

              {/* Selected Package Preview */}
              {selectedPackageData ? (
                <div
                  className="rounded-xl p-3.5 mb-4 border"
                  style={{
                    background: selectedPackageData.bg,
                    borderColor: selectedPackageData.borderColor + "50",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-xs">الباقة المختارة</span>
                    <button
                      onClick={() => setSelectedPackage(null)}
                      className="text-gray-400 text-xs hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-gray-900" style={{ fontWeight: 700 }}>
                    {selectedPackageData.name}
                  </p>
                  <p
                    style={{
                      fontWeight: 800,
                      color: selectedPackageData.color,
                      fontSize: "1.05rem",
                    }}
                  >
                    {selectedPackageData.price}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl p-3.5 mb-4 bg-gray-50 border border-dashed border-gray-200 text-center">
                  <p className="text-gray-400 text-xs">لم تختر باقة بعد</p>
                  <p className="text-gray-300 text-xs mt-0.5">اختر من الباقات أدناه</p>
                </div>
              )}

              <button
                onClick={handleApplyClick}
                disabled={!selectedPackageData || selectedPackageData.hasApplied}
                className={`w-full py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedPackageData && !selectedPackageData.hasApplied
                    ? "bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/25"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                style={{ fontWeight: 600 }}
              >
                <Handshake className="w-4 h-4" />
                {selectedPackageData?.hasApplied
                  ? "تم التقديم على هذه الباقة"
                  : "أتقدم على هذه الباقة"}
                {selectedPackageData && !selectedPackageData.hasApplied && (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>

              <p className="text-center text-gray-400 mt-3" style={{ fontSize: "0.7rem" }}>
                سيراجع المنظم طلبك ويتم إشعارك بالنتيجة
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
            <div className="bg-[#e35654] rounded-2xl p-5 text-white">
              <h3 className="mb-3" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                💡 لماذا ترعى هذا الهاكاثون؟
              </h3>
              <ul className="space-y-2 text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" />
                  وصول مباشر لمشاركين متميزين من خلفيات تقنية متنوعة
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

      {/* Confirmation Dialog */}
      {confirmingApply && selectedPackageData && (
        <SponsorApplyDialog
          packageName={selectedPackageData.name}
          submitting={submitting}
          onConfirm={handleConfirmApply}
          onCancel={() => setConfirmingApply(false)}
        />
      )}
    </div>
  );
}
