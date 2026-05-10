import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCircle2,
  Trophy,
  Users,
  Star,
  CheckCheck,
  Trash2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { apiGet, apiPut, apiDelete, ApiError } from "../../lib/api";

type NotificationType = "acceptance" | "team" | "deadline" | "evaluation" | "achievement" | "system";

interface ApiNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionLabel: string | null;
  actionRoute: string | null;
  createdAt: string;
}

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

function formatRelativeTime(iso: string): string {
  const created = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - created) / 1000));
  if (diffSec < 60) return "الآن";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `منذ ${diffDay} يوم`;
  const diffMonth = Math.round(diffDay / 30);
  return `منذ ${diffMonth} شهر`;
}

function toUiNotification(n: ApiNotification): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    time: formatRelativeTime(n.createdAt),
    read: n.read,
    actionLabel: n.actionLabel ?? undefined,
    actionRoute: n.actionRoute ?? undefined,
  };
}


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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiNotification[] }>("/participants/notifications")
      .then((data) => {
        if (cancelled) return;
        setNotifications(data.items.map(toUiNotification));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "فشل تحميل الإشعارات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await apiPut("/participants/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل تحديث الإشعارات");
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiPut(`/participants/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل تحديث الإشعار");
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await apiDelete(`/participants/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "فشل حذف الإشعار");
    }
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
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 text-sm">
              جاري تحميل الإشعارات...
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-100 p-12 text-center text-red-500 text-sm">
              {error}
            </div>
          ) : filtered.length === 0 ? (
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
