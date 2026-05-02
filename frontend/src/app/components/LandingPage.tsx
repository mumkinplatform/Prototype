import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  Handshake,
  Users,
  Star,
  ChevronLeft,
  CheckCircle,
  Target,
  Heart,
  Zap,
  LayoutDashboard,
  Megaphone,
  FileCheck,
  Layers,
  Globe,
  Shield,
  UserCheck,
} from "lucide-react";
 
const TESTIMONIAL_1 = "https://images.unsplash.com/photo-1662686439618-12cfd337c067?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXVkaSUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzMwNTU1NjV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const TESTIMONIAL_2 = "https://images.unsplash.com/photo-1756412066323-a336d2becc10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXVkaSUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMGRldmVsb3BlcnxlbnwxfHx8fDE3NzMwNTU1NjV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const TESTIMONIAL_3 = "https://images.unsplash.com/photo-1663518629510-016989dc4ee3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWRkbGUlMjBlYXN0ZXJuJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzczMDU1NTY1fDA&ixlib=rb-4.1.0&q=80&w=1080";
 
const testimonials = [
  {
    name: "سلمى العتيبي",
    role: "منظمة هاكاثونات",
    text: "منصة مُمكّن سهلت علينا إدارة الهاكاثون بالكامل من الت��جيل وحتى إعلان النتج.",
    image: TESTIMONIAL_1,
  },
  {
    name: "محمد القحطاني",
    role: "مشارك في هاكاثون",
    text: "ميزة تكوين الفرق بالذكاء الاصطناعي كانت رائعة! وجدت فريقي المثالي في دقائق.",
    image: TESTIMONIAL_2,
  },
  {
    name: "نورة الشمري",
    role: "راعية فعاليات",
    text: "منصة احترافية وفّرت علينا الكثير من الوقت في التواصل مع المنظمين.",
    image: TESTIMONIAL_3,
  },
];
 
export function LandingPage() {
  const navigate = useNavigate();
 
  return (
    <div dir="rtl" className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-28 lg:pb-40">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-rose-50 via-rose-100 to-fuchsia-50 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/80" />
        
        {/* Blob Shapes */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#e35654]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl text-gray-900 mb-6 leading-tight" style={{ fontWeight: 800 }}>
                مُمكّن
                <br />
                <span className="text-[#e35654]">نبتكر لِنُمَكِّن</span>
              </h1>
 
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                منصة تدعم الابتكار عبر إدارة الهاكاثونات بطريقة مرنة وقابلة للتخصيص
              </p>
 
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate("/auth")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/30 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  ابدأ الآن
                </button>
              </div>
            </motion.div>
 
            {/* Right Content - Floating Cards */}
            <motion.div 
              className="relative h-[600px] hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Card 1 - Top Right */}
              <div 
                className="absolute top-0 right-0 w-72 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100"
                style={{ 
                  transform: "rotate(8deg)",
                  animation: "float 6s ease-in-out infinite"
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>هاكاثون NEOM 2025</h3>
                  <Heart className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  تحدي تقني شامل يهدف إلى ابتكار حلول مستدامة للمدن الذكية
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#e35654]" />
                  <span className="text-xs text-gray-600">340 مشارك</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs" style={{ fontWeight: 600 }}>مفتوح</span>
                  <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs" style={{ fontWeight: 600 }}>عن بُعد</span>
                </div>
              </div>
 
              {/* Card 2 - Middle Left */}
              <div 
                className="absolute top-32 left-0 w-64 bg-[#e35654] rounded-2xl shadow-2xl p-5 text-white"
                style={{ 
                  transform: "rotate(-6deg)",
                  animation: "float 7s ease-in-out infinite 1s"
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 700 }}>Smart Matching</p>
                    <p className="text-xs text-white/80">فريقك المثالي</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-white/30" />
                    <div className="flex-1">
                      <div className="h-2 bg-white/40 rounded-full w-3/4 mb-1" />
                      <div className="h-2 bg-white/30 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="text-xs text-white/70">تطابق 95%</div>
                </div>
              </div>
 
              {/* Card 3 - Bottom Right */}
              <div 
                className="absolute bottom-24 right-12 w-56 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                style={{ 
                  transform: "rotate(4deg)",
                  animation: "float 8s ease-in-out infinite 2s"
                }}
              >
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-900" style={{ fontWeight: 600 }}>مشروع مُسلَّم</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">الكود المصدري</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">العرض التقديمي</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">فيديو توضيحي</span>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Small Floating Elements */}
              <div 
                className="absolute top-40 right-64 w-12 h-12 rounded-xl bg-blue-500 shadow-lg flex items-center justify-center"
                style={{ animation: "float 5s ease-in-out infinite 3s" }}
              >
                <Trophy className="w-6 h-6 text-white" />
              </div>
 
              <div 
                className="absolute bottom-32 left-48 w-10 h-10 rounded-full bg-orange-400 shadow-lg"
                style={{ animation: "float 6s ease-in-out infinite 1.5s" }}
              />
 
              {/* Why Participate Card */}
              <div
                className="absolute bottom-0 left-0 w-60 bg-[#e35654] rounded-2xl shadow-2xl p-4 text-white"
                style={{
                  transform: "rotate(-3deg)",
                  animation: "float 9s ease-in-out infinite 0.5s"
                }}
              >
                <h3 className="mb-2.5 flex items-center gap-1.5 text-sm" style={{ fontWeight: 700 }}>
                  🚀 لماذا تشارك؟
                </h3>
                <ul className="space-y-1.5 text-xs text-white/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 flex-shrink-0 text-white" />
                    جوائز تصل لـ 120,000 ر.س
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 flex-shrink-0 text-white" />
                    تواصل مع 350+ مشارك متميز
                  </li>
                  <li className="flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3 flex-shrink-0 text-white" />
                    شهادة مشاركة رسمية
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 flex-shrink-0 text-white" />
                    فرص توظيف وشراكات مع الرعاة
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
 
        {/* CSS Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(var(--rotate, 0deg)); }
            50% { transform: translateY(-25px) rotate(var(--rotate, 0deg)); }
          }
        `}</style>
      </section>
 
      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-rose-50/50 via-white to-fuchsia-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
              لماذا مُمكّن؟
            </h2>
          </div>
 
          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto items-start">
            {/* Card 1 - Unified Platform */}
            <motion.div 
              className="relative group h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-white to-fuchsia-50/40 rounded-3xl transform transition-transform group-hover:scale-[1.02]" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-100/50 h-full flex flex-col">
                {/* Website Mockup */}
                <div className="mb-4 flex-shrink-0" style={{ height: '180px' }}>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-3 border border-gray-200/50 shadow-md h-full flex flex-col">
                    {/* Browser Bar */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300/50 flex-shrink-0">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#e35654]" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-500">
                        mumkin.platform
                      </div>
                    </div>
                    
                    {/* Website Content */}
                    <div className="bg-white rounded-lg p-3 space-y-2 flex-grow">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 bg-[#e35654] rounded w-16" />
                        <div className="flex gap-2">
                          <div className="h-2 bg-gray-200 rounded w-12" />
                          <div className="h-2 bg-gray-200 rounded w-12" />
                          <div className="h-2 bg-gray-200 rounded w-12" />
                        </div>
                      </div>
                      
                      {/* User Sections */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded p-2 border border-green-100">
                          <div className="w-5 h-5 rounded bg-green-500 mb-1 mx-auto flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                          </div>
                          <div className="h-1 bg-green-200 rounded w-full mb-1" />
                          <div className="h-1 bg-green-100 rounded w-3/4" />
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded p-2 border border-orange-100">
                          <div className="w-5 h-5 rounded bg-orange-500 mb-1 mx-auto flex items-center justify-center">
                            <Handshake className="w-3 h-3 text-white" />
                          </div>
                          <div className="h-1 bg-orange-200 rounded w-full mb-1" />
                          <div className="h-1 bg-orange-100 rounded w-3/4" />
                        </div>
                        
                        <div className="bg-gradient-to-br from-rose-50 to-fuchsia-50 rounded p-2 border border-rose-200">
                          <div className="w-5 h-5 rounded bg-[#e35654] mb-1 mx-auto flex items-center justify-center">
                            <LayoutDashboard className="w-3 h-3 text-white" />
                          </div>
                          <div className="h-1 bg-[#ff6b6b] rounded w-full mb-1" />
                          <div className="h-1 bg-[#d4547a] rounded w-3/4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Title */}
                <h3 className="text-xl text-gray-900 mb-2 flex-shrink-0" style={{ fontWeight: 700 }}>
                  <span className="text-[#e35654]">منصة واحدة</span> لكل الهاكاثونات
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  بدل التنقل بين منصات مختلفة والتسجيل المتكرر، تجمع مُمكّن المشاركين والمنظمين والرعاة في نظام واحد لإدارة الهاكاثونات من البداية حتى إعلان النتائج.
                </p>
              </div>
            </motion.div>
 
            {/* Card 2 - Organizers/Timeline */}
            <motion.div 
              className="relative group h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-white to-fuchsia-100/40 rounded-3xl transform transition-transform group-hover:scale-[1.02]" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-100/50 h-full flex flex-col">
                {/* Timeline Diagram */}
                <div className="mb-4 bg-gradient-to-br from-orange-50/60 via-pink-50/40 to-white rounded-2xl p-6 shadow-sm flex-shrink-0" style={{ height: '180px' }}>
                  <div className="relative h-full flex items-center justify-center">
                    {/* Horizontal Dashed Line */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed border-gray-300" />
                    
                    {/* Timeline Steps */}
                    <div className="relative flex items-center justify-between w-full max-w-md">
                      {/* Step 1 - Customization */}
                      <div className="flex flex-col items-center gap-3 z-10">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e35654] to-[#ff6b6b] shadow-lg flex items-center justify-center border-4 border-white">
                          <span className="text-white text-sm" style={{ fontWeight: 700 }}>1</span>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight max-w-[80px]" style={{ fontWeight: 600 }}>التخصيص والهوية البصرية</span>
                      </div>
 
                      {/* Step 2 - Registration */}
                      <div className="flex flex-col items-center gap-3 z-10">
                        <div className="w-14 h-14 rounded-full border-4 border-[#e35654] bg-white shadow-md flex items-center justify-center">
                          <span className="text-[#e35654] text-sm" style={{ fontWeight: 700 }}>2</span>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight max-w-[80px]" style={{ fontWeight: 600 }}>إدارة القبول والتسجيل</span>
                      </div>
 
                      {/* Step 3 - Evaluation */}
                      <div className="flex flex-col items-center gap-3 z-10">
                        <div className="w-14 h-14 rounded-full border-4 border-gray-200 bg-white shadow-sm flex items-center justify-center">
                          <span className="text-gray-400 text-sm" style={{ fontWeight: 700 }}>3</span>
                        </div>
                        <span className="text-[10px] text-gray-500 text-center leading-tight max-w-[80px]" style={{ fontWeight: 600 }}>إدارة التقييمات</span>
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Title */}
                <h3 className="text-xl text-gray-900 mb-2 flex-shrink-0" style={{ fontWeight: 700 }}>
                  تنظيم هاكاثونات <span className="text-[#e35654]">بسهولة</span>
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  توفر مُمكّن أدوات متكاملة للمنظمين لتصميم وإدارة الهاكاثونات حسب احتياجاتهم، من التسجيل وتكوين الفرق إلى تقييم المشاريع وإعلان الفائزين.
                </p>
              </div>
            </motion.div>
 
            {/* Card 3 - Participants/Target */}
            <motion.div 
              className="relative group h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-white to-fuchsia-100/40 rounded-3xl transform transition-transform group-hover:scale-[1.02]" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-100/50 h-full flex flex-col">
                {/* Integration Hub Diagram */}
                <div className="mb-4 flex justify-center items-center flex-shrink-0" style={{ height: '180px' }}>
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0" style={{
                      backgroundImage: `
                        linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                      opacity: 0.3
                    }} />
                    
                    <div className="relative h-full flex items-center justify-center">
                      {/* Center Circle - Main Hub */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl flex items-center justify-center border-4 border-white">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                      </div>
 
                      {/* Connecting Lines - z-15 to be between center and outer circles */}
                      {/* Top Right Line to Team Formation */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
                        <line x1="50%" y1="50%" x2="calc(100% - 60px)" y2="30px" stroke="url(#gradient1)" strokeWidth="2" strokeDasharray="6 4" />
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#93c5fd" />
                            <stop offset="100%" stopColor="#60a5fa" />
                          </linearGradient>
                        </defs>
                      </svg>
 
                      {/* Right Line to Registration */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
                        <line x1="50%" y1="50%" x2="calc(100% - 25px)" y2="50%" stroke="url(#gradient2)" strokeWidth="2" strokeDasharray="6 4" />
                        <defs>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#93c5fd" />
                            <stop offset="100%" stopColor="#60a5fa" />
                          </linearGradient>
                        </defs>
                      </svg>
 
                      {/* Bottom Right Line to Upload */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
                        <line x1="50%" y1="50%" x2="calc(100% - 60px)" y2="calc(100% - 30px)" stroke="url(#gradient3)" strokeWidth="2" strokeDasharray="6 4" />
                        <defs>
                          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#93c5fd" />
                            <stop offset="100%" stopColor="#60a5fa" />
                          </linearGradient>
                        </defs>
                      </svg>
 
                      {/* Top Left Line to Profile */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
                        <line x1="50%" y1="50%" x2="40px" y2="40px" stroke="url(#gradient4)" strokeWidth="2" strokeDasharray="6 4" />
                        <defs>
                          <linearGradient id="gradient4" x1="100%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#93c5fd" />
                            <stop offset="100%" stopColor="#60a5fa" />
                          </linearGradient>
                        </defs>
                      </svg>
 
                      {/* Left Line to Workspace */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
                        <line x1="50%" y1="50%" x2="25px" y2="50%" stroke="url(#gradient5)" strokeWidth="2" strokeDasharray="6 4" />
                        <defs>
                          <linearGradient id="gradient5" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#93c5fd" />
                            <stop offset="100%" stopColor="#60a5fa" />
                          </linearGradient>
                        </defs>
                      </svg>
 
                      {/* Outer Circles */}
                      {/* Top Right - Team Formation */}
                      <div className="absolute top-4 right-8 z-20">
                        <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-blue-100">
                          <Users className="w-6 h-6 text-blue-500" />
                        </div>
                      </div>
 
                      {/* Right - Registration */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-2 z-20">
                        <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-green-100">
                          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
 
                      {/* Bottom Right - Upload Projects */}
                      <div className="absolute bottom-4 right-8 z-20">
                        <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-orange-100">
                          <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                      </div>
 
                      {/* Top Left - Profile */}
                      <div className="absolute top-6 left-6 z-20">
                        <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-purple-100">
                          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
 
                      {/* Left - Workspace */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-2 z-20">
                        <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-pink-100">
                          <LayoutDashboard className="w-5 h-5 text-pink-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Title */}
                <h3 className="text-xl text-gray-900 mb-2 flex-shrink-0" style={{ fontWeight: 700 }}>
                  تجربة <span className="text-[#e35654]">أفضل</span> للمشاركين
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  ��ستطيع المشاركون إنشاء ملف شخصي موحد، تكوين فرق بسهولة، والعمل داخل مساحة عمل تعاونية تساعدهم على تطوير مشاريعهم طوال الهاكاثون.
                </p>
              </div>
            </motion.div>
 
            {/* Card 4 - Sponsors */}
            <motion.div 
              className="relative group h-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-white to-fuchsia-50/40 rounded-3xl transform transition-transform group-hover:scale-[1.02]" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-100/50 h-full flex flex-col">
                {/* Search for Opportunities Illustration */}
                <div className="mb-4 bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-white rounded-2xl p-6 shadow-sm flex-shrink-0 relative overflow-hidden" style={{ height: '180px' }}>
                  {/* Background Cards */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Card 1 - Financial (Background) */}
                    <div className="absolute top-6 left-8 w-20 h-14 bg-white rounded-lg shadow-md border border-green-100 p-2 opacity-70">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mb-1">
                        <span className="text-white text-xs">💰</span>
                      </div>
                      <div className="h-1 bg-green-200 rounded w-10" />
                    </div>
 
                    {/* Card 2 - Technical (Background) */}
                    <div className="absolute top-4 right-6 w-20 h-14 bg-white rounded-lg shadow-md border border-blue-100 p-2 opacity-70">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mb-1">
                        <span className="text-white text-xs">💻</span>
                      </div>
                      <div className="h-1 bg-blue-200 rounded w-10" />
                    </div>
 
                    {/* Card 3 - Logistic (Background Bottom Left) */}
                    <div className="absolute bottom-8 left-10 w-20 h-14 bg-white rounded-lg shadow-md border border-orange-100 p-2 opacity-70">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center mb-1">
                        <span className="text-white text-xs">📦</span>
                      </div>
                      <div className="h-1 bg-orange-200 rounded w-10" />
                    </div>
 
                    {/* Card 4 - Hospitality (Background Bottom Right) */}
                    <div className="absolute bottom-6 right-12 w-20 h-14 bg-white rounded-lg shadow-md border border-pink-100 p-2 opacity-70">
                      <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center mb-1">
                        <span className="text-white text-xs">☕</span>
                      </div>
                      <div className="h-1 bg-pink-200 rounded w-10" />
                    </div>
 
                    {/* Featured Card - Centered and Highlighted */}
                    <div className="relative z-10 w-24 h-16 bg-white rounded-lg shadow-xl border-2 border-[#e35654] p-2.5 transform scale-110">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-[#e35654] flex items-center justify-center">
                          <Handshake className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="h-1 bg-[#ff6b6b] rounded w-full mb-0.5" />
                          <div className="h-1 bg-[#d4547a] rounded w-2/3" />
                        </div>
                      </div>
                      <div className="flex gap-1 mt-1">
                        <div className="flex-1 h-1 bg-gray-100 rounded" />
                        <div className="flex-1 h-1 bg-gray-100 rounded" />
                      </div>
                    </div>
 
                    {/* Magnifying Glass */}
                    <div className="absolute bottom-2 right-4 z-20">
                      <div className="relative flex flex-col items-center">
                        {/* Glass Circle */}
                        <div className="w-20 h-20 rounded-full border-[3px] border-gray-800 bg-gradient-to-br from-white/50 via-blue-50/40 to-white/30 backdrop-blur-[2px] relative shadow-xl">
                          {/* Glass shine effect - top left */}
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white/70 blur-[2px]" />
                          {/* Secondary shine */}
                          <div className="absolute top-4 left-3 w-2 h-2 rounded-full bg-white/50" />
                        </div>
                        {/* Handle - centered at bottom */}
                        <div className="w-1.5 h-10 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full shadow-md -mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Title */}
                <h3 className="text-xl text-gray-900 mb-2 flex-shrink-0" style={{ fontWeight: 700 }}>
                  فرص واضحة <span className="text-[#e35654]">لدعم الابتكار</span>
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  تمنح مُمكّن الرعاة مساحة مخصصة لاكتشاف الهاكاثونات المفتوحة للرعاية، والاطلاع على باقات الدعم المتاحة، والتواصل مع المنظمين من خلال عملية واضحة ومنظمة لعقد الشراكات.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
 
      {/* About, Vision & Mission Timeline */}
      <section id="about-section" className="py-24 bg-gradient-to-br from-purple-50/30 via-blue-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
              ما هي منصة مُمكّن؟
            </h2>
          </motion.div>
 
          {/* Zigzag Timeline */}
          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Dashed Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" style={{ zIndex: 1 }}>
              {/* Diagonal line from top-right to middle-left */}
              <line x1="75%" y1="12%" x2="25%" y2="38%" stroke="#c084fc" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
              {/* Diagonal line from middle-left to bottom-right */}
              <line x1="25%" y1="62%" x2="75%" y2="88%" stroke="#c084fc" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
            </svg>
 
            <div className="relative space-y-20" style={{ zIndex: 2 }}>
              {/* Item 1 - About (Right Side) */}
              <motion.div 
                className="grid lg:grid-cols-2 gap-12 items-center"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                {/* Text - Right */}
                <div className="lg:order-2 text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e35654]/10 text-[#e35654] mb-4" style={{ fontWeight: 600 }}>
                    <div className="w-8 h-8 rounded-full bg-[#e35654] flex items-center justify-center text-white text-sm" style={{ fontWeight: 700 }}>1</div>
                    <span>لمحة عن مُمكّن</span>
                  </div>
                  <h3 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
                    منصة SaaS متكاملة لإدارة الهاكاثونات
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    مُمكّن هي منصة برمجية (SaaS) تجمع المنظمين والرعاة والمشاركين في نظام واحد متكامل يدير جميع مراحل الهاكاثون من التسجيل إلى التقييم وإعلان النتائج. تعتمد المنصة على تقنيات ويب حديثة ونظام قابل للتخصيص قائم على قواعد البيانات لتوفير إدارة مرنة وقابلة للتوسع، مع إمكانية دمج تقنيات الذكاء الاصطناعي لدعم تطوير مزايا مستقبلية وتعزيز منظومة الابتكار.
                  </p>
                </div>
 
                {/* Illustration - Left */}
                <div className="lg:order-1">
                  <div className="relative bg-gradient-to-br from-purple-100/50 via-blue-100/30 to-white rounded-3xl p-8 shadow-xl border border-purple-100/50">
                    {/* Platform Mockup */}
                    <div className="space-y-4">
                      {/* Header Bar */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#e35654] flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="h-2 bg-gray-300 rounded w-24 mb-1" />
                            <div className="h-1.5 bg-gray-200 rounded w-16" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100" />
                          <div className="w-8 h-8 rounded-full bg-gray-100" />
                        </div>
                      </div>
 
                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="w-6 h-6 rounded bg-green-500 mb-2" />
                          <div className="h-1.5 bg-gray-200 rounded w-full mb-1" />
                          <div className="h-1 bg-gray-100 rounded w-2/3" />
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="w-6 h-6 rounded bg-blue-500 mb-2" />
                          <div className="h-1.5 bg-gray-200 rounded w-full mb-1" />
                          <div className="h-1 bg-gray-100 rounded w-2/3" />
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="w-6 h-6 rounded bg-orange-500 mb-2" />
                          <div className="h-1.5 bg-gray-200 rounded w-full mb-1" />
                          <div className="h-1 bg-gray-100 rounded w-2/3" />
                        </div>
                      </div>
 
                      {/* Progress Bar */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-2 bg-gray-200 rounded w-20" />
                          <div className="h-2 bg-gray-200 rounded w-8" />
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#e35654] to-[#ff6b6b] rounded-full" style={{ width: '70%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
 
              {/* Item 2 - Vision (Left Side) */}
              <motion.div 
                className="grid lg:grid-cols-2 gap-12 items-center"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                {/* Text - Left */}
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 mb-4" style={{ fontWeight: 600 }}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm" style={{ fontWeight: 700 }}>2</div>
                    <span>رؤيتنا</span>
                  </div>
                  <h3 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
                    بناء منظومة ابتكار عربية
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    دعم الابتكار من خلال بناء منظومة مترابطة ومستدامة للهاكاثونات في العالم العربي.
                  </p>
                </div>
 
                {/* Illustration - Right */}
                <div className="lg:order-2">
                  <div className="relative bg-gradient-to-br from-blue-100/50 via-indigo-100/30 to-white rounded-3xl p-8 shadow-xl border border-blue-100/50 overflow-hidden">
                    {/* Vision Illustration - Target with Arrows */}
                    <div className="relative h-64 flex items-center justify-center">
                      {/* Background Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-2xl blur-xl" />
                      
                      {/* Target Circle */}
                      <div className="relative">
                        {/* Outer Rings */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 rounded-full border-4 border-blue-200/40" style={{ animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 rounded-full border-4 border-purple-200/50" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full border-4 border-pink-200/60" />
                        </div>
                        
                        {/* Center Target */}
                        <div className="relative w-24 h-24 rounded-full bg-[#e35654] flex items-center justify-center shadow-2xl">
                          <Target className="w-12 h-12 text-white" />
                        </div>
 
                        {/* Floating Icons Around */}
                        <div className="absolute -top-8 -right-8 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -bottom-6 -left-6 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 -right-10 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
 
              {/* Item 3 - Mission (Right Side) */}
              <motion.div 
                className="grid lg:grid-cols-2 gap-12 items-center"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                {/* Text - Right */}
                <div className="lg:order-2 text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 mb-4" style={{ fontWeight: 600 }}>
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm" style={{ fontWeight: 700 }}>3</div>
                    <span>رسالتنا</span>
                  </div>
                  <h3 className="text-3xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
                    تمكين تنظيم الهاكاثونات
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    تبسيط إدارة الهاكاثونات عبر تقليل التشتت وتكرار التسجيلات، وتوفير منصة موحدة وقابلة للتخصيص.
                  </p>
                </div>
 
                {/* Illustration - Left */}
                <div className="lg:order-1">
                  <div className="relative bg-gradient-to-br from-purple-100/50 via-pink-100/30 to-white rounded-3xl p-8 shadow-xl border border-purple-100/50">
                    {/* Mission Illustration - Unified Platform */}
                    <div className="space-y-4">
                      {/* Scattered Elements Before */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2 opacity-50">
                          <div className="w-8 h-8 rounded bg-gray-300" />
                          <div className="w-8 h-8 rounded bg-gray-300" />
                          <div className="w-8 h-8 rounded bg-gray-300" />
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-2xl mb-1">→</div>
                          <div className="text-xs text-gray-500" style={{ fontWeight: 600 }}>التوحيد</div>
                        </div>
                      </div>
 
                      {/* Unified Platform */}
                      <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-purple-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-purple-200 rounded w-24 mb-1" />
                            <div className="h-1.5 bg-purple-100 rounded w-16" />
                          </div>
                        </div>
 
                        {/* User Types */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 border border-green-100">
                            <div className="w-6 h-6 rounded-full bg-green-500 mx-auto mb-1 flex items-center justify-center">
                              <Users className="w-3 h-3 text-white" />
                            </div>
                            <div className="h-1 bg-green-200 rounded w-full" />
                          </div>
                          
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-2 border border-orange-100">
                            <div className="w-6 h-6 rounded-full bg-orange-500 mx-auto mb-1 flex items-center justify-center">
                              <Handshake className="w-3 h-3 text-white" />
                            </div>
                            <div className="h-1 bg-orange-200 rounded w-full" />
                          </div>
                          
                          <div className="bg-gradient-to-br from-rose-50 to-fuchsia-50 rounded-lg p-2 border border-rose-200">
                            <div className="w-6 h-6 rounded-full bg-[#e35654] mx-auto mb-1 flex items-center justify-center">
                              <LayoutDashboard className="w-3 h-3 text-white" />
                            </div>
                            <div className="h-1 bg-[#ff6b6b] rounded w-full" />
                          </div>
                        </div>
 
                        {/* Features List */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-500" />
                            <div className="flex-1 h-1 bg-purple-100 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-500" />
                            <div className="flex-1 h-1 bg-purple-100 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-500" />
                            <div className="flex-1 h-1 bg-purple-100 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
 
      {/* Services Overview */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
              ماذا تقدم منصة مُمكّن؟
            </h2>
            <p className="text-xl text-gray-500">
              كل ما تحتاجه لإدارة الهاكاثونات أو المشاركة فيها أو دعمها — في مكان واحد.
            </p>
          </motion.div>
 
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "المنظمون",
                subtitle: "صمّم، وأدر، وأطلق هاكاثونك",
                icon: LayoutDashboard,
                color: "#e35654",
                features: [
                  "تخصيص كامل للهاكاثون",
                  "لوحة تحكم موحدة للإدارة",
                  "نظام منظم للتقييم",
                ],
                link: "/auth",
              },
              {
                title: "الرعاة",
                subtitle: "اكتش فرص دعم الابتكار",
                icon: Handshake,
                color: "#f59e0b",
                features: [
                  "اكتشاف الهاكاثونات المفتوحة",
                  "عرض باقات الرعاية بوضوح",
                  "عقود رعاية رقمية موثقة",
                ],
                link: "/auth",
              },
              {
                title: "المشاركون",
                subtitle: "اكتشف وسجّل، وابتكر",
                icon: Users,
                color: "#10b981",
                features: [
                  "ملف شخصي موحد",
                  "تكوين فرق بالذكاء الاصطناعي",
                  "مساحة عمل تعاونية",
                ],
                link: "/auth",
              },
            ].map((service, i) => (
              <motion.div
                key={i}
                className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <service.icon className="w-7 h-7" style={{ color: service.color }} />
                </div>
                
                <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                  {service.title}
                </h3>
                <p className="text-gray-500 mb-6">{service.subtitle}</p>
                
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: service.color }} />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => navigate(service.link)}
                  className="w-full py-3 rounded-xl border-2 transition-all group-hover:text-white"
                  style={{
                    borderColor: service.color,
                    color: service.color,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = service.color}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontWeight: 600 }}>المزيد من التفاصيل</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              آراء مستخدمينا
            </h2>
            <p className="text-gray-500">ماذا يقولون عن مُمكّن؟</p>
          </motion.div>
 
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"
                    />
                  ))}
                </div>
 
                {/* Testimonial Text */}
                <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                  "{t.text}"
                </p>
 
                {/* User Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-gray-900" style={{ fontWeight: 600 }}>
                      {t.name}
                    </p>
                    <p className="text-gray-400 text-sm">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
 
      {/* CTA Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e35654] via-[#d94745] to-[#cc4a48] p-16 text-white shadow-2xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-5xl mb-6" style={{ fontWeight: 800 }}>
                انضم إلى مجتمع الابتكار اليوم
              </h2>
              <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                أكثر من 12,000 مبتكر يستخدمون مُمكّن لتحقيق أفكارهم وتحويلها إلى مشاريع حقيقية.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-[#e35654] hover:bg-gray-50 shadow-2xl transition-all hover:scale-105"
                style={{ fontWeight: 700, fontSize: "18px" }}
              >
                <Sparkles className="w-6 h-6" />
                ابدأ رحلتك مجاناً
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}