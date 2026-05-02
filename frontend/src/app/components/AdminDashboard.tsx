import { Link } from 'react-router';
import { 
  LayoutGrid, 
  Sparkles, 
  BarChart3,
  Settings,
  ChevronLeft,
  Calendar,
  CheckSquare,
  Users,
  Target,
  Award,
  ClipboardList,
  Zap,
  TrendingUp
} from 'lucide-react';

export function AdminDashboard() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Soft gradient blobs - مموهة */}
          <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
            {/* Top left blob - أحمر */}
            <div 
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.4) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Top right blob - ذهبي */}
            <div 
              className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.4) 0%, rgba(250, 187, 91, 0.25) 50%, transparent 70%)' }}
            ></div>
            
            {/* Center blob - أحمر وذهبي مدمج */}
            <div 
              className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.3) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Bottom left blob - ذهبي */}
            <div 
              className="absolute -bottom-20 -left-20 w-[550px] h-[550px] rounded-full opacity-28 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.35) 0%, rgba(250, 187, 91, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Bottom right blob - أحمر */}
            <div 
              className="absolute -bottom-28 -right-28 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.35) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Small accent blob - مزيج أحمر وذهبي */}
            <div 
              className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full opacity-22 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.3) 0%, rgba(250, 187, 91, 0.15) 50%, transparent 70%)' }}
            ></div>
          </div>

          {/* Simple curved lines - like the reference image */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            {/* Gentle wave lines */}
            <path 
              d="M 0 200 Q 200 180, 400 200 T 800 200 T 1200 200 T 1600 200" 
              stroke="#e3565410" 
              strokeWidth="2" 
              fill="none" 
            />
            <path 
              d="M 0 220 Q 200 200, 400 220 T 800 220 T 1200 220 T 1600 220" 
              stroke="#00bcd415" 
              strokeWidth="2" 
              fill="none" 
            />
            <path 
              d="M 0 240 Q 200 220, 400 240 T 800 240 T 1200 240 T 1600 240" 
              stroke="#8b5cf610" 
              strokeWidth="2" 
              fill="none" 
            />
            
            {/* Right side waves */}
            <path 
              d="M 900 100 Q 950 150, 1000 100 T 1200 100" 
              stroke="#e3565412" 
              strokeWidth="1.5" 
              fill="none" 
            />
            <path 
              d="M 920 120 Q 970 170, 1020 120 T 1220 120" 
              stroke="#00bcd418" 
              strokeWidth="1.5" 
              fill="none" 
            />
          </svg>

          {/* Small decorative shapes - scattered */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {/* Small circles */}
            <div className="absolute top-20 left-32 w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
            <div className="absolute top-40 right-48 w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
            <div className="absolute bottom-32 left-48 w-2.5 h-2.5 bg-green-400 rounded-full opacity-70"></div>
            <div className="absolute bottom-48 right-32 w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
            <div className="absolute top-1/2 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
            <div className="absolute top-1/3 right-20 w-2 h-2 bg-cyan-300 rounded-full opacity-50"></div>
            
            {/* Small squares and diamonds */}
            <div className="absolute top-24 left-1/4 w-4 h-4 bg-orange-400 opacity-70 transform rotate-45"></div>
            <div className="absolute top-56 right-1/4 w-3 h-3 bg-yellow-400 opacity-60"></div>
            <div className="absolute bottom-40 left-1/3 w-3.5 h-3.5 bg-cyan-400 opacity-70 transform rotate-12"></div>
            <div className="absolute bottom-56 right-1/3 w-4 h-4 bg-green-400 opacity-60 transform rotate-45"></div>
            
            {/* Diamond shapes with border */}
            <div className="absolute top-32 right-56 w-6 h-6 border-2 border-cyan-400 opacity-60 transform rotate-45"></div>
            <div className="absolute bottom-36 left-64 w-7 h-7 border-2 border-green-400 opacity-50 transform rotate-45"></div>
          </div>

          {/* Floating Icons */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {/* Top Right - Calendar */}
            <div className="absolute top-20 right-32 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>

            {/* Top Left - CheckSquare */}
            <div className="absolute top-32 left-24 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>

            {/* Middle Right - Users */}
            <div className="absolute top-1/2 right-16 w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
              <Users className="w-7 h-7 text-purple-600" />
            </div>

            {/* Middle Left - Target */}
            <div className="absolute top-1/3 left-16 w-11 h-11 bg-orange-100 rounded-lg flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3s' }}>
              <Target className="w-6 h-6 text-orange-600" />
            </div>

            {/* Bottom Right - Award */}
            <div className="absolute bottom-24 right-28 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 5.5s ease-in-out infinite 1.5s' }}>
              <Award className="w-5 h-5 text-yellow-600" />
            </div>

            {/* Bottom Left - ClipboardList */}
            <div className="absolute bottom-32 left-20 w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6.5s ease-in-out infinite 2.5s' }}>
              <ClipboardList className="w-6 h-6 text-cyan-600" />
            </div>

            {/* Center Top - Zap */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center animate-float" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}>
              <Zap className="w-4 h-4 text-pink-600" />
            </div>

            {/* Bottom Center - TrendingUp */}
            <div className="absolute bottom-20 left-1/3 w-9 h-9 bg-[#fce7eb] rounded-lg flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3.5s' }}>
              <TrendingUp className="w-5 h-5 text-[#e35654]" />
            </div>

            {/* Top Center Right - Settings */}
            <div className="absolute top-24 right-1/3 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 7s ease-in-out infinite 4s' }}>
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          {/* Content */}
          <div className="relative text-center max-w-3xl mx-auto" style={{ zIndex: 2 }}>
            <h1 className="text-5xl text-gray-900 mb-6 leading-tight" style={{ fontWeight: 700 }}>
              ابدأ رحلتك في تنظيم الهاكاثونات<br />
              <span className="text-[#e35654]">بسهولة</span>
            </h1>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              أدوات متكاملة لإدارة تفاصيل الهاكاثونات من التخطيط إلى التنفيذ،<br />
              صممت خصيصاً لمساعدتك على النجاح.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link 
                to="/admin/create-hackathon" 
                className="px-10 py-4 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/30 transition-all hover:shadow-xl hover:-translate-y-0.5" 
                style={{ fontWeight: 600 }}
              >
                أطلق هاكاثونك الآن
              </Link>
              <Link 
                to="/admin/my-hackathons" 
                className="px-10 py-4 rounded-xl bg-white text-gray-700 border-2 border-gray-200 hover:border-[#e35654] hover:text-[#e35654] hover:bg-[#fef2f4] transition-all hover:-translate-y-0.5" 
                style={{ fontWeight: 600 }}
              >
                استعرض هاكاثونات سابقة
              </Link>
            </div>
          </div>
        </div>

        {/* Add keyframes for floating animation */}
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }
        `}</style>
      </section>

      {/* Quick Services */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>الخدمات السريعة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Service Card 1 */}
            <Link to="/admin/my-hackathons" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#e35654] transition-all cursor-pointer block">
              <div className="w-14 h-14 rounded-xl bg-[#fef2f4] flex items-center justify-center mb-4">
                <LayoutGrid className="w-6 h-6 text-[#e35654]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>إدارة هاكاثوناتي</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                تابع وحرر وأدر جميع الهاكاثونات الخاصة بك بدقة وعناية تامة للمشاركين.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                عرض الهاكاثونات
              </span>
            </Link>

            {/* Service Card 2 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#00bcd4] transition-all cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#00bcd4]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>إنشاء هاكاثون جديد</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                أنشئ أول فعالية خاصة لك أو أطلق فعالية جديدة في وقت قريب واجذب الموهوبين.
              </p>
              <Link to="/admin/create-hackathon" className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all flex items-center justify-center" style={{ fontWeight: 600 }}>
                إنشاء الآن
              </Link>
            </div>

            {/* Service Card 3 */}
            <Link to="/admin/analytics" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-green-400 transition-all cursor-pointer block">
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>الإحصائيات والتقارير</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                تتبع تحليلات المشاركين الشاملة وتقارير الأداء والنتائج بدقة ووضوح.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                عرض التقارير
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Hackathons */}
      <section className="pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>هاكاثوناتك الأخيرة</h2>
            <Link to="/admin/my-hackathons" className="flex items-center gap-1 text-[#00bcd4] text-sm hover:gap-2 transition-all" style={{ fontWeight: 600 }}>
              <ChevronLeft className="w-4 h-4" />
              عرض الكل
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Hackathon Card 1 - نشط */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg transition-all">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs mb-2" style={{ fontWeight: 600 }}>
                  نشط
                </span>
                <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
                  هاكاثون الابتكار الاستدامة والبيئة
                </h3>
              </div>
              <p className="text-gray-400 text-xs mb-4">آخر تحديث منذ يوم</p>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-600 text-sm" style={{ fontWeight: 600 }}>المرحلة الثانية</span>
                  <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>100%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                </div>
              </div>

              <Link 
                to="/admin/hackathon/2"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-100 text-gray-700 text-sm hover:bg-gray-50 hover:border-gray-200 transition-all" 
                style={{ fontWeight: 600 }}
              >
                <Settings className="w-4 h-4" />
                إدارة
              </Link>
            </div>

            {/* Hackathon Card 2 - مسودة */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg transition-all">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs mb-2" style={{ fontWeight: 600 }}>
                  مسودة
                </span>
                <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
                  تحدي الأمن السيبراني
                </h3>
              </div>
              <p className="text-gray-400 text-xs mb-4">آخر تحديث منذ أسبوع</p>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-600 text-sm" style={{ fontWeight: 600 }}>المرحلة الأولى</span>
                  <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>30%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-500 rounded-full transition-all duration-500" style={{ width: '30%' }}></div>
                </div>
              </div>

              <Link 
                to="/admin/create-hackathon/1"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-100 text-gray-700 text-sm hover:bg-gray-50 hover:border-gray-200 transition-all" 
                style={{ fontWeight: 600 }}
              >
                <Settings className="w-4 h-4" />
                تعديل المسودة
              </Link>
            </div>

            {/* Hackathon Card 3 - قيد التنفيذ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg transition-all">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-cyan-50 text-[#00bcd4] text-xs mb-2" style={{ fontWeight: 600 }}>
                  قيد التنفيذ
                </span>
                <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
                  هاكاثون لقاء الإبداع الطلابي 2024
                </h3>
              </div>
              <p className="text-gray-400 text-xs mb-4">آخر تحديث منذ ساعتين</p>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-600 text-sm" style={{ fontWeight: 600 }}>المرحلة الثالثة</span>
                  <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>75%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00bcd4] rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                </div>
              </div>

              <Link 
                to="/admin/hackathon/3"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-100 text-gray-700 text-sm hover:bg-gray-50 hover:border-gray-200 transition-all" 
                style={{ fontWeight: 600 }}
              >
                <Settings className="w-4 h-4" />
                إدارة
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}