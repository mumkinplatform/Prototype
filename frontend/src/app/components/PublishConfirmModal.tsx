import { X, Rocket } from 'lucide-react';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PublishConfirmModal({
  isOpen,
  onClose,
  onConfirm
}: PublishConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-50 to-white p-8 pb-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full hover:bg-white/80 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              هل أنت متأكد من نشر الهاكاثون الآن؟
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md">
              تأكد من إكمال جميع التفاصيل الضرورية قبل النشر. سيتمكن المشاركون والرعاة من رؤية الهاكاثون مباشرة بعد النشر.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
              style={{ fontWeight: 600 }}
            >
              الرجوع للتعديل
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all shadow-lg shadow-blue-600/30"
              style={{ fontWeight: 600 }}
            >
              تأكيد النشر 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}