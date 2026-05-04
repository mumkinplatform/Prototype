import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import { Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { apiPost, ApiError } from "../../lib/api";
import type { Role } from "../../lib/auth";

export function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail =
    (location.state as { email?: string } | null)?.email ?? "";
  const initialRole: Role =
    ((location.state as { role?: Role } | null)?.role as Role) ?? "admin";

  const [stage, setStage] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(initialEmail);
  const [role] = useState<Role>(initialRole);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      toast.error("الرجاء إدخال البريد الإلكتروني");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiPost("/auth/forgot-password", { role, email });
      toast.success("تم إرسال كود إعادة التعيين إلى بريدك");
      setStage("reset");
    } catch (err) {
      if (err instanceof ApiError && err.status === 501) {
        toast.info("هذا الدور قريباً");
      } else {
        toast.error("تعذّر الإرسال، حاولي بعد قليل");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("الرجاء إدخال الكود (6 أرقام)");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("كلمة المرور لازم 8 أحرف على الأقل");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiPost("/auth/reset-password", { role, email, code, newPassword });
      toast.success("تم تغيير كلمة المرور — سجّلي دخولك الآن");
      setTimeout(() => navigate("/auth"), 1000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("الكود غير صحيح أو منتهي");
      } else {
        toast.error("تعذّر إعادة التعيين، حاولي مرة أخرى");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-[calc(100vh-64px)] bg-[#fafaf9] flex items-center justify-center py-12 px-4"
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#e35654] px-8 py-8 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl mb-1" style={{ fontWeight: 700 }}>
              نسيت كلمة المرور
            </h1>
            <p className="text-white/80 text-sm">
              {stage === "email"
                ? "أدخلي بريدك ونرسل لك كود لإعادة التعيين"
                : "أدخلي الكود وكلمة المرور الجديدة"}
            </p>
          </div>

          <div className="px-8 py-8">
            {stage === "email" ? (
              <div className="space-y-4">
                <div>
                  <label
                    className="text-gray-700 text-sm block mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                  />
                </div>
                <button
                  onClick={handleEmailSubmit}
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-2xl text-white text-sm transition-all ${
                    isSubmitting
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-[#e35654] hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/25"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {isSubmitting ? "..." : "إرسال كود إعادة التعيين"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    className="text-gray-700 text-sm block mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    كود إعادة التعيين
                  </label>
                  <input
                    type="text"
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                  />
                </div>
                <div>
                  <label
                    className="text-gray-700 text-sm block mb-1.5"
                    style={{ fontWeight: 500 }}
                  >
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="8 أحرف على الأقل"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                    />
                    <button
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleResetSubmit}
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-2xl text-white text-sm transition-all ${
                    isSubmitting
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-[#e35654] hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/25"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {isSubmitting ? "..." : "إعادة تعيين كلمة المرور"}
                </button>
                <button
                  onClick={() => setStage("email")}
                  className="w-full text-gray-500 text-xs hover:text-gray-700 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                  تغيير البريد
                </button>
              </div>
            )}

            <button
              onClick={() => navigate("/auth")}
              className="w-full mt-6 text-gray-500 text-sm hover:text-gray-700 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
