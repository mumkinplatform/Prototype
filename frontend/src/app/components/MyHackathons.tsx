import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Calendar, MapPin, ChevronLeft, FileText, ArrowRight, Trash2, AlertTriangle, Pencil, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiDelete, ApiError } from '../../lib/api';
import { SECTION_LABELS, type Section } from '../../lib/permissions';
import { HackathonCover, parseBranding, type BrandingPayload } from './HackathonCover';

type Status = 'draft' | 'published' | 'ongoing' | 'completed';

interface Hackathon {
  id: number;
  title: string;
  slug: string | null;
  description: string;
  status: Status;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  city: string | null;
  myRole: 'owner' | 'co_manager' | 'judge';
  myCoRole?: 'manager' | 'staff' | null;
  mySection?: Section | null;
  branding: BrandingPayload | null;
}

interface ApiHackathon {
  hackathon_ID: number;
  H_title: string | null;
  H_slug: string | null;
  H_description: string | null;
  H_status: Status;
  H_type: string | null;
  H_StartDate: string | null;
  H_EndDate: string | null;
  H_city: string | null;
  H_Branding: string | null;
  my_role: 'owner' | 'co_manager' | 'judge';
  my_co_role: 'manager' | 'staff' | null;
  my_section: Section | null;
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return 'بدون تواريخ';
  const fmt = (d: string | null) => (d ? d.slice(0, 10) : '');
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  return fmt(start) || fmt(end);
}

export default function MyHackathons() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'manager' | 'staff' | 'judge'>('all');
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteCandidate, setDeleteCandidate] = useState<Hackathon | null>(null);
  const [deleting, setDeleting] = useState(false);
  // نخزّن id الهاكاثون اللي اتنسخ رابطه عشان نعرض ✓ مؤقتاً (3 ثوانٍ).
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // ينسخ رابط نشر الهاكاثون (الصفحة العامة) للحافظة. الزر يطلع فقط بعد
  // النشر لأن الـ slug ما يتثبّت إلا بعدها.
  const handleCopyPublicLink = async (h: Hackathon) => {
    if (!h.slug) return;
    const url = `${window.location.origin}/Prototype/hackathon/${h.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(h.id);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopiedId((prev) => (prev === h.id ? null : prev)), 3000);
    } catch {
      toast.error('تعذّر نسخ الرابط');
    }
  };

  const matchesRole = (h: Hackathon, r: typeof filterRole): boolean => {
    if (r === 'all') return true;
    if (r === 'owner') return h.myRole === 'owner';
    if (r === 'manager') return h.myRole === 'co_manager' && h.myCoRole === 'manager';
    if (r === 'staff') return h.myRole === 'co_manager' && h.myCoRole === 'staff';
    if (r === 'judge') return h.myRole === 'judge';
    return true;
  };

  const roleCounts = {
    all: hackathons.length,
    owner: hackathons.filter((h) => h.myRole === 'owner').length,
    manager: hackathons.filter((h) => h.myRole === 'co_manager' && h.myCoRole === 'manager').length,
    staff: hackathons.filter((h) => h.myRole === 'co_manager' && h.myCoRole === 'staff').length,
    judge: hackathons.filter((h) => h.myRole === 'judge').length,
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await apiDelete(`/hackathons/${deleteCandidate.id}`);
      setHackathons((prev) => prev.filter((h) => h.id !== deleteCandidate.id));
      toast.success('تم حذف الهاكاثون');
      setDeleteCandidate(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل الحذف';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    apiGet<{ hackathons: ApiHackathon[] }>('/hackathons')
      .then((data) => {
        setHackathons(
          data.hackathons.map((h) => ({
            id: h.hackathon_ID,
            title: h.H_title ?? '',
            slug: h.H_slug,
            description: h.H_description ?? '',
            status: h.H_status,
            type: h.H_type,
            startDate: h.H_StartDate,
            endDate: h.H_EndDate,
            city: h.H_city,
            myRole: h.my_role,
            myCoRole: h.my_co_role,
            mySection: h.my_section,
            branding: parseBranding(h.H_Branding),
          }))
        );
      })
      .catch(() => toast.error('تعذّر تحميل قائمة الهاكاثونات'))
      .finally(() => setLoading(false));
  }, []);

  const filteredHackathons = hackathons.filter((h) => {
    const statusOk = filterStatus === 'all' || h.status === filterStatus;
    return statusOk && matchesRole(h, filterRole);
  });

  const getStatusBadge = (status: Hackathon['status']) => {
    const statusConfig = {
      draft: { text: 'مسودة', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      published: { text: 'منشور', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      ongoing: { text: 'جاري التنفيذ', color: 'bg-green-100 text-green-700 border-green-200' },
      completed: { text: 'مكتمل', color: 'bg-purple-100 text-purple-700 border-purple-200' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs border ${config.color}`} style={{ fontWeight: 600 }}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                to="/admin" 
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  إدارة الهاكاثونات
                </h1>
                <p className="text-sm text-gray-500">
                  عرض وإدارة جميع الهاكاثونات
                </p>
              </div>
            </div>
            <Link
              to="/admin/create-hackathon"
              className="px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20 transition-all flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" />
              إنشاء هاكاثون جديد
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'all' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            جميع الهاكاثونات ({hackathons.length})
          </button>
          <button 
            onClick={() => setFilterStatus('draft')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'draft' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            المسودات ({hackathons.filter(h => h.status === 'draft').length})
          </button>
          <button 
            onClick={() => setFilterStatus('published')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'published' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            المنشورة ({hackathons.filter(h => h.status === 'published').length})
          </button>
          <button 
            onClick={() => setFilterStatus('ongoing')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'ongoing' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            جاري التنفيذ ({hackathons.filter(h => h.status === 'ongoing').length})
          </button>
          <button 
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'completed' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            المكتملة ({hackathons.filter(h => h.status === 'completed').length})
          </button>
        </div>

        {/* Role Filter — separates owned from co-managed hackathons */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-gray-500 ml-1" style={{ fontWeight: 600 }}>تصفية حسب دوري:</span>
          {([
            { id: 'all', label: 'الكل', count: roleCounts.all },
            { id: 'owner', label: 'منشئ الهاكاثون', count: roleCounts.owner },
            { id: 'manager', label: 'مدير قسم', count: roleCounts.manager },
            { id: 'staff', label: 'موظف', count: roleCounts.staff },
            { id: 'judge', label: 'محكم', count: roleCounts.judge },
          ] as const).map((opt) => {
            const active = filterRole === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFilterRole(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  active
                    ? 'bg-[#e35654] border-[#e35654] text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#e35654] hover:text-[#e35654]'
                }`}
                style={{ fontWeight: 600 }}
              >
                {opt.label} ({opt.count})
              </button>
            );
          })}
        </div>

        {/* Hackathons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => (
            <div key={hackathon.id} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-[#e35654] hover:shadow-lg transition-all flex flex-col">
              {/* Cover — uses organizer's branding (uploaded image, pattern, or gray pattern placeholder) */}
              <div className="relative h-48 overflow-hidden bg-gray-200">
                {(() => {
                  const b = hackathon.branding;
                  const hasUpload = b?.bannerMode === 'upload' && !!b.bannerUploadDataUrl;
                  const hasPattern = b?.bannerMode === 'pattern' && !!b.bannerPattern;
                  if (hasUpload || hasPattern) {
                    return <HackathonCover branding={b} id={hackathon.id} />;
                  }
                  // Draft / not-yet-customized: solid dark gray placeholder.
                  return (
                    <div className="absolute inset-0 bg-gray-600 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-black/30 text-white text-[11px]" style={{ fontWeight: 600 }}>
                        لم يُختر التصميم بعد
                      </span>
                    </div>
                  );
                })()}
                <div className="absolute top-3 right-3 z-10">
                  {getStatusBadge(hackathon.status)}
                </div>
                <div className="absolute top-3 left-3 z-10">
                  {hackathon.myRole === 'owner' ? (
                    <span className="px-3 py-1 rounded-full text-xs bg-[#e35654] text-white shadow-md" style={{ fontWeight: 600 }}>
                      أنت المنظّم
                    </span>
                  ) : hackathon.myRole === 'judge' ? (
                    <span className="px-3 py-1 rounded-full text-xs bg-indigo-600 text-white shadow-md" style={{ fontWeight: 600 }}>
                      محكم
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs bg-blue-600 text-white shadow-md" style={{ fontWeight: 600 }}>
                      {hackathon.myCoRole === 'manager' ? 'مدير قسم' : 'موظف'}
                      {hackathon.mySection ? ` · ${SECTION_LABELS[hackathon.mySection]}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col min-h-[240px]">
                <h3 className="text-lg text-gray-900 mb-2 line-clamp-1" style={{ fontWeight: 700 }}>
                  {hackathon.title || '(بدون عنوان)'}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {hackathon.description || '(بدون وصف)'}
                </p>

                {/* Meta */}
                <div className="flex flex-col gap-2 mb-3 text-xs text-gray-500 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateRange(hackathon.startDate, hackathon.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {/* "عن بعد" للهاكاثون عبر الإنترنت (لا توجد مدينة). غير ذلك
                        نعرض المدينة، أو "بدون موقع" كاحتياط لمسودات لم تكتمل. */}
                    <span className="line-clamp-1">
                      {hackathon.type === 'عبر الإنترنت'
                        ? 'عن بعد'
                        : hackathon.city || 'بدون موقع'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {hackathon.status === 'draft' && hackathon.myRole === 'owner' ? (
                    <>
                      <Link
                        to={`/admin/create-hackathon/${hackathon.id}`}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        <FileText className="w-4 h-4" />
                        <span>تعديل المسودة</span>
                      </Link>
                      <button
                        onClick={() => setDeleteCandidate(hackathon)}
                        className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-all flex items-center justify-center"
                        title="حذف المسودة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={
                          // Judges only have access to the projects/evaluation section,
                          // so we send them straight there instead of the (locked-out)
                          // management hub.
                          hackathon.myRole === 'judge'
                            ? `/admin/hackathon/${hackathon.id}/projects`
                            : `/admin/hackathon/${hackathon.id}`
                        }
                        className="flex-1 px-4 py-2 rounded-lg bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all text-center flex items-center justify-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        <span>{hackathon.myRole === 'judge' ? 'فتح صفحة التحكيم' : 'إدارة الهاكاثون'}</span>
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                      {/* Edit button — owner of a published hackathon can adjust basic info + branding live */}
                      {hackathon.myRole === 'owner' && hackathon.status === 'published' && (
                        <Link
                          to={`/admin/create-hackathon/${hackathon.id}`}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:border-[#e35654] hover:text-[#e35654] transition-all flex items-center justify-center"
                          title="تعديل المعلومات الأساسية والتصميم"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                      )}
                      {/* زر نسخ رابط الصفحة العامة — يظهر بعد النشر (status !== draft
                          و slug موجود). يفيد المنظم إذا ضيّع الرابط بعد النشر. */}
                      {hackathon.slug && hackathon.status !== 'draft' && (
                        <button
                          onClick={() => handleCopyPublicLink(hackathon)}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:border-[#e35654] hover:text-[#e35654] transition-all flex items-center justify-center"
                          title="نسخ رابط الهاكاثون العام للنشر"
                        >
                          {copiedId === hackathon.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Link2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">جاري التحميل...</div>
        )}

        {/* Empty State */}
        {filteredHackathons.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              لا توجد هاكاثونات
            </h3>
            <p className="text-gray-500 mb-6">
              {filterStatus === 'all' 
                ? 'لم تقم بإنشاء أي هاكاثون بعد' 
                : `لا توجد هاكاثونات ${filterStatus === 'draft' ? 'بحالة مسودة' : filterStatus === 'published' ? 'منشورة' : filterStatus === 'ongoing' ? 'جارية' : 'مكتملة'}`}
            </p>
            <Link
              to="/admin/create-hackathon"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" />
              إنشاء هاكاثون جديد
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                حذف الهاكاثون نهائياً؟
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                "<span style={{ fontWeight: 600 }}>{deleteCandidate.title || '(بدون عنوان)'}</span>"
              </p>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                سيتم حذف الهاكاثون وكل بياناته (المسارات، الجوائز، أعضاء التنظيم، الحكام، باقات الرعاية). لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex items-center gap-2 px-6 pb-6">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                style={{ fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}