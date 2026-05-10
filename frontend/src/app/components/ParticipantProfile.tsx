import { useEffect, useRef, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BookOpen,
  Calendar,
  Camera,
  Edit3,
  Save,
  X,
  Key,
  Shield,
  Award,
  Target,
  Code2,
  Plus,
  Trophy,
  FileText,
  Trash2,
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, API_URL, ApiError } from '../../lib/api';
import { getUser } from '../../lib/auth';

interface ParticipantProfileData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string | null;
  phone: string | null;
  city: string | null;
  avatarUrl: string | null;
  university: string | null;
  major: string | null;
  studyYear: string | null;
  skills: string[];
}

interface ParticipantStats {
  hackathonsCount: number;
  submissionsCount: number;
  skillsCount: number;
  prizesCount: number;
}

const emptyEditable = {
  firstName: '',
  lastName: '',
  phone: '',
  city: '',
  university: '',
  major: '',
  studyYear: '',
  bio: '',
};

export function ParticipantProfile() {
  const [activeTab, setActiveTab] = useState<'info' | 'skills' | 'stats' | 'security'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ParticipantProfileData | null>(null);
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [editable, setEditable] = useState(emptyEditable);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Skills
  const [newSkill, setNewSkill] = useState('');
  const [skillError, setSkillError] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!avatarMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarMenuOpen]);

  function resolveAvatarUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return `${API_URL}${url}`;
    return url;
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    setAvatarMenuOpen(false);
    try {
      const result = await apiUpload<{ avatarUrl: string }>('/participants/me/avatar', file);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: result.avatarUrl } : prev));
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : 'فشل رفع الصورة');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handleAvatarDelete() {
    if (!profile?.avatarUrl) return;
    setAvatarMenuOpen(false);
    if (!window.confirm('هل أنت متأكد من حذف الصورة الشخصية؟')) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await apiDelete('/participants/me/avatar');
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : prev));
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : 'فشل حذف الصورة');
    } finally {
      setAvatarUploading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ParticipantProfileData>('/participants/me');
      setProfile(data);
      setEditable({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        phone: data.phone ?? '',
        city: data.city ?? '',
        university: data.university ?? '',
        major: data.major ?? '',
        studyYear: data.studyYear ?? '',
        bio: data.bio ?? '',
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل تحميل البيانات';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await apiGet<ParticipantStats>('/participants/stats');
      setStats(data);
    } catch {
      // stats failure is non-blocking
    }
  }

  function handleEdit() {
    if (!profile) return;
    setEditable({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
      city: profile.city ?? '',
      university: profile.university ?? '',
      major: profile.major ?? '',
      studyYear: profile.studyYear ?? '',
      bio: profile.bio ?? '',
    });
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiPut<ParticipantProfileData>('/participants/me', editable);
      setProfile(updated);
      setIsEditing(false);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل الحفظ';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill() {
    const skill = newSkill.trim();
    if (!skill) return;
    setSkillError(null);
    try {
      await apiPost('/participants/skills', { skill });
      setProfile((p) => (p ? { ...p, skills: [...p.skills, skill] } : p));
      setNewSkill('');
      setStats((s) => (s ? { ...s, skillsCount: s.skillsCount + 1 } : s));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل إضافة المهارة';
      setSkillError(msg);
    }
  }

  async function handleRemoveSkill(skill: string) {
    try {
      await apiDelete(`/participants/skills/${encodeURIComponent(skill)}`);
      setProfile((p) => (p ? { ...p, skills: p.skills.filter((s) => s !== skill) } : p));
      setStats((s) => (s ? { ...s, skillsCount: Math.max(0, s.skillsCount - 1) } : s));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل حذف المهارة';
      setSkillError(msg);
    }
  }

  async function handleChangePassword() {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'err', text: 'يرجى تعبئة كل الحقول' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'err', text: 'كلمتا المرور غير متطابقتين' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'err', text: 'كلمة المرور لازم تكون 8 خانات على الأقل' });
      return;
    }

    setPasswordSaving(true);
    try {
      await apiPut('/participants/me/password', { currentPassword, newPassword });
      setPasswordMessage({ type: 'ok', text: 'تم تحديث كلمة المرور' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل تحديث كلمة المرور';
      setPasswordMessage({ type: 'err', text: msg });
    } finally {
      setPasswordSaving(false);
    }
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';
  const initial = fullName.charAt(0) || getUser()?.fullName?.charAt(0) || 'م';

  const statCards = [
    { label: 'هاكاثونات شاركت فيها', value: String(stats?.hackathonsCount ?? 0), icon: Target, color: 'blue' },
    { label: 'مشاريع مقدّمة', value: String(stats?.submissionsCount ?? 0), icon: FileText, color: 'green' },
    { label: 'مهارات', value: String(stats?.skillsCount ?? 0), icon: Code2, color: 'purple' },
    { label: 'جوائز', value: String(stats?.prizesCount ?? 0), icon: Trophy, color: 'orange' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">جاري تحميل البيانات...</div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">{error}</div>
    );
  }

  if (!profile) return null;

  return (
    <>
      {/* Profile Banner */}
      <div className="h-28" style={{ background: 'linear-gradient(135deg, #e35654 0%, #cc4a48 100%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 -mt-8 mb-6 shadow-sm">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative group">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div
                className="relative w-20 h-20 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white -mt-14 flex-shrink-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg,#e35654 0%,#cc4a48 100%)',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                }}
              >
                {resolveAvatarUrl(profile?.avatarUrl ?? null) ? (
                  <img
                    src={resolveAvatarUrl(profile!.avatarUrl)!}
                    alt={profile?.fullName ?? ''}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
                    جاري الرفع...
                  </div>
                )}
              </div>
              {/* Camera button — opens a dropdown menu */}
              <div
                ref={avatarMenuRef}
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  onClick={() => {
                    if (profile?.avatarUrl) {
                      setAvatarMenuOpen((v) => !v);
                    } else {
                      avatarInputRef.current?.click();
                    }
                  }}
                  disabled={avatarUploading}
                  className="w-6 h-6 rounded-lg bg-white shadow-lg flex items-center justify-center text-[#e35654] disabled:opacity-50 disabled:cursor-wait"
                  title="تعديل الصورة"
                  aria-haspopup="menu"
                  aria-expanded={avatarMenuOpen}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                {avatarMenuOpen && profile?.avatarUrl && (
                  <div
                    role="menu"
                    className="absolute bottom-8 right-0 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                  >
                    <button
                      role="menuitem"
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-right"
                    >
                      <Camera className="w-4 h-4 text-gray-400" />
                      تغيير الصورة
                    </button>
                    <button
                      role="menuitem"
                      onClick={handleAvatarDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 text-right"
                    >
                      <Trash2 className="w-4 h-4" />
                      إزالة الصورة
                    </button>
                  </div>
                )}
              </div>

              <span className="absolute bottom-1 left-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: '#10b981' }} />
              {avatarError && (
                <p className="absolute -bottom-6 left-0 right-0 text-red-500 text-xs whitespace-nowrap">{avatarError}</p>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: '1.6rem' }}>
                    {fullName}
                  </h1>
                  {profile.major && <p className="text-gray-600 text-sm">{profile.major}</p>}
                  {profile.university && <p className="text-gray-500 text-sm">{profile.university}</p>}
                </div>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
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
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all disabled:opacity-50"
                      style={{ fontWeight: 600 }}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button
                      onClick={handleCancel}
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
                {statCards.map((stat, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 hover:shadow-md transition-all">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                        stat.color === 'blue' ? 'bg-blue-50' :
                        stat.color === 'green' ? 'bg-green-50' :
                        stat.color === 'purple' ? 'bg-purple-50' :
                        'bg-orange-50'
                      }`}
                    >
                      <stat.icon
                        className={`w-4.5 h-4.5 ${
                          stat.color === 'blue' ? 'text-blue-600' :
                          stat.color === 'green' ? 'text-green-600' :
                          stat.color === 'purple' ? 'text-purple-600' :
                          'text-orange-600'
                        }`}
                      />
                    </div>
                    <p className="text-gray-900" style={{ fontWeight: 800, fontSize: '1.3rem' }}>
                      {stat.value}
                    </p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: '0.7rem' }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
          {[
            { key: 'info', label: 'المعلومات الشخصية' },
            { key: 'skills', label: 'المهارات' },
            { key: 'stats', label: 'الإحصائيات' },
            { key: 'security', label: 'الأمان والخصوصية' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
                activeTab === t.key
                  ? 'border-[#e35654] text-[#e35654]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={{ fontWeight: 600 }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>
                معلومات الحساب
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4" />
                    الاسم الأول
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editable.firstName}
                      onChange={(e) => setEditable({ ...editable, firstName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.firstName || '—'}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4" />
                    الاسم الأخير
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editable.lastName}
                      onChange={(e) => setEditable({ ...editable, lastName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.lastName || '—'}</p>
                  )}
                </div>

                {/* Email — read only */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.email}</p>
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
                      value={editable.phone}
                      onChange={(e) => setEditable({ ...editable, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.phone || '—'}</p>
                  )}
                </div>

                {/* University */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <GraduationCap className="w-4 h-4" />
                    الجامعة
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editable.university}
                      onChange={(e) => setEditable({ ...editable, university: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.university || '—'}</p>
                  )}
                </div>

                {/* Major */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <BookOpen className="w-4 h-4" />
                    التخصص
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editable.major}
                      onChange={(e) => setEditable({ ...editable, major: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.major || '—'}</p>
                  )}
                </div>

                {/* Study Year */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Calendar className="w-4 h-4" />
                    السنة الدراسية
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editable.studyYear}
                      onChange={(e) => setEditable({ ...editable, studyYear: e.target.value })}
                      placeholder="مثال: السنة الثالثة"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.studyYear || '—'}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <MapPin className="w-4 h-4" />
                    المدينة
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editable.city}
                      onChange={(e) => setEditable({ ...editable, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profile.city || '—'}</p>
                  )}
                </div>

                {/* Bio */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4" />
                    نبذة تعريفية
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editable.bio}
                      onChange={(e) => setEditable({ ...editable, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl leading-relaxed">{profile.bio || '—'}</p>
                  )}
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl text-gray-900 mb-6 flex items-center gap-2" style={{ fontWeight: 700 }}>
                <Code2 className="w-5 h-5" />
                مهاراتي
              </h2>

              <div className="flex gap-2 mb-6 max-w-md">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="أضف مهارة جديدة"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                />
                <button
                  onClick={handleAddSkill}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <Plus className="w-4 h-4" />
                  إضافة
                </button>
              </div>

              {skillError && <p className="mb-4 text-sm text-red-500">{skillError}</p>}

              {profile.skills.length === 0 ? (
                <p className="text-gray-400 text-sm">ما عندك أي مهارات بعد. أضيفي أوّل مهارة من فوق.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 bg-[#fef2f2] text-[#e35654] px-3 py-1.5 rounded-full text-sm"
                      style={{ fontWeight: 600 }}
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-700"
                        aria-label={`حذف ${skill}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-4 gap-6">
              {statCards.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      stat.color === 'blue' ? 'bg-blue-100' :
                      stat.color === 'green' ? 'bg-green-100' :
                      stat.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}
                  >
                    <stat.icon
                      className={`w-6 h-6 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'green' ? 'text-green-600' :
                        stat.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`}
                    />
                  </div>
                  <p className="text-3xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
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
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {passwordMessage && (
                  <p className={`text-sm ${passwordMessage.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordMessage.text}
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  className="px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  {passwordSaving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
