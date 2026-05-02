import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCircle2,
  Trophy,
  Users,
  FileText,
  Calendar,
  Star,
  X,
  CheckCheck,
  Trash2,
  Filter,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";

interface Notification {
  id: number;
  type: "acceptance" | "team" | "deadline" | "evaluation" | "achievement" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "acceptance",
    title: "تم قبولك في الهاكاثون!",
    message: "تهانينا! تم قبولك في هاكاثون قمة الذكاء الاصطناعي العالمية. يمكنك الآن الدخول لمساحة العمل.",
    time: "منذ 5 دقائق",
    read: false,
    actionLabel: "دخول مساحة العمل",
    actionRoute: "/participant/workspace",
  },
  {
    id: 2,
    type: "team",
    title: "عضو جديد انضم لفريقك",
    message: "انضمت ريم العتيبي (مصممة UI/UX) لفريقك في هاكاثون الذكاء الاصطناعي.",
    time: "منذ 30 دقيقة",
    read: false,
  },
  {
    id: 3,
    type: "deadline",
    title: "تنبيه: موعد التسليم يقترب!",
    message: "تبقى 3 أيام على الموعد النهائي لتسليم المشروع في هاكاثون الذكاء الاصطناعي. تأكد من رفع مشروعك النهائي.",
    time: "منذ ساعة",
    read: false,
    actionLabel: "رفع المشروع",
    actionRoute: "/participant/workspace",
  },
  {
    id: 4,
    type: "evaluation",
    title: "تقييم جديد من الحكام",
    message: "حصل مشروعك على تقييم جديد من أحد الحكام في مسار الذكاء الاصطناعي. الدرجة: 85/100.",
    time: "منذ 3 ساعات",
    read: true,
    actionLabel: "عرض التقييم",
    actionRoute: "/participant/workspace",
  },
  {
    id: 5,
    type: "achievement",
    title: "مبارك! حصلت على شهادة مشاركة",
    message: "تم إصدار شهادة مشاركتك في هاكاثون التقنية المالية. يمكنك تحميلها الآن.",
    time: "منذ يوم",
    read: true,
    actionLabel: "تحميل الشهادة",
    actionRoute: "/participant/workspace",
  },
  {
    id: 6,
    type: "system",
    title: "تحديث سياسة المنصة",
    message: "تم تحديث شروط وأحكام استخدام منصة مُمكّن. يرجى الاطلاع عليها.",
    time: "منذ يومين",
    read: true,
  },
  {
    id: 7,
    type: "team",
    title: "رسالة جديدة في شات الفريق",
    message: "محمد علي أرسل رسالة: 'أنا خلصت من الواجهة الأمامية، من يراجعها؟'",
    time: "منذ يومين",
    read: true,
  },
  {
    id: 8,
    type: "acceptance",
    title: "هاكاثون جديد يناسب مهاراتك!",
    message: "بناءً على خبراتك في React وAI، نرشّح لك هاكاثون حلول المدن الذكية. سجّل الآن!",
    time: "منذ 3 أيام",
    read: true,
    actionLabel: "عرض الهاكاثون",
    actionRoute: "/participant/hackathons",
  },
];

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  acceptance: { icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4", label: "قبول" },
  team: { icon: Users, color: "#6366f1", bg: "#eef2ff", label: "فريق" },
  deadline: { icon: Clock, color: "#f59e0b", bg: "#fffbeb", label: "موعد نهائي" },
  evaluation: { icon: Star, color: "#e35654", bg: "#fef2f2", label: "تقييم" },
  achievement: { icon: Trophy, color: "#f59e0b", bg: "#fffbeb", label: "إنجاز" },
  system: { icon: Bell, color: "#6b7280", bg: "#f3f4f6", label: "نظام" },
};

const filterTabs = ["الكل", "غير مقروء", "قبول", "فريق", "تقييم", "موعد نهائي"];

export function ParticipantNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState("الكل");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === "الكل") return true;
    if (activeFilter === "غير مقروء") return !n.read;
    const typeMap: Record<string, string> = {
      "قبول": "acceptance",
      "فريق": "team",
      "تقييم": "evaluation",
      "موعد نهائي": "deadline",
    };
    return n.type === typeMap[activeFilter];
  });

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/participant")}
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

          {/* Notifications List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm" style={{ fontWeight: 600 }}>
                لا توجد إشعارات
              </p>
              <p className="text-gray-400 text-xs mt-1">ستظهر هنا الإشعارات الجديدة عند وصولها</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((notif) => {
                const config = typeConfig[notif.type];
                const Icon = config.icon;
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
                        style={{ background: config.bg }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
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
                          {notif.actionLabel && (
                            <button
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.actionRoute) navigate(notif.actionRoute);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors"
                              style={{
                                background: "#e35654",
                                color: "#fff",
                                fontWeight: 600,
                              }}
                            >
                              {notif.actionLabel}
                            </button>
                          )}
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-gray-400 hover:text-[#e35654] transition-colors"
                              style={{ fontWeight: 500 }}
                            >
                              تحديد كمقروء
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-[#e35654] hover:bg-[#fef2f4] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
