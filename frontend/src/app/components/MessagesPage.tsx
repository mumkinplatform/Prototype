/// <reference types="vite/client" />
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Send,
  Paperclip,
  Search,
  ArrowRight,
  CheckCheck,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Edit3,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, ApiError } from "../../lib/api";
import { NegotiationStepPanel, type ContractView } from "./sponsor-apply/NegotiationStepPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// يرسل رسالة شات (نص و/أو ملف) كـ multipart عشان الـ endpoint موحّد
// والـ backend يقبل الاثنين بنفس multer.
async function postChatMessage(
  applicationId: number,
  payload: { text?: string; file?: File }
): Promise<ApiMessage> {
  const token = localStorage.getItem("mumkin_token");
  const form = new FormData();
  if (payload.text) form.append("text", payload.text);
  if (payload.file) form.append("file", payload.file);
  const res = await fetch(
    `${API_URL}/sponsors/applications/${applicationId}/messages`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error || `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }
  return data as ApiMessage;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ApiConversation {
  id: number;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
  currentStep: number;
  sponsorSignedAt: string | null;
  lastMessageText: string | null;
  lastMessageFileName: string | null;
  lastMessageIsSystem: boolean;
  lastMessageAt: string | null;
  hackathon: { id: number; title: string; startDate: string | null };
  package: { id: number; name: string; type: string; price: number | null };
  organizer: { name: string };
}

interface ConversationsResponse {
  items: ApiConversation[];
}

interface DisplayConversation {
  id: number;
  name: string;
  sub: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  avatar: string;
  color: string;
  currentStep: number;
  sponsorSignedAt: string | null;
  hackathonId: number;
  hackathonTitle: string;
  hackathonStartDate: string | null;
  packageName: string;
  packageType: string;
  packagePrice: number | null;
  organizerName: string;
  appliedAt: string;
  status: ApiConversation["status"];
}

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#e35654", "#8b5cf6", "#06b6d4"];

// Sidebar timestamp helper — today shows "HH:MM", yesterday "أمس", earlier this
// week shows the day name, older shows a date. Mirrors common chat-app patterns
// so the sidebar feels alive instead of frozen on the application's apply date.
function formatSidebarTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const now = new Date();
  const then = new Date(t);
  const sameDay =
    now.getFullYear() === then.getFullYear() &&
    now.getMonth() === then.getMonth() &&
    now.getDate() === then.getDate();
  if (sameDay) {
    return then.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  }
  const diffMs = now.getTime() - t;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) {
    return then.toLocaleDateString("ar-SA", { weekday: "long" });
  }
  return then.toLocaleDateString("ar-SA", { day: "2-digit", month: "2-digit" });
}

function mapConversation(c: ApiConversation, idx: number): DisplayConversation {
  const name = c.hackathon.title || "هاكاثون";
  const firstChar = name.trim().length > 0 ? name.trim()[0] : "ه";

  // Real last-message preview from the chat itself. Falls back to a status-based
  // placeholder only when the conversation has zero messages yet (right after
  // the sponsor first applies — pending and no one has spoken yet).
  let lastMsg: string;
  if (c.lastMessageText && c.lastMessageText.trim().length > 0) {
    lastMsg = c.lastMessageText.trim();
  } else if (c.lastMessageFileName) {
    lastMsg = `📎 ${c.lastMessageFileName}`;
  } else if (c.status === "pending") {
    lastMsg = "بانتظار رد المنظم على طلبكم...";
  } else if (c.status === "rejected") {
    lastMsg = "تم الاعتذار عن طلبكم.";
  } else {
    lastMsg = "تم قبول رعايتكم! ابدؤوا التفاوض على الشروط.";
  }

  // Time stamp reflects the latest chat activity. If no message yet, use the
  // application's applied-at so the row at least has a meaningful date.
  const stampSource = c.lastMessageAt ?? c.appliedAt;

  return {
    id: c.id,
    name,
    sub: c.organizer.name || "—",
    lastMsg,
    time: formatSidebarTime(stampSource),
    unread: 0,
    online: true,
    avatar: firstChar,
    color: PALETTE[idx % PALETTE.length],
    currentStep: c.currentStep,
    sponsorSignedAt: c.sponsorSignedAt,
    hackathonId: c.hackathon.id,
    hackathonTitle: c.hackathon.title,
    hackathonStartDate: c.hackathon.startDate,
    packageName: c.package.name,
    packageType: c.package.type,
    packagePrice: c.package.price,
    organizerName: c.organizer.name,
    appliedAt: c.appliedAt,
    status: c.status,
  };
}

// مراحل التفاوض الثلاث المعروضة في الشريط. لما تكتمل (step=3) نخفي الشريط
// كله ونعرض بانر "العقد ساري" بدلاً منه، فمافي حاجة لإدخال step 3 هنا.
const NEGOTIATION_STEPS = [
  { id: 0, label: "التفاوض", icon: MessageCircle },
  { id: 1, label: "مراجعة الشروط", icon: Edit3 },
  { id: 2, label: "العقد الرقمي", icon: FileText },
];

type Msg = {
  from: "me" | "other" | "system";
  text: string;
  time: string;
  read: boolean;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

interface ApiMessage {
  id: number;
  senderId: number;
  senderType?: "SPONSOR" | "ORGANIZER" | "PARTICIPANT";
  senderName?: string;
  text: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isSystem: number;
  createdAt: string;
}

interface MessagesResponse {
  items: ApiMessage[];
}

interface CurrentUser {
  id: number;
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export function MessagesPage() {
  const navigate = useNavigate();
  // ?app=SA_ID — يحدد أي محادثة نفتح بشكل افتراضي. الزر في صفحة الرعايات
  // والإشعارات يمررنا هنا مع هذا الـ param.
  const [searchParams] = useSearchParams();
  const requestedAppId = Number(searchParams.get('app')) || null;

  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  // العقد لكل محادثة + حالة التوقيع. يُحمَّل عند اختيار محادثة.
  const [contractByApp, setContractByApp] = useState<Record<number, ContractView>>({});
  const [signing, setSigning] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [viewedStep, setViewedStep] = useState(0);
  const [msgs, setMsgs] = useState<Record<number, Msg[]>>({});
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // الراعي يوافق على الشروط المرسلة من المنظم. الباك يرفع المرحلة إلى 2
  // (يفتح العقد الرقمي للتوقيع) ويقفل تعديل الشروط على المنظم.
  const handleAccept = async () => {
    if (selected === null) return;
    setAccepting(true);
    try {
      await apiPost(`/sponsors/applications/${selected}/accept-terms`, {});
      const c = await apiGet<ContractView & { negotiationStep: number }>(
        `/sponsors/applications/${selected}/contract`,
      );
      setContractByApp((prev) => ({ ...prev, [selected]: c }));
      setConversations((prev) =>
        prev.map((cv) =>
          cv.id === selected ? { ...cv, currentStep: c.negotiationStep } : cv,
        ),
      );
      toast.success("تمت الموافقة على الشروط — الآن يمكنك التوقيع على العقد");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر تسجيل الموافقة";
      toast.error(message);
    } finally {
      setAccepting(false);
    }
  };

  // توقيع الراعي. الباك يرفع المرحلة لـ 4 (مكتمل) بعد توقيع الراعي
  // — يتطلب أن يكون المنظم قد وقّع أولاً (تحقّق على الباك).
  const handleSign = async () => {
    if (selected === null || !conv) return;
    setSigning(true);
    try {
      await apiPost(`/sponsors/applications/${selected}/sign`, {});
      // أعد جلب العقد لمعرفة الحالة النهائية + ارفع currentStep في القائمة
      const c = await apiGet<ContractView & { negotiationStep: number }>(
        `/sponsors/applications/${selected}/contract`,
      );
      setContractByApp((prev) => ({ ...prev, [selected]: c }));
      setConversations((prev) =>
        prev.map((cv) =>
          cv.id === selected ? { ...cv, currentStep: c.negotiationStep } : cv,
        ),
      );
      toast.success("تم توقيع العقد رقمياً 🎉");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر تسجيل التوقيع";
      toast.error(message);
    } finally {
      setSigning(false);
    }
  };

  // The chat used to expose a separate "receipt" upload mode that hit a
  // dedicated /upload-receipt endpoint and bumped the negotiation step to 4.
  // We removed that — receipts are now just regular chat attachments and the
  // contract is considered complete the moment both parties sign (step 3).
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-selected
    if (!file || selected === null) return;
    if (!conv) return;

    setUploading(true);
    try {
      await postChatMessage(selected, { file });
      toast.success("تم إرفاق الملف في المحادثة");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر رفع الملف";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  // اجلب المستخدم الحالي مرة وحدة
  useEffect(() => {
    let cancelled = false;
    apiGet<{ id: number }>("/sponsors/me")
      .then((me) => {
        if (cancelled) return;
        setCurrentUser({ id: me.id });
      })
      .catch(() => {
        // إذا فشل، تظل الرسائل تظهر لكن "من" قد يكون غير صحيح
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // اجلب قائمة المحادثات
  useEffect(() => {
    let cancelled = false;
    apiGet<ConversationsResponse>("/sponsors/conversations")
      .then((res) => {
        if (cancelled) return;
        const mapped = res.items.map(mapConversation);
        setConversations(mapped);
        if (mapped.length > 0) {
          // لو جاي من زر "محادثة" في صفحة الرعايات/العقود (?app=ID)،
          // نختار المحادثة الصحيحة. وإلا الأولى افتراضياً.
          const target = requestedAppId && mapped.find((c) => c.id === requestedAppId);
          setSelected(target ? target.id : mapped[0].id);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "تعذّر تحميل المحادثات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // اجلب رسائل المحادثة المختارة + Poll كل 4 ثواني للتحديث
  useEffect(() => {
    if (selected === null || currentUser === null) return;
    let cancelled = false;
    const fetchMessages = async () => {
      try {
        const res = await apiGet<MessagesResponse>(
          `/sponsors/applications/${selected}/messages`
        );
        if (cancelled) return;
        const mapped: Msg[] = res.items.map((m) => ({
          from:
            m.isSystem === 1
              ? "system"
              : m.senderId === currentUser.id
              ? "me"
              : "other",
          text: m.text ?? "",
          time: formatMessageTime(m.createdAt),
          read: true,
          fileName: m.fileName,
          fileUrl: m.fileUrl,
          fileSize: m.fileSize,
          mimeType: m.mimeType,
        }));
        setMsgs((prev) => ({ ...prev, [selected]: mapped }));
      } catch {
        // تجاهل أخطاء الـ poll الخلفية
      }
    };
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 4000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [selected, currentUser]);

  const conv = conversations.find((c) => c.id === selected) ?? null;

  // مزامنة المرحلة المعروضة عند تغيير المحادثة. بعد ما العقد ينكمل (step 3)
  // الافتراضي يصير المحادثة الحرّة (viewedStep=0) — يفتح العقد فقط لو ضغط
  // الراعي زر "عرض العقد" في الهيدر. قبل الاكتمال نفتح على المرحلة الحالية كالسابق.
  useEffect(() => {
    if (!conv) return;
    setViewedStep(conv.currentStep >= 3 ? 0 : conv.currentStep);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // تحميل العقد عند اختيار محادثة (بدون polling — التوقيع نادر نسبياً).
  // نعيد التحميل لمن المرحلة تتقدّم عشان نلتقط توقيع المنظم.
  useEffect(() => {
    if (selected === null) return;
    let cancelled = false;
    apiGet<ContractView & { negotiationStep: number }>(
      `/sponsors/applications/${selected}/contract`,
    )
      .then((c) => {
        if (!cancelled) setContractByApp((prev) => ({ ...prev, [selected]: c }));
      })
      .catch(() => {
        // فشل صامت — الـ NegotiationStepPanel يعرض fallback لو contract = null
      });
    return () => {
      cancelled = true;
    };
  }, [selected, conv?.currentStep]);

  const filteredConvs = conversations.filter(
    (c) => c.name.includes(search) || c.sub.includes(search)
  );

  const activeMessages = selected !== null ? msgs[selected] || [] : [];

  const send = async () => {
    if (!newMsg.trim() || selected === null || sending) return;
    const text = newMsg.trim();
    setSending(true);
    // أضفها بشكل تفاؤلي للواجهة مباشرة قبل ما يرد السيرفر
    const optimistic: Msg = {
      from: "me",
      text,
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMsgs((prev) => ({
      ...prev,
      [selected]: [...(prev[selected] || []), optimistic],
    }));
    setNewMsg("");
    try {
      await postChatMessage(selected, { text });
      // الـ poll القادم خلال 4 ثواني راح يجلب النسخة من السيرفر مع رسائل الطرف الثاني
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر إرسال الرسالة";
      toast.error(message);
      // ارجع الرسالة في حقل الإدخال + شيلها من الواجهة
      setMsgs((prev) => ({
        ...prev,
        [selected]: (prev[selected] || []).filter((m) => m !== optimistic),
      }));
      setNewMsg(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col bg-gray-50" style={{ height: "calc(100vh - 64px)" }}>
      {/* Title bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/sponsor")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
                الرسائل
              </h1>
              <p className="text-xs text-gray-500">
                تواصل مع المنظمين وإدارة المحادثات
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full">
        {/* Conversations Sidebar */}
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col">
          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-10 pl-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:border-[#e35654] transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            <p className="px-4 pt-3 pb-1 text-gray-400 text-xs" style={{ fontWeight: 600 }}>
              المحادثات
            </p>
            {filteredConvs.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-all border-r-2 ${
                  selected === c.id
                    ? "bg-[#e35654]/5 border-[#e35654]"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm"
                    style={{ background: c.color, fontWeight: 700 }}
                  >
                    {c.avatar}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${selected === c.id ? "text-[#e35654]" : "text-gray-900"}`}
                      style={{ fontWeight: c.unread > 0 ? 700 : 500 }}
                    >
                      {c.name}
                    </p>
                    <span className="text-gray-400 text-xs flex-shrink-0 mr-1">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-gray-400 text-xs truncate flex-1">{c.lastMsg}</p>
                    {c.unread > 0 && (
                      <span
                        className="w-5 h-5 rounded-full bg-[#e35654] text-white flex items-center justify-center flex-shrink-0 mr-1"
                        style={{ fontSize: 10, fontWeight: 700 }}
                      >
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل المحادثات...
            </div>
          ) : loadError ? (
            <div className="flex-1 flex items-center justify-center text-red-600 text-sm">
              {loadError}
            </div>
          ) : !conv ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-6 text-center">
              لا توجد محادثات بعد. ستظهر هنا بعد التقدّم على باقات الرعاية.
            </div>
          ) : (
            <>
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm"
                  style={{ background: conv.color, fontWeight: 700 }}
                >
                  {conv.avatar}
                </div>
              </div>
              <div>
                <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                  {conv.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {conv.sub}
                </p>
              </div>
            </div>
          </div>

          {/* Pre-completion: show the steps strip with clickable navigation.
              Post-completion (both signed, step 3): the strip is replaced by a
              compact "View Contract" header — the chat below is a free
              conversation thread for any post-signing follow-up. */}
          {conv.currentStep < 3 ? (
            <div className="bg-white border-b border-gray-100 px-5 py-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                {NEGOTIATION_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = step.id < conv.currentStep;
                  const isCurrent = step.id === conv.currentStep;
                  const isViewed = step.id === viewedStep;
                  const baseColor = isCurrent ? "#e35654" : isDone ? "#10b981" : "#d1d5db";
                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <button
                        type="button"
                        onClick={() => setViewedStep(step.id)}
                        className="flex flex-col items-center flex-1 group focus:outline-none"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-110 ${
                            isViewed ? "ring-2 ring-offset-2 ring-[#e35654]/40" : ""
                          }`}
                          style={{
                            borderColor: baseColor,
                            background: isCurrent ? baseColor : isDone ? baseColor : "white",
                          }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: isCurrent || isDone ? "white" : baseColor }}
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
                          style={{ background: step.id < conv.currentStep ? "#10b981" : "#e5e7eb" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 text-sm" style={{ fontWeight: 600 }}>
                <CheckCircle2 className="w-4 h-4" />
                العقد ساري — موقّع من الطرفين
              </div>
              <button
                type="button"
                onClick={() => setViewedStep(2)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                style={{ fontWeight: 600 }}
              >
                عرض العقد
              </button>
            </div>
          )}

          {/* Hidden file input — accepts any file type since receipts are now
              just regular chat attachments, not a separate upload mode. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={handleFileSelected}
          />

          {/* Step 0 → الشات الكامل · باقي المراحل → لوحة التفاوض */}
          {viewedStep === 0 ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-[#f7f7f6]">
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-gray-400 text-xs px-3 py-1 bg-white rounded-full border border-gray-100">
                    اليوم
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {activeMessages.map((m, i) => {
                  // رسائل النظام (تلقائية) — تظهر في المنتصف بتنسيق محايد
                  if (m.from === "system") {
                    return (
                      <div key={i} className="flex justify-center my-1">
                        <div className="bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] text-xs px-4 py-2 rounded-full max-w-[85%] text-center leading-relaxed">
                          {m.text}
                        </div>
                      </div>
                    );
                  }
                  const hasFile = Boolean(m.fileUrl);
                  return (
                    <div
                      key={i}
                      className={`flex items-end gap-2.5 ${m.from === "me" ? "flex-row-reverse" : ""}`}
                    >
                      {m.from === "other" && (
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0"
                          style={{ background: conv.color, fontWeight: 700 }}
                        >
                          {conv.avatar}
                        </div>
                      )}
                      <div className={`max-w-[65%] flex flex-col gap-1 ${m.from === "me" ? "items-end" : "items-start"}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            m.from === "me"
                              ? "bg-[#e35654] text-white rounded-tr-sm"
                              : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"
                          }`}
                        >
                          {m.text && <div className={hasFile ? "mb-2" : ""}>{m.text}</div>}
                          {hasFile && (
                            <a
                              href={`${API_URL}${m.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={m.fileName ?? undefined}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                                m.from === "me"
                                  ? "bg-white/15 hover:bg-white/25"
                                  : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                              }`}
                              style={{ minWidth: 200 }}
                            >
                              <Paperclip className={`w-4 h-4 flex-shrink-0 ${m.from === "me" ? "text-white" : "text-[#6366f1]"}`} />
                              <div className="flex-1 min-w-0 text-right">
                                <p className={`truncate ${m.from === "me" ? "text-white" : "text-gray-800"}`} style={{ fontWeight: 600, fontSize: 12 }}>
                                  {m.fileName ?? "ملف"}
                                </p>
                                <p className={m.from === "me" ? "text-white/70" : "text-gray-400"} style={{ fontSize: 10 }}>
                                  {formatFileSize(m.fileSize ?? null)}
                                </p>
                              </div>
                            </a>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-1 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
                          <span className="text-gray-300 text-xs">{m.time}</span>
                          {m.from === "me" && (
                            m.read
                              ? <CheckCheck className="w-3.5 h-3.5 text-[#e35654]" />
                              : <Check className="w-3.5 h-3.5 text-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  {/* Single attach button — file goes straight to chat as a
                      regular message. The old menu had a second "upload receipt"
                      mode; removed because receipts are now ordinary attachments. */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="إرفاق ملف"
                    className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  </button>
                  <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                  />
                  <button
                    onClick={send}
                    disabled={!newMsg.trim() || sending}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      newMsg.trim() && !sending
                        ? "bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20"
                        : "bg-gray-100 text-gray-300"
                    }`}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                {/* Quick link to the terms panel — only while the contract is
                    still in negotiation. After step 3 (both signed) the chat
                    becomes a free thread and the terms view is reached only
                    through the "عرض العقد" header button. */}
                {conv.status === "accepted" && conv.currentStep < 3 && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setViewedStep(1)}
                      className="text-xs text-[#e35654] hover:underline"
                      style={{ fontWeight: 600 }}
                    >
                      الانتقال لمراجعة الشروط ←
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto bg-[#f7f7f6]">
              <NegotiationStepPanel
                conversation={{
                  id: conv.id,
                  packageName: conv.packageName,
                  packageType: conv.packageType,
                  packagePrice: conv.packagePrice,
                  hackathonId: conv.hackathonId,
                  hackathonTitle: conv.hackathonTitle,
                  hackathonStartDate: conv.hackathonStartDate,
                  organizerName: conv.organizerName,
                  appliedAt: conv.appliedAt,
                  status: conv.status,
                  currentStep: conv.currentStep,
                  sponsorSignedAt: conv.sponsorSignedAt,
                }}
                viewedStep={viewedStep}
                serverStep={conv.currentStep}
                contract={contractByApp[conv.id] ?? null}
                signing={signing}
                accepting={accepting}
                onAccept={handleAccept}
                onSign={handleSign}
                onViewStep={setViewedStep}
              />
            </div>
          )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}