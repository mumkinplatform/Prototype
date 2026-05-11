import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, FileDown, Search, RefreshCw, Check, X, Eye, Mail, Filter, TrendingUp, Calendar, Pencil, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPut, ApiError } from '../../lib/api';

interface Registration {
  id: number;
  name: string;
  email: string;
  avatar: string;
  type: 'فردي' | 'فريق (أساس)' | 'فريق (رفيقة)';
  track: string;
  registrationDate: string;
  status: 'قيد الانتظار' | 'تم القبول' | 'تم الرفض';
  skills: string[];
  ideaTitle: string;
  ideaDescription: string;
}

interface ApiRegistration {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  type: 'solo' | 'team';
  ideaTitle: string;
  ideaDescription: string;
  registrationDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedAt: string | null;
  teamId: number | null;
  skills: string[];
  trackName: string | null;
}

const STATUS_TO_AR: Record<ApiRegistration['status'], Registration['status']> = {
  pending: 'قيد الانتظار',
  accepted: 'تم القبول',
  rejected: 'تم الرفض',
};
const STATUS_TO_EN: Record<Registration['status'], ApiRegistration['status']> = {
  'قيد الانتظار': 'pending',
  'تم القبول': 'accepted',
  'تم الرفض': 'rejected',
};
const TYPE_TO_AR: Record<ApiRegistration['type'], Registration['type']> = {
  solo: 'فردي',
  team: 'فريق (أساس)',
};

function formatDateAr(iso: string | null): string {
  if (!iso) return '—';
  // Handles "YYYY-MM-DD HH:MM:SS" (mysql2 dateStrings) and ISO timestamps.
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-SA', { day: '2-digit', month: 'long', year: 'numeric' });
}

function toUiRegistration(r: ApiRegistration): Registration {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    avatar: r.avatarUrl ?? '',
    type: TYPE_TO_AR[r.type] ?? 'فردي',
    // Hackathon currently has a single track at most — every applicant maps to it.
    track: r.trackName ?? '—',
    registrationDate: formatDateAr(r.registrationDate),
    status: STATUS_TO_AR[r.status],
    skills: r.skills,
    ideaTitle: r.ideaTitle,
    ideaDescription: r.ideaDescription,
  };
}

// Initials fallback shown in a circle when the participant didn't upload an avatar.
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

// Mock data retained only for reference — replaced by real API.
const _UNUSED_MOCK: Registration[] = [
  {
    id: 1,
    name: 'سارة المنصور',
    email: 'sara.m@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'تطوير الويب',
    registrationDate: '12 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['React', 'Python', 'Machine Learning']
  },
  {
    id: 2,
    name: 'محمد الحربي',
    email: 'm.harbi@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    type: 'فريق (أساس)',
    track: 'الذكاء الاصطناعي',
    registrationDate: '11 أكتوبر 2023',
    status: 'تم القبول',
    skills: ['Python', 'TensorFlow', 'UI/UX Design']
  },
  {
    id: 3,
    name: 'عبدالله فهد',
    email: 'a.fahad@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'الأمن السيبراني',
    registrationDate: '10 أكتوبر 2023',
    status: 'تم الرفض',
    skills: ['Cybersecurity', 'Network Security', 'Ethical Hacking']
  },
  {
    id: 4,
    name: 'ريم الشريف',
    email: 'reem.s@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'فريق (رفيقة)',
    track: 'تطوير الويب',
    registrationDate: '10 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Frontend', 'React', 'Vue']
  },
  {
    id: 5,
    name: 'خالد العتيبي',
    email: 'khaled.o@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'الذكاء الاصطناعي',
    registrationDate: '09 أكتوبر 2023',
    status: 'تم القبول',
    skills: ['Python', 'Machine Learning', 'Deep Learning']
  },
  {
    id: 6,
    name: 'نورة القحطاني',
    email: 'norah.q@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    type: 'فريق (أساس)',
    track: 'تطوير الويب',
    registrationDate: '09 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['UI/UX Design', 'Figma', 'Frontend']
  },
  {
    id: 7,
    name: 'أحمد السعيد',
    email: 'ahmed.s@example.com',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'الأمن السيبراني',
    registrationDate: '08 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Cybersecurity', 'Penetration Testing']
  },
  {
    id: 8,
    name: 'هند المطيري',
    email: 'hind.m@example.com',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    type: 'فريق (رفيقة)',
    track: 'الذكاء الاصطناعي',
    registrationDate: '08 أكتوبر 2023',
    status: 'تم القبول',
    skills: ['Python', 'Machine Learning', 'Data Science']
  },
  {
    id: 9,
    name: 'فيصل الدوسري',
    email: 'faisal.d@example.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'تطوير الويب',
    registrationDate: '07 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Frontend', 'React', 'TypeScript']
  },
  {
    id: 10,
    name: 'مريم الشهري',
    email: 'maryam.sh@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    type: 'فريق (أساس)',
    track: 'الذكاء الاصطناعي',
    registrationDate: '07 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Python', 'Machine Learning', 'UI/UX Design']
  }
];

export function HackathonRegistrations() {
  const { id } = useParams();
  // Suppress "declared but never read" for the mock array kept for documentation.
  void _UNUSED_MOCK;
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real registrations from the API.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet<{ items: ApiRegistration[] }>(`/hackathons/${id}/registrations`)
      .then((data) => setRegistrations(data.items.map(toUiRegistration)))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) {
          toast.error('ليس لديك صلاحية مراجعة تسجيلات هذا الهاكاثون');
        } else {
          toast.error(e instanceof ApiError ? e.message : 'فشل تحميل التسجيلات');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Registration window — visible to the organizer at the top of this page so they can
  // see at-a-glance when participants can register, and edit it inline.
  // Bounds are constrained by the hackathon's overall startDate/endDate.
  const [regWindow, setRegWindow] = useState<{
    registrationStart: string | null;
    registrationEnd: string | null;
    hackathonStart: string | null;
    hackathonEnd: string | null;
  }>({ registrationStart: null, registrationEnd: null, hackathonStart: null, hackathonEnd: null });
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [editRegStart, setEditRegStart] = useState('');
  const [editRegEnd, setEditRegEnd] = useState('');
  const [savingDates, setSavingDates] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet<{ hackathon: Record<string, string | null | undefined> }>(`/hackathons/${id}`)
      .then((data) => {
        const h = data.hackathon ?? {};
        setRegWindow({
          registrationStart: (h.H_Registration_StartDate as string) ?? null,
          registrationEnd: (h.H_Registration_EndDate as string) ?? null,
          hackathonStart: (h.H_StartDate as string) ?? null,
          hackathonEnd: (h.H_EndDate as string) ?? null,
        });
      })
      .catch(() => {/* silent — banner just shows '—' */});
  }, [id]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterTrack, setFilterTrack] = useState('الكل');
  const [filterType, setFilterType] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState<'all' | 'قيد الانتظار' | 'تم القبول' | 'تم الرفض'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailType, setEmailType] = useState<'accept' | 'reject' | 'custom'>('custom');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const itemsPerPage = 5;

  // Calculate stats
  const totalRegistrations = registrations.length;
  const pendingCount = registrations.filter(r => r.status === 'قيد الانتظار').length;
  const acceptedCount = registrations.filter(r => r.status === 'تم القبول').length;
  const rejectedCount = registrations.filter(r => r.status === 'تم الرفض').length;
  const acceptanceRate = totalRegistrations > 0 ? Math.round((acceptedCount / totalRegistrations) * 100) : 0;
  // pendingCount drives the badge on the total card — it's the "remaining to review" hint.

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchSearch = reg.name.includes(searchQuery) || reg.email.includes(searchQuery);
    const matchTrack = filterTrack === 'الكل' || reg.track === filterTrack;
    const matchType = filterType === 'الكل' || reg.type === filterType;
    const matchStatus = filterStatus === 'all' || reg.status === filterStatus;
    return matchSearch && matchTrack && matchType && matchStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  // Calculate skill stats
  const skillStats: { [key: string]: number } = {};
  registrations.forEach(reg => {
    reg.skills.forEach(skill => {
      if (skill.toLowerCase().includes('python') || skill.toLowerCase().includes('machine learning')) {
        skillStats['Python / Machine Learning'] = (skillStats['Python / Machine Learning'] || 0) + 1;
      } else if (skill.toLowerCase().includes('ui') || skill.toLowerCase().includes('ux') || skill.toLowerCase().includes('design')) {
        skillStats['UI/UX Design'] = (skillStats['UI/UX Design'] || 0) + 1;
      } else if (skill.toLowerCase().includes('frontend') || skill.toLowerCase().includes('react') || skill.toLowerCase().includes('vue')) {
        skillStats['Frontend (React/Vue)'] = (skillStats['Frontend (React/Vue)'] || 0) + 1;
      }
    });
  });

  const topSkills = Object.entries(skillStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill, count]) => ({
      skill,
      percentage: Math.round((count / totalRegistrations) * 100)
    }));

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentRegistrations.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  // Persist status to the backend then mirror in local state. Note that on a 'pending'
  // hackathon the participant wouldn't normally land in workspace — status flips that.
  const setStatus = async (regId: number, newStatus: Registration['status']): Promise<boolean> => {
    if (!id) return false;
    try {
      await apiPut(`/hackathons/${id}/registrations/${regId}/status`, {
        status: STATUS_TO_EN[newStatus],
      });
      setRegistrations((prev) => prev.map((reg) => (reg.id === regId ? { ...reg, status: newStatus } : reg)));
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل تحديث الحالة';
      toast.error(msg);
      return false;
    }
  };

  const handleAccept = async (regId: number) => {
    const ok = await setStatus(regId, 'تم القبول');
    if (ok) {
      toast.success('تم قبول الطلب', {
        description: `تم قبول ${registrations.find((r) => r.id === regId)?.name}`,
        duration: 3000,
      });
    }
  };

  const handleReject = async (regId: number) => {
    const ok = await setStatus(regId, 'تم الرفض');
    if (ok) {
      toast.error('تم رفض الطلب', {
        description: `تم رفض طلب ${registrations.find((r) => r.id === regId)?.name}`,
        duration: 3000,
      });
    }
  };

  const handleAcceptSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('لم يتم التحديد', {
        description: 'الرجاء تحديد طلب واحد على الأقل',
        duration: 3000,
      });
      return;
    }
    // Persist all selected in parallel; tolerate partial failures.
    await Promise.all(selectedIds.map((rid) => setStatus(rid, 'تم القبول')));
    
    // Open email modal for acceptance
    setEmailType('accept');
    setEmailSubject('تهانينا! تم قبولك في الهاكاثون');
    setEmailMessage(`عزيزي/عزيزتي [الاسم],

نحن سعداء بإبلاغك بأنه تم قبول طلبك للمشاركة في الهاكاثون.

نتطلع لرؤيتك قريباً!

مع أطيب التحيات،
فريق مُمكّن`);
    setShowEmailModal(true);
  };

  const handleRejectSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('لم يتم التحديد', {
        description: 'الرجاء تحديد طلب واحد على الأقل',
        duration: 3000,
      });
      return;
    }
    await Promise.all(selectedIds.map((rid) => setStatus(rid, 'تم الرفض')));
    
    // Open email modal for rejection
    setEmailType('reject');
    setEmailSubject('بخصوص طلبك للمشاركة في الهاكاثون');
    setEmailMessage(`عزيزي/عزيزتي [الاسم],

نشكرك على اهتمامك بالمشاركة في الهاكاثون.

للأسف، لم نتمكن من قبول طلبك في هذه المرة، ولكن نشجعك على التقديم في الفرص القادمة.

مع أطيب التحيات،
فريق مُمكّن`);
    setShowEmailModal(true);
  };

  const handleSendCustomEmail = () => {
    if (selectedIds.length === 0) {
      toast.error('لم يتم التحديد', {
        description: 'الرجاء تحديد طلب واحد على الأقل',
        duration: 3000,
      });
      return;
    }

    setEmailType('custom');
    setEmailSubject('');
    setEmailMessage('');
    setShowEmailModal(true);
  };

  const handleResetFilters = () => {
    setFilterTrack('الكل');
    setFilterType('الكل');
    setFilterStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
    toast.success('تم إعادة تعيين الفلاتر', {
      duration: 2000,
    });
  };

  const handleExportCSV = () => {
    toast.success('جاري التصدير...', {
      description: 'سيتم تحميل الملف قريباً',
      duration: 3000,
    });
  };

  const handleSendEmails = () => {
    setShowEmailModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmSendEmails = () => {
    const selectedRegs = registrations.filter(r => selectedIds.includes(r.id));
    
    toast.success('تم إرسال الرسائل بنجاح', {
      description: `تم إرسال ${selectedIds.length} رسالة بريد إلكتروني`,
      duration: 4000,
    });

    setShowConfirmModal(false);
    setSelectedIds([]);
    setEmailSubject('');
    setEmailMessage('');
  };

  const getStatusBadge = (status: Registration['status']) => {
    const config = {
      'قيد الانتظار': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'تم القبول': 'bg-green-100 text-green-700 border-green-200',
      'تم الرفض': 'bg-[#fce7eb] text-[#a93b39] border-[#fad1d8]'
    };
    return config[status];
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to={`/admin/hackathon/${id}`}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  إدارة التسجيلات والطلبات
                </h1>
                <p className="text-sm text-gray-500">
                  مراجعة وتصفية وتحليل طلبات الانضمام للهاكاثون الحالي.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
              style={{ fontWeight: 600 }}
            >
              <FileDown className="w-4 h-4" />
              تصدير البيانات (CSV)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Registration Window — visible at a glance + inline edit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-[#fce7eb] flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-[#e35654]" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-gray-500 mb-1">نافذة التسجيل</p>
            <div className="flex items-center gap-2 flex-wrap text-sm text-gray-900" style={{ fontWeight: 600 }}>
              <span>{formatDateAr(regWindow.registrationStart)}</span>
              <span className="text-gray-400">→</span>
              <span>{formatDateAr(regWindow.registrationEnd)}</span>
            </div>
          </div>
          <button
            onClick={() => {
              const toLocal = (v: string | null) => (v ? v.replace(' ', 'T').slice(0, 16) : '');
              setEditRegStart(toLocal(regWindow.registrationStart));
              setEditRegEnd(toLocal(regWindow.registrationEnd));
              setShowDatesModal(true);
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:border-[#e35654] hover:text-[#e35654] transition-all flex items-center gap-2"
            style={{ fontWeight: 600 }}
          >
            <Pencil className="w-4 h-4" />
            تعديل التواريخ
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'all' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'all' ? 'bg-blue-600' : 'bg-blue-50'
              }`}>
                <svg className={`w-6 h-6 ${filterStatus === 'all' ? 'text-white' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {pendingCount > 0 && (
                <span className="text-xs text-yellow-700 px-2 py-1 rounded-full bg-yellow-50" style={{ fontWeight: 600 }}>
                  {pendingCount} للمراجعة
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">إجمالي الطلبات</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{totalRegistrations.toLocaleString('ar-SA')}</p>
          </button>

          <button
            onClick={() => setFilterStatus('قيد الانتظار')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'قيد الانتظار' ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'قيد الانتظار' ? 'bg-yellow-600' : 'bg-yellow-50'
              }`}>
                <svg className={`w-6 h-6 ${filterStatus === 'قيد الانتظار' ? 'text-white' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-orange-600 px-2 py-1 rounded-full bg-orange-50" style={{ fontWeight: 600 }}>نشط</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">قيد الانتظار</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{pendingCount}</p>
          </button>

          <button
            onClick={() => setFilterStatus('تم القبول')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'تم القبول' ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'تم القبول' ? 'bg-green-600' : 'bg-green-50'
              }`}>
                <Check className={`w-6 h-6 ${filterStatus === 'تم القبول' ? 'text-white' : 'text-green-600'}`} />
              </div>
              <span className="text-xs text-green-600" style={{ fontWeight: 600 }}>{acceptanceRate}%</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">تم القبول</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{acceptedCount}</p>
          </button>

          <button
            onClick={() => setFilterStatus('تم الرفض')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'تم الرفض' ? 'border-[#e35654] shadow-lg shadow-red-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'تم الرفض' ? 'bg-[#cc4a48]' : 'bg-[#fef2f4]'
              }`}>
                <X className={`w-6 h-6 ${filterStatus === 'تم الرفض' ? 'text-white' : 'text-[#cc4a48]'}`} />
              </div>
              <span className="text-xs text-[#cc4a48]" style={{ fontWeight: 600 }}>
                {totalRegistrations > 0 ? Math.round((rejectedCount / totalRegistrations) * 100) : 0}%
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">تم الرفض</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{rejectedCount}</p>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500"
                style={{ fontWeight: 600 }}
              >
                <option value="الكل">المسار التقني: الكل</option>
                <option value="تطوير الويب">تطوير الويب</option>
                <option value="الذكاء الاصطناعي">الذكاء الاصطناعي</option>
                <option value="الأمن السيبراني">الأمن السيبراني</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500"
                style={{ fontWeight: 600 }}
              >
                <option value="الكل">النوع: الكل</option>
                <option value="فردي">فردي</option>
                <option value="فريق (أساس)">فريق (أساس)</option>
                <option value="فريق (رفيقة)">فريق (رفيقة)</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-all"
              style={{ fontWeight: 600 }}
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تعيين الفلاتر
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`ابحث ${filteredRegistrations.length} من أصل ${totalRegistrations} طلب...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-4 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedIds.length === currentRegistrations.length && currentRegistrations.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700" style={{ fontWeight: 600 }}>تحديد الكل</span>
            </label>

            <button
              onClick={handleAcceptSelected}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-all"
              style={{ fontWeight: 600 }}
            >
              <Check className="w-4 h-4" />
              قبول المحدد
            </button>

            <button
              onClick={handleRejectSelected}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#cc4a48] text-white text-sm hover:bg-[#a93b39] transition-all"
              style={{ fontWeight: 600 }}
            >
              <X className="w-4 h-4" />
              رفض المحدد
            </button>

            <button
              onClick={handleSendCustomEmail}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
              style={{ fontWeight: 600 }}
            >
              <Mail className="w-4 h-4" />
              مراسلة
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>#</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>المشاركين</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>النوع</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>المسار</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>تاريخ التسجيل</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الحالة</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentRegistrations.map((reg) => (
                <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(reg.id)}
                      onChange={(e) => handleSelectOne(reg.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {reg.avatar ? (
                        <img
                          src={reg.avatar}
                          alt={reg.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center text-xs" style={{ fontWeight: 700 }}>
                          {getInitials(reg.name)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{reg.name}</p>
                        <p className="text-xs text-gray-500">{reg.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{reg.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{reg.track}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{reg.registrationDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusBadge(reg.status)}`} style={{ fontWeight: 600 }}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {reg.status === 'قيد الانتظار' && (
                        <>
                          <button
                            onClick={() => handleReject(reg.id)}
                            className="w-8 h-8 rounded-lg bg-gray-50 text-[#cc4a48] flex items-center justify-center hover:bg-[#fef2f4] transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAccept(reg.id)}
                            className="w-8 h-8 rounded-lg bg-gray-50 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedRegistration(reg)}
                        className="w-8 h-8 rounded-lg bg-gray-50 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد نتائج</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-gray-500">
              عرض صفحة {currentPage} من {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ fontWeight: 600 }}
              >
                السابق
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ fontWeight: 600 }}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Skills Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
              نظرة سريعة على المهارات
            </h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          <div className="space-y-4">
            {topSkills.map((skill, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{skill.skill}</span>
                  <span className="text-sm text-gray-500" style={{ fontWeight: 600 }}>{skill.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-purple-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${skill.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                إرسال رسالة بريد إلكتروني
              </h2>
              <p className="text-sm text-gray-500">
                سيتم إرسال هذه الرسالة إلى {selectedIds.length} مشارك
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  عنوان الرسالة
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="أدخل عنوان الرسالة"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  محتوى الرسالة
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="اكتب محتوى الرسالة هنا... (سيتم استبدال [الاسم] باسم كل مشارك)"
                  rows={8}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-900 mb-2" style={{ fontWeight: 600 }}>
                  💡 نصيحة: استخدم [الاسم] في المحتوى ليتم استبداله بالاسم الفعلي لكل مستلم
                </p>
                <p className="text-xs text-blue-700">
                  المستلمين ({selectedIds.length}): {registrations.filter(r => selectedIds.includes(r.id)).map(r => r.name).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSendEmails}
                disabled={!emailSubject || !emailMessage}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                style={{ fontWeight: 600 }}
              >
                إرسال الرسائل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Send Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                تأكيد إرسال الرسائل
              </h2>
              <p className="text-sm text-gray-500">
                هل أنت متأكد من إرسال {selectedIds.length} رسالة بريد إلكتروني؟
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                العنوان: {emailSubject}
              </p>
              <p className="text-xs text-gray-500">
                سيتم إرسال الرسالة إلى: {registrations.filter(r => selectedIds.includes(r.id)).map(r => r.email).join(', ')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmSendEmails}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-all"
                style={{ fontWeight: 600 }}
              >
                تأكيد الإرسال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Details Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRegistration(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              {selectedRegistration.avatar ? (
                <img
                  src={selectedRegistration.avatar}
                  alt={selectedRegistration.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center text-lg" style={{ fontWeight: 700 }}>
                  {getInitials(selectedRegistration.name)}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  {selectedRegistration.name}
                </h2>
                <p className="text-sm text-gray-500">{selectedRegistration.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusBadge(selectedRegistration.status)}`} style={{ fontWeight: 600 }}>
                {selectedRegistration.status}
              </span>
            </div>

            {/* Idea details — the title + description the participant entered when registering */}
            {(selectedRegistration.ideaTitle || selectedRegistration.ideaDescription) && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100">
                <p className="text-xs text-gray-500 mb-2">الفكرة المقترحة</p>
                {selectedRegistration.ideaTitle && (
                  <p className="text-base text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    {selectedRegistration.ideaTitle}
                  </p>
                )}
                {selectedRegistration.ideaDescription && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedRegistration.ideaDescription}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">النوع</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedRegistration.type}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">المسار</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedRegistration.track}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 col-span-2">
                <p className="text-xs text-gray-500 mb-1">تاريخ التسجيل</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedRegistration.registrationDate}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>المهارات</p>
              <div className="flex flex-wrap gap-2">
                {selectedRegistration.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs" style={{ fontWeight: 600 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {selectedRegistration.status === 'قيد الانتظار' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleReject(selectedRegistration.id);
                    setSelectedRegistration(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#fad1d8] text-[#a93b39] text-sm hover:bg-[#fef2f4] transition-all"
                  style={{ fontWeight: 600 }}
                >
                  رفض الطلب
                </button>
                <button
                  onClick={() => {
                    handleAccept(selectedRegistration.id);
                    setSelectedRegistration(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  قبول الطلب
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Dates Edit Modal */}
      {showDatesModal && (() => {
        // Validation against the hackathon window — the organizer set the outer dates
        // at creation time; registration must fit inside them and be self-consistent.
        const toMs = (v: string) => (v ? new Date(v).getTime() : NaN);
        const hStartMs = regWindow.hackathonStart ? new Date(regWindow.hackathonStart.replace(' ', 'T')).getTime() : null;
        const hEndMs = regWindow.hackathonEnd ? new Date(regWindow.hackathonEnd.replace(' ', 'T')).getTime() : null;
        const startMs = toMs(editRegStart);
        const endMs = toMs(editRegEnd);
        const errors: string[] = [];
        if (!editRegStart) errors.push('تاريخ فتح التسجيل مطلوب');
        if (!editRegEnd) errors.push('تاريخ إغلاق التسجيل مطلوب');
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
          errors.push('تاريخ إغلاق التسجيل يجب أن يكون بعد تاريخ الفتح');
        }
        if (hStartMs != null && Number.isFinite(startMs) && startMs < hStartMs) {
          errors.push('تاريخ فتح التسجيل يجب أن يكون داخل فترة الهاكاثون (بعد تاريخ بدئه)');
        }
        if (hEndMs != null && Number.isFinite(endMs) && endMs > hEndMs) {
          errors.push('تاريخ إغلاق التسجيل يجب أن يكون داخل فترة الهاكاثون (قبل تاريخ انتهائه)');
        }
        const canSave = errors.length === 0 && !savingDates;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تعديل نافذة التسجيل</h3>
                <button onClick={() => setShowDatesModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  لازم تكون التواريخ ضمن فترة الهاكاثون
                  ({formatDateAr(regWindow.hackathonStart)} → {formatDateAr(regWindow.hackathonEnd)}).
                </p>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>فتح التسجيل</label>
                  <input
                    type="datetime-local"
                    value={editRegStart}
                    onChange={(e) => setEditRegStart(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>إغلاق التسجيل</label>
                  <input
                    type="datetime-local"
                    value={editRegEnd}
                    onChange={(e) => setEditRegEnd(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:bg-white"
                  />
                </div>
                {errors.length > 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 space-y-1">
                    {errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-6 pb-6">
                <button
                  onClick={() => setShowDatesModal(false)}
                  disabled={savingDates}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    if (!canSave || !id) return;
                    setSavingDates(true);
                    try {
                      await apiPut(`/hackathons/${id}`, {
                        registrationStart: editRegStart,
                        registrationEnd: editRegEnd,
                      });
                      setRegWindow((prev) => ({
                        ...prev,
                        registrationStart: editRegStart.replace('T', ' ') + ':00',
                        registrationEnd: editRegEnd.replace('T', ' ') + ':00',
                      }));
                      toast.success('تم تحديث تواريخ التسجيل');
                      setShowDatesModal(false);
                    } catch (e) {
                      const msg = e instanceof ApiError ? e.message : 'تعذّر الحفظ';
                      toast.error(msg);
                    } finally {
                      setSavingDates(false);
                    }
                  }}
                  disabled={!canSave}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontWeight: 600 }}
                >
                  {savingDates ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
