import { Link } from 'react-router';
import { ArrowRight, BarChart3, Users, Trophy, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'إجمالي المشاركين', value: '1,248', icon: Users, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
  { label: 'الهاكاثونات النشطة', value: '5', icon: BarChart3, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
  { label: 'المشاريع المقدمة', value: '87', icon: Trophy, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
  { label: 'معدل النمو', value: '+23%', icon: TrendingUp, color: 'bg-[#fef2f2] text-[#a41b42]', iconBg: 'bg-[#fce7eb]' },
];

export function AdminAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/admin"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                الإحصائيات والتقارير
              </h1>
              <p className="text-sm text-gray-500">
                تتبع تحليلات المشاركين الشاملة وتقارير الأداء والنتائج
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-lg text-gray-900 mb-6" style={{ fontWeight: 700 }}>نظرة عامة على الأداء</h3>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">سيتم عرض الرسوم البيانية هنا</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
