import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import PublishConfirmModal from './PublishConfirmModal';
import PublishSuccessModal from './PublishSuccessModal';
import { BannerPattern } from './BannerPatterns';
import { LogoPattern } from './LogoPatterns';
import { toast } from 'sonner';
import { 
  ArrowRight,
  Info,
  Users,
  Palette,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
  Plus,
  X,
  Calendar,
  FileText,
  Award,
  UserCheck,
  DollarSign,
  Handshake,
  Trash2
} from 'lucide-react';
 
type Section = 'basic' | 'organizers' | 'registration' | 'branding' | 'projects' | 'evaluation' | 'prizes' | 'sponsors';
 
interface Track {
  id: string;
  name: string;
  description: string;
}
 
interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time: string;
}
 
interface Judge {
  id: string;
  name: string;
  email: string;
  specialty: string;
}
 
interface Organizer {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}
 
interface Prize {
  id: string;
  position: string;
  amount: string;
  description: string;
}
 
interface SponsorPackage {
  id: string;
  name: string;
  type: 'financial' | 'technical' | 'logistic' | 'hospitality' | 'media' | 'other';
  price: string;
  needs: string;
  benefits: string[];
}
 
export function CreateHackathon() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [completedSections, setCompletedSections] = useState<Section[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [sponsorPackages, setSponsorPackages] = useState<SponsorPackage[]>([]);
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: boolean}>({});
  const [selectedLogoPattern, setSelectedLogoPattern] = useState<string | null>(null);
  const [selectedBannerPattern, setSelectedBannerPattern] = useState<string | null>(null);
  const [selectedColorPalette, setSelectedColorPalette] = useState<string>('red');
 
  const sections = [
    { id: 'basic' as Section, label: 'المعلومات الأساسية', icon: Info },
    { id: 'organizers' as Section, label: 'إدارة المنظمين', icon: UserCheck },
    { id: 'registration' as Section, label: 'إدارة القبول والتسجيل', icon: Users },
    { id: 'branding' as Section, label: 'التخصيص والهوية البصرية', icon: Palette },
    { id: 'projects' as Section, label: 'إدارة المشاريع', icon: FileText },
    { id: 'evaluation' as Section, label: 'إدارة التقييمات', icon: Award },
    { id: 'prizes' as Section, label: 'الجوائز', icon: DollarSign },
    { id: 'sponsors' as Section, label: 'الرعاة والباقات', icon: Handshake },
  ];
 
  const currentIndex = sections.findIndex(s => s.id === activeSection);
  const progress = Math.round(((currentIndex + 1) / sections.length) * 100);
 
  // Load draft data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      // Mock data - سيتم استبدالها ببيانات حقيقية من قاعدة البيانات
      // هنا يمكن جلب البيانات المحفوظة بناءً على ID
      console.log('Loading draft data for hackathon:', id);
      toast.success('تم تحميل المسودة', {
        description: 'يمكنك الآن متابعة التعديل',
        duration: 3000,
      });
    }
  }, [isEditMode, id]);
 
  const handleNext = () => {
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1].id;
      setActiveSection(nextSection);
      if (!completedSections.includes(activeSection)) {
        setCompletedSections([...completedSections, activeSection]);
      }
    }
  };
 
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };
 
  const handleSaveDraft = () => {
    // حفظ البيانات كمسودة (سيتم ربطها بقاعدة البيانات لاحقاً)
    console.log('Saving draft...');
    
    toast.success(isEditMode ? 'تم تحديث المسودة' : 'تم حفظ المسودة', {
      description: 'يمكنك الرجوع لتعديلها في أي وقت',
      duration: 3000,
    });
    
    // الانتقال إلى صفحة إدارة الهاكاثونات بعد ثانية
    setTimeout(() => {
      navigate('/admin/my-hackathons');
    }, 1000);
  };
 
  const handlePublish = () => {
    // عرض modal التأكيد مباشرة
    setShowPublishConfirmModal(true);
  };
 
  const confirmPublish = () => {
    // نشر الهاكاثون (سيتم ربطها بقاعدة البيانات لاحقاً)
    console.log('Publishing hackathon...');
    setShowPublishConfirmModal(false);
    setShowPublishSuccessModal(true);
  };
 
  const addTrack = () => {
    setTracks([...tracks, { id: Date.now().toString(), name: '', description: '' }]);
  };
 
  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };
 
  const addOrganizer = () => {
    setOrganizers([...organizers, { id: Date.now().toString(), name: '', email: '', role: '', permissions: [] }]);
  };
 
  const removeOrganizer = (id: string) => {
    setOrganizers(organizers.filter(o => o.id !== id));
  };
 
  const updateOrganizer = (id: string, field: keyof Organizer, value: string) => {
    setOrganizers(organizers.map(o => o.id === id ? { ...o, [field]: value } : o));
  };
 
  const toggleOrganizerPermission = (organizerId: string, permission: string) => {
    setOrganizers(organizers.map(org => {
      if (org.id === organizerId) {
        const hasPermission = org.permissions.includes(permission);
        return {
          ...org,
          permissions: hasPermission 
            ? org.permissions.filter(p => p !== permission)
            : [...org.permissions, permission]
        };
      }
      return org;
    }));
  };
 
  const handleFileUpload = (fileKey: string) => {
    // رفع الملف وإبقاء الحالة خضراء بشكل دائم
    setUploadedFiles(prev => ({ ...prev, [fileKey]: true }));
  };
 
  const addTimelineEvent = () => {
    setTimeline([...timeline, { id: Date.now().toString(), title: '', date: '', time: '' }]);
  };
 
  const removeTimelineEvent = (id: string) => {
    setTimeline(timeline.filter(t => t.id !== id));
  };
 
  const addJudge = () => {
    setJudges([...judges, { id: Date.now().toString(), name: '', email: '', specialty: '' }]);
  };
 
  const removeJudge = (id: string) => {
    setJudges(judges.filter(j => j.id !== id));
  };
 
  const addPrize = () => {
    setPrizes([...prizes, { id: Date.now().toString(), position: '', amount: '', description: '' }]);
  };
 
  const removePrize = (id: string) => {
    setPrizes(prizes.filter(p => p.id !== id));
  };
 
  const addSponsorPackage = () => {
    setSponsorPackages([...sponsorPackages, { id: Date.now().toString(), name: '', type: 'financial', price: '', needs: '', benefits: [''] }]);
  };
 
  const removeSponsorPackage = (id: string) => {
    setSponsorPackages(sponsorPackages.filter(sp => sp.id !== id));
  };
 
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                to="/admin" 
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
                  {isEditMode ? 'تعديل الهاكاثون' : 'إنشاء هاكاثون جديد'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditMode ? 'عدل البيانات واحفظ التغييرات' : 'أكمل جميع الأقسام لنشر هاكاثونك'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveDraft}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all flex items-center gap-2" 
                style={{ fontWeight: 600 }}
              >
                <Save className="w-4 h-4" />
                {isEditMode ? 'حفظ التعديلات' : 'حفظ كمسودة'}
              </button>
              <Link 
                to="/admin/hackathon-preview"
                className="px-4 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20 transition-all flex items-center gap-2" 
                style={{ fontWeight: 600 }}
              >
                <Eye className="w-4 h-4" />
                معاينة
              </Link>
            </div>
          </div>
        </div>
      </header>
 
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600" style={{ fontWeight: 600 }}>اكتمال الإعداد</span>
                  <span className="text-lg text-[#e35654]" style={{ fontWeight: 700 }}>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e35654] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
 
              {/* Sections List */}
              <nav className="space-y-1">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  const isCompleted = completedSections.includes(section.id);
                  const SectionIcon = section.icon;
 
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all ${
                        isActive 
                          ? 'bg-gradient-to-l from-[#fef2f2] to-[#fee2e2] text-[#e35654] border border-[#e35654]/20' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ fontWeight: isActive ? 600 : 500 }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-[#e35654] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <SectionIcon className="w-4 h-4" />
                        )}
                      </div>
                      <span className="flex-1 text-right">{section.label}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#e35654]" />
                      )}
                    </button>
                  );
                })}
              </nav>
 
              {/* Info Box */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900 leading-relaxed">
                    تأكد من ملء جميع الحقول المطلوبة في كل قسم قبل الانتقال للقسم التالي
                  </p>
                </div>
              </div>
            </div>
          </aside>
 
          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              {/* Basic Info Section */}
              {activeSection === 'basic' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>المعلومات الأساسية</h2>
                    <p className="text-gray-500">ابدأ بتحديد التفاصيل الجوهرية للهاكاثون الخاص بك</p>
                  </div>
 
                  <div className="space-y-6">
                    {/* Hackathon Name */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        اسم الهاكاثون <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: هاكاثون الابتكار الصحي"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      />
                    </div>
 
                    {/* URL */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الرابط المختصر (URL) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 px-4 py-3 bg-gray-100 rounded-xl border border-gray-200">
                          /hack.me
                        </span>
                        <input
                          type="text"
                          placeholder="health-hackathon-2024"
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                        <button className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all" style={{ fontWeight: 600 }}>
                          تحقق
                        </button>
                      </div>
                    </div>
 
                    {/* Description */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        وصف الهاكاثون <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="تحدث عن الأهداف، التحديات، والجمهور المستهدف..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none"
                      />
                    </div>
 
                    {/* Tracks (المسارات) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
                          مسارات الهاكاثون <span className="text-red-500">*</span>
                        </label>
                        <button
                          onClick={addTrack}
                          className="px-3 py-1.5 rounded-lg bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] transition-all flex items-center gap-1"
                          style={{ fontWeight: 600 }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          إضافة مسار
                        </button>
                      </div>
                      <div className="space-y-3">
                        {tracks.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                            لم تتم إضافة أي مسارات بعد
                          </div>
                        )}
                        {tracks.map((track) => (
                          <div key={track.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 space-y-3">
                                <input
                                  type="text"
                                  placeholder="اسم المسار (مثال: الذكاء الاصطناعي)"
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10"
                                />
                                <textarea
                                  rows={2}
                                  placeholder="وصف المسار والأهداف المطلوبة..."
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 resize-none"
                                />
                              </div>
                              <button
                                onClick={() => removeTrack(track.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
 
                    {/* Event Format */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        طريقة الإقامة <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['حضوري', 'عبر الإنترنت', 'هجين (Hybrid)'].map((format) => (
                          <button
                            key={format}
                            className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm hover:border-[#e35654] hover:bg-red-50 hover:text-[#e35654] transition-all"
                            style={{ fontWeight: 500 }}
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    </div>
 
                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          المدينة / الدولة <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="الرياض، السعودية"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          العنوان الكامل
                        </label>
                        <input
                          type="text"
                          placeholder="شارع الملك فهد، الرياض"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
 
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          تاريخ البدء <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          تاريخ الانتهاء <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
 
                    {/* Timeline (الجدول الزمني) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
                          الجدول الزمني للهاكاثون <span className="text-red-500">*</span>
                        </label>
                        <button
                          onClick={addTimelineEvent}
                          className="px-3 py-1.5 rounded-lg bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] transition-all flex items-center gap-1"
                          style={{ fontWeight: 600 }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          إضافة حدث
                        </button>
                      </div>
                      <div className="space-y-3">
                        {timeline.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                            لم تتم إضافة أي أحداث للجدول الزمني بعد
                          </div>
                        )}
                        {timeline.map((event) => (
                          <div key={event.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <input
                              type="text"
                              placeholder="عنوان الحدث (مثال: افتتاح الهاكاثون)"
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                            />
                            <input
                              type="date"
                              className="w-40 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                            />
                            <input
                              type="time"
                              className="w-32 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                            />
                            <button
                              onClick={() => removeTimelineEvent(event.id)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
 
                    {/* Organizer Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          اسم المنظم (يظهر للجمهور) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="مؤسسة الابتكار السعودية"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          البريد الإلكتروني للتواصل <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="contact@hackathon.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
 
                    {/* Visibility */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        الظهور <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                          <input type="radio" name="visibility" className="mt-1" defaultChecked />
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>هاكاثون عام (Public)</div>
                            <div className="text-xs text-gray-500 mt-1">يظهر للجميع ويمكن لأي شخص التسجيل</div>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                          <input type="radio" name="visibility" className="mt-1" />
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>هاكاثون خاص (Private)</div>
                            <div className="text-xs text-gray-500 mt-1">بدعوة فقط، يتطلب رمز دخول للتسجيل</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {/* Organizers Section */}
              {activeSection === 'organizers' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>إدارة المنظمين</h2>
                    <p className="text-gray-500">أضف المدراء والموظفين مع تحديد صلاحياتهم بدقة</p>
                  </div>
 
                  <div className="space-y-6">
                    {/* Add Organizer Button */}
                    <button 
                      onClick={addOrganizer}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#e35654] hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-[#e35654]" 
                      style={{ fontWeight: 600 }}
                    >
                      <Plus className="w-5 h-5" />
                      إضافة مدير/موظف جديد
                    </button>
 
                    {/* Organizers List */}
                    {organizers.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>قائمة المنظمين ({organizers.length})</h3>
                        
                        <div className="space-y-4">
                          {organizers.map((organizer) => (
                            <div key={organizer.id} className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:border-[#e35654] transition-all">
                              {/* Basic Info */}
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-2" style={{ fontWeight: 600 }}>الاسم الكامل</label>
                                  <input
                                    type="text"
                                    value={organizer.name}
                                    onChange={(e) => updateOrganizer(organizer.id, 'name', e.target.value)}
                                    placeholder="محمد أحمد"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-2" style={{ fontWeight: 600 }}>البريد الإلكتروني</label>
                                  <input
                                    type="email"
                                    value={organizer.email}
                                    onChange={(e) => updateOrganizer(organizer.id, 'email', e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-2" style={{ fontWeight: 600 }}>الدور الوظيفي</label>
                                  <select
                                    value={organizer.role}
                                    onChange={(e) => updateOrganizer(organizer.id, 'role', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654]"
                                  >
                                    <option value="">اختر الدور</option>
                                    <option value="manager">مدير</option>
                                    <option value="staff">موظف</option>
                                    <option value="coordinator">منسق</option>
                                  </select>
                                </div>
                              </div>
 
                              {/* Permissions */}
                              <div className="mb-4">
                                <label className="block text-xs text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                                  الصلاحيات ({organizer.permissions.length} محددة)
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                  {[
                                    { id: 'manage_participants', label: 'إدارة المشاركين', icon: '👥' },
                                    { id: 'manage_projects', label: 'إدارة المشاريع', icon: '📁' },
                                    { id: 'manage_sponsors', label: 'إدارة الرعايات', icon: '🤝' },
                                    { id: 'manage_content', label: 'إدارة المحتوى', icon: '📝' },
                                    { id: 'view_analytics', label: 'عرض الإحصائيات', icon: '📊' },
                                    { id: 'full_access', label: 'إدارة كاملة', icon: '⭐' },
                                  ].map((perm) => {
                                    const isSelected = organizer.permissions.includes(perm.id);
                                    return (
                                      <label 
                                        key={perm.id} 
                                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                          isSelected 
                                            ? 'border-[#e35654] bg-red-50' 
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          onChange={() => toggleOrganizerPermission(organizer.id, perm.id)}
                                          className="w-4 h-4 text-[#e35654] border-gray-300 rounded focus:ring-[#e35654]"
                                        />
                                        <span className="text-lg">{perm.icon}</span>
                                        <span className={`text-sm flex-1 ${isSelected ? 'text-[#e35654]' : 'text-gray-700'}`} style={{ fontWeight: isSelected ? 600 : 500 }}>
                                          {perm.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
 
                              {/* Actions */}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                  سيتم إرسال دعوة بالبريد الإلكتروني عند الحفظ
                                </div>
                                <button
                                  onClick={() => removeOrganizer(organizer.id)}
                                  className="px-4 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all inline-flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="text-sm" style={{ fontWeight: 600 }}>حذف المنظم</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
 
                    {organizers.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">لا يوجد منظمين مضافون بعد</p>
                        <p className="text-sm text-gray-400 mt-1">انقر على الزر أعلاه لإضافة منظمين وتحديد صلاحياتهم</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
 
              {/* Registration Section */}
              {activeSection === 'registration' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>إدارة القبول والتسجيل</h2>
                    <p className="text-gray-500">حدد قواعد ومعايير التسجيل للمشاركين</p>
                  </div>
 
                  <div className="space-y-6">
                    {/* Registration Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          فتح التسجيل <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          إغلاق التسجيل <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
 
                    {/* Age Requirement */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الحد الأدنى للعمر
                      </label>
                      <input
                        type="number"
                        placeholder="18"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-2">حدد الحد الأدنى للعمر إذا كان الحدث يتطلب أهلية قانونية أو موافقة الوالدين</p>
                    </div>
 
                    {/* Team Size */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          الحد الأقصى لحجم الفريق <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="5"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          الحد الأدنى لحجم الفريق <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="1"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
 
                    {/* Target Participants */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        عدد المشاركين المستهدف <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="500"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      />
                    </div>
 
                    {/* Participation Mode */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        نمط المشاركة <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                          <input type="radio" name="participation" className="mt-1" defaultChecked />
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>فرق فقط</div>
                            <div className="text-xs text-gray-500 mt-1">يجب على المشاركين التسجيل كفريق</div>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                          <input type="radio" name="participation" className="mt-1" />
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>أفراد وفرق</div>
                            <div className="text-xs text-gray-500 mt-1">يمكن للأفراد التسجيل ثم الانضمام لفريق لاحقاً</div>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                          <input type="radio" name="participation" className="mt-1" />
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>أفراد فقط</div>
                            <div className="text-xs text-gray-500 mt-1">كل مشارك يعمل بشكل فردي</div>
                          </div>
                        </label>
                      </div>
                    </div>
 
                    {/* Allowed Countries */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الدول المسموحة <span className="text-red-500">*</span>
                      </label>
                      <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all">
                        <option>جميع الدول</option>
                        <option>دول الخليج فقط</option>
                        <option>السعودية فقط</option>
                        <option>دول عربية محددة</option>
                        <option>دول مخصصة</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
 
              {/* Branding Section */}
              {activeSection === 'branding' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>التخصيص والهوية البصرية</h2>
                    <p className="text-gray-500">اجعل هاكاثونك مميزاً بعلامتك التجارية الخاصة</p>
                  </div>
 
                  <div className="space-y-8">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        شعار الهاكاثون
                      </label>
                      <label 
                        htmlFor="logo-upload"
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer block ${
                          uploadedFiles['logo'] 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-[#e35654] hover:bg-red-50'
                        }`}
                      >
                        <input 
                          id="logo-upload" 
                          type="file" 
                          className="hidden" 
                          onChange={() => handleFileUpload('logo')}
                          accept="image/*"
                        />
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          uploadedFiles['logo'] ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {uploadedFiles['logo'] ? (
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                          ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <p className={`text-sm mb-1 ${uploadedFiles['logo'] ? 'text-green-700' : 'text-gray-700'}`} style={{ fontWeight: 600 }}>
                          {uploadedFiles['logo'] ? 'تم الرفع بنجاح!' : 'انقر لرفع الشعار'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, أو SVG (يظهر في أعلى صفحة الهاكاثون)</p>
                      </label>
 
                      {/* Logo Patterns */}
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-3">أو اختر شعاراً جاهزاً من الباترنز</p>
                        <div className="grid grid-cols-4 gap-3">
                          {['logo-1','logo-2','logo-3','logo-4','logo-5','logo-6','logo-7','logo-8'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSelectedLogoPattern(selectedLogoPattern === p ? null : p)}
                              className={`w-full aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                                selectedLogoPattern === p
                                  ? 'border-[#e35654] ring-2 ring-[#e35654]/30'
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <LogoPattern pattern={p} colorPalette={selectedColorPalette} />
                            </button>
                          ))}
                        </div>
                      </div>
 
                      {/* Logo Preview */}
                      {selectedLogoPattern && (
                        <div className="mt-4 p-4 rounded-xl border border-[#e35654]/20 bg-red-50">
                          <p className="text-xs text-gray-500 mb-3" style={{ fontWeight: 600 }}>معاينة الشعار</p>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-white">
                              <LogoPattern pattern={selectedLogoPattern} colorPalette={selectedColorPalette} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>هكذا سيظهر شعارك في صفحة الهاكاثون</p>
                              <p className="text-xs text-gray-500 mt-1">يمكنك تغيير اللون من قسم لوحة الألوان أدناه</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedLogoPattern(null)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
 
                    {/* Banner Upload */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        صورة الهيدر (Banner)
                      </label>
                      <label 
                        htmlFor="banner-upload"
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer block ${
                          uploadedFiles['banner'] 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-[#e35654] hover:bg-red-50'
                        }`}
                      >
                        <input 
                          id="banner-upload" 
                          type="file" 
                          className="hidden" 
                          onChange={() => handleFileUpload('banner')}
                          accept="image/*"
                        />
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          uploadedFiles['banner'] ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {uploadedFiles['banner'] ? (
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                          ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <p className={`text-sm mb-1 ${uploadedFiles['banner'] ? 'text-green-700' : 'text-gray-700'}`} style={{ fontWeight: 600 }}>
                          {uploadedFiles['banner'] ? 'تم الرفع بنجاح!' : 'انقر لرفع صورة الخلفية'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, أو SVG (تظهر كخلفية للهيدر)</p>
                      </label>
 
                      {/* Banner Patterns */}
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-3">أو اختر خلفية جاهزة من الباترنز</p>
                        <div className="grid grid-cols-3 gap-3">
                          {['pattern-1','pattern-2','pattern-3','pattern-4','pattern-5','pattern-6'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSelectedBannerPattern(selectedBannerPattern === p ? null : p)}
                              className={`w-full rounded-xl border-2 overflow-hidden transition-all ${
                                selectedBannerPattern === p
                                  ? 'border-[#e35654] ring-2 ring-[#e35654]/30'
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                              style={{ height: '80px' }}
                            >
                              <BannerPattern pattern={p} colorPalette={selectedColorPalette} />
                            </button>
                          ))}
                        </div>
                      </div>
 
                      {/* Banner Preview */}
                      {selectedBannerPattern && (
                        <div className="mt-4 p-4 rounded-xl border border-[#e35654]/20 bg-red-50">
                          <p className="text-xs text-gray-500 mb-3" style={{ fontWeight: 600 }}>معاينة الهيدر</p>
                          <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: '120px' }}>
                            <BannerPattern pattern={selectedBannerPattern} colorPalette={selectedColorPalette} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">هكذا ستظهر خلفية هيدر الهاكاثون</p>
                            <button
                              type="button"
                              onClick={() => setSelectedBannerPattern(null)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
 
                    {/* Color Palette Selector */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        لوحة الألوان للباترنز
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { id: 'red', label: 'أحمر', color: '#a41b42' },
                          { id: 'blue', label: 'أزرق', color: '#3b82f6' },
                          { id: 'green', label: 'أخضر', color: '#10b981' },
                          { id: 'purple', label: 'بنفسجي', color: '#8b5cf6' },
                          { id: 'orange', label: 'برتقالي', color: '#f97316' },
                          { id: 'yellow', label: 'ذهبي', color: '#eab308' },
                        ].map((palette) => (
                          <button
                            key={palette.id}
                            type="button"
                            onClick={() => setSelectedColorPalette(palette.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm transition-all ${
                              selectedColorPalette === palette.id
                                ? 'border-[#e35654] bg-red-50'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: palette.color }} />
                            {palette.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">تؤثر على ألوان الباترنز الجاهزة فقط</p>
                    </div>
 
                    {/* Visible Sections */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        الأقسام المرئية على صفحة الهاكاثون
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: 'about', label: 'قسم نبذة عن الهاكاثون', desc: 'يعرض الوصف والنظرة العامة' },
                          { id: 'timeline', label: 'قسم الجدول الزمني', desc: 'يعرض المواعيد والأحداث المهمة' },
                          { id: 'sponsors', label: 'قسم الرعاة', desc: 'يعرض شعارات الرعاة ومعلوماتهم' },
                          { id: 'faq', label: 'قسم الأسئلة الشائعة', desc: 'يعرض الأسئلة والأجوبة' },
                          { id: 'announcements', label: 'قسم الإعلانات', desc: 'للنشر والتحديثات أثناء الهاكاثون' },
                          { id: 'judges', label: 'قسم لجنة التحكيم', desc: 'يعرض قائمة المحكمين' },
                          { id: 'submissions', label: 'قسم التسليم', desc: 'منطقة رفع وإدارة المشاريع' },
                          { id: 'prizes', label: 'قسم الجوائز', desc: 'يعرض معلومات الجوائز والمكافآت' },
                        ].map((section) => (
                          <label key={section.id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all">
                            <input type="checkbox" className="mt-1" defaultChecked />
                            <div className="flex-1">
                              <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{section.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{section.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {/* Projects Section */}
              {activeSection === 'projects' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>إدارة المشاريع</h2>
                    <p className="text-gray-500">حدد متطلبات وإعدادات تس��يم المشاريع</p>
                  </div>
 
                  <div className="space-y-6">
                    {/* Submission Period */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          بداية تسليم المشاريع <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          نهاية تسليم المشاريع <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
 
                    {/* Project Description */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        وصف المشاريع المطلوبة <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="اكتب وصفاً دقيقاً لنوعية المشاريع المطلوبة، الأهداف، والتوقعات..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none"
                      />
                    </div>
 
                    {/* Project Requirements */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        شروط المشاريع <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="حدد الشروط والمتطلبات الفنية للمشاريع (مثال: يجب أن يكون المشروع مفتوح المصدر، استخدام تقنيات معينة، إلخ...)"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none"
                      />
                    </div>
 
                    {/* Required Fields */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        الحقول المطلوبة في التسليم
                      </label>
                      <div className="space-y-2">
                        {[
                          { id: 'title', label: 'عنوان المشروع', required: true },
                          { id: 'desc', label: 'وصف المشروع', required: true },
                          { id: 'video', label: 'فيديو توضيحي', required: false },
                          { id: 'demo', label: 'رابط النسخة التجريبية', required: false },
                          { id: 'github', label: 'رابط GitHub', required: false },
                          { id: 'presentation', label: 'عرض تقديمي (PDF)', required: false },
                          { id: 'images', label: 'صور المشروع', required: false },
                        ].map((field) => (
                          <label key={field.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" defaultChecked={field.required} />
                              <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{field.label}</span>
                            </div>
                            {field.required && (
                              <span className="text-xs text-red-500 px-2 py-1 rounded-md bg-red-50" style={{ fontWeight: 600 }}>
                                مطلوب
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
 
                    {/* File Size Limit */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الحد الأقصى لحجم الملف (MB)
                      </label>
                      <input
                        type="number"
                        placeholder="50"
                        defaultValue="50"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      />
                    </div>
 
                    {/* Allow Late Submissions */}
                    <div>
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                        <input type="checkbox" className="mt-1" />
                        <div>
                          <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>السماح بالتسليم المتأخر</div>
                          <div className="text-xs text-gray-500 mt-1">يمكن للفرق التسليم بعد الموعد النهائي مع علامة "تأخير"</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
 
              {/* Evaluation Section */}
              {activeSection === 'evaluation' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>إدارة التقييمات</h2>
                    <p className="text-gray-500">حدد معايير التحكيم وأضف المقيّمين</p>
                  </div>
 
                  <div className="space-y-6">
                    {/* Evaluation Criteria */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        معايير التقييم <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="مثال:&#10;• الابتكار والإبداع (30%)&#10;• التنفيذ الفني والجودة (30%)&#10;• التأثير والفائدة (20%)&#10;• العرض والتقديم (20%)"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none"
                      />
                    </div>
 
                    {/* Add Judge Section */}
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl">
                      <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 700 }}>إضافة محكم جديد</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="اسم المحكم"
                          className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654]"
                        />
                        <input
                          type="email"
                          placeholder="البريد الإلكتروني"
                          className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654]"
                        />
                        <input
                          type="text"
                          placeholder="التخصص"
                          className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654]"
                        />
                      </div>
                      <button
                        onClick={addJudge}
                        className="w-full py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all flex items-center justify-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        <Plus className="w-4 h-4" />
                        إضافة المحكم وإرسال دعوة
                      </button>
                      <p className="text-xs text-gray-500 mt-3">
                        سيتم إنشاء حساب للمحكم بصلاحيات خاصة لعرض وتقييم المشاريع فقط
                      </p>
                    </div>
 
                    {/* Judges List */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>المحكمون المضافون ({judges.length})</h3>
                        <span className="text-xs text-gray-500">سيتم توزيع المشاريع بالتساوي</span>
                      </div>
                      <div className="space-y-2">
                        {judges.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                            لم تتم إضافة أي محكمين بعد
                          </div>
                        )}
                        {judges.map((judge) => (
                          <div key={judge.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm" style={{ fontWeight: 700 }}>
                                م
                              </div>
                              <div>
                                <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>محكم جديد</div>
                                <div className="text-xs text-gray-500">judge@example.com • التخصص</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs" style={{ fontWeight: 600 }}>محكم</span>
                              <button
                                onClick={() => removeJudge(judge.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
 
                    {/* Distribution Info */}
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-900 mb-1" style={{ fontWeight: 600 }}>كيفية توزيع المشاريع</p>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            عند تسليم المشاركين لمشاريعهم، سيتم توزيع المشاريع تلقائياً على جميع المحكمين بالتساوي. كل محكم سيحصل على رابط خاص لتقييم المشاريع المخصصة له فقط.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {/* Prizes Section */}
              {activeSection === 'prizes' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>الجوائز</h2>
                    <p className="text-gray-500">حدد الجوائز وطريقة استلامها</p>
                  </div>
 
                  <div className="space-y-6">
                    {/* Add Prize Button */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>جوائز الهاكاثون</h3>
                      <button
                        onClick={addPrize}
                        className="px-4 py-2 rounded-lg bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all flex items-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        <Plus className="w-4 h-4" />
                        إضافة جائزة
                      </button>
                    </div>
 
                    {/* Prizes List */}
                    <div className="space-y-4">
                      {prizes.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                          لم تتم إضافة أي جوائز بعد
                        </div>
                      )}
                      {prizes.map((prize, index) => (
                        <div key={prize.id} className="p-6 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center text-xl flex-shrink-0" style={{ fontWeight: 700 }}>
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>المركز</label>
                                  <input
                                    type="text"
                                    placeholder="المركز الأول"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>قيمة الجائزة</label>
                                  <input
                                    type="text"
                                    placeholder="50,000 ريال"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>تفاصيل الجائزة وطريقة الاستلام</label>
                                <textarea
                                  rows={3}
                                  placeholder="وصف الجائزة، الشروط، وطريقة الاستلام..."
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removePrize(prize.id)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
 
                    {/* General Prize Terms */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الشروط والأحكام العامة للجوائز
                      </label>
                      <textarea
                        rows={4}
                        placeholder="اكتب الشروط العامة لاستحقاق واستلام الجوائز..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
 
              {/* Sponsors Section */}
              {activeSection === 'sponsors' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>الرعاة والباقات</h2>
                    <p className="text-gray-500">أنشئ باقات الرعاية التي سيراها الرعاة المحتملون</p>
                  </div>
 
                  <div className="space-y-6">
                    {/* Add Package Button */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>باقات الرعاية</h3>
                      <button
                        onClick={addSponsorPackage}
                        className="px-4 py-2 rounded-lg bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all flex items-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        <Plus className="w-4 h-4" />
                        إضافة باقة
                      </button>
                    </div>
 
                    {/* Packages List */}
                    <div className="space-y-4">
                      {sponsorPackages.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                          لم تتم إضافة أي باقات رعاية بعد
                        </div>
                      )}
                      {sponsorPackages.map((pkg, index) => {
                        const typeIcons: Record<string, string> = {
                          financial: '💰',
                          technical: '💻',
                          logistic: '📦',
                          hospitality: '🏨',
                          media: '📢',
                          other: '���'
                        };
                        const typeColors: Record<string, string> = {
                          financial: 'from-green-500 to-emerald-600',
                          technical: 'from-blue-500 to-cyan-600',
                          logistic: 'from-orange-500 to-amber-600',
                          hospitality: 'from-purple-500 to-violet-600',
                          media: 'from-pink-500 to-rose-600',
                          other: 'from-gray-500 to-slate-600'
                        };
                        const typeBg: Record<string, string> = {
                          financial: 'from-green-50 to-emerald-50',
                          technical: 'from-blue-50 to-cyan-50',
                          logistic: 'from-orange-50 to-amber-50',
                          hospitality: 'from-purple-50 to-violet-50',
                          media: 'from-pink-50 to-rose-50',
                          other: 'from-gray-50 to-slate-50'
                        };
                        
                        return (
                          <div key={pkg.id} className={`p-6 border-2 border-gray-200 rounded-xl bg-gradient-to-br ${typeBg[pkg.type] || 'from-purple-50 to-indigo-50'}`}>
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br ${typeColors[pkg.type] || 'from-purple-500 to-indigo-600'}`} style={{ fontWeight: 700 }}>
                                {typeIcons[pkg.type] || '🎯'}
                              </div>
                              <div className="flex-1 space-y-5">
                                {/* 🧾 معلومات عامة */}
                                <div className="space-y-3">
                                  <h4 className="text-sm text-gray-900 flex items-center gap-2" style={{ fontWeight: 700 }}>
                                    🧾 معلومات عامة
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>اسم الباقة</label>
                                      <input
                                        type="text"
                                        placeholder="الباقة الذهبية"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>نوع الرعاية</label>
                                      <select className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]">
                                        <option value="financial">رعاية مالية 💰</option>
                                        <option value="technical">رعاية تقنية 💻</option>
                                        <option value="logistic">رعاية لوجستية 📦</option>
                                        <option value="hospitality">رعاية ضيافة 🏨</option>
                                        <option value="media">رعاية إعلامية 📢</option>
                                        <option value="other">أخرى 🎯</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>الوصف العام</label>
                                    <textarea
                                      rows={2}
                                      placeholder="وصف ��امل للباقة وفوائدها للراعي والهاكاثون..."
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>مدة الرعاية</label>
                                    <input
                                      type="text"
                                      placeholder="3 أشهر"
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                    />
                                  </div>
                                </div>
 
                                {/* 💰 القيمة - فقط للرعاية المالية */}
                                {pkg.type === 'financial' && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm text-gray-900 flex items-center gap-2" style={{ fontWeight: 700 }}>
                                      💰 القيمة
                                    </h4>
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>
                                        السعر (ريال سعودي)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="100,000"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                      />
                                    </div>
                                  </div>
                                )}
 
                                {/* 🎁 ما يقدمه الراعي */}
                                <div className="space-y-3">
                                  <h4 className="text-sm text-gray-900 flex items-center gap-2" style={{ fontWeight: 700 }}>
                                    🎁 ما يقدمه الراعي
                                  </h4>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>تفاصيل الرعاية المقدمة</label>
                                    <textarea
                                      rows={3}
                                      placeholder={
                                        pkg.type === 'financial' ? 'مثال: دعم مالي لتغطية تكاليف الجوائز والمصاريف التشغيلية...' :
                                        pkg.type === 'technical' ? 'مثال: توفير فريق من المطورين (2 مطور ويب + 1 مصمم UI/UX)، أدوات برمجية، استشارات تقنية...' :
                                        pkg.type === 'logistic' ? 'مثال: توفير قاعة انعقاد تتسع 200 شخص، أجهزة حواسيب (50 جهاز)، إنترنت عالي السرعة...' :
                                        pkg.type === 'hospitality' ? 'مثال: وجبات طعام لـ 200 مشارك (3 وجبات يومياً)، مشروبات ومرطبات، ضيافة VIP...' :
                                        pkg.type === 'media' ? 'مثال: تغطية إعلامية كاملة، نشر على 5 منصات تواصل، تصوير فيديو احترافي، مقابلات...' :
                                        'حدد تفاصيل ما سيقدمه الراعي بالضبط...'
                                      }
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>عدد الموارد (اختياري)</label>
                                    <input
                                      type="text"
                                      placeholder="مثال: 2 مطور، 50 جهاز، 200 وجبة، إلخ"
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                    />
                                  </div>
                                </div>
 
                                {/* ⭐ ما يحصل عليه الراعي */}
                                <div className="space-y-3">
                                  <h4 className="text-sm text-gray-900 flex items-center gap-2" style={{ fontWeight: 700 }}>
                                    ⭐ ما يحصل عليه الراعي
                                  </h4>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-2" style={{ fontWeight: 600 }}>المميزات المقدمة للراعي</label>
                                    <div className="space-y-2">
                                      {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center gap-2">
                                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                          <input
                                            type="text"
                                            placeholder={`ميزة ${i} - مثال: ظهور الشعار في الموقع، جناح خاص، شهادة تقدير، إلخ`}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeSponsorPackage(pkg.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
 
 
                  </div>
                </div>
              )}
 
              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`px-6 py-3 rounded-xl border border-gray-200 transition-all flex items-center gap-2 ${
                    currentIndex === 0 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <ArrowRight className="w-4 h-4" />
                  السابق
                </button>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSaveDraft}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all" 
                    style={{ fontWeight: 600 }}
                  >
                    حفظ كمسودة
                  </button>
                  {currentIndex === sections.length - 1 ? (
                    <button 
                      onClick={handlePublish}
                      className="px-8 py-3 rounded-xl bg-[#e35654] text-white hover:shadow-lg hover:shadow-[#e35654]/30 transition-all flex items-center gap-2" 
                      style={{ fontWeight: 600 }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      نشر الهاكاثون
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="px-8 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      التالي
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
 
      {/* Modals */}
      <PublishConfirmModal
        isOpen={showPublishConfirmModal}
        onClose={() => setShowPublishConfirmModal(false)}
        onConfirm={confirmPublish}
      />
 
      <PublishSuccessModal
        isOpen={showPublishSuccessModal}
        onClose={() => setShowPublishSuccessModal(false)}
        onViewHackathon={() => navigate('/hackathon/1')}
        onViewDashboard={() => navigate('/admin/my-hackathons')}
      />
    </div>
  );
}