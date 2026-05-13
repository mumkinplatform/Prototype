import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Tag,
  ArrowRight,
  Loader2,
  User,
} from "lucide-react";

interface ConversationInfo {
  id: number;
  packageName: string;
  packageType: string;
  packagePrice: number | null;
  hackathonId: number;
  hackathonTitle: string;
  hackathonStartDate: string | null;
  organizerName: string;
  appliedAt: string;
  status: "pending" | "accepted" | "rejected";
  currentStep: number;
  sponsorSignedAt: string | null;
}

interface Props {
  conversation: ConversationInfo;
  viewedStep: number;
  serverStep: number;
  advancing: boolean;
  onAdvance: () => void;
  onViewStep: (step: number) => void;
}

function formatLongDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return `${amount.toLocaleString("ar-SA")} ر.س`;
}

const PACKAGE_TYPE_LABELS: Record<string, string> = {
  financial: "مالية",
  technical: "تقنية",
  logistic: "لوجستية",
  hospitality: "ضيافة",
  media: "إعلامية",
  other: "أخرى",
};

function packageTypeLabel(type: string): string {
  return PACKAGE_TYPE_LABELS[type] ?? type;
}

export function NegotiationStepPanel({
  conversation,
  viewedStep,
  serverStep,
  advancing,
  onAdvance,
  onViewStep,
}: Props) {
  const {
    status,
    packageName,
    packageType,
    packagePrice,
    hackathonTitle,
    hackathonStartDate,
    organizerName,
    appliedAt,
    sponsorSignedAt,
  } = conversation;
  const [agreed, setAgreed] = useState(false);
  const signedDateText = formatDateTime(sponsorSignedAt);

  // بنود العقد من بيانات حقيقية في DB
  const terms: Array<{ label: string; value: string; icon: typeof FileText }> = [
    { label: "الهاكاثون", value: hackathonTitle, icon: FileText },
    { label: "الباقة", value: packageName, icon: Building2 },
    { label: "نوع الباقة", value: packageTypeLabel(packageType), icon: Tag },
    { label: "قيمة الرعاية", value: formatPrice(packagePrice), icon: DollarSign },
    { label: "تاريخ التقديم", value: formatLongDate(appliedAt), icon: Calendar },
    { label: "تاريخ بدء الفعالية", value: formatLongDate(hackathonStartDate), icon: Calendar },
    { label: "المنظِّم", value: organizerName, icon: User },
  ];

  // قبل القبول: المراحل 1-3 مقفلة، نعرض رسالة توضيحية
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
            مراجعة الشروط
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            راجع تفاصيل الرعاية المسجّلة في النظام قبل التوقيع على العقد.
          </p>
        </div>
        <div className="px-5 py-4 space-y-2">
          {terms.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                <t.icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs">{t.label}</p>
                <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>
                  {t.value}
                </p>
              </div>
            </div>
          ))}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mt-2">
            <p className="text-blue-700 text-xs leading-relaxed">
              ℹ️ هذه التفاصيل ستظهر في العقد الرقمي. لو تحتاج تعديلاً تواصل مع المنظم في الشات.
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

  // Step 2 — العقد الرقمي (التوقيع = إتمام الرعاية)
  if (viewedStep === 2) {
    return (
      <div className="mx-5 my-3 bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
            العقد الرقمي
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            راجع العقد ووقّع عليه إلكترونياً لإتمام الرعاية.
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
                    {organizerName}
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
                {terms.map((t, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1.5 border-b border-gray-100"
                  >
                    <span className="text-gray-500 text-xs">{t.label}</span>
                    <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
                      {t.value}
                    </span>
                  </div>
                ))}
              </div>
              {/* توقيع الراعي — يظهر بعد التوقيع */}
              <div className="mt-2 pt-3 border-t-2 border-gray-200">
                {signedDateText ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-green-700 text-xs mb-0.5" style={{ fontWeight: 600 }}>
                      ✓ تم توقيع الراعي على العقد
                    </p>
                    <p className="text-green-900 text-xs" style={{ fontWeight: 700 }}>
                      التاريخ: {signedDateText}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-gray-500 text-xs" style={{ fontWeight: 600 }}>
                      لم يُوقَّع العقد بعد — وافق على الشروط أدناه واضغط "توقيع وإتمام الرعاية"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!signedDateText && (
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
          )}
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
              توقيع وإتمام الرعاية
            </button>
          ) : (
            <button
              onClick={() => onViewStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
              style={{ fontWeight: 600 }}
            >
              عرض التأكيد ✅
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 3 — مكتمل
  return (
    <div className="mx-5 my-3 bg-white rounded-2xl border border-gray-200 text-center px-5 py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-gray-900 text-lg mb-1" style={{ fontWeight: 800 }}>
        🎉 تمّت الرعاية بنجاح
      </h3>
      <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
        تمّ توقيع عقد رعايتكِ لباقة{" "}
        <span style={{ fontWeight: 700, color: "#e35654" }}>{packageName}</span>{" "}
        وأصبح نشطاً.
      </p>
      <div className="bg-gray-50 rounded-2xl p-4 max-w-xs mx-auto text-right mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">الهاكاثون</span>
          <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
            {hackathonTitle}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">الباقة</span>
          <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
            {packageName}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">القيمة</span>
          <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
            {formatPrice(packagePrice)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">تاريخ التوقيع</span>
          <span className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>
            {signedDateText ?? "—"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">الحالة</span>
          <span className="text-green-700 text-xs" style={{ fontWeight: 700 }}>
            ✅ ساري
          </span>
        </div>
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
