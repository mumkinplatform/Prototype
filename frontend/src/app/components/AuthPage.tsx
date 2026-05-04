import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Handshake,
  Users,
  Sparkles,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Building2,
  FileCheck,
  Upload,
} from "lucide-react";
import { apiPost, ApiError } from "../../lib/api";

const roles = [
  {
    id: "admin",
    label: "منظم",
    icon: LayoutDashboard,
    desc: "أنشئ وأدر الهاكاثونات",
    color: "#6366f1",
    bg: "#eef2ff",
    path: "/admin",
  },
  {
    id: "sponsor",
    label: "راعي",
    icon: Handshake,
    desc: "ادعم الابتكار وتواصل مع المنظمين",
    color: "#f59e0b",
    bg: "#fffbeb",
    path: "/sponsor",
  },
  {
    id: "participant",
    label: "مشارك",
    icon: Users,
    desc: "شارك في التحديات وكوّن فريقك",
    color: "#10b981",
    bg: "#f0fdf4",
    path: "/participant",
  },
];

export function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [crFile, setCrFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [orgName, setOrgName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApiError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 501) {
        toast.info("هذا الدور قريباً");
      } else if (err.status === 404) {
        toast.error("لا يوجد حساب بهذا الدور، يرجى إنشاء حساب جديد");
      } else if (err.status === 401) {
        toast.error("البريد أو كلمة المرور غير صحيحة");
      } else if (err.status === 409) {
        toast.error("هذا البريد مسجّل مسبقاً بهذا الدور");
      } else {
        toast.error(err.message);
      }
    } else {
      toast.error("تعذّر الاتصال بالخادم");
    }
  };

  const handleContinue = async () => {
    if (step !== 1 || !selectedRole) return;

    if (!isLogin) {
      setStep(2);
      return;
    }

    if (!email) {
      toast.error("الرجاء إدخال البريد الإلكتروني");
      return;
    }
    if (!password) {
      toast.error("الرجاء إدخال كلمة المرور");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/auth/login", {
        role: selectedRole,
        email,
        password,
      });
      navigate("/verify-otp", { state: { email, role: selectedRole } });
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRegister = async () => {
    if (!selectedRole) return;

    if (!fullName.trim()) {
      toast.error("الرجاء إدخال الاسم الكامل");
      return;
    }
    if (!email.trim()) {
      toast.error("الرجاء إدخال البريد الإلكتروني");
      return;
    }
    if (!password) {
      toast.error("الرجاء إدخال كلمة المرور");
      return;
    }
    if (password.length < 8) {
      toast.error("كلمة المرور لازم 8 أحرف على الأقل");
      return;
    }
    if (!bio.trim()) {
      toast.error("الرجاء إدخال نبذة شخصية");
      return;
    }
    if (selectedRole === "admin") {
      if (!orgName.trim()) {
        toast.error("الرجاء إدخال اسم المنظمة");
        return;
      }
    }
    if (selectedRole === "sponsor") {
      if (!brandName.trim()) {
        toast.error("الرجاء إدخال اسم الجهة / الشركة");
        return;
      }
      if (!crNumber.trim()) {
        toast.error("الرجاء إدخال رقم السجل التجاري");
        return;
      }
      if (!/^\d{10}$/.test(crNumber)) {
        toast.error("رقم السجل التجاري لازم 10 أرقام");
        return;
      }
    }
    if (selectedRole === "participant") {
      if (skills.length === 0) {
        toast.error("الرجاء اختيار مهارة واحدة على الأقل");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await apiPost("/auth/signup", {
        role: selectedRole,
        email,
        password,
        fullName,
        bio,
        orgName,
        brandName,
        crNumber,
        skills,
      });
      navigate("/verify-otp", { state: { email, role: selectedRole } });
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-[calc(100vh-64px)] bg-[#fafaf9] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#e35654] px-8 py-8 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl mb-1" style={{ fontWeight: 700 }}>
              {isLogin ? "أهلًا بعودتك 👋" : "انضم إلى مُمكّن"}
            </h1>
            <p className="text-white/80 text-sm">
              {isLogin
                ? "سجّل دخولك للمتابعة"
                : "أنشئ حسابك في دقيقتين"}
            </p>
          </div>

          {/* Toggle */}
          <div className="px-8 pt-6">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => { setIsLogin(true); setStep(1); }}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isLogin
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
                style={{ fontWeight: isLogin ? 600 : 400 }}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => { setIsLogin(false); setStep(1); }}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  !isLogin
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
                style={{ fontWeight: !isLogin ? 600 : 400 }}
              >
                إنشاء حساب
              </button>
            </div>
          </div>

          <div className="px-8 pb-8 pt-6">
            {/* Step 1 - Role Selection */}
            {step === 1 && (
              <div>
                <p className="text-gray-700 text-sm mb-4" style={{ fontWeight: 500 }}>
                  اختر دورك
                </p>
                <div className="space-y-3 mb-6">
                  {roles.map((role) => {
                    const active = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-right ${
                          active
                            ? "border-[#e35654] bg-[#e35654]/5"
                            : "border-gray-100 hover:border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: active ? role.color : role.bg,
                          }}
                        >
                          <role.icon
                            className="w-5 h-5"
                            style={{ color: active ? "white" : role.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className="text-gray-900 text-sm"
                            style={{ fontWeight: 600 }}
                          >
                            {role.label}
                          </p>
                          <p className="text-gray-400 text-xs">{role.desc}</p>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-5 h-5 text-[#e35654]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Email for login */}
                {isLogin && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
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
                    <div>
                      <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                        كلمة المرور
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/forgot-password", {
                            state: { email, role: selectedRole },
                          })
                        }
                        className="text-[#e35654] text-xs hover:underline"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={!selectedRole || isSubmitting}
                  className={`w-full py-3.5 rounded-2xl text-white text-sm transition-all duration-200 ${
                    selectedRole && !isSubmitting
                      ? "bg-[#e35654] hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/25"
                      : "bg-gray-200 cursor-not-allowed"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {isSubmitting ? "..." : isLogin ? "دخول" : "التالي"}
                  {!isLogin && !isSubmitting && <ArrowLeft className="inline w-4 h-4 mr-1" />}
                </button>
              </div>
            )}

            {/* Step 2 - Register Form */}
            {step === 2 && !isLogin && (
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-500 text-sm mb-5 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                  رجوع
                </button>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      placeholder="محمد العمري"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
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
                  <div>
                    <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="8 أحرف على الأقل"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                  <div>
                    <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                      نبذة شخصية
                    </label>
                    <textarea
                      placeholder="اكتب نبذة مختصرة عنك..."
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all resize-none"
                    />
                  </div>

                  {/* Role-specific fields */}
                  {selectedRole === "participant" && (
                    <div>
                      <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                        مهاراتك التقنية
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["React", "Python", "UI/UX", "AI/ML", "Node.js", "Data"].map((skill) => {
                          const active = skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() =>
                                setSkills((prev) =>
                                  prev.includes(skill)
                                    ? prev.filter((s) => s !== skill)
                                    : [...prev, skill]
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                active
                                  ? "border-[#e35654] text-[#e35654] bg-[#e35654]/10"
                                  : "border-gray-200 text-gray-600 hover:border-[#e35654] hover:text-[#e35654] hover:bg-[#e35654]/5"
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-gray-400 text-xs mt-2">اختاري مهارة واحدة على الأقل</p>
                    </div>
                  )}

                  {selectedRole === "sponsor" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                          اسم الجهة / الشركة
                        </label>
                        <div className="relative">
                          <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="شركة ريادة للاستثمار"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                          رقم السجل التجاري
                        </label>
                        <div className="relative">
                          <FileCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="1010XXXXXX"
                            maxLength={10}
                            dir="ltr"
                            value={crNumber}
                            onChange={(e) => setCrNumber(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all tracking-widest"
                          />
                        </div>
                        <p className="text-gray-400 text-xs mt-1">رقم مكوّن من 10 أرقام صادر من وزارة التجارة</p>
                      </div>
                    </div>
                  )}

                  {selectedRole === "admin" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-700 text-sm block mb-1.5" style={{ fontWeight: 500 }}>
                          اسم المنظمة / الجهة المنظِّمة
                        </label>
                        <div className="relative">
                          <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="مركز الابتكار الرقمي"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmitRegister}
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-2xl text-white text-sm transition-all duration-200 ${
                    isSubmitting
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-[#e35654] hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/25"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {isSubmitting ? "جاري الإنشاء..." : "إنشاء الحساب 🚀"}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          بالمتابعة، أنت توافق على{" "}
          <a href="#" className="text-[#e35654] hover:underline">
            الشروط والأحكام
          </a>{" "}
          و{" "}
          <a href="#" className="text-[#e35654] hover:underline">
            سياسة الخصوصية
          </a>
        </p>
      </div>
    </div>
  );
}