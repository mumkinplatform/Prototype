/// <reference types="vite/client" />
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Send,
  Paperclip,
  Search,
  ArrowRight,
  CheckCheck,
  Check,
  Upload,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Edit3,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, ApiError } from "../../lib/api";
import { NegotiationStepPanel } from "./sponsor-apply/NegotiationStepPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function uploadReceiptFile(applicationId: number, file: File): Promise<void> {
  const token = localStorage.getItem("mumkin_token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(
    `${API_URL}/sponsors/applications/${applicationId}/upload-receipt`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error || `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }
}

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
  hackathon: { id: number; title: string };
  package: { id: number; name: string };
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
  hackathonId: number;
  packageName: string;
  status: ApiConversation["status"];
}

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#e35654", "#8b5cf6", "#06b6d4"];

function mapConversation(c: ApiConversation, idx: number): DisplayConversation {
  const name = c.hackathon.title || "هاكاثون";
  const firstChar = name.trim().length > 0 ? name.trim()[0] : "ه";
  const lastMsg =
    c.status === "pending"
      ? "بانتظار رد المنظم على طلبكم..."
      : c.status === "accepted"
      ? "تم قبول رعايتكم! ابدؤوا التفاوض على الشروط."
      : "تم الاعتذار عن طلبكم.";
  return {
    id: c.id,
    name,
    sub: c.organizer.name || "—",
    lastMsg,
    time: new Date(c.appliedAt).toLocaleDateString("ar-SA"),
    unread: 0,
    online: true,
    avatar: firstChar,
    color: PALETTE[idx % PALETTE.length],
    currentStep: c.currentStep,
    hackathonId: c.hackathon.id,
    packageName: c.package.name,
    status: c.status,
  };
}

const NEGOTIATION_STEPS = [
  { id: 0, label: "التفاوض", icon: MessageCircle },
  { id: 1, label: "مراجعة الشروط", icon: Edit3 },
  { id: 2, label: "العقد الرقمي", icon: FileText },
  { id: 3, label: "رفع العقد", icon: Upload },
  { id: 4, label: "مكتمل", icon: CheckCircle2 },
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

  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewedStep, setViewedStep] = useState(0);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [msgs, setMsgs] = useState<Record<number, Msg[]>>({});
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdvanceStep = async () => {
    if (selected === null || !conv) return;
    if (conv.currentStep >= 4) return;
    setAdvancing(true);
    try {
      const res = await apiPost<{ id: number; negotiationStep: number }>(
        `/sponsors/applications/${selected}/advance-step`
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selected ? { ...c, currentStep: res.negotiationStep } : c
        )
      );
      setViewedStep(res.negotiationStep);
      toast.success("تم الانتقال للمرحلة التالية");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر التحديث";
      toast.error(message);
    } finally {
      setAdvancing(false);
    }
  };

  // وضع الرفع: "receipt" يرفع للسيرفر كإيصال دفع · "attach" يلصق الملف محلياً في الشات
  const [attachMode, setAttachMode] = useState<"receipt" | "attach">("attach");

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-selected
    if (!file || selected === null) return;
    if (!conv) return;

    // وضع "إرفاق ملف عادي" — يرفع للسيرفر ويُحفظ كرسالة في الـ DB
    if (attachMode === "attach") {
      setUploading(true);
      try {
        await postChatMessage(selected, { file });
        toast.success("تم إرفاق الملف في المحادثة");
        // الـ poll القادم خلال 4 ثواني راح يجلب الرسالة من الـ DB ويعرضها
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.message : "تعذّر رفع الملف";
        toast.error(message);
      } finally {
        setUploading(false);
      }
      return;
    }

    // وضع "رفع إيصال الدفع" — يحتاج رفع العقد (مرحلة 3) أولاً
    if (conv.currentStep < 3) {
      toast.error("لا يمكنك رفع الإيصال قبل الوصول لمرحلة رفع العقد");
      return;
    }
    setUploading(true);
    try {
      await uploadReceiptFile(selected, file);
      toast.success("تم رفع الإيصال بنجاح", {
        description: "تمّ تسجيل الدفع وإتمام الرعاية.",
      });
      setReceiptUploaded(true);
      setConversations((prev) =>
        prev.map((c) => (c.id === selected ? { ...c, currentStep: 4 } : c))
      );
      // ألصق رسالة في الشات تخبر الطرف الثاني بإتمام الدفع
      try {
        await postChatMessage(selected, {
          text: `💳 تم رفع إيصال الدفع: ${file.name}`,
        });
      } catch {
        // إذا فشل لصق الرسالة، الإيصال نفسه نجح فلا داعي لإزعاج المستخدم
      }
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
        if (mapped.length > 0) setSelected(mapped[0].id);
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

  // مزامنة المرحلة المعروضة + علم الإيصال عند تغيير المحادثة
  useEffect(() => {
    if (!conv) return;
    setViewedStep(conv.currentStep);
    setReceiptUploaded(conv.currentStep >= 4);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

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

          {/* Negotiation Steps Strip — قابلة للنقر للتنقّل الحرّ */}
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              {NEGOTIATION_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx < conv.currentStep;
                const isCurrent = idx === conv.currentStep;
                const isViewed = idx === viewedStep;
                const baseColor = isCurrent ? "#e35654" : isDone ? "#10b981" : "#d1d5db";
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => setViewedStep(idx)}
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
                        style={{ background: idx < conv.currentStep ? "#10b981" : "#e5e7eb" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {conv.currentStep === 4 && (
              <p className="text-xs text-green-600 text-center mt-2" style={{ fontWeight: 600 }}>
                ✓ اكتملت جميع مراحل التفاوض
              </p>
            )}
          </div>

          {/* Hidden file input — يتغيّر accept حسب وضع الإرفاق */}
          <input
            ref={fileInputRef}
            type="file"
            accept={
              attachMode === "receipt"
                ? "image/jpeg,image/png,image/webp,application/pdf"
                : "*"
            }
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
                  <details className="relative group">
                    <summary className="list-none p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center">
                      <Paperclip className="w-5 h-5" />
                    </summary>
                    <div className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-56 z-50">
                      <p className="text-gray-400 text-xs px-3 pb-1.5 pt-0.5" style={{ fontWeight: 600 }}>
                        إرفاق ملف
                      </p>
                      {/* إرفاق ملف عادي — يعمل دائماً */}
                      <button
                        onClick={(e) => {
                          setAttachMode("attach");
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                          setTimeout(() => fileInputRef.current?.click(), 0);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-right"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#eef2ff]">
                          <Paperclip className="w-4 h-4 text-[#6366f1]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-xs" style={{ fontWeight: 600 }}>
                            إرفاق ملف
                          </p>
                          <p className="text-gray-400" style={{ fontSize: 10 }}>
                            أي نوع — يظهر في المحادثة
                          </p>
                        </div>
                      </button>
                      {/* رفع إيصال الدفع — متاح بعد رفع العقد (مرحلة 3) */}
                      <button
                        onClick={(e) => {
                          setAttachMode("receipt");
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                          setTimeout(() => fileInputRef.current?.click(), 0);
                        }}
                        disabled={uploading || conv.currentStep < 3}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-right disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#fef2f2]">
                          <CreditCard className="w-4 h-4 text-[#e35654]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-xs" style={{ fontWeight: 600 }}>
                            {uploading ? "جاري الرفع..." : "رفع إيصال الدفع"}
                          </p>
                          <p className="text-gray-400" style={{ fontSize: 10 }}>
                            PDF · PNG · JPG — حتى 10MB
                          </p>
                        </div>
                      </button>
                      {conv.currentStep < 3 && (
                        <p className="text-[10px] text-gray-400 px-3 pt-1.5 leading-relaxed">
                          رفع الإيصال متاح بعد الوصول لمرحلة رفع العقد.
                        </p>
                      )}
                    </div>
                  </details>
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
                {conv.status === "accepted" && (
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
                  hackathonId: conv.hackathonId,
                  status: conv.status,
                  currentStep: conv.currentStep,
                }}
                viewedStep={viewedStep}
                serverStep={conv.currentStep}
                advancing={advancing}
                uploading={uploading}
                receiptUploaded={receiptUploaded}
                onAdvance={handleAdvanceStep}
                onUploadClick={() => fileInputRef.current?.click()}
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