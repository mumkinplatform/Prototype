import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  FileText,
  Eye,
  MessageCircle,
  AlertCircle,
  Calendar,
  Download,
  Search,
  LayoutGrid,
  Building2,
  FileSignature,
  Loader2,
  Trash2,
} from "lucide-react";
import { apiGet, apiDelete, ApiError } from "../../lib/api";
import { HackathonCover, BrandingPayload } from "./HackathonCover";
import { LogoPattern } from "./LogoPatterns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── API Types ────────────────────────────────────────────────

interface ApiApplication {
  id: number;
  status: "pending" | "accepted" | "rejected";
  negotiationStep: number;
  appliedAt: string;
  paidAt: string | null;
  package: {
    id: number;
    name: string;
    type: string;
    price: number | null;
  };
  hackathon: {
    id: number;
    title: string;
    status: string;
    startDate: string | null;
    branding: BrandingPayload | null;
  };
}

interface ApplicationsResponse {
  items: ApiApplication[];
}

const PACKAGE_TYPE_VISUALS: Record<string, { color: string; bg: string }> = {
  financial: { color: "#6366f1", bg: "#eef2ff" },
  technical: { color: "#f59e0b", bg: "#fffbeb" },
  logistic: { color: "#10b981", bg: "#f0fdf4" },
  hospitality: { color: "#06b6d4", bg: "#ecfeff" },
  media: { color: "#e35654", bg: "#fef2f2" },
  other: { color: "#64748b", bg: "#f8fafc" },
};

function formatLongDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ApiContract {
  id: number;
  status: "ساري" | "بانتظار توقيعك";
  signed: boolean;
  sponsorSigned: boolean;
  organizerSigned: boolean;
  negotiationStep: number;
  package: { name: string; type: string; price: number | null };
  hackathon: { id: number; title: string; startDate: string | null };
  organizer: { name: string };
  signDate: string | null;
  organizerSignedAt: string | null;
  receiptFile: string | null;
  appliedAt: string;
}

interface ContractsResponse {
  items: ApiContract[];
}

interface DisplayContract {
  id: number;
  hackathon: string;
  hackathonId: number;
  package: string;
  packageColor: string;
  packageBg: string;
  organizer: string;
  signDate: string;
  expiryDate: string;
  value: string;
  status: string;
  statusColor: string;
  statusBg: string;
  signed: boolean;
  pendingHint: string;
  receiptFile: string | null;
  rawPrice: number;
}

function mapContractToDisplay(c: ApiContract): DisplayContract {
  const visual = PACKAGE_TYPE_VISUALS[c.package.type] ?? PACKAGE_TYPE_VISUALS.other;
  const signedDateStr = c.signDate ? formatLongDate(c.signDate) : "—";
  const startDateStr = c.hackathon.startDate
    ? formatLongDate(c.hackathon.startDate)
    : "—";
  const value = c.package.price
    ? `${c.package.price.toLocaleString("ar-SA")} ر.س`
    : "—";

  // العقد "ساري" بمجرد ما يخلّص الراعي خطواته (step=4). لو ما خلّص → بانتظار توقيعك
  const pendingHint = c.signed
    ? ""
    : "أكمل مراحل التفاوض ورفع الإيصال لتوقيع العقد.";

  return {
    id: c.id,
    hackathon: c.hackathon.title || "—",
    hackathonId: c.hackathon.id,
    package: c.package.name,
    packageColor: visual.color,
    packageBg: visual.bg,
    organizer: c.organizer.name,
    signDate: signedDateStr,
    expiryDate: startDateStr,
    value,
    status: c.status,
    statusColor: c.signed ? "#10b981" : "#f59e0b",
    statusBg: c.signed ? "#f0fdf4" : "#fffbeb",
    signed: c.signed,
    pendingHint,
    receiptFile: c.receiptFile,
    rawPrice: c.package.price ?? 0,
  };
}

// ── Display shape (matches existing UI) ──────────────────────

interface DisplaySponsorship {
  id: number;
  hackathonId: number;
  name: string;
  package: string;
  packageColor: string;
  packageBg: string;
  status: string;
  statusColor: string;
  statusBg: string;
  payDate: string;
  financialDate: string;
  deliveryStatus: string;
  deliveryColor: string;
  progress: number;
  note: string;
  actionPrimary: string;
  actionSecondary: string;
  urgent: boolean;
  contractSigned: boolean;
  branding: BrandingPayload | null;
  appliedAtTime: number;
  rawPrice: number;
}

// ── Helpers ──────────────────────────────────────────────────

const STATUS_LABELS: Record<
  ApiApplication["status"],
  { label: string; color: string; bg: string; deliveryStatus: string; note: string }
> = {
  pending: {
    label: "قيد التقديم",
    color: "#f59e0b",
    bg: "#fffbeb",
    deliveryStatus: "بانتظار الموافقة",
    note: "تم استلام طلبك. سيراجعه المنظم قريباً.",
  },
  accepted: {
    label: "نشط",
    color: "#10b981",
    bg: "#f0fdf4",
    deliveryStatus: "تم القبول",
    note: "تم قبول طلبك. تابع تفاصيل الهاكاثون.",
  },
  rejected: {
    label: "مرفوض",
    color: "#ef4444",
    bg: "#fef2f2",
    deliveryStatus: "تم الرفض",
    note: "للأسف، لم يتم قبول طلبك على هذه الباقة.",
  },
};

function mapApplicationToDisplay(app: ApiApplication): DisplaySponsorship {
  const baseStatus = STATUS_LABELS[app.status];
  const packageVisual =
    PACKAGE_TYPE_VISUALS[app.package.type] ?? PACKAGE_TYPE_VISUALS.other;
  const isCompleted = app.status === "accepted" && app.negotiationStep >= 4;

  const label = isCompleted ? "مكتمل" : baseStatus.label;
  const color = isCompleted ? "#10b981" : baseStatus.color;
  const bg = isCompleted ? "#f0fdf4" : baseStatus.bg;
  const deliveryStatus = isCompleted
    ? "مدفوع بالكامل"
    : baseStatus.deliveryStatus;
  const note = isCompleted
    ? "تمّت الرعاية بنجاح — العقد ساري والدفع مستلَم."
    : baseStatus.note;
  const progress = isCompleted
    ? 100
    : app.status === "accepted"
    ? 50
    : 0;

  return {
    id: app.id,
    hackathonId: app.hackathon.id,
    name: app.hackathon.title,
    package: app.package.name,
    packageColor: packageVisual.color,
    packageBg: packageVisual.bg,
    status: label,
    statusColor: color,
    statusBg: bg,
    payDate: formatLongDate(app.hackathon.startDate),
    financialDate: formatLongDate(app.appliedAt),
    deliveryStatus,
    deliveryColor: color,
    progress,
    note,
    actionPrimary: "عرض الهاكاثون",
    actionSecondary: "تفاصيل الباقة",
    urgent: false,
    contractSigned: isCompleted,
    branding: app.hackathon.branding ?? null,
    appliedAtTime: new Date(app.appliedAt).getTime(),
    rawPrice: app.package.price ?? 0,
  };
}

const tabs = ["الكل", "نشط", "قيد التقديم", "مكتمل"];

const contractTabs = ["الكل", "ساري", "بانتظار توقيعك"];

type SortKey = "الأحدث أولاً" | "الأقدم أولاً" | "الأعلى قيمةً";

const SORT_OPTIONS: SortKey[] = [
  "الأحدث أولاً",
  "الأقدم أولاً",
  "الأعلى قيمةً",
];

const SEEN_CONTRACTS_KEY = "mumkin_sponsor_seen_contracts";

function readSeenContracts(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_CONTRACTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((n) => typeof n === "number")) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeenContracts(ids: Set<number>): void {
  try {
    localStorage.setItem(SEEN_CONTRACTS_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore quota / private-mode errors
  }
}

export function SponsorSponsorships() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("الكل");
  const [search, setSearch] = useState("");
  const [mainView, setMainView] = useState<"sponsorships" | "contracts">("sponsorships");
  const [contractFilter, setContractFilter] = useState("الكل");
  const [sortKey, setSortKey] = useState<SortKey>("الأحدث أولاً");

  const [sponsorships, setSponsorships] = useState<DisplaySponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [contracts, setContracts] = useState<DisplayContract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [viewingContractId, setViewingContractId] = useState<number | null>(null);
  const [seenContracts, setSeenContracts] = useState<Set<number>>(() => readSeenContracts());

  const unseenContractsCount = useMemo(
    () => contracts.filter((c) => !seenContracts.has(c.id)).length,
    [contracts, seenContracts]
  );

  const markContractsAsSeen = () => {
    if (contracts.length === 0) return;
    const next = new Set(seenContracts);
    let changed = false;
    contracts.forEach((c) => {
      if (!next.has(c.id)) {
        next.add(c.id);
        changed = true;
      }
    });
    if (changed) {
      setSeenContracts(next);
      writeSeenContracts(next);
    }
  };

  // لو وصلت العقود بعد ما المستخدم فتح التبويب، علّمها كمشاهَدة مباشرة
  useEffect(() => {
    if (mainView === "contracts" && !contractsLoading) {
      markContractsAsSeen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainView, contractsLoading, contracts.length]);

  useEffect(() => {
    let cancelled = false;

    apiGet<ApplicationsResponse>("/sponsors/applications")
      .then((res) => {
        if (cancelled) return;
        setSponsorships(res.items.map(mapApplicationToDisplay));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err.message : "تعذّر تحميل رعاياتك"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    apiGet<ContractsResponse>("/sponsors/contracts")
      .then((res) => {
        if (cancelled) return;
        setContracts(res.items.map(mapContractToDisplay));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setContractsError(
          err instanceof ApiError ? err.message : "تعذّر تحميل العقود"
        );
      })
      .finally(() => {
        if (!cancelled) setContractsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const base = sponsorships.filter((s) => {
      const matchTab = activeTab === "الكل" || s.status === activeTab;
      const matchSearch = s.name.includes(search);
      return matchTab && matchSearch;
    });
    const sorted = [...base];
    switch (sortKey) {
      case "الأحدث أولاً":
        sorted.sort((a, b) => b.appliedAtTime - a.appliedAtTime);
        break;
      case "الأقدم أولاً":
        sorted.sort((a, b) => a.appliedAtTime - b.appliedAtTime);
        break;
      case "الأعلى قيمةً":
        sorted.sort((a, b) => b.rawPrice - a.rawPrice);
        break;
    }
    return sorted;
  }, [sponsorships, activeTab, search, sortKey]);

  const cancelTarget = cancellingId
    ? sponsorships.find((s) => s.id === cancellingId)
    : null;

  const handleConfirmCancel = async () => {
    if (cancellingId === null) return;
    setCancelling(true);
    try {
      await apiDelete<{ id: number; cancelled: boolean }>(
        `/sponsors/applications/${cancellingId}`
      );
      toast.success("تم حذف الرعاية بنجاح");
      setSponsorships((prev) => prev.filter((s) => s.id !== cancellingId));
      setCancellingId(null);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "تعذّر حذف الرعاية";
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  // Smart action config based on sponsorship status
  const getActionConfig = (sp: DisplaySponsorship) => {
    const goToHackathon = () =>
      navigate(`/sponsor/hackathon/${sp.hackathonId}`, {
        state: { from: "/sponsor/sponsorships" },
      });
    if (sp.contractSigned) {
      return { label: "عرض الهاكاثون", Icon: Eye, action: goToHackathon };
    }
    return { label: sp.actionPrimary, Icon: FileText, action: goToHackathon };
  };

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/sponsor")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                رعاياتي
              </h1>
              <p className="text-sm text-gray-500">
                إدارة ومتابعة جميع رعاياتك النشطة والعقود
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          {/* Main View Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setMainView("sponsorships")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
                mainView === "sponsorships"
                  ? "bg-[#e35654] text-white shadow-md shadow-[#e35654]/20"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#e35654] hover:text-[#e35654]"
              }`}
              style={{ fontWeight: 600 }}
            >
              <Eye className="w-4 h-4" />
              الرعايات
            </button>
            <button
              onClick={() => {
                setMainView("contracts");
                markContractsAsSeen();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
                mainView === "contracts"
                  ? "bg-[#e35654] text-white shadow-md shadow-[#e35654]/20"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#e35654] hover:text-[#e35654]"
              }`}
              style={{ fontWeight: 600 }}
            >
              <FileText className="w-4 h-4" />
              العقود
              {unseenContractsCount > 0 && (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ background: mainView === "contracts" ? "rgba(255,255,255,0.3)" : "#e35654", fontSize: 10, fontWeight: 700 }}
                >
                  {unseenContractsCount}
                </span>
              )}
            </button>
          </div>

          {mainView === "sponsorships" && (
            <>
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الأنشطة..."
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  activeTab === tab
                    ? "bg-[#e35654] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                style={{ fontWeight: activeTab === tab ? 600 : 400 }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sort */}
          <details className="relative">
            <summary className="list-none flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 bg-white text-sm hover:bg-gray-50 transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
              {sortKey}
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="absolute left-0 top-full mt-1.5 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 w-44 p-1.5">
              {SORT_OPTIONS.map((label) => {
                const active = sortKey === label;
                return (
                  <button
                    key={label}
                    onClick={(e) => {
                      setSortKey(label);
                      // أغلق الـ <details> بعد الاختيار
                      (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl text-sm transition-colors hover:bg-gray-50"
                    style={{
                      fontWeight: active ? 700 : 500,
                      color: active ? "#e35654" : "#374151",
                      background: active ? "#fef2f2" : "transparent",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </details>
        </div>

        {/* Loading / Error / Empty states */}
        {loading && (
          <div className="text-center py-16 text-gray-500 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري تحميل رعاياتك...
          </div>
        )}
        {!loading && loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            تعذّر تحميل البيانات: {loadError}
          </div>
        )}
        {!loading && !loadError && sponsorships.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              لا توجد رعايات مسجَّلة حالياً
            </p>
            <p className="text-gray-500 text-sm mb-4">
              تصفّح فرص الرعاية المتاحة وتقدّم على الباقة التي تناسبك.
            </p>
            <button
              onClick={() => navigate("/sponsor/opportunities")}
              className="px-5 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48]"
              style={{ fontWeight: 600 }}
            >
              تصفّح الفرص
            </button>
          </div>
        )}

        {/* Sponsorship Cards Grid */}
        <div className="grid sm:grid-cols-2 gap-5">
          {!loading && !loadError && filtered.map((sp) => (
            <div
              key={sp.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                sp.urgent ? "border-orange-200" : "border-gray-100"
              }`}
            >
              {/* Card Header — banner background from organizer's branding, with
                  name + logo/badge + package chip overlaid. Dark gradient at the
                  bottom keeps the title legible across any banner image/pattern. */}
              <div className="relative h-36 overflow-hidden border-b border-gray-50">
                <HackathonCover branding={sp.branding} id={sp.hackathonId} />
                {/* Bottom-up gradient — strong at bottom, faint at top — so the
                    status chip (top) stays readable on bright banners and the
                    title (bottom) sits on enough contrast. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 pointer-events-none" />

                {/* Status chip (top-right). The package indicator is rendered as
                    a chip at the bottom of the banner next to the title — no need
                    for a redundant top-left badge. */}
                <div className="relative z-10 flex items-start justify-end gap-2 px-4 pt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {sp.urgent && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 shadow-sm" style={{ fontWeight: 600 }}>
                        <AlertCircle className="w-3 h-3" />
                        قيد التقديم
                      </span>
                    )}
                    <span
                      className="text-xs px-2.5 py-1 rounded-full shadow-sm"
                      style={{ background: sp.statusBg, color: sp.statusColor, fontWeight: 600 }}
                    >
                      ● {sp.status}
                    </span>
                  </div>
                </div>

                {/* Organizer logo + title + package chip (bottom of banner) */}
                <div className="absolute bottom-0 inset-x-0 px-4 pb-3 z-10 flex items-end gap-3">
                  {/* Organizer logo: uploaded image → preset pattern → letter fallback */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/95 shadow-md flex-shrink-0 flex items-center justify-center">
                    {sp.branding?.logoMode === "upload" && sp.branding.logoUploadDataUrl ? (
                      <img
                        src={sp.branding.logoUploadDataUrl}
                        alt=""
                        aria-hidden
                        className="w-full h-full object-cover"
                      />
                    ) : sp.branding?.logoMode === "pattern" && sp.branding.logoPattern ? (
                      <LogoPattern
                        pattern={sp.branding.logoPattern}
                        colorPalette={sp.branding.colorPalette || "red"}
                      />
                    ) : (
                      <span
                        className="text-base"
                        style={{ color: "#e35654", fontWeight: 800 }}
                      >
                        {sp.name.trim()[0] ?? "م"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white mb-1.5 drop-shadow-md truncate" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      {sp.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md text-white shadow-sm"
                        style={{ background: sp.packageColor, fontWeight: 600 }}
                      >
                        {sp.package}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/90 drop-shadow">
                        <Calendar className="w-3.5 h-3.5" />
                        {sp.payDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-5 py-4">
                {/* Dates Row */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div>
                    <p className="text-gray-400 mb-0.5">التاريخ</p>
                    <p className="text-gray-700" style={{ fontWeight: 600 }}>{sp.financialDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 mb-0.5 text-center">حالة ادفع</p>
                    <p style={{ color: sp.deliveryColor, fontWeight: 600 }}>
                      {sp.deliveryStatus === "مدفوع بالكامل" && "● "}
                      {sp.deliveryStatus === "في انتظار الفاتورة" && "⏳ "}
                      {sp.deliveryStatus === "تأخر السداد" && "⚠ "}
                      {sp.deliveryStatus}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${sp.progress}%`,
                        background:
                          sp.progress >= 70
                            ? "#10b981"
                            : sp.progress >= 30
                            ? "#6366f1"
                            : "#f59e0b",
                      }}
                    />
                  </div>
                  <p className="text-gray-400 mt-1" style={{ fontSize: "0.68rem" }}>
                    {sp.progress}% — {sp.note}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {(() => {
                    const { label, Icon, action } = getActionConfig(sp);
                    return (
                      <button
                        onClick={action}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] shadow-sm shadow-[#e35654]/20 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => setCancellingId(sp.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs hover:bg-red-50 hover:border-red-300 transition-colors"
                    title="حذف الفرصة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                  <button
                    onClick={() => navigate("/sponsor/messages")}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    title="التواصل مع المنظم"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (filter mismatch) */}
        {!loading && !loadError && sponsorships.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>لا توجد رعايات في هذه الفئة</p>
            <p className="text-gray-400 text-xs mt-1">جرب تغيير الفلتر أو ابحث عن اسم مختلف</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#e35654]/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-[#e35654]" />
          </div>
          <p className="text-gray-700 mb-1" style={{ fontWeight: 700 }}>هل تبحث عن فرص جديدة؟</p>
          <p className="text-gray-400 text-sm mb-5">
            استكشف الهاكاثونات القائمة وقدم بسرعة لتكبير علاقاتك التجارية في مجتمع المبتكرين.
          </p>
          <button
            onClick={() => navigate("/sponsor/opportunities")}
            className="px-6 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20 transition-colors"
            style={{ fontWeight: 600 }}
          >
            تصفح الهاكاثونات المتاحة
          </button>
        </div>
            </>
          )}

          {mainView === "contracts" && (
            <>
              {contractsLoading && (
                <div className="text-center py-16 text-gray-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري تحميل العقود...
                </div>
              )}
              {!contractsLoading && contractsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm mb-4">
                  {contractsError}
                </div>
              )}
              {!contractsLoading && !contractsError && contracts.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                  <p className="text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    لا توجد عقود مسجَّلة بعد
                  </p>
                  <p className="text-gray-500 text-sm">
                    ستظهر العقود هنا فور قبول طلبات الرعاية وتوقيع المنظِّم عليها.
                  </p>
                </div>
              )}
              {!contractsLoading && !contractsError && contracts.length > 0 && (
            <>
              {/* Contract Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {(() => {
                  const totalValue = contracts.reduce((sum, c) => sum + c.rawPrice, 0);
                  const totalValueLabel =
                    totalValue >= 1000
                      ? `${(totalValue / 1000).toFixed(1)}K`
                      : totalValue.toLocaleString("ar-SA");
                  return [
                    { label: "إجمالي العقود", value: contracts.length.toString(), color: "#6366f1", bg: "#eef2ff" },
                    { label: "عقود سارية", value: contracts.filter(c => c.status === "ساري").length.toString(), color: "#10b981", bg: "#f0fdf4" },
                    { label: "بانتظار التوقيع", value: contracts.filter(c => !c.signed).length.toString(), color: "#f59e0b", bg: "#fffbeb" },
                    { label: "إجمالي القيمة", value: totalValueLabel, color: "#e35654", bg: "#fef2f2" },
                  ];
                })().map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-sm transition-shadow">
                    <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.3rem" }}>{stat.value}</p>
                    <p className="text-gray-400 mt-1" style={{ fontSize: "0.7rem" }}>{stat.label}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                      <div className="h-1 rounded-full" style={{ width: "100%", background: stat.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Contract Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
                {contractTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setContractFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm transition-all ${
                      contractFilter === tab
                        ? "bg-[#e35654] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                    style={{ fontWeight: contractFilter === tab ? 600 : 400 }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Contracts List */}
              <div className="space-y-3">
                {contracts
                  .filter(c => contractFilter === "الكل" || c.status === contractFilter)
                  .map((contract) => (
                    <div
                      key={contract.id}
                      className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                        !contract.signed ? "border-[#f59e0b]/30" : "border-gray-100"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center"
                              style={{ background: contract.signed ? "#f0fdf4" : "#fffbeb" }}
                            >
                              <FileText
                                className="w-5 h-5"
                                style={{ color: contract.signed ? "#10b981" : "#f59e0b" }}
                              />
                            </div>
                            <div>
                              <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                                {contract.hackathon}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {contract.organizer}
                                </span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-md text-white"
                                  style={{ background: contract.packageColor, fontWeight: 600 }}
                                >
                                  {contract.package}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span
                            className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: contract.statusBg, color: contract.statusColor, fontWeight: 600 }}
                          >
                            {contract.status}
                          </span>
                        </div>

                        {/* Pending Hint */}
                        {contract.pendingHint && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 mb-3 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-amber-800 text-xs leading-relaxed" style={{ fontWeight: 500 }}>
                              {contract.pendingHint}
                            </p>
                          </div>
                        )}

                        {/* Contract Details */}
                        <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-3.5 mb-3">
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">تاريخ التوقيع</p>
                            <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{contract.signDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">تاريخ الفعالية</p>
                            <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{contract.expiryDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">قيمة العقد</p>
                            <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{contract.value}</p>
                          </div>
                        </div>

                        {/* Actions — زر واحد لفتح العقد، والتحميل داخل النافذة */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingContractId(contract.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] transition-colors shadow-sm shadow-[#e35654]/20"
                            style={{ fontWeight: 600 }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            عرض العقد
                          </button>
                          <button
                            onClick={() => navigate("/sponsor/messages")}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs hover:bg-gray-50 transition-colors"
                            style={{ fontWeight: 600 }}
                            title="الرجوع للشات"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty State for contracts */}
              {contracts.filter(c => contractFilter === "الكل" || c.status === contractFilter).length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>لا توجد عقود في هذه الفئة</p>
                  <p className="text-gray-400 text-xs mt-1">جرب تغيير الفلتر</p>
                </div>
              )}
            </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Contract View Modal */}
      {(() => {
        const viewing = viewingContractId !== null
          ? contracts.find((c) => c.id === viewingContractId)
          : null;
        if (!viewing) return null;
        return (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 contract-modal-overlay"
            onClick={() => setViewingContractId(null)}
          >
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                .contract-print, .contract-print * { visibility: visible !important; }
                .contract-print {
                  position: absolute !important;
                  inset: 0 !important;
                  background: white !important;
                  padding: 32px !important;
                  box-shadow: none !important;
                  max-width: none !important;
                  max-height: none !important;
                  overflow: visible !important;
                  border-radius: 0 !important;
                }
                .contract-modal-overlay {
                  position: absolute !important;
                  inset: 0 !important;
                  background: white !important;
                  padding: 0 !important;
                }
                .no-print { display: none !important; }
              }
            `}</style>
            <div
              dir="rtl"
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto contract-print"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-6 text-center text-white rounded-t-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#e35654] flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 style={{ fontWeight: 800, fontSize: "1.15rem" }}>
                  عقد رعاية رسمي
                </h2>
                <p className="text-gray-300 text-xs mt-1">
                  رقم: #SP-{new Date().getFullYear()}-
                  {String(viewing.id).padStart(4, "0")}
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">الطرف الأول (المنظم)</p>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                      {viewing.organizer}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">الطرف الثاني (الراعي)</p>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                      الباقة: {viewing.package}
                    </p>
                  </div>
                </div>

                {/* Terms */}
                <div className="border-t border-dashed border-gray-200 pt-4">
                  <h3 className="text-gray-900 text-sm mb-3" style={{ fontWeight: 700 }}>
                    بنود العقد
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "الهاكاثون", value: viewing.hackathon },
                      { label: "الباقة", value: viewing.package },
                      { label: "قيمة الرعاية", value: viewing.value },
                      { label: "تاريخ التوقيع", value: viewing.signDate },
                      { label: "تاريخ الفعالية", value: viewing.expiryDate },
                      { label: "الحالة", value: viewing.status },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-gray-100"
                      >
                        <span className="text-gray-500 text-xs">{item.label}</span>
                        <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt Section */}
                {viewing.receiptFile && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#10b981]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                            إيصال الدفع المرفوع
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {viewing.receiptFile}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`${API_URL}/uploads/receipts/${viewing.receiptFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10b981] text-white text-xs hover:bg-[#0ea872] transition-colors no-print flex-shrink-0"
                        style={{ fontWeight: 600 }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        تنزيل
                      </a>
                    </div>
                  </div>
                )}

                {/* Footer Note */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FileSignature className="w-4 h-4 text-green-600" />
                    <p className="text-green-800 text-sm" style={{ fontWeight: 700 }}>
                      عقد موقّع رقمياً
                    </p>
                  </div>
                  <p className="text-green-700 text-xs">
                    تمّ توقيع العقد إلكترونياً وحفظه في سجلات المنصة.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex items-center gap-2 no-print">
                <button
                  onClick={() => setViewingContractId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
                  style={{ fontWeight: 600 }}
                >
                  إغلاق
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white bg-[#e35654] hover:bg-[#cc4a48] flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  <Download className="w-4 h-4" />
                  حفظ كـ PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !cancelling && setCancellingId(null)}
        >
          <div
            dir="rtl"
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-gray-900 mb-2"
              style={{ fontWeight: 700, fontSize: "1.1rem" }}
            >
              تأكيد الحذف
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              هل أنت متأكد من حذف الرعاية على:
            </p>
            <p
              className="text-base mb-1"
              style={{ fontWeight: 700, color: "#e35654" }}
            >
              {cancelTarget.name}
            </p>
            <p className="text-xs text-gray-500 mb-6">
              سيتم حذف السجل بشكل نهائي. لو الطلب كان مقبولاً، ستفقد العقد والمدفوعات المرتبطة به.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancellingId(null)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                style={{ fontWeight: 600 }}
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                {cancelling ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}