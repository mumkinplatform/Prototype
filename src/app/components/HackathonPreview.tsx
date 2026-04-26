import { useState } from 'react';
import { X, Users, Building2, Layout, Calendar, Trophy, Clock, MapPin, Eye, CheckCircle2, Handshake, Star, MessageCircle, FileText, BarChart3, Settings, Globe, ArrowRight, Target, Flag } from 'lucide-react';
import { Link } from 'react-router';
import { BannerPattern } from './BannerPatterns';
import { LogoPattern } from './LogoPatterns';

type ViewMode = 'participant' | 'sponsor' | 'workspace';

export default function HackathonPreview() {
  const [viewMode, setViewMode] = useState<ViewMode>('participant');

  // Default customization values
  const selectedColorPalette = 'purple';
  const selectedLogo = 'logo-1';
  const selectedBanner = 'pattern-1';

  // بيانات تجريبية - سيتم استبدالها ببيانات الهاكاثون الحقيقية
  const hackathonData = {
    title: 'هاكاثون الذكاء الاصطناعي 2024',
    org: 'مؤسسة التقنية',
    description: 'قمة تقنية عالمية لتطوير حلول الذكاء الاصطناعي والتعلم الآلي، تجمع المطورين والباحثين من أكثر من 20 دولة لبناء نماذج ذكاء اصطناعي تحل مشكلات حقيقية.',
    date: '5 سبتمبر 2025',
    deadline: '20 أغسطس 2025',
    location: 'الرياض، المملكة العربية السعودية',
    category: 'الذكاء الاصطناعي',
    type: 'حضوري',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop',
    prize: '120,000 ريال',
    duration: '48 ساعة',
    participants: 350,
    teams: 70,
    views: 241,
    tags: ['ذكاء اصطناعي', 'تعلم آلي'],
    timeline: [
      { date: '20 أغسطس', label: 'آخر موعد للتسجيل', done: false },
      { date: '28 أغسطس', label: 'الإعلان عن الفرق المقبولة', done: false },
      { date: '5 سبتمبر', label: 'بداية الهاكاثون', done: false },
      { date: '7 سبتمبر', label: 'العروض النهائية', done: false }
    ],
    sponsorshipPackages: [
      {
        id: '1',
        name: 'الراعي الذهبي',
        type: 'financial',
        value: '50,000 ر.س',
        description: 'أعلى مستوى رعاية مع ظهور بارز في جميع المواد التسويقية',
        benefits: ['شعار كبير في جميع المواد', 'كلمة افتتاحية 5 دقائق', 'جناح VIP', 'ذكر خاص في المراسلات']
      },
      {
        id: '2',
        name: 'الراعي الفضي',
        type: 'financial',
        value: '30,000 ر.س',
        description: 'رعاية متوسطة مع ظهور جيد',
        benefits: ['شعار متوسط في المواد', 'جناح عادي', 'ذكر في الموقع']
      },
      {
        id: '3',
        name: 'رعاية عينية - جوائز',
        type: 'in-kind',
        description: 'تقديم جوائز عينية للفائزين مثل أجهزة أو اشتراكات',
        benefits: ['ذكر كراعي للجوائز', 'شعار على شهادات الفائزين']
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                معاينة الهاكاثون
              </h1>
              <p className="text-sm text-gray-500">
                هذه معاينة للهاكاثون - لم يتم نشره بعد
              </p>
            </div>
            <Link
              to="/admin/create-hackathon"
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              إغلاق المعاينة
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - View Modes */}
          <div className="col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-24">
              <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>
                اختر المنظور
              </h3>
              <div className="space-y-2">
                {/* Participant View */}
                <button
                  onClick={() => setViewMode('participant')}
                  className={`w-full px-4 py-3 rounded-xl text-right transition-all flex items-center gap-3 ${
                    viewMode === 'participant'
                      ? 'bg-[#a41b42] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: viewMode === 'participant' ? 600 : 500 }}
                >
                  <Users className="w-5 h-5" />
                  <div>
                    <div className="text-sm">منظور المشارك</div>
                    <div className={`text-xs ${viewMode === 'participant' ? 'text-white/80' : 'text-gray-500'}`}>
                      صفحة التفاصيل الكاملة
                    </div>
                  </div>
                </button>

                {/* Sponsor View */}
                <button
                  onClick={() => setViewMode('sponsor')}
                  className={`w-full px-4 py-3 rounded-xl text-right transition-all flex items-center gap-3 ${
                    viewMode === 'sponsor'
                      ? 'bg-[#a41b42] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: viewMode === 'sponsor' ? 600 : 500 }}
                >
                  <Building2 className="w-5 h-5" />
                  <div>
                    <div className="text-sm">منظور الراعي</div>
                    <div className={`text-xs ${viewMode === 'sponsor' ? 'text-white/80' : 'text-gray-500'}`}>
                      صفحة التفاصيل والرعاية
                    </div>
                  </div>
                </button>

                {/* Workspace View */}
                <button
                  onClick={() => setViewMode('workspace')}
                  className={`w-full px-4 py-3 rounded-xl text-right transition-all flex items-center gap-3 ${
                    viewMode === 'workspace'
                      ? 'bg-[#a41b42] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: viewMode === 'workspace' ? 600 : 500 }}
                >
                  <Layout className="w-5 h-5" />
                  <div>
                    <div className="text-sm">مساحة العمل</div>
                    <div className={`text-xs ${viewMode === 'workspace' ? 'text-white/80' : 'text-gray-500'}`}>
                      واجهة المشارك الداخلية
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  💡 استخدم المعاينة للتحقق من كيفية ظهور الهاكاثون للمشاركين والرعاة قبل النشر
                </p>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="col-span-9">
            {/* Participant View */}
            {viewMode === 'participant' && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Hero Section */}
                <div className="relative h-64 bg-gradient-to-br from-purple-800 via-indigo-700 to-blue-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-6xl opacity-20" style={{ fontWeight: 900, lineHeight: 1.2, whiteSpace: 'pre' }}>
                      AI{'\n'}SUMMIT
                    </div>
                  </div>
                  
                  {/* Top Bar */}
                  <div className="absolute top-6 right-6 left-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                        {hackathonData.type}
                      </span>
                      {hackathonData.tags.map((tag, idx) => (
                        <span key={idx} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#a41b42]" style={{ fontWeight: 700 }}>
                        م
                      </div>
                      <div>
                        <h1 className="text-white text-2xl mb-1" style={{ fontWeight: 700 }}>
                          {hackathonData.title}
                        </h1>
                        <p className="text-white/90 text-sm">{hackathonData.org}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-6 px-8 py-6 border-b border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.prize}
                    </div>
                    <div className="text-sm text-gray-500">إجمالي الجوائز</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.duration}
                    </div>
                    <div className="text-sm text-gray-500">مدة الهاكاثون</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.teams}
                    </div>
                    <div className="text-sm text-gray-500">فريق مشاركة</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.date.split(' ')[0]}
                    </div>
                    <div className="text-sm text-gray-500">تاريخ الانطلاق</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="col-span-2 space-y-8">
                      {/* About */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <div className="w-1 h-6 bg-[#a41b42] rounded-full" />
                          عن الهاكاثون
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                          {hackathonData.description}
                        </p>
                      </div>

                      {/* Timeline */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <div className="w-1 h-6 bg-[#a41b42] rounded-full" />
                          الجدول الزمني
                        </h2>
                        <div className="space-y-3">
                          {hackathonData.timeline.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.done ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                                {item.done ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.label}</div>
                                <div className="text-xs text-gray-500">{item.date}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Registration Button */}
                      <div className="flex gap-3">
                        <button className="flex-1 px-6 py-3.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538] transition-all text-center" style={{ fontWeight: 600 }}>
                          سجل الآن
                        </button>
                        <button className="px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2" style={{ fontWeight: 600 }}>
                          <Star className="w-5 h-5" />
                          حفظ
                        </button>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الإحصائيات</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>المشاركون</span>
                            </div>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{hackathonData.participants}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Eye className="w-4 h-4" />
                              <span>المشاهدات</span>
                            </div>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{hackathonData.views}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>الفرق المسجلة</span>
                            </div>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{hackathonData.teams}</span>
                          </div>
                        </div>
                      </div>

                      {/* Organizer */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الجهة المنظمة</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white" style={{ fontWeight: 700 }}>
                            م
                          </div>
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{hackathonData.org}</div>
                            <div className="text-xs text-gray-500">جهة رسمية موثقة</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{hackathonData.location}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>آخر تسجيل: {hackathonData.deadline}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sponsor View */}
            {viewMode === 'sponsor' && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Hero Section */}
                <div className="relative h-64 bg-gradient-to-br from-purple-800 via-indigo-700 to-blue-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-6xl opacity-20" style={{ fontWeight: 900, lineHeight: 1.2, whiteSpace: 'pre' }}>
                      AI{'\n'}SUMMIT
                    </div>
                  </div>
                  
                  {/* Top Bar */}
                  <div className="absolute top-6 right-6 left-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                        {hackathonData.type}
                      </span>
                      {hackathonData.tags.map((tag, idx) => (
                        <span key={idx} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm" style={{ fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#a41b42]" style={{ fontWeight: 700 }}>
                        م
                      </div>
                      <div>
                        <h1 className="text-white text-2xl mb-1" style={{ fontWeight: 700 }}>
                          {hackathonData.title}
                        </h1>
                        <p className="text-white/90 text-sm">{hackathonData.org}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-6 px-8 py-6 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.prize}
                    </div>
                    <div className="text-sm text-gray-500">إجمالي الجوائز</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.duration}
                    </div>
                    <div className="text-sm text-gray-500">مدة الهاكاثون</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.participants}
                    </div>
                    <div className="text-sm text-gray-500">المشاركون المتوقعون</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {hackathonData.views}
                    </div>
                    <div className="text-sm text-gray-500">المشاهدات</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="col-span-2 space-y-8">
                      {/* About */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <Handshake className="w-6 h-6 text-[#a41b42]" />
                          عن الهاكاثون
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-6">
                          {hackathonData.description}
                        </p>
                      </div>

                      {/* Sponsorship Packages */}
                      <div>
                        <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                          <Star className="w-6 h-6 text-[#a41b42]" />
                          باقات الرعاية المتاحة
                        </h2>
                        <div className="space-y-4">
                          {hackathonData.sponsorshipPackages.map((pkg) => (
                            <div key={pkg.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#a41b42] transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-lg text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                                    {pkg.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {pkg.description}
                                  </p>
                                </div>
                                {pkg.type === 'financial' && (
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">القيمة المالية</div>
                                    <div className="text-xl text-[#a41b42]" style={{ fontWeight: 700 }}>
                                      {pkg.value}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Benefits */}
                              <div className="mb-4">
                                <div className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>المزايا:</div>
                                <ul className="space-y-1">
                                  {pkg.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      <span>{benefit}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button className="w-full px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538] transition-all text-sm" style={{ fontWeight: 600 }}>
                                طلب هذه الباقة
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="bg-gradient-to-br from-orange-50 to-[#fef2f4] border-2 border-orange-200 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#a41b42] flex items-center justify-center text-white">
                            <Handshake className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                              ابدأ رعايتك الآن
                            </h3>
                            <p className="text-sm text-gray-600">
                              سيتم مراجعة طلبك والتواصل معك خلال 48 ساعة
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      {/* Organizer */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الجهة المنظمة</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white" style={{ fontWeight: 700 }}>
                            م
                          </div>
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{hackathonData.org}</div>
                            <div className="text-xs text-gray-500">جهة رسمية موثقة</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{hackathonData.location}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>فترة التسجيل: حتى {hackathonData.deadline}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="border-2 border-gray-200 rounded-2xl p-5">
                        <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>الجدول الزمني</h3>
                        <div className="space-y-3">
                          {hackathonData.timeline.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-900" style={{ fontWeight: 600 }}>{item.label}</div>
                                <div className="text-xs text-gray-500">{item.date}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workspace View */}
            {viewMode === 'workspace' && (
              <div className="bg-[#f7f7f6] rounded-2xl overflow-hidden">
                {/* Hero Section - مثل ParticipantWorkspace */}
                <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0">
                    <BannerPattern pattern={selectedBanner} colorPalette={selectedColorPalette} />
                  </div>

                  {/* Content Overlay */}
                  <div className="relative max-w-5xl mx-auto px-6 py-6">
                    {/* Back Button (simulated) */}
                    <button className="flex items-center gap-2 text-white/80 hover:text-white text-xs mb-4 transition-colors pointer-events-none">
                      <ArrowRight className="w-3.5 h-3.5" style={{ transform: 'scaleX(-1)' }} />
                      العودة لمساحات العمل
                    </button>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {['إلكتروني', 'ذكاء اصطناعي', 'تعلم آلي'].map((tag, i) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-xs text-white"
                          style={{
                            background: i === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title & Logo */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Logo */}
                      <div className="w-16 h-16 bg-white rounded-xl shadow-lg p-2 flex-shrink-0">
                        <LogoPattern pattern={selectedLogo} colorPalette={selectedColorPalette} />
                      </div>

                      {/* Title */}
                      <div className="flex-1">
                        <h1 className="text-white mb-2" style={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.3 }}>
                          {hackathonData.title}
                        </h1>

                        {/* Info Row */}
                        <div className="flex items-center gap-3 text-white/80 text-sm flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs backdrop-blur-sm" style={{ fontWeight: 800 }}>
                              م
                            </div>
                            <span>{hackathonData.org}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{hackathonData.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body - مثل ParticipantWorkspace */}
                <div className="p-6">
                  <div className="grid lg:grid-cols-4 gap-4">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-2">
                      {[
                        { icon: '🏠', label: 'الرئيسية', color: '#6366f1', active: true },
                        { icon: '👥', label: 'بيانات الفريق', color: '#10b981', active: false },
                        { icon: '📹', label: 'الجلسات', color: '#06b6d4', active: false },
                        { icon: '📤', label: 'رفع المشروع', color: '#a41b42', active: false },
                        { icon: '📊', label: 'التقييمات', color: '#f59e0b', active: false },
                        { icon: '🏆', label: 'الشهادات', color: '#8b5cf6', active: false },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="w-full text-right rounded-xl p-3 transition-all"
                          style={{
                            background: item.active ? 'white' : 'transparent',
                            border: item.active ? `2px solid ${item.color}40` : '1px solid transparent',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: item.active ? `${item.color}15` : '#f3f4f6' }}>
                              {item.icon}
                            </div>
                            <span className={`text-xs ${item.active ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontWeight: item.active ? 700 : 500 }}>
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-3">
                      {/* About Card */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>عن الهاكاثون</h3>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                          {hackathonData.description}
                        </p>
                      </div>

                      {/* Timer Card */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>الوقت المتبقي للتسليم</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: '10', label: 'أيام' },
                            { value: '05', label: 'ساعة' },
                            { value: '32', label: 'دقيقة' },
                            { value: '45', label: 'ثانية' },
                          ].map((time, i) => (
                            <div key={i} className="text-center py-2 rounded-lg bg-[#fef2f4] border border-[#fce7eb]">
                              <p className="text-sm" style={{ fontWeight: 700, color: '#a41b42' }}>{time.value}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{time.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline Card */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>الجدول الزمني</h3>
                        </div>
                        <div className="space-y-2">
                          {[
                            { phase: 'بداية المسابقة', date: '1 أكتوبر', status: 'completed', color: '#10b981' },
                            { phase: 'تطوير النماذج الأولية', date: '1-7 أكتوبر', status: 'active', color: '#a41b42' },
                            { phase: 'التسليم النهائي', date: '13 أكتوبر', status: 'upcoming', color: '#6b7280' },
                          ].map((phase, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: phase.status === 'completed' ? '#f0fdf4' : phase.status === 'active' ? '#fef2f2' : '#f9fafb',
                                  border: `2px solid ${phase.color}`,
                                }}
                              >
                                {phase.status === 'completed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: phase.color }} />
                                ) : phase.status === 'active' ? (
                                  <Target className="w-3.5 h-3.5" style={{ color: phase.color }} />
                                ) : (
                                  <Flag className="w-3.5 h-3.5" style={{ color: phase.color }} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs text-gray-900" style={{ fontWeight: 600 }}>{phase.phase}</h4>
                                <p className="text-xs text-gray-400">{phase.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
