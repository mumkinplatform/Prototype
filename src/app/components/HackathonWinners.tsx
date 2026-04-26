import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { 
  ArrowRight, 
  Trophy, 
  Send, 
  Upload,
  Star,
  Edit,
  Gift,
  Download,
  CheckCircle,
  Crown,
  Search,
  Filter,
  Mail,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Winner {
  id: number;
  rank: number;
  team: string;
  project: string;
  track: string;
  subTrack: string;
  score: number;
  prize: string;
  avatar: string;
  badge: string;
  email: string;
}

const mockWinners: Winner[] = [
  { 
    id: 1, 
    rank: 1, 
    team: 'فريق النخبة', 
    project: 'نظام الذكاء الاصطناعي المتقدم',
    track: 'الذكاء الاصطناعي',
    subTrack: 'الحلول التقنية',
    score: 98.5, 
    prize: '50,000',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
    badge: '#1',
    email: 'elite@example.com'
  },
  { 
    id: 2, 
    rank: 2, 
    team: 'فريق المبتكرون', 
    project: 'تطبيق الصحة الذكية',
    track: 'الصحة الرقمية',
    subTrack: 'تطبيقات طبية',
    score: 95.2, 
    prize: '30,000',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop',
    badge: '#2',
    email: 'innovators@example.com'
  },
  { 
    id: 3, 
    rank: 3, 
    team: 'فريق الرؤية', 
    project: 'منصة التعليم التفاعلية',
    track: 'التعليم الرقمي',
    subTrack: 'منصات تعليمية',
    score: 92.8, 
    prize: '20,000',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop',
    badge: '#3',
    email: 'vision@example.com'
  },
  { 
    id: 4, 
    rank: 4, 
    team: 'فريق النجمة', 
    project: 'حل الطاقة المستدامة',
    track: 'الاستدامة',
    subTrack: 'حلول بيئية',
    score: 89.4, 
    prize: 'Honorable Mention',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    badge: 'R',
    email: 'star@example.com'
  },
  { 
    id: 5, 
    rank: 5, 
    team: 'فريق زيرو', 
    project: 'نظام إدارة الموارد',
    track: 'الأعمال',
    subTrack: 'إدارة مشاريع',
    score: 89.4, 
    prize: 'Honorable Mention',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    badge: 'Z',
    email: 'zero@example.com'
  },
  { 
    id: 6, 
    rank: 6, 
    team: 'المبتكرون', 
    project: 'تطبيق التواصل الاجتماعي',
    track: 'التواصل',
    subTrack: 'شبكات اجتماعية',
    score: 92.0, 
    prize: '',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    badge: 'M',
    email: 'innovate@example.com'
  },
  { 
    id: 7, 
    rank: 7, 
    team: 'فريق النخبة', 
    project: 'منصة التجارة الإلكترونية',
    track: 'التجارة',
    subTrack: 'الحلول التقنية',
    score: 98.5, 
    prize: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    badge: 'N',
    email: 'ecommerce@example.com'
  },
];

export function HackathonWinners() {
  const { id } = useParams();
  const [showWinnersPrizes, setShowWinnersPrizes] = useState(true);
  const [showIncentiveCriteria, setShowIncentiveCriteria] = useState(true);
  const [allowCertificateDownload, setAllowCertificateDownload] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('تهانينا! أنتم من الفائزين');
  const [emailBody, setEmailBody] = useState('عزيزي الفريق،\n\nنهنئكم بالفوز في الهاكاثون. لقد كان أداؤكم مميزاً.\n\nمع أطيب التحيات،\nفريق التنظيم');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('الكل');
  const [selectedPrize, setSelectedPrize] = useState<string>('الكل');

  // Top 3 winners for podium
  const topThree = mockWinners.slice(0, 3);
  const podiumOrder = [topThree[1], topThree[0], topThree[2]]; // 2nd, 1st, 3rd for visual layout

  // Get unique tracks
  const tracks = ['الكل', ...Array.from(new Set(mockWinners.map(w => w.track)))];
  const prizeOptions = ['الكل', 'جوائز مالية', 'Honorable Mention', 'بدون جائزة'];

  // Filter winners
  const filteredWinners = mockWinners.filter(winner => {
    const matchesSearch = winner.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         winner.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = selectedTrack === 'الكل' || winner.track === selectedTrack;
    const matchesPrize = selectedPrize === 'الكل' || 
                        (selectedPrize === 'جوائز مالية' && winner.prize && !winner.prize.includes('Honorable')) ||
                        (selectedPrize === 'Honorable Mention' && winner.prize?.includes('Honorable')) ||
                        (selectedPrize === 'بدون جائزة' && !winner.prize);
    
    return matchesSearch && matchesTrack && matchesPrize;
  });

  const handlePublishResults = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = () => {
    toast.success('تم نشر النتائج بنجاح', {
      description: 'تم إرسال إشعارات للمشاركين والرعاة',
      duration: 3000,
    });
    setShowPublishModal(false);
  };

  const handleSendEmails = () => {
    setShowEmailModal(true);
  };

  const confirmSendEmails = () => {
    const winnersWithPrizes = mockWinners.filter(w => w.prize);
    toast.success('تم إرسال الإيميلات بنجاح', {
      description: `تم إرسال ${winnersWithPrizes.length} رسائل تهنئة للفرق الفائزة`,
      duration: 3000,
    });
    setShowEmailModal(false);
  };

  const handleGenerateCertificates = () => {
    toast.success('جاري توليد الشهادات', {
      description: 'سيتم توليد الشهادات لجميع المشاركين تلقائياً',
      duration: 3000,
    });
  };

  const handleEditResults = () => {
    toast.info('تعديل النتائج', {
      description: 'يمكنك الآن تعديل النتائج والترتيب',
      duration: 2000,
    });
  };

  const totalPrizePool = mockWinners
    .filter(w => w.prize && !isNaN(parseFloat(w.prize.replace(/,/g, ''))))
    .reduce((sum, w) => sum + parseFloat(w.prize.replace(/,/g, '')), 0);

  const winnersCount = mockWinners.filter(w => w.prize).length;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to={`/admin/hackathon/${id}`}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  إعلان الفائزين والنتائج الفائزة
                </h1>
                <p className="text-sm text-gray-500">
                  قم بمراجعة وإعداد النتائج النهائية للفائزين وتوزيع الجوائز والشهادات للمشاركين
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendEmails}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                <Mail className="w-4 h-4" />
                إرسال رسائل تهنئة
              </button>
              <button
                onClick={handlePublishResults}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a41b42] text-white text-sm hover:bg-[#8b1538] transition-all shadow-lg shadow-[#a41b42]/30"
                style={{ fontWeight: 600 }}
              >
                <Send className="w-4 h-4" />
                نشر النتائج النهائية
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Promotion Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base mb-1" style={{ fontWeight: 700 }}>منصة التتويج</p>
                  <p className="text-sm opacity-90">احتفل بالفائزين واعرض إنجازاتهم</p>
                </div>
              </div>
            </div>

            {/* Winners Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {podiumOrder.map((winner, idx) => {
                const isFirst = winner.rank === 1;
                const isSecond = winner.rank === 2;
                const isThird = winner.rank === 3;
                
                return (
                  <div 
                    key={winner.id} 
                    className={`bg-white rounded-2xl border-2 p-6 text-center transition-all hover:shadow-xl ${
                      isFirst 
                        ? 'border-amber-400 shadow-lg shadow-amber-500/20 order-2' 
                        : isSecond 
                        ? 'border-gray-300 order-1' 
                        : 'border-orange-300 order-3'
                    }`}
                  >
                    {/* Badge */}
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm text-white mb-3 ${
                      isFirst ? 'bg-amber-500' : isSecond ? 'bg-gray-400' : 'bg-orange-400'
                    }`} style={{ fontWeight: 700 }}>
                      {winner.badge}
                    </div>
                    
                    {/* Avatar */}
                    <div className="relative inline-block mb-4">
                      <img 
                        src={winner.avatar} 
                        alt={winner.team}
                        className={`w-20 h-20 rounded-full object-cover border-4 ${
                          isFirst ? 'border-amber-400' : isSecond ? 'border-gray-300' : 'border-orange-300'
                        }`}
                      />
                      {isFirst && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                          <Crown className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Team Name */}
                    <h3 className="text-base text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                      {winner.team}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">{winner.project}</p>

                    {/* Prize */}
                    <div className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm ${
                      isFirst 
                        ? 'bg-amber-100 text-amber-700' 
                        : isSecond 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`} style={{ fontWeight: 700 }}>
                      {winner.prize} ريال
                    </div>

                    {/* Stars - Only for first place */}
                    {isFirst && (
                      <div className="flex items-center justify-center gap-1 mt-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* All Winners Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                    قائمة الفائزين والتفاصيل
                  </h3>
                  <span className="text-sm text-gray-500">
                    {filteredWinners.length} من {mockWinners.length} فريق
                  </span>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ابحث عن فريق أو مشروع..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Track Filter */}
                  <div className="relative">
                    <select
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white appearance-none cursor-pointer"
                      style={{ minWidth: '150px' }}
                    >
                      {tracks.map((track) => (
                        <option key={track} value={track}>
                          {track}
                        </option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Prize Filter */}
                  <div className="relative">
                    <select
                      value={selectedPrize}
                      onChange={(e) => setSelectedPrize(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white appearance-none cursor-pointer"
                      style={{ minWidth: '180px' }}
                    >
                      {prizeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Trophy className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                        الفريق
                      </th>
                      <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                        المسار
                      </th>
                      <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                        المسار الفرعي
                      </th>
                      <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                        النتيجة
                      </th>
                      <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                        الجائزة
                      </th>
                      <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWinners.map((winner, index) => (
                      <tr key={winner.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white ${
                              winner.rank === 1 ? 'bg-amber-500' : 
                              winner.rank === 2 ? 'bg-gray-400' : 
                              winner.rank === 3 ? 'bg-orange-400' : 
                              'bg-blue-500'
                            }`} style={{ fontWeight: 700 }}>
                              {winner.badge}
                            </div>
                            <div>
                              <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                                {winner.team}
                              </p>
                              <p className="text-xs text-gray-500">{winner.project}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{winner.track}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{winner.subTrack}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                            winner.score >= 95 ? 'bg-green-100 text-green-700' :
                            winner.score >= 90 ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`} style={{ fontWeight: 700 }}>
                            {winner.score}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {winner.prize ? (
                            winner.prize.includes('Honorable') ? (
                              <span className="text-sm text-purple-600" style={{ fontWeight: 600 }}>
                                {winner.prize}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                                {winner.prize} ريال
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={handleEditResults}
                              className="w-7 h-7 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons - REMOVED */}
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* Display Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  إعدادات العرض
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                      إظهار جوائز الفائزين
                    </p>
                    <p className="text-xs text-gray-500">
                      عرض قيمة الجوائز المالية للجميع
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWinnersPrizes(!showWinnersPrizes)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      showWinnersPrizes ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      showWinnersPrizes ? 'right-0.5' : 'right-5'
                    }`}></div>
                  </button>
                </div>

                <div className="h-px bg-gray-100"></div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                      إظهار معايير الحوافز
                    </p>
                    <p className="text-xs text-gray-500">
                      عرض معايير توزيع الحوافز
                    </p>
                  </div>
                  <button
                    onClick={() => setShowIncentiveCriteria(!showIncentiveCriteria)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      showIncentiveCriteria ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      showIncentiveCriteria ? 'right-0.5' : 'right-5'
                    }`}></div>
                  </button>
                </div>

                <div className="h-px bg-gray-100"></div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                      السماح بتحميل الشهادات
                    </p>
                    <p className="text-xs text-gray-500">
                      تفعيل تحميل الشهادات للمشاركين
                    </p>
                  </div>
                  <button
                    onClick={() => setAllowCertificateDownload(!allowCertificateDownload)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      allowCertificateDownload ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      allowCertificateDownload ? 'right-0.5' : 'right-5'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Prize Pool Info */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5" />
                <h3 className="text-sm" style={{ fontWeight: 700 }}>قيمة الجوائز</h3>
              </div>
              <p className="text-3xl mb-1" style={{ fontWeight: 700 }}>
                {totalPrizePool.toLocaleString()} ريال
              </p>
              <p className="text-sm opacity-90">إجمالي الجوائز</p>
            </div>

            {/* Winners Count */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>عدد الفائزين</span>
                </div>
                <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                  {winnersCount}
                </span>
              </div>
              <p className="text-xs text-gray-500">فريق حاز على جوائز</p>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>الحالة</span>
                </div>
                <span className="text-sm text-orange-600" style={{ fontWeight: 700 }}>
                  معلنة
                </span>
              </div>
            </div>

            {/* Generate Certificates Button */}
            <button
              onClick={handleGenerateCertificates}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
              style={{ fontWeight: 600 }}
            >
              <Upload className="w-4 h-4" />
              توليد الشهادات آلياً
            </button>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowPublishModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                نشر النتائج النهائية
              </h3>
              <p className="text-sm text-gray-600">
                هل أنت متأكد من نشر النتائج؟ سيتم إرسال إشعارات لجميع المشاركين والرعاة.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 mb-2" style={{ fontWeight: 600 }}>
                    سيتم تنفيذ الإجراءات التالية:
                  </p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                      إرسال إشعارات للفائزين
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                      نشر النتائج على الصفحة العامة
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                      إتاحة تحميل الشهادات
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538] transition-all"
                style={{ fontWeight: 600 }}
              >
                تأكيد النشر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                إرسال رسائل تهنئة
              </h3>
              <p className="text-sm text-gray-600">
                هل أنت متأكد من إرسال رسائل تهنئة للفائزين؟ سيتم إرسال رسائل تهنئة لجميع الفرق الفائزة عبر البريد الإلكتروني.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 mb-2" style={{ fontWeight: 600 }}>
                    سيتم تنفيذ الإجراءات التالية:
                  </p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                      إرسال رسائل تهنئة للفائزين
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={confirmSendEmails}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538] transition-all"
                style={{ fontWeight: 600 }}
              >
                تأكيد الإرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}