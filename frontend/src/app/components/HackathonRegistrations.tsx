import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, FileDown, Search, RefreshCw, Check, X, Eye, Mail, Filter, TrendingUp, Calendar, Pencil, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPut, apiPost, ApiError } from '../../lib/api';

// Display label for the registration "type" column — combines participation_type
// with team_method to produce a clear, filterable category.
type RegistrationType = 'فردي' | 'فريق يدوي' | 'فريق بالذكاء الاصطناعي';

interface Registration {
  id: number;
  name: string;
  email: string;
  avatar: string;
  type: RegistrationType;
  track: string;
  registrationDate: string;
  status: 'قيد الانتظار' | 'تم القبول' | 'تم الرفض';
  skills: string[];
  ideaTitle: string;
  ideaDescription: string;
  notificationSentAt: string | null;
  teamId: number | null;
  teamName: string | null;
}

interface ApiRegistration {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  type: 'solo' | 'team';
  teamMethod: 'ai' | 'manual' | null;
  ideaTitle: string;
  ideaDescription: string;
  registrationDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedAt: string | null;
  notificationSentAt: string | null;
  teamId: number | null;
  teamName: string | null;
  skills: string[];
  trackName: string | null;
}

const STATUS_TO_AR: Record<ApiRegistration['status'], Registration['status']> = {
  pending: 'قيد الانتظار',
  accepted: 'تم القبول',
  rejected: 'تم الرفض',
};
const STATUS_TO_EN: Record<Registration['status'], ApiRegistration['status']> = {
  'قيد الانتظار': 'pending',
  'تم القبول': 'accepted',
  'تم الرفض': 'rejected',
};

// Derive the UI type label from participation_type + team_method.
// Defensive: solo → "فردي". Team without an explicit method (legacy rows that
// existed before migration 016) falls back to "فريق يدوي" so it appears under
// the manual filter rather than dropping out of every category.
function deriveType(r: ApiRegistration): RegistrationType {
  if (r.type === 'solo') return 'فردي';
  if (r.teamMethod === 'ai') return 'فريق بالذكاء الاصطناعي';
  return 'فريق يدوي';
}

function formatDateAr(iso: string | null): string {
  if (!iso) return '—';
  // Handles "YYYY-MM-DD HH:MM:SS" (mysql2 dateStrings) and ISO timestamps.
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-SA', { day: '2-digit', month: 'long', year: 'numeric' });
}

function toUiRegistration(r: ApiRegistration): Registration {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    avatar: r.avatarUrl ?? '',
    type: deriveType(r),
    // Hackathon currently has a single track at most — every applicant maps to it.
    track: r.trackName ?? '—',
    registrationDate: formatDateAr(r.registrationDate),
    status: STATUS_TO_AR[r.status],
    skills: r.skills,
    ideaTitle: r.ideaTitle,
    ideaDescription: r.ideaDescription,
    notificationSentAt: r.notificationSentAt,
    teamId: r.teamId,
    teamName: r.teamName,
  };
}

// Initials fallback shown in a circle when the participant didn't upload an avatar.
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

// Mock data retained only for reference — replaced by real API.
const _UNUSED_MOCK: Registration[] = [
  {
    id: 1,
    name: 'سارة المنصور',
    email: 'sara.m@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'تطوير الويب',
    registrationDate: '12 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['React', 'Python', 'Machine Learning']
  },
  {
    id: 2,
    name: 'محمد الحربي',
    email: 'm.harbi@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    type: 'فريق (أساس)',
    track: 'الذكاء الاصطناعي',
    registrationDate: '11 أكتوبر 2023',
    status: 'تم القبول',
    skills: ['Python', 'TensorFlow', 'UI/UX Design']
  },
  {
    id: 3,
    name: 'عبدالله فهد',
    email: 'a.fahad@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'الأمن السيبراني',
    registrationDate: '10 أكتوبر 2023',
    status: 'تم الرفض',
    skills: ['Cybersecurity', 'Network Security', 'Ethical Hacking']
  },
  {
    id: 4,
    name: 'ريم الشريف',
    email: 'reem.s@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'فريق (رفيقة)',
    track: 'تطوير الويب',
    registrationDate: '10 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Frontend', 'React', 'Vue']
  },
  {
    id: 5,
    name: 'خالد العتيبي',
    email: 'khaled.o@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'الذكاء الاصطناعي',
    registrationDate: '09 أكتوبر 2023',
    status: 'تم القبول',
    skills: ['Python', 'Machine Learning', 'Deep Learning']
  },
  {
    id: 6,
    name: 'نورة القحطاني',
    email: 'norah.q@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    type: 'فريق (أساس)',
    track: 'تطوير الويب',
    registrationDate: '09 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['UI/UX Design', 'Figma', 'Frontend']
  },
  {
    id: 7,
    name: 'أحمد السعيد',
    email: 'ahmed.s@example.com',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'الأمن السيبراني',
    registrationDate: '08 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Cybersecurity', 'Penetration Testing']
  },
  {
    id: 8,
    name: 'هند المطيري',
    email: 'hind.m@example.com',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    type: 'فريق (رفيقة)',
    track: 'الذكاء الاصطناعي',
    registrationDate: '08 أكتوبر 2023',
    status: 'تم القبول',
    skills: ['Python', 'Machine Learning', 'Data Science']
  },
  {
    id: 9,
    name: 'فيصل الدوسري',
    email: 'faisal.d@example.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    type: 'فردي',
    track: 'تطوير الويب',
    registrationDate: '07 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Frontend', 'React', 'TypeScript']
  },
  {
    id: 10,
    name: 'مريم الشهري',
    email: 'maryam.sh@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    type: 'فريق (أساس)',
    track: 'الذكاء الاصطناعي',
    registrationDate: '07 أكتوبر 2023',
    status: 'قيد الانتظار',
    skills: ['Python', 'Machine Learning', 'UI/UX Design']
  }
];

export function HackathonRegistrations() {
  const { id } = useParams();
  // Suppress "declared but never read" for the mock array kept for documentation.
  void _UNUSED_MOCK;
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real registrations from the API.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet<{ items: ApiRegistration[] }>(`/hackathons/${id}/registrations`)
      .then((data) => setRegistrations(data.items.map(toUiRegistration)))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) {
          toast.error('ليس لديك صلاحية مراجعة تسجيلات هذا الهاكاثون');
        } else {
          toast.error(e instanceof ApiError ? e.message : 'فشل تحميل التسجيلات');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Registration window — visible to the organizer at the top of this page so they can
  // see at-a-glance when participants can register, and edit it inline.
  // Bounds are constrained by the hackathon's overall startDate/endDate.
  const [regWindow, setRegWindow] = useState<{
    registrationStart: string | null;
    registrationEnd: string | null;
    hackathonStart: string | null;
    hackathonEnd: string | null;
  }>({ registrationStart: null, registrationEnd: null, hackathonStart: null, hackathonEnd: null });
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [editRegStart, setEditRegStart] = useState('');
  const [editRegEnd, setEditRegEnd] = useState('');
  const [savingDates, setSavingDates] = useState(false);

  // Notification gate metadata from getHackathon. Drives the countdown banner
  // and the locked/unlocked state of the "مراسلة" button.
  const [notifyGate, setNotifyGate] = useState<{
    announcementDate: string | null;
    unlocked: boolean;
  }>({ announcementDate: null, unlocked: false });

  useEffect(() => {
    if (!id) return;
    apiGet<{
      hackathon: Record<string, string | null | undefined>;
      notifications?: { announcementDate: string | null; unlocked: boolean };
    }>(`/hackathons/${id}`)
      .then((data) => {
        const h = data.hackathon ?? {};
        setRegWindow({
          registrationStart: (h.H_Registration_StartDate as string) ?? null,
          registrationEnd: (h.H_Registration_EndDate as string) ?? null,
          hackathonStart: (h.H_StartDate as string) ?? null,
          hackathonEnd: (h.H_EndDate as string) ?? null,
        });
        if (data.notifications) {
          setNotifyGate({
            announcementDate: data.notifications.announcementDate,
            unlocked: data.notifications.unlocked,
          });
        }
      })
      .catch(() => {/* silent — banner just shows '—' */});
  }, [id]);

  // Live countdown to the announcement date — re-renders every second so the
  // organizer sees the clock tick. We stop the interval once the timer hits
  // zero (the banner then becomes the "unlocked" variant on the next tick).
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    if (!notifyGate.announcementDate) return;
    const announceMs = new Date(notifyGate.announcementDate).getTime();
    if (!Number.isFinite(announceMs)) return;
    if (announceMs <= Date.now()) {
      // Already unlocked — flip the local flag so the UI matches without waiting
      // for a server refresh.
      if (!notifyGate.unlocked) setNotifyGate((g) => ({ ...g, unlocked: true }));
      return;
    }
    const tick = setInterval(() => {
      const now = Date.now();
      setNowTs(now);
      if (now >= announceMs) {
        setNotifyGate((g) => ({ ...g, unlocked: true }));
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [notifyGate.announcementDate, notifyGate.unlocked]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterType, setFilterType] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState<'all' | 'قيد الانتظار' | 'تم القبول' | 'تم الرفض'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  // Which template the organizer is previewing. Sending only targets selected
  // participants whose current status matches this decision.
  const [notifyDecision, setNotifyDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [notifyLoading, setNotifyLoading] = useState(false);
  
  const itemsPerPage = 5;

  // Calculate stats
  const totalRegistrations = registrations.length;
  const pendingCount = registrations.filter(r => r.status === 'قيد الانتظار').length;
  const acceptedCount = registrations.filter(r => r.status === 'تم القبول').length;
  const rejectedCount = registrations.filter(r => r.status === 'تم الرفض').length;
  const acceptanceRate = totalRegistrations > 0 ? Math.round((acceptedCount / totalRegistrations) * 100) : 0;
  // pendingCount drives the badge on the total card — it's the "remaining to review" hint.

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchSearch = reg.name.includes(searchQuery) || reg.email.includes(searchQuery);
    const matchType = filterType === 'الكل' || reg.type === filterType;
    const matchStatus = filterStatus === 'all' || reg.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // Group manual-team members into a single row so the organizer reviews the
  // team as a unit (accept/reject + notification apply to every member). Solo
  // participants stay as standalone entries. AI-team members are still solo
  // applications at this stage (their team is assigned post-acceptance), so
  // they remain individual.
  type RegistrationGroup =
    | { kind: 'solo'; reg: Registration }
    | {
        kind: 'team';
        teamId: number;
        teamName: string;
        members: Registration[];
        leader: Registration; // first registered member — used for avatar/track
      };
  const groupedItems: RegistrationGroup[] = (() => {
    const teamMap = new Map<number, Registration[]>();
    const solos: Registration[] = [];
    for (const r of filteredRegistrations) {
      if (r.teamId != null && r.type === 'فريق يدوي') {
        const list = teamMap.get(r.teamId) ?? [];
        list.push(r);
        teamMap.set(r.teamId, list);
      } else {
        solos.push(r);
      }
    }
    const groups: RegistrationGroup[] = [];
    for (const [teamId, members] of teamMap) {
      groups.push({
        kind: 'team',
        teamId,
        teamName: members[0].teamName ?? `فريق #${teamId}`,
        members,
        leader: members[0],
      });
    }
    for (const r of solos) groups.push({ kind: 'solo', reg: r });
    return groups;
  })();

  // Pagination operates over grouped items, not raw registrations, so each
  // page row is "one unit of work" for the organizer.
  const totalPages = Math.ceil(groupedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGroups = groupedItems.slice(startIndex, endIndex);
  // Flat list of registrations on the current page — kept for legacy code
  // (CSV export, etc.) that still expects individual rows.
  const currentRegistrations = currentGroups.flatMap((g) =>
    g.kind === 'team' ? g.members : [g.reg],
  );

  // Skill frequency across all registrations. Counts each skill once per
  // participant (case-insensitive, trimmed). Percentage is "share of participants
  // who listed this skill" — never exceeds 100%.
  const skillStats: { [key: string]: { count: number; display: string } } = {};
  registrations.forEach((reg) => {
    const seenForThisParticipant = new Set<string>();
    reg.skills.forEach((skill) => {
      const norm = skill.trim().toLowerCase();
      if (!norm || seenForThisParticipant.has(norm)) return;
      seenForThisParticipant.add(norm);
      if (!skillStats[norm]) skillStats[norm] = { count: 0, display: skill.trim() };
      skillStats[norm].count += 1;
    });
  });

  const topSkills = Object.values(skillStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ display, count }) => ({
      skill: display,
      count,
      percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
    }));

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentRegistrations.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Functional setState so callers that loop (e.g. team-row toggles selecting
  // every member in one go) see each other's updates instead of clobbering
  // the array with stale state.
  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked
        ? prev.includes(id) ? prev : [...prev, id]
        : prev.filter((sid) => sid !== id),
    );
  };

  // Persist status to the backend then mirror in local state. Note that on a 'pending'
  // hackathon the participant wouldn't normally land in workspace — status flips that.
  const setStatus = async (regId: number, newStatus: Registration['status']): Promise<boolean> => {
    if (!id) return false;
    try {
      await apiPut(`/hackathons/${id}/registrations/${regId}/status`, {
        status: STATUS_TO_EN[newStatus],
      });
      setRegistrations((prev) => prev.map((reg) => (reg.id === regId ? { ...reg, status: newStatus } : reg)));
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'فشل تحديث الحالة';
      toast.error(msg);
      return false;
    }
  };

  const handleAccept = async (regId: number) => {
    const ok = await setStatus(regId, 'تم القبول');
    if (ok) {
      toast.success('تم قبول الطلب', {
        description: `تم قبول ${registrations.find((r) => r.id === regId)?.name}`,
        duration: 3000,
      });
    }
  };

  const handleReject = async (regId: number) => {
    const ok = await setStatus(regId, 'تم الرفض');
    if (ok) {
      toast.error('تم رفض الطلب', {
        description: `تم رفض طلب ${registrations.find((r) => r.id === regId)?.name}`,
        duration: 3000,
      });
    }
  };

  const handleAcceptSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('لم يتم التحديد', {
        description: 'الرجاء تحديد طلب واحد على الأقل',
        duration: 3000,
      });
      return;
    }
    // Persist all selected in parallel; tolerate partial failures.
    await Promise.all(selectedIds.map((rid) => setStatus(rid, 'تم القبول')));

    // Open the notify modal in "accepted" mode — template is rendered from notifyDecision.
    setNotifyDecision('accepted');
    setShowEmailModal(true);
  };

  const handleRejectSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('لم يتم التحديد', {
        description: 'الرجاء تحديد طلب واحد على الأقل',
        duration: 3000,
      });
      return;
    }
    await Promise.all(selectedIds.map((rid) => setStatus(rid, 'تم الرفض')));

    // Open the notify modal in "rejected" mode — template is rendered from notifyDecision.
    setNotifyDecision('rejected');
    setShowEmailModal(true);
  };

  const handleSendCustomEmail = () => {
    if (!notifyGate.unlocked) {
      toast.error('غير متاح بعد', {
        description: notifyGate.announcementDate
          ? `إرسال الإيميلات متاح يوم ${formatDateAr(notifyGate.announcementDate)}`
          : 'حدّد تاريخ إعلان النتائج أولاً',
        duration: 4000,
      });
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('لم يتم التحديد', {
        description: 'الرجاء تحديد طلب واحد على الأقل',
        duration: 3000,
      });
      return;
    }

    // Default to "accepted" preview if any accepted in selection, else "rejected"
    const selectedRegs = registrations.filter((r) => selectedIds.includes(r.id));
    const hasAccepted = selectedRegs.some((r) => r.status === 'تم القبول');
    setNotifyDecision(hasAccepted ? 'accepted' : 'rejected');
    setShowEmailModal(true);
  };

  const handleResetFilters = () => {
    setFilterType('الكل');
    setFilterStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
    toast.success('تم إعادة تعيين الفلاتر', {
      duration: 2000,
    });
  };

  // CSV cell escape: wrap any field containing commas/quotes/newlines in quotes
  // and double-up internal quotes. Excel-safe.
  const csvCell = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const headers = [
      'الاسم',
      'البريد الإلكتروني',
      'نوع المشاركة',
      'المسار',
      'عنوان الفكرة',
      'نبذة الفكرة',
      'المهارات',
      'الحالة',
      'تاريخ التسجيل',
      'تم إرسال إشعار؟',
    ];
    const rows = filteredRegistrations.map((r) => [
      csvCell(r.name),
      csvCell(r.email),
      csvCell(r.type),
      csvCell(r.track),
      csvCell(r.ideaTitle),
      csvCell(r.ideaDescription),
      csvCell(r.skills.join(' | ')),
      csvCell(r.status),
      csvCell(r.registrationDate),
      csvCell(r.notificationSentAt ? 'نعم' : 'لا'),
    ].join(','));

    // UTF-8 BOM so Excel renders Arabic correctly when opening the file.
    const csv = '﻿' + headers.map(csvCell).join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `registrations-hackathon-${id}-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('تم التصدير', {
      description: `${filteredRegistrations.length} طلب`,
      duration: 3000,
    });
  };

  // Recipients eligible to receive the currently-previewed template:
  // selected participants whose status matches the decision AND who haven't
  // been notified yet. (Backend enforces the same filter — this is for the
  // preview count and to short-circuit useless API calls.)
  const eligibleForNotify = (): Registration[] => {
    const targetStatus = notifyDecision === 'accepted' ? 'تم القبول' : 'تم الرفض';
    return registrations.filter(
      (r) =>
        selectedIds.includes(r.id) &&
        r.status === targetStatus &&
        !r.notificationSentAt,
    );
  };

  const handleConfirmSendEmails = async () => {
    if (!id) return;
    const eligible = eligibleForNotify();
    if (eligible.length === 0) {
      toast.error('لا يوجد مستلمون مؤهلون', {
        description: 'تأكد من تحديد طلبات بنفس الحالة لم يتم إبلاغها بعد',
        duration: 3000,
      });
      return;
    }

    setNotifyLoading(true);
    try {
      const result = await apiPost<{
        sent: number[];
        skipped: number[];
        failed: Array<{ pmId: number; reason: string }>;
        sentCount: number;
        skippedCount: number;
        failedCount: number;
      }>(`/hackathons/${id}/registrations/notify`, {
        pmIds: eligible.map((r) => r.id),
        decision: notifyDecision,
      });

      if (result.sentCount > 0) {
        const nowIso = new Date().toISOString();
        setRegistrations((prev) =>
          prev.map((r) =>
            result.sent.includes(r.id) ? { ...r, notificationSentAt: nowIso } : r,
          ),
        );
      }

      toast.success('تم إرسال الإشعارات', {
        description:
          `أُرسل: ${result.sentCount}` +
          (result.failedCount > 0 ? ` · فشل: ${result.failedCount}` : ''),
        duration: 4000,
      });

      setShowEmailModal(false);
      setSelectedIds([]);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'تعذّر إرسال الإشعارات', {
        duration: 4000,
      });
    } finally {
      setNotifyLoading(false);
    }
  };

  const getStatusBadge = (status: Registration['status']) => {
    const config = {
      'قيد الانتظار': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'تم القبول': 'bg-green-100 text-green-700 border-green-200',
      'تم الرفض': 'bg-[#fce7eb] text-[#a93b39] border-[#fad1d8]'
    };
    return config[status];
  };

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
                  إدارة التسجيلات والطلبات
                </h1>
                <p className="text-sm text-gray-500">
                  مراجعة وتصفية وتحليل طلبات الانضمام للهاكاثون الحالي.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
              style={{ fontWeight: 600 }}
            >
              <FileDown className="w-4 h-4" />
              تصدير البيانات (CSV)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Registration Window — visible at a glance + inline edit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-[#fce7eb] flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-[#e35654]" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-gray-500 mb-1">نافذة التسجيل</p>
            <div className="flex items-center gap-2 flex-wrap text-sm text-gray-900" style={{ fontWeight: 600 }}>
              <span>{formatDateAr(regWindow.registrationStart)}</span>
              <span className="text-gray-400">→</span>
              <span>{formatDateAr(regWindow.registrationEnd)}</span>
            </div>
          </div>
          <button
            onClick={() => {
              const toLocal = (v: string | null) => (v ? v.replace(' ', 'T').slice(0, 16) : '');
              setEditRegStart(toLocal(regWindow.registrationStart));
              setEditRegEnd(toLocal(regWindow.registrationEnd));
              setShowDatesModal(true);
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:border-[#e35654] hover:text-[#e35654] transition-all flex items-center gap-2"
            style={{ fontWeight: 600 }}
          >
            <Pencil className="w-4 h-4" />
            تعديل التواريخ
          </button>
        </div>

        {/* Announcement countdown — drives the lock/unlock state of the "مراسلة" button.
            Three states: not configured, counting down, unlocked. */}
        {(() => {
          if (!notifyGate.announcementDate) {
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-amber-900 mb-0.5" style={{ fontWeight: 700 }}>
                    لم يتم تحديد تاريخ إعلان النتائج
                  </p>
                  <p className="text-xs text-amber-800">
                    حدّد تاريخ الإعلان من إعدادات الهاكاثون لتتمكن من إرسال إيميلات القبول/الرفض.
                  </p>
                </div>
              </div>
            );
          }
          const announceMs = new Date(notifyGate.announcementDate).getTime();
          const diff = announceMs - nowTs;
          if (notifyGate.unlocked || diff <= 0) {
            return (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-green-900 mb-0.5" style={{ fontWeight: 700 }}>
                    يمكنك الآن إرسال إيميلات النتائج
                  </p>
                  <p className="text-xs text-green-800">
                    تاريخ الإعلان: {formatDateAr(notifyGate.announcementDate)} — حدّد المشاركين المقبولين/المرفوضين واضغط "مراسلة".
                  </p>
                </div>
              </div>
            );
          }
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-blue-700 mb-2" style={{ fontWeight: 600 }}>
                  إعلان النتائج للمشاركين بعد:
                </p>
                <div className="flex items-center gap-3 text-blue-900">
                  <div className="text-center">
                    <div className="text-xl tabular-nums" style={{ fontWeight: 700 }}>{days}</div>
                    <div className="text-[10px] text-blue-700">يوم</div>
                  </div>
                  <span className="text-blue-300">:</span>
                  <div className="text-center">
                    <div className="text-xl tabular-nums" style={{ fontWeight: 700 }}>{String(hours).padStart(2, '0')}</div>
                    <div className="text-[10px] text-blue-700">ساعة</div>
                  </div>
                  <span className="text-blue-300">:</span>
                  <div className="text-center">
                    <div className="text-xl tabular-nums" style={{ fontWeight: 700 }}>{String(minutes).padStart(2, '0')}</div>
                    <div className="text-[10px] text-blue-700">دقيقة</div>
                  </div>
                  <span className="text-blue-300">:</span>
                  <div className="text-center">
                    <div className="text-xl tabular-nums" style={{ fontWeight: 700 }}>{String(seconds).padStart(2, '0')}</div>
                    <div className="text-[10px] text-blue-700">ثانية</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-700 mb-0.5">الموعد المحدد</p>
                <p className="text-sm text-blue-900" style={{ fontWeight: 700 }}>
                  {formatDateAr(notifyGate.announcementDate)}
                </p>
                <p className="text-[11px] text-blue-700 mt-1">
                  حتى هذا التاريخ، قراراتك خاصة بك — المشاركون لا يرونها.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'all' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'all' ? 'bg-blue-600' : 'bg-blue-50'
              }`}>
                <svg className={`w-6 h-6 ${filterStatus === 'all' ? 'text-white' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {pendingCount > 0 && (
                <span className="text-xs text-yellow-700 px-2 py-1 rounded-full bg-yellow-50" style={{ fontWeight: 600 }}>
                  {pendingCount} للمراجعة
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">إجمالي الطلبات</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{totalRegistrations.toLocaleString('ar-SA')}</p>
          </button>

          <button
            onClick={() => setFilterStatus('قيد الانتظار')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'قيد الانتظار' ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'قيد الانتظار' ? 'bg-yellow-600' : 'bg-yellow-50'
              }`}>
                <svg className={`w-6 h-6 ${filterStatus === 'قيد الانتظار' ? 'text-white' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-orange-600 px-2 py-1 rounded-full bg-orange-50" style={{ fontWeight: 600 }}>نشط</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">قيد الانتظار</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{pendingCount}</p>
          </button>

          <button
            onClick={() => setFilterStatus('تم القبول')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'تم القبول' ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'تم القبول' ? 'bg-green-600' : 'bg-green-50'
              }`}>
                <Check className={`w-6 h-6 ${filterStatus === 'تم القبول' ? 'text-white' : 'text-green-600'}`} />
              </div>
              <span className="text-xs text-green-600" style={{ fontWeight: 600 }}>{acceptanceRate}%</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">تم القبول</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{acceptedCount}</p>
          </button>

          <button
            onClick={() => setFilterStatus('تم الرفض')}
            className={`bg-white rounded-2xl border p-6 text-right transition-all ${
              filterStatus === 'تم الرفض' ? 'border-[#e35654] shadow-lg shadow-red-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                filterStatus === 'تم الرفض' ? 'bg-[#cc4a48]' : 'bg-[#fef2f4]'
              }`}>
                <X className={`w-6 h-6 ${filterStatus === 'تم الرفض' ? 'text-white' : 'text-[#cc4a48]'}`} />
              </div>
              <span className="text-xs text-[#cc4a48]" style={{ fontWeight: 600 }}>
                {totalRegistrations > 0 ? Math.round((rejectedCount / totalRegistrations) * 100) : 0}%
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">تم الرفض</p>
            <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{rejectedCount}</p>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500"
                style={{ fontWeight: 600 }}
              >
                <option value="الكل">نوع المشاركة: الكل</option>
                <option value="فردي">فردي</option>
                <option value="فريق يدوي">فريق يدوي</option>
                <option value="فريق بالذكاء الاصطناعي">فريق بالذكاء الاصطناعي</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-all"
              style={{ fontWeight: 600 }}
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تعيين الفلاتر
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`ابحث ${filteredRegistrations.length} من أصل ${totalRegistrations} طلب...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-4 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedIds.length === currentRegistrations.length && currentRegistrations.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700" style={{ fontWeight: 600 }}>تحديد الكل</span>
            </label>

            <button
              onClick={handleAcceptSelected}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-all"
              style={{ fontWeight: 600 }}
            >
              <Check className="w-4 h-4" />
              إشعار بالقبول
            </button>

            <button
              onClick={handleRejectSelected}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#cc4a48] text-white text-sm hover:bg-[#a93b39] transition-all"
              style={{ fontWeight: 600 }}
            >
              <X className="w-4 h-4" />
              إشعار بالرفض
            </button>

            <button
              onClick={handleSendCustomEmail}
              disabled={!notifyGate.unlocked}
              title={
                !notifyGate.announcementDate
                  ? 'حدّد تاريخ إعلان النتائج أولاً'
                  : !notifyGate.unlocked
                  ? `متاح يوم ${formatDateAr(notifyGate.announcementDate)}`
                  : 'إرسال إيميلات القبول/الرفض'
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                notifyGate.unlocked
                  ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
              style={{ fontWeight: 600 }}
            >
              <Mail className="w-4 h-4" />
              مراسلة
              {!notifyGate.unlocked && <span className="text-[10px]">🔒</span>}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>#</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>المشاركين</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>النوع</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>المسار</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>تاريخ التسجيل</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الحالة</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentGroups.map((group) => {
                // For a team group, the row represents all members. Status is
                // the leader's (all members move in lockstep when actioned).
                const ids = group.kind === 'team' ? group.members.map((m) => m.id) : [group.reg.id];
                const allSelected = ids.every((id) => selectedIds.includes(id));
                const primary = group.kind === 'team' ? group.leader : group.reg;
                const status = primary.status;
                const anyNotified =
                  group.kind === 'team'
                    ? group.members.some((m) => m.notificationSentAt)
                    : group.reg.notificationSentAt != null;
                const onToggle = (checked: boolean) => {
                  for (const id of ids) handleSelectOne(id, checked);
                };
                const onAcceptAll = () => {
                  for (const id of ids) handleAccept(id);
                };
                const onRejectAll = () => {
                  for (const id of ids) handleReject(id);
                };
                return (
                  <tr key={group.kind === 'team' ? `team-${group.teamId}` : `solo-${group.reg.id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => onToggle(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {group.kind === 'team' ? (
                        <div>
                          {/* Team header — name + member count */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs" style={{ fontWeight: 700 }}>
                              👥
                            </div>
                            <div>
                              <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                                {group.teamName}
                                <span className="text-xs text-gray-500 mr-2" style={{ fontWeight: 500 }}>
                                  ({group.members.length} أعضاء)
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">يتم القبول/الرفض للفريق كاملاً</p>
                            </div>
                          </div>
                          {/* Members list */}
                          <div className="space-y-1.5 pr-6 border-r-2 border-gray-100">
                            {group.members.map((m) => (
                              <div key={m.id} className="flex items-center gap-2">
                                {m.avatar ? (
                                  <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]" style={{ fontWeight: 700 }}>
                                    {getInitials(m.name)}
                                  </div>
                                )}
                                <span className="text-xs text-gray-700">{m.name}</span>
                                <span className="text-[11px] text-gray-400">·</span>
                                <span className="text-[11px] text-gray-500">{m.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {group.reg.avatar ? (
                            <img
                              src={group.reg.avatar}
                              alt={group.reg.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center text-xs" style={{ fontWeight: 700 }}>
                              {getInitials(group.reg.name)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{group.reg.name}</p>
                            <p className="text-xs text-gray-500">{group.reg.email}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{primary.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{primary.track}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{primary.registrationDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusBadge(status)}`} style={{ fontWeight: 600 }}>
                          {status}
                        </span>
                        {anyNotified && (
                          <span title="تم إرسال إشعار للمشارك" className="text-blue-500" aria-label="notified">
                            <Mail className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {status === 'قيد الانتظار' && (
                          <>
                            <button
                              onClick={onRejectAll}
                              title={group.kind === 'team' ? `رفض الفريق (${ids.length})` : 'رفض الطلب'}
                              className="w-8 h-8 rounded-lg bg-gray-50 text-[#cc4a48] flex items-center justify-center hover:bg-[#fef2f4] transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={onAcceptAll}
                              title={group.kind === 'team' ? `قبول الفريق (${ids.length})` : 'قبول الطلب'}
                              className="w-8 h-8 rounded-lg bg-gray-50 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedRegistration(primary)}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {currentRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد نتائج</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-gray-500">
              عرض صفحة {currentPage} من {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ fontWeight: 600 }}
              >
                السابق
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ fontWeight: 600 }}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Skills Chart — top 5 skills among current registrations by frequency */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
              أكثر المهارات تكرارًا
            </h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          {topSkills.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">لا توجد مهارات مسجّلة بعد.</p>
          ) : (
            <div className="space-y-4">
              {topSkills.map((skill, index) => {
                const barColor = ['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-500', 'bg-pink-500'][index] ?? 'bg-gray-400';
                return (
                  <div key={skill.skill}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{skill.skill}</span>
                      <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>
                        {skill.count} مشارك · {skill.percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${skill.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal — preview the decision template, then confirm send */}
      {showEmailModal && (() => {
        const selectedRegs = registrations.filter((r) => selectedIds.includes(r.id));
        const acceptedSelected = selectedRegs.filter((r) => r.status === 'تم القبول');
        const rejectedSelected = selectedRegs.filter((r) => r.status === 'تم الرفض');
        const pendingSelected = selectedRegs.filter((r) => r.status === 'قيد الانتظار');
        const targetList = notifyDecision === 'accepted' ? acceptedSelected : rejectedSelected;
        const eligible = targetList.filter((r) => !r.notificationSentAt);
        const alreadyNotified = targetList.length - eligible.length;
        const sampleName = eligible[0]?.name ?? targetList[0]?.name ?? '[الاسم]';

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="mb-5">
                <h2 className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  إرسال إشعار للمشاركين
                </h2>
                <p className="text-sm text-gray-500">
                  اختر قالب الإشعار وراجع المعاينة قبل التأكيد
                </p>
              </div>

              {/* Selection breakdown */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="rounded-xl border border-green-100 bg-green-50/60 p-3 text-center">
                  <p className="text-xs text-green-700">مقبول</p>
                  <p className="text-base text-green-800" style={{ fontWeight: 700 }}>{acceptedSelected.length}</p>
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 text-center">
                  <p className="text-xs text-red-700">مرفوض</p>
                  <p className="text-base text-red-800" style={{ fontWeight: 700 }}>{rejectedSelected.length}</p>
                </div>
                <div className="rounded-xl border border-yellow-100 bg-yellow-50/60 p-3 text-center">
                  <p className="text-xs text-yellow-700">قيد الانتظار</p>
                  <p className="text-base text-yellow-800" style={{ fontWeight: 700 }}>{pendingSelected.length}</p>
                </div>
              </div>

              {/* Template tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setNotifyDecision('accepted')}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm transition-colors ${
                    notifyDecision === 'accepted'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  قالب القبول ({acceptedSelected.length})
                </button>
                <button
                  onClick={() => setNotifyDecision('rejected')}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm transition-colors ${
                    notifyDecision === 'rejected'
                      ? 'bg-[#cc4a48] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  قالب الرفض ({rejectedSelected.length})
                </button>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 mb-4">
                {notifyDecision === 'accepted' ? (
                  <div className="space-y-3 text-sm text-gray-800 leading-relaxed">
                    <p style={{ fontWeight: 700 }}>الموضوع: تم قبول طلبك في الهاكاثون</p>
                    <hr className="border-gray-200" />
                    <p>مرحباً <strong>{sampleName}</strong>،</p>
                    <p>يسعدنا إخبارك بأنه تم قبول طلبك للمشاركة في هاكاثون <strong>"...اسم الهاكاثون..."</strong>.</p>
                    <p className="text-xs text-gray-500">[زر: الدخول إلى مساحة العمل]</p>
                    <p className="text-gray-500 text-xs">يمكنك الآن متابعة آخر التحديثات والاطلاع على تفاصيل الفعالية، والبدء في إعداد مشروعك.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-gray-800 leading-relaxed">
                    <p style={{ fontWeight: 700 }}>الموضوع: بخصوص طلبك في الهاكاثون</p>
                    <hr className="border-gray-200" />
                    <p>مرحباً <strong>{sampleName}</strong>،</p>
                    <p>نشكرك على اهتمامك بالمشاركة في هاكاثون <strong>"...اسم الهاكاثون..."</strong>.</p>
                    <p>نأسف لإبلاغك بأنه لم يتم قبول طلبك هذه المرة. نقدّر وقتك ونتمنى لك التوفيق في الفعاليات القادمة.</p>
                  </div>
                )}
              </div>

              {/* Eligibility note */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-4">
                <p className="text-xs text-blue-900 mb-1" style={{ fontWeight: 600 }}>
                  سيتم الإرسال إلى {eligible.length} مشارك
                </p>
                {alreadyNotified > 0 && (
                  <p className="text-xs text-blue-700">
                    {alreadyNotified} مشارك تم إبلاغهم مسبقًا — لن يُرسل لهم مرة ثانية.
                  </p>
                )}
                {pendingSelected.length > 0 && (
                  <p className="text-xs text-blue-700 mt-1">
                    {pendingSelected.length} مشارك قيد المراجعة — لن يُشمل في الإرسال.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  disabled={notifyLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmSendEmails}
                  disabled={eligible.length === 0 || notifyLoading}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm transition-all disabled:bg-gray-300 disabled:cursor-not-allowed ${
                    notifyDecision === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#cc4a48] hover:bg-[#a93b39]'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {notifyLoading ? 'جاري الإرسال...' : `تأكيد الإرسال (${eligible.length})`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Registration Details Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRegistration(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              {selectedRegistration.avatar ? (
                <img
                  src={selectedRegistration.avatar}
                  alt={selectedRegistration.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e35654] to-[#cc4a48] text-white flex items-center justify-center text-lg" style={{ fontWeight: 700 }}>
                  {getInitials(selectedRegistration.name)}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  {selectedRegistration.name}
                </h2>
                <p className="text-sm text-gray-500">{selectedRegistration.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusBadge(selectedRegistration.status)}`} style={{ fontWeight: 600 }}>
                {selectedRegistration.status}
              </span>
            </div>

            {/* Idea details — the title + description the participant entered when registering */}
            {(selectedRegistration.ideaTitle || selectedRegistration.ideaDescription) && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100">
                <p className="text-xs text-gray-500 mb-2">الفكرة المقترحة</p>
                {selectedRegistration.ideaTitle && (
                  <p className="text-base text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    {selectedRegistration.ideaTitle}
                  </p>
                )}
                {selectedRegistration.ideaDescription && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedRegistration.ideaDescription}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">النوع</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedRegistration.type}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">المسار</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedRegistration.track}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 col-span-2">
                <p className="text-xs text-gray-500 mb-1">تاريخ التسجيل</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{selectedRegistration.registrationDate}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>المهارات</p>
              <div className="flex flex-wrap gap-2">
                {selectedRegistration.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs" style={{ fontWeight: 600 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {selectedRegistration.status === 'قيد الانتظار' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleReject(selectedRegistration.id);
                    setSelectedRegistration(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#fad1d8] text-[#a93b39] text-sm hover:bg-[#fef2f4] transition-all"
                  style={{ fontWeight: 600 }}
                >
                  رفض الطلب
                </button>
                <button
                  onClick={() => {
                    handleAccept(selectedRegistration.id);
                    setSelectedRegistration(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  قبول الطلب
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Dates Edit Modal */}
      {showDatesModal && (() => {
        // Validation against the hackathon window — the organizer set the outer dates
        // at creation time; registration must fit inside them and be self-consistent.
        const toMs = (v: string) => (v ? new Date(v).getTime() : NaN);
        const hStartMs = regWindow.hackathonStart ? new Date(regWindow.hackathonStart.replace(' ', 'T')).getTime() : null;
        const hEndMs = regWindow.hackathonEnd ? new Date(regWindow.hackathonEnd.replace(' ', 'T')).getTime() : null;
        const startMs = toMs(editRegStart);
        const endMs = toMs(editRegEnd);
        const errors: string[] = [];
        if (!editRegStart) errors.push('تاريخ فتح التسجيل مطلوب');
        if (!editRegEnd) errors.push('تاريخ إغلاق التسجيل مطلوب');
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
          errors.push('تاريخ إغلاق التسجيل يجب أن يكون بعد تاريخ الفتح');
        }
        if (hStartMs != null && Number.isFinite(startMs) && startMs < hStartMs) {
          errors.push('تاريخ فتح التسجيل يجب أن يكون داخل فترة الهاكاثون (بعد تاريخ بدئه)');
        }
        if (hEndMs != null && Number.isFinite(endMs) && endMs > hEndMs) {
          errors.push('تاريخ إغلاق التسجيل يجب أن يكون داخل فترة الهاكاثون (قبل تاريخ انتهائه)');
        }
        const canSave = errors.length === 0 && !savingDates;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg text-gray-900" style={{ fontWeight: 700 }}>تعديل نافذة التسجيل</h3>
                <button onClick={() => setShowDatesModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  لازم تكون التواريخ ضمن فترة الهاكاثون
                  ({formatDateAr(regWindow.hackathonStart)} → {formatDateAr(regWindow.hackathonEnd)}).
                </p>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>فتح التسجيل</label>
                  <input
                    type="datetime-local"
                    value={editRegStart}
                    onChange={(e) => setEditRegStart(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>إغلاق التسجيل</label>
                  <input
                    type="datetime-local"
                    value={editRegEnd}
                    onChange={(e) => setEditRegEnd(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:bg-white"
                  />
                </div>
                {errors.length > 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 space-y-1">
                    {errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-6 pb-6">
                <button
                  onClick={() => setShowDatesModal(false)}
                  disabled={savingDates}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    if (!canSave || !id) return;
                    setSavingDates(true);
                    try {
                      await apiPut(`/hackathons/${id}`, {
                        registrationStart: editRegStart,
                        registrationEnd: editRegEnd,
                      });
                      setRegWindow((prev) => ({
                        ...prev,
                        registrationStart: editRegStart.replace('T', ' ') + ':00',
                        registrationEnd: editRegEnd.replace('T', ' ') + ':00',
                      }));
                      toast.success('تم تحديث تواريخ التسجيل');
                      setShowDatesModal(false);
                    } catch (e) {
                      const msg = e instanceof ApiError ? e.message : 'تعذّر الحفظ';
                      toast.error(msg);
                    } finally {
                      setSavingDates(false);
                    }
                  }}
                  disabled={!canSave}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontWeight: 600 }}
                >
                  {savingDates ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
