import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { 
  ArrowRight, 
  FileDown, 
  Users2, 
  X, 
  Eye, 
  FileText, 
  Video, 
  Link as LinkIcon,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  UserPlus,
  Mail,
  Edit,
  Trophy,
  BarChart3,
  Calendar,
  Filter,
  ChevronDown,
  Award,
  Target,
  Shield,
  Send,
  Check,
  XCircle,
  Star,
  MessageSquare,
  Settings,
  TrendingUp,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  team: string;
  track: string;
  trackId: number;
  time: string;
  stages: {
    total: number;
    completed: number;
  };
  status: 'completed' | 'inReview' | 'pending';
  score?: number;
  evaluations: number;
  totalEvaluators: number;
  hasFiles: boolean;
  hasLinks: boolean;
  description?: string;
  teamMembers?: string[];
  files?: {
    technical?: { name: string; size: string; url: string };
    presentation?: { name: string; size: string; url: string };
  };
  icon: string;
  color: string;
  judgeEvaluations?: JudgeEvaluation[];
}

interface JudgeEvaluation {
  judgeName: string;
  judgeAvatar: string;
  totalScore: number;
  criteriaScores: {
    criteriaName: string;
    score: number;
    maxScore: number;
  }[];
  comments: string;
  evaluatedAt: string;
}

interface Judge {
  id: number;
  name: string;
  email: string;
  avatar: string;
  specialty: string;
  assignedTrack: string;
  assignedProjects: number;
  evaluatedProjects: number;
  totalProjects: number;
  status: 'active' | 'pending' | 'inactive';
  projects?: string[];
}

interface EvaluationCriteria {
  id: number;
  name: string;
  description: string;
  weight: number;
}

interface Track {
  id: number;
  name: string;
  color: string;
}

const mockTracks: Track[] = [
  { id: 1, name: 'الذكاء الاصطناعي', color: 'blue' },
  { id: 2, name: 'الاستدامة البيئية', color: 'green' },
  { id: 3, name: 'الصحة الرقمية', color: 'purple' }
];

const mockJudgeEvaluations: JudgeEvaluation[] = [
  {
    judgeName: 'د. أحمد خالد',
    judgeAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    totalScore: 92,
    criteriaScores: [
      { criteriaName: 'الابتكار والإبداع', score: 23, maxScore: 25 },
      { criteriaName: 'التنفيذ التقني', score: 24, maxScore: 25 },
      { criteriaName: 'تأثير الحل', score: 18, maxScore: 20 },
      { criteriaName: 'العرض التقديمي', score: 14, maxScore: 15 },
      { criteriaName: 'إمكانية التطبيق', score: 13, maxScore: 15 }
    ],
    comments: 'مشروع متميز جداً، الفكرة مبتكرة والتنفيذ احترافي. يحتاج لتحسين في جانب العرض التقديمي فقط.',
    evaluatedAt: '2 مارس 2026'
  },
  {
    judgeName: 'سارة المنصور',
    judgeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    totalScore: 90,
    criteriaScores: [
      { criteriaName: 'الابتكار والإبداع', score: 22, maxScore: 25 },
      { criteriaName: 'التنفيذ التقني', score: 23, maxScore: 25 },
      { criteriaName: 'تأثير الحل', score: 19, maxScore: 20 },
      { criteriaName: 'العرض التقديمي', score: 13, maxScore: 15 },
      { criteriaName: 'إمكانية التطبيق', score: 13, maxScore: 15 }
    ],
    comments: 'حل ممتاز للمشكلة المطروحة، التطبيق التقني قوي جداً وواضح أن الفريق بذل جهد كبير.',
    evaluatedAt: '2 مارس 2026'
  },
  {
    judgeName: 'د. فهد العتيبي',
    judgeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    totalScore: 94,
    criteriaScores: [
      { criteriaName: 'الابتكار والإبداع', score: 24, maxScore: 25 },
      { criteriaName: 'التنفيذ التقني', score: 24, maxScore: 25 },
      { criteriaName: 'تأثير الحل', score: 19, maxScore: 20 },
      { criteriaName: 'العرض التقديمي', score: 14, maxScore: 15 },
      { criteriaName: 'إمكانية التطبيق', score: 13, maxScore: 15 }
    ],
    comments: 'من أفضل المشاريع التي رأيتها! الابتكار واضح والتنفيذ احترافي للغاية.',
    evaluatedAt: '2 مارس 2026'
  }
];

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'نظام فارز لتنظيف النفايات',
    team: 'فريق صفارة',
    track: 'الذكاء الاصطناعي',
    trackId: 1,
    time: 'قبل 10:45 ص',
    stages: { total: 3, completed: 3 },
    status: 'completed',
    score: 92,
    evaluations: 3,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: true,
    description: 'نظام يعتمد على الذكاء الاصطناعي لتصنيف النفايات البلاستيكية بدقة ويمكن تركيبه في مراكز فرز أو دمجه مع شاحنات النفايات.',
    teamMembers: ['أحمد خالد', 'سارة المنصور', 'فهد العتيبي'],
    files: {
      technical: { name: 'نموذج تقني.pdf', size: '2.4 MB', url: '#' },
      presentation: { name: 'عرض تقديمي.mp4', size: '15.2 MB', url: '#' }
    },
    icon: 'A',
    color: 'bg-blue-500',
    judgeEvaluations: mockJudgeEvaluations
  },
  {
    id: 2,
    name: 'منصة التعليم الرقمي',
    team: 'فريق المستقبل',
    track: 'الذكاء الاصطناعي',
    trackId: 1,
    time: 'قبل 09:12 ص',
    stages: { total: 3, completed: 3 },
    status: 'inReview',
    evaluations: 1,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: true,
    description: 'منصة تعليمية تفاعلية تستخدم الواقع الافتراضي',
    teamMembers: ['محمد الحربي', 'نورة القحطاني'],
    icon: 'S',
    color: 'bg-orange-500'
  },
  {
    id: 3,
    name: 'تطبيق مزارع ذكي',
    team: 'إيثار الأرض',
    track: 'الاستدامة البيئية',
    trackId: 2,
    time: 'أمس 11:30 م',
    stages: { total: 3, completed: 3 },
    status: 'completed',
    score: 88,
    evaluations: 3,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: false,
    description: 'تطبيق ذكي لمساعدة المزارعين',
    teamMembers: ['عبدالله فهد', 'ريم الشريف', 'خالد العتيبي'],
    icon: 'M',
    color: 'bg-purple-500',
    judgeEvaluations: mockJudgeEvaluations.map(j => ({ ...j, totalScore: 88 }))
  },
  {
    id: 4,
    name: 'المستشار الطبي الافتراضي',
    team: 'فريق الصحة',
    track: 'الصحة الرقمية',
    trackId: 3,
    time: 'أمس 08:20 م',
    stages: { total: 3, completed: 0 },
    status: 'pending',
    evaluations: 0,
    totalEvaluators: 3,
    hasFiles: false,
    hasLinks: false,
    description: 'مساعد طبي افتراضي',
    teamMembers: ['هند المطيري'],
    icon: 'H',
    color: 'bg-cyan-500'
  },
  {
    id: 5,
    name: 'نظام الطاقة الشمسية الذكي',
    team: 'فريق الطاقة',
    track: 'الاستدامة البيئية',
    trackId: 2,
    time: 'أمس 07:15 م',
    stages: { total: 3, completed: 3 },
    status: 'completed',
    score: 95,
    evaluations: 3,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: true,
    icon: 'E',
    color: 'bg-green-500',
    judgeEvaluations: mockJudgeEvaluations.map(j => ({ ...j, totalScore: 95 }))
  },
  {
    id: 6,
    name: 'تطبيق التشخيص المبكر',
    team: 'فريق الابتكار الطبي',
    track: 'الصحة الرقمية',
    trackId: 3,
    time: 'أمس 06:30 م',
    stages: { total: 3, completed: 3 },
    status: 'completed',
    score: 90,
    evaluations: 3,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: true,
    icon: 'D',
    color: 'bg-pink-500',
    judgeEvaluations: mockJudgeEvaluations.map(j => ({ ...j, totalScore: 90 }))
  },
  {
    id: 7,
    name: 'منصة التجارة الذكية',
    team: 'فريق التجارة',
    track: 'الذكاء الاصطناعي',
    trackId: 1,
    time: 'أمس 05:00 م',
    stages: { total: 3, completed: 3 },
    status: 'completed',
    score: 85,
    evaluations: 3,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: true,
    icon: 'T',
    color: 'bg-indigo-500',
    judgeEvaluations: mockJudgeEvaluations.map(j => ({ ...j, totalScore: 85 }))
  },
  {
    id: 8,
    name: 'نظام إدارة المخلفات الطبية',
    team: 'فريق البيئة الطبية',
    track: 'الصحة الرقمية',
    trackId: 3,
    time: 'أمس 04:30 م',
    stages: { total: 3, completed: 3 },
    status: 'completed',
    score: 87,
    evaluations: 3,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: false,
    icon: 'W',
    color: 'bg-teal-500',
    judgeEvaluations: mockJudgeEvaluations.map(j => ({ ...j, totalScore: 87 }))
  },
  {
    id: 9,
    name: 'حل إعادة التدوير الذكي',
    team: 'فريق الاستدامة',
    track: 'الاستدامة البيئية',
    trackId: 2,
    time: 'أمس 03:00 م',
    stages: { total: 3, completed: 3 },
    status: 'completed',
    score: 82,
    evaluations: 3,
    totalEvaluators: 3,
    hasFiles: true,
    hasLinks: true,
    icon: 'R',
    color: 'bg-lime-500',
    judgeEvaluations: mockJudgeEvaluations.map(j => ({ ...j, totalScore: 82 }))
  }
];

const mockJudges: Judge[] = [
  {
    id: 1,
    name: 'د. أحمد خالد',
    email: 'ahmed@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    specialty: 'الذكاء الاصطناعي',
    assignedTrack: 'الذكاء الاصطناعي',
    assignedProjects: 3,
    evaluatedProjects: 3,
    totalProjects: 3,
    status: 'active',
    projects: ['نظام فارز لتنظيف النفايات', 'منصة التعليم الرقمي', 'منصة التجارة الذكية']
  },
  {
    id: 2,
    name: 'سارة المنصور',
    email: 'sara@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    specialty: 'الاستدامة البيئية',
    assignedTrack: 'الاستدامة البيئية',
    assignedProjects: 3,
    evaluatedProjects: 3,
    totalProjects: 3,
    status: 'active',
    projects: ['تطبيق مزارع ذكي', 'نظام الطاقة الشمسية الذكي', 'حل إعادة التدوير الذكي']
  },
  {
    id: 3,
    name: 'د. فهد العتيبي',
    email: 'fahad@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    specialty: 'الصحة الرقمية',
    assignedTrack: 'الصحة الرقمية',
    assignedProjects: 2,
    evaluatedProjects: 2,
    totalProjects: 2,
    status: 'active',
    projects: ['تطبيق التشخيص المبكر', 'نظام إدارة المخلفات الطبية']
  },
  {
    id: 4,
    name: 'نورة القحطاني',
    email: 'norah@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    specialty: 'تطوير المنتجات',
    assignedTrack: 'جميع المسارات',
    assignedProjects: 0,
    evaluatedProjects: 0,
    totalProjects: 0,
    status: 'pending',
    projects: []
  }
];

const mockCriteria: EvaluationCriteria[] = [
  { id: 1, name: 'الابتكار والإبداع', description: 'مدى ابتكار الفكرة وتفردها', weight: 25 },
  { id: 2, name: 'التنفيذ التقني', description: 'جودة التطبيق التقني والبرمجة', weight: 25 },
  { id: 3, name: 'تأثير الحل', description: 'مدى تأثير الحل على المشكلة المستهدفة', weight: 20 },
  { id: 4, name: 'العرض التقديمي', description: 'جودة العرض التقديمي والتواصل', weight: 15 },
  { id: 5, name: 'إمكانية التطبيق', description: 'قابلية الحل للتطبيق في الواقع', weight: 15 }
];

export function HackathonProjects() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'submitted' | 'judges'>('submitted');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAddJudgeModal, setShowAddJudgeModal] = useState(false);
  const [showEditCriteriaModal, setShowEditCriteriaModal] = useState(false);
  const [showEditDeadlineModal, setShowEditDeadlineModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showEvaluationDetailsModal, setShowEvaluationDetailsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'inReview' | 'pending'>('all');
  const [filterTrack, setFilterTrack] = useState<number | 'all'>('all');
  const [showEvaluationsToParticipants, setShowEvaluationsToParticipants] = useState(false);

  // Mock dates
  const submissionStart = '1 مارس 2026، 12:00 ص';
  const submissionEnd = '5 مارس 2026، 11:59 م';
  const evaluationStart = '6 مارس 2026، 12:00 ص';
  const evaluationEnd = '10 مارس 2026، 11:59 م';

  const handleDistributeProjects = () => {
    setShowDistributeModal(true);
  };

  const confirmDistribution = () => {
    toast.success('تم التوزيع بنجاح', {
      description: 'تم توزيع المشاريع على الحكام حسب التخصص',
      duration: 3000,
    });
    setShowDistributeModal(false);
  };

  const handleExportData = () => {
    toast.success('جاري التصدير...', {
      description: 'سيتم تحميل ملف Excel قريباً',
      duration: 3000,
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowDrawer(true);
  };

  const handleViewEvaluationDetails = (project: Project) => {
    setSelectedProject(project);
    setShowEvaluationDetailsModal(true);
  };

  const handleSendReminder = (judgeName: string) => {
    toast.success('تم إرسال التذكير', {
      description: `تم إرسال تذكير بالبريد الإلكتروني إلى ${judgeName}`,
      duration: 3000,
    });
  };

  const handleInviteJudge = () => {
    toast.success('تم إرسال الدعوة', {
      description: 'تم إرسال دعوة للحكم الجديد عبر البريد الإلكتروني',
      duration: 3000,
    });
    setShowAddJudgeModal(false);
  };

  const handleUpdateCriteria = () => {
    toast.success('تم تحديث المعايير', {
      description: 'تم حفظ التغييرات على معايير التقييم',
      duration: 3000,
    });
    setShowEditCriteriaModal(false);
  };

  const handleUpdateDeadline = () => {
    toast.success('تم تحديث المواعيد', {
      description: 'تم حفظ التغييرات على مواعيد التسليم والتقييم',
      duration: 3000,
    });
    setShowEditDeadlineModal(false);
  };

  const handleUpdateSettings = () => {
    toast.success('تم حفظ الإعدادات', {
      description: 'تم تحديث إعدادات الخصوصية بنجاح',
      duration: 3000,
    });
    setShowSettingsModal(false);
  };

  const getStatusBadge = (status: Project['status']) => {
    const config = {
      completed: { text: 'مكتمل التقييم', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      inReview: { text: 'قيد التقييم', color: 'bg-blue-100 text-blue-700', icon: Clock },
      pending: { text: 'لم يُسلم', color: 'bg-gray-100 text-gray-600', icon: XCircle }
    };
    const { text, color, icon: Icon } = config[status];
    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${color}`} style={{ fontWeight: 600 }}>
        <Icon className="w-3.5 h-3.5" />
        {text}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-[#8b1538]';
  };

  const getTrackColor = (trackName: string) => {
    const track = mockTracks.find(t => t.name === trackName);
    if (!track) return 'bg-gray-100 text-gray-700';
    const colors: any = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700'
    };
    return colors[track.color] || 'bg-gray-100 text-gray-700';
  };

  const filteredProjects = mockProjects.filter(p => {
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    const trackMatch = filterTrack === 'all' || p.trackId === filterTrack;
    return statusMatch && trackMatch;
  });

  const totalProjects = mockProjects.length;
  const completedProjects = mockProjects.filter(p => p.status === 'completed').length;
  const inReviewProjects = mockProjects.filter(p => p.status === 'inReview').length;
  const pendingProjects = mockProjects.filter(p => p.status === 'pending').length;

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
                  إدارة المشاريع والتحكيم
                </h1>
                <p className="text-sm text-gray-500">
                  نظّم الأفكار وقيّم وتابع المشاريع عبر نظام التحكيم
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                <Settings className="w-4 h-4" />
                إعدادات التقييم
              </button>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                <FileDown className="w-4 h-4" />
                تصدير بيانات الفرق
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('submitted')}
            className={`pb-3 text-sm transition-all relative ${
              activeTab === 'submitted'
                ? 'text-[#a41b42]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            style={{ fontWeight: 600 }}
          >
            المشاريع المسلّمة
            {activeTab === 'submitted' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a41b42]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('judges')}
            className={`pb-3 text-sm transition-all relative ${
              activeTab === 'judges'
                ? 'text-[#a41b42]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            style={{ fontWeight: 600 }}
          >
            إدارة الحكام والمتابعة
            {activeTab === 'judges' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a41b42]"></div>
            )}
          </button>
        </div>

        {/* Tab: Submitted Projects */}
        {activeTab === 'submitted' && (
          <>
            {/* Submission Timeline */}
            <div className="bg-gradient-to-br from-[#a41b42] to-[#c74543] rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm opacity-90">فتح التسليم</span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>{submissionStart}</p>
                  </div>
                  <div className="w-px h-12 bg-white/30"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm opacity-90">إغلاق التسليم</span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>{submissionEnd}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditDeadlineModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <Edit className="w-4 h-4" />
                  تعديل المواعيد
                </button>
              </div>
            </div>

            {/* Filters & Distribution */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="appearance-none flex items-center gap-2 px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="completed">مكتمل التقييم</option>
                    <option value="inReview">قيد التقييم</option>
                    <option value="pending">لم يُسلم</option>
                  </select>
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={filterTrack}
                    onChange={(e) => setFilterTrack(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="appearance-none flex items-center gap-2 px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="all">جميع المسارات</option>
                    {mockTracks.map(track => (
                      <option key={track.id} value={track.id}>{track.name}</option>
                    ))}
                  </select>
                  <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <button
                onClick={handleDistributeProjects}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a41b42] text-white text-sm hover:bg-[#8b1538] transition-all shadow-lg shadow-[#a41b42]/30"
                style={{ fontWeight: 600 }}
              >
                <Users2 className="w-4 h-4" />
                توزيع المشاريع على الحكام
              </button>
            </div>

            {/* Projects Stats - Interactive */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => setFilterStatus('all')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'all' 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'border-gray-100 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {totalProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">إجمالي المشاريع</p>
              </button>
              
              <button
                onClick={() => setFilterStatus('completed')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'completed' 
                    ? 'border-green-500 shadow-lg shadow-green-500/20' 
                    : 'border-gray-100 hover:border-green-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {completedProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">مكتمل التقييم</p>
              </button>
              
              <button
                onClick={() => setFilterStatus('inReview')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'inReview' 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20' 
                    : 'border-gray-100 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {inReviewProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">قيد التقييم</p>
              </button>
              
              <button
                onClick={() => setFilterStatus('pending')}
                className={`text-right bg-white rounded-2xl border p-5 transition-all ${
                  filterStatus === 'pending' 
                    ? 'border-gray-500 shadow-lg shadow-gray-500/20' 
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {pendingProjects}
                  </span>
                </div>
                <p className="text-sm text-gray-600">لم يُسلم بعد</p>
              </button>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      اسم المشروع
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      المسار
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      الفريق
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      وقت التسليم
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      الملفات
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      التقييمات
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>
                      الحالة
                    </th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${project.color} text-white flex items-center justify-center text-sm`} style={{ fontWeight: 700 }}>
                            {project.icon}
                          </div>
                          <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                            {project.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs ${getTrackColor(project.track)}`} style={{ fontWeight: 600 }}>
                          {project.track}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{project.team}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{project.time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {project.hasFiles && (
                            <button className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {project.hasLinks && (
                            <button className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                              <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!project.hasFiles && !project.hasLinks && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {project.status === 'completed' ? (
                          <button
                            onClick={() => handleViewEvaluationDetails(project)}
                            className="flex items-center gap-2 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <span className={`text-lg ${getScoreColor(project.score || 0)}`} style={{ fontWeight: 700 }}>
                              {project.score}/100
                            </span>
                            <span className="text-xs text-gray-400">({project.evaluations}/{project.totalEvaluators})</span>
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        ) : project.status === 'inReview' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-600" style={{ fontWeight: 600 }}>قيد التقييم</span>
                            <span className="text-xs text-gray-400">({project.evaluations}/{project.totalEvaluators})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewProject(project)}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-[#a41b42] hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab: Judges Management */}
        {activeTab === 'judges' && (
          <>
            {/* Evaluation Timeline */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm opacity-90">بداية التقييم</span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>{evaluationStart}</p>
                  </div>
                  <div className="w-px h-12 bg-white/30"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4" />
                      <span className="text-sm opacity-90">نهاية التقييم</span>
                    </div>
                    <p className="text-base" style={{ fontWeight: 700 }}>{evaluationEnd}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditDeadlineModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <Edit className="w-4 h-4" />
                  تعديل المواعيد
                </button>
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                      معايير التقييم
                    </h3>
                    <p className="text-xs text-gray-500">المعايير المستخدمة لتقييم المشاريع</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditCriteriaModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <Shield className="w-4 h-4" />
                  <Edit className="w-4 h-4" />
                  تعديل المعايير
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {mockCriteria.map((criteria) => (
                  <div key={criteria.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                          {criteria.name}
                        </p>
                        <span className="text-sm text-[#a41b42]" style={{ fontWeight: 700 }}>
                          {criteria.weight}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{criteria.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Judges List */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                قائمة الحكام ({mockJudges.length})
              </h3>
              <button
                onClick={() => setShowAddJudgeModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white text-sm hover:bg-[#8b1538] transition-all"
                style={{ fontWeight: 600 }}
              >
                <UserPlus className="w-4 h-4" />
                إضافة حكم جديد
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {mockJudges.map((judge) => (
                <div key={judge.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={judge.avatar}
                        alt={judge.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                            {judge.name}
                          </p>
                          {judge.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs" style={{ fontWeight: 600 }}>
                              نشط
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs" style={{ fontWeight: 600 }}>
                              قيد الانتظار
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{judge.email}</p>
                        <p className="text-xs text-gray-600">تخصص: {judge.specialty}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendReminder(judge.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-xs hover:bg-blue-50 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      تذكير
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">المسار المخصص:</span>
                      <span className="text-gray-900" style={{ fontWeight: 600 }}>{judge.assignedTrack}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">إنجاز التقييم</span>
                        <span className={`text-xs ${judge.evaluatedProjects >= judge.totalProjects ? 'text-green-600' : 'text-orange-600'}`} style={{ fontWeight: 700 }}>
                          {judge.evaluatedProjects}/{judge.totalProjects} مشروع
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            judge.evaluatedProjects >= judge.totalProjects ? 'bg-green-600' : 'bg-orange-500'
                          }`}
                          style={{ width: `${judge.totalProjects > 0 ? (judge.evaluatedProjects / judge.totalProjects) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {judge.projects && judge.projects.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">المشاريع المخصصة:</p>
                        <div className="space-y-1">
                          {judge.projects.map((project, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                              <span>{project}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Project Details Drawer */}
      {showDrawer && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowDrawer(false)}>
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                  {selectedProject.name}
                </h2>
                <p className="text-sm text-gray-500">فريق {selectedProject.team}</p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                  وصف المشروع
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              <div>
                <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
                  أعضاء الفريق
                </h3>
                <div className="space-y-2">
                  {selectedProject.teamMembers?.map((member, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span>{member}</span>
                      {index === 0 && <span className="text-xs text-gray-500">(قائد الفريق)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {selectedProject.files && (
                <div>
                  <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
                    الملفات المرفقة
                  </h3>
                  <div className="space-y-3">
                    {selectedProject.files.technical && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#fef2f4] border border-[#fce7eb]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#fce7eb] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#8b1538]" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                              {selectedProject.files.technical.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedProject.files.technical.size}
                            </p>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg bg-white hover:bg-[#fef2f4] flex items-center justify-center transition-colors">
                          <Eye className="w-4 h-4 text-[#8b1538]" />
                        </button>
                      </div>
                    )}
                    {selectedProject.files.presentation && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Video className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                              {selectedProject.files.presentation.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedProject.files.presentation.size}
                            </p>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg bg-white hover:bg-blue-50 flex items-center justify-center transition-colors">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
                  حالة التقييم
                </h3>
                <div className="space-y-2">
                  {mockJudges.slice(0, 3).map((judge, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2">
                        <img src={judge.avatar} alt={judge.name} className="w-8 h-8 rounded-full" />
                        <span className="text-sm text-gray-700">{judge.name}</span>
                      </div>
                      {selectedProject.status === 'completed' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDrawer(false);
                  if (selectedProject.status === 'completed') {
                    handleViewEvaluationDetails(selectedProject);
                  } else {
                    toast.info('لم يتم تقييم المشروع بعد');
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538] transition-all"
                style={{ fontWeight: 600 }}
              >
                {selectedProject.status === 'completed' ? 'عرض تفاصيل التقييم' : 'فتح ملف المشروع كامل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Details Modal */}
      {showEvaluationDetailsModal && selectedProject && selectedProject.judgeEvaluations && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEvaluationDetailsModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تفاصيل التقييم</h3>
                <p className="text-sm text-gray-500">{selectedProject.name}</p>
              </div>
              <button onClick={() => setShowEvaluationDetailsModal(false)} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
                <p className="text-sm opacity-90 mb-2">التقييم النهائي</p>
                <p className="text-5xl mb-2" style={{ fontWeight: 700 }}>{selectedProject.score}</p>
                <p className="text-sm opacity-90">من 100</p>
              </div>

              {/* Judge Evaluations */}
              {selectedProject.judgeEvaluations.map((evaluation, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={evaluation.judgeAvatar} alt={evaluation.judgeName} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{evaluation.judgeName}</p>
                      <p className="text-xs text-gray-500">تم التقييم في {evaluation.evaluatedAt}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl ${getScoreColor(evaluation.totalScore)}`} style={{ fontWeight: 700 }}>
                        {evaluation.totalScore}
                      </p>
                      <p className="text-xs text-gray-500">من 100</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {evaluation.criteriaScores.map((criteria, cIdx) => (
                      <div key={cIdx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{criteria.criteriaName}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900 w-16 text-left" style={{ fontWeight: 600 }}>
                            {criteria.score}/{criteria.maxScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-900 mb-1" style={{ fontWeight: 600 }}>ملاحظات الحكم</p>
                        <p className="text-sm text-blue-800">{evaluation.comments}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>إعدادات التقييم</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                      إظهار تفاصيل التقييم للمشاركين
                    </p>
                    <p className="text-xs text-gray-500">
                      السماح للفرق برؤية ملاحظات الحكام والدرجات التفصيلية
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEvaluationsToParticipants(!showEvaluationsToParticipants)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      showEvaluationsToParticipants ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      showEvaluationsToParticipants ? 'right-0.5' : 'right-6'
                    }`}></div>
                  </button>
                </div>
                {showEvaluationsToParticipants ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                    <Eye className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800">
                      سيتمكن المشاركون من رؤية تفاصيل التقييم الكاملة
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-100 border border-gray-200">
                    <EyeOff className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700">
                      سيرى المشاركون التقييم النهائي فقط بدون التفاصيل
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                إلغاء
              </button>
              <button onClick={handleUpdateSettings} className="flex-1 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538]">
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Judge Modal */}
      {showAddJudgeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowAddJudgeModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>دعوة حكم جديد</h3>
              <button onClick={() => setShowAddJudgeModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>الاسم الكامل</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]" placeholder="أدخل اسم الحكم" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>البريد الإلكتروني</label>
                <input type="email" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]" placeholder="judge@example.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>التخصص</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]" placeholder="مثال: الذكاء الاصطناعي" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>المسار المخصص</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]">
                  <option>اختر المسار</option>
                  {mockTracks.map(track => (
                    <option key={track.id} value={track.id}>{track.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setShowAddJudgeModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                إلغاء
              </button>
              <button onClick={handleInviteJudge} className="flex-1 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538] flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                إرسال الدعوة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Criteria Modal */}
      {showEditCriteriaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEditCriteriaModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تعديل معايير التقييم</h3>
              </div>
              <button onClick={() => setShowEditCriteriaModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-900" style={{ fontWeight: 600 }}>تنبيه: صلاحيات محدودة</p>
                <p className="text-xs text-yellow-700 mt-1">فقط المنظم الأساسي والمدراء يمكنهم تعديل معايير التقييم</p>
              </div>
            </div>

            <div className="space-y-4">
              {mockCriteria.map((criteria, index) => (
                <div key={criteria.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <input type="text" defaultValue={criteria.name} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm" style={{ fontWeight: 600 }} />
                    <input type="number" defaultValue={criteria.weight} className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-center ml-3" style={{ fontWeight: 600 }} />
                  </div>
                  <textarea defaultValue={criteria.description} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm" rows={2} />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setShowEditCriteriaModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                إلغاء
              </button>
              <button onClick={handleUpdateCriteria} className="flex-1 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538]">
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deadline Modal */}
      {showEditDeadlineModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEditDeadlineModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تعديل المواعيد</h3>
              <button onClick={() => setShowEditDeadlineModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>بداية فتح التسليم</label>
                <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>نهاية التسليم</label>
                <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]" />
              </div>
              <div className="h-px bg-gray-200 my-4"></div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>بداية التقييم</label>
                <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>نهاية التقييم</label>
                <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#a41b42]" />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setShowEditDeadlineModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                إلغاء
              </button>
              <button onClick={handleUpdateDeadline} className="flex-1 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538]">
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Projects Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowDistributeModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Users2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>توزيع المشاريع تلقائياً</h3>
              <p className="text-sm text-gray-600">سيتم توزيع المشاريع على الحكام حسب تخصص كل حكم ومساره المخصص</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">عدد المشاريع المسلّمة:</span>
                <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{mockProjects.filter(p => p.status !== 'pending').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">عدد الحكام النشطين:</span>
                <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{mockJudges.filter(j => j.status === 'active').length}</span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>توزيع المشاريع المقترح:</h4>
              <div className="space-y-3">
                {mockJudges.filter(j => j.status === 'active').map((judge) => {
                  const trackProjects = mockProjects.filter(p => 
                    p.track === judge.assignedTrack && p.status !== 'pending'
                  );
                  const projectsPerJudge = trackProjects.length;

                  return (
                    <div key={judge.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <img src={judge.avatar} alt={judge.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{judge.name}</p>
                          <p className="text-xs text-gray-500">{judge.assignedTrack}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg text-blue-600" style={{ fontWeight: 700 }}>{projectsPerJudge}</p>
                        <p className="text-xs text-gray-500">مشروع</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setShowDistributeModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                إلغاء
              </button>
              <button onClick={confirmDistribution} className="flex-1 px-4 py-2.5 rounded-xl bg-[#a41b42] text-white hover:bg-[#8b1538]">
                تأكيد التوزيع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
