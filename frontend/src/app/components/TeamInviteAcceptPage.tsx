import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Users, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ApiError, apiPost } from '../../lib/api';
import { getToken } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TeamInvitePreview {
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string | null;
  respondedAt: string | null;
  team: { id: number; name: string };
  leader: { id: number; fullName: string };
  hackathon: { id: number; title: string; registrationEndDate: string | null };
  idea: { title: string | null; description: string | null };
}

function formatDateAr(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function TeamInviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<TeamInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<'not_found' | 'network' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/team-invitations/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setLoadError('not_found');
          return null;
        }
        if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        if (d) setData(d as TeamInvitePreview);
      })
      .catch(() => setLoadError('network'))
      .finally(() => setLoading(false));
  }, [token]);

  // Two-step accept by design (matches the co-manager flow):
  //   1. If not signed in, route to /auth with email pre-filled and a `next`
  //      param that comes back here with ?action=accept.
  //   2. The useEffect below detects that flag and auto-fires the accept call.
  const startAccept = async () => {
    if (!data || !token) return;
    setSubmitError(null);

    if (getToken()) {
      finalizeAccept();
      return;
    }

    try {
      const probe = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'participant', email: data.email, password: '__probe__' }),
      });
      const accountExists = probe.status !== 404;
      const params = new URLSearchParams({
        email: data.email,
        role: 'participant',
        mode: accountExists ? 'login' : 'signup',
        next: `/team-invite/${encodeURIComponent(token)}?action=accept`,
      });
      navigate(`/auth?${params.toString()}`);
    } catch {
      const params = new URLSearchParams({
        email: data.email,
        role: 'participant',
        mode: 'signup',
        next: `/team-invite/${encodeURIComponent(token)}?action=accept`,
      });
      navigate(`/auth?${params.toString()}`);
    }
  };

  const finalizeAccept = async () => {
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await apiPost<{ teamId: number; teamName: string; hackathonId: number }>(
        `/team-invitations/${encodeURIComponent(token)}/accept`,
        {},
      );
      toast.success(`تم قبول الدعوة — انضممت إلى ${result.teamName}`);
      navigate(`/participant/workspace?id=${result.hackathonId}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'تعذّر قبول الدعوة';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startDecline = async () => {
    if (!token) return;
    if (!getToken()) {
      // Must be logged in to officially decline. Same auth bounce as accept.
      if (!data) return;
      const params = new URLSearchParams({
        email: data.email,
        role: 'participant',
        mode: 'login',
        next: `/team-invite/${encodeURIComponent(token)}?action=decline`,
      });
      navigate(`/auth?${params.toString()}`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiPost(`/team-invitations/${encodeURIComponent(token)}/decline`, {});
      toast.success('تم رفض الدعوة');
      // Re-fetch to update the visible status.
      const res = await fetch(`${API_URL}/team-invitations/${encodeURIComponent(token)}`);
      if (res.ok) setData((await res.json()) as TeamInvitePreview);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'تعذّر رفض الدعوة';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-resume after returning from /auth with ?action=accept/decline.
  useEffect(() => {
    if (!data || !token) return;
    if (!getToken()) return;
    const action = searchParams.get('action');
    if (action === 'accept' && data.status === 'pending') {
      finalizeAccept();
    } else if (action === 'decline' && data.status === 'pending') {
      startDecline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans" dir="rtl">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  if (loadError || !data) {
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
            {loadError === 'not_found'
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

  // Already accepted
  if (data.status === 'accepted') {
    return (
      <StatusCard
        icon={<CheckCircle2 className="w-8 h-8 text-green-600" />}
        iconBg="bg-green-50"
        title="تم قبول هذه الدعوة"
        message={`أنت عضو في "${data.team.name}". يمكنك متابعة العمل من مساحة العمل.`}
        primary={{
          label: 'الدخول إلى مساحة العمل',
          onClick: () => {
            if (!getToken()) {
              const params = new URLSearchParams({
                email: data.email,
                role: 'participant',
                mode: 'login',
                next: `/participant/workspace?id=${data.hackathon.id}`,
              });
              navigate(`/auth?${params.toString()}`);
            } else {
              navigate(`/participant/workspace?id=${data.hackathon.id}`);
            }
          },
        }}
      />
    );
  }

  if (data.status === 'declined') {
    return (
      <StatusCard
        icon={<XCircle className="w-8 h-8 text-gray-500" />}
        iconBg="bg-gray-100"
        title="تم رفض هذه الدعوة"
        message="رفضت هذه الدعوة سابقاً. لا يمكن قبولها بعد الآن."
        primary={{ label: 'العودة للصفحة الرئيسية', onClick: () => navigate('/') }}
      />
    );
  }

  if (data.status === 'expired') {
    return (
      <StatusCard
        icon={<Clock className="w-8 h-8 text-amber-600" />}
        iconBg="bg-amber-50"
        title="انتهت صلاحية الدعوة"
        message={
          data.expiresAt
            ? `كانت الدعوة صالحة حتى ${formatDateAr(data.expiresAt)}. اطلب من قائد الفريق إعادة إرسال الدعوة.`
            : 'انتهت فترة قبول هذه الدعوة.'
        }
        primary={{ label: 'العودة للصفحة الرئيسية', onClick: () => navigate('/') }}
      />
    );
  }

  // Pending — render the full preview + actions
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans px-4 py-10" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full p-8"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#fef2f4] flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-[#e35654]" />
          </div>
          <div>
            <h1 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
              دعوة للانضمام إلى فريق
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">منصة مُمكّن</p>
          </div>
        </div>

        <div className="bg-[#fafaf9] rounded-2xl p-5 mb-5 space-y-3">
          <Row label="الهاكاثون" value={data.hackathon.title} />
          <Row label="اسم الفريق" value={data.team.name} />
          <Row label="القائد" value={data.leader.fullName} />
          <Row label="دُعيت بإيميل" value={data.email} />
          {data.expiresAt && (
            <Row label="الدعوة سارية حتى" value={formatDateAr(data.expiresAt)} highlight />
          )}
        </div>

        {data.idea.title && (
          <div className="border border-gray-100 rounded-2xl p-5 mb-6">
            <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>
              فكرة المشروع
            </p>
            <p className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              {data.idea.title}
            </p>
            {data.idea.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{data.idea.description}</p>
            )}
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={startAccept}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            {submitting ? 'جاري المعالجة...' : 'قبول الدعوة'}
          </button>
          <button
            onClick={startDecline}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            رفض
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span
        className={highlight ? 'text-[#e35654]' : 'text-gray-900'}
        style={{ fontWeight: 600, textAlign: 'left' }}
      >
        {value}
      </span>
    </div>
  );
}

function StatusCard({
  icon,
  iconBg,
  title,
  message,
  primary,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  message: string;
  primary: { label: string; onClick: () => void };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center"
      >
        <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-5`}>
          {icon}
        </div>
        <h1 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
          {title}
        </h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={primary.onClick}
          className="w-full px-6 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all"
          style={{ fontWeight: 600 }}
        >
          {primary.label}
        </button>
      </motion.div>
    </div>
  );
}
