import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'warning' | 'danger';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'success'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      button: 'bg-green-600 hover:bg-green-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    danger: {
      bg: 'bg-[#fef2f4]',
      border: 'border-[#fad1d8]',
      icon: 'text-[#a41b42]',
      button: 'bg-[#8b1538] hover:bg-[#72112e]'
    }
  };

  const colorScheme = colors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`${colorScheme.bg} border-b-2 ${colorScheme.border} p-6`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${colorScheme.bg} border-2 ${colorScheme.border} flex items-center justify-center`}>
              {type === 'success' ? (
                <CheckCircle2 className={`w-6 h-6 ${colorScheme.icon}`} />
              ) : (
                <AlertCircle className={`w-6 h-6 ${colorScheme.icon}`} />
              )}
            </div>
            <h3 className="text-xl text-gray-900 flex-1" style={{ fontWeight: 700 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/50 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 transition-all"
            style={{ fontWeight: 600 }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-3 rounded-xl text-white ${colorScheme.button} transition-all shadow-md`}
            style={{ fontWeight: 600 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
