import { Loader2 } from "lucide-react";

interface Props {
  packageName: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SponsorApplyDialog({
  packageName,
  submitting,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => !submitting && onCancel()}
    >
      <div
        dir="rtl"
        className="bg-white rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-gray-900 mb-2"
          style={{ fontWeight: 700, fontSize: "1.1rem" }}
        >
          تأكيد التقديم
        </h3>
        <p className="text-sm text-gray-600 mb-1">
          هل أنت متأكد من التقديم على:
        </p>
        <p
          className="text-base mb-4"
          style={{ fontWeight: 700, color: "#e35654" }}
        >
          {packageName}
        </p>
        <p className="text-xs text-gray-500 mb-6">
          بعد التقديم، سيراجع المنظم طلبك وسيتم إشعارك بالنتيجة.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#e35654", fontWeight: 600 }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "جاري التقديم..." : "تأكيد التقديم"}
          </button>
        </div>
      </div>
    </div>
  );
}
