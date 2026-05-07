import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowRight,
  Gavel,
  UserCheck,
  Users,
  BarChart3,
  DollarSign,
  Trophy,
  ExternalLink,
  Undo2,
  Loader2,
} from 'lucide-react';
import { apiGet, apiPost, ApiError } from '../../lib/api';

interface ManagementCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  link: string;
  badge?: string;
}

export default function HackathonManagement() {
  const { id } = useParams();
  const [status, setStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ hackathon: { H_status: string } }>(`/hackathons/${id}`);
        if (!cancelled) setStatus(data.hackathon.H_status);
      } catch (err) {
        if (!cancelled) setStatus(null);
        console.error('failed to load hackathon status', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleRevertToDraft = async () => {
    if (!id) return;
    setReverting(true);
    setErrorMsg(null);
    try {
      await apiPost(`/hackathons/${id}/unpublish`);
      setStatus('draft');
      setConfirming(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'تعذّر إرجاع الهاكاثون لمسودة';
      setErrorMsg(msg);
    } finally {
      setReverting(false);
    }
  };

  const managementCards: ManagementCard[] = [
    {
      id: 'projects',
      title: 'إدارة المشاريع والتحكم',
      description: 'تتبع تسليمات المشاريع المرسلة، مراجعة إنجاز الفرق، وترصد الإدخالات التقييمية لكل مشروع.',
      icon: Gavel,
      bgColor: 'bg-indigo-50',
      iconBgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      buttonColor: 'bg-indigo-600',
      buttonHoverColor: 'hover:bg-indigo-700',
      link: `/admin/hackathon/${id}/projects`
    },
    {
      id: 'registrations',
      title: 'إدارة التسجيلات والمشاركين',
      description: 'مراجعة طلبات الانضمام، قبول الفرق المناسبة، وإدارة الفريق المشاركة وتفاويل التواصل المباشرة معهم.',
      icon: UserCheck,
      bgColor: 'bg-orange-50',
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      buttonColor: 'bg-gray-900',
      buttonHoverColor: 'hover:bg-gray-800',
      link: `/admin/hackathon/${id}/registrations`,
      badge: '12 طلب جديد'
    },
    {
      id: 'teams',
      title: 'إدارة فرق التنظيم',
      description: 'تحكم كامل في الأدوار الفريق، تعيين الصلاحيات، ومتابعة سجلات الدخول والنشاطات لضمان أمن التنسيق.',
      icon: Users,
      bgColor: 'bg-blue-50',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600',
      buttonHoverColor: 'hover:bg-blue-700',
      link: `/admin/hackathon/${id}/teams`
    },
    {
      id: 'analytics',
      title: 'الإحصائيات والتقارير',
      description: 'تحليل البيانات الفورية، معدلات النمو تقارير التفاصيل، وتوجهات الهاكاثون بصيغة قابلة للتصدير.',
      icon: BarChart3,
      bgColor: 'bg-gray-50',
      iconBgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
      buttonColor: 'bg-gray-900',
      buttonHoverColor: 'hover:bg-gray-800',
      link: `/admin/hackathon/${id}/statistics`
    },
    {
      id: 'sponsors',
      title: 'الرعاة والمفاوضات',
      description: 'متابعة العلاقات بالشركاء الاستراتيجيين، إدارة الرعاة المسجلين، والخدمات المؤسسية المقدمة للحدث.',
      icon: DollarSign,
      bgColor: 'bg-emerald-50',
      iconBgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      buttonColor: 'bg-blue-600',
      buttonHoverColor: 'hover:bg-blue-700',
      link: `/admin/hackathon/${id}/sponsors`
    },
    {
      id: 'winners',
      title: 'إعلان الفائدين والنتائج',
      description: 'إعداد الترتيب النهائي، توزع الجوائز المحددة والشهادات، وتوليد شهادات الحضور للمشاركين.',
      icon: Trophy,
      bgColor: 'bg-yellow-50',
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonColor: 'bg-gray-900',
      buttonHoverColor: 'hover:bg-gray-800',
      link: `/admin/hackathon/${id}/winners`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link 
              to="/admin/my-hackathons" 
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                مركز إدارة الهاكاثون
              </h1>
              <p className="text-sm text-gray-500">
                نظرة عامة على أدوات التنظيم والتحكم لتسهيل سير العمل
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Status banner */}
        {status && (
          <div
            className={`mb-8 rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              status === 'published'
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'published' ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              <div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  {status === 'published' ? 'الهاكاثون منشور' : 'الهاكاثون مسودة'}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {status === 'published'
                    ? 'مرئي للعموم على الصفحة العامة. لإجراء تعديلات جوهرية، أرجعه لمسودة أولاً.'
                    : 'غير مرئي للعموم. أكمل التعديلات ثم أعد النشر.'}
                </div>
              </div>
            </div>
            {status === 'published' && (
              <div className="flex items-center gap-2">
                {!confirming ? (
                  <button
                    onClick={() => {
                      setErrorMsg(null);
                      setConfirming(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-sm flex items-center gap-2 transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>إرجاع كمسودة</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRevertToDraft}
                      disabled={reverting}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 text-sm flex items-center gap-2 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      {reverting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جارٍ الإرجاع...</span>
                        </>
                      ) : (
                        <>
                          <Undo2 className="w-4 h-4" />
                          <span>تأكيد الإرجاع</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={reverting}
                      className="px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-sm transition-all"
                    >
                      إلغاء
                    </button>
                  </>
                )}
              </div>
            )}
            {status === 'draft' && (
              <Link
                to={`/admin/create-hackathon/${id}`}
                className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm flex items-center gap-2 transition-all"
                style={{ fontWeight: 600 }}
              >
                <span>متابعة التعديل</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {managementCards.map((card) => (
            <div 
              key={card.id} 
              className={`${card.bgColor} rounded-3xl p-8 border-2 border-transparent hover:border-gray-300 transition-all relative overflow-hidden group shadow-sm hover:shadow-xl flex flex-col min-h-[380px]`}
            >
              {/* Badge */}
              {card.badge && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-full shadow-md" style={{ fontWeight: 600 }}>
                  {card.badge}
                </div>
              )}

              {/* Icon */}
              <div className={`w-24 h-24 ${card.iconBgColor} rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-sm`}>
                <card.icon className={`w-12 h-12 ${card.iconColor}`} strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div className="text-center mb-4 flex-1">
                <h3 className="text-xl text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Button */}
              <Link
                to={card.link}
                className={`w-full px-6 py-3.5 rounded-xl ${card.buttonColor} ${card.buttonHoverColor} text-white text-sm transition-all flex items-center justify-center gap-2 shadow-lg`}
                style={{ fontWeight: 600 }}
              >
                <span>فتح القسم</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}