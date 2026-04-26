import { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

interface Notification {
  id: number;
  type: 'success' | 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: any;
  color: string;
  bg: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: 'success',
    title: 'تم قبول مشروع جديد',
    message: 'تم قبول مشروع "تطبيق الذكاء الاصطناعي" في هاكاثون الابتكار',
    time: 'منذ 5 دقائق',
    read: false,
    icon: CheckCircle,
    color: '#10b981',
    bg: '#f0fdf4'
  },
  {
    id: 2,
    type: 'info',
    title: 'تسجيل مشارك جديد',
    message: 'تم تسجيل 15 مشارك جديد في هاكاثون التقنية المالية',
    time: 'منذ 30 دقيقة',
    read: false,
    icon: Users,
    color: '#6366f1',
    bg: '#eef2ff'
  },
  {
    id: 3,
    type: 'warning',
    title: 'موعد قريب',
    message: 'موعد إغلاق التسجيل لهاكاثون الأمن السيبراني بعد يومين',
    time: 'منذ ساعة',
    read: false,
    icon: Calendar,
    color: '#f59e0b',
    bg: '#fffbeb'
  },
  {
    id: 4,
    type: 'alert',
    title: 'طلب رعاية جديد',
    message: 'شركة التقنية المتقدمة تقدمت بطلب رعاية لهاكاثون الابتكار',
    time: 'منذ ساعتين',
    read: true,
    icon: Gift,
    color: '#a41b42',
    bg: '#fef2f2'
  },
  {
    id: 5,
    type: 'success',
    title: 'إكتمال التقييم',
    message: 'تم الانتهاء من تقييم جميع المشاريع في المسار الأول',
    time: 'منذ 3 ساعات',
    read: true,
    icon: Award,
    color: '#10b981',
    bg: '#f0fdf4'
  },
  {
    id: 6,
    type: 'info',
    title: 'تحديث النظام',
    message: 'تم إضافة ميزات جديدة لتحسين تجربة إدارة الهاكاثونات',
    time: 'منذ يوم',
    read: true,
    icon: Info,
    color: '#06b6d4',
    bg: '#ecfeff'
  },
  {
    id: 7,
    type: 'success',
    title: 'نجاح الفعالية',
    message: 'هاكاثون الاستدامة والبيئة اكتمل بنجاح مع 420 مشارك',
    time: 'منذ يومين',
    read: true,
    icon: CheckCircle,
    color: '#10b981',
    bg: '#f0fdf4'
  },
  {
    id: 8,
    type: 'info',
    title: 'رسالة من الدعم',
    message: 'تم الرد على استفسارك حول نظام التقييم الجديد',
    time: 'منذ 3 أيام',
    read: true,
    icon: Info,
    color: '#06b6d4',
    bg: '#ecfeff'
  }
];

const filterTabs = ['الكل', 'غير مقروء', 'نجاح', 'تنبيهات', 'معلومات'];

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState('الكل');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'الكل') return true;
    if (activeFilter === 'غير مقروء') return !n.read;
    if (activeFilter === 'نجاح') return n.type === 'success';
    if (activeFilter === 'تنبيهات') return n.type === 'warning' || n.type === 'alert';
    if (activeFilter === 'معلومات') return n.type === 'info';
    return true;
  });

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/admin')}
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
                    : 'جميع الإشعارات مقروءة'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-[#a41b42] hover:bg-[#fef2f2] transition-colors"
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
                    ? 'bg-[#a41b42] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={{ fontWeight: activeFilter === tab ? 600 : 400 }}
              >
                {tab}
                {tab === 'غير مقروء' && unreadCount > 0 && (
                  <span
                    className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-white"
                    style={{ background: activeFilter === tab ? 'rgba(255,255,255,0.3)' : '#a41b42', fontSize: 10, fontWeight: 700 }}
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
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-sm group ${
                      !notif.read ? 'border-[#a41b42]/20 bg-[#fffbfb]' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 p-4 sm:p-5">
                      {/* Unread dot */}
                      <div className="flex-shrink-0 mt-2">
                        {!notif.read ? (
                          <span className="block w-2.5 h-2.5 rounded-full bg-[#a41b42]" />
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
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-gray-400 hover:text-[#a41b42] transition-colors"
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
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-[#a41b42] hover:bg-[#fef2f4] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1"
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
