import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  FileText,
  ChevronLeft,
} from "lucide-react";

const invoices = [
  {
    id: "INV-2025-001",
    hackathon: "هاكاثون الذكاء الاصطناعي العالمي 2024",
    package: "ماسي",
    packageColor: "#06b6d4",
    amount: "75,000 ر.س",
    date: "12 مايو 2024",
    dueDate: "26 مايو 2024",
    status: "مدفوع",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    statusIcon: CheckCircle2,
  },
  {
    id: "INV-2025-002",
    hackathon: "تحدي الأمن السيبراني الإقليمي",
    package: "ذهبي",
    packageColor: "#f59e0b",
    amount: "40,000 ر.س",
    date: "30 أكتوبر 2024",
    dueDate: "13 نوفمبر 2024",
    status: "في انتظار الدفع",
    statusColor: "#f59e0b",
    statusBg: "#fffbeb",
    statusIcon: Clock,
  },
  {
    id: "INV-2025-003",
    hackathon: "هاكاثون الجامعات الناشئة",
    package: "فضي",
    packageColor: "#6b7280",
    amount: "22,500 ر.س",
    date: "22 يوليو 2024",
    dueDate: "5 أغسطس 2024",
    status: "متأخر",
    statusColor: "#a41b42",
    statusBg: "#fef2f2",
    statusIcon: AlertCircle,
  },
  {
    id: "INV-2025-004",
    hackathon: "هاكاثون التقنية المالية 2024",
    package: "شريك إستراتيجي",
    packageColor: "#8b5cf6",
    amount: "120,000 ر.س",
    date: "13 مارس 2024",
    dueDate: "27 مارس 2024",
    status: "مدفوع",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    statusIcon: CheckCircle2,
  },
];

const summary = [
  { label: "إجمالي المدفوعات", value: "195,000 ر.س", color: "#10b981", bg: "#f0fdf4", icon: CheckCircle2 },
  { label: "مستحق الدفع", value: "40,000 ر.س", color: "#f59e0b", bg: "#fffbeb", icon: Clock },
  { label: "متأخر", value: "22,500 ر.س", color: "#a41b42", bg: "#fef2f2", icon: AlertCircle },
  { label: "إجمالي الفواتير", value: "4", color: "#6366f1", bg: "#eef2ff", icon: FileText },
];

export function PaymentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("الكل");
  const tabs = ["الكل", "مدفوع", "في انتظار الدفع", "متأخر"];

  const filtered = invoices.filter(
    (inv) => activeTab === "الكل" || inv.status === activeTab
  );

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
                تتبع وإدارة جميع الفواتير والمدفوعات الخاصة بالرعايات
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summary.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: s.bg }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1rem" }}>{s.value}</p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.7rem" }}>{s.label}</p>
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
                    ? "bg-[#a41b42] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={{ fontWeight: activeTab === tab ? 700 : 500 }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Invoices List */}
          <div className="space-y-3">
            {filtered.map((inv) => {
              const StatusIcon = inv.statusIcon;
              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                            {inv.hackathon}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: inv.packageColor + "18", color: inv.packageColor, fontWeight: 600 }}
                          >
                            {inv.package}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs">{inv.id} · تاريخ الإصدار: {inv.date}</p>
                        <p className="text-gray-400 text-xs mt-0.5">تاريخ الاستحقاق: {inv.dueDate}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1rem" }}>{inv.amount}</p>
                      <span
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: inv.statusBg, color: inv.statusColor, fontWeight: 600 }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 border-t border-gray-50 pt-4">
                    
                    {inv.status !== "مدفوع" && (
                      <button
                        onClick={() => navigate("/sponsor/messages", { state: { financial: true } })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#a41b42] text-white text-xs hover:bg-[#8b1538] shadow-sm shadow-[#a41b42]/20 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        رفع إثبات الدفع
                      </button>
                    )}
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
        </div>
      </div>
    </>
  );
}