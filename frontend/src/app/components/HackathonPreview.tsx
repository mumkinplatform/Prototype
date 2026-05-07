import { useEffect, useState } from 'react';
import { X, Users, Building2, Layout, Calendar, Trophy, Clock, MapPin, Eye, CheckCircle2, Handshake, Star, MessageCircle, FileText, BarChart3, Settings, Globe, ArrowRight, Target, Flag } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { BannerPattern } from './BannerPatterns';
import { LogoPattern } from './LogoPatterns';
import { apiGet, ApiError } from '../../lib/api';

type ViewMode = 'participant' | 'sponsor' | 'workspace';

interface SponsorshipPackage {
  id: string;
  name: string;
  type: string;
  value?: string;
  description: string;
  benefits: string[];
}

interface TimelineMilestone {
  date: string;
  label: string;
  done: boolean;
}

interface HackathonData {
  title: string;
  org: string;
  description: string;
  date: string;
  deadline: string;
  location: string;
  category: string;
  type: string;
  prize: string;
  duration: string;
  participants: number;
  teams: number;
  views: number;
  tags: string[];
  timeline: TimelineMilestone[];
  sponsorshipPackages: SponsorshipPackage[];
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// Accepts both "YYYY-MM-DD HH:MM:SS" (mysql2 dateStrings) and ISO formats; treats as local.
function parseLocal(v: string): Date | null {
  const d = new Date(v.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDateShort(v: string | null | undefined): string {
  if (!v) return '';
  const d = parseLocal(v);
  if (!d) return '';
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
}

function fmtDateFull(v: string | null | undefined): string {
  if (!v) return '';
  const d = parseLocal(v);
  if (!d) return '';
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function calcDurationHours(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '';
  const a = parseLocal(start)?.getTime();
  const b = parseLocal(end)?.getTime();
  if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b) || b <= a) return '';
  const hours = Math.round((b - a) / (1000 * 60 * 60));
  if (hours < 48) return `${hours} ساعة`;
  const days = Math.round(hours / 24);
  return `${days} يوم`;
}

const EMPTY_DATA: HackathonData = {
  title: '',
  org: '',
  description: '',
  date: '',
  deadline: '',
  location: '',
  category: '',
  type: '',
  prize: '',
  duration: '',
  participants: 0,
  teams: 0,
  views: 0,
  tags: [],
  timeline: [],
  sponsorshipPackages: [],
};

export default function HackathonPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('participant');
  const [loading, setLoading] = useState(true);
  const [hackathonData, setHackathonData] = useState<HackathonData>(EMPTY_DATA);
  const [selectedColorPalette, setSelectedColorPalette] = useState<string>('red');
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);
  const [logoUploadDataUrl, setLogoUploadDataUrl] = useState<string | null>(null);
  const [bannerUploadDataUrl, setBannerUploadDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    apiGet<{
      hackathon: Record<string, unknown>;
      tracks: { HT_ID: number; HT_Name: string }[];
      sponsorPackages: {
        SP_ID: number;
        SP_Name: string;
        SP_Type: string;
        SP_Description: string | null;
        SP_Price: string | null;
        SP_Benefits: unknown;
      }[];
      prizes: { HP_ID: number; HP_Amount: string | null }[];
    }>(`/hackathons/${id}`)
      .then((data) => {
        const h = data.hackathon as Record<string, string | number | null | undefined>;

        // Parse branding JSON
        let branding: Record<string, unknown> = {};
        try {
          const raw = h.H_Branding;
          branding =
            typeof raw === 'string' && raw.trim() !== ''
              ? JSON.parse(raw)
              : raw && typeof raw === 'object'
                ? (raw as Record<string, unknown>)
                : {};
        } catch {
          branding = {};
        }
        setSelectedColorPalette((branding.colorPalette as string) || 'red');
        setSelectedLogo(
          branding.logoMode === 'pattern' ? ((branding.logoPattern as string) || null) : null
        );
        setSelectedBanner(
          branding.bannerMode === 'pattern' ? ((branding.bannerPattern as string) || null) : null
        );
        setLogoUploadDataUrl(
          branding.logoMode === 'upload' ? ((branding.logoUploadDataUrl as string) || null) : null
        );
        setBannerUploadDataUrl(
          branding.bannerMode === 'upload' ? ((branding.bannerUploadDataUrl as string) || null) : null
        );

        // Build timeline from fixed milestones
        const timeline: TimelineMilestone[] = [];
        if (h.H_Registration_StartDate) timeline.push({ date: fmtDateShort(h.H_Registration_StartDate as string), label: 'فتح التسجيل', done: false });
        if (h.H_Registration_EndDate) timeline.push({ date: fmtDateShort(h.H_Registration_EndDate as string), label: 'إغلاق التسجيل', done: false });
        if (h.H_Announcement_Date) timeline.push({ date: fmtDateShort(h.H_Announcement_Date as string), label: 'إعلان المقبولين', done: false });
        if (h.H_Hackathon_StartDate) timeline.push({ date: fmtDateShort(h.H_Hackathon_StartDate as string), label: 'بدء الهاكاثون', done: false });
        if (h.H_Winners_Date) timeline.push({ date: fmtDateShort(h.H_Winners_Date as string), label: 'إعلان الفائزين', done: false });

        // Sum prizes for headline value
        const prizeAmounts = data.prizes
          .map((p) => Number(String(p.HP_Amount || '').replace(/[^\d.]/g, '')))
          .filter((n) => Number.isFinite(n) && n > 0);
        const totalPrize = prizeAmounts.reduce((a, b) => a + b, 0);

        const sponsorshipPackages: SponsorshipPackage[] = data.sponsorPackages.map((s) => {
          let benefits: string[] = [];
          try {
            const raw = s.SP_Benefits;
            const parsed =
              typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
            if (Array.isArray(parsed)) benefits = parsed.filter((x): x is string => typeof x === 'string');
          } catch {
            benefits = [];
          }
          return {
            id: String(s.SP_ID),
            name: s.SP_Name,
            type: s.SP_Type,
            value: s.SP_Price ? `${s.SP_Price} ر.س` : undefined,
            description: s.SP_Description ?? '',
            benefits,
          };
        });

        const isOnline = h.H_type === 'عبر الإنترنت';

        setHackathonData({
          title: (h.H_title as string) ?? 'بدون عنوان',
          org: (h.H_public_name as string) ?? '',
          description: (h.H_description as string) ?? '',
          date: fmtDateFull(h.H_StartDate as string),
          deadline: fmtDateFull(h.H_Registration_EndDate as string),
          location: isOnline ? 'عبر الإنترنت' : ((h.H_city as string) ?? ''),
          category: data.tracks[0]?.HT_Name ?? '',
          type: (h.H_type as string) ?? '',
          prize: totalPrize > 0 ? `${totalPrize.toLocaleString('en-US')} ريال` : '—',
          duration: calcDurationHours(h.H_StartDate as string, h.H_EndDate as string) || '—',
          participants: 0,
          teams: 0,
          views: 0,
          tags: data.tracks.map((t) => t.HT_Name).slice(0, 5),
          timeline,
          sponsorshipPackages,
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          toast.error('المسوّدة غير موجودة');
          navigate('/admin/my-hackathons');
        } else if (err instanceof ApiError && err.status === 403) {
          toast.error('ليس لديك صلاحية لهذه المسوّدة');
          navigate('/admin/my-hackathons');
        } else {
          toast.error('تعذّر تحميل المعاينة');
        }
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <p className="text-gray-500">جاري تحميل المعاينة...</p>
      </div>
    );
  }

  // Unified renderers — use uploaded image if available, otherwise the selected pattern,
  // otherwise a soft fallback. Used across participant / sponsor / workspace views.
  const renderLogo = (className = '') => {
    if (logoUploadDataUrl) {
      return <img src={logoUploadDataUrl} alt="logo" className={`object-contain ${className}`} />;
    }
    if (selectedLogo) {
      return <LogoPattern pattern={selectedLogo} colorPalette={selectedColorPalette} />;
    }
    return <div className={`bg-gray-100 ${className}`} />;
  };

  const renderBanner = (className = 'absolute inset-0') => {
    if (bannerUploadDataUrl) {
      return (
        <div className={className}>
          <img
            src={bannerUploadDataUrl}
            alt="banner"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    if (selectedBanner) {
      return (
        <div className={className}>
          <BannerPattern pattern={selectedBanner} colorPalette={selectedColorPalette} />
        </div>
      );
    }
    return (
      <div
        className={`${className} bg-gradient-to-br from-purple-800 via-indigo-700 to-blue-600`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                معاينة الهاكاثون
              </h1>
              <p className="text-sm text-gray-500">
                هذه معاينة للهاكاثون - لم يتم نشره بعد
              </p>
            </div>
            <Link
              to={id ? `/admin/create-hackathon/${id}` : '/admin/create-hackathon'}
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              إغلاق المعاينة
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - View Modes */}
          <div className="col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-24">
              <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>
                اختر المنظور
              </h3>
              <div className="space-y-2">
                {/* Participant View */}
                <button
                  onClick={() => setViewMode('participant')}
                  className={`w-full px-4 py-3 rounded-xl text-right transition-all flex items-center gap-3 ${
                    viewMode === 'participant'
                      ? 'bg-[#e35654] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: viewMode === 'participant' ? 600 : 500 }}
                >
                  <Users className="w-5 h-5" />
                  <div>
                    <div className="text-sm">منظور المشارك</div>
                    <div className={`text-xs ${viewMode === 'participant' ? 'text-white/80' : 'text-gray-500'}`}>
                      صفحة التفاصيل الكاملة
                    </div>
                  </div>
                </button>

                {/* Sponsor View */}
                <button
                  onClick={() => setViewMode('sponsor')}
                  className={`w-full px-4 py-3 rounded-xl text-right transition-all flex items-center gap-3 ${
                    viewMode === 'sponsor'
                      ? 'bg-[#e35654] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: viewMode === 'sponsor' ? 600 : 500 }}
                >
                  <Building2 className="w-5 h-5" />
                  <div>
                    <div className="text-sm">منظور الراعي</div>
                    <div className={`text-xs ${viewMode === 'sponsor' ? 'text-white/80' : 'text-gray-500'}`}>
                      صفحة التفاصيل والرعاية
                    </div>
                  </div>
                </button>

                {/* Workspace View */}
                <button
                  onClick={() => setViewMode('workspace')}
                  className={`w-full px-4 py-3 rounded-xl text-right transition-all flex items-center gap-3 ${
                    viewMode === 'workspace'
                      ? 'bg-[#e35654] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: viewMode === 'workspace' ? 600 : 500 }}
                >
                  <Layout className="w-5 h-5" />
                  <div>
                    <div className="text-sm">مساحة العمل</div>
                    <div className={`text-xs ${viewMode === 'workspace' ? 'text-white/80' : 'text-gray-500'}`}>
                      واجهة المشارك الداخلية
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  💡 استخدم المعاينة للتحقق من كيفية ظهور الهاكاثون للمشاركين والرعاة قبل النشر
                </p>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="col-span-9">
            {/* Participant View */}
            {viewMode === 'participant' && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Hero Section */}
                <div className="relative h-64 overflow-hidden">
                  {renderBanner()}

                  {/* Top Bar */}
                  <div className="absolute top-6 right-6 left-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      {hackathonData.type && (
                        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {hackathonData.type}
                        </span>
                      )}
                      {hackathonData.tags.map((tag, idx) => (
                        <span key={idx} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {renderLogo('w-full h-full')}
                      </div>
                      <div>
                        <h1 className="text-white text-2xl mb-1" style={{ fontWeight: 700 }}>
                          {hackathonData.title}
                        </h1>
                        <p className="text-white/90 text-sm">{hackathonData.org}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-6 px-8 py-6 border-b border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.prize}
                    </div>
                    <div className="text-sm text-gray-500">إجمالي الجوائز</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.duration}
                    </div>
                    <div className="text-sm text-gray-500">مدة الهاكاثون</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.teams}
                    </div>
                    <div className="text-sm text-gray-500">فريق مشاركة</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="text-lg text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.date.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div className="text-sm text-gray-500">تاريخ الانطلاق</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="col-span-2 space-y-8">
                      {/* About */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <div className="w-1 h-6 bg-[#e35654] rounded-full" />
                          عن الهاكاثون
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                          {hackathonData.description}
                        </p>
                      </div>

                      {/* Timeline */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <div className="w-1 h-6 bg-[#e35654] rounded-full" />
                          الجدول الزمني
                        </h2>
                        <div className="space-y-3">
                          {hackathonData.timeline.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.done ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                                {item.done ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.label}</div>
                                <div className="text-xs text-gray-500">{item.date}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Registration Button */}
                      <div className="flex gap-3">
                        <button className="flex-1 px-6 py-3.5 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all text-center" style={{ fontWeight: 600 }}>
                          سجل الآن
                        </button>
                        <button className="px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2" style={{ fontWeight: 600 }}>
                          <Star className="w-5 h-5" />
                          حفظ
                        </button>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الإحصائيات</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>المشاركون</span>
                            </div>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{hackathonData.participants}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Eye className="w-4 h-4" />
                              <span>المشاهدات</span>
                            </div>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{hackathonData.views}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>الفرق المسجلة</span>
                            </div>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{hackathonData.teams}</span>
                          </div>
                        </div>
                      </div>

                      {/* Organizer */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الجهة المنظمة</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white" style={{ fontWeight: 700 }}>
                            م
                          </div>
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{hackathonData.org}</div>
                            <div className="text-xs text-gray-500">جهة رسمية موثقة</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{hackathonData.location}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>آخر تسجيل: {hackathonData.deadline}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sponsor View */}
            {viewMode === 'sponsor' && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Hero Section */}
                <div className="relative h-64 overflow-hidden">
                  {renderBanner()}

                  {/* Top Bar */}
                  <div className="absolute top-6 right-6 left-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      {hackathonData.type && (
                        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {hackathonData.type}
                        </span>
                      )}
                      {hackathonData.tags.map((tag, idx) => (
                        <span key={idx} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {renderLogo('w-full h-full')}
                      </div>
                      <div>
                        <h1 className="text-white text-2xl mb-1" style={{ fontWeight: 700 }}>
                          {hackathonData.title}
                        </h1>
                        <p className="text-white/90 text-sm">{hackathonData.org}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-6 px-8 py-6 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.prize}
                    </div>
                    <div className="text-sm text-gray-500">إجمالي الجوائز</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.duration}
                    </div>
                    <div className="text-sm text-gray-500">مدة الهاكاثون</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.participants}
                    </div>
                    <div className="text-sm text-gray-500">المشاركون المتوقعون</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.views}
                    </div>
                    <div className="text-sm text-gray-500">المشاهدات</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="col-span-2 space-y-8">
                      {/* About */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <Handshake className="w-6 h-6 text-[#e35654]" />
                          عن الهاكاثون
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-6">
                          {hackathonData.description}
                        </p>
                      </div>

                      {/* Sponsorship Packages */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <Star className="w-6 h-6 text-[#e35654]" />
                          باقات الرعاية المتاحة
                        </h2>
                        <div className="space-y-4">
                          {hackathonData.sponsorshipPackages.map((pkg) => (
                            <div key={pkg.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#e35654] transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-lg text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                                    {pkg.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {pkg.description}
                                  </p>
                                </div>
                                {pkg.type === 'financial' && (
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">القيمة المالية</div>
                                    <div className="text-xl text-[#e35654]" style={{ fontWeight: 700 }}>
                                      {pkg.value}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Benefits */}
                              <div className="mb-4">
                                <div className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>المزايا:</div>
                                <ul className="space-y-1">
                                  {pkg.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      <span>{benefit}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button className="w-full px-4 py-2.5 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all text-sm" style={{ fontWeight: 600 }}>
                                طلب هذه الباقة
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="bg-gradient-to-br from-orange-50 to-[#fef2f4] border-2 border-orange-200 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#e35654] flex items-center justify-center text-white">
                            <Handshake className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                              ابدأ رعايتك الآن
                            </h3>
                            <p className="text-sm text-gray-600">
                              سيتم مراجعة طلبك والتواصل معك خلال 48 ساعة
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      {/* Organizer */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الجهة المنظمة</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white" style={{ fontWeight: 700 }}>
                            م
                          </div>
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{hackathonData.org}</div>
                            <div className="text-xs text-gray-500">جهة رسمية موثقة</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{hackathonData.location}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>فترة التسجيل: حتى {hackathonData.deadline}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الجدول الزمني</h3>
                        <div className="space-y-3">
                          {hackathonData.timeline.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-900" style={{ fontWeight: 600 }}>{item.label}</div>
                                <div className="text-xs text-gray-500">{item.date}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workspace View */}
            {viewMode === 'workspace' && (
              <div className="bg-[#f7f7f6] rounded-2xl overflow-hidden">
                {/* Hero Section — same shape as participant/sponsor */}
                <div className="relative h-64 overflow-hidden">
                  {renderBanner()}

                  {/* Top Bar — type + tags */}
                  <div className="absolute top-6 right-6 left-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      {hackathonData.type && (
                        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {hackathonData.type}
                        </span>
                      )}
                      {hackathonData.tags.map((tag, idx) => (
                        <span key={idx} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Info — logo + title + org */}
                  <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {renderLogo('w-full h-full')}
                      </div>
                      <div>
                        <h1 className="text-white text-2xl mb-1" style={{ fontWeight: 700 }}>
                          {hackathonData.title}
                        </h1>
                        <p className="text-white/90 text-sm">{hackathonData.org}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body - مثل ParticipantWorkspace */}
                <div className="p-6">
                  <div className="grid lg:grid-cols-4 gap-4">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-2">
                      {[
                        { icon: '🏠', label: 'الرئيسية', color: '#6366f1', active: true },
                        { icon: '👥', label: 'بيانات الفريق', color: '#10b981', active: false },
                        { icon: '📹', label: 'الجلسات', color: '#06b6d4', active: false },
                        { icon: '📤', label: 'رفع المشروع', color: '#e35654', active: false },
                        { icon: '📊', label: 'التقييمات', color: '#f59e0b', active: false },
                        { icon: '🏆', label: 'الشهادات', color: '#8b5cf6', active: false },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="w-full text-right rounded-xl p-3 transition-all"
                          style={{
                            background: item.active ? 'white' : 'transparent',
                            border: item.active ? `2px solid ${item.color}40` : '1px solid transparent',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: item.active ? `${item.color}15` : '#f3f4f6' }}>
                              {item.icon}
                            </div>
                            <span className={`text-xs ${item.active ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontWeight: item.active ? 700 : 500 }}>
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-3">
                      {/* About Card */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>عن الهاكاثون</h3>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                          {hackathonData.description}
                        </p>
                      </div>

                      {/* Timer Card */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>الوقت المتبقي للتسليم</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: '10', label: 'أيام' },
                            { value: '05', label: 'ساعة' },
                            { value: '32', label: 'دقيقة' },
                            { value: '45', label: 'ثانية' },
                          ].map((time, i) => (
                            <div key={i} className="text-center py-2 rounded-lg bg-[#fef2f4] border border-[#fce7eb]">
                              <p className="text-sm" style={{ fontWeight: 700, color: '#e35654' }}>{time.value}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{time.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline Card */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>الجدول الزمني</h3>
                        </div>
                        <div className="space-y-2">
                          {[
                            { phase: 'بداية المسابقة', date: '1 أكتوبر', status: 'completed', color: '#10b981' },
                            { phase: 'تطوير النماذج الأولية', date: '1-7 أكتوبر', status: 'active', color: '#e35654' },
                            { phase: 'التسليم النهائي', date: '13 أكتوبر', status: 'upcoming', color: '#6b7280' },
                          ].map((phase, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: phase.status === 'completed' ? '#f0fdf4' : phase.status === 'active' ? '#fef2f2' : '#f9fafb',
                                  border: `2px solid ${phase.color}`,
                                }}
                              >
                                {phase.status === 'completed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: phase.color }} />
                                ) : phase.status === 'active' ? (
                                  <Target className="w-3.5 h-3.5" style={{ color: phase.color }} />
                                ) : (
                                  <Flag className="w-3.5 h-3.5" style={{ color: phase.color }} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs text-gray-900" style={{ fontWeight: 600 }}>{phase.phase}</h4>
                                <p className="text-xs text-gray-400">{phase.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
