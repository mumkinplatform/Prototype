import { Link, useParams } from 'react-router';
import { ArrowRight, BarChart3, Users, FileText, TrendingUp, Download } from 'lucide-react';

const stats = [
  { label: 'المسجلين', value: '324', change: '+12%', icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { label: 'المشاريع المقدمة', value: '48', change: '+5%', icon: FileText, bg: 'bg-green-50', iconColor: 'text-green-600' },
  { label: 'معدل الإكمال', value: '78%', change: '+3%', icon: TrendingUp, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { label: 'الزيارات', value: '2,150', change: '+18%', icon: BarChart3, bg: 'bg-purple-50', iconColor: 'text-purple-600' },
];

export function HackathonAnalytics() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <Link
              to={`/admin/hackathon/${id}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>الإحصائيات والتقارير</h1>
              <p className="text-sm text-gray-500">تحليل البيانات الفورية وتقارير الأداء</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800" style={{ fontWeight: 600 }}>
              <Download className="w-4 h-4" />
              تصدير التقرير
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full" style={{ fontWeight: 600 }}>{stat.change}</span>
              </div>
              <p className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-lg text-gray-900 mb-6" style={{ fontWeight: 700 }}>تفاصيل الأداء</h3>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">سيتم عرض الرسوم البيانية التفصيلية هنا</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
