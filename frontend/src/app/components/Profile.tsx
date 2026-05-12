import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Shield,
  Camera,
  Edit3,
  Save,
  X,
  Key,
  Award,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPut, ApiError } from '../../lib/api';

interface OrganizerProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  company: string | null;
  position: string | null;
  website: string | null;
  crNumber: string | null;
}

interface OrganizerStats {
  hackathonsTotal: number;
  hackathonsPublished: number;
  hackathonsCompleted: number;
  participantsTotal: number;
  prizesTotal: number;
  successRate: number;
}

interface RecentActivityItem {
  id: number;
  title: string | null;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  createdAt: string;
}

interface ProfileResponse extends OrganizerProfile {
  stats: OrganizerStats;
  recentActivity: RecentActivityItem[];
}

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  position: '',
  company: '',
  location: '',
  website: '',
  bio: '',
  crNumber: '',
};

// Display helpers
const formatNumber = (n: number) => new Intl.NumberFormat('ar-SA').format(n);

const STATUS_LABEL: Record<RecentActivityItem['status'], { label: string; color: string }> = {
  draft: { label: 'تم إنشاء مسودة', color: 'gray' },
  published: { label: 'تم نشر هاكاثون', color: 'green' },
  ongoing: { label: 'هاكاثون قائم', color: 'blue' },
  completed: { label: 'هاكاثون مكتمل', color: 'purple' },
};

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffMs = Date.now() - t;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'منذ يوم';
  if (days < 7) return `منذ ${days} أيام`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'منذ أسبوع';
  if (weeks < 5) return `منذ ${weeks} أسابيع`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'منذ شهر';
  return `منذ ${months} أشهر`;
}

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'security'>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

  // Form mirrors the editable subset of the profile; loaded from API and
  // committed via PUT on save. Keep separate from `profile` so cancel can
  // revert without a refetch.
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<ProfileResponse>('/organizers/me')
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
        setForm({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          position: data.position || '',
          company: data.company || '',
          location: data.location || '',
          website: data.website || '',
          bio: data.bio || '',
          crNumber: data.crNumber || '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          toast.error('هذه الصفحة مخصصة للمنظمين');
        } else {
          toast.error('تعذّر تحميل الملف الشخصي');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await apiPut<OrganizerProfile>('/organizers/me', {
        fullName: form.fullName,
        bio: form.bio,
        phone: form.phone,
        location: form.location,
        company: form.company,
        position: form.position,
        website: form.website,
        crNumber: form.crNumber,
      });
      setProfile(updated);
      setIsEditing(false);
      toast.success('تم حفظ التغييرات');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'تعذّر الحفظ');
      } else {
        toast.error('تعذّر الاتصال بالخادم');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    // Revert form back to last-saved state without a re-fetch.
    setForm({
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      position: profile.position || '',
      company: profile.company || '',
      location: profile.location || '',
      website: profile.website || '',
      bio: profile.bio || '',
      crNumber: profile.crNumber || '',
    });
    setIsEditing(false);
  };

  // Avatar initial — derived from the saved name (not the live form input)
  // so it doesn't flicker as the user types.
  const avatarInitial = (profile?.firstName?.trim()?.[0] || profile?.email?.[0] || '?').toUpperCase();

  // Render-time stats array — built from the API response, falling back to
  // zeros while the request is in flight so the layout doesn't pop.
  const statsCards = [
    { label: 'هاكاثونات منظمة', value: formatNumber(stats?.hackathonsTotal ?? 0), icon: Target, color: 'blue' as const },
    { label: 'إجمالي المشاركين', value: formatNumber(stats?.participantsTotal ?? 0), icon: Users, color: 'green' as const },
    { label: 'معدل النشر', value: `${stats?.successRate ?? 0}%`, icon: TrendingUp, color: 'purple' as const },
    { label: 'إجمالي الجوائز', value: formatNumber(stats?.prizesTotal ?? 0), icon: Award, color: 'orange' as const },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500">
        جاري تحميل الملف الشخصي…
      </div>
    );
  }

  return (
    <>
      {/* Profile Banner */}
      <div className="h-28" style={{ background: "linear-gradient(135deg, #e35654 0%, #cc4a48 100%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 -mt-8 mb-6 shadow-sm">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white -mt-14 flex-shrink-0 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#e35654 0%,#cc4a48 100%)",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                }}
              >
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  avatarInitial
                )}
              </div>
              <button className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-white shadow-lg flex items-center justify-center text-[#e35654] opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3.5 h-3.5" />
              </button>
              <span
                className="absolute bottom-1 left-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: "#10b981" }}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.6rem" }}>
                    {profile?.fullName || '—'}
                  </h1>
                  <p className="text-gray-600 text-sm">{profile?.position || '—'}</p>
                  <p className="text-gray-500 text-sm">{profile?.company || '—'}</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm hover:border-[#e35654] hover:text-[#e35654] hover:bg-[#fef2f2] transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'جاري الحفظ…' : 'حفظ'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      <X className="w-4 h-4" />
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3">
                {statsCards.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                      stat.color === 'blue' ? 'bg-blue-50' :
                      stat.color === 'green' ? 'bg-green-50' :
                      stat.color === 'purple' ? 'bg-purple-50' :
                      'bg-orange-50'
                    }`}>
                      <stat.icon className={`w-4.5 h-4.5 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'green' ? 'text-green-600' :
                        stat.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.3rem" }}>{stat.value}</p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.7rem" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
              activeTab === 'info'
                ? 'border-[#e35654] text-[#e35654]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontWeight: 600 }}
          >
            المعلومات الشخصية
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
              activeTab === 'stats'
                ? 'border-[#e35654] text-[#e35654]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontWeight: 600 }}
          >
            الإحصائيات
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
              activeTab === 'security'
                ? 'border-[#e35654] text-[#e35654]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontWeight: 600 }}
          >
            الأمان والخصوصية
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>
                معلومات الحساب
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.fullName || '—'}</p>
                  )}
                </div>

                {/* Email — read-only (changing email requires re-verification) */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.email || '—'}</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Phone className="w-4 h-4" />
                    رقم الجوال
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.phone || '—'}</p>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Award className="w-4 h-4" />
                    المسمى الوظيفي
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.position || '—'}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Building2 className="w-4 h-4" />
                    اسم الشركة
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.company || '—'}</p>
                  )}
                </div>

                {/* Commercial Register */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Shield className="w-4 h-4" />
                    السجل التجاري
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.crNumber}
                      onChange={(e) => setForm({ ...form, crNumber: e.target.value })}
                      placeholder="10 أرقام"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.crNumber || '—'}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <MapPin className="w-4 h-4" />
                    الموقع
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.location || '—'}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Globe className="w-4 h-4" />
                    الموقع الإلكتروني
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{form.website || '—'}</p>
                  )}
                </div>

                {/* Bio - Full Width */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4" />
                    نبذة تعريفية
                  </label>
                  {isEditing ? (
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl leading-relaxed">{form.bio || '—'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      stat.color === 'blue' ? 'bg-blue-100' :
                      stat.color === 'green' ? 'bg-green-100' :
                      stat.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <stat.icon className={`w-6 h-6 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'green' ? 'text-green-600' :
                        stat.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <p className="text-3xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity — sourced from the organizer's most recent hackathons */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>
                  النشاط الأخير
                </h2>
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm">لا يوجد نشاط حتى الآن.</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((a) => {
                      const meta = STATUS_LABEL[a.status];
                      return (
                        <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all">
                          <div className={`w-2 h-2 rounded-full ${
                            meta.color === 'green' ? 'bg-green-500' :
                            meta.color === 'blue' ? 'bg-blue-500' :
                            meta.color === 'purple' ? 'bg-purple-500' :
                            meta.color === 'gray' ? 'bg-gray-400' :
                            'bg-orange-500'
                          }`} />
                          <p className="flex-1 text-gray-900" style={{ fontWeight: 600 }}>
                            {meta.label}: {a.title || 'بدون عنوان'}
                          </p>
                          <span className="text-sm text-gray-500">{formatRelative(a.createdAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl text-gray-900 mb-6 flex items-center gap-2" style={{ fontWeight: 700 }}>
                  <Key className="w-5 h-5" />
                  تغيير كلمة المرور
                </h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      كلمة المرور الحالية
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button className="px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all" style={{ fontWeight: 600 }}>
                    تحديث كلمة المرور
                  </button>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl text-gray-900 mb-6 flex items-center gap-2" style={{ fontWeight: 700 }}>
                  <Shield className="w-5 h-5" />
                  إعدادات الأمان
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div>
                      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>المصادقة الثنائية</p>
                      <p className="text-sm text-gray-500">حماية إضافية لحسابك</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fce7eb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e35654]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div>
                      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>تنبيهات تسجيل الدخول</p>
                      <p className="text-sm text-gray-500">استلم إشعار عند تسجيل دخول جديد</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fce7eb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e35654]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div>
                      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>إشعارات البريد الإلكتروني</p>
                      <p className="text-sm text-gray-500">استقبال تحديثات عبر البريد</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fce7eb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e35654]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
