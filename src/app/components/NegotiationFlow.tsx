import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  MessageCircle,
  Edit3,
  FileText,
  Upload,
  CheckCircle2,
  Send,
  ArrowRight,
  Paperclip,
  Clock,
  DollarSign,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";

type Step = 0 | 1 | 2 | 3 | 4;

const steps = [
  { id: 0, label: "التفاوض", icon: MessageCircle },
  { id: 1, label: "مراجعة الشروط", icon: Edit3 },
  { id: 2, label: "العقد الرقمي", icon: FileText },
  { id: 3, label: "رفع العقد", icon: Upload },
  { id: 4, label: "مكتمل", icon: CheckCircle2 },
];

const termDefs = [
  { label: "مدة الرعاية", value: "6 أشهر", icon: Clock, editable: true },
  { label: "قيمة الرعاية", value: "50,000 ر.س", icon: DollarSign, editable: true },
  { label: "حقوق الشعار", value: "مستوى أول — رقمي وفعلي", icon: Building2, editable: true },
  { label: "وقت العرض", value: "10 دقائق", icon: Clock, editable: true },
  { label: "وصول لبيانات المشاركين", value: "نعم، مجهولة الهوية", icon: AlertCircle, editable: false },
  { label: "تاريخ بدء الفعالية", value: "15 مارس 2025", icon: Calendar, editable: false },
];

const initMsgs = [
  { from: "org", text: "أهلًا بكم! شكرًا لاهتمام شركتكم بالرعاية. ما الباقة التي تناسب أهداف شركتكم؟", time: "10:30 ص" },
  { from: "me", text: "نهتم بالباقة الذهبية. هل يمكن تعديل بند حقوق الشعار ليشمل المنصة الرقمية؟", time: "10:35 ص" },
  { from: "org", text: "بالتأكيد! يمكننا تضمين ذلك في العقد. سأرسل لكم المسودة المعدّلة للمراجعة.", time: "10:42 ص" },
];

export function NegotiationFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const isFinancial = (location.state as any)?.financial === true;

  const [step, setStep] = useState<Step>(isFinancial ? 3 : 0);
  const [msgs, setMsgs] = useState(initMsgs);
  const [newMsg, setNewMsg] = useState("");
  const [termValues, setTermValues] = useState(termDefs.map((t) => t.value));
  const [editingTerm, setEditingTerm] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const sendMsg = () => {
    if (!newMsg.trim()) return;
    const now = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    setMsgs((p) => [...p, { from: "me", text: newMsg, time: now }]);
    setNewMsg("");
    setTimeout(() => {
      setMsgs((p) => [
        ...p,
        { from: "org", text: "تمّت المراجعة. شكرًا لملاحظاتكم. سنعدّل المسودة وفقًا لذلك.", time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }, 1200);
  };

  const next = () => step < 4 && setStep((step + 1) as Step);
  const prev = () => step > 0 && setStep((step - 1) as Step);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/sponsor")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                التفاوض والعقود
              </h1>
              <p className="text-sm text-gray-500">
                تفاوض على الشروط، راجع العقد الرقمي، وأكمل توقيع الاتفاقية
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center">
            {steps.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        done ? "bg-[#e35654] text-white" : active ? "bg-[#e35654] text-white shadow-lg shadow-[#e35654]/30 scale-110" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: active || done ? "#e35654" : "#9ca3af", fontWeight: active ? 600 : 400 }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-1 rounded-full mb-4 transition-all duration-300"
                      style={{ background: step > s.id ? "#e35654" : "#e5e7eb" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Step 0 — Negotiation Chat */}
        {step === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#6366f1]" />
              </div>
              <div>
                <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>منظم هاكاثون NEOM 2025</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-400 text-xs">متصل الآن</span>
                </div>
              </div>
            </div>

            <div className="h-72 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/40">
              {msgs.map((m, i) => (
                <div key={i} className={`flex items-end gap-2.5 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                    style={{ background: m.from === "me" ? "#e35654" : "#6366f1", fontWeight: 700 }}
                  >
                    {m.from === "me" ? "ر" : "م"}
                  </div>
                  <div className={`max-w-[70%] flex flex-col gap-1 ${m.from === "me" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        m.from === "me"
                          ? "bg-[#e35654] text-white rounded-tr-sm"
                          : "bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-gray-300 text-xs px-1">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                />
                <button
                  onClick={sendMsg}
                  className="w-10 h-10 rounded-xl bg-[#e35654] text-white flex items-center justify-center hover:bg-[#cc4a48] transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20 transition-colors"
                style={{ fontWeight: 600 }}
              >
                التالي: مراجعة الشروط
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Review Terms */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-7 py-6 border-b border-gray-100">
              <h2 className="text-gray-900" style={{ fontWeight: 700 }}>مراجعة وتعديل الشروط</h2>
              <p className="text-gray-400 text-sm mt-1">راجع كل بند وعدّله قبل إصدار العقد الرسمي.</p>
            </div>
            <div className="px-7 py-6 space-y-3">
              {/* Who set these terms */}
              <div className="flex items-center gap-2 mb-1 pb-3 border-b border-gray-100">
                <div className="w-6 h-6 rounded-full bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-[#6366f1]" />
                </div>
                <p className="text-gray-500 text-xs">
                  هذه الشروط وضعها <span className="text-[#6366f1]" style={{ fontWeight: 700 }}>المنظم</span> — البنود المميزة بـ
                  <span className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded bg-[#e35654]/10 text-[#e35654]" style={{ fontWeight: 600, fontSize: "0.65rem" }}>
                    <Edit3 className="w-2.5 h-2.5" /> تعديل
                  </span>
                  يمكنك اقتراح تعديل عليها
                </p>
              </div>

              {termDefs.map((t, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    editingTerm === i ? "bg-[#e35654]/5 border border-[#e35654]/20" : "bg-gray-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <t.icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-gray-400 text-xs">{t.label}</p>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 600,
                          background: "#eef2ff",
                          color: "#6366f1",
                        }}
                      >
                        المنظم
                      </span>
                    </div>
                    {editingTerm === i ? (
                      <input
                        value={termValues[i]}
                        onChange={(e) => {
                          const u = [...termValues];
                          u[i] = e.target.value;
                          setTermValues(u);
                        }}
                        className="text-gray-900 text-sm bg-transparent border-b-2 border-[#e35654] focus:outline-none w-full"
                        style={{ fontWeight: 600 }}
                        autoFocus
                      />
                    ) : (
                      <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{termValues[i]}</p>
                    )}
                  </div>
                  {t.editable ? (
                    <button
                      onClick={() => setEditingTerm(editingTerm === i ? null : i)}
                      className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                        editingTerm === i ? "bg-[#e35654] text-white" : "text-gray-400 hover:text-[#e35654] hover:bg-[#e35654]/10"
                      }`}
                      title="اقترح تعديلاً على هذا البند"
                    >
                      {editingTerm === i ? <CheckCircle2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                  ) : (
                    <span
                      className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ fontSize: "0.65rem", fontWeight: 600, background: "#f3f4f6", color: "#9ca3af" }}
                    >
                      ثابت
                    </span>
                  )}
                </div>
              ))}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mt-4">
                <p className="text-blue-700 text-xs leading-relaxed" style={{ fontWeight: 500 }}>
                  ℹ️ بعد مراجعة الشروط والموافقة، سيُصدر العقد الرسمي تلقائيًا لإتمام الإجراءات.
                </p>
              </div>
            </div>
            <div className="px-7 py-5 border-t border-gray-100 flex items-center justify-between">
              <button onClick={prev} className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 transition-colors" style={{ fontWeight: 500 }}>
                <ArrowRight className="w-4 h-4" /> رجوع
              </button>
              <button onClick={next} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20 transition-colors" style={{ fontWeight: 600 }}>
                التالي: إنشاء العقد
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Digital Contract */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-7 py-6 border-b border-gray-100">
              <h2 className="text-gray-900" style={{ fontWeight: 700 }}>العقد الرقمي</h2>
              <p className="text-gray-400 text-sm mt-1">راجع العقد النهائي قبل التوقيع الرقمي.</p>
            </div>
            <div className="px-7 py-6">
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-7 py-6 text-center text-white">
                  <div className="w-12 h-12 rounded-xl bg-[#e35654] flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 style={{ fontWeight: 800 }}>عقد رعاية رسمي</h3>
                  <p className="text-gray-400 text-sm mt-1">رقم: #SP-2025-0034</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-1" style={{ fontWeight: 500 }}>الطرف الأول (المنظم)</p>
                      <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>مؤسسة نيوم</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-1" style={{ fontWeight: 500 }}>الطرف الثاني (الراعي)</p>
                      <p className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>شركة التقنية المتقدمة</p>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-5 space-y-2.5">
                    {termValues.map((val, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500 text-sm">{termDefs[i].label}</span>
                        <span className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  
                </div>
              </div>
              <label className="flex items-start gap-3 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#e35654]"
                />
                <span className="text-gray-600 text-sm">قرأت جميع بنود العقد وأوافق على الشرو والأحكام.</span>
              </label>
            </div>
            <div className="px-7 py-5 border-t border-gray-100 flex items-center justify-between">
              <button onClick={prev} className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 transition-colors" style={{ fontWeight: 500 }}>
                <ArrowRight className="w-4 h-4" /> رجوع
              </button>
              <button
                onClick={next}
                disabled={!agreed}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm transition-all ${agreed ? "bg-[#e35654] hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20" : "bg-gray-200 cursor-not-allowed"}`}
                style={{ fontWeight: 600 }}
              >
                التالي: رفع العقد الموقّع
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Upload */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-7 py-6 border-b border-gray-100">
              <h2 className="text-gray-900" style={{ fontWeight: 700 }}>
                {isFinancial ? "رفع المستندات المالية" : "رفع العقد الموقّع"}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {isFinancial
                  ? "ارفع الفاتورة أو إثبات الدفع لإتمام إجراءات المصاريف."
                  : "وقّع العقد المطبوع وارفع نسخة منه لإتمام الإجراء."}
              </p>
            </div>
            <div className="px-7 py-8">
              {isFinancial && (
                <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">💼</span>
                  <div>
                    <p className="text-blue-800 text-sm" style={{ fontWeight: 700 }}>وضع رفع المصاريف</p>
                    <p className="text-blue-600 text-xs mt-0.5 leading-relaxed">
                      العقد مكتمل وموقّع. الخطوة الوحيدة المطلوبة هي رفع <span style={{ fontWeight: 700 }}>الفاتورة أو إثبات التحويل</span> لإتمام الإجراء المالي.
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setUploaded(true)}
                className={`w-full border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
                  uploaded ? "border-green-400 bg-green-50" : "border-[#e35654]/30 bg-[#e35654]/5 hover:bg-[#e35654]/10 hover:border-[#e35654]/50"
                }`}
              >
                {uploaded ? (
                  <div>
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-green-700 text-sm" style={{ fontWeight: 700 }}>تم الرفع بنجاح!</p>
                    <p className="text-green-600 text-xs mt-1">
                      {isFinancial ? "invoice_payment_2025.pdf — 1.2 MB" : "contract_NEOM2025_signed.pdf — 2.4 MB"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-[#e35654]/10 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-[#e35654]" />
                    </div>
                    <p className="text-gray-800 mb-1" style={{ fontWeight: 700 }}>
                      {isFinancial ? "ارفع الفاتورة أو إثبات الدفع" : "ارفع نسخة العقد الموقّعة أو المختومة"}
                    </p>
                    <p className="text-gray-500 text-sm mb-3">اسحب الملف هنا أو انقر للاختيار</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["PDF", "JPG", "PNG"].map((fmt) => (
                        <span key={fmt} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs" style={{ fontWeight: 600 }}>
                          {fmt}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs" style={{ fontWeight: 600 }}>
                        الحد الأقصى 10MB
                      </span>
                    </div>
                  </div>
                )}
              </button>

              {/* Quality notice */}
              <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-amber-800 text-sm" style={{ fontWeight: 700 }}>تأكد من جودة الملف قبل الرفع</p>
                  <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                    {isFinancial
                      ? <>يجب أن تكون الفاتورة <span style={{ fontWeight: 700 }}>واضحة وتشمل رقم المرجع والمبلغ وتاريخ التحويل</span>. الملفات الضبابية أو الناقصة سترفض تلقائيًا.</>
                      : <>يجب أن يكون العقد <span style={{ fontWeight: 700 }}>موقّعًا بالقلم أو مختومًا رسميًا</span>، وأن تكون الصورة واضحة غير مقطوعة. الملفات الضبابية أو الناقصة سترفض تلقائيًا.</>
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="px-7 py-5 border-t border-gray-100 flex items-center justify-between">
              {isFinancial ? (
                <button onClick={() => navigate("/sponsor/sponsorships")} className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 transition-colors" style={{ fontWeight: 500 }}>
                  <ArrowRight className="w-4 h-4" /> رجوع للرعايات
                </button>
              ) : (
                <button onClick={prev} className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 transition-colors" style={{ fontWeight: 500 }}>
                  <ArrowRight className="w-4 h-4" /> رجوع
                </button>
              )}
              <button
                onClick={next}
                disabled={!uploaded}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm transition-all ${uploaded ? "bg-[#e35654] hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20" : "bg-gray-200 cursor-not-allowed"}`}
                style={{ fontWeight: 600 }}
              >
                {isFinancial ? "تأكيد رفع المصاريف ✅" : "تم توقيع العقد ✅"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-7 py-16">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-gray-900 text-2xl mb-2" style={{ fontWeight: 800 }}>🎉 تمّت الرعاية بنجاح!</h2>
            <p className="text-gray-500 mb-2 max-w-sm mx-auto">
              تمّ اعتماد عقد رعايتك لـ{" "}
              <span style={{ fontWeight: 700, color: "#e35654" }}>هاكاثون NEOM 2025</span> وأصبح نشطًا.
            </p>
            <p className="text-gray-400 text-sm mb-8">سيصلك إشعار بريدي يتضمن نسخة العقد المعتمدة.</p>

            <div className="bg-gray-50 rounded-2xl p-5 max-w-xs mx-auto text-right mb-8 space-y-3">
              {[
                { label: "الهاكاثون", value: "NEOM 2025" },
                { label: "نوع الرعاية", value: "ذهبية" },
                { label: "القيمة", value: "50,000 ر.س" },
                { label: "الحالة", value: "✅ نشط" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/sponsor")}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                style={{ fontWeight: 500 }}
              >
                العودة للبوابة
              </button>
              <button
                onClick={() => navigate("/sponsor/sponsorships")}
                className="flex items-center gap-2 justify-center px-6 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20 transition-colors"
                style={{ fontWeight: 600 }}
              >
                عرض رعاياتي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}