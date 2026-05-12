import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface ConversationInfo {
  id: number;
  packageName: string;
  hackathonId: number;
  status: "pending" | "accepted" | "rejected";
  currentStep: number;
}

interface Props {
  conversation: ConversationInfo;
  viewedStep: number;
  serverStep: number;
  advancing: boolean;
  uploading: boolean;
  receiptUploaded: boolean;
  onAdvance: () => void;
  onUploadClick: () => void;
  onViewStep: (step: number) => void;
}

const TERM_DEFS = [
  { label: "مدة الرعاية", value: "6 أشهر", icon: Clock },
  { label: "قيمة الرعاية", value: "50,000 ر.س", icon: DollarSign },
  { label: "حقوق الشعار", value: "مستوى أول — رقمي وفعلي", icon: Building2 },
  { label: "وقت العرض", value: "10 دقائق", icon: Clock },
  { label: "وصول لبيانات المشاركين", value: "نعم، مجهولة الهوية", icon: AlertCircle },
  { label: "تاريخ بدء الفعالية", value: "15 مارس 2026", icon: Calendar },
];

export function NegotiationStepPanel({
  conversation,
  viewedStep,
  serverStep,
  advancing,
  uploading,
  receiptUploaded,
  onAdvance,
  onUploadClick,
  onViewStep,
}: Props) {
  const { status, packageName } = conversation;
  const termValues = TERM_DEFS.map((t) => t.value);
  const [agreed, setAgreed] = useState(false);

  // قبل القبول: المراحل 1-4 مقفلة، نعرض رسالة توضيحية
  if (status === "pending") {
    return (
      <div className="mx-5 my-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-amber-900 text-sm" style={{ fontWeight: 700 }}>
          هذه المرحلة تُفتح بعد قبول طلب الرعاية
        </p>
        <p className="text-amber-700 text-xs mt-2 leading-relaxed">
          الطلب حالياً قيد المراجعة من المنظم. بإمكانك متابعة المحادثة في خطوة "التفاوض" حتى يصل الرد.
        </p>
        <button
          onClick={() => onViewStep(0)}
          className="mt-4 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs hover:bg-amber-100 transition-colors"
          style={{ fontWeight: 600 }}
        >
          ← الرجوع للتفاوض
        </button>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mx-5 my-3 bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <p className="text-red-800 text-sm" style={{ fontWeight: 700 }}>
          تم الاعتذار عن طلب الرعاية
        </p>
      </div>
    );
  }

  // Step 0 — الشات يكفي، نُظهر بانر بسيط
  if (viewedStep === 0) {
    return (
      <div className="mx-5 my-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
        <p className="text-blue-800 text-sm" style={{ fontWeight: 600 }}>
          ابدأ الحوار مع المنظم حول تفاصيل الرعاية
        </p>
        <p className="text-blue-700 text-xs mt-1">
          بعد الاتفاق المبدئي، انتقل للمرحلة التالية.
        </p>
        {serverStep === 0 && (
          <button
            onClick={onAdvance}
            disabled={advancing}
            className="mt-3 px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] disabled:opacity-60 inline-flex items-center gap-1.5"
            style={{ fontWeight: 600 }}
          >
            {advancing && <Loader2 className="w-3 h-3 animate-spin" />}
            الانتقال إلى مراجعة الشروط
          </button>
        )}
      </div>
    );
  }

  // Step 1 — مراجعة الشروط
  if (viewedStep === 1) {
    return (
      <div className="mx-5 my-3 bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
            مراجعة وتعديل الشروط
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            راجع كل بند وعدّله قبل إصدار العقد الرسمي.
          </p>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
            <div className="w-5 h-5 rounded-full bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3 h-3 text-[#6366f1]" />
            </div>
            <p className="text-gray-500 text-xs">
              البنود وضعها{" "}
              <span className="text-[#6366f1]" style={{ fontWeight: 700 }}>
                المنظم
              </span>
              . راجعها قبل الانتقال للعقد الرقمي.
            </p>
          </div>

          {TERM_DEFS.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                <t.icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs">{t.label}</p>
                <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>
                  {termValues[i]}
                </p>
              </div>
            </div>
          ))}

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mt-2">
            <p className="text-blue-700 text-xs leading-relaxed">
              ℹ️ بعد مراجعة الشروط، سيُصدر العقد الرسمي تلقائياً لإتمام الإجراءات.
            </p>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => onViewStep(0)}
            className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-700"
            style={{ fontWeight: 500 }}
          >
            <ArrowRight className="w-3.5 h-3.5" /> رجوع للتفاوض
          </button>
          {serverStep === 1 ? (
            <button
              onClick={onAdvance}
              disabled={advancing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {advancing && <Loader2 className="w-3 h-3 animate-spin" />}
              التالي: العقد الرقمي
            </button>
          ) : (
            <button
              onClick={() => onViewStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
              style={{ fontWeight: 600 }}
            >
              عرض العقد الرقمي
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 2 — العقد الرقمي
  if (viewedStep === 2) {
    return (
      <div className="mx-5 my-3 bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
            العقد الرقمي
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            راجع العقد النهائي قبل التوقيع الرقمي.
          </p>
        </div>
        <div className="px-5 py-4">
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-5 text-center text-white">
              <div className="w-10 h-10 rounded-xl bg-[#e35654] flex items-center justify-center mx-auto mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm" style={{ fontWeight: 800 }}>
                عقد رعاية رسمي
              </h4>
              <p className="text-gray-400 text-xs mt-1">
                رقم: #SP-{new Date().getFullYear()}-
                {String(conversation.id).padStart(4, "0")}
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">
                    الطرف الأول (المنظم)
                  </p>
                  <p className="text-gray-900 text-xs" style={{ fontWeight: 700 }}>
                    المنظِّم
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">
                    الطرف الثاني (الراعي)
                  </p>
                  <p className="text-gray-900 text-xs" style={{ fontWeight: 700 }}>
                    الباقة: {packageName}
                  </p>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                {termValues.map((val, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1.5 border-b border-gray-100"
                  >
                    <span className="text-gray-500 text-xs">
                      {TERM_DEFS[i].label}
                    </span>
                    <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#e35654]"
            />
            <span className="text-gray-600 text-xs">
              قرأت جميع بنود العقد وأوافق على الشروط والأحكام.
            </span>
          </label>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => onViewStep(1)}
            className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-700"
            style={{ fontWeight: 500 }}
          >
            <ArrowRight className="w-3.5 h-3.5" /> رجوع للشروط
          </button>
          {serverStep === 2 ? (
            <button
              onClick={onAdvance}
              disabled={!agreed || advancing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs transition-all ${
                agreed && !advancing
                  ? "bg-[#e35654] hover:bg-[#cc4a48]"
                  : "bg-gray-200 cursor-not-allowed"
              }`}
              style={{ fontWeight: 600 }}
            >
              {advancing && <Loader2 className="w-3 h-3 animate-spin" />}
              التالي: رفع الإيصال
            </button>
          ) : (
            <button
              onClick={() => onViewStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
              style={{ fontWeight: 600 }}
            >
              عرض الرفع
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 3 — رفع الإيصال
  if (viewedStep === 3) {
    const showSuccess = receiptUploaded || serverStep === 4;
    return (
      <div className="mx-5 my-3 bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
            رفع إيصال الدفع
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            ارفع الفاتورة أو إثبات الدفع لإتمام الإجراء المالي.
          </p>
        </div>
        <div className="px-5 py-5">
          <button
            onClick={onUploadClick}
            disabled={uploading || showSuccess}
            className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all disabled:cursor-default ${
              showSuccess
                ? "border-green-400 bg-green-50"
                : "border-[#e35654]/30 bg-[#e35654]/5 hover:bg-[#e35654]/10 hover:border-[#e35654]/50"
            }`}
          >
            {showSuccess ? (
              <div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-green-700 text-sm" style={{ fontWeight: 700 }}>
                  تم رفع الإيصال بنجاح
                </p>
                <p className="text-green-600 text-xs mt-1">
                  تمّ تسجيل الدفع وإتمام الرعاية.
                </p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#e35654]/10 flex items-center justify-center mx-auto mb-3">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-[#e35654] animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-[#e35654]" />
                  )}
                </div>
                <p className="text-gray-800 text-sm mb-1" style={{ fontWeight: 700 }}>
                  {uploading ? "جاري الرفع..." : "ارفع الفاتورة أو إثبات الدفع"}
                </p>
                <p className="text-gray-500 text-xs mb-3">
                  انقر لاختيار الملف
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["PDF", "JPG", "PNG"].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs"
                      style={{ fontWeight: 600 }}
                    >
                      {fmt}
                    </span>
                  ))}
                  <span
                    className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs"
                    style={{ fontWeight: 600 }}
                  >
                    حتى 10MB
                  </span>
                </div>
              </div>
            )}
          </button>

          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-base flex-shrink-0">⚠️</span>
            <div>
              <p className="text-amber-800 text-xs" style={{ fontWeight: 700 }}>
                تأكد من جودة الملف قبل الرفع
              </p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                يجب أن تكون الفاتورة{" "}
                <span style={{ fontWeight: 700 }}>
                  واضحة وتشمل رقم المرجع والمبلغ وتاريخ التحويل
                </span>
                .
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => onViewStep(2)}
            className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-700"
            style={{ fontWeight: 500 }}
          >
            <ArrowRight className="w-3.5 h-3.5" /> رجوع للعقد
          </button>
          {showSuccess && (
            <button
              onClick={() => onViewStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48]"
              style={{ fontWeight: 600 }}
            >
              عرض التأكيد ✅
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 4 — تم
  return (
    <div className="mx-5 my-3 bg-white rounded-2xl border border-gray-200 text-center px-5 py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-gray-900 text-lg mb-1" style={{ fontWeight: 800 }}>
        🎉 تمّت الرعاية بنجاح
      </h3>
      <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
        تمّ اعتماد عقد رعايتكِ لباقة{" "}
        <span style={{ fontWeight: 700, color: "#e35654" }}>{packageName}</span>{" "}
        وأصبح نشطاً.
      </p>
      <div className="bg-gray-50 rounded-2xl p-4 max-w-xs mx-auto text-right mb-4 space-y-2">
        {[
          { label: "الباقة", value: packageName },
          { label: "القيمة", value: "حسب الاتفاق" },
          { label: "الحالة", value: "✅ نشط" },
        ].map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">{item.label}</span>
            <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => onViewStep(0)}
        className="text-gray-500 text-xs hover:text-gray-700"
        style={{ fontWeight: 500 }}
      >
        عودة لبداية المحادثة
      </button>
    </div>
  );
}
