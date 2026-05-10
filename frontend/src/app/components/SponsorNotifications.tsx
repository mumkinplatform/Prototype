import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  MessageCircle,
  FileText,
  Handshake,
  Calendar,
  Info,
  ChevronLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { apiGet, ApiError } from "../../lib/api";

// ── API Types ────────────────────────────────────────────────

interface ApiApplicationItem {
  id: number;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  package: { id: number; name: string; type: string; price: number | null };
  hackathon: { id: number; title: string; status: string; startDate: string | null };
}

interface ApplicationsApi {
  items: ApiApplicationItem[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

function applicationToNotification(app: ApiApplicationItem): Notification {
  if (app.status === "accepted") {
    return {
      id: app.id,
      type: "success",
      title: "تم قبول طلب الرعاية",
      message: `تم قبول طلبك على باقة ${app.package.name} في ${app.hackathon.title}`,
      time: timeAgo(app.appliedAt),
      read: false,
      icon: CheckCircle2,
      color: "#10b981",
      bg: "#f0fdf4",
      link: `/sponsor/hackathon/${app.hackathon.id}`,
    };
  }
  if (app.status === "rejected") {
    return {
      id: app.id,
      type: "alert",
      title: "تم رفض طلب الرعاية",
      message: `للأسف، لم يتم قبول طلبك على باقة ${app.package.name} في ${app.hackathon.title}`,
      time: timeAgo(app.appliedAt),
      read: false,
      icon: AlertCircle,
      color: "#ef4444",
      bg: "#fef2f2",
      link: "/sponsor/sponsorships",
    };
  }
  return {
    id: app.id,
    type: "info",
    title: "تم تقديم طلب الرعاية",
    message: `قدّمت على باقة ${app.package.name} في ${app.hackathon.title} — بانتظار رد المنظم`,
    time: timeAgo(app.appliedAt),
    read: false,
    icon: Handshake,
    color: "#6366f1",
    bg: "#eef2ff",
    link: `/sponsor/hackathon/${app.hackathon.id}`,
  };
}

interface Notification {
  id: number;
  type: "success" | "info" | "warning" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: typeof Bell;
  color: string;
  bg: string;
  link?: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "alert",
    title: "عقد بانتظار التوقيع",
    message: "هاكاثون NEOM 2025 — الباقة الذهبية. يُرجى مراجعة البنود وإتمام التوقيع الرقمي قبل 15 مارس.",
    time: "منذ 30 دقيقة",
    read: false,
    icon: FileText,
    color: "#e35654",
    bg: "#fef2f2",
    link: "/sponsor/negotiation",
  },
  {
    id: 2,
    type: "success",
    title: "تم تأكيد الدفعة بنجاح",
    message: "تم استلام مبلغ 75,000 ر.س لرعاية هاكاثون الذكاء الاصطناعي العالمي 2024.",
    time: "منذ ساعتين",
    read: false,
    icon: CreditCard,
    color: "#10b981",
    bg: "#f0fdf4",
    link: "/sponsor/payments",
  },
  {
    id: 3,
    type: "info",
    title: "رسالة جديدة من منظم TechVision",
    message: "مرحبًا، نود مناقشة تفاصيل الباقة البلاتينية وتحديد موعد الاجتماع.",
    time: "منذ 3 ساعات",
    read: false,
    icon: MessageCircle,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    link: "/sponsor/messages",
  },
  {
    id: 4,
    type: "warning",
    title: "موعد سداد فاتورة قريب",
    message: "فاتورة رعاية تحدي الأمن السيبراني بقيمة 40,000 ر.س مستحقة خلال 3 أيام.",
    time: "منذ 5 ساعات",
    read: false,
    icon: AlertCircle,
    color: "#f59e0b",
    bg: "#fffbeb",
    link: "/sponsor/payments",
  },
  {
    id: 5,
    type: "success",
    title: "تم قبول طلب الرعاية",
    message: "تهانينا! تم قبول طلب رعايتك لهاكاثون التقنية المالية 2024 - باقة شريك إستراتيجي.",
    time: "أمس 2:30 م",
    read: true,
    icon: Handshake,
    color: "#10b981",
    bg: "#f0fdf4",
    link: "/sponsor/sponsorships",
  },
  {
    id: 6,
    type: "info",
    title: "تحديث في جدول الهاكاثون",
    message: "تم تعديل موعد هاكاثون الجامعات الناشئة من 20 نوفمبر إلى 25 نوفمبر 2024.",
    time: "أمس 10:15 ص",
    read: true,
    icon: Calendar,
    color: "#6366f1",
    bg: "#eef2ff",
    link: "/sponsor/sponsorships",
  },
  {
    id: 7,
    type: "success",
    title: "تقرير ترويجي جاهز",
    message: "تقرير أداء رعايتك لهاكاثون الذكاء الاصطناعي جاهز للتحميل — 12,400 مشاهدة و 3,200 تفاعل.",
    time: "منذ يومين",
    read: true,
    icon: CheckCircle2,
    color: "#10b981",
    bg: "#f0fdf4",
    link: "/sponsor/sponsorships",
  },
  {
    id: 8,
    type: "info",
    title: "دعوة لحضور حفل الختام",
    message: "تمت دعوتك لحضور حفل ختام هاكاثون الطاقة المتجددة يوم 22 نوفمبر في قاعة المؤتمرات.",
    time: "منذ 3 أيام",
    read: true,
    icon: Info,
    color: "#06b6d4",
    bg: "#ecfeff",
  },
  {
    id: 9,
    type: "warning",
    title: "تنبيه: مستندات مطلوبة",
    message: "يُرجى رفع نسخة من السجل التجاري المحدث لإتمام إجراءات عقد رعاية NEOM 2025.",
    time: "منذ 4 أيام",
    read: true,
    icon: AlertCircle,
    color: "#f59e0b",
    bg: "#fffbeb",
    link: "/sponsor/profile",
  },
  {
    id: 10,
    type: "success",
    title: "تم رفع العقد الموقع",
    message: "تم رفع نسخة العقد الموقعة بنجاح لهاكاثون الرياض التقني.",
    time: "منذ أسبوع",
    read: true,
    icon: FileText,
    color: "#10b981",
    bg: "#f0fdf4",
    link: "/sponsor/negotiation",
  },
];

const filterTabs = ["الكل", "غير مقروء", "تنبيهات", "رسائل", "عقود"];

export function SponsorNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<ApplicationsApi>("/sponsors/applications")
      .then((res) => {
        if (cancelled) return;
        setNotifications(res.items.map(applicationToNotification));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError ? err.message : "تعذّر تحميل الإشعارات"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === "الكل") return true;
    if (activeFilter === "غير مقروء") return !n.read;
    if (activeFilter === "تنبيهات") return n.type === "warning" || n.type === "alert";
    if (activeFilter === "رسائل") return n.icon === MessageCircle;
    if (activeFilter === "عقود") return n.icon === FileText || n.icon === Handshake;
    return true;
  });

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/sponsor")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  الإشعارات
                </h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0
                    ? `لديك ${unreadCount} إشعارات غير مقروءة`
                    : "جميع الإشعارات مقروءة"}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-[#e35654] hover:bg-[#fef2f2] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <CheckCheck className="w-4 h-4" />
                  قراءة الكل
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-all ${
                  activeFilter === tab
                    ? "bg-[#e35654] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                style={{ fontWeight: activeFilter === tab ? 600 : 400 }}
              >
                {tab}
                {tab === "غير مقروء" && unreadCount > 0 && (
                  <span
                    className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-white"
                    style={{ background: activeFilter === tab ? "rgba(255,255,255,0.3)" : "#e35654", fontSize: 10, fontWeight: 700 }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="text-center py-12 text-gray-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل الإشعارات...
            </div>
          )}
          {!loading && loadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {loadError}
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-2">
            {!loading && !loadError && filtered.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-sm group ${
                    !notif.read ? "border-[#e35654]/20 bg-[#fffbfb]" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3.5 p-4 sm:p-5">
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-2">
                      {!notif.read ? (
                        <span className="block w-2.5 h-2.5 rounded-full bg-[#e35654]" />
                      ) : (
                        <span className="block w-2.5 h-2.5 rounded-full bg-transparent" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: notif.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: notif.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="text-gray-900 text-sm"
                          style={{ fontWeight: !notif.read ? 700 : 600 }}
                        >
                          {notif.title}
                        </h3>
                        <span className="text-gray-300 text-xs flex-shrink-0 mt-0.5">{notif.time}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{notif.message}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {notif.link && (
                          <button
                            onClick={() => {
                              markAsRead(notif.id);
                              navigate(notif.link!);
                            }}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#fef2f2] text-[#e35654] hover:bg-[#fde8e8] transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            عرض التفاصيل
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            style={{ fontWeight: 500 }}
                          >
                            تحديد كمقروء
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-gray-300 hover:text-[#c94d6a] transition-colors opacity-0 group-hover:opacity-100 mr-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {!loading && !loadError && filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
                {notifications.length === 0
                  ? "ما عندك إشعارات حالياً"
                  : "لا توجد إشعارات في هذه الفئة"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {notifications.length === 0
                  ? "ستظهر هنا تنبيهات تقديماتك ومستجدات الرعاية."
                  : "جرب تغيير الفلتر لعرض إشعارات أخرى"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}