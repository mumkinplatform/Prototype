import { Link, useParams } from 'react-router';
import { 
  ArrowRight, 
  Gavel, 
  UserCheck, 
  Users, 
  BarChart3, 
  DollarSign, 
  Trophy,
  ExternalLink
} from 'lucide-react';

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