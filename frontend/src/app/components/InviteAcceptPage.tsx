import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ApiError, apiPost } from '../../lib/api';
import { getToken } from '../../lib/auth';
import { SECTION_LABELS, type Section } from '../../lib/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Invitation {
  // Backend tells us which kind of invite this is — 'co_manager' for organizer
  // team members (manager/staff), 'judge' for evaluators.
  kind: 'co_manager' | 'judge';
  invitee: {
    fullName: string;
    email: string;
    role: 'manager' | 'staff' | 'judge';
    // Co-manager only: which section they manage.
    section?: Section | null;
    // Judge only: their specialty (optional free text).
    specialty?: string | null;
  };
  hackathon: {
    title: string;
    organizerName: string;
  } | null;
  status: 'pending' | 'accepted' | 'declined';
  expired: boolean;
  alreadyAccepted: boolean;
}

export function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'network' | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/invitations/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setError('not_found');
          return null;
        }
        if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        if (d) setData(d as Invitation);
      })
      .catch(() => setError('network'))
      .finally(() => setLoading(false));
  }, [token]);

  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Two-step accept by design — matches the user's mental model:
  //   1. Always route to /auth on click "Accept", even if already logged in.
  //      This makes the signup/login step feel like part of the acceptance.
  //   2. After OTP, AuthPage redirects back here with ?action=accept. Detect that
  //      and call the API automatically so the user doesn't click "Accept" twice.
  const startAccept = async () => {
    if (!data || !token) return;
    setAcceptError(null);
    try {
      const probe = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', email: data.invitee.email, password: '__probe__' }),
      });
      const accountExists = probe.status !== 404;
      const params = new URLSearchParams({
        email: data.invitee.email,
        role: 'admin',
        mode: accountExists ? 'login' : 'signup',
        next: `/invite/${encodeURIComponent(token)}?action=accept`,
      });
      navigate(`/auth?${params.toString()}`);
    } catch {
      const params = new URLSearchParams({
        email: data.invitee.email,
        role: 'admin',
        mode: 'signup',
        next: `/invite/${encodeURIComponent(token)}?action=accept`,
      });
      navigate(`/auth?${params.toString()}`);
    }
  };

  const finalizeAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      await apiPost(`/invitations/${encodeURIComponent(token)}/accept`, {});
      toast.success('تم قبول الدعوة وإضافتك إلى الهاكاثون', { duration: 4000 });
      navigate('/admin/my-hackathons');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'تعذّر قبول الدعوة';
      setAcceptError(msg);
    } finally {
      setAccepting(false);
    }
  };

  // Auto-finalize if returning from /auth with action=accept and a token in storage.
  useEffect(() => {
    if (!data || !token) return;
    if (searchParams.get('action') !== 'accept') return;
    if (!getToken()) return;
    if (data.alreadyAccepted) return;
    finalizeAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans" dir="rtl">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans px-4" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            الدعوة غير صالحة
          </h1>
          <p className="text-gray-600 mb-6">
            {error === 'not_found'
              ? 'الرابط غير صحيح أو تم حذف الدعوة.'
              : 'تعذّر الاتصال بالخادم. حاول مرة أخرى.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800 transition-all"
            style={{ fontWeight: 600 }}
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // Judge invites don't have a section — they only ever manage the projects/
  // evaluation flow. Show their specialty (if provided) in place of "section".
  const isJudge = data.kind === 'judge';
  const sectionLabel = isJudge
    ? (data.invitee.specialty || '—')
    : (data.invitee.section ? SECTION_LABELS[data.invitee.section] : '—');
  const roleLabel = isJudge
    ? 'حكم'
    : data.invitee.role === 'manager'
    ? 'مدير قسم'
    : 'موظف';
  const sectionFieldLabel = isJudge ? 'التخصص' : 'القسم';

  // Already accepted — friendly state
  if (data.alreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            تم قبول الدعوة بالفعل
          </h1>
          <p className="text-gray-600 mb-6">
            هذه الدعوة تم قبولها مسبقاً. سجّل الدخول للوصول إلى لوحة التنظيم.
          </p>
          <button
            onClick={() => {
              const params = new URLSearchParams({ email: data.invitee.email, role: 'admin', mode: 'login' });
              navigate(`/auth?${params.toString()}`);
            }}
            className="w-full px-6 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all"
            style={{ fontWeight: 600 }}
          >
            تسجيل الدخول
          </button>
        </motion.div>
      </div>
    );
  }

  // Expired
  if (data.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans px-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
            انتهت صلاحية الدعوة
          </h1>
          <p className="text-gray-600 mb-6">
            رابط الدعوة هذا انتهت صلاحيته. تواصل مع منظّم الهاكاثون لإعادة إرساله.
          </p>
        </div>
      </div>
    );
  }

  // Active pending invitation
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans px-4 py-12" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full overflow-hidden"
      >
        {/* Header band */}
        <div className="bg-gradient-to-br from-[#e35654] to-[#cc4a48] px-8 py-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl mb-1" style={{ fontWeight: 700 }}>دعوة للانضمام كفريق تنظيم</h1>
          <p className="text-white/80 text-sm">منصة مُمكّن</p>
        </div>

        <div className="p-8">
          <p className="text-gray-700 leading-relaxed mb-6">
            مرحباً <span className="text-gray-900" style={{ fontWeight: 700 }}>{data.invitee.fullName}</span>،
            {' '}دعاك <span className="text-[#e35654]" style={{ fontWeight: 700 }}>{data.hackathon?.organizerName ?? 'منظّم الهاكاثون'}</span>
            {' '}للانضمام إلى فريق تنظيم هاكاثون
            {' '}<span className="text-gray-900" style={{ fontWeight: 700 }}>"{data.hackathon?.title ?? '—'}"</span>.
          </p>

          {/* Invite details */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">الدور</span>
              <span className="text-gray-900" style={{ fontWeight: 600 }}>{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{sectionFieldLabel}</span>
              <span className="text-gray-900" style={{ fontWeight: 600 }}>{sectionLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">البريد الإلكتروني</span>
              <span className="text-gray-900 font-mono text-xs" dir="ltr">{data.invitee.email}</span>
            </div>
          </div>

          {/* Accept error banner */}
          {acceptError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{acceptError}</span>
            </div>
          )}

          {/* Single accept button */}
          <button
            onClick={startAccept}
            disabled={accepting}
            className="w-full px-6 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#e35654]/30 disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            {accepting ? (
              <>جارٍ إضافتك للهاكاثون...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                أقبل الدعوة وأتابع التسجيل
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-6 leading-relaxed">
            ستنتقل لإكمال تسجيل الدخول أو إنشاء حسابك بإيميلك{' '}
            <span className="font-mono" dir="ltr">{data.invitee.email}</span>،
            ثم تتم إضافتك للهاكاثون تلقائياً.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
