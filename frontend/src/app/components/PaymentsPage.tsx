import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { apiGet, ApiError } from "../../lib/api";

// ── API Types ────────────────────────────────────────────────

interface ApiPayment {
  id: number;
  amount: number;
  currency: string;
  invoiceDate: string;
  status: "pending" | "paid";
  hackathon: { id: number; title: string };
  package: { id: number; name: string };
}

interface PaymentsSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  invoicesCount: number;
  paidCount: number;
  pendingCount: number;
}

interface PaymentsResponse {
  items: ApiPayment[];
  summary: PaymentsSummary;
}

// ── Display helpers ──────────────────────────────────────────

const STATUS_LABELS: Record<
  ApiPayment["status"],
  { label: string; color: string; bg: string }
> = {
  pending: { label: "بانتظار الدفع", color: "#f59e0b", bg: "#fffbeb" },
  paid: { label: "مدفوع", color: "#10b981", bg: "#f0fdf4" },
};

function formatPrice(value: number): string {
  return `${value.toLocaleString("ar-SA")} ر.س`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** تاريخ استحقاق الفاتورة = تاريخ الإصدار + 14 يوماً */
function computeDueDate(invoiceDate: string): string {
  if (!invoiceDate) return "—";
  const d = new Date(invoiceDate);
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function invoiceNumber(id: number, invoiceDate: string): string {
  const year = invoiceDate ? new Date(invoiceDate).getFullYear() : new Date().getFullYear();
  return `INV-${year}-${String(id).padStart(3, "0")}`;
}

// ── Component ────────────────────────────────────────────────

export function PaymentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"الكل" | "مدفوع" | "بانتظار الدفع">("الكل");
  const tabs: Array<"الكل" | "مدفوع" | "بانتظار الدفع"> = ["الكل", "مدفوع", "بانتظار الدفع"];

  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<PaymentsResponse>("/sponsors/payments")
      .then((res) => {
        if (cancelled) return;
        setPayments(res.items);
        setSummary(res.summary);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "تعذّر تحميل المدفوعات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = payments.filter((p) => {
    if (activeTab === "الكل") return true;
    return STATUS_LABELS[p.status].label === activeTab;
  });

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
                المدفوعات
              </h1>
              <p className="text-sm text-gray-500">
                تتبّع وإدارة جميع الفواتير والمدفوعات الخاصة برعاياتكِ
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7 space-y-6">
          {/* Loading / Error */}
          {loading && (
            <div className="text-center py-12 text-gray-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل المدفوعات...
            </div>
          )}
          {!loading && loadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {loadError}
            </div>
          )}

          {!loading && !loadError && summary && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "إجمالي الفواتير",
                    value: formatPrice(summary.totalAmount),
                    color: "#6366f1",
                    bg: "#eef2ff",
                    icon: FileText,
                  },
                  {
                    label: "تم دفعه",
                    value: formatPrice(summary.paidAmount),
                    color: "#10b981",
                    bg: "#f0fdf4",
                    icon: CheckCircle2,
                  },
                  {
                    label: "مستحق الدفع",
                    value: formatPrice(summary.pendingAmount),
                    color: "#f59e0b",
                    bg: "#fffbeb",
                    icon: Clock,
                  },
                  {
                    label: "عدد الفواتير",
                    value: String(summary.invoicesCount),
                    color: "#e35654",
                    bg: "#fef2f2",
                    icon: CreditCard,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                      style={{ background: s.bg }}
                    >
                      <s.icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                    <p
                      className="text-gray-900"
                      style={{ fontWeight: 800, fontSize: "1rem" }}
                    >
                      {s.value}
                    </p>
                    <p
                      className="text-gray-400 mt-0.5"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      activeTab === tab
                        ? "bg-[#e35654] text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                    style={{ fontWeight: activeTab === tab ? 700 : 500 }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Empty State */}
              {payments.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                  <p className="text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    لا توجد فواتير حالياً
                  </p>
                  <p className="text-gray-500 text-sm">
                    تظهر الفواتير هنا عند قبول طلبات الرعاية الخاصة بك.
                  </p>
                </div>
              )}

              {/* No results for current tab */}
              {payments.length > 0 && filtered.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                  <p className="text-gray-500 text-sm">
                    لا توجد فواتير ضمن هذه الفئة.
                  </p>
                </div>
              )}

              {/* Invoices List */}
              <div className="space-y-3">
                {filtered.map((p) => {
                  const status = STATUS_LABELS[p.status];
                  const StatusIcon = p.status === "paid" ? CheckCircle2 : Clock;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p
                                className="text-gray-900 text-sm"
                                style={{ fontWeight: 700 }}
                              >
                                {p.hackathon.title}
                              </p>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "#e3565418",
                                  color: "#e35654",
                                  fontWeight: 600,
                                }}
                              >
                                {p.package.name}
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs">
                              {invoiceNumber(p.id, p.invoiceDate)} · تاريخ الإصدار:{" "}
                              {formatDate(p.invoiceDate)}
                            </p>
                            <p className="text-gray-400 text-xs mt-0.5">
                              تاريخ الاستحقاق: {computeDueDate(p.invoiceDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p
                            className="text-gray-900"
                            style={{ fontWeight: 800, fontSize: "1rem" }}
                          >
                            {formatPrice(p.amount)}
                          </p>
                          <span
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                            style={{
                              background: status.bg,
                              color: status.color,
                              fontWeight: 600,
                            }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 border-t border-gray-50 pt-4">
                        {p.status === "pending" && (
                          <button
                            onClick={() =>
                              navigate("/sponsor/messages", {
                                state: { financial: true },
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] shadow-sm shadow-[#e35654]/20 transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            رفع إثبات الدفع
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/sponsor/hackathon/${p.hackathon.id}`, {
                              state: { from: "/sponsor/payments" },
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
                        >
                          عرض الهاكاثون
                        </button>
                        <button
                          onClick={() => navigate("/sponsor/messages")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors mr-auto"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          التواصل مع المنظم
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
