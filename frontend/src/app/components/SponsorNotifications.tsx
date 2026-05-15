import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle,
  Info,
  Gift,
  Users,
  Calendar,
  Award,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPut, apiDelete, ApiError } from '../../lib/api';

type ApiNotificationType = 'acceptance' | 'team' | 'deadline' | 'evaluation' | 'achievement' | 'system' | 'submission';

interface ApiNotification {
  id: number;
  type: ApiNotificationType;
  title: string;
  message: string;
  read: boolean;
  actionLabel: string | null;
  actionRoute: string | null;
  createdAt: string;
}

// Map DB types to the icon/colour the card UI was built around — identical
// to the organizer's notifications page so the look is consistent.
const TYPE_PRESENTATION: Record<ApiNotificationType, { icon: typeof Bell; color: string; bg: string; filter: 'success' | 'info' | 'warning' | 'alert' }> = {
  acceptance:  { icon: CheckCircle, color: '#10b981', bg: '#f0fdf4', filter: 'success' },
  achievement: { icon: Award,       color: '#10b981', bg: '#f0fdf4', filter: 'success' },
  team:        { icon: Users,       color: '#6366f1', bg: '#eef2ff', filter: 'info' },
  submission:  { icon: Users,       color: '#6366f1', bg: '#eef2ff', filter: 'info' },
  evaluation:  { icon: Gift,        color: '#e35654', bg: '#fef2f2', filter: 'alert' },
  deadline:    { icon: Calendar,    color: '#f59e0b', bg: '#fffbeb', filter: 'warning' },
  system:      { icon: Info,        color: '#06b6d4', bg: '#ecfeff', filter: 'info' },
};

const filterTabs = ['الكل', 'غير مقروء', 'نجاح', 'تنبيهات', 'معلومات'] as const;
type FilterTab = typeof filterTabs[number];

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'الآن';
  if (min < 60) return `منذ ${min} دقيقة`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `منذ ${weeks} أسبوع`;
  const months = Math.floor(days / 30);
  return `منذ ${months} شهر`;
}

export function SponsorNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('الكل');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<{ items: ApiNotification[] }>('/sponsors/notifications')
      .then(async (data) => {
        if (cancelled) return;
        setNotifications(data.items);
        // Auto-mark all as read the moment the inbox opens — mirrors the
        // organizer flow. The visual unread highlight stays for this view;
        // the navbar dot clears on the next route change.
        if (data.items.some((n) => !n.read)) {
          try { await apiPut('/sponsors/notifications/read-all'); }
          catch { /* tolerate failure — retry on next visit */ }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          toast.error('هذه الصفحة مخصصة للرعاة');
        } else {
          toast.error('تعذّر تحميل الإشعارات');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    const prev = notifications;
    setNotifications((cur) => cur.map((n) => ({ ...n, read: true })));
    try {
      await apiPut('/sponsors/notifications/read-all');
    } catch {
      setNotifications(prev);
      toast.error('تعذّر تحديث الإشعارات');
    }
  };

  const markAsRead = async (id: number) => {
    const prev = notifications;
    setNotifications((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiPut(`/sponsors/notifications/${id}/read`);
    } catch {
      setNotifications(prev);
      toast.error('تعذّر تحديث الإشعار');
    }
  };

  const removeNotification = async (id: number) => {
    const prev = notifications;
    setNotifications((cur) => cur.filter((n) => n.id !== id));
    try {
      await apiDelete(`/sponsors/notifications/${id}`);
    } catch {
      setNotifications(prev);
      toast.error('تعذّر حذف الإشعار');
    }
  };

  const handleOpen = (n: ApiNotification) => {
    if (!n.read) void markAsRead(n.id);
    if (n.actionRoute) navigate(n.actionRoute);
  };

  const filtered = notifications.filter((n) => {
    const view = (TYPE_PRESENTATION[n.type] ?? TYPE_PRESENTATION.system).filter;
    if (activeFilter === 'الكل') return true;
    if (activeFilter === 'غير مقروء') return !n.read;
    if (activeFilter === 'نجاح') return view === 'success';
    if (activeFilter === 'تنبيهات') return view === 'warning' || view === 'alert';
    if (activeFilter === 'معلومات') return view === 'info';
    return true;
  });

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/sponsor')}
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
                  {loading
                    ? 'جاري التحميل…'
                    : unreadCount > 0
                      ? `لديك ${unreadCount} إشعارات غير مقروءة`
                      : 'جميع الإشعارات مقروءة'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
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
                    ? 'bg-[#e35654] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={{ fontWeight: activeFilter === tab ? 600 : 400 }}
              >
                {tab}
                {tab === 'غير مقروء' && unreadCount > 0 && (
                  <span
                    className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-white"
                    style={{ background: activeFilter === tab ? 'rgba(255,255,255,0.3)' : '#e35654', fontSize: 10, fontWeight: 700 }}
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
              جاري تحميل الإشعارات…
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
                const pres = TYPE_PRESENTATION[notif.type] ?? TYPE_PRESENTATION.system;
                const Icon = pres.icon;
                const clickable = !!notif.actionRoute;
                return (
                  <div
                    key={notif.id}
                    onClick={clickable ? () => handleOpen(notif) : undefined}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-sm group ${
                      !notif.read ? 'border-[#e35654]/20 bg-[#fffbfb]' : 'border-gray-100'
                    } ${clickable ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start gap-3.5 p-4 sm:p-5">
                      <div className="flex-shrink-0 mt-2">
                        {!notif.read ? (
                          <span className="block w-2.5 h-2.5 rounded-full bg-[#e35654]" />
                        ) : (
                          <span className="block w-2.5 h-2.5 rounded-full bg-transparent" />
                        )}
                      </div>

                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: pres.bg }}
                      >
                        <Icon className="w-5 h-5" style={{ color: pres.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="text-gray-900 text-sm"
                            style={{ fontWeight: !notif.read ? 700 : 600 }}
                          >
                            {notif.title}
                          </h3>
                          <span className="text-gray-300 text-xs flex-shrink-0 mt-0.5">
                            {formatRelative(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{notif.message}</p>

                        <div className="flex items-center gap-3 mt-3">
                          {!notif.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); void markAsRead(notif.id); }}
                              className="text-xs text-gray-400 hover:text-[#e35654] transition-colors"
                              style={{ fontWeight: 500 }}
                            >
                              تحديد كمقروء
                            </button>
                          )}
                          {notif.actionLabel && notif.actionRoute && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpen(notif); }}
                              className="text-xs text-[#e35654] hover:underline"
                              style={{ fontWeight: 600 }}
                            >
                              {notif.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); void removeNotification(notif.id); }}
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

