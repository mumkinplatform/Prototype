import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowRight,
  Users,
  TrendingUp,
  Activity,
  Target,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trophy,
  MapPin,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// بيانات نمو التسجيل الأسبوعي
const weeklyGrowthData = [
  { week: 'أسبوع 1', registrations: 280 },
  { week: 'أسبوع 2', registrations: 520 },
  { week: 'أسبوع 3', registrations: 890 },
  { week: 'أسبوع 4', registrations: 1240 },
  { week: 'أسبوع 5', registrations: 1640 },
  { week: 'أسبوع 6', registrations: 1840 },
];

// التوزيع الجغرافي
const geoDistributionData = [
  { city: 'الرياض', participants: 520 },
  { city: 'جدة', participants: 380 },
  { city: 'الدمام', participants: 290 },
  { city: 'مكة المكرمة', participants: 240 },
  { city: 'المدينة المنورة', participants: 180 },
];

// المشتركون حسب المسار
const trackDistributionData = [
  { name: 'الذكاء الاصطناعي', value: 45, color: '#3b82f6' },
  { name: 'تطوير الويب', value: 30, color: '#22c55e' },
  { name: 'أمن المعلومات', value: 15, color: '#f59e0b' },
  { name: 'تطبيقات الجوال', value: 10, color: '#8b5cf6' },
];

// معدل التسجيل الزمني
const timeRegistrationData = [
  { time: '00:00', count: 45 },
  { time: '04:00', count: 20 },
  { time: '08:00', count: 180 },
  { time: '12:00', count: 320 },
  { time: '16:00', count: 280 },
  { time: '20:00', count: 240 },
  { time: '23:00', count: 120 },
];

// أفضل الفرق
const topTeams = [
  {
    rank: 1,
    name: 'فريق النخبة',
    track: 'الذكاء الاصطناعي',
    category: 'فئة متقدمة',
    score: '94/100',
    status: 'نشط',
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    rank: 2,
    name: 'رواد المستقبل',
    track: 'تطوير الويب',
    category: 'فئة متوسطة',
    score: '91/100',
    status: 'نشط',
    color: 'bg-gray-100 text-gray-700',
  },
  {
    rank: 3,
    name: 'مطورون بلا حدود',
    track: 'أمن المعلومات',
    category: 'فئة متقدمة',
    score: '89/100',
    status: 'قيد المراجعة',
    color: 'bg-orange-100 text-orange-700',
  },
];

export function HackathonStatistics() {
  const { id } = useParams();
  const [selectedMonth, setSelectedMonth] = useState('فبراير 2025');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const stats = [
    { label: 'إجمالي التسجيلات', value: '1,840', change: '+12%', icon: Users, color: 'blue', trend: 'up' },
    { label: 'فرق مشاركة', value: '420', change: '+8%', icon: Target, color: 'green', trend: 'up' },
    { label: 'معدل التفاعل', value: '92%', change: '+5%', icon: Activity, color: 'purple', trend: 'up' },
    { label: 'معدل مكتمل', value: '15.4%', change: '-2%', icon: TrendingUp, color: 'red', trend: 'down' },
  ];

  const handleNextMonth = () => {
    const currentMonthIndex = months.findIndex(m => selectedMonth.startsWith(m));
    if (currentMonthIndex < 11) {
      setSelectedMonth(`${months[currentMonthIndex + 1]} ${selectedYear}`);
    } else {
      setSelectedMonth(`${months[0]} ${selectedYear + 1}`);
      setSelectedYear(selectedYear + 1);
    }
  };

  const handlePrevMonth = () => {
    const currentMonthIndex = months.findIndex(m => selectedMonth.startsWith(m));
    if (currentMonthIndex > 0) {
      setSelectedMonth(`${months[currentMonthIndex - 1]} ${selectedYear}`);
    } else {
      setSelectedMonth(`${months[11]} ${selectedYear - 1}`);
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleExportReport = () => {
    // Simulate export
    const element = document.createElement('a');
    const file = new Blob(['تقرير الهاكاثون - ' + selectedMonth], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `hackathon-report-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                to={`/admin/hackathon/${id}`}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  مركز الإحصائيات والتقارير
                </h1>
                <p className="text-sm text-gray-500">
                  كل الإحصائيات، الرسوم، والمؤشرات التي تحتاج لمتابعة أداء الهاكاثون
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Month Selector */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <button className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex items-center gap-2 px-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                    {selectedMonth}
                  </span>
                </div>
                <button className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white text-sm hover:bg-[#8b1538] transition-all shadow-lg shadow-[#a41b42]/30"
                style={{ fontWeight: 600 }}
              >
                <Download className="w-4 h-4" />
                تصدير تقارير
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:scale-105 hover:border-gray-300 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    stat.color === 'blue'
                      ? 'bg-blue-100 group-hover:bg-blue-200'
                      : stat.color === 'green'
                      ? 'bg-green-100 group-hover:bg-green-200'
                      : stat.color === 'purple'
                      ? 'bg-purple-100 group-hover:bg-purple-200'
                      : 'bg-[#fce7eb] group-hover:bg-[#fad1d8]'
                  }`}
                >
                  <stat.icon
                    className={`w-6 h-6 ${
                      stat.color === 'blue'
                        ? 'text-blue-600'
                        : stat.color === 'green'
                        ? 'text-green-600'
                        : stat.color === 'purple'
                        ? 'text-purple-600'
                        : 'text-[#8b1538]'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-lg ${
                    stat.change.startsWith('+')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-[#fce7eb] text-[#72112e]'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{stat.label}</p>
              <p className="text-3xl text-gray-900 group-hover:text-4xl transition-all" style={{ fontWeight: 700 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Weekly Growth Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-base text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                نمو التسجيل الأسبوعي
              </h3>
              <p className="text-xs text-gray-500">نمو المشاركين عبر الأسابيع</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-base text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                التوزيع الجغرافي للمشاركين
              </h3>
              <p className="text-xs text-gray-500">توزيع المشاركين حسب المدن الرئيسية</p>
            </div>
            <div className="space-y-4">
              {geoDistributionData.map((item, index) => {
                const maxValue = Math.max(...geoDistributionData.map((d) => d.participants));
                const percentage = (item.participants / maxValue) * 100;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
                        {item.city}
                      </span>
                      <span className="text-sm text-gray-500">{item.participants}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Track Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-base text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                المشتركون حسب المسار
              </h3>
              <p className="text-xs text-gray-500">نسبة المشاركين في كل مسار</p>
            </div>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={trackDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {trackDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {trackDistributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Time Registration */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-base text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                معدل التسجيل الزمني
              </h3>
              <p className="text-xs text-gray-500">التسجيلات حسب الوقت في اليوم</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeRegistrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-base text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                ملخص للفرق الأعلى
              </h3>
              <p className="text-xs text-gray-500">أبرز الفرق المشاركة</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-900" style={{ fontWeight: 600 }}>
                    فرق مؤهلة
                  </span>
                </div>
                <span className="text-lg text-blue-900" style={{ fontWeight: 700 }}>
                  240
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-900" style={{ fontWeight: 600 }}>
                    فرق قيد التقييم
                  </span>
                </div>
                <span className="text-lg text-purple-900" style={{ fontWeight: 700 }}>
                  124
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-900" style={{ fontWeight: 600 }}>
                    فرق فائزة
                  </span>
                </div>
                <span className="text-lg text-green-900" style={{ fontWeight: 700 }}>
                  18
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Teams Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  أفضل 3 فرق حسب تقييم لجنة التحكيم
                </h3>
                <p className="text-xs text-gray-500">الفرق الحاصلة على أعلى التقييمات</p>
              </div>
              <Link
                to={`/admin/hackathon/${id}/projects`}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                style={{ fontWeight: 600 }}
              >
                عرض الكل ←
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                    الترتيب
                  </th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                    اسم الفريق
                  </th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                    المسار
                  </th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                    الفئة
                  </th>
                  <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                    النتيجة
                  </th>
                </tr>
              </thead>
              <tbody>
                {topTeams.map((team) => (
                  <tr key={team.rank} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${team.color}`}
                      >
                        <span className="text-sm" style={{ fontWeight: 700 }}>
                          {team.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                        {team.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{team.track}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs ${
                          team.status === 'نشط'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {team.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                        {team.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}