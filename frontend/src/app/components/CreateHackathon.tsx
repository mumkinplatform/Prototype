import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import PublishConfirmModal from './PublishConfirmModal';
import PublishSuccessModal from './PublishSuccessModal';
import { BannerPattern } from './BannerPatterns';
import { LogoPattern } from './LogoPatterns';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, ApiError } from '../../lib/api';
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
  type: 'financial' | 'technical' | 'logistic' | 'hospitality' | 'media' | 'other' | '';
  description: string;
  duration: string;
  price: string;
  sponsorOffer: string;
  resources: string;
  benefits: string[];
}
 
interface FormData {
  // Section 1 — basic
  title: string;
  slug: string;
  description: string;
  type: string;
  city: string;
  fullAddress: string;
  startDate: string;
  endDate: string;
  publicName: string;
  contactEmail: string;
  visibility: '' | 'public' | 'private';
  // Section 3 — registration
  registrationStart: string;
  registrationEnd: string;
  minAge: string;
  teamMin: string;
  teamMax: string;
  targetParticipants: string;
  participationMode: '' | 'teams_only' | 'individuals_and_teams' | 'individuals_only';
  allowedCountries: '' | 'all' | 'gulf' | 'saudi_only' | 'arab' | 'custom';
  // Section 5 — projects
  submissionStart: string;
  submissionEnd: string;
  projectDescription: string;
  projectRequirements: string;
  maxFileSize: string;
  allowLateSubmission: boolean;
  // Section 6 — evaluation
  judgingCriteria: string;
  judgingStart: string;
  judgingEnd: string;
  // Section 7 — prizes (terms text)
  prizeTerms: string;
  // Milestones (section 1 — fixed timeline) — independent from basic startDate/endDate
  announcementDate: string;
  hackathonStartDate: string;
  winnersDate: string;
}

const EMPTY_FORM: FormData = {
  title: '',
  slug: '',
  description: '',
  type: '',
  city: '',
  fullAddress: '',
  startDate: '',
  endDate: '',
  publicName: '',
  contactEmail: '',
  visibility: '',
  registrationStart: '',
  registrationEnd: '',
  minAge: '',
  teamMin: '',
  teamMax: '',
  targetParticipants: '',
  participationMode: '',
  allowedCountries: '',
  submissionStart: '',
  submissionEnd: '',
  projectDescription: '',
  projectRequirements: '',
  maxFileSize: '',
  allowLateSubmission: false,
  judgingCriteria: '',
  judgingStart: '',
  judgingEnd: '',
  prizeTerms: '',
  announcementDate: '',
  hackathonStartDate: '',
  winnersDate: '',
};

const VISIBLE_SECTION_KEYS = [
  'about',
  'timeline',
  'sponsors',
  'faq',
  'announcements',
  'judges',
  'submissions',
  'prizes',
] as const;
type VisibleKey = (typeof VISIBLE_SECTION_KEYS)[number];

const SUBMISSION_FIELD_KEYS = [
  'title',
  'desc',
  'video',
  'demo',
  'github',
  'presentation',
  'images',
] as const;
type SubmissionFieldKey = (typeof SUBMISSION_FIELD_KEYS)[number];

interface BrandingState {
  logoMode: '' | 'upload' | 'pattern';
  logoUploadDataUrl: string | null;
  logoPattern: string | null;
  bannerMode: '' | 'upload' | 'pattern';
  bannerUploadDataUrl: string | null;
  bannerPattern: string | null;
  colorPalette: string;
  visibleSections: Record<VisibleKey, boolean>;
}

const EMPTY_BRANDING: BrandingState = {
  logoMode: '',
  logoUploadDataUrl: null,
  logoPattern: null,
  bannerMode: '',
  bannerUploadDataUrl: null,
  bannerPattern: null,
  colorPalette: '',
  visibleSections: VISIBLE_SECTION_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: false }),
    {} as Record<VisibleKey, boolean>
  ),
};

export function CreateHackathon() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [hackathonId, setHackathonId] = useState<number | null>(id ? Number(id) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [sponsorPackages, setSponsorPackages] = useState<SponsorPackage[]>([]);
  const [submissionFields, setSubmissionFields] = useState<SubmissionFieldKey[]>([]);
  const [branding, setBranding] = useState<BrandingState>(EMPTY_BRANDING);
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSubmissionField = (key: SubmissionFieldKey) =>
    setSubmissionFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const toggleVisibleSection = (key: VisibleKey) =>
    setBranding((prev) => ({
      ...prev,
      visibleSections: { ...prev.visibleSections, [key]: !prev.visibleSections[key] },
    }));

  const updateBranding = <K extends keyof BrandingState>(key: K, value: BrandingState[K]) =>
    setBranding((prev) => ({ ...prev, [key]: value }));

  const LOGO_MAX_BYTES = 2 * 1024 * 1024;
  const BANNER_MAX_BYTES = 5 * 1024 * 1024;
  const fmtMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

  const handleLogoFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('نوع الملف غير مدعوم', {
        description: 'يرجى رفع صورة (PNG، JPG، SVG، WebP).',
      });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error('حجم الشعار كبير', {
        description: `الحد الأقصى 2 ميجا — حجم الملف ${fmtMB(file.size)} ميجا.`,
        duration: 6000,
      });
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setBranding((prev) => ({
      ...prev,
      logoMode: 'upload',
      logoUploadDataUrl: dataUrl,
      logoPattern: null,
    }));
  };

  const handleBannerFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('نوع الملف غير مدعوم', {
        description: 'يرجى رفع صورة (PNG، JPG، SVG، WebP).',
      });
      return;
    }
    if (file.size > BANNER_MAX_BYTES) {
      toast.error('حجم البانر كبير', {
        description: `الحد الأقصى 5 ميجا — حجم الملف ${fmtMB(file.size)} ميجا.`,
        duration: 6000,
      });
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setBranding((prev) => ({
      ...prev,
      bannerMode: 'upload',
      bannerUploadDataUrl: dataUrl,
      bannerPattern: null,
    }));
  };

  const updateJudge = (id: string, field: 'name' | 'email' | 'specialty', value: string) =>
    setJudges((prev) => prev.map((j) => (j.id === id ? { ...j, [field]: value } : j)));

  const updatePrize = (
    id: string,
    field: 'position' | 'amount' | 'description',
    value: string
  ) => setPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const updateSponsorPackage = (
    id: string,
    patch: Partial<SponsorPackage>
  ) =>
    setSponsorPackages((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp))
    );

  const updateSponsorBenefit = (id: string, idx: number, value: string) =>
    setSponsorPackages((prev) =>
      prev.map((sp) => {
        if (sp.id !== id) return sp;
        const benefits = [...sp.benefits];
        benefits[idx] = value;
        return { ...sp, benefits };
      })
    );

  const [checkingSlug, setCheckingSlug] = useState(false);

  const handleCheckSlug = async () => {
    const slug = form.slug.trim();
    if (!slug) {
      toast.error('الرجاء إدخال الرابط أولاً');
      return;
    }
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      toast.error('الرابط يقبل أحرف لاتينية وأرقام وشرطة (-) فقط');
      return;
    }
    setCheckingSlug(true);
    try {
      const params = new URLSearchParams({ slug });
      if (hackathonId) params.set('excludeId', String(hackathonId));
      const res = await apiGet<{ available: boolean; reason?: string }>(
        `/hackathons/check-slug?${params.toString()}`
      );
      if (res.available) {
        toast.success('الرابط متاح ✓');
      } else if (res.reason === 'invalid_format') {
        toast.error('الرابط يقبل أحرف لاتينية وأرقام وشرطة (-) فقط');
      } else {
        toast.error('الرابط مستخدم سابقاً');
      }
    } catch {
      toast.error('تعذّر التحقق، حاولي مرة أخرى');
    } finally {
      setCheckingSlug(false);
    }
  };

  const updateTrack = (tid: string, field: 'name' | 'description', value: string) =>
    setTracks((prev) => prev.map((t) => (t.id === tid ? { ...t, [field]: value } : t)));

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
 
  const currentIndex = sections.findIndex((s) => s.id === activeSection);

  // A section is "complete" when ALL its required fields are filled — independent of
  // navigation. Each complete section is worth 12.5% of progress.
  // City is only required for in-person / hybrid events; online events skip it.
  const isOnline = form.type === 'عبر الإنترنت';
  const cityFulfilled = isOnline || form.city.trim() !== '';

  const isBasicComplete =
    form.title.trim() !== '' &&
    form.slug.trim() !== '' &&
    form.description.trim() !== '' &&
    form.type !== '' &&
    cityFulfilled &&
    form.startDate !== '' &&
    form.endDate !== '' &&
    form.publicName.trim() !== '' &&
    form.contactEmail.trim() !== '' &&
    form.visibility !== '' &&
    form.announcementDate !== '' &&
    form.hackathonStartDate !== '' &&
    form.winnersDate !== '' &&
    tracks.length > 0 &&
    tracks.every((t) => t.name.trim() !== '');

  // Section 2: organizers — completed when at least one organizer is fully filled
  // (name + email + role + at least one permission).
  const isOrganizersComplete =
    organizers.length > 0 &&
    organizers.every(
      (o) =>
        o.name.trim() !== '' &&
        o.email.trim() !== '' &&
        o.role !== '' &&
        o.permissions.length > 0
    );

  const isRegistrationComplete =
    form.registrationStart !== '' &&
    form.registrationEnd !== '' &&
    form.teamMin.trim() !== '' &&
    form.teamMax.trim() !== '' &&
    form.targetParticipants.trim() !== '' &&
    form.participationMode !== '' &&
    form.allowedCountries !== '';

  // Section 4: branding — at least logo (custom or pattern) AND banner (custom or pattern)
  // AND a color palette picked.
  const hasLogo =
    (branding.logoMode === 'upload' && !!branding.logoUploadDataUrl) ||
    (branding.logoMode === 'pattern' && !!branding.logoPattern);
  const hasBanner =
    (branding.bannerMode === 'upload' && !!branding.bannerUploadDataUrl) ||
    (branding.bannerMode === 'pattern' && !!branding.bannerPattern);
  const isBrandingComplete = hasLogo && hasBanner && branding.colorPalette !== '';

  const isProjectsComplete =
    form.submissionStart !== '' &&
    form.submissionEnd !== '' &&
    form.projectDescription.trim() !== '' &&
    form.projectRequirements.trim() !== '';

  const isEvaluationComplete =
    form.judgingCriteria.trim() !== '' &&
    form.judgingStart !== '' &&
    form.judgingEnd !== '';

  const isPrizesComplete =
    prizes.length > 0 &&
    prizes.every((p) => p.position.trim() !== '');

  // Section 8: sponsor packages — completed when at least one package is fully filled
  // (name + type + sponsor offer).
  const isSponsorsComplete =
    sponsorPackages.length > 0 &&
    sponsorPackages.every(
      (s) => s.name.trim() !== '' && s.type !== '' && s.sponsorOffer.trim() !== ''
    );

  const isSectionComplete = (s: Section): boolean => {
    switch (s) {
      case 'basic':
        return isBasicComplete;
      case 'organizers':
        return isOrganizersComplete;
      case 'registration':
        return isRegistrationComplete;
      case 'branding':
        return isBrandingComplete;
      case 'projects':
        return isProjectsComplete;
      case 'evaluation':
        return isEvaluationComplete;
      case 'prizes':
        return isPrizesComplete;
      case 'sponsors':
        return isSponsorsComplete;
      default:
        return false;
    }
  };

  // Granular progress: each section is worth 12.5% (100/8). Within a section, every
  // required field/unit contributes proportionally. Filling one field of section 1 (which
  // has 12 required units) adds ~1%, while filling section 6's lone unit adds the full
  // 12.5%. The bar moves smoothly as the user types instead of jumping in big steps.
  const sectionRatios: Record<Section, number> = {
    basic:
      ([
        form.title.trim() !== '',
        form.slug.trim() !== '',
        form.description.trim() !== '',
        form.type !== '',
        cityFulfilled,
        form.startDate !== '',
        form.endDate !== '',
        form.publicName.trim() !== '',
        form.contactEmail.trim() !== '',
        form.visibility !== '',
        form.announcementDate !== '',
        form.hackathonStartDate !== '',
        form.winnersDate !== '',
        tracks.length > 0 && tracks.every((t) => t.name.trim() !== ''),
      ].filter(Boolean).length) / 14,
    organizers: isOrganizersComplete ? 1 : 0,
    registration:
      ([
        form.registrationStart !== '',
        form.registrationEnd !== '',
        form.teamMin.trim() !== '',
        form.teamMax.trim() !== '',
        form.targetParticipants.trim() !== '',
        form.participationMode !== '',
        form.allowedCountries !== '',
      ].filter(Boolean).length) / 7,
    branding:
      ([hasLogo, hasBanner, branding.colorPalette !== ''].filter(Boolean).length) / 3,
    projects:
      ([
        form.submissionStart !== '',
        form.submissionEnd !== '',
        form.projectDescription.trim() !== '',
        form.projectRequirements.trim() !== '',
      ].filter(Boolean).length) / 4,
    evaluation:
      ([
        form.judgingCriteria.trim() !== '',
        form.judgingStart !== '',
        form.judgingEnd !== '',
      ].filter(Boolean).length) / 3,
    prizes: isPrizesComplete ? 1 : 0,
    sponsors: isSponsorsComplete ? 1 : 0,
  };

  const sectionWeight = 100 / sections.length; // 12.5%
  const progress = Math.round(
    sections.reduce((sum, s) => sum + sectionRatios[s.id] * sectionWeight, 0)
  );

  const hasAnyContent =
    form.title.trim() !== '' ||
    form.slug.trim() !== '' ||
    form.description.trim() !== '' ||
    form.type !== '' ||
    form.city.trim() !== '' ||
    form.fullAddress.trim() !== '' ||
    form.startDate !== '' ||
    form.endDate !== '' ||
    form.publicName.trim() !== '' ||
    form.contactEmail.trim() !== '' ||
    form.visibility !== '' ||
    form.registrationStart !== '' ||
    form.registrationEnd !== '' ||
    form.minAge.trim() !== '' ||
    form.teamMin.trim() !== '' ||
    form.teamMax.trim() !== '' ||
    form.targetParticipants.trim() !== '' ||
    form.participationMode !== '' ||
    form.allowedCountries !== '' ||
    form.submissionStart !== '' ||
    form.submissionEnd !== '' ||
    form.projectDescription.trim() !== '' ||
    form.projectRequirements.trim() !== '' ||
    form.maxFileSize.trim() !== '' ||
    form.allowLateSubmission ||
    form.judgingCriteria.trim() !== '' ||
    form.judgingStart !== '' ||
    form.judgingEnd !== '' ||
    form.prizeTerms.trim() !== '' ||
    form.announcementDate !== '' ||
    form.hackathonStartDate !== '' ||
    form.winnersDate !== '' ||
    tracks.length > 0 ||
    organizers.length > 0 ||
    judges.length > 0 ||
    prizes.length > 0 ||
    sponsorPackages.length > 0 ||
    submissionFields.length > 0 ||
    branding.logoMode !== '' ||
    branding.bannerMode !== '' ||
    branding.colorPalette !== '' ||
    Object.values(branding.visibleSections).some(Boolean);

  // Load draft data if in edit mode
  useEffect(() => {
    if (!id) return;
    apiGet<{
      hackathon: Record<string, unknown>;
      tracks: { HT_ID: number; HT_Name: string; HT_Description: string | null }[];
      coManagers: {
        HCM_ID: number;
        HCM_FullName: string;
        HCM_Email: string;
        HCM_Role: string;
        HCM_Permissions: unknown;
      }[];
      judges: { HJ_ID: number; HJ_FullName: string; HJ_Email: string; HJ_Specialty: string | null }[];
      prizes: { HP_ID: number; HP_Position: string; HP_Amount: string | null; HP_Description: string | null }[];
      sponsorPackages: {
        SP_ID: number;
        SP_Name: string;
        SP_Type: string;
        SP_Description: string | null;
        SP_Duration: string | null;
        SP_Price: string | null;
        SP_Sponsor_Offer: string | null;
        SP_Resources: string | null;
        SP_Benefits: unknown;
      }[];
    }>(`/hackathons/${id}`)
      .then((data) => {
        const h = data.hackathon as Record<string, string | number | null | undefined>;
        const datetimeStr = (v: unknown): string => {
          if (typeof v !== 'string') return '';
          // Handle both "YYYY-MM-DD HH:MM:SS" (mysql2 dateStrings) and ISO "YYYY-MM-DDTHH:MM:SS.sssZ"
          // by replacing the space separator with "T" so <input type="datetime-local"> can parse it.
          return v.replace(' ', 'T').slice(0, 16);
        };
        setForm({
          title: (h.H_title as string) ?? '',
          slug: (h.H_slug as string) ?? '',
          description: (h.H_description as string) ?? '',
          type: (h.H_type as string) ?? '',
          city: (h.H_city as string) ?? '',
          fullAddress: (h.H_full_address as string) ?? '',
          startDate: datetimeStr(h.H_StartDate),
          endDate: datetimeStr(h.H_EndDate),
          publicName: (h.H_public_name as string) ?? '',
          contactEmail: (h.H_contact_email as string) ?? '',
          visibility: h.H_visibility === 'private' ? 'private' : h.H_visibility === 'public' ? 'public' : '',
          registrationStart: datetimeStr(h.H_Registration_StartDate),
          registrationEnd: datetimeStr(h.H_Registration_EndDate),
          // (announcementDate / winnersDate loaded below)
          minAge: h.H_Min_Age != null ? String(h.H_Min_Age) : '',
          teamMin: h.H_Team_Min != null ? String(h.H_Team_Min) : '',
          teamMax: h.H_Team_Max != null ? String(h.H_Team_Max) : '',
          targetParticipants: h.H_Target_Participants != null ? String(h.H_Target_Participants) : '',
          participationMode: (h.H_Participation_Mode as FormData['participationMode']) ?? '',
          allowedCountries: (h.H_Allowed_Countries as FormData['allowedCountries']) ?? '',
          submissionStart: datetimeStr(h.H_Submission_StartDate),
          submissionEnd: datetimeStr(h.H_Submission_Deadline),
          projectDescription: (h.H_Project_Description as string) ?? '',
          projectRequirements: (h.H_Project_Requirements as string) ?? '',
          maxFileSize: h.H_Max_File_Size_MB != null ? String(h.H_Max_File_Size_MB) : '',
          allowLateSubmission: h.H_Allow_Late_Submission === 1,
          judgingCriteria: (h.H_JudgingCriteria as string) ?? '',
          judgingStart: datetimeStr(h.H_Judging_StartDate),
          judgingEnd: datetimeStr(h.H_Judging_EndDate),
          prizeTerms: (h.H_Prize_Terms as string) ?? '',
          announcementDate: datetimeStr(h.H_Announcement_Date),
          hackathonStartDate: datetimeStr(h.H_Hackathon_StartDate),
          winnersDate: datetimeStr(h.H_Winners_Date),
        });

        // Branding (parse from JSON string or object)
        const rawBranding = h.H_Branding;
        let parsedBranding: Partial<BrandingState> = {};
        try {
          if (typeof rawBranding === 'string' && rawBranding.trim() !== '') {
            parsedBranding = JSON.parse(rawBranding);
          } else if (rawBranding && typeof rawBranding === 'object') {
            parsedBranding = rawBranding as Partial<BrandingState>;
          }
        } catch {
          parsedBranding = {};
        }
        setBranding({
          logoMode: (parsedBranding.logoMode as BrandingState['logoMode']) ?? '',
          logoUploadDataUrl: parsedBranding.logoUploadDataUrl ?? null,
          logoPattern: parsedBranding.logoPattern ?? null,
          bannerMode: (parsedBranding.bannerMode as BrandingState['bannerMode']) ?? '',
          bannerUploadDataUrl: parsedBranding.bannerUploadDataUrl ?? null,
          bannerPattern: parsedBranding.bannerPattern ?? null,
          colorPalette: parsedBranding.colorPalette ?? '',
          visibleSections: {
            ...EMPTY_BRANDING.visibleSections,
            ...(parsedBranding.visibleSections ?? {}),
          },
        });

        // Submission fields
        const rawSF = h.H_Submission_Fields;
        let parsedSF: SubmissionFieldKey[] = [];
        try {
          const arr =
            typeof rawSF === 'string' && rawSF.trim() !== ''
              ? JSON.parse(rawSF)
              : Array.isArray(rawSF)
                ? rawSF
                : [];
          if (Array.isArray(arr)) {
            for (const item of arr) {
              if (typeof item === 'string' && SUBMISSION_FIELD_KEYS.includes(item as SubmissionFieldKey)) {
                parsedSF.push(item as SubmissionFieldKey);
              } else if (item && typeof item === 'object' && 'field' in item) {
                const f = (item as { field: unknown; required?: unknown }).field;
                const required = (item as { required?: unknown }).required;
                if (
                  typeof f === 'string' &&
                  required &&
                  SUBMISSION_FIELD_KEYS.includes(f as SubmissionFieldKey)
                ) {
                  parsedSF.push(f as SubmissionFieldKey);
                }
              }
            }
          }
        } catch {
          parsedSF = [];
        }
        setSubmissionFields(parsedSF);

        setTracks(
          data.tracks.map((t) => ({
            id: String(t.HT_ID),
            name: t.HT_Name,
            description: t.HT_Description ?? '',
          }))
        );
        setOrganizers(
          data.coManagers.map((m) => {
            let perms: string[] = [];
            try {
              const raw = m.HCM_Permissions;
              const parsed =
                typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
              if (Array.isArray(parsed)) {
                perms = parsed.filter((x): x is string => typeof x === 'string');
              }
            } catch {
              perms = [];
            }
            return {
              id: String(m.HCM_ID),
              name: m.HCM_FullName,
              email: m.HCM_Email,
              role: m.HCM_Role,
              permissions: perms,
            };
          })
        );
        setJudges(
          data.judges.map((j) => ({
            id: String(j.HJ_ID),
            name: j.HJ_FullName,
            email: j.HJ_Email,
            specialty: j.HJ_Specialty ?? '',
          }))
        );
        setPrizes(
          data.prizes.map((p) => ({
            id: String(p.HP_ID),
            position: p.HP_Position,
            amount: p.HP_Amount ?? '',
            description: p.HP_Description ?? '',
          }))
        );
        setSponsorPackages(
          data.sponsorPackages.map((s) => {
            let benefits: string[] = ['', '', '', ''];
            try {
              const raw = s.SP_Benefits;
              const parsed =
                typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
              if (Array.isArray(parsed)) {
                benefits = parsed.filter((x): x is string => typeof x === 'string');
                while (benefits.length < 4) benefits.push('');
              }
            } catch {
              benefits = ['', '', '', ''];
            }
            return {
              id: String(s.SP_ID),
              name: s.SP_Name,
              type: (s.SP_Type as SponsorPackage['type']) ?? '',
              description: s.SP_Description ?? '',
              duration: s.SP_Duration ?? '',
              price: s.SP_Price ?? '',
              sponsorOffer: s.SP_Sponsor_Offer ?? '',
              resources: s.SP_Resources ?? '',
              benefits,
            };
          })
        );

        toast.success('تم تحميل المسودة');
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          toast.error('المسودة غير موجودة');
          navigate('/admin/my-hackathons');
        } else if (err instanceof ApiError && err.status === 403) {
          toast.error('ليس لديك صلاحية لهذه المسودة');
          navigate('/admin/my-hackathons');
        } else {
          toast.error('تعذّر تحميل المسودة');
        }
      });
  }, [id, navigate]);

  const saveDraft = async (): Promise<boolean> => {
    // Don't create a draft for a fully empty form — only save when there's actual content,
    // or when we're updating an existing draft.
    if (!hasAnyContent && !hackathonId) {
      return true;
    }

    setIsSaving(true);
    try {
      let currentId = hackathonId;
      if (!currentId) {
        const created = await apiPost<{ hackathon_ID: number }>('/hackathons', {});
        currentId = created.hackathon_ID;
        setHackathonId(currentId);
        const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
        window.history.replaceState(null, '', `${base}/admin/create-hackathon/${currentId}`);
      }

      const brandingPayload = {
        logoMode: branding.logoMode || null,
        logoUploadDataUrl: branding.logoMode === 'upload' ? branding.logoUploadDataUrl : null,
        logoPattern: branding.logoMode === 'pattern' ? branding.logoPattern : null,
        bannerMode: branding.bannerMode || null,
        bannerUploadDataUrl: branding.bannerMode === 'upload' ? branding.bannerUploadDataUrl : null,
        bannerPattern: branding.bannerMode === 'pattern' ? branding.bannerPattern : null,
        colorPalette: branding.colorPalette || null,
        visibleSections: branding.visibleSections,
      };

      await apiPut(`/hackathons/${currentId}`, {
        ...form,
        branding: brandingPayload,
        submissionFields,
      });

      await apiPut(`/hackathons/${currentId}/tracks`, {
        tracks: tracks.map((t) => ({ name: t.name, description: t.description })),
      });
      await apiPut(`/hackathons/${currentId}/co-managers`, {
        coManagers: organizers.map((o) => ({
          fullName: o.name,
          email: o.email,
          role: o.role,
          permissions: o.permissions,
        })),
      });
      await apiPut(`/hackathons/${currentId}/judges`, {
        judges: judges.map((j) => ({
          fullName: j.name,
          email: j.email,
          specialty: j.specialty,
        })),
      });
      await apiPut(`/hackathons/${currentId}/prizes`, {
        prizes: prizes.map((p) => ({
          position: p.position,
          amount: p.amount,
          description: p.description,
        })),
      });
      await apiPut(`/hackathons/${currentId}/sponsor-packages`, {
        sponsorPackages: sponsorPackages.map((s) => ({
          name: s.name,
          type: s.type,
          description: s.description,
          duration: s.duration,
          price: s.price,
          sponsorOffer: s.sponsorOffer,
          resources: s.resources,
          benefits: s.benefits.filter((b) => b.trim() !== ''),
        })),
      });
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) toast.error('الرابط المختصر مستخدم سابقاً');
        else if (err.status === 401) toast.error('انتهت الجلسة، سجّلي دخول من جديد');
        else if (err.status === 403) toast.error('ليس لديك صلاحية');
        else if (err.status === 404) toast.error('الـ endpoint غير موجود — تأكدي من تشغيل الباكند بآخر تحديث');
        else if (err.status >= 500) toast.error(`خطأ في الخادم (${err.status}): ${err.message}`);
        else toast.error(`تعذّر الحفظ (HTTP ${err.status}): ${err.message}`);
      } else {
        toast.error('تعذّر الاتصال بالخادم');
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex >= sections.length - 1) return;
    const ok = await saveDraft();
    if (!ok) return;
    setActiveSection(sections[currentIndex + 1].id);
  };
 
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };
 
  const handleSaveDraft = async () => {
    const ok = await saveDraft();
    if (!ok) return;
    toast.success(isEditMode ? 'تم تحديث المسودة' : 'تم حفظ المسودة', {
      description: 'يمكنك الرجوع لتعديلها في أي وقت',
      duration: 3000,
    });
    setTimeout(() => {
      navigate('/admin/my-hackathons');
    }, 1000);
  };
 
  const incompleteSections = sections.filter((s) => !isSectionComplete(s.id));

  // ────────────────────────────────────────────────────────────────────────
  // Inline date-sequence validation. Each filled milestone is compared to the
  // most recent earlier-filled milestone in the chain; if it's earlier, we
  // surface a small inline message (no blocking — publish still hard-checks).
  // ────────────────────────────────────────────────────────────────────────
  type DateField =
    | 'registrationStart'
    | 'registrationEnd'
    | 'announcementDate'
    | 'hackathonStartDate'
    | 'submissionStart'
    | 'submissionEnd'
    | 'judgingStart'
    | 'judgingEnd'
    | 'winnersDate';

  const dateChain: { key: DateField; label: string }[] = [
    { key: 'registrationStart', label: 'فتح التسجيل' },
    { key: 'registrationEnd', label: 'إغلاق التسجيل' },
    { key: 'announcementDate', label: 'إعلان المقبولين' },
    { key: 'hackathonStartDate', label: 'بدء الهاكاثون' },
    { key: 'submissionStart', label: 'بدء استقبال التسليمات' },
    { key: 'submissionEnd', label: 'إغلاق التسليمات' },
    { key: 'judgingStart', label: 'بدء التحكيم' },
    { key: 'judgingEnd', label: 'انتهاء التحكيم' },
    { key: 'winnersDate', label: 'إعلان الفائزين' },
  ];

  const tsLocal = (v: string): number | null => {
    if (!v) return null;
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? null : t;
  };

  const dateErrors: Partial<Record<DateField, string>> = {};
  // Overall event window — startDate must be ≤ endDate, and every milestone
  // must fall within [startDate, endDate].
  const startTs = tsLocal(form.startDate);
  const endTs = tsLocal(form.endDate);
  let startDateError: string | undefined;
  let endDateError: string | undefined;
  if (startTs != null && endTs != null && endTs < startTs) {
    endDateError = 'يجب أن يكون بعد "تاريخ البدء"';
  }

  // Range check first (out-of-window is the primary violation), then chain order.
  for (let i = 0; i < dateChain.length; i++) {
    const cur = dateChain[i];
    const curVal = tsLocal(form[cur.key] as string);
    if (curVal == null) continue;
    if (startTs != null && curVal < startTs) {
      dateErrors[cur.key] = 'يجب أن يكون داخل فترة الهاكاثون (بعد تاريخ البدء)';
      continue;
    }
    if (endTs != null && curVal > endTs) {
      dateErrors[cur.key] = 'يجب أن يكون داخل فترة الهاكاثون (قبل تاريخ الانتهاء)';
      continue;
    }
    if (i === 0) continue;
    for (let j = i - 1; j >= 0; j--) {
      const prev = dateChain[j];
      const prevVal = tsLocal(form[prev.key] as string);
      if (prevVal == null) continue;
      if (curVal < prevVal) {
        dateErrors[cur.key] = `يجب أن يكون بعد "${prev.label}"`;
      }
      break;
    }
  }

  const handlePublish = () => {
    if (incompleteSections.length > 0) {
      const labels = incompleteSections.map((s) => s.label).join('، ');
      const headline =
        incompleteSections.length === 1
          ? `لم يكتمل قسم "${incompleteSections[0].label}" بعد`
          : `${incompleteSections.length} أقسام تحتاج إكمال`;
      toast.error(headline, {
        description:
          incompleteSections.length === 1
            ? 'راجع الحقول الفارغة في هذا القسم قبل النشر.'
            : labels,
        duration: 5000,
      });
      // jump to the first incomplete section so the user can fix it immediately
      setActiveSection(incompleteSections[0].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowPublishConfirmModal(true);
  };

  const confirmPublish = async () => {
    if (!hackathonId) {
      toast.error('احفظي المسوّدة أولاً');
      return;
    }
    setIsSaving(true);
    try {
      // Save latest state before publishing so backend validates the freshest data
      const ok = await saveDraft();
      if (!ok) {
        setIsSaving(false);
        return;
      }
      await apiPost(`/hackathons/${hackathonId}/publish`);
      setShowPublishConfirmModal(false);
      setShowPublishSuccessModal(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as
          | { error?: string; conflicts?: string[]; message?: string }
          | undefined;
        if (err.status === 400 && body?.error === 'date_conflict' && Array.isArray(body.conflicts)) {
          setShowPublishConfirmModal(false);
          toast.error('تواريخ غير منطقية', {
            description: body.conflicts.join(' — '),
            duration: 8000,
          });
        } else if (err.status === 400) {
          setShowPublishConfirmModal(false);
          toast.error('بيانات ناقصة — راجع الأقسام وأكملها قبل النشر');
        } else if (err.status === 409) {
          toast.error('الرابط المختصر مستخدم سابقاً');
        } else if (err.status === 403) {
          toast.error('ليس لديك صلاحية للنشر');
        } else if (err.status === 404) {
          toast.error('endpoint النشر غير موجود — تأكد من تشغيل الباكند');
        } else {
          toast.error(`تعذّر النشر (HTTP ${err.status})`);
        }
      } else {
        toast.error('تعذّر الاتصال بالخادم');
      }
    } finally {
      setIsSaving(false);
    }
  };
 
  const addTrack = () => {
    setTracks([...tracks, { id: Date.now().toString(), name: '', description: '' }]);
  };
 
  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };
 
  const addOrganizer = () => {
    setOrganizers((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', email: '', role: '', permissions: [] },
    ]);
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
    setSponsorPackages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        type: '',
        description: '',
        duration: '',
        price: '',
        sponsorOffer: '',
        resources: '',
        benefits: ['', '', '', ''],
      },
    ]);
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
                disabled={isSaving}
                className={`px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                  isSaving
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                style={{ fontWeight: 600 }}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'جاري الحفظ...' : isEditMode ? 'حفظ التعديلات' : 'حفظ كمسودة'}
              </button>
              <button
                onClick={async () => {
                  if (!hasAnyContent && !hackathonId) {
                    toast.error('عبّي بعض الحقول أولاً قبل المعاينة');
                    return;
                  }
                  // Save current draft before previewing so the preview shows fresh data
                  const ok = await saveDraft();
                  if (!ok) return;
                  if (hackathonId) navigate(`/admin/hackathon-preview/${hackathonId}`);
                }}
                disabled={isSaving}
                className={`px-4 py-2.5 rounded-xl text-white text-sm shadow-md shadow-[#e35654]/20 transition-all flex items-center gap-2 ${
                  isSaving ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#e35654] hover:bg-[#cc4a48]'
                }`}
                style={{ fontWeight: 600 }}
              >
                <Eye className="w-4 h-4" />
                {isSaving ? '...' : 'معاينة'}
              </button>
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
                  const isCompleted = isSectionComplete(section.id);
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
                        value={form.title}
                        onChange={(e) => updateForm('title', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      />
                    </div>

                    {/* URL */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الرابط المختصر (URL) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 px-4 py-3 bg-gray-100 rounded-xl border border-gray-200" dir="ltr">
                          mumkin./
                        </span>
                        <input
                          type="text"
                          placeholder="health-hackathon-2024"
                          dir="ltr"
                          value={form.slug}
                          onChange={(e) => updateForm('slug', e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleCheckSlug}
                          disabled={checkingSlug || !form.slug.trim()}
                          className={`px-4 py-3 rounded-xl text-sm transition-all ${
                            checkingSlug || !form.slug.trim()
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {checkingSlug ? '...' : 'تحقق'}
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
                        value={form.description}
                        onChange={(e) => updateForm('description', e.target.value)}
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
                                  value={track.name}
                                  onChange={(e) => updateTrack(track.id, 'name', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10"
                                />
                                <textarea
                                  rows={2}
                                  placeholder="وصف المسار والأهداف المطلوبة..."
                                  value={track.description}
                                  onChange={(e) => updateTrack(track.id, 'description', e.target.value)}
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
                      <div className="grid grid-cols-2 gap-3">
                        {['حضوري', 'عبر الإنترنت'].map((format) => {
                          const active = form.type === format;
                          return (
                            <button
                              key={format}
                              type="button"
                              onClick={() => {
                                // Online events have no physical location — clear city/address.
                                if (format === 'عبر الإنترنت') {
                                  setForm((prev) => ({ ...prev, type: format, city: '', fullAddress: '' }));
                                } else {
                                  updateForm('type', format);
                                }
                              }}
                              className={`px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                                active
                                  ? 'border-[#e35654] bg-[#e35654]/10 text-[#e35654]'
                                  : 'border-gray-200 text-gray-700 hover:border-[#e35654] hover:bg-red-50 hover:text-[#e35654]'
                              }`}
                              style={{ fontWeight: 500 }}
                            >
                              {format}
                            </button>
                          );
                        })}
                      </div>
                    </div>
 
                    {/* Location — only for in-person events */}
                    {form.type === 'عبر الإنترنت' ? (
                      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 text-sm text-blue-800">
                        🌐 هاكاثون عبر الإنترنت — لا يحتاج مدينة أو عنوان
                      </div>
                    ) : form.type === 'حضوري' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                            المدينة <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={form.city}
                            onChange={(e) => updateForm('city', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                          >
                            <option value="">اختر المدينة</option>
                            <option value="الرياض">الرياض</option>
                            <option value="جدة">جدة</option>
                            <option value="مكة المكرمة">مكة المكرمة</option>
                            <option value="المدينة المنورة">المدينة المنورة</option>
                            <option value="الدمام">الدمام</option>
                            <option value="الخبر">الخبر</option>
                            <option value="الظهران">الظهران</option>
                            <option value="الطائف">الطائف</option>
                            <option value="تبوك">تبوك</option>
                            <option value="بريدة">بريدة</option>
                            <option value="عنيزة">عنيزة</option>
                            <option value="حائل">حائل</option>
                            <option value="أبها">أبها</option>
                            <option value="خميس مشيط">خميس مشيط</option>
                            <option value="نجران">نجران</option>
                            <option value="جازان">جازان</option>
                            <option value="الباحة">الباحة</option>
                            <option value="عرعر">عرعر</option>
                            <option value="سكاكا">سكاكا</option>
                            <option value="ينبع">ينبع</option>
                            <option value="الجبيل">الجبيل</option>
                            <option value="الأحساء">الأحساء</option>
                            <option value="القطيف">القطيف</option>
                            <option value="نيوم">نيوم</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                            العنوان الكامل
                          </label>
                          <input
                            type="text"
                            placeholder="شارع الملك فهد"
                            value={form.fullAddress}
                            onChange={(e) => updateForm('fullAddress', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          تاريخ البدء <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={form.startDate}
                          onChange={(e) => updateForm('startDate', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            startDateError
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {startDateError && (
                          <p className="text-xs text-red-600 mt-1.5">{startDateError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          تاريخ الانتهاء <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={form.endDate}
                          onChange={(e) => updateForm('endDate', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            endDateError
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {endDateError && (
                          <p className="text-xs text-red-600 mt-1.5">{endDateError}</p>
                        )}
                      </div>
                    </div>
 
                    {/* Timeline — Fixed Milestones */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الجدول الزمني للهاكاثون <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-4">
                        هذي المراحل الستّ مرتبطة تلقائياً بأقسام الهاكاثون. تواريخ الأقسام الأخرى تنعكس هنا، والعكس.
                      </p>
                      <div className="space-y-3">
                        {([
                          { key: 'registrationStart' as const, label: 'فتح التسجيل' },
                          { key: 'registrationEnd' as const, label: 'إغلاق التسجيل' },
                          { key: 'announcementDate' as const, label: 'إعلان المقبولين' },
                          { key: 'hackathonStartDate' as const, label: 'بدء الهاكاثون' },
                          { key: 'winnersDate' as const, label: 'إعلان الفائزين' },
                        ]).map((m, idx) => {
                          const err = dateErrors[m.key as DateField];
                          return (
                            <div
                              key={m.key}
                              className={`flex items-start gap-3 p-4 border rounded-xl bg-gray-50 ${
                                err ? 'border-red-300' : 'border-gray-200'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#e35654] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5" style={{ fontWeight: 700 }}>
                                {idx + 1}
                              </div>
                              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1.5" />
                              <span className="flex-1 text-sm text-gray-900 pt-1.5" style={{ fontWeight: 600 }}>
                                {m.label}
                              </span>
                              <div className="flex flex-col items-end">
                                <input
                                  type="datetime-local"
                                  value={form[m.key]}
                                  onChange={(e) => updateForm(m.key, e.target.value)}
                                  className={`w-56 px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none ${
                                    err ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#e35654]'
                                  }`}
                                />
                                {err && (
                                  <p className="text-xs text-red-600 mt-1.5 max-w-56 text-right">{err}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                          value={form.publicName}
                          onChange={(e) => updateForm('publicName', e.target.value)}
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
                          value={form.contactEmail}
                          onChange={(e) => updateForm('contactEmail', e.target.value)}
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
                          <input
                            type="radio"
                            name="visibility"
                            className="mt-1"
                            checked={form.visibility === 'public'}
                            onChange={() => updateForm('visibility', 'public')}
                          />
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>هاكاثون عام (Public)</div>
                            <div className="text-xs text-gray-500 mt-1">يظهر للجميع ويمكن لأي شخص التسجيل</div>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                          <input
                            type="radio"
                            name="visibility"
                            className="mt-1"
                            checked={form.visibility === 'private'}
                            onChange={() => updateForm('visibility', 'private')}
                          />
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
                          value={form.registrationStart}
                          onChange={(e) => updateForm('registrationStart', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            dateErrors.registrationStart
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {dateErrors.registrationStart && (
                          <p className="text-xs text-red-600 mt-1.5">{dateErrors.registrationStart}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          إغلاق التسجيل <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={form.registrationEnd}
                          onChange={(e) => updateForm('registrationEnd', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            dateErrors.registrationEnd
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {dateErrors.registrationEnd && (
                          <p className="text-xs text-red-600 mt-1.5">{dateErrors.registrationEnd}</p>
                        )}
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
                        value={form.minAge}
                        onChange={(e) => updateForm('minAge', e.target.value)}
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
                          value={form.teamMax}
                          onChange={(e) => updateForm('teamMax', e.target.value)}
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
                          value={form.teamMin}
                          onChange={(e) => updateForm('teamMin', e.target.value)}
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
                        value={form.targetParticipants}
                        onChange={(e) => updateForm('targetParticipants', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Participation Mode */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        نمط المشاركة <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {([
                          { v: 'teams_only', t: 'فرق فقط', d: 'يجب على المشاركين التسجيل كفريق' },
                          { v: 'individuals_and_teams', t: 'أفراد وفرق', d: 'يمكن للأفراد التسجيل ثم الانضمام لفريق لاحقاً' },
                          { v: 'individuals_only', t: 'أفراد فقط', d: 'كل مشارك يعمل بشكل فردي' },
                        ] as const).map((opt) => (
                          <label key={opt.v} className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                            <input
                              type="radio"
                              name="participation"
                              className="mt-1"
                              checked={form.participationMode === opt.v}
                              onChange={() => updateForm('participationMode', opt.v)}
                            />
                            <div>
                              <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{opt.t}</div>
                              <div className="text-xs text-gray-500 mt-1">{opt.d}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Allowed Countries */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        الدول المسموحة <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.allowedCountries}
                        onChange={(e) => updateForm('allowedCountries', e.target.value as FormData['allowedCountries'])}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      >
                        <option value="">اختر</option>
                        <option value="all">جميع الدول</option>
                        <option value="gulf">دول الخليج فقط</option>
                        <option value="saudi_only">السعودية فقط</option>
                        <option value="arab">دول عربية محددة</option>
                        <option value="custom">دول مخصصة</option>
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
                        شعار الهاكاثون <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        المقاس المفضّل: 512×512 بكسل (مربع) — صيغة PNG أو JPG أو SVG — حد أقصى 2 ميغابايت
                      </p>
                      <label
                        htmlFor="logo-upload"
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer block ${
                          branding.logoMode === 'upload' && branding.logoUploadDataUrl
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-[#e35654] hover:bg-red-50'
                        }`}
                      >
                        <input
                          id="logo-upload"
                          type="file"
                          className="hidden"
                          onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
                          accept="image/*"
                        />
                        {branding.logoMode === 'upload' && branding.logoUploadDataUrl ? (
                          <div className="flex items-center gap-4 justify-center">
                            <img
                              src={branding.logoUploadDataUrl}
                              alt="logo"
                              className="w-20 h-20 object-contain rounded-lg bg-white border border-gray-200"
                            />
                            <div className="text-right">
                              <p className="text-sm text-green-700" style={{ fontWeight: 600 }}>تم الرفع بنجاح</p>
                              <p className="text-xs text-gray-500">انقر للاستبدال بشعار آخر</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                              <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm mb-1 text-gray-700" style={{ fontWeight: 600 }}>انقر لرفع الشعار</p>
                            <p className="text-xs text-gray-500">يظهر في أعلى صفحة الهاكاثون</p>
                          </>
                        )}
                      </label>
                      {branding.logoMode === 'upload' && branding.logoUploadDataUrl && (
                        <button
                          type="button"
                          onClick={() => setBranding((p) => ({ ...p, logoMode: '', logoUploadDataUrl: null }))}
                          className="text-xs text-gray-400 hover:text-red-500 mt-2"
                        >
                          إزالة الشعار المرفوع
                        </button>
                      )}

                      {/* Logo Patterns (alternative) */}
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-3">— أو اختر شعاراً جاهزاً —</p>
                        <div className="grid grid-cols-4 gap-3">
                          {['logo-1','logo-2','logo-3','logo-4','logo-5','logo-6','logo-7','logo-8'].map((p) => {
                            const active = branding.logoMode === 'pattern' && branding.logoPattern === p;
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() =>
                                  setBranding((prev) =>
                                    active
                                      ? { ...prev, logoMode: '', logoPattern: null }
                                      : { ...prev, logoMode: 'pattern', logoPattern: p, logoUploadDataUrl: null }
                                  )
                                }
                                className={`w-full aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                                  active
                                    ? 'border-[#e35654] ring-2 ring-[#e35654]/30'
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                <LogoPattern pattern={p} colorPalette={branding.colorPalette || 'red'} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Banner Upload */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        صورة الهيدر (Banner) <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        المقاس المفضّل: 1920×400 بكسل (واسعة) — صيغة PNG أو JPG — حد أقصى 5 ميغابايت
                      </p>
                      <label
                        htmlFor="banner-upload"
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer block ${
                          branding.bannerMode === 'upload' && branding.bannerUploadDataUrl
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-[#e35654] hover:bg-red-50'
                        }`}
                      >
                        <input
                          id="banner-upload"
                          type="file"
                          className="hidden"
                          onChange={(e) => handleBannerFile(e.target.files?.[0] ?? null)}
                          accept="image/*"
                        />
                        {branding.bannerMode === 'upload' && branding.bannerUploadDataUrl ? (
                          <div>
                            <img
                              src={branding.bannerUploadDataUrl}
                              alt="banner"
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                            <p className="text-sm text-green-700" style={{ fontWeight: 600 }}>تم الرفع بنجاح — انقر للاستبدال</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                              <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm mb-1 text-gray-700" style={{ fontWeight: 600 }}>انقر لرفع صورة الخلفية</p>
                            <p className="text-xs text-gray-500">تظهر كخلفية للهيدر</p>
                          </>
                        )}
                      </label>
                      {branding.bannerMode === 'upload' && branding.bannerUploadDataUrl && (
                        <button
                          type="button"
                          onClick={() => setBranding((p) => ({ ...p, bannerMode: '', bannerUploadDataUrl: null }))}
                          className="text-xs text-gray-400 hover:text-red-500 mt-2"
                        >
                          إزالة الهيدر المرفوع
                        </button>
                      )}

                      {/* Banner Patterns (alternative) */}
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-3">— أو اختر خلفية جاهزة —</p>
                        <div className="grid grid-cols-3 gap-3">
                          {['pattern-1','pattern-2','pattern-3','pattern-4','pattern-5','pattern-6'].map((p) => {
                            const active = branding.bannerMode === 'pattern' && branding.bannerPattern === p;
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() =>
                                  setBranding((prev) =>
                                    active
                                      ? { ...prev, bannerMode: '', bannerPattern: null }
                                      : { ...prev, bannerMode: 'pattern', bannerPattern: p, bannerUploadDataUrl: null }
                                  )
                                }
                                className={`w-full rounded-xl border-2 overflow-hidden transition-all ${
                                  active
                                    ? 'border-[#e35654] ring-2 ring-[#e35654]/30'
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                                style={{ height: '80px' }}
                              >
                                <BannerPattern pattern={p} colorPalette={branding.colorPalette || 'red'} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Color Palette Selector */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        لوحة ألوان الهاكاثون <span className="text-red-500">*</span>
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
                            onClick={() => updateBranding('colorPalette', palette.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm transition-all ${
                              branding.colorPalette === palette.id
                                ? 'border-[#e35654] bg-red-50'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: palette.color }} />
                            {palette.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">تظهر في صفحة الهاكاثون وتؤثر على الأشكال الجاهزة</p>
                    </div>

                    {/* Visible Sections */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 600 }}>
                        الأقسام المرئية في مساحة عمل المشارك
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        تظهر هذه الأقسام للمشارك بعد قبوله في الهاكاثون داخل مساحة عمله الخاصة.
                      </p>
                      <div className="space-y-2">
                        {([
                          { id: 'about', label: 'قسم نبذة عن الهاكاثون', desc: 'يعرض الوصف والنظرة العامة' },
                          { id: 'timeline', label: 'قسم الجدول الزمني', desc: 'يعرض المواعيد والأحداث المهمة' },
                          { id: 'sponsors', label: 'قسم الرعاة', desc: 'يعرض شعارات الرعاة ومعلوماتهم' },
                          { id: 'faq', label: 'قسم الأسئلة الشائعة', desc: 'يعرض الأسئلة والأجوبة' },
                          { id: 'announcements', label: 'قسم الإعلانات', desc: 'للنشر والتحديثات أثناء الهاكاثون' },
                          { id: 'judges', label: 'قسم لجنة التحكيم', desc: 'يعرض قائمة المحكمين' },
                          { id: 'submissions', label: 'قسم التسليم', desc: 'منطقة رفع وإدارة المشاريع' },
                          { id: 'prizes', label: 'قسم الجوائز', desc: 'يعرض معلومات الجوائز والمكافآت' },
                        ] as const).map((s) => (
                          <label key={s.id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={branding.visibleSections[s.id]}
                              onChange={() => toggleVisibleSection(s.id)}
                            />
                            <div className="flex-1">
                              <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{s.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
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
                    <p className="text-gray-500">حدد متطلبات وإعدادات تسليم المشاريع</p>
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
                          value={form.submissionStart}
                          onChange={(e) => updateForm('submissionStart', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            dateErrors.submissionStart
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {dateErrors.submissionStart && (
                          <p className="text-xs text-red-600 mt-1.5">{dateErrors.submissionStart}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          نهاية تسليم المشاريع <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={form.submissionEnd}
                          onChange={(e) => updateForm('submissionEnd', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            dateErrors.submissionEnd
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {dateErrors.submissionEnd && (
                          <p className="text-xs text-red-600 mt-1.5">{dateErrors.submissionEnd}</p>
                        )}
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
                        value={form.projectDescription}
                        onChange={(e) => updateForm('projectDescription', e.target.value)}
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
                        value={form.projectRequirements}
                        onChange={(e) => updateForm('projectRequirements', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    {/* Required Fields */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        الحقول المطلوبة في التسليم
                      </label>
                      <div className="space-y-2">
                        {([
                          { id: 'title', label: 'عنوان المشروع' },
                          { id: 'desc', label: 'وصف المشروع' },
                          { id: 'video', label: 'فيديو توضيحي' },
                          { id: 'demo', label: 'رابط النسخة التجريبية' },
                          { id: 'github', label: 'رابط GitHub' },
                          { id: 'presentation', label: 'عرض تقديمي (PDF)' },
                          { id: 'images', label: 'صور المشروع' },
                        ] as const).map((field) => {
                          const checked = submissionFields.includes(field.id);
                          return (
                            <label key={field.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSubmissionField(field.id)}
                                />
                                <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{field.label}</span>
                              </div>
                            </label>
                          );
                        })}
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
                        value={form.maxFileSize}
                        onChange={(e) => updateForm('maxFileSize', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Allow Late Submissions */}
                    <div>
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#e35654] hover:bg-red-50 transition-all">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={form.allowLateSubmission}
                          onChange={(e) => updateForm('allowLateSubmission', e.target.checked)}
                        />
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
                        value={form.judgingCriteria}
                        onChange={(e) => updateForm('judgingCriteria', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    {/* Judging Period */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          بداية التحكيم <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={form.judgingStart}
                          onChange={(e) => updateForm('judgingStart', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            dateErrors.judgingStart
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {dateErrors.judgingStart && (
                          <p className="text-xs text-red-600 mt-1.5">{dateErrors.judgingStart}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                          نهاية التحكيم <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={form.judgingEnd}
                          onChange={(e) => updateForm('judgingEnd', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            dateErrors.judgingEnd
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                              : 'border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10'
                          }`}
                        />
                        {dateErrors.judgingEnd && (
                          <p className="text-xs text-red-600 mt-1.5">{dateErrors.judgingEnd}</p>
                        )}
                      </div>
                    </div>

                    {/* Add Judge Button */}
                    <button
                      onClick={addJudge}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#e35654] hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-[#e35654]"
                      style={{ fontWeight: 600 }}
                    >
                      <Plus className="w-5 h-5" />
                      إضافة محكم جديد
                    </button>

                    {/* Judges List */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm text-gray-900" style={{ fontWeight: 700 }}>المحكمون المضافون ({judges.length})</h3>
                        <span className="text-xs text-gray-500">سيتم توزيع المشاريع بالتساوي</span>
                      </div>
                      <div className="space-y-3">
                        {judges.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                            لم تتم إضافة أي محكمين بعد
                          </div>
                        )}
                        {judges.map((judge) => (
                          <div key={judge.id} className="p-4 border-2 border-gray-200 rounded-xl bg-white">
                            <div className="grid grid-cols-3 gap-3 mb-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>اسم المحكم</label>
                                <input
                                  type="text"
                                  value={judge.name}
                                  onChange={(e) => updateJudge(judge.id, 'name', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>البريد الإلكتروني</label>
                                <input
                                  type="email"
                                  value={judge.email}
                                  onChange={(e) => updateJudge(judge.id, 'email', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 600 }}>التخصص</label>
                                <input
                                  type="text"
                                  value={judge.specialty}
                                  onChange={(e) => updateJudge(judge.id, 'specialty', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#e35654]"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500">سيتم إرسال دعوة بالبريد الإلكتروني عند الحفظ</p>
                              <button
                                onClick={() => removeJudge(judge.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs flex items-center gap-1"
                                style={{ fontWeight: 600 }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                حذف
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
                                    value={prize.position}
                                    onChange={(e) => updatePrize(prize.id, 'position', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>قيمة الجائزة</label>
                                  <input
                                    type="text"
                                    placeholder="50,000 ريال"
                                    value={prize.amount}
                                    onChange={(e) => updatePrize(prize.id, 'amount', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>تفاصيل الجائزة وطريقة الاستلام</label>
                                <textarea
                                  rows={3}
                                  placeholder="وصف الجائزة، الشروط، وطريقة الاستلام..."
                                  value={prize.description}
                                  onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
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
                        value={form.prizeTerms}
                        onChange={(e) => updateForm('prizeTerms', e.target.value)}
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
                          other: '🎯'
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
                                        value={pkg.name}
                                        onChange={(e) => updateSponsorPackage(pkg.id, { name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>نوع الرعاية</label>
                                      <select
                                        value={pkg.type}
                                        onChange={(e) => updateSponsorPackage(pkg.id, { type: e.target.value as SponsorPackage['type'] })}
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
                                      value={pkg.description}
                                      onChange={(e) => updateSponsorPackage(pkg.id, { description: e.target.value })}
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>مدة الرعاية</label>
                                    <input
                                      type="text"
                                      placeholder="3 أشهر"
                                      value={pkg.duration}
                                      onChange={(e) => updateSponsorPackage(pkg.id, { duration: e.target.value })}
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
                                        value={pkg.price}
                                        onChange={(e) => updateSponsorPackage(pkg.id, { price: e.target.value })}
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
                                      value={pkg.sponsorOffer}
                                      onChange={(e) => updateSponsorPackage(pkg.id, { sponsorOffer: e.target.value })}
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e35654] resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1" style={{ fontWeight: 600 }}>عدد الموارد (اختياري)</label>
                                    <input
                                      type="text"
                                      placeholder="مثال: 2 مطور، 50 جهاز، 200 وجبة، إلخ"
                                      value={pkg.resources}
                                      onChange={(e) => updateSponsorPackage(pkg.id, { resources: e.target.value })}
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
                                            placeholder={`ميزة ${i + 1} - مثال: ظهور الشعار في الموقع، جناح خاص، شهادة تقدير، إلخ`}
                                            value={pkg.benefits[i] ?? ''}
                                            onChange={(e) => updateSponsorBenefit(pkg.id, i, e.target.value)}
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
                      disabled={isSaving}
                      className={`px-8 py-3 rounded-xl text-white transition-all flex items-center gap-2 ${
                        isSaving
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-[#e35654] hover:shadow-lg hover:shadow-[#e35654]/30'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {isSaving ? 'جاري النشر...' : 'نشر الهاكاثون'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={isSaving}
                      className={`px-8 py-3 rounded-xl text-white transition-all ${
                        isSaving
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-[#e35654] hover:bg-[#cc4a48]'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {isSaving ? 'جاري الحفظ...' : 'التالي'}
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
        onViewHackathon={() => {
          if (form.slug.trim()) window.open(`/Prototype/hackathon/${form.slug.trim()}`, '_blank');
        }}
        onViewDashboard={() => navigate('/admin/my-hackathons')}
        hackathonUrl={form.slug.trim() ? `${window.location.origin}/Prototype/hackathon/${form.slug.trim()}` : ''}
      />

    </div>
  );
}