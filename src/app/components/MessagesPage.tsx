import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Send,
  Paperclip,
  Search,
  MoreVertical,
  Phone,
  ArrowRight,
  CheckCheck,
  Check,
  Smile,
  Upload,
  CheckCircle2,
  X,
  CreditCard,
  FileText,
  Handshake,
  BadgeCheck,
} from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "منظم NEOM 2025",
    sub: "مؤسسة نيوم",
    lastMsg: "تمّت المراجعة. شكرًا لملاحظاتكم.",
    time: "10:42 ص",
    unread: 2,
    online: true,
    avatar: "ن",
    color: "#6366f1",
  },
  {
    id: 2,
    name: "Health Tech Hackathon",
    sub: "وزارة الصحة",
    lastMsg: "موعد عرض الباقات غداً الساعة 10",
    time: "أمس",
    unread: 0,
    online: false,
    avatar: "ص",
    color: "#10b981",
  },
  {
    id: 3,
    name: "Fintech Innovation Cup",
    sub: "ساب تك",
    lastMsg: "تم إرسال مسودة العقد للمراجعة",
    time: "أمس",
    unread: 1,
    online: true,
    avatar: "ف",
    color: "#f59e0b",
  },
  {
    id: 4,
    name: "هاكاثون الأمن السيبراني",
    sub: "مؤسسة ريادة",
    lastMsg: "نحتاج موافقتك على الشروط الإضافية",
    time: "3 مارس",
    unread: 3,
    online: false,
    avatar: "أ",
    color: "#a41b42",
  },
  {
    id: 5,
    name: "فريق دعم مُمكّن",
    sub: "خدمة العملاء",
    lastMsg: "نحن هنا لمساعدتك في أي وقت!",
    time: "1 مارس",
    unread: 0,
    online: true,
    avatar: "م",
    color: "#8b5cf6",
  },
];

type Msg = { from: "me" | "other"; text: string; time: string; read: boolean };

const histories: Record<number, Msg[]> = {
  1: [
    { from: "other", text: "أهلًا بكم في هاكاثون NEOM 2025! شكرًا لاهتمامكم بالرعاية.", time: "10:00 ص", read: true },
    { from: "me", text: "نهتم بالباقة الذهبية. هل يمكن تعديل بند حقوق الشعار؟", time: "10:15 ص", read: true },
    { from: "other", text: "بالتأكيد! شعارك سيظهر في جميع المواد الرقمية والمطبوعة طوال فترة الهاكاثون.", time: "10:28 ص", read: true },
    { from: "me", text: "هل يمكن تضمين حقوق البث المباشر أيضًا؟", time: "10:31 ص", read: true },
    { from: "other", text: "تمّت المراجعة. شكرًا لملاحظاتكم. سنعدّل المسودة وفقًا لذلك.", time: "10:42 ص", read: false },
  ],
  2: [
    { from: "other", text: "أهلًا بكم في Health Tech Hackathon!", time: "09:00 ص", read: true },
    { from: "me", text: "نودّ الاستفسار عن باقات الرعاية المتاحة.", time: "09:30 ص", read: true },
    { from: "other", text: "موعد عرض الباقات غداً الساعة 10", time: "04:00 م", read: true },
  ],
  3: [
    { from: "other", text: "مرحبًا! تم إرسال مسودة العقد للمراجعة. يُرجى الرد خلال 48 ساعة.", time: "02:00 م", read: false },
  ],
  4: [
    { from: "other", text: "مرحبًا، هناك شروط إضافية تحتاج موافقتكم قبل إتمام عقد الرعاية.", time: "11:00 ص", read: false },
    { from: "other", text: "هل يمكنكم مراجعة المستند المرفق والرد في أقرب وقت؟", time: "11:05 ص", read: false },
    { from: "other", text: "نحتاج موافقتك على الشروط الإضافية", time: "11:10 ص", read: false },
  ],
  5: [
    { from: "other", text: "أهلًا وسهلًا بكم في مُمكّن! نحن هنا لمساعدتك في أي وقت 😊", time: "09:00 ص", read: true },
  ],
};

export function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isFinancial = (location.state as any)?.financial === true;

  const [selected, setSelected] = useState(1);
  const [msgs, setMsgs] = useState(histories);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [showFinancialPanel, setShowFinancialPanel] = useState(isFinancial);
  const [financialUploaded, setFinancialUploaded] = useState(false);
  const [financialDone, setFinancialDone] = useState(false);

  const conv = conversations.find((c) => c.id === selected)!;
  const activeMessages = msgs[selected] || [];

  const filteredConvs = conversations.filter(
    (c) => c.name.includes(search) || c.sub.includes(search)
  );

  const send = () => {
    if (!newMsg.trim()) return;
    const now = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    setMsgs((prev) => ({
      ...prev,
      [selected]: [...(prev[selected] || []), { from: "me", text: newMsg, time: now, read: false }],
    }));
    setNewMsg("");
    setTimeout(() => {
      setMsgs((prev) => ({
        ...prev,
        [selected]: [
          ...(prev[selected] || []),
          {
            from: "other",
            text: "شكرًا على رسالتك، سنرد عليك في أقرب وقت ممكن.",
            time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
            read: false,
          },
        ],
      }));
    }, 1400);
  };

  const convStatuses: Record<number, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    1: { label: "قيد التفاوض على الشروط", color: "#6366f1", bg: "#eef2ff", Icon: Handshake },
    2: { label: "في انتظار توقيع العقد", color: "#f59e0b", bg: "#fffbeb", Icon: FileText },
    3: { label: "رفع المصاريف والفواتير", color: "#a41b42", bg: "#fef2f2", Icon: CreditCard },
    4: { label: "تم الدفع والعقد مكتمل", color: "#10b981", bg: "#f0fdf4", Icon: BadgeCheck },
    5: { label: "دعم فني — لا توجد رعاية نشطة", color: "#8b5cf6", bg: "#f5f3ff", Icon: CheckCircle2 },
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
                className="w-full pr-10 pl-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:border-[#a41b42] transition-colors"
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
                    ? "bg-[#a41b42]/5 border-[#a41b42]"
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
                  {c.online && (
                    <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${selected === c.id ? "text-[#a41b42]" : "text-gray-900"}`}
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
                        className="w-5 h-5 rounded-full bg-[#a41b42] text-white flex items-center justify-center flex-shrink-0 mr-1"
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
                {conv.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                  {conv.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {conv.online ? "● متصل الآن" : "○ غير متصل"} · {conv.sub}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(() => {
                const st = convStatuses[selected];
                if (!st) return null;
                const { label, color, bg, Icon } = st;
                return (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs ml-2"
                    style={{ background: bg, color, fontWeight: 600 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                );
              })()}
              <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-[#f7f7f6]">
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs px-3 py-1 bg-white rounded-full border border-gray-100">
                اليوم
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {activeMessages.map((m, i) => (
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
                        ? "bg-[#a41b42] text-white rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className={`flex items-center gap-1 px-1 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
                    <span className="text-gray-300 text-xs">{m.time}</span>
                    {m.from === "me" && (
                      m.read
                        ? <CheckCheck className="w-3.5 h-3.5 text-[#a41b42]" />
                        : <Check className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Upload Panel */}
          {showFinancialPanel && !financialDone && (
            <div className="bg-white border-t-2 border-[#a41b42]/20 px-5 py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#a41b42]/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-[#a41b42]" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>رفع المستندات المالية</p>
                    <p className="text-gray-400 text-xs">ارفع الفاتورة أو إثبات التحويل لإتمام المصاريف</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFinancialPanel(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {financialUploaded ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-green-700 text-xs" style={{ fontWeight: 700 }}>تم رفع الملف بنجاح</p>
                      <p className="text-green-600 text-xs">invoice_payment_2025.pdf — 1.2 MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFinancialDone(true)}
                    className="px-4 py-1.5 rounded-xl bg-[#a41b42] text-white text-xs hover:bg-[#8b1538] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    تأكيد الإرسال ✅
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setFinancialUploaded(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#a41b42]/30 bg-[#a41b42]/5 hover:bg-[#a41b42]/10 hover:border-[#a41b42]/50 transition-all text-right"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#a41b42]/10 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-[#a41b42]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>اسحب الملف أو انقر للاختيار</p>
                    <p className="text-gray-400 text-xs mt-0.5">PDF · JPG · PNG — الحد الأقصى 10MB</p>
                  </div>
                  <span className="text-[#a41b42] text-xs flex-shrink-0" style={{ fontWeight: 600 }}>رفع</span>
                </button>
              )}
            </div>
          )}

          {/* Financial Done Confirmation */}
          {financialDone && (
            <div className="bg-green-50 border-t border-green-200 px-5 py-3 flex-shrink-0 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-xs flex-1" style={{ fontWeight: 600 }}>تم إرسال المستندات المالية بنجاح — في انتظار مراجعة المنظم</p>
              <button onClick={() => navigate("/sponsor/sponsorships")} className="text-xs text-gray-500 hover:text-gray-700 underline">
                رجوع للرعايات
              </button>
            </div>
          )}

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <details className="relative group">
                <summary className="list-none p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center">
                  <Paperclip className="w-5 h-5" />
                </summary>
                <div className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-52 z-50">
                  <p className="text-gray-400 text-xs px-3 pb-1.5 pt-0.5" style={{ fontWeight: 600 }}>
                    إرفاق ملف
                  </p>
                  {[
                    { icon: FileText, label: "رفع عقد", sub: "PDF · DOC · DOCX", color: "#6366f1", bg: "#eef2ff" },
                    { icon: CreditCard, label: "رفع فاتورة", sub: "PDF · PNG · JPG", color: "#a41b42", bg: "#fef2f2" },
                    { icon: Upload,    label: "صور ووسائط", sub: "JPG · PNG · GIF · MP4", color: "#10b981", bg: "#f0fdf4" },
                    { icon: Paperclip, label: "ملف عام", sub: "أي نوع — حتى 20MB", color: "#f59e0b", bg: "#fffbeb" },
                  ].map(({ icon: Icon, label, sub, color, bg }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-right"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-xs" style={{ fontWeight: 600 }}>{label}</p>
                        <p className="text-gray-400" style={{ fontSize: 10 }}>{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </details>
              <button className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#a41b42] focus:ring-2 focus:ring-[#a41b42]/10 transition-all"
              />
              <button
                onClick={send}
                disabled={!newMsg.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  newMsg.trim()
                    ? "bg-[#a41b42] text-white hover:bg-[#8b1538] shadow-md shadow-[#a41b42]/20"
                    : "bg-gray-100 text-gray-300"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}