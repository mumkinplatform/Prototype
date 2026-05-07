import { useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewHackathon: () => void;
  onViewDashboard: () => void;
  hackathonUrl?: string;
}

export default function PublishSuccessModal({
  isOpen,
  onClose,
  onViewHackathon,
  onViewDashboard,
  hackathonUrl = ''
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(hackathonUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Content */}
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 text-4xl animate-bounce">
              🎉
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl text-gray-900 mb-3" style={{ fontWeight: 700 }}>
            تم نشر الهاكاثون بنجاح!
          </h2>
          
          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-md mx-auto">
            تهانينا! الهاكاثون الخاص بك الآن منشور ومتاح للجميع. يمكن للمشاركين والرعاة الاطلاع عليه والتسجيل مباشرة.
          </p>

          {/* URL Copy Box */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
            <label className="block text-xs text-gray-600 mb-2 text-right" style={{ fontWeight: 600 }}>
              رابط الهاكاثون
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={hackathonUrl}
                readOnly
                className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                style={{ fontWeight: 600 }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onViewHackathon}
              className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-600/30"
              style={{ fontWeight: 600 }}
            >
              عرض صفحة الهاكاثون
            </button>
            <button
              onClick={onViewDashboard}
              className="flex-1 px-6 py-3.5 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all text-sm"
              style={{ fontWeight: 600 }}
            >
              العودة للإحصائيات
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}