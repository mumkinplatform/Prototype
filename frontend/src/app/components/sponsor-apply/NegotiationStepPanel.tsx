import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  FileText,
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

// شكل العقد كما يرجّعه /sponsors/applications/:id/contract — مشترك بين
// الجهتين. إذا كان `null` فالمحادثة دخلت قبل ما المنظم يبدأ صياغة العقد.
export interface ContractView {
  terms: {
    duration: string | null;
    value: string | null;
    logoRights: string | null;
    displayTime: string | null;
    dataAccess: string | null;
    notes: string | null;
    submittedAt: string | null;
  };
  acceptance: {
    sponsorAccepted: boolean;
    sponsorAcceptedAt: string | null;
  };
  signatures: {
    organizerSigned: boolean;
    organizerSignedAt: string | null;
    sponsorSigned: boolean;
    sponsorSignedAt: string | null;
  };
  parties: {
    hackathonTitle: string;
    packageName: string;
    sponsorName: string;
    organizerName: string;
  };
}

interface Props {
  conversation: ConversationInfo;
  viewedStep: number;
  serverStep: number;
  contract: ContractView | null;
  signing: boolean;
  accepting: boolean;
  onAccept: () => void;
  onSign: () => void;
  onViewStep: (step: number) => void;
}

const TERM_LABELS = [
  { key: "duration", label: "مدة الرعاية", icon: Clock },
  { key: "value", label: "قيمة الرعاية", icon: DollarSign },
  { key: "logoRights", label: "حقوق الشعار", icon: Building2 },
  { key: "displayTime", label: "وقت العرض", icon: Clock },
  { key: "dataAccess", label: "وصول لبيانات المشاركين", icon: AlertCircle },
  { key: "notes", label: "ملاحظات", icon: Calendar },
] as const;

export function NegotiationStepPanel({
  conversation,
  viewedStep,
  serverStep,
  contract,
  signing,
  accepting,
  onAccept,
  onSign,
  onViewStep,
}: Props) {
  const { status, packageName } = conversation;
  const [agreed, setAgreed] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const termsSubmitted = !!contract?.terms.submittedAt;
  const sponsorAccepted = contract?.acceptance.sponsorAccepted ?? false;
  const sponsorSigned = contract?.signatures.sponsorSigned ?? false;
  const organizerSigned = contract?.signatures.organizerSigned ?? false;

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
          بعد الاتفاق المبدئي، المنظم سيرسل لك شروط العقد للمراجعة.
        </p>
      </div>
    );
  }

  // Step 1 — مراجعة الشروط
  if (viewedStep === 1) {
    if (!termsSubmitted) {
      return (
        <div className="mx-5 my-3 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-amber-900 text-sm" style={{ fontWeight: 700 }}>
            بانتظار شروط العقد من المنظم
          </p>
          <p className="text-amber-700 text-xs mt-2 leading-relaxed">
            ستظهر هنا شروط العقد بعد أن يرسلها لك المنظم. تابع المحادثة معه للوصول لاتفاق مبدئي.
          </p>
          <button
            onClick={() => onViewStep(0)}
            className="mt-4 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs hover:bg-amber-100"
            style={{ fontWeight: 600 }}
          >
            ← الرجوع للمحادثة
          </button>
        </div>
      );
    }
    return (
      <div className="mx-5 my-3 bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
            شروط العقد المُرسلة
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            راجع البنود التالية بعناية. لو كل شيء واضح، انتقل للعقد الرقمي للتوقيع.
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

          {TERM_LABELS.map((t) => {
            const value = contract?.terms[t.key] ?? null;
            if (!value) return null;
            return (
              <div key={t.key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <t.icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs">{t.label}</p>
                  <p className="text-gray-900 text-sm whitespace-pre-line" style={{ fontWeight: 600 }}>
                    {value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {/* بانر/زر موافقة الراعي — إن لم يوافق بعد، يلزم الموافقة قبل
            الانتقال للعقد الرقمي. */}
        {sponsorAccepted ? (
          <div className="mx-5 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 text-xs flex items-center gap-1.5" style={{ fontWeight: 700 }}>
              <CheckCircle2 className="w-4 h-4" /> وافقت على هذه الشروط
            </p>
            {contract?.acceptance.sponsorAcceptedAt && (
              <p className="text-green-700 text-[11px] mt-1">
                في {new Date(contract.acceptance.sponsorAcceptedAt).toLocaleString("ar-SA")}
              </p>
            )}
          </div>
        ) : (
          <div className="mx-5 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#e35654]"
              />
              <span className="text-gray-700 text-xs leading-relaxed">
                قرأت الشروط أعلاه بالكامل وأوافق عليها. إن كان لديّ تحفّظ
                فسأناقشه مع المنظم في الشات قبل الموافقة.
              </span>
            </label>
            <button
              onClick={onAccept}
              disabled={!agreedTerms || accepting}
              className="mt-3 w-full px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              {accepting && <Loader2 className="w-3 h-3 animate-spin" />}
              موافق على الشروط
            </button>
            <p className="text-gray-500 text-[11px] mt-2 leading-relaxed">
              بعد الموافقة، يُفتح العقد الرقمي للتوقيع. لا يمكن التراجع
              عن الموافقة لذلك راجع البنود جيداً.
            </p>
          </div>
        )}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => onViewStep(0)}
            className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-700"
            style={{ fontWeight: 500 }}
          >
            <ArrowRight className="w-3.5 h-3.5" /> رجوع للتفاوض
          </button>
          {sponsorAccepted && (
            <button
              onClick={() => onViewStep(2)}
              className="px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] inline-flex items-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              <FileText className="w-3.5 h-3.5" /> الانتقال للعقد الرقمي
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 2 — العقد الرقمي + توقيع الراعي
  if (viewedStep === 2) {
    if (!termsSubmitted) {
      return (
        <div className="mx-5 my-3 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center max-w-md mx-auto">
          <p className="text-amber-800 text-sm" style={{ fontWeight: 700 }}>
            لم يُرسل المنظم الشروط بعد
          </p>
          <button
            onClick={() => onViewStep(0)}
            className="mt-3 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs hover:bg-amber-100"
            style={{ fontWeight: 600 }}
          >
            ← الرجوع للمحادثة
          </button>
        </div>
      );
    }
    // مفتاح الحماية: لا عقد رقمي قبل قبول الراعي على الشروط — هذا الباك
    // يفرضه برضو في /sign فلا ينفع الالتفاف.
    if (!sponsorAccepted) {
      return (
        <div className="mx-5 my-3 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-amber-900 text-sm" style={{ fontWeight: 700 }}>
            وافق على الشروط أولاً
          </p>
          <p className="text-amber-700 text-xs mt-2 leading-relaxed">
            لا يمكن البدء بالعقد الرقمي والتوقيع قبل أن توافق على الشروط
            في خطوة "مراجعة الشروط".
          </p>
          <button
            onClick={() => onViewStep(1)}
            className="mt-4 px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs hover:bg-amber-100"
            style={{ fontWeight: 600 }}
          >
            ← الرجوع لمراجعة الشروط
          </button>
        </div>
      );
    }
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
                    {contract?.parties.organizerName ?? "—"}
                  </p>
                  <p className="text-gray-400 text-[10px] mt-1">
                    {contract?.parties.hackathonTitle ?? ""}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">
                    الطرف الثاني (الراعي)
                  </p>
                  <p className="text-gray-900 text-xs" style={{ fontWeight: 700 }}>
                    {contract?.parties.sponsorName ?? "—"}
                  </p>
                  <p className="text-gray-400 text-[10px] mt-1">
                    باقة {packageName}
                  </p>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                {TERM_LABELS.map((t) => {
                  const value = contract?.terms[t.key] ?? null;
                  if (!value) return null;
                  return (
                    <div
                      key={t.key}
                      className="flex justify-between items-start py-1.5 border-b border-gray-100 gap-3"
                    >
                      <span className="text-gray-500 text-xs">{t.label}</span>
                      <span className="text-gray-900 text-xs text-left whitespace-pre-line" style={{ fontWeight: 600 }}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* قسم التواقيع */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-3 border ${organizerSigned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className="text-gray-500 text-[10px] mb-1">توقيع المنظم</p>
                  {organizerSigned ? (
                    <>
                      <p className="text-green-700 text-xs flex items-center gap-1" style={{ fontWeight: 700 }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> موقَّع
                      </p>
                      {contract?.signatures.organizerSignedAt && (
                        <p className="text-gray-400 text-[10px] mt-1">
                          {new Date(contract.signatures.organizerSignedAt).toLocaleString("ar-SA")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-xs">بانتظار التوقيع</p>
                  )}
                </div>
                <div className={`rounded-xl p-3 border ${sponsorSigned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <p className="text-gray-500 text-[10px] mb-1">توقيعك (الراعي)</p>
                  {sponsorSigned ? (
                    <>
                      <p className="text-green-700 text-xs flex items-center gap-1" style={{ fontWeight: 700 }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> موقَّع
                      </p>
                      {contract?.signatures.sponsorSignedAt && (
                        <p className="text-gray-400 text-[10px] mt-1">
                          {new Date(contract.signatures.sponsorSignedAt).toLocaleString("ar-SA")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-xs">بانتظار التوقيع</p>
                  )}
                </div>
              </div>

              {/* checkbox + زر التوقيع (بانتظار توقيع المنظم أولاً) */}
              {!sponsorSigned && (
                <div className="mt-4">
                  {!organizerSigned ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                      <p className="text-amber-800 text-xs" style={{ fontWeight: 600 }}>
                        ⏳ بانتظار توقيع المنظم
                      </p>
                      <p className="text-amber-600 text-[10px] mt-1">
                        ستتمكن من التوقيع بعد توقيع المنظم على العقد.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#e35654]"
                        />
                        <span className="text-gray-700 text-xs leading-relaxed">
                          قرأت بنود العقد بالكامل وأوافق عليها بصفتي ممثلاً عن الراعي.
                        </span>
                      </label>
                      <button
                        onClick={onSign}
                        disabled={!agreed || signing}
                        className="mt-3 w-full px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                        style={{ fontWeight: 600 }}
                      >
                        {signing && <Loader2 className="w-3 h-3 animate-spin" />}
                        توقيع العقد رقمياً
                      </button>
                    </div>
                  )}
                </div>
              )}

              {organizerSigned && sponsorSigned && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-green-800 text-xs" style={{ fontWeight: 700 }}>
                    العقد ساري ومُوقَّع من الطرفين 🎉
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => onViewStep(1)}
            className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-700"
            style={{ fontWeight: 500 }}
          >
            <ArrowRight className="w-3.5 h-3.5" /> رجوع للشروط
          </button>
          {organizerSigned && sponsorSigned && (
            <button
              onClick={() => onViewStep(4)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
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
          { label: "قيمة الرعاية", value: contract?.terms.value ?? "حسب الاتفاق" },
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
