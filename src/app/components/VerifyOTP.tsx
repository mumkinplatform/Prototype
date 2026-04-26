import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Mail, CheckCircle2, ArrowLeft, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
 
export function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
 
  const email = location.state?.email || "user@example.com";
  const role = location.state?.role || "participant";
 
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);
 
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
 
  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
 
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
 
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };
 
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("الرجاء إدخال الكود كاملاً");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      toast.success("تم التحقق بنجاح! 🎉");
      const roleMap: { [key: string]: string } = {
        admin: "/admin",
        sponsor: "/sponsor",
        participant: "/participant",
      };
      setTimeout(() => {
        navigate(roleMap[role] || "/participant");
      }, 1000);
    }, 2000);
  };
 
  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    toast.success("تم إرسال كود جديد إلى بريدك الإلكتروني");
  };
 
  const isComplete = otp.every((digit) => digit !== "");
 
  return (
    <div dir="rtl" className="min-h-[calc(100vh-64px)] bg-[#fafaf9] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#a41b42] to-[#c03c3a] px-8 py-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 relative z-10"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl mb-2 relative z-10" style={{ fontWeight: 700 }}>
              تحقق من بريدك الإلكتروني
            </h1>
            <p className="text-white/90 text-sm relative z-10">
              أدخل الكود المكون من 6 أرقام المُرسل إلى
            </p>
            <p className="text-white mt-1 text-sm relative z-10" style={{ fontWeight: 600 }} dir="ltr">
              {email}
            </p>
          </div>
 
          <div className="px-8 py-8">
            {/* OTP Input */}
            <div className="mb-8">
              <motion.div
                className="flex gap-2 justify-center"
                dir="ltr"
                onPaste={handlePaste}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-xl rounded-xl border-2 bg-gray-50 transition-all duration-200 focus:outline-none ${
                      digit
                        ? "border-[#a41b42] bg-[#a41b42]/5 text-gray-900"
                        : "border-gray-200 text-gray-900 focus:border-[#a41b42] focus:ring-2 focus:ring-[#a41b42]/10"
                    }`}
                    style={{ fontWeight: 600 }}
                  />
                ))}
              </motion.div>
            </div>
 
            {/* Verify Button */}
            <motion.button
              whileHover={{ scale: isComplete && !isVerifying ? 1.02 : 1 }}
              whileTap={{ scale: isComplete && !isVerifying ? 0.98 : 1 }}
              onClick={handleVerify}
              disabled={!isComplete || isVerifying}
              className={`w-full py-3.5 rounded-2xl text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                isComplete && !isVerifying
                  ? "bg-gradient-to-l from-[#a41b42] to-[#c03c3a] hover:opacity-90 shadow-lg shadow-[#a41b42]/25"
                  : "bg-gray-200 cursor-not-allowed"
              }`}
              style={{ fontWeight: 600 }}
            >
              {isVerifying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  تحقق من الكود
                </>
              )}
            </motion.button>
 
            {/* Resend Section */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm mb-3">
                لم يصلك الكود؟
              </p>
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="flex items-center justify-center gap-2 text-[#a41b42] text-sm hover:underline mx-auto transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <RefreshCcw className="w-4 h-4" />
                  إعادة إرسال الكود
                </button>
              ) : (
                <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                  <span>يمكنك إعادة الإرسال بعد</span>
                  <span className="text-[#a41b42]" style={{ fontWeight: 600 }}>
                    {countdown} ثانية
                  </span>
                </p>
              )}
            </div>
 
            {/* Back Button */}
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center justify-center gap-2 text-gray-500 text-sm hover:text-gray-700 mx-auto mt-6 transition-all"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
 
        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-white/80 rounded-2xl p-4 border border-gray-100"
        >
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-[#fabb5b]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail className="w-4 h-4 text-[#fabb5b]" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>
                تأكد من صندوق الوارد
              </p>
              <p className="text-gray-500 text-xs leading-relaxed">
                قد يستغرق وصول الكود بضع دقائق. تحقق أيضاً من مجلد الرسائل غير المرغوب فيها (Spam).
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
 