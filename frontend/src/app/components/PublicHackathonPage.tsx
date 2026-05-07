import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import {
  Calendar,
  MapPin,
  Trophy,
  Users,
  Clock,
  Sparkles,
  Handshake,
  CheckCircle2,
  Mail,
  Building2,
  Target,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { BannerPattern } from './BannerPatterns';
import { LogoPattern } from './LogoPatterns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// Accept both "YYYY-MM-DD HH:MM:SS" (mysql2 dateStrings) and ISO formats.
// Treat as local time — never apply timezone shifts.
function parseLocal(v: string): Date | null {
  const normalized = v.replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(v: unknown): string {
  if (!v || typeof v !== 'string') return '';
  const d = parseLocal(v);
  if (!d) return '';
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDateShort(v: unknown): string {
  if (!v || typeof v !== 'string') return '';
  const d = parseLocal(v);
  if (!d) return '';
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
}

interface ApiResponse {
  hackathon: Record<string, unknown>;
  organizer: {
    M_FName: string;
    M_LName: string;
    M_Bio: string | null;
    M_Email: string | null;
    ORG_Name: string | null;
  } | null;
  tracks: { HT_ID: number; HT_Name: string; HT_Description: string | null }[];
  judges: { HJ_ID: number; HJ_FullName: string; HJ_Email: string; HJ_Specialty: string | null }[];
  prizes: { HP_ID: number; HP_Position: string; HP_Amount: string | null; HP_Description: string | null }[];
  sponsorPackages: {
    SP_ID: number;
    SP_Name: string;
    SP_Type: string;
    SP_Description: string | null;
    SP_Duration: string | null;
    SP_Price: string | null;
    SP_Sponsor_Offer: string | null;
    SP_Resources: string | null;
    SP_Benefits: unknown;
  }[];
}

const SPONSOR_TYPE_LABEL: Record<string, string> = {
  financial: 'مالية',
  technical: 'تقنية',
  logistic: 'لوجستية',
  hospitality: 'ضيافة',
  media: 'إعلامية',
};

export function PublicHackathonPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/hackathons/public/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        if (d) setData(d as ApiResponse);
      })
      .catch(() => toast.error('تعذّر تحميل الهاكاثون'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-3xl text-gray-900 mb-3" style={{ fontWeight: 800 }}>
            الهاكاثون غير موجود
          </h1>
          <p className="text-gray-600 mb-6">قد يكون الرابط غير صحيح أو الهاكاثون لم يُنشر بعد.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all"
            style={{ fontWeight: 600 }}
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const h = data.hackathon as Record<string, string | number | null | undefined>;

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
  const colorPalette = (branding.colorPalette as string) || 'red';
  const logoUploadDataUrl = branding.logoMode === 'upload' ? (branding.logoUploadDataUrl as string) : null;
  const logoPattern = branding.logoMode === 'pattern' ? (branding.logoPattern as string) : null;
  const bannerUploadDataUrl = branding.bannerMode === 'upload' ? (branding.bannerUploadDataUrl as string) : null;
  const bannerPattern = branding.bannerMode === 'pattern' ? (branding.bannerPattern as string) : null;
  const visibleSections = (branding.visibleSections as Record<string, boolean> | undefined) ?? {};

  const renderLogo = (className = 'w-full h-full object-contain') => {
    if (logoUploadDataUrl) return <img src={logoUploadDataUrl} alt="logo" className={className} />;
    if (logoPattern) return <LogoPattern pattern={logoPattern} colorPalette={colorPalette} />;
    return <Sparkles className="w-1/2 h-1/2 text-gray-400" />;
  };

  const renderBanner = () => {
    if (bannerUploadDataUrl) {
      return <img src={bannerUploadDataUrl} alt="banner" className="absolute inset-0 w-full h-full object-cover" />;
    }
    if (bannerPattern) {
      return (
        <div className="absolute inset-0">
          <BannerPattern pattern={bannerPattern} colorPalette={colorPalette} />
        </div>
      );
    }
    return <div className="absolute inset-0 bg-gradient-to-br from-[#e35654] to-[#cc4a48]" />;
  };

  const totalPrize = data.prizes
    .map((p) => Number(String(p.HP_Amount || '').replace(/[^\d.]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)
    .reduce((a, b) => a + b, 0);

  const isOnline = h.H_type === 'عبر الإنترنت';
  const orgName = data.organizer?.ORG_Name || `${data.organizer?.M_FName ?? ''} ${data.organizer?.M_LName ?? ''}`.trim();

  const milestones: { date: string; label: string }[] = [];
  if (h.H_Registration_StartDate) milestones.push({ date: fmtDateShort(h.H_Registration_StartDate), label: 'فتح التسجيل' });
  if (h.H_Registration_EndDate) milestones.push({ date: fmtDateShort(h.H_Registration_EndDate), label: 'إغلاق التسجيل' });
  if (h.H_Announcement_Date) milestones.push({ date: fmtDateShort(h.H_Announcement_Date), label: 'إعلان المقبولين' });
  if (h.H_Hackathon_StartDate) milestones.push({ date: fmtDateShort(h.H_Hackathon_StartDate), label: 'بدء الهاكاثون' });
  if (h.H_Winners_Date) milestones.push({ date: fmtDateShort(h.H_Winners_Date), label: 'إعلان الفائزين' });

  const showTimeline = visibleSections.timeline !== false && milestones.length > 0;
  const showSponsors = visibleSections.sponsors !== false && data.sponsorPackages.length > 0;
  const showPrizes = visibleSections.prizes !== false && data.prizes.length > 0;

  return (
    <div dir="rtl" className="bg-white min-h-screen font-sans">
      {/* Public header — branded with section nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#e35654] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
              مُمكّن
            </span>
          </Link>

          {/* Section nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: 'about', label: 'عن الهاكاثون' },
              { id: 'tracks', label: 'المسارات' },
              { id: 'prizes', label: 'الجوائز' },
              { id: 'sponsors', label: 'باقات الرعاية' },
              { id: 'join', label: 'شارك معنا' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                style={{ fontWeight: 500 }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center px-5 py-2 rounded-xl text-[#e35654] text-sm border border-[#e35654] hover:bg-[#e35654]/10 transition-all"
              style={{ fontWeight: 500 }}
            >
              تسجيل الدخول
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#e35654] text-white text-sm shadow-sm hover:bg-[#cc4a48] transition-all"
              style={{ fontWeight: 500 }}
            >
              ابدأ الآن
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — landing-page style */}
      <section id="about" className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 scroll-mt-16">
        {/* Gradient & blobs */}
        <div className="absolute inset-0 bg-gradient-to-bl from-rose-50 via-rose-100 to-fuchsia-50 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/80" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#e35654]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Right: Title & meta */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {h.H_type ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e35654]/10 text-[#e35654] mb-5 text-sm" style={{ fontWeight: 600 }}>
                  <Sparkles className="w-4 h-4" />
                  {h.H_type as string}
                </span>
              ) : null}

              <h1 className="text-4xl lg:text-5xl text-gray-900 mb-5 leading-tight" style={{ fontWeight: 800 }}>
                {(h.H_title as string) || 'هاكاثون'}
              </h1>

              {orgName ? (
                <p className="text-lg text-gray-600 mb-6">
                  ينظّمه <span className="text-[#e35654]" style={{ fontWeight: 700 }}>{orgName}</span>
                </p>
              ) : null}

              {h.H_description ? (
                <p className="text-gray-600 mb-8 leading-relaxed whitespace-pre-line">
                  {h.H_description as string}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <button
                  onClick={() => navigate('/auth')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/30 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <Users className="w-5 h-5" />
                  سجّل كمشارك
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white border-2 border-[#e35654] text-[#e35654] hover:bg-[#e35654]/5 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <Handshake className="w-5 h-5" />
                  كن راعياً
                </button>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-3 shadow-sm">
                  <Calendar className="w-4 h-4 mb-1 text-[#e35654]" />
                  <div className="text-[11px] text-gray-500">تاريخ الانطلاق</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                    {fmtDateShort(h.H_Hackathon_StartDate || h.H_StartDate) || '—'}
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-3 shadow-sm">
                  <MapPin className="w-4 h-4 mb-1 text-[#e35654]" />
                  <div className="text-[11px] text-gray-500">الموقع</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                    {isOnline ? 'عبر الإنترنت' : ((h.H_city as string) || '—')}
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-3 shadow-sm">
                  <Clock className="w-4 h-4 mb-1 text-[#e35654]" />
                  <div className="text-[11px] text-gray-500">آخر تسجيل</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                    {fmtDateShort(h.H_Registration_EndDate) || '—'}
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-3 shadow-sm">
                  <Trophy className="w-4 h-4 mb-1 text-[#e35654]" />
                  <div className="text-[11px] text-gray-500">إجمالي الجوائز</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                    {totalPrize > 0 ? `${totalPrize.toLocaleString('en-US')} ر.س` : '—'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Left: Banner & Logo card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 aspect-[4/3]">
                {renderBanner()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-5 right-5 left-5 flex items-end gap-4">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl p-2 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {renderLogo()}
                  </div>
                </div>
              </div>
              {/* Decorative floating chip */}
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 border border-gray-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-700" style={{ fontWeight: 600 }}>
                  التسجيل مفتوح
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tracks */}
      {data.tracks.length > 0 ? (
        <section id="tracks" className="py-20 bg-white scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                <span className="text-[#e35654]">المسارات</span> المتاحة
              </h2>
              <p className="text-gray-500 text-lg">اختر المسار المناسب لمشروعك</p>
            </motion.div>

            <div
              className={`grid gap-6 mx-auto ${
                data.tracks.length === 1
                  ? 'grid-cols-1 max-w-md'
                  : data.tracks.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
              }`}
            >
              {data.tracks.map((t, i) => (
                <motion.div
                  key={t.HT_ID}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-[#e35654]/40 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#e35654]/10 flex items-center justify-center mb-4 group-hover:bg-[#e35654] transition-all">
                    <Layers className="w-6 h-6 text-[#e35654] group-hover:text-white transition-all" />
                  </div>
                  <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    {t.HT_Name}
                  </h3>
                  {t.HT_Description ? (
                    <p className="text-sm text-gray-600 leading-relaxed">{t.HT_Description}</p>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Timeline */}
      {showTimeline ? (
        <section className="py-20 bg-gradient-to-br from-rose-50/40 via-white to-fuchsia-50/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                <span className="text-[#e35654]">الجدول</span> الزمني
              </h2>
              <p className="text-gray-500 text-lg">المراحل الرئيسية للهاكاثون</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-2 max-w-6xl mx-auto">
              {milestones.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all text-center h-full">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ fontWeight: 700 }}>
                      {idx + 1}
                    </div>
                    <div className="text-sm text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {m.label}
                    </div>
                    <div className="text-xs text-[#e35654]" style={{ fontWeight: 600 }}>
                      {m.date}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Prizes */}
      {showPrizes ? (
        <section id="prizes" className="py-20 bg-white scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 mb-4" style={{ fontWeight: 600 }}>
                <Trophy className="w-4 h-4" />
                <span className="text-sm">جوائز قيّمة في انتظارك</span>
              </div>
              <h2 className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                <span className="text-[#e35654]">الجوائز</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {data.prizes.map((p, idx) => (
                <motion.div
                  key={p.HP_ID}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-8 border-2 border-amber-200/60 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center text-2xl mb-4 shadow-lg" style={{ fontWeight: 800 }}>
                      {idx + 1}
                    </div>
                    <h3 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                      {p.HP_Position}
                    </h3>
                    {p.HP_Amount ? (
                      <p className="text-3xl text-amber-700 mb-3" style={{ fontWeight: 800 }}>
                        {p.HP_Amount}
                      </p>
                    ) : null}
                    {p.HP_Description ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{p.HP_Description}</p>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>

            {h.H_Prize_Terms ? (
              <p className="text-xs text-gray-500 mt-8 leading-relaxed whitespace-pre-line text-center max-w-3xl mx-auto">
                {h.H_Prize_Terms as string}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Sponsor packages */}
      {showSponsors ? (
        <section id="sponsors" className="py-20 bg-gradient-to-br from-rose-50/40 via-white to-fuchsia-50/30 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e35654]/10 text-[#e35654] mb-4" style={{ fontWeight: 600 }}>
                <Handshake className="w-4 h-4" />
                <span className="text-sm">للرعاة</span>
              </div>
              <h2 className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                باقات <span className="text-[#e35654]">الرعاية</span>
              </h2>
              <p className="text-gray-500 text-lg">اختر الباقة الأنسب لشركتك</p>
            </motion.div>

            <div
              className={`grid gap-6 mx-auto ${
                data.sponsorPackages.length === 1
                  ? 'grid-cols-1 max-w-md'
                  : data.sponsorPackages.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
              }`}
            >
              {data.sponsorPackages.map((s, idx) => {
                let benefits: string[] = [];
                try {
                  const raw = s.SP_Benefits;
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
                  if (Array.isArray(parsed)) benefits = parsed.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
                } catch {
                  benefits = [];
                }
                return (
                  <motion.div
                    key={s.SP_ID}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="bg-white rounded-3xl p-7 border-2 border-gray-100 hover:border-[#e35654]/40 hover:shadow-xl transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>{s.SP_Name}</h3>
                      <span className="px-3 py-1 rounded-full bg-[#e35654]/10 text-[#e35654] text-xs whitespace-nowrap" style={{ fontWeight: 600 }}>
                        {SPONSOR_TYPE_LABEL[s.SP_Type] || 'أخرى'}
                      </span>
                    </div>

                    {s.SP_Price ? (
                      <p className="text-3xl text-[#e35654] mb-3" style={{ fontWeight: 800 }}>
                        {s.SP_Price} <span className="text-base text-gray-500" style={{ fontWeight: 500 }}>ر.س</span>
                      </p>
                    ) : null}

                    {s.SP_Description ? (
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{s.SP_Description}</p>
                    ) : null}

                    {benefits.length > 0 ? (
                      <ul className="space-y-2 mb-5 flex-1">
                        {benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-[#e35654] flex-shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <button
                      onClick={() => navigate('/auth')}
                      className="mt-auto w-full py-3 rounded-xl border-2 border-[#e35654] text-[#e35654] hover:bg-[#e35654] hover:text-white transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      تواصل لرعاية الهاكاثون
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Final CTA */}
      <section id="join" className="py-20 bg-white scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e35654] via-[#d94745] to-[#cc4a48] p-12 lg:p-16 text-white shadow-2xl text-center"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

            <div className="relative z-10">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-4xl lg:text-5xl mb-4" style={{ fontWeight: 800 }}>
                انضم إلى الهاكاثون
              </h2>
              {h.H_Registration_EndDate ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    آخر موعد للتسجيل: {fmtDate(h.H_Registration_EndDate)}
                  </span>
                </div>
              ) : null}
              <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                سجّل الآن وابدأ رحلتك في الابتكار — كمشارك أو راعٍ
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/auth')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#e35654] hover:bg-gray-50 shadow-2xl transition-all hover:scale-105"
                  style={{ fontWeight: 700 }}
                >
                  <Users className="w-5 h-5" />
                  سجّل كمشارك
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white/20 transition-all hover:scale-105"
                  style={{ fontWeight: 700 }}
                >
                  <Handshake className="w-5 h-5" />
                  كن راعياً
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Organizer info — moved here per request */}
      {data.organizer ? (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-rose-50/60 via-white to-fuchsia-50/40 rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-sm"
            >
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-5 text-center" style={{ fontWeight: 600 }}>
                الجهة المنظّمة
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
                <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 p-2 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  {renderLogo()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    {orgName}
                  </h3>
                  {data.organizer.M_Bio ? (
                    <p className="text-gray-600 leading-relaxed mb-5">{data.organizer.M_Bio}</p>
                  ) : null}

                  {(() => {
                    const channels: { label: string; value: string; href: string }[] = [];
                    if (h.H_contact_email) {
                      channels.push({
                        label: 'البريد الرسمي للهاكاثون',
                        value: String(h.H_contact_email),
                        href: `mailto:${h.H_contact_email}`,
                      });
                    }
                    if (
                      data.organizer.M_Email &&
                      data.organizer.M_Email !== h.H_contact_email
                    ) {
                      channels.push({
                        label: 'البريد المباشر للمنظّم',
                        value: data.organizer.M_Email,
                        href: `mailto:${data.organizer.M_Email}`,
                      });
                    }
                    if (channels.length === 0) return null;
                    return (
                      <div className="flex flex-col gap-2.5">
                        {channels.map((c, i) => (
                          <a
                            key={i}
                            href={c.href}
                            className="inline-flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-700 hover:text-[#e35654] transition-all group"
                          >
                            <span className="w-8 h-8 rounded-lg bg-[#e35654]/10 flex items-center justify-center group-hover:bg-[#e35654]/20 transition-all">
                              <Mail className="w-4 h-4 text-[#e35654]" />
                            </span>
                            <span className="flex flex-col items-start">
                              <span className="text-[11px] text-gray-500">{c.label}</span>
                              <span dir="ltr" style={{ fontWeight: 600 }}>{c.value}</span>
                            </span>
                          </a>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* Become organizer CTA */}
      <section className="py-16 bg-gradient-to-br from-rose-50/60 via-fuchsia-50/40 to-rose-50/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden text-center rounded-3xl bg-gradient-to-br from-rose-100/70 via-white to-fuchsia-100/60 border border-[#e35654]/20 shadow-xl p-10 lg:p-14"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#e35654]/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-fuchsia-300/30 rounded-full blur-3xl" />

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[#e35654] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#e35654]/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl lg:text-3xl text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                تبغى تنظّم <span className="text-[#e35654]">هاكاثونك الخاص؟</span>
              </h3>
              <p className="text-gray-700 mb-8 max-w-xl mx-auto leading-relaxed">
                مُمكّن توفّر لك كل الأدوات لتصميم وإدارة هاكاثونك من البداية حتى إعلان الفائزين — في منصة عربية واحدة.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/30 transition-all"
                style={{ fontWeight: 600 }}
              >
                <Building2 className="w-5 h-5" />
                سجّل كمنظّم
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Public footer — matches the main platform footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e35654] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700" style={{ fontWeight: 600 }}>
                مُمكّن
              </span>
            </Link>
            <p className="text-gray-400 text-sm">
              © 2026 مُمكّن — منصة الهاكاثونات الرقمية. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-4 text-sm text-gray-500" />
          </div>
        </div>
      </footer>
    </div>
  );
}
