import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { ApiError } from '../../lib/api';
import { SECTION_LABELS, type Section } from '../../lib/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Invitation {
  invitee: {
    fullName: string;
    email: string;
    role: 'manager' | 'staff';
    section: Section | null;
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

  // Single accept flow: figure out whether the email already has an account, then
  // route to login (existing) or signup (new) — both with email + role pre-filled
  // and locked. The invitation is auto-claimed by email match after OTP.
  const [accepting, setAccepting] = useState(false);

  const acceptInvitation = async () => {
    if (!data) return;
    setAccepting(true);
    try {
      // Probe whether an account already exists for this email under the organizer role.
      // We piggy-back on the login endpoint with a known-bad password — if we get 404,
      // there's no account; 401 means the account exists.
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
        next: '/admin/my-hackathons',
      });
      navigate(`/auth?${params.toString()}`);
    } catch {
      // Network failure — fall back to signup (new users path).
      const params = new URLSearchParams({
        email: data.invitee.email,
        role: 'admin',
        mode: 'signup',
        next: '/admin/my-hackathons',
      });
      navigate(`/auth?${params.toString()}`);
    } finally {
      setAccepting(false);
    }
  };

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

  const sectionLabel = data.invitee.section ? SECTION_LABELS[data.invitee.section] : '—';
  const roleLabel = data.invitee.role === 'manager' ? 'مدير قسم' : 'موظف';

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
              <span className="text-gray-500">القسم</span>
              <span className="text-gray-900" style={{ fontWeight: 600 }}>{sectionLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">البريد الإلكتروني</span>
              <span className="text-gray-900 font-mono text-xs" dir="ltr">{data.invitee.email}</span>
            </div>
          </div>

          {/* Single accept button */}
          <button
            onClick={acceptInvitation}
            disabled={accepting}
            className="w-full px-6 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#e35654]/30 disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            {accepting ? (
              <>جارٍ المتابعة...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                أقبل الدعوة وأتابع
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-6 leading-relaxed">
            ستنتقل لإكمال تسجيل الدخول أو إنشاء حسابك بإيميلك <span className="font-mono" dir="ltr">{data.invitee.email}</span>
            {' '}— الدعوة ستتربط تلقائياً وستظهر لك الهاكاثون في لوحة التنظيم.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
