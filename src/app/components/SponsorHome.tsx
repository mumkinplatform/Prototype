import { useNavigate } from "react-router";
import { useState } from "react";
import {
  Handshake,
  FileText,
  CreditCard,
  MessageCircle,
  BarChart3,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Building2,
  GraduationCap,
  Share2,
  EyeOff,
  TrendingUp,
  Award,
  DollarSign,
  Rocket,
  Target,
  Star,
  Zap
} from "lucide-react";

const activities = [
  {
    icon: CheckCircle2,
    color: "#10b981",
    bg: "#f0fdf4",
    title: "تم رفع نسخة العقد الموقعة",
    sub: "هاكاثون الرياض التقني",
    time: "منذ ساعتين",
  },
  {
    icon: CreditCard,
    color: "#f59e0b",
    bg: "#fffbeb",
    title: "تأكيد استلام الدفعة الأولى",
    sub: "هاكاثون الذكاء الاصطناعي للمستقبل",
    time: "أمس 4:15 م",
  },
  {
    icon: MessageCircle,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    title: "رسالة جديدة من TechVision",
    sub: "استفسار حول باقة الرعاية البلاتينية",
    time: "أمس 1:00 ص",
  },
  {
    icon: AlertCircle,
    color: "#e35654",
    bg: "#fef2f2",
    title: "تحديث في متطلبات الرعاية",
    sub: "هاكاثون الطاقة المتجددة",
    time: "منذ أسبوع",
  },
];

const currentSponsorships = [
  {
    name: "هاكاثون الذكاء الاصطناعي 2024",
    package: "ماسي",
    packageColor: "#06b6d4",
    status: "مكتمل",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    progress: 75,
    date: "15 - 18 أكتوبر 2024",
  },
  {
    name: "قمة الأمن السيبراني",
    package: "فضي",
    packageColor: "#6b7280",
    status: "نشط",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    progress: 40,
    date: "5 - 7 ديسمبر 2024",
  },
  {
    name: "هاكاثون الطاقة المتجددة",
    package: "برونزي",
    packageColor: "#b45309",
    status: "انتظار الباقة",
    statusColor: "#f59e0b",
    statusBg: "#fffbeb",
    progress: 15,
    date: "20 - 22 نوفمبر 2024",
  },
];

export function SponsorHome() {
  const navigate = useNavigate();
  const [showInsightsOnProfile, setShowInsightsOnProfile] = useState(false);

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
              stroke="#fabb5b15" 
              strokeWidth="2" 
              fill="none" 
            />
            <path 
              d="M 0 240 Q 200 220, 400 240 T 800 240 T 1200 240 T 1600 240" 
              stroke="#10b98110" 
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
              stroke="#fabb5b18" 
              strokeWidth="1.5" 
              fill="none" 
            />
          </svg>

          {/* Small decorative shapes - scattered */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {/* Small circles */}
            <div className="absolute top-20 left-32 w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
            <div className="absolute top-40 right-48 w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
            <div className="absolute bottom-32 left-48 w-2.5 h-2.5 bg-blue-400 rounded-full opacity-70"></div>
            <div className="absolute bottom-48 right-32 w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
            <div className="absolute top-1/2 left-20 w-2 h-2 bg-purple-400 rounded-full opacity-50"></div>
            <div className="absolute top-1/3 right-20 w-2 h-2 bg-pink-300 rounded-full opacity-50"></div>
            
            {/* Small squares and diamonds */}
            <div className="absolute top-24 left-1/4 w-4 h-4 bg-orange-400 opacity-70 transform rotate-45"></div>
            <div className="absolute top-56 right-1/4 w-3 h-3 bg-yellow-400 opacity-60"></div>
            <div className="absolute bottom-40 left-1/3 w-3.5 h-3.5 bg-blue-400 opacity-70 transform rotate-12"></div>
            <div className="absolute bottom-56 right-1/3 w-4 h-4 bg-green-400 opacity-60 transform rotate-45"></div>
            
            {/* Diamond shapes with border */}
            <div className="absolute top-32 right-56 w-6 h-6 border-2 border-purple-400 opacity-60 transform rotate-45"></div>
            <div className="absolute bottom-36 left-64 w-7 h-7 border-2 border-green-400 opacity-50 transform rotate-45"></div>
          </div>

          {/* Floating Icons - أيقونات الرعاية والاستثمار */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {/* Top Right - Handshake (رعاية) */}
            <div className="absolute top-20 right-32 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <Handshake className="w-6 h-6 text-blue-600" />
            </div>

            {/* Top Left - DollarSign (استثمار) */}
            <div className="absolute top-32 left-24 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>

            {/* Middle Right - Building2 (شركات) */}
            <div className="absolute top-1/2 right-16 w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
              <Building2 className="w-7 h-7 text-purple-600" />
            </div>

            {/* Middle Left - Target (أهداف) */}
            <div className="absolute top-1/3 left-16 w-11 h-11 bg-orange-100 rounded-lg flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3s' }}>
              <Target className="w-6 h-6 text-orange-600" />
            </div>

            {/* Bottom Right - Award (جوائز) */}
            <div className="absolute bottom-24 right-28 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 5.5s ease-in-out infinite 1.5s' }}>
              <Award className="w-5 h-5 text-yellow-600" />
            </div>

            {/* Bottom Left - BarChart3 (تحليلات) */}
            <div className="absolute bottom-32 left-20 w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6.5s ease-in-out infinite 2.5s' }}>
              <BarChart3 className="w-6 h-6 text-cyan-600" />
            </div>

            {/* Center Top - Star (تميز) */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center animate-float" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}>
              <Star className="w-4 h-4 text-pink-600" />
            </div>

            {/* Bottom Center - TrendingUp (نمو) */}
            <div className="absolute bottom-20 left-1/3 w-9 h-9 bg-[#fce7eb] rounded-lg flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3.5s' }}>
              <TrendingUp className="w-5 h-5 text-[#e35654]" />
            </div>

            {/* Top Center Right - Rocket (انطلاق) */}
            <div className="absolute top-24 right-1/3 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 7s ease-in-out infinite 4s' }}>
              <Rocket className="w-5 h-5 text-indigo-600" />
            </div>

            {/* Extra - Zap (طاقة/تأثير) */}
            <div className="absolute top-1/4 left-1/4 w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 6.5s ease-in-out infinite 2s' }}>
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
          </div>

          {/* Content */}
          <div className="relative text-center max-w-3xl mx-auto" style={{ zIndex: 2 }}>
            <h1 className="text-5xl text-gray-900 mb-6 leading-tight" style={{ fontWeight: 700 }}>
              ادعم الابتكار،<br />
              <span className="text-[#e35654]">واصنع الفرق</span>
            </h1>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              انضم إلى منظومة الهاكاثونات السعودية وكن جزءًا من بناء جيل المبتكرين.<br />
              استثمر علامتك التجارية أمام أفضل المواهب التقنية.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => navigate("/sponsor/opportunities")}
                className="px-10 py-4 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/30 transition-all hover:shadow-xl hover:-translate-y-0.5" 
                style={{ fontWeight: 600 }}
              >
                استكشف فرص الرعاية
              </button>
              <button 
                onClick={() => navigate("/sponsor/sponsorships")}
                className="px-10 py-4 rounded-xl bg-white text-gray-700 border-2 border-gray-200 hover:border-[#e35654] hover:text-[#e35654] hover:bg-[#fef2f4] transition-all hover:-translate-y-0.5" 
                style={{ fontWeight: 600 }}
              >
                رعاياتي الحالية
              </button>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Service Card 1 - رعاياتي */}
            <button
              onClick={() => navigate("/sponsor/sponsorships")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#e35654] transition-all cursor-pointer text-right"
            >
              <div className="w-14 h-14 rounded-xl bg-[#fef2f4] flex items-center justify-center mb-4">
                <Handshake className="w-6 h-6 text-[#e35654]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>رعاياتي</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                إدارة رعاياتك الحالية ومتابعة حالتها وتفاصيلها بشكل دقيق.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                عرض الرعايات
              </span>
            </button>

            {/* Service Card 2 - فرص الرعاية */}
            <button
              onClick={() => navigate("/sponsor/opportunities")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#00bcd4] transition-all cursor-pointer text-right"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-[#00bcd4]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>فرص الرعاية</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                استكشف هاكاثونات جديدة واختر الفرص المناسبة لعلامتك التجارية.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                استكشاف
              </span>
            </button>

            {/* Service Card 3 - المدفوعات */}
            <button
              onClick={() => navigate("/sponsor/payments")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-green-400 transition-all cursor-pointer text-right"
            >
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>المدفوعات</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                تتبع الفواتير والمستحقات المالية لجميع الرعايات بسهولة.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                عرض المدفوعات
              </span>
            </button>

            {/* Service Card 4 - الرسائل */}
            <button
              onClick={() => navigate("/sponsor/messages")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-purple-400 transition-all cursor-pointer text-right"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>الرسائل</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                تواصل مباشرة مع منظمي الهاكاثونات وتابع المحادثات.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                فتح الرسائل
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Sponsorship Insights */}
      <section className="pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            {/* Header with toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#fef2f2] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#e35654]" />
                </div>
                <div>
                  <p className="text-gray-800 text-sm" style={{ fontWeight: 700 }}>نظرة على رعاياتك</p>
                  <p className="text-gray-400" style={{ fontSize: "0.68rem" }}>توزيع الرعايات حسب الجهات والمدن</p>
                </div>
              </div>
              <button
                onClick={() => setShowInsightsOnProfile(!showInsightsOnProfile)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all"
                style={{
                  fontWeight: 600,
                  background: showInsightsOnProfile ? "#f0fdf4" : "#f9fafb",
                  borderColor: showInsightsOnProfile ? "#a7f3d0" : "#e5e7eb",
                  color: showInsightsOnProfile ? "#10b981" : "#6b7280",
                }}
              >
                {showInsightsOnProfile ? (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    ظاهر في ملفك
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    مخفي من ملفك
                  </>
                )}
              </button>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Top Companies */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-[#6366f1]" />
                  <p className="text-gray-600 text-xs" style={{ fontWeight: 600 }}>أكثر الشركات تعاونًا</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "TechVision", count: 3, pct: 75 },
                    { name: "مؤسسة نيوم", count: 2, pct: 50 },
                    { name: "STC Solutions", count: 1, pct: 25 },
                  ].map((c, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-700" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{c.name}</span>
                        <span className="text-gray-400" style={{ fontSize: "0.65rem" }}>{c.count} رعايات</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${c.pct}%`, background: "#6366f1" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Universities */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <GraduationCap className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <p className="text-gray-600 text-xs" style={{ fontWeight: 600 }}>أكثر الجامعات تعاونًا</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "جامعة الملك سعود", count: 2, pct: 65 },
                    { name: "جامعة الأميرة نورة", count: 2, pct: 65 },
                    { name: "جامعة الملك فهد", count: 1, pct: 30 },
                  ].map((u, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-700" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{u.name}</span>
                        <span className="text-gray-400" style={{ fontSize: "0.65rem" }}>{u.count} هاكاثون</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${u.pct}%`, background: "#f59e0b" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Cities */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[#10b981]" />
                  <p className="text-gray-600 text-xs" style={{ fontWeight: 600 }}>المدن الأكثر نشاطًا</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "الرياض", count: 5, pct: 80 },
                    { name: "جدة", count: 2, pct: 40 },
                    { name: "الدمام", count: 1, pct: 20 },
                  ].map((city, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-700" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{city.name}</span>
                        <span className="text-gray-400" style={{ fontSize: "0.65rem" }}>{city.count} رعايات</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${city.pct}%`, background: "#10b981" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visibility Note */}
            <p className="text-gray-400 mt-3 text-center" style={{ fontSize: "0.65rem" }}>
              {showInsightsOnProfile
                ? "هذه البيانات ظاهرة حاليًا في ملفك الشخصي — يمكن للمنظمين رؤيتها"
                : "هذه البيانات مخفية من ملفك الشخصي — لن يراها أحد غيرك"}
            </p>
          </div>
        </div>
      </section>

    </>
  );
}