import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowRight,
  Plus,
  Edit,
  MessageCircle,
  CheckCircle,
  Clock,
  Package,
  X,
  FileText,
  AlertCircle,
  TrendingUp,
  Send,
  DollarSign,
  Calendar,
  Building2,
  Upload,
  CheckCircle2,
  Edit3,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

type NegotiationStep = 'negotiation' | 'review' | 'organizer_sign' | 'sponsor_sign' | 'completed';

type SponsorshipType = 'financial' | 'hospitality' | 'logistics' | 'technical' | 'media' | 'other';

interface SponsorRequest {
  id: number;
  companyName: string;
  companyLogo: string;
  package: string;
  subCategory: string;
  sponsorshipType: SponsorshipType;
  amount?: number;
  value: string; // Display value (e.g., "150,000 ر.س" or "خدمات ضيافة كاملة")
  status: 'pending' | 'negotiating' | 'contract_review' | 'organizer_signing' | 'sponsor_signing' | 'completed' | 'rejected';
  submittedDate: string;
  negotiationStep?: NegotiationStep;
  lastMessage?: string;
  unreadMessages?: number;
}

interface Message {
  from: 'org' | 'sponsor';
  text: string;
  time: string;
}

interface Conversation {
  requestId: number;
  messages: Message[];
}

const mockRequests: SponsorRequest[] = [
  {
    id: 1,
    companyName: 'مايكروسوفت',
    companyLogo: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=100&h=100&fit=crop',
    package: 'ذهبي',
    subCategory: 'رعاية حصرية',
    sponsorshipType: 'financial',
    amount: 85000,
    value: '85,000 ر.س',
    status: 'pending',
    submittedDate: '2024-01-15',
  },
  {
    id: 2,
    companyName: 'شركة stc',
    companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    package: 'ماسي',
    subCategory: 'شريك استراتيجي',
    sponsorshipType: 'logistics',
    value: 'خدمات نقل ولوجستيات كاملة',
    status: 'pending',
    submittedDate: '2024-01-20',
  },
  {
    id: 3,
    companyName: 'أرامكو السعودية',
    companyLogo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=100&fit=crop',
    package: 'بلاتيني',
    subCategory: 'رعاية شاملة',
    sponsorshipType: 'financial',
    amount: 200000,
    value: '200,000 ر.س',
    status: 'pending',
    submittedDate: '2024-01-10',
  },
  {
    id: 4,
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&h=100&fit=crop',
    package: 'ماسي',
    subCategory: 'رعاية تقنية',
    sponsorshipType: 'technical',
    value: 'خوادم سحابية + أدوات تطوير',
    status: 'pending',
    submittedDate: '2024-01-05',
  },
  {
    id: 5,
    companyName: 'فندق ريتز كارلتون',
    companyLogo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
    package: 'بلاتيني',
    subCategory: 'رعاية ضيافة',
    sponsorshipType: 'hospitality',
    value: 'ضيافة كاملة + إقامة فندقية',
    status: 'pending',
    submittedDate: '2024-01-12',
  },
  {
    id: 6,
    companyName: 'قناة العربية',
    companyLogo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&h=100&fit=crop',
    package: 'فضي',
    subCategory: 'رعاية إعلامية',
    sponsorshipType: 'media',
    value: 'تغطية إعلامية شاملة',
    status: 'pending',
    submittedDate: '2024-01-18',
  },
  {
    id: 7,
    companyName: 'AWS',
    companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    package: 'ذهبي',
    subCategory: 'رعاية تقنية',
    sponsorshipType: 'technical',
    amount: 50000,
    value: '50,000 ر.س + خدمات سحابية',
    status: 'pending',
    submittedDate: '2024-01-22',
  },
  {
    id: 8,
    companyName: 'سبيماكو للمأكولات',
    companyLogo: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100&h=100&fit=crop',
    package: 'فضي',
    subCategory: 'رعاية ضيافة',
    sponsorshipType: 'hospitality',
    value: 'وجبات ومشروبات للمشاركين',
    status: 'pending',
    submittedDate: '2024-01-25',
  },
];

const packages = [
  { id: 1, name: 'ماسي', price: 150000, benefits: ['جناح VIP', 'شعار كبير', 'كلمة افتتاحية', '10 تذاكر'], color: 'cyan' },
  { id: 2, name: 'بلاتيني', price: 100000, benefits: ['جناح خاص', 'شعار متوسط', 'جلسة توضيحية', '7 تذاكر'], color: 'purple' },
  { id: 3, name: 'ذهبي', price: 75000, benefits: ['طاولة', 'شعار صغير', '5 تذاكر'], color: 'amber' },
  { id: 4, name: 'فضي', price: 50000, benefits: ['لوحة إعلانية', '3 تذاكر'], color: 'gray' },
];

const termDefs = [
  { label: 'مدة الرعاية', value: '6 أشهر', icon: Clock, editable: true },
  { label: 'قيمة الرعاية', value: '50,000 ر.س', icon: DollarSign, editable: true },
  { label: 'حقوق الشعار', value: 'مستوى أول — رقمي وفعلي', icon: Building2, editable: true },
  { label: 'وقت العرض', value: '10 دقائق', icon: Clock, editable: true },
  { label: 'وصول لبيانات المشاركين', value: 'نعم، مجهولة الهوية', icon: AlertCircle, editable: false },
  { label: 'تاريخ بدء الفعالية', value: '15 مارس 2025', icon: Calendar, editable: false },
];

export function HackathonSponsors() {
  const { id } = useParams();
  const [mainTab, setMainTab] = useState<'requests' | 'negotiations'>('requests');
  const [requests, setRequests] = useState<SponsorRequest[]>(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<SponsorRequest | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showEditPackage, setShowEditPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [termValues, setTermValues] = useState(termDefs.map((t) => t.value));
  const [editingTerm, setEditingTerm] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Get current conversation
  const currentConversation = conversations.find(c => c.requestId === selectedRequest?.id);
  const currentMessages = currentConversation?.messages || [];

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPackage = packageFilter === 'all' || req.package === packageFilter;
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesPackage && matchesStatus;
  });

  // Get conversations for negotiations tab
  const activeConversations = requests.filter(r => 
    ['negotiating', 'contract_review', 'organizer_signing', 'sponsor_signing', 'completed'].includes(r.status)
  );

  const totalAmount = requests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const confirmedAmount = requests
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const negotiatingCount = activeConversations.length;

  const handleStartNegotiation = (request: SponsorRequest) => {
    // Update request status
    const updatedRequests = requests.map(r => 
      r.id === request.id 
        ? { ...r, status: 'negotiating' as const, negotiationStep: 'negotiation' as const }
        : r
    );
    setRequests(updatedRequests);
    
    // Create initial conversation
    const initialMessages: Message[] = [
      { from: 'sponsor', text: `أهلاً! نود التقديم على باقة ${request.package} للرعاية.`, time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) },
    ];
    
    setConversations([...conversations, { requestId: request.id, messages: initialMessages }]);
    setSelectedRequest({ ...request, status: 'negotiating', negotiationStep: 'negotiation' });
    setMainTab('negotiations');
    
    toast.success('تم بدء المفاوضات', {
      description: `تم فتح قناة المفاوضات مع ${request.companyName}`,
      duration: 3000,
    });

    // Auto response from sponsor
    setTimeout(() => {
      const autoResponse: Message = {
        from: 'sponsor',
        text: 'نحن متحمسون للشراكة معكم. هل يمكنكم مشاركة تفاصيل أكثر عن الفوائد المتاحة؟',
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      
      setConversations(prev => prev.map(conv => 
        conv.requestId === request.id 
          ? { ...conv, messages: [...conv.messages, autoResponse] }
          : conv
      ));
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRequest) return;
    
    const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = { from: 'org', text: newMessage, time: now };
    
    setConversations(prev => prev.map(conv => 
      conv.requestId === selectedRequest.id 
        ? { ...conv, messages: [...conv.messages, newMsg] }
        : conv
    ));
    
    setNewMessage('');
    
    // Auto response from sponsor
    setTimeout(() => {
      const responses = [
        'شكراً على الرد السريع. سنراجع المعلومات ونعود لكم.',
        'ممتاز! هذا يبدو رائعاً. دعونا نتابع التفاصيل.',
        'نقدر تعاونكم. هل يمكننا الانتقال للمرحلة التالية؟',
        'رائع! نحن متفقون على هذه النقاط.',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const autoResponse: Message = {
        from: 'sponsor',
        text: randomResponse,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      
      setConversations(prev => prev.map(conv => 
        conv.requestId === selectedRequest.id 
          ? { ...conv, messages: [...conv.messages, autoResponse] }
          : conv
      ));
    }, 1500);
  };

  const handleMoveToReview = () => {
    if (!selectedRequest) return;
    
    const updatedRequests = requests.map(r => 
      r.id === selectedRequest.id 
        ? { ...r, status: 'contract_review' as const, negotiationStep: 'review' as const }
        : r
    );
    setRequests(updatedRequests);
    setSelectedRequest({ ...selectedRequest, status: 'contract_review', negotiationStep: 'review' });
    
    toast.success('تم الانتقال لمراجعة الشروط', {
      description: 'يمكنك الآن مراجعة وتعديل شروط العقد',
      duration: 3000,
    });
  };

  const handleMoveToContract = () => {
    if (!selectedRequest) return;
    
    const updatedRequests = requests.map(r => 
      r.id === selectedRequest.id 
        ? { ...r, status: 'organizer_signing' as const, negotiationStep: 'organizer_sign' as const }
        : r
    );
    setRequests(updatedRequests);
    setSelectedRequest({ ...selectedRequest, status: 'organizer_signing', negotiationStep: 'organizer_sign' });
    
    toast.success('جاهز لتوقيع العقد', {
      description: 'راجع العقد ووقع عليه لإرساله للراعي',
      duration: 3000,
    });
  };

  const handleOrganizerSign = () => {
    if (!selectedRequest) return;
    
    toast.success('تم توقيع العقد', {
      description: 'تم إرسال العقد للراعي للتوقيع...',
      duration: 3000,
    });

    // Simulate sponsor signing after 3 seconds
    setTimeout(() => {
      const updatedRequests = requests.map(r => 
        r.id === selectedRequest.id 
          ? { ...r, status: 'completed' as const, negotiationStep: 'completed' as const }
          : r
      );
      setRequests(updatedRequests);
      setSelectedRequest({ ...selectedRequest, status: 'completed', negotiationStep: 'completed' });
      
      toast.success('🎉 تم إكمال الرعاية!', {
        description: `${selectedRequest.companyName} وقع على العقد بنجاح`,
        duration: 4000,
      });
    }, 3000);
  };

  const handleAddPackage = () => {
    setShowPackageModal(false);
    toast.success('تم إضافة الباقة بنجاح', {
      duration: 2000,
    });
  };

  const handleEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setShowEditPackage(true);
  };

  const handleSavePackage = () => {
    setShowEditPackage(false);
    setEditingPackage(null);
    toast.success('تم تحديث الباقة بنجاح', {
      duration: 2000,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700' },
      negotiating: { label: 'جاري التفاوض', color: 'bg-blue-100 text-blue-700' },
      contract_review: { label: 'مراجعة العقد', color: 'bg-purple-100 text-purple-700' },
      organizer_signing: { label: 'توقيع المنظم', color: 'bg-indigo-100 text-indigo-700' },
      sponsor_signing: { label: 'توقيع الراعي', color: 'bg-orange-100 text-orange-700' },
      completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700' },
      rejected: { label: 'مرفوض', color: 'bg-[#fce7eb] text-[#a93b39]' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs ${config.color}`} style={{ fontWeight: 600 }}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to={`/admin/hackathon/${id}`}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  إدارة طلبات الرعاية
                </h1>
                <p className="text-sm text-gray-500">
                  تتبع طلبات الرعايات الواردة، المفاوضات الجارية، وعمليات التوقيع
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPackageModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all shadow-lg shadow-[#e35654]/30"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" />
              إضافة باقة رعاية
            </button>
          </div>

          {/* Main Tabs */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1.5">
            <button
              onClick={() => setMainTab('requests')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm transition-all ${
                mainTab === 'requests'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontWeight: 600 }}
            >
              طلبات الرعاية ({requests.length})
            </button>
            <button
              onClick={() => setMainTab('negotiations')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm transition-all ${
                mainTab === 'negotiations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontWeight: 600 }}
            >
              المحادثات ({negotiatingCount})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {mainTab === 'requests' ? (
          <div className="flex gap-6">
            {/* Main Content - Requests */}
            <div className="flex-1">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>إجمالي طلبات الرعاية</p>
                      <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{totalAmount.toLocaleString()} ر.س</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>الرعايات المكتملة</p>
                      <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{confirmedAmount.toLocaleString()} ر.س</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: confirmedAmount > 0 ? '85%' : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500" style={{ fontWeight: 600 }}>قيد المراجعة</p>
                      <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{pendingCount} طلب</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: pendingCount > 0 ? '50%' : '0%' }}></div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن شركة..."
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  
                  <select
                    value={packageFilter}
                    onChange={(e) => setPackageFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="all">جميع الباقات</option>
                    <option value="ماسي">ماسي</option>
                    <option value="بلاتيني">بلاتيني</option>
                    <option value="ذهبي">ذهبي</option>
                    <option value="فضي">فضي</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="pending">قيد المراجعة</option>
                    <option value="negotiating">جاري التفاوض</option>
                    <option value="contract_review">مراجعة العقد</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
              </div>

              {/* Requests List */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                    طلبات الرعاية الواردة ({filteredRequests.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                          الشركة
                        </th>
                        <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                          الباقة
                        </th>
                        <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                          نوع الرعاية
                        </th>
                        <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                          الحالة
                        </th>
                        <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                          القيمة
                        </th>
                        <th className="text-right px-6 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={request.companyLogo}
                                alt={request.companyName}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div>
                                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                                  {request.companyName}
                                </p>
                                <p className="text-xs text-gray-500">{request.subCategory}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs ${
                              request.package === 'ماسي' ? 'bg-cyan-100 text-cyan-700' :
                              request.package === 'بلاتيني' ? 'bg-purple-100 text-purple-700' :
                              request.package === 'ذهبي' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`} style={{ fontWeight: 600 }}>
                              {request.package}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs ${
                              request.sponsorshipType === 'financial' ? 'bg-blue-100 text-blue-700' :
                              request.sponsorshipType === 'hospitality' ? 'bg-pink-100 text-pink-700' :
                              request.sponsorshipType === 'logistics' ? 'bg-gray-100 text-gray-700' :
                              request.sponsorshipType === 'technical' ? 'bg-green-100 text-green-700' :
                              request.sponsorshipType === 'media' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`} style={{ fontWeight: 600 }}>
                              {request.sponsorshipType}
                            </span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                              {request.value}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {request.status === 'pending' ? (
                                <button
                                  onClick={() => handleStartNegotiation(request)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                                  style={{ fontWeight: 600 }}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  بدء التفاوض
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setMainTab('negotiations');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs hover:bg-green-100 transition-colors flex items-center gap-1"
                                  style={{ fontWeight: 600 }}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  فتح المحادثة
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar - Package List */}
            <div className="w-96">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                    باقات الرعاية المتاحة
                  </h3>
                  <Package className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            pkg.color === 'cyan' ? 'bg-cyan-500' :
                            pkg.color === 'purple' ? 'bg-purple-500' :
                            pkg.color === 'amber' ? 'bg-amber-500' :
                            'bg-gray-500'
                          }`}></div>
                          <h4 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                            باقة {pkg.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleEditPackage(pkg)}
                          className="w-6 h-6 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-lg text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                        {pkg.price.toLocaleString()} ر.س
                      </p>

                      <div className="space-y-1">
                        {pkg.benefits.slice(0, 3).map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                            <span className="text-xs text-gray-600">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Negotiations Tab - WhatsApp Style
          <div className="flex gap-6">
            {/* Conversations List */}
            <div className="w-96">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                    المحادثات ({activeConversations.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {activeConversations.map((conv) => {
                    const conversation = conversations.find(c => c.requestId === conv.id);
                    const lastMsg = conversation?.messages[conversation.messages.length - 1];
                    const isSelected = selectedRequest?.id === conv.id;
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedRequest(conv)}
                        className={`w-full px-6 py-4 text-right hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={conv.companyLogo}
                            alt={conv.companyName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>
                                {conv.companyName}
                              </p>
                              {lastMsg && (
                                <span className="text-xs text-gray-500">{lastMsg.time}</span>
                              )}
                            </div>
                            {lastMsg && (
                              <p className="text-xs text-gray-500 truncate">
                                {lastMsg.from === 'org' ? 'أنت: ' : ''}{lastMsg.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1">
              {selectedRequest ? (
                <div className="space-y-6">
                  {/* Negotiation Header */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <img
                        src={selectedRequest.companyLogo}
                        alt={selectedRequest.companyName}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h2 className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                          {selectedRequest.companyName}
                        </h2>
                        <p className="text-sm text-gray-500">{selectedRequest.package} • {selectedRequest.subCategory}</p>
                      </div>
                      {getStatusBadge(selectedRequest.status)}
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between">
                      {[
                        { id: 'negotiation', label: 'التفاوض', icon: MessageCircle },
                        { id: 'review', label: 'مراجعة الشروط', icon: Edit3 },
                        { id: 'organizer_sign', label: 'توقيع المنظم', icon: FileText },
                        { id: 'sponsor_sign', label: 'توقيع الراعي', icon: Upload },
                        { id: 'completed', label: 'مكتمل', icon: CheckCircle2 },
                      ].map((step, index) => {
                        const stepOrder = ['negotiation', 'review', 'organizer_sign', 'sponsor_sign', 'completed'];
                        const currentIndex = stepOrder.indexOf(selectedRequest.negotiationStep || 'negotiation');
                        const isCompleted = index < currentIndex;
                        const isActive = selectedRequest.negotiationStep === step.id;
                        
                        return (
                          <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isCompleted ? 'bg-green-600 text-white' :
                                isActive ? 'bg-blue-600 text-white' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                <step.icon className="w-5 h-5" />
                              </div>
                              <span className={`text-xs ${isActive ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontWeight: isActive ? 600 : 400 }}>
                                {step.label}
                              </span>
                            </div>
                            {index < 4 && (
                              <div className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Negotiation Content */}
                  {selectedRequest.negotiationStep === 'negotiation' && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                          المحادثات والتفاوض
                        </h3>
                      </div>
                      <div className="p-6">
                        {/* Messages */}
                        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                          {currentMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.from === 'org' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-md ${msg.from === 'org' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-3`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs mt-1 ${msg.from === 'org' ? 'text-blue-100' : 'text-gray-500'}`}>{msg.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Message Input */}
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="اكتب رسالتك..."
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <button
                            onClick={handleSendMessage}
                            className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <button
                            onClick={handleMoveToReview}
                            className="w-full px-4 py-3 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-all"
                            style={{ fontWeight: 600 }}
                          >
                            الانتقال لمراجعة الشروط
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Terms */}
                  {selectedRequest.negotiationStep === 'review' && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <h3 className="text-base text-gray-900 mb-6" style={{ fontWeight: 700 }}>
                        مراجعة شروط الرعاية
                      </h3>
                      <div className="space-y-4">
                        {termDefs.map((term, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <term.icon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{term.label}</p>
                                {editingTerm === idx ? (
                                  <input
                                    type="text"
                                    value={termValues[idx]}
                                    onChange={(e) => {
                                      const newValues = [...termValues];
                                      newValues[idx] = e.target.value;
                                      setTermValues(newValues);
                                    }}
                                    onBlur={() => setEditingTerm(null)}
                                    className="mt-1 px-2 py-1 border border-blue-500 rounded text-sm"
                                    autoFocus
                                  />
                                ) : (
                                  <p className="text-sm text-gray-600">{termValues[idx]}</p>
                                )}
                              </div>
                            </div>
                            {term.editable && (
                              <button
                                onClick={() => setEditingTerm(idx)}
                                className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <button
                          onClick={handleMoveToContract}
                          className="w-full px-4 py-3 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-all"
                          style={{ fontWeight: 600 }}
                        >
                          الموافقة والانتقال للعقد
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Organizer Signing */}
                  {selectedRequest.negotiationStep === 'organizer_sign' && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                          توقيع العقد
                        </h3>
                        <p className="text-sm text-gray-500">
                          قم بمراجعة العقد وتوقيعه لإرساله للراعي
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <p className="text-sm text-gray-700 mb-4">
                          نموذج العقد الرقمي سيتم عرضه هنا للمراجعة النهائية قبل التوقيع...
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>عقد_رعاية_{selectedRequest.companyName}.pdf</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 mb-6 p-4 bg-blue-50 rounded-xl">
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="mt-1"
                        />
                        <label className="text-sm text-gray-700">
                          أوافق على جميع شروط وأحكام الرعاية المذكورة في العقد وأؤكد صحة المعلومات المقدمة
                        </label>
                      </div>

                      <button
                        onClick={handleOrganizerSign}
                        disabled={!agreed}
                        className={`w-full px-4 py-3 rounded-xl text-white text-sm transition-all ${
                          agreed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        توقيع العقد وإرساله للراعي
                      </button>
                    </div>
                  )}

                  {/* Completed */}
                  {selectedRequest.negotiationStep === 'completed' && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                          تم إكمال الرعاية بنجاح! 🎉
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          تم توقيع العقد من الطرفين وإكمال جميع الإجراءات
                        </p>

                        <div className="bg-green-50 rounded-xl p-6 text-right">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-green-700 mb-1">الشركة الراعية</p>
                              <p className="text-sm text-green-900" style={{ fontWeight: 600 }}>{selectedRequest.companyName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-700 mb-1">قيمة الرعاية</p>
                              <p className="text-sm text-green-900" style={{ fontWeight: 600 }}>{selectedRequest.amount?.toLocaleString()} ر.س</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-700 mb-1">الباقة</p>
                              <p className="text-sm text-green-900" style={{ fontWeight: 600 }}>{selectedRequest.package}</p>
                            </div>
                            <div>
                              <p className="text-xs text-green-700 mb-1">الحالة</p>
                              <p className="text-sm text-green-900" style={{ fontWeight: 600 }}>مكتمل ✓</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    اختر محادثة لعرضها
                  </h3>
                  <p className="text-sm text-gray-500">
                    اضغط على أحد المحادثات من القائمة لعرض التفاصيل والمتابعة
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowPackageModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>إضافة باقة رعاية جديدة</h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>اسم الباقة</label>
                <input
                  type="text"
                  placeholder="مثال: ماسي، بلاتيني..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>السعر (ر.س)</label>
                <input
                  type="number"
                  placeholder="150000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>المميزات</label>
                <textarea
                  rows={4}
                  placeholder="اكتب المميزات، كل مميزة في سطر جديد..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleAddPackage}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all"
                  style={{ fontWeight: 600 }}
                >
                  إضافة الباقة
                </button>
                <button
                  onClick={() => setShowPackageModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditPackage && editingPackage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEditPackage(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تعديل باقة {editingPackage.name}</h3>
              <button
                onClick={() => setShowEditPackage(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>اسم الباقة</label>
                <input
                  type="text"
                  defaultValue={editingPackage.name}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>السعر (ر.س)</label>
                <input
                  type="number"
                  defaultValue={editingPackage.price}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>المميزات</label>
                <textarea
                  rows={4}
                  defaultValue={editingPackage.benefits.join('\n')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSavePackage}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all"
                  style={{ fontWeight: 600 }}
                >
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setShowEditPackage(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}