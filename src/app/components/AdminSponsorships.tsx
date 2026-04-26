import { Link } from 'react-router';
import { ArrowRight, HandshakeIcon, Search, Filter, Plus } from 'lucide-react';

const mockSponsors = [
  { id: 1, name: 'شركة التقنية المتقدمة', status: 'مؤكد', amount: '50,000 ر.س', hackathon: 'هاكاثون الابتكار', tier: 'ذهبي' },
  { id: 2, name: 'مؤسسة الابتكار الرقمي', status: 'قيد التفاوض', amount: '30,000 ر.س', hackathon: 'تحدي الأمن السيبراني', tier: 'فضي' },
  { id: 3, name: 'شركة الحلول الذكية', status: 'مؤكد', amount: '75,000 ر.س', hackathon: 'هاكاثون الابتكار', tier: 'بلاتيني' },
  { id: 4, name: 'مجموعة المستقبل التقني', status: 'معلق', amount: '20,000 ر.س', hackathon: 'لقاء الإبداع الطلابي', tier: 'برونزي' },
];

export function AdminSponsorships() {
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
                إدارة الرعايات
              </h1>
              <p className="text-sm text-gray-500">
                تابع طلبات الرعاية والعروض وتواصل مع الرعاة المحتملين والحاليين
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="ابحث عن راعٍ..."
                className="pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm w-64 focus:outline-none focus:border-[#a41b42]"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              تصفية
            </button>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a41b42] text-white text-sm hover:bg-[#8b1538] shadow-lg shadow-[#a41b42]/20" style={{ fontWeight: 600 }}>
            <Plus className="w-4 h-4" />
            إضافة راعٍ جديد
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>اسم الراعي</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الهاكاثون</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>المستوى</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>المبلغ</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {mockSponsors.map((sponsor) => (
                <tr key={sponsor.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <HandshakeIcon className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{sponsor.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sponsor.hackathon}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-amber-50 text-amber-700" style={{ fontWeight: 600 }}>
                      {sponsor.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900" style={{ fontWeight: 600 }}>{sponsor.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      sponsor.status === 'مؤكد' ? 'bg-green-50 text-green-700' :
                      sponsor.status === 'قيد التفاوض' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`} style={{ fontWeight: 600 }}>
                      {sponsor.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
