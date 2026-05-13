import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { apiGet, apiPost, apiPut, ApiError } from '../../lib/api';
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
  Trash2,
  ChevronDown,
  Loader2,
  Paperclip,
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
  currentStep: number; // SA_NegotiationStep من الباك (0..4) — يحرك شريط المراحل ولوحة الـ NegotiationStepPanel
  lastMessage?: string;
  unreadMessages?: number;
}

// مراحل التفاوض الأربع بالترتيب. ملاحظة: قيمة step=3 في الـ DB
// (المهجورة) غير مستخدمة — لمن الراعي يوقّع، الباك يقفز من 2 → 4 مباشرة.
// نخلي ids متطابقة مع SA_NegotiationStep في الـ DB (0,1,2,4) عشان مقارنات
// isDone/isCurrent تشتغل بدون mapping إضافي.
const NEGOTIATION_STEPS = [
  { id: 0, label: 'التفاوض', icon: MessageCircle },
  { id: 1, label: 'مراجعة الشروط', icon: Edit3 },
  { id: 2, label: 'العقد الرقمي', icon: FileText },
  { id: 4, label: 'مكتمل', icon: CheckCircle2 },
];

// شكل الرسالة كما يرجّعها endpoint الراعي المشترك (sponsor.controller.ts).
// نحن في وجهة المنظم، فـ "رسالتي" = التي أرسلها مستخدم نوعه ORGANIZER.
interface ChatMessage {
  id: number;
  senderId: number;
  senderType: 'SPONSOR' | 'ORGANIZER' | 'PARTICIPANT';
  senderName: string;
  text: string;
  createdAt: string;
}

// شكل العقد كما يرجّعه GET /sponsors/applications/:id/contract. مشترك بين
// الجهتين. terms = ما يكتبه المنظم. acceptance = موافقة الراعي على الشروط
// (خطوة مستقلة عن التوقيع). signatures = التوقيع الرسمي النهائي.
interface ContractData {
  applicationId: number;
  status: 'pending' | 'accepted' | 'rejected';
  negotiationStep: number;
  terms: {
    duration: string | null;
    value: string | null;
    logoRights: string | null;
    displayTime: string | null;
    dataAccess: string | null;
    notes: string | null;
    submittedAt: string | null;
  };
  acceptance: {
    sponsorAccepted: boolean;
    sponsorAcceptedAt: string | null;
  };
  signatures: {
    organizerSigned: boolean;
    organizerSignedAt: string | null;
    sponsorSigned: boolean;
    sponsorSignedAt: string | null;
  };
  parties: {
    hackathonTitle: string;
    packageName: string;
    packagePrice: string | null;
    sponsorName: string;
    organizerName: string;
  };
}

// شكل الفورم المحلي لتحرير الشروط — كلها strings عشان الـ inputs تتعامل
// معها مباشرة. نتحول لـ null عند الإرسال إن كانت فاضية.
interface TermsForm {
  duration: string;
  value: string;
  logoRights: string;
  displayTime: string;
  dataAccess: string;
  notes: string;
}

const EMPTY_TERMS: TermsForm = {
  duration: '',
  value: '',
  logoRights: '',
  displayTime: '',
  dataAccess: '',
  notes: '',
};

// Color palette assigned by index — keeps the sidebar visually consistent
// even after the organizer reorders / adds / removes packages. The 4 first
// packages get the "premium" palette (cyan→purple→amber→gray); anything
// beyond rolls back to neutral.
const PACKAGE_COLOR_PALETTE = ['cyan', 'purple', 'amber', 'gray', 'blue', 'green'];

// UI shape the sidebar render expects (id/name/price/benefits/color). Built
// from the API's ApiSponsorPackage rows on load.
interface UiPackage {
  id: number;
  name: string;
  type: string;
  price: number;
  description: string;
  duration: string;
  sponsorOffer: string;
  resources: string;
  benefits: string[];
  color: string;
}

function mapApiPackage(p: ApiSponsorPackage, idx: number): UiPackage {
  let benefits: string[] = [];
  try {
    const raw = p.SP_Benefits;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) benefits = parsed.filter((b): b is string => typeof b === 'string');
  } catch {
    benefits = [];
  }
  return {
    id: p.SP_ID,
    name: p.SP_Name,
    type: p.SP_Type,
    price: p.SP_Price ? Number(p.SP_Price) : 0,
    description: p.SP_Description ?? '',
    duration: p.SP_Duration ?? '',
    sponsorOffer: p.SP_Sponsor_Offer ?? '',
    resources: p.SP_Resources ?? '',
    benefits,
    color: PACKAGE_COLOR_PALETTE[idx % PACKAGE_COLOR_PALETTE.length],
  };
}

// Shape returned by GET /hackathons/:id/sponsor-applications. Mapped to the
// SponsorRequest shape below so the existing UI keeps working without
// changes to every render branch.
interface ApiSponsorApplication {
  applicationId: number;
  status: 'pending' | 'accepted' | 'rejected';
  negotiationStep: number;
  appliedAt: string;
  paidAt: string | null;
  receiptFile: string | null;
  organizerSigned: boolean;
  organizerSignedAt: string | null;
  sponsor: {
    memberId: number;
    fullName: string;
    email: string;
    avatar: string | null;
    brand: string | null;
    industry: string | null;
  };
  package: {
    id: number;
    name: string;
    type: string;
    price: string | null;
  };
}

interface ApiSponsorPackage {
  SP_ID: number;
  SP_Name: string;
  SP_Type: string;
  SP_Description: string | null;
  SP_Duration: string | null;
  SP_Price: string | null;
  SP_Sponsor_Offer: string | null;
  SP_Resources: string | null;
  SP_Benefits: unknown;
}

// Map "accepted but step < 4" to the UI's "negotiating" state. "Completed"
// only when step reaches 4 (receipt uploaded). Old in-flight states from the
// mock data map to the closest real state.
function deriveUiStatus(s: ApiSponsorApplication): SponsorRequest['status'] {
  if (s.status === 'rejected') return 'rejected';
  if (s.status === 'pending') return 'pending';
  // accepted — pick a phase based on negotiationStep
  if (s.negotiationStep >= 4) return 'completed';
  if (s.negotiationStep >= 2) return 'organizer_signing';
  if (s.negotiationStep >= 1) return 'contract_review';
  return 'negotiating';
}

function deriveUiStep(s: ApiSponsorApplication): NegotiationStep | undefined {
  if (s.status !== 'accepted') return undefined;
  if (s.negotiationStep >= 4) return 'completed';
  if (s.negotiationStep >= 2) return 'organizer_sign';
  if (s.negotiationStep >= 1) return 'review';
  return 'negotiation';
}

// رمز emoji لكل نوع رعاية — يطابق التخصيص في CreateHackathon.
const TYPE_ICON: Record<string, string> = {
  financial: '💰',
  technical: '💻',
  logistic: '📦',
  hospitality: '🏨',
  media: '📢',
  other: '🎯',
};

// أول حرفين من اسم الشركة لاستخدامهما في الـ avatar البديل عن الصورة. نفلتر
// الفراغات والرموز عشان نحصل على حروف معبّرة فقط.
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] ?? '') + (parts[1][0] ?? '');
}

// لون ثابت لكل اسم شركة بناءً على hash بسيط — يضمن نفس اللون لنفس الشركة
// عبر إعادات التحميل بدون الحاجة لتخزينه في الـ DB.
const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-rose-500',
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function mapApiToRequest(s: ApiSponsorApplication): SponsorRequest {
  const priceNum = s.package.price ? Number(s.package.price) : 0;
  return {
    id: s.applicationId,
    companyName: s.sponsor.brand || s.sponsor.fullName,
    companyLogo: s.sponsor.avatar || '',
    package: s.package.name,
    subCategory: s.package.type,
    sponsorshipType: (s.package.type as SponsorshipType) || 'other',
    amount: priceNum,
    value: priceNum > 0 ? `${priceNum.toLocaleString('ar-SA')} ر.س` : '—',
    status: deriveUiStatus(s),
    submittedDate: s.appliedAt ? new Date(s.appliedAt).toLocaleDateString('ar-SA') : '—',
    negotiationStep: deriveUiStep(s),
    currentStep: typeof s.negotiationStep === 'number' ? s.negotiationStep : 0,
  };
}

export function HackathonSponsors() {
  const { id } = useParams();
  const hackathonId = id ? Number(id) : null;
  const [mainTab, setMainTab] = useState<'requests' | 'negotiations' | 'contracts'>('requests');
  const [requests, setRequests] = useState<SponsorRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  // Packages from the hackathon's customization step. The sidebar reads from
  // here and editing flows write back via replaceSponsorPackages.
  const [packages, setPackages] = useState<UiPackage[]>([]);
  const [savingPackages, setSavingPackages] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SponsorRequest | null>(null);
  // Unified package editor — used for both "add" and "edit". `editingIdx` is
  // -1 when creating a new package, otherwise it's the index in the packages
  // array we're updating. `draft` mirrors the CreateHackathon form fields.
  const [showPackageEditor, setShowPackageEditor] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number>(-1);
  const emptyDraft: UiPackage = {
    id: 0,
    name: '',
    type: '',
    price: 0,
    description: '',
    duration: '',
    sponsorOffer: '',
    resources: '',
    benefits: ['', '', '', ''],
    color: PACKAGE_COLOR_PALETTE[0],
  };
  const [draft, setDraft] = useState<UiPackage>(emptyDraft);
  // كرت الباقة في السايدبار يكون مطوي بشكل افتراضي ويتوسّع عند الضغط — يوفّر
  // مساحة للسايدبار لمن يكون فيه كثير باقات. null = الكل مطوي.
  const [expandedPkgIdx, setExpandedPkgIdx] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // الشات الحقيقي — رسائل لكل SA_ID. نحمّلها عند اختيار طلب ونعمل
  // polling كل 5 ثوانٍ لجلب رسائل جديدة من الراعي. الرسالة الجديدة عند
  // الإرسال تنحقن مباشرة في الـ map عشان تظهر فوراً بدون انتظار الـ poll.
  const [messagesByAppId, setMessagesByAppId] = useState<Record<number, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  // المرحلة المعروضة في شريط الـ steps (قابلة للنقر بشكل حر زي MessagesPage).
  // المرحلة الحقيقية على السيرفر تجي من selectedRequest.currentStep.
  const [viewedStep, setViewedStep] = useState(0);
  // البحث في قائمة المحادثات
  const [chatSearch, setChatSearch] = useState('');
  // بيانات العقد لكل طلب (cached). تُحمَّل عند دخول مرحلة ≥ 1.
  const [contractByAppId, setContractByAppId] = useState<Record<number, ContractData>>({});
  const [loadingContract, setLoadingContract] = useState(false);
  // فورم تحرير الشروط — مشترك لكل المحادثات (نعيد تعبئته عند تبديل
  // المحادثة المختارة). isEditingTerms = هل المنظم في وضع التعديل حالياً.
  const [termsForm, setTermsForm] = useState<TermsForm>(EMPTY_TERMS);
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [signingContract, setSigningContract] = useState(false);
  const [agreedToSign, setAgreedToSign] = useState(false);
  // عرض ملف العقد في modal من تبويب "إدارة العقود". null = ما فيه modal مفتوح.
  const [viewingContractId, setViewingContractId] = useState<number | null>(null);

  // Load real applications on mount + after start-negotiation. Mapped through
  // mapApiToRequest so the existing render branches don't need to change.
  useEffect(() => {
    if (!hackathonId) return;
    setLoadingRequests(true);
    apiGet<{ items: ApiSponsorApplication[] }>(`/hackathons/${hackathonId}/sponsor-applications`)
      .then((r) => setRequests(r.items.map(mapApiToRequest)))
      .catch((e) => {
        toast.error(e instanceof ApiError ? e.message : 'فشل تحميل طلبات الرعاية');
      })
      .finally(() => setLoadingRequests(false));
  }, [hackathonId]);

  // Packages come from getHackathon (same endpoint the management hub uses).
  // We map the raw rows to the UiPackage shape the sidebar renders.
  useEffect(() => {
    if (!hackathonId) return;
    apiGet<{ sponsorPackages: ApiSponsorPackage[] }>(`/hackathons/${hackathonId}`)
      .then((r) => setPackages(r.sponsorPackages.map(mapApiPackage)))
      .catch(() => {
        // Non-blocking — the page still works with an empty sidebar.
      });
  }, [hackathonId]);

  // Persist the current packages array via the existing replace-all endpoint.
  // Callers mutate `packages` locally first (add/edit/delete), then call this.
  const savePackages = async (next: UiPackage[]) => {
    if (!hackathonId) return;
    setSavingPackages(true);
    try {
      await apiPut(`/hackathons/${hackathonId}/sponsor-packages`, {
        sponsorPackages: next.map((p) => ({
          // نمرّر SP_ID للباقات الموجودة عشان الباك يعمل UPDATE بدل
          // DELETE+INSERT، فلا تنحذف طلبات الرعاية المرتبطة بها.
          id: p.id > 0 ? p.id : undefined,
          name: p.name,
          type: p.type,
          description: p.description,
          duration: p.duration,
          price: p.price || null,
          sponsorOffer: p.sponsorOffer,
          resources: p.resources,
          benefits: p.benefits,
        })),
      });
      // Reload from API so we get the fresh SP_IDs the backend assigned to
      // any newly-added rows (the modal stays in sync for future edits).
      const r = await apiGet<{ sponsorPackages: ApiSponsorPackage[] }>(`/hackathons/${hackathonId}`);
      setPackages(r.sponsorPackages.map(mapApiPackage));
      toast.success('تم حفظ الباقات');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر حفظ الباقات');
    } finally {
      setSavingPackages(false);
    }
  };

  // الرسائل الحالية للطلب المختار — مصدر العرض الوحيد للشات.
  const currentMessages: ChatMessage[] = selectedRequest
    ? messagesByAppId[selectedRequest.id] ?? []
    : [];

  // عند تبديل المحادثة، نرجع viewedStep للمرحلة الحقيقية (currentStep) بدل
  // ما يستلف القيمة من المحادثة السابقة.
  useEffect(() => {
    if (selectedRequest) setViewedStep(selectedRequest.currentStep);
  }, [selectedRequest?.id, selectedRequest?.currentStep]);

  // تحميل رسائل الطلب المختار + polling كل 5 ثوانٍ لمتابعة رسائل الراعي
  // الجديدة بدون WebSocket. نوقف الـ polling لمن المستخدم يبدل طلب أو
  // يخرج من تبويب المفاوضات.
  useEffect(() => {
    if (!hackathonId || !selectedRequest) return;
    const saId = selectedRequest.id;
    let cancelled = false;

    const fetchMessages = async (showSpinner: boolean) => {
      if (showSpinner) setLoadingMessages(true);
      try {
        // ننادي endpoint الراعي المشترك — guard فيه يقبل المنظم تلقائياً
        // لأنه يفحص ملكية الـ hackathon عبر join لـ sponsor_application.
        const r = await apiGet<{ items: ChatMessage[] }>(
          `/sponsors/applications/${saId}/messages`,
        );
        if (!cancelled) {
          setMessagesByAppId((prev) => ({ ...prev, [saId]: r.items }));
        }
      } catch {
        // فشل صامت — نتجنب إزعاج المستخدم بإشعارات أثناء polling متكرر.
      } finally {
        if (showSpinner && !cancelled) setLoadingMessages(false);
      }
    };

    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hackathonId, selectedRequest]);

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

  // فلترة قائمة المحادثات بالبحث (اسم الشركة أو الباقة)
  const filteredChatList = activeConversations.filter((c) => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return true;
    return c.companyName.toLowerCase().includes(q) || c.package.toLowerCase().includes(q);
  });

  // عدادات الداش بورد بحسب مرحلة التفاوض الفعلية (currentStep) — تعطي
  // المنظم نظرة سريعة على عدد الطلبات في كل مرحلة.
  // قيد التفاوض = طلب لم يبدأ أو في الشات (status=pending أو currentStep=0)
  // مراجعة الشروط = الشروط مرسلة بانتظار موافقة الراعي (currentStep=1)
  // التوقيع = الشروط موافَق عليها والعقد في مرحلة التوقيع (currentStep=2 أو 3)
  // مكتملة = الطرفان وقّعا (currentStep=4)
  const negotiatingCount = requests.filter(r =>
    r.status !== 'rejected' && (r.status === 'pending' || r.currentStep === 0)
  ).length;
  const reviewCount = requests.filter(r => r.currentStep === 1).length;
  const signingCount = requests.filter(r => r.currentStep === 2 || r.currentStep === 3).length;
  const completedCount = requests.filter(r => r.currentStep === 4).length;
  // عداد المحادثات في تبويب المفاوضات (نفس النطاق القديم)
  const chatCount = activeConversations.length;

  // Flip SA_Status → 'accepted' via the backend, then move the UI to the
  // negotiations tab. The fake "sponsor auto-replies" are gone — real chat
  // comes in Phase 2.
  const handleStartNegotiation = async (request: SponsorRequest) => {
    if (!hackathonId) return;
    try {
      await apiPost(`/hackathons/${hackathonId}/sponsor-applications/${request.id}/start-negotiation`, {});
      // Local optimistic update — flip status so the UI updates immediately.
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: 'negotiating', negotiationStep: 'negotiation' } : r,
        ),
      );
      setSelectedRequest({ ...request, status: 'negotiating', negotiationStep: 'negotiation' });
      setMainTab('negotiations');
      toast.success('تم بدء المفاوضات', {
        description: `تم فتح قناة المفاوضات مع ${request.companyName}`,
        duration: 3000,
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر بدء المفاوضات');
    }
  };

  // تحميل بيانات العقد لمن يدخل المنظم مرحلة ≥ 1 (الشروط فما فوق). نعمل
  // refetch خفيف عند العودة لنفس المحادثة كذلك عشان نلتقط آخر توقيع
  // أرسله الراعي (بدون polling — التوقيع نادر).
  const currentContract: ContractData | null = selectedRequest
    ? contractByAppId[selectedRequest.id] ?? null
    : null;

  // تحميل العقد لمن يفتح modal عرض العقد من تبويب إدارة العقود. لو موجود
  // في الـ cache (المنظم زاره من قبل في المفاوضات) ما يعيد الجلب.
  useEffect(() => {
    if (viewingContractId === null) return;
    if (contractByAppId[viewingContractId]) return;
    let cancelled = false;
    apiGet<ContractData>(`/sponsors/applications/${viewingContractId}/contract`)
      .then((r) => {
        if (!cancelled) setContractByAppId((prev) => ({ ...prev, [viewingContractId]: r }));
      })
      .catch(() => {
        // فشل صامت — الـ modal يعرض loading state
      });
    return () => {
      cancelled = true;
    };
  }, [viewingContractId, contractByAppId]);

  useEffect(() => {
    if (!selectedRequest || viewedStep === 0) return;
    const saId = selectedRequest.id;
    let cancelled = false;
    setLoadingContract(true);
    apiGet<ContractData>(`/sponsors/applications/${saId}/contract`)
      .then((r) => {
        if (cancelled) return;
        setContractByAppId((prev) => ({ ...prev, [saId]: r }));
        // عبّي الفورم بالقيم الموجودة (أو فاضي)
        setTermsForm({
          duration: r.terms.duration ?? '',
          value: r.terms.value ?? '',
          logoRights: r.terms.logoRights ?? '',
          displayTime: r.terms.displayTime ?? '',
          dataAccess: r.terms.dataAccess ?? '',
          notes: r.terms.notes ?? '',
        });
        // إذا الشروط ما اتأرسلت بعد، نفتح وضع التعديل تلقائياً (المنظم
        // أول داخل، يحتاج يعبي).
        setIsEditingTerms(!r.terms.submittedAt);
        setAgreedToSign(false);
      })
      .catch(() => {
        // فشل صامت — placeholder ما يظهر شيء حساس
      })
      .finally(() => {
        if (!cancelled) setLoadingContract(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRequest?.id, viewedStep]);

  // تحقق إن كل حقول الفورم معبّأة قبل الإرسال — المنظم ما يقدر يرسل
  // شروط ناقصة للراعي.
  const allTermsFilled = (f: TermsForm) =>
    f.duration.trim() !== '' &&
    f.value.trim() !== '' &&
    f.logoRights.trim() !== '' &&
    f.displayTime.trim() !== '' &&
    f.dataAccess.trim() !== '' &&
    f.notes.trim() !== '';

  // حفظ الشروط (PUT) — يرفع المرحلة على الباك إلى 1 ويسجّل وقت الإرسال.
  const handleSaveTerms = async () => {
    if (!selectedRequest) return;
    if (!allTermsFilled(termsForm)) {
      toast.error('عبّي جميع الحقول قبل إرسال الشروط للراعي');
      return;
    }
    const saId = selectedRequest.id;
    setSavingTerms(true);
    try {
      await apiPut(`/sponsors/applications/${saId}/contract`, termsForm);
      // اعمل refetch للتأكد من القيم بعد الحفظ + تحديث currentStep في القائمة
      const r = await apiGet<ContractData>(`/sponsors/applications/${saId}/contract`);
      setContractByAppId((prev) => ({ ...prev, [saId]: r }));
      setRequests((prev) =>
        prev.map((req) =>
          req.id === saId ? { ...req, currentStep: r.negotiationStep } : req,
        ),
      );
      setSelectedRequest((prev) =>
        prev && prev.id === saId ? { ...prev, currentStep: r.negotiationStep } : prev,
      );
      setIsEditingTerms(false);
      toast.success('تم إرسال الشروط للراعي');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر حفظ الشروط');
    } finally {
      setSavingTerms(false);
    }
  };

  // توقيع العقد (المنظم). الباك يرفع المرحلة لـ 2 ويوقّع SA_OrganizerSigned.
  const handleOrganizerSign = async () => {
    if (!selectedRequest || !agreedToSign) return;
    const saId = selectedRequest.id;
    setSigningContract(true);
    try {
      await apiPost(`/sponsors/applications/${saId}/sign`, {});
      const r = await apiGet<ContractData>(`/sponsors/applications/${saId}/contract`);
      setContractByAppId((prev) => ({ ...prev, [saId]: r }));
      setRequests((prev) =>
        prev.map((req) =>
          req.id === saId ? { ...req, currentStep: r.negotiationStep } : req,
        ),
      );
      setSelectedRequest((prev) =>
        prev && prev.id === saId ? { ...prev, currentStep: r.negotiationStep } : prev,
      );
      setAgreedToSign(false);
      toast.success('تم توقيع العقد من جهتك. بانتظار توقيع الراعي.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر تسجيل التوقيع');
    } finally {
      setSigningContract(false);
    }
  };

  // إرسال رسالة حقيقية للراعي عبر POST. لا auto-reply — الرد يجي من الراعي
  // الفعلي وينعكس عند الـ poll التالي (أو فوراً عند الراعي بعد polling).
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest || !hackathonId || sendingMessage) return;
    const text = newMessage.trim();
    const saId = selectedRequest.id;
    setNewMessage('');
    setSendingMessage(true);
    try {
      // الباك يرجع الرسالة بدون senderType/senderName، فنبنيهم محلياً للعرض
      // الفوري — مع polling القادم تنرجع بشكلها الكامل من الباك.
      const sent = await apiPost<{ id: number; senderId: number; text: string; createdAt: string }>(
        `/sponsors/applications/${saId}/messages`,
        { text },
      );
      const optimistic: ChatMessage = {
        id: sent.id,
        senderId: sent.senderId,
        senderType: 'ORGANIZER',
        senderName: '',
        text: sent.text,
        createdAt: sent.createdAt,
      };
      setMessagesByAppId((prev) => ({
        ...prev,
        [saId]: [...(prev[saId] ?? []), optimistic],
      }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر إرسال الرسالة');
      setNewMessage(text); // ارجاع النص للحقل عشان المستخدم يقدر يحاول
    } finally {
      setSendingMessage(false);
    }
  };

  // Open the unified editor for a brand-new package — `editingIdx = -1`
  // tells `handleSavePackage` to append rather than replace. We pick the next
  // color in the palette so the sidebar swatch stays distinct.
  const handleAddPackage = () => {
    setDraft({
      ...emptyDraft,
      color: PACKAGE_COLOR_PALETTE[packages.length % PACKAGE_COLOR_PALETTE.length],
    });
    setEditingIdx(-1);
    setShowPackageEditor(true);
  };

  // Open the unified editor pre-filled with an existing package. We pad the
  // benefits array to 4 entries so the 4 inputs in the form always render.
  const handleEditPackage = (idx: number) => {
    const pkg = packages[idx];
    setDraft({
      ...pkg,
      benefits: [...pkg.benefits, '', '', '', ''].slice(0, 4),
    });
    setEditingIdx(idx);
    setShowPackageEditor(true);
  };

  // Insert (editingIdx === -1) or replace at editingIdx, then persist via
  // savePackages — which calls the replaceSponsorPackages endpoint and
  // reloads to pick up backend-assigned SP_IDs.
  const handleSavePackage = async () => {
    if (!draft.name.trim() || !draft.type) {
      toast.error('اسم الباقة ونوعها مطلوبان');
      return;
    }
    if (!draft.sponsorOffer.trim()) {
      toast.error('عرض الراعي مطلوب');
      return;
    }
    const cleaned: UiPackage = {
      ...draft,
      benefits: draft.benefits.filter((b) => b.trim() !== ''),
    };
    const next =
      editingIdx === -1
        ? [...packages, cleaned]
        : packages.map((p, i) => (i === editingIdx ? cleaned : p));
    setShowPackageEditor(false);
    setDraft(emptyDraft);
    setEditingIdx(-1);
    await savePackages(next);
  };

  const handleDeletePackage = async (idx: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    const next = packages.filter((_, i) => i !== idx);
    await savePackages(next);
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
              onClick={handleAddPackage}
              disabled={savingPackages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all shadow-lg shadow-[#e35654]/30 disabled:opacity-50"
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
              المحادثات ({chatCount})
            </button>
            <button
              onClick={() => setMainTab('contracts')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm transition-all ${
                mainTab === 'contracts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontWeight: 600 }}
            >
              إدارة العقود ({requests.filter((r) => r.currentStep === 4).length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {mainTab === 'requests' ? (
          <div className="flex gap-6">
            {/* Main Content - Requests */}
            <div className="flex-1">
              {/* Stats — 4 كروت تعكس مراحل التفاوض الفعلية */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 whitespace-nowrap" style={{ fontWeight: 600 }}>قيد التفاوض</p>
                      <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{negotiatingCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 whitespace-nowrap" style={{ fontWeight: 600 }}>مراجعة الشروط</p>
                      <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{reviewCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 whitespace-nowrap" style={{ fontWeight: 600 }}>قيد التوقيع</p>
                      <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{signingCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 whitespace-nowrap" style={{ fontWeight: 600 }}>مكتملة</p>
                      <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{completedCount}</p>
                    </div>
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
                              {/* avatar حقيقي: نعرض الصورة لو متوفرة، وإلا نظهر
                                  أول حرفين من اسم الشركة على خلفية ملوّنة ثابتة. */}
                              {request.companyLogo ? (
                                <img
                                  src={request.companyLogo}
                                  alt={request.companyName}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm ${getAvatarColor(request.companyName)}`}
                                  style={{ fontWeight: 700 }}
                                >
                                  {getInitials(request.companyName)}
                                </div>
                              )}
                              <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                                {request.companyName}
                              </p>
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
                  {packages.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">
                      لا توجد باقات بعد. أضف باقة رعاية للبدء.
                    </p>
                  )}
                  {packages.map((pkg, idx) => {
                    const isOpen = expandedPkgIdx === idx;
                    return (
                      <div
                        key={pkg.id || `new-${idx}`}
                        className="rounded-xl border border-gray-100 hover:border-gray-200 transition-all overflow-hidden"
                      >
                        {/* رأس مختصر: شعار النوع + اسم + أزرار + سهم. الضغط على
                            الرأس يطوي/يفتح؛ الأزرار يستخدمن stopPropagation. */}
                        <button
                          onClick={() => setExpandedPkgIdx(isOpen ? null : idx)}
                          className="w-full p-3 flex items-center justify-between text-right hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg flex-shrink-0">
                              {TYPE_ICON[pkg.type] ?? '🎯'}
                            </span>
                            <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>
                              {pkg.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); handleEditPackage(idx); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditPackage(idx);
                                }
                              }}
                              className="w-6 h-6 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); handleDeletePackage(idx); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeletePackage(idx);
                                }
                              }}
                              className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </button>

                        {/* محتوى مفصّل يظهر فقط عند التوسعة. للباقات غير المالية
                            ما نعرض السعر — قيمتها = الموارد في "ما يقدمه الراعي". */}
                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
                            {pkg.type === 'financial' && pkg.price > 0 && (
                              <p className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                                {pkg.price.toLocaleString()} ر.س
                              </p>
                            )}
                            {pkg.benefits.filter((b) => b.trim() !== '').length > 0 && (
                              <div className="space-y-1">
                                {pkg.benefits
                                  .filter((b) => b.trim() !== '')
                                  .map((benefit, bIdx) => (
                                    <div key={bIdx} className="flex items-start gap-2">
                                      <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                                      <span className="text-xs text-gray-600">{benefit}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : mainTab === 'negotiations' ? (
          // المفاوضات — UI مطابقة لـ MessagesPage عند الراعي (sidebar + step
          // strip + bubbles بنفس الألوان). الفرق الوحيد: المستخدم هنا منظم،
          // فـ"رسالتي" = senderType === 'ORGANIZER'. مراحل 1-4 placeholder
          // مؤقتاً حتى نبني إنشاء العقد + التوقيع في المرحلة القادمة.
          <div className="flex bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 320px)', minHeight: '600px' }}>
            {/* Conversations Sidebar */}
            <div className="w-72 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="ابحث..."
                    className="w-full pr-10 pl-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:border-[#e35654] transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <p className="px-4 pt-3 pb-1 text-gray-400 text-xs" style={{ fontWeight: 600 }}>
                  المحادثات ({activeConversations.length})
                </p>
                {filteredChatList.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">
                    لا توجد محادثات بعد. ابدأ التفاوض من تبويب طلبات الرعاية.
                  </p>
                )}
                {filteredChatList.map((conv) => {
                  const convMessages = messagesByAppId[conv.id] ?? [];
                  const lastMsg = convMessages[convMessages.length - 1];
                  const isSelected = selectedRequest?.id === conv.id;
                  const initials = getInitials(conv.companyName);
                  const colorClass = getAvatarColor(conv.companyName);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedRequest(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-all border-r-2 ${
                        isSelected
                          ? 'bg-[#e35654]/5 border-[#e35654]'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0 ${colorClass}`} style={{ fontWeight: 700 }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${isSelected ? 'text-[#e35654]' : 'text-gray-900'}`} style={{ fontWeight: 600 }}>
                            {conv.companyName}
                          </p>
                          {lastMsg && (
                            <span className="text-gray-400 text-xs flex-shrink-0 mr-1">
                              {new Date(lastMsg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate mt-0.5">
                          {lastMsg ? `${lastMsg.senderType === 'ORGANIZER' ? 'أنت: ' : ''}${lastMsg.text}` : `باقة ${conv.package}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col min-w-0">
              {!selectedRequest ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-6 text-center">
                  اختر محادثة من القائمة لعرض التفاصيل والمتابعة
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm ${getAvatarColor(selectedRequest.companyName)}`} style={{ fontWeight: 700 }}>
                        {getInitials(selectedRequest.companyName)}
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                          {selectedRequest.companyName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          باقة {selectedRequest.package}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(selectedRequest.status)}
                  </div>

                  {/* Negotiation Steps Strip — قابل للنقر للتنقّل بحرّية */}
                  <div className="bg-white border-b border-gray-100 px-5 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      {NEGOTIATION_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        // المقارنة بـ step.id مش idx — لأن ids 0,1,2,4 وقد
                        // تكون غير متتالية (تجاوزنا step 3).
                        const isDone = step.id < selectedRequest.currentStep;
                        const isCurrent = step.id === selectedRequest.currentStep;
                        const isViewed = step.id === viewedStep;
                        const baseColor = isCurrent ? '#e35654' : isDone ? '#10b981' : '#d1d5db';
                        return (
                          <div key={step.id} className="flex items-center flex-1">
                            <button
                              type="button"
                              onClick={() => setViewedStep(idx)}
                              className="flex flex-col items-center flex-1 group focus:outline-none"
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-110 ${
                                  isViewed ? 'ring-2 ring-offset-2 ring-[#e35654]/40' : ''
                                }`}
                                style={{
                                  borderColor: baseColor,
                                  background: isCurrent ? baseColor : isDone ? baseColor : 'white',
                                }}
                              >
                                <Icon
                                  className="w-3.5 h-3.5"
                                  style={{ color: isCurrent || isDone ? 'white' : baseColor }}
                                />
                              </div>
                              <span
                                className="text-[10px] mt-1"
                                style={{
                                  color: baseColor,
                                  fontWeight: isViewed ? 700 : isCurrent ? 700 : 500,
                                }}
                              >
                                {step.label}
                              </span>
                            </button>
                            {idx < NEGOTIATION_STEPS.length - 1 && (
                              <div
                                className="h-0.5 flex-1 mb-4"
                                style={{ background: step.id < selectedRequest.currentStep ? '#10b981' : '#e5e7eb' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedRequest.currentStep === 4 && (
                      <p className="text-xs text-green-600 text-center mt-2" style={{ fontWeight: 600 }}>
                        ✓ اكتملت جميع مراحل التفاوض
                      </p>
                    )}
                  </div>

                  {/* Step 0 = chat. Steps 1-4 = placeholder حتى المرحلة القادمة. */}
                  {viewedStep === 0 ? (
                    <>
                      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-[#f7f7f6]">
                        {loadingMessages && currentMessages.length === 0 && (
                          <p className="text-center text-sm text-gray-400 py-6">
                            جاري تحميل المحادثة...
                          </p>
                        )}
                        {!loadingMessages && currentMessages.length === 0 && (
                          <p className="text-center text-sm text-gray-400 py-6">
                            لا توجد رسائل بعد. ابدأ المحادثة برسالة ترحيب.
                          </p>
                        )}
                        {currentMessages.length > 0 && (
                          <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-gray-400 text-xs px-3 py-1 bg-white rounded-full border border-gray-100">
                              اليوم
                            </span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                        )}
                        {currentMessages.map((msg) => {
                          const mine = msg.senderType === 'ORGANIZER';
                          const colorClass = getAvatarColor(selectedRequest.companyName);
                          const time = new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={msg.id} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                              {!mine && (
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0 ${colorClass}`} style={{ fontWeight: 700 }}>
                                  {getInitials(selectedRequest.companyName)}
                                </div>
                              )}
                              <div className={`max-w-[65%] flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
                                <div
                                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                                    mine
                                      ? 'bg-[#e35654] text-white rounded-tr-sm'
                                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                                <div className={`flex items-center gap-1 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
                                  <span className="text-gray-300 text-xs">{time}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Input */}
                      <div className="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                          {/* مؤقتاً paperclip معطّل — مرفقات الشات قيد التطوير. */}
                          <button
                            type="button"
                            disabled
                            className="p-2.5 rounded-xl text-gray-300 cursor-not-allowed"
                            title="إرفاق ملف (قريباً)"
                          >
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="اكتب رسالتك هنا..."
                            disabled={sendingMessage}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all disabled:opacity-50"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              newMessage.trim() && !sendingMessage
                                ? 'bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20'
                                : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 overflow-y-auto bg-[#f7f7f6] px-5 py-5">
                      {loadingContract && !currentContract ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">جاري تحميل بيانات العقد...</p>
                        </div>
                      ) : viewedStep === 1 ? (
                        // ── المرحلة 1: تحرير/مراجعة الشروط ──
                        <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl mx-auto">
                          <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                              {isEditingTerms ? 'تحرير شروط العقد' : 'شروط العقد المُرسلة'}
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">
                              {isEditingTerms
                                ? 'اكتب الشروط التي اتفقت عليها مع الراعي في المحادثة، ثم أرسلها له للمراجعة.'
                                : currentContract?.terms.submittedAt
                                ? `أُرسلت في ${new Date(currentContract.terms.submittedAt).toLocaleString('ar-SA')}`
                                : 'لم تُرسل بعد'}
                            </p>
                          </div>
                          <div className="px-5 py-4 space-y-3">
                            {isEditingTerms ? (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>مدة الرعاية <span className="text-red-500">*</span></label>
                                  <input
                                    type="text"
                                    value={termsForm.duration}
                                    onChange={(e) => setTermsForm({ ...termsForm, duration: e.target.value })}
                                    placeholder="مثال: 6 أشهر"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>قيمة الرعاية <span className="text-red-500">*</span></label>
                                  <input
                                    type="text"
                                    value={termsForm.value}
                                    onChange={(e) => setTermsForm({ ...termsForm, value: e.target.value })}
                                    placeholder="مثال: 50,000 ر.س أو خدمات تقنية"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>حقوق الشعار <span className="text-red-500">*</span></label>
                                  <textarea
                                    rows={2}
                                    value={termsForm.logoRights}
                                    onChange={(e) => setTermsForm({ ...termsForm, logoRights: e.target.value })}
                                    placeholder="مثال: ظهور الشعار على الموقع والمواد الإعلامية والمنصات الرقمية"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>وقت العرض <span className="text-red-500">*</span></label>
                                    <input
                                      type="text"
                                      value={termsForm.displayTime}
                                      onChange={(e) => setTermsForm({ ...termsForm, displayTime: e.target.value })}
                                      placeholder="مثال: 10 دقائق"
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>وصول لبيانات المشاركين <span className="text-red-500">*</span></label>
                                    <input
                                      type="text"
                                      value={termsForm.dataAccess}
                                      onChange={(e) => setTermsForm({ ...termsForm, dataAccess: e.target.value })}
                                      placeholder="مثال: نعم، مجهولة الهوية"
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>ملاحظات <span className="text-red-500">*</span></label>
                                  <textarea
                                    rows={2}
                                    value={termsForm.notes}
                                    onChange={(e) => setTermsForm({ ...termsForm, notes: e.target.value })}
                                    placeholder="أي بنود أخرى متفق عليها..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  {[
                                    { label: 'مدة الرعاية', value: currentContract?.terms.duration },
                                    { label: 'قيمة الرعاية', value: currentContract?.terms.value },
                                    { label: 'حقوق الشعار', value: currentContract?.terms.logoRights },
                                    { label: 'وقت العرض', value: currentContract?.terms.displayTime },
                                    { label: 'وصول لبيانات المشاركين', value: currentContract?.terms.dataAccess },
                                    { label: 'ملاحظات', value: currentContract?.terms.notes },
                                  ].map((t, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-gray-400 text-xs">{t.label}</p>
                                        <p className="text-gray-900 text-sm whitespace-pre-line" style={{ fontWeight: 600 }}>
                                          {t.value || '—'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* بانر حالة موافقة الراعي على الشروط — يحدّد
                                    هل ينفتح العقد الرقمي أو يبقى مقفلاً. */}
                                {currentContract?.acceptance.sponsorAccepted ? (
                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="text-green-800 text-xs flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                                      <CheckCircle2 className="w-4 h-4" /> وافق الراعي على الشروط
                                    </p>
                                    {currentContract.acceptance.sponsorAcceptedAt && (
                                      <p className="text-green-700 text-[11px] mt-1">
                                        في {new Date(currentContract.acceptance.sponsorAcceptedAt).toLocaleString('ar-SA')}
                                      </p>
                                    )}
                                    <p className="text-green-700 text-[11px] mt-1">
                                      يمكنك الآن الانتقال إلى العقد الرقمي للتوقيع.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-amber-800 text-xs flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                                      <Clock className="w-4 h-4" /> بانتظار موافقة الراعي على الشروط
                                    </p>
                                    <p className="text-amber-700 text-[11px] mt-1 leading-relaxed">
                                      الراعي يراجع البنود. لو طلب تعديلات عبر الشات،
                                      عدّل الشروط هنا وأعد إرسالها له. لن يُفتح العقد
                                      الرقمي حتى يوافق الراعي.
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setViewedStep(0)}
                              className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-700"
                              style={{ fontWeight: 500 }}
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> رجوع للمحادثة
                            </button>
                            <div className="flex items-center gap-2">
                              {isEditingTerms ? (
                                <>
                                  {currentContract?.terms.submittedAt && (
                                    <button
                                      onClick={() => setIsEditingTerms(false)}
                                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                                      style={{ fontWeight: 600 }}
                                    >
                                      إلغاء
                                    </button>
                                  )}
                                  <button
                                    onClick={handleSaveTerms}
                                    disabled={savingTerms || !allTermsFilled(termsForm) || (currentContract?.acceptance.sponsorAccepted ?? false)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontWeight: 600 }}
                                    title={!allTermsFilled(termsForm) ? 'يجب تعبئة جميع الحقول قبل الإرسال' : undefined}
                                  >
                                    {savingTerms && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {currentContract?.terms.submittedAt ? 'حفظ التعديلات' : 'إرسال للراعي'}
                                  </button>
                                </>
                              ) : currentContract?.acceptance.sponsorAccepted ? (
                                // الراعي وافق → ما فيه تعديل، فقط زر الانتقال للعقد الرقمي
                                <button
                                  onClick={() => setViewedStep(2)}
                                  className="px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] inline-flex items-center gap-1.5"
                                  style={{ fontWeight: 600 }}
                                >
                                  <FileText className="w-3.5 h-3.5" /> الانتقال للعقد الرقمي
                                </button>
                              ) : (
                                // الراعي ما وافق بعد → السماح بالتعديل وإعادة الإرسال
                                <button
                                  onClick={() => setIsEditingTerms(true)}
                                  className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 inline-flex items-center gap-1.5"
                                  style={{ fontWeight: 600 }}
                                >
                                  <Edit className="w-3.5 h-3.5" /> تعديل الشروط
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : viewedStep === 2 || viewedStep === 3 ? (
                        // ── المرحلة 2/3: العقد الرقمي ومراحل التوقيع ──
                        // الباك يرفض التوقيع قبل موافقة الراعي على الشروط؛
                        // الـ UI يعكس هذا: لا تظهر معاينة العقد أصلاً قبل
                        // الموافقة، نطلب من المنظم الرجوع لانتظار الراعي.
                        !currentContract?.terms.submittedAt ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-md mx-auto text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                              <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-amber-900 text-sm" style={{ fontWeight: 700 }}>
                              أرسل الشروط أولاً
                            </p>
                            <p className="text-amber-700 text-xs mt-2 leading-relaxed">
                              لا يمكن إصدار العقد قبل تحرير وإرسال الشروط للراعي.
                            </p>
                            <button
                              onClick={() => setViewedStep(1)}
                              className="mt-4 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs hover:bg-amber-100"
                              style={{ fontWeight: 600 }}
                            >
                              ← الرجوع لتحرير الشروط
                            </button>
                          </div>
                        ) : !currentContract?.acceptance.sponsorAccepted ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-md mx-auto text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                              <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-amber-900 text-sm" style={{ fontWeight: 700 }}>
                              بانتظار موافقة الراعي على الشروط
                            </p>
                            <p className="text-amber-700 text-xs mt-2 leading-relaxed">
                              لا يمكن البدء بالعقد الرقمي والتوقيع قبل أن يراجع
                              الراعي الشروط ويوافق عليها رسمياً. لو طلب تعديلات،
                              عدّلها من مرحلة "مراجعة الشروط" وأعد الإرسال.
                            </p>
                            <button
                              onClick={() => setViewedStep(1)}
                              className="mt-4 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs hover:bg-amber-100"
                              style={{ fontWeight: 600 }}
                            >
                              ← الرجوع لمراجعة الشروط
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl mx-auto overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-5 text-center text-white">
                              <div className="w-10 h-10 rounded-xl bg-[#e35654] flex items-center justify-center mx-auto mb-2">
                                <FileText className="w-5 h-5" />
                              </div>
                              <h4 className="text-sm" style={{ fontWeight: 800 }}>
                                عقد رعاية رسمي
                              </h4>
                              <p className="text-gray-400 text-xs mt-1">
                                رقم: #SP-{new Date().getFullYear()}-{String(currentContract.applicationId).padStart(4, '0')}
                              </p>
                            </div>
                            <div className="p-5 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl p-3">
                                  <p className="text-gray-400 text-xs mb-0.5">الطرف الأول (المنظم)</p>
                                  <p className="text-gray-900 text-xs" style={{ fontWeight: 700 }}>
                                    {currentContract.parties.organizerName}
                                  </p>
                                  <p className="text-gray-400 text-[10px] mt-1">
                                    {currentContract.parties.hackathonTitle}
                                  </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                  <p className="text-gray-400 text-xs mb-0.5">الطرف الثاني (الراعي)</p>
                                  <p className="text-gray-900 text-xs" style={{ fontWeight: 700 }}>
                                    {currentContract.parties.sponsorName}
                                  </p>
                                  <p className="text-gray-400 text-[10px] mt-1">
                                    باقة {currentContract.parties.packageName}
                                  </p>
                                </div>
                              </div>
                              <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                                {[
                                  { label: 'مدة الرعاية', value: currentContract.terms.duration },
                                  { label: 'قيمة الرعاية', value: currentContract.terms.value },
                                  { label: 'حقوق الشعار', value: currentContract.terms.logoRights },
                                  { label: 'وقت العرض', value: currentContract.terms.displayTime },
                                  { label: 'وصول لبيانات المشاركين', value: currentContract.terms.dataAccess },
                                  { label: 'ملاحظات', value: currentContract.terms.notes },
                                ].filter((t) => t.value).map((t, i) => (
                                  <div key={i} className="flex justify-between items-start py-1.5 border-b border-gray-100 gap-3">
                                    <span className="text-gray-500 text-xs">{t.label}</span>
                                    <span className="text-gray-900 text-xs text-left whitespace-pre-line" style={{ fontWeight: 600 }}>
                                      {t.value}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* قسم التواقيع */}
                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className={`rounded-xl p-3 border ${currentContract.signatures.organizerSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                  <p className="text-gray-500 text-[10px] mb-1">توقيع المنظم</p>
                                  {currentContract.signatures.organizerSigned ? (
                                    <>
                                      <p className="text-green-700 text-xs flex items-center gap-1" style={{ fontWeight: 700 }}>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> موقَّع
                                      </p>
                                      {currentContract.signatures.organizerSignedAt && (
                                        <p className="text-gray-400 text-[10px] mt-1">
                                          {new Date(currentContract.signatures.organizerSignedAt).toLocaleString('ar-SA')}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-gray-400 text-xs">بانتظار التوقيع</p>
                                  )}
                                </div>
                                <div className={`rounded-xl p-3 border ${currentContract.signatures.sponsorSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                  <p className="text-gray-500 text-[10px] mb-1">توقيع الراعي</p>
                                  {currentContract.signatures.sponsorSigned ? (
                                    <>
                                      <p className="text-green-700 text-xs flex items-center gap-1" style={{ fontWeight: 700 }}>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> موقَّع
                                      </p>
                                      {currentContract.signatures.sponsorSignedAt && (
                                        <p className="text-gray-400 text-[10px] mt-1">
                                          {new Date(currentContract.signatures.sponsorSignedAt).toLocaleString('ar-SA')}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-gray-400 text-xs">بانتظار التوقيع</p>
                                  )}
                                </div>
                              </div>

                              {/* زر التوقيع للمنظم (إن لم يوقّع بعد) */}
                              {!currentContract.signatures.organizerSigned && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                  <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={agreedToSign}
                                      onChange={(e) => setAgreedToSign(e.target.checked)}
                                      className="mt-0.5 w-4 h-4 accent-[#e35654]"
                                    />
                                    <span className="text-gray-700 text-xs leading-relaxed">
                                      قرأت بنود العقد بالكامل وأوافق عليها بصفتي ممثلاً عن المنظم.
                                    </span>
                                  </label>
                                  <button
                                    onClick={handleOrganizerSign}
                                    disabled={!agreedToSign || signingContract}
                                    className="mt-3 w-full px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                    style={{ fontWeight: 600 }}
                                  >
                                    {signingContract && <Loader2 className="w-3 h-3 animate-spin" />}
                                    توقيع العقد رقمياً
                                  </button>
                                </div>
                              )}

                              {currentContract.signatures.organizerSigned && !currentContract.signatures.sponsorSigned && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                                  <p className="text-amber-800 text-xs" style={{ fontWeight: 600 }}>
                                    ⏳ بانتظار توقيع الراعي
                                  </p>
                                  <p className="text-amber-600 text-[10px] mt-1">
                                    سيُصبح العقد ساري التنفيذ فور توقيع الراعي.
                                  </p>
                                </div>
                              )}

                              {currentContract.signatures.organizerSigned && currentContract.signatures.sponsorSigned && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                  <p className="text-green-800 text-xs" style={{ fontWeight: 700 }}>
                                    العقد ساري ومُوقَّع من الطرفين 🎉
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                              <button
                                onClick={() => setViewedStep(1)}
                                className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-700"
                                style={{ fontWeight: 500 }}
                              >
                                <ArrowRight className="w-3.5 h-3.5" /> رجوع للشروط
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        // ── المرحلة 4: مكتمل ──
                        <div className="bg-white rounded-2xl border border-green-200 p-6 max-w-md mx-auto text-center">
                          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                          </div>
                          <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                            تمّت الرعاية بنجاح
                          </p>
                          <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                            العقد ساري ومُوقَّع من الطرفين. يمكنك مراجعته من تبويب إدارة العقود.
                          </p>
                          <button
                            onClick={() => setMainTab('contracts')}
                            className="mt-4 px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48]"
                            style={{ fontWeight: 600 }}
                          >
                            عرض في إدارة العقود ←
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          // ── إدارة العقود ──
          // يعرض الطلبات اللي وصلت step 4 (موقّعة من الطرفين). الضغط على
          // أي عقد يفتح المحادثة على المرحلة الرقمية لعرض البنود وحالة
          // التوقيع.
          (() => {
            const signedContracts = requests.filter((r) => r.currentStep === 4);
            if (signedContracts.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    لا توجد عقود مكتملة بعد
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    ستظهر هنا العقود الموقّعة من الطرفين بعد اكتمال جميع
                    مراحل التفاوض والتوقيع الرقمي.
                  </p>
                </div>
              );
            }
            return (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base text-gray-900" style={{ fontWeight: 700 }}>
                    العقود السارية ({signedContracts.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    عقود موقّعة من المنظم والراعي رقمياً.
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {signedContracts.map((c) => (
                    <div key={c.id} className="px-6 py-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${getAvatarColor(c.companyName)}`} style={{ fontWeight: 700 }}>
                        {getInitials(c.companyName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                          {c.companyName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          باقة {c.package} • {c.value}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          رقم العقد: #SP-{new Date().getFullYear()}-{String(c.id).padStart(4, '0')}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-emerald-100 text-emerald-700" style={{ fontWeight: 600 }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> ساري
                      </span>
                      <button
                        onClick={() => setViewingContractId(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs hover:bg-gray-100 transition-colors inline-flex items-center gap-1"
                        style={{ fontWeight: 600 }}
                      >
                        <FileText className="w-3.5 h-3.5" /> عرض العقد
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Contract View Modal — يُفتح من تبويب "إدارة العقود". يعرض ملف العقد
          كاملاً (بنود + تواقيع رقمية + رقم العقد) مع خيار طباعة/تنزيل PDF.
          نفس بنية الـ modal عند الراعي عشان الطرفان يشوفان نفس الملف. */}
      {viewingContractId !== null && (() => {
        const contract = contractByAppId[viewingContractId];
        const req = requests.find((r) => r.id === viewingContractId);
        if (!contract) {
          return (
            <div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setViewingContractId(null)}
            >
              <div className="bg-white rounded-2xl p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">جاري تحميل العقد...</p>
              </div>
            </div>
          );
        }
        return (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 contract-modal-overlay"
            onClick={() => setViewingContractId(null)}
          >
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                .contract-print, .contract-print * { visibility: visible !important; }
                .contract-print {
                  position: absolute !important;
                  inset: 0 !important;
                  background: white !important;
                  padding: 32px !important;
                  box-shadow: none !important;
                  max-width: none !important;
                  max-height: none !important;
                  overflow: visible !important;
                  border-radius: 0 !important;
                }
                .contract-modal-overlay {
                  position: absolute !important;
                  inset: 0 !important;
                  background: white !important;
                  padding: 0 !important;
                }
                .no-print { display: none !important; }
              }
            `}</style>
            <div
              dir="rtl"
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto contract-print"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-6 text-center text-white rounded-t-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#e35654] flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                  عقد رعاية رسمي
                </h2>
                <p className="text-gray-300 text-xs mt-1">
                  رقم: #SP-{new Date().getFullYear()}-{String(contract.applicationId).padStart(4, '0')}
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">الطرف الأول (المنظم)</p>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                      {contract.parties.organizerName}
                    </p>
                    <p className="text-gray-400 text-[11px] mt-1">
                      {contract.parties.hackathonTitle}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">الطرف الثاني (الراعي)</p>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                      {contract.parties.sponsorName}
                    </p>
                    <p className="text-gray-400 text-[11px] mt-1">
                      باقة {contract.parties.packageName}
                    </p>
                  </div>
                </div>

                {/* Terms */}
                <div className="border-t border-dashed border-gray-200 pt-4">
                  <h3 className="text-gray-900 text-sm mb-3" style={{ fontWeight: 700 }}>
                    بنود العقد
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'مدة الرعاية', value: contract.terms.duration },
                      { label: 'قيمة الرعاية', value: contract.terms.value },
                      { label: 'حقوق الشعار', value: contract.terms.logoRights },
                      { label: 'وقت العرض', value: contract.terms.displayTime },
                      { label: 'وصول لبيانات المشاركين', value: contract.terms.dataAccess },
                      { label: 'ملاحظات', value: contract.terms.notes },
                    ].filter((t) => t.value).map((t) => (
                      <div
                        key={t.label}
                        className="flex justify-between items-start py-2 border-b border-gray-100 gap-3"
                      >
                        <span className="text-gray-500 text-xs">{t.label}</span>
                        <span className="text-gray-900 text-xs text-left whitespace-pre-line" style={{ fontWeight: 600 }}>
                          {t.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signatures */}
                <div className="border-t border-dashed border-gray-200 pt-4">
                  <h3 className="text-gray-900 text-sm mb-3" style={{ fontWeight: 700 }}>
                    التواقيع الرقمية
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-xl p-4 border ${contract.signatures.organizerSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-gray-500 text-xs mb-1">المنظم</p>
                      <p className="text-gray-900 text-sm mb-1" style={{ fontWeight: 700 }}>
                        {contract.parties.organizerName}
                      </p>
                      {contract.signatures.organizerSigned ? (
                        <>
                          <p className="text-green-700 text-xs flex items-center gap-1" style={{ fontWeight: 700 }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> موقَّع رقمياً
                          </p>
                          {contract.signatures.organizerSignedAt && (
                            <p className="text-gray-400 text-[11px] mt-1">
                              {new Date(contract.signatures.organizerSignedAt).toLocaleString('ar-SA')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400 text-xs">لم يوقّع بعد</p>
                      )}
                    </div>
                    <div className={`rounded-xl p-4 border ${contract.signatures.sponsorSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-gray-500 text-xs mb-1">الراعي</p>
                      <p className="text-gray-900 text-sm mb-1" style={{ fontWeight: 700 }}>
                        {contract.parties.sponsorName}
                      </p>
                      {contract.signatures.sponsorSigned ? (
                        <>
                          <p className="text-green-700 text-xs flex items-center gap-1" style={{ fontWeight: 700 }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> موقَّع رقمياً
                          </p>
                          {contract.signatures.sponsorSignedAt && (
                            <p className="text-gray-400 text-[11px] mt-1">
                              {new Date(contract.signatures.sponsorSignedAt).toLocaleString('ar-SA')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400 text-xs">لم يوقّع بعد</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-green-800 text-sm" style={{ fontWeight: 700 }}>
                      عقد موقّع رقمياً من الطرفين
                    </p>
                  </div>
                  <p className="text-green-700 text-xs">
                    تمّ توقيع العقد إلكترونياً وحفظه في سجلات المنصة.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex items-center gap-2 no-print">
                <button
                  onClick={() => setViewingContractId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
                  style={{ fontWeight: 600 }}
                >
                  إغلاق
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white bg-[#e35654] hover:bg-[#cc4a48] flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  <Upload className="w-4 h-4" />
                  حفظ كـ PDF
                </button>
              </div>
              {/* عرض اسم الشركة للمراجعة لو احتجناه */}
              {req && (
                <p className="px-6 pb-4 text-center text-[11px] text-gray-300 no-print">
                  عقد رعاية {req.companyName}
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Unified Package Editor — mirrors the CreateHackathon customization
          step exactly (4 sections: معلومات عامة / القيمة / ما يقدمه الراعي /
          ما يحصل عليه الراعي). Used for both add and edit; editingIdx === -1
          means create. */}
      {showPackageEditor && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setShowPackageEditor(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2 border-b border-gray-100">
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                {editingIdx === -1 ? 'إضافة باقة رعاية جديدة' : `تعديل باقة ${packages[editingIdx]?.name || ''}`}
              </h3>
              <button
                onClick={() => setShowPackageEditor(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
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
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>نوع الرعاية</label>
                    <select
                      value={draft.type}
                      onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                    >
                      <option value="">اختر</option>
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
                    placeholder="وصف شامل للباقة وفوائدها للراعي والهاكاثون..."
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>مدة الرعاية <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="3 أشهر"
                    value={draft.duration}
                    onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                  />
                </div>
              </div>

              {/* 💰 القيمة — only for financial sponsorships */}
              {draft.type === 'financial' && (
                <div className="space-y-3">
                  <h4 className="text-sm text-gray-900 flex items-center gap-2" style={{ fontWeight: 700 }}>
                    💰 القيمة
                  </h4>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>
                      السعر (ريال سعودي)
                    </label>
                    <input
                      type="number"
                      placeholder="100000"
                      value={draft.price || ''}
                      onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
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
                      draft.type === 'financial' ? 'مثال: دعم مالي لتغطية تكاليف الجوائز والمصاريف التشغيلية...' :
                      draft.type === 'technical' ? 'مثال: توفير فريق من المطورين، أدوات برمجية، استشارات تقنية...' :
                      draft.type === 'logistic' ? 'مثال: توفير قاعة انعقاد، أجهزة حواسيب، إنترنت عالي السرعة...' :
                      draft.type === 'hospitality' ? 'مثال: وجبات طعام، مشروبات ومرطبات، ضيافة VIP...' :
                      draft.type === 'media' ? 'مثال: تغطية إعلامية كاملة، نشر على منصات التواصل، تصوير...' :
                      'حدد تفاصيل ما سيقدمه الراعي بالضبط...'
                    }
                    value={draft.sponsorOffer}
                    onChange={(e) => setDraft({ ...draft, sponsorOffer: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>عدد الموارد (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: 2 مطور، 50 جهاز، 200 وجبة"
                    value={draft.resources}
                    onChange={(e) => setDraft({ ...draft, resources: e.target.value })}
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
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder={`ميزة ${i + 1} - مثال: ظهور الشعار، جناح خاص، شهادة تقدير...`}
                          value={draft.benefits[i] ?? ''}
                          onChange={(e) => {
                            const next = [...draft.benefits];
                            next[i] = e.target.value;
                            setDraft({ ...draft, benefits: next });
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSavePackage}
                  disabled={savingPackages}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  {savingPackages ? 'جاري الحفظ...' : editingIdx === -1 ? 'إضافة الباقة' : 'حفظ التعديلات'}
                </button>
                <button
                  onClick={() => setShowPackageEditor(false)}
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