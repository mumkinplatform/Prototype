import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Calendar,
  Shield,
  Camera,
  Edit3,
  Save,
  X,
  Key,
  Handshake,
  CreditCard,
  TrendingUp,
  Award,
  Eye,
  FileText,
  Target,
  LogOut,
  ArrowRight,
} from "lucide-react";

export function SponsorProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "stats" | "security">("info");

  const [profileData, setProfileData] = useState({
    companyName: "شركة التقنية المتقدمة",
    contactName: "عبدالله محمد الشهري",
    email: "info@advancedtech.sa",
    phone: "+966 11 234 5678",
    position: "مدير تطوير الأعمال",
    commercialRegister: "1010987654",
    location: "الرياض، المملكة العربية السعودية",
    website: "www.advancedtech.sa",
    industry: "تقنية المعلومات والاتصالات",
    bio: "شركة رائدة في مجال التقنية والابتكار، ندعم المواهب الشابة من خلال رعاية الفاليات التقنية والهاكاثونات. نؤمن بأن الاستثمار في الشباب هو أفضل استثمار للمستقبل.",
    joinDate: "مارس 2023",
  });

  const stats = [
    { label: "إجمالي الرعايات", value: "12", icon: Handshake, color: "#a41b42", bg: "#fef2f2" },
    { label: "إجمالي الاستثمار", value: "485K", icon: CreditCard, color: "#10b981", bg: "#f0fdf4" },
    { label: "هاكاثونات مدعومة", value: "8", icon: Target, color: "#6366f1", bg: "#eef2ff" },
    { label: "عقود موقعة", value: "10", icon: FileText, color: "#f59e0b", bg: "#fffbeb" },
  ];

  const sponsorshipHistory = [
    { name: "هاكاثون الذكاء الاصطناعي العالمي", package: "ماسي", date: "أكتوبر 2024", status: "مكتمل", statusColor: "#10b981", statusBg: "#f0fdf4" },
    { name: "تحدي الأمن السيبراني الإقليمي", package: "ذهبي", date: "ديسمبر 2024", status: "نشط", statusColor: "#6366f1", statusBg: "#eef2ff" },
    { name: "هاكاثون الجامعات الناشئة", package: "فضي", date: "نوفمبر 2024", status: "نشط", statusColor: "#6366f1", statusBg: "#eef2ff" },
    { name: "هاكاثون التقنية المالية 2024", package: "شريك إستراتيجي", date: "سبتمبر 2024", status: "مكتمل", statusColor: "#10b981", statusBg: "#f0fdf4" },
    { name: "هاكاثون NEOM 2025", package: "ذهبي", date: "مارس 2025", status: "قيد التقديم", statusColor: "#f59e0b", statusBg: "#fffbeb" },
  ];

  const achievements = [
    { title: "راعي ماسي", desc: "رعاية بباقة ماسية لأول مرة", icon: "💎", earned: true },
    { title: "داعم متميز", desc: "رعاية أكثر من 5 هاكاثونات", icon: "🏆", earned: true },
    { title: "شريك موثوق", desc: "جميع العقود موقعة في الوقت المحدد", icon: "🤝", earned: true },
    { title: "مستثمر رائد", desc: "استثمار أكثر من 500K ر.س", icon: "🚀", earned: false },
  ];

  const handleSave = () => setIsEditing(false);
  const handleCancel = () => setIsEditing(false);

  const tabs = [
    { id: "info" as const, label: "معلومات الشركة" },
    { id: "stats" as const, label: "الإحصائيات والإنجازات" },
    { id: "security" as const, label: "الأمان والخصوصية" },
  ];

  return (
    <>
      {/* Profile Banner */}
      <div className="h-28" style={{ background: "linear-gradient(135deg, #a41b42 0%, #8b1538 100%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 -mt-8 mb-6 shadow-sm">
          <div className="flex items-end gap-5">
            {/* Company Avatar */}
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white -mt-14 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#a41b42 0%,#8b1538 100%)",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                }}
              >
                ش
              </div>
              <button className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-white shadow-lg flex items-center justify-center text-[#a41b42] opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3.5 h-3.5" />
              </button>
              <span
                className="absolute bottom-1 left-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: "#10b981" }}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.6rem" }}>
                    {profileData.companyName}
                  </h1>
                  <p className="text-gray-600 text-sm">{profileData.contactName} — {profileData.position}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profileData.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      انضم {profileData.joinDate}
                    </span>
                  </div>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm hover:border-[#a41b42] hover:text-[#a41b42] hover:bg-[#fef2f2] transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a41b42] text-white text-sm hover:bg-[#8b1538] transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      <Save className="w-4 h-4" />
                      حفظ
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      <X className="w-4 h-4" />
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3">
                {stats.map((s, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                      style={{ background: s.bg }}
                    >
                      <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                    </div>
                    <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.3rem" }}>{s.value}</p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.7rem" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
                activeTab === tab.id
                  ? "border-[#a41b42] text-[#a41b42]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontWeight: 600 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === "info" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-gray-900 mb-6" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                بيانات الشركة
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: "اسم الشركة", key: "companyName", icon: Building2, type: "text" },
                  { label: "اسم المسؤول", key: "contactName", icon: User, type: "text" },
                  { label: "البريد الإلكتروني", key: "email", icon: Mail, type: "email" },
                  { label: "رقم الهاتف", key: "phone", icon: Phone, type: "tel" },
                  { label: "المسمى الوظيفي", key: "position", icon: Award, type: "text" },
                  { label: "السجل التجاري", key: "commercialRegister", icon: Shield, type: "text" },
                  { label: "الموقع", key: "location", icon: MapPin, type: "text" },
                  { label: "الموقع الإلكتروني", key: "website", icon: Globe, type: "url" },
                  { label: "القطاع", key: "industry", icon: Target, type: "text" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      <field.icon className="w-4 h-4 text-gray-400" />
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input
                        type={field.type}
                        value={(profileData as any)[field.key]}
                        onChange={(e) =>
                          setProfileData({ ...profileData, [field.key]: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#a41b42] focus:ring-2 focus:ring-[#a41b42]/10 transition-all"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl text-sm">
                        {(profileData as any)[field.key]}
                      </p>
                    )}
                  </div>
                ))}

                {/* Bio - Full Width */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4 text-gray-400" />
                    نبذة عن الشركة
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#a41b42] focus:ring-2 focus:ring-[#a41b42]/10 transition-all resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl text-sm leading-relaxed">
                      {profileData.bio}
                    </p>
                  )}
                </div>

                {/* Join Date */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Calendar className="w-4 h-4 text-gray-400" />
                    تاريخ الانضمام
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl text-sm">{profileData.joinDate}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: s.bg }}
                    >
                      <s.icon className="w-6 h-6" style={{ color: s.color }} />
                    </div>
                    <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.5rem" }}>{s.value}</p>
                    <p className="text-gray-400 mt-1 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                <h2 className="text-gray-900 mb-5" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  الإنجازات والأوسمة
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {achievements.map((ach, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-4 text-center transition-all ${
                        ach.earned
                          ? "border-[#a41b42]/20 bg-[#fffbfb] hover:shadow-sm"
                          : "border-gray-100 bg-gray-50 opacity-50"
                      }`}
                    >
                      <span style={{ fontSize: "1.8rem" }}>{ach.icon}</span>
                      <p className="text-gray-900 text-sm mt-2" style={{ fontWeight: 700 }}>{ach.title}</p>
                      <p className="text-gray-400 mt-1" style={{ fontSize: "0.68rem" }}>{ach.desc}</p>
                      {!ach.earned && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500" style={{ fontWeight: 500 }}>
                          غير مكتمل
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sponsorship History */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    سجل الرعايات
                  </h2>
                  <button
                    onClick={() => navigate("/sponsor/sponsorships")}
                    className="text-[#a41b42] text-xs hover:underline"
                    style={{ fontWeight: 500 }}
                  >
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-2.5">
                  {sponsorshipHistory.map((sp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#fef2f2] flex items-center justify-center">
                          <Handshake className="w-4 h-4 text-[#a41b42]" />
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>{sp.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{sp.package} — {sp.date}</p>
                        </div>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: sp.statusBg, color: sp.statusColor, fontWeight: 600 }}
                      >
                        {sp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                <h2 className="text-gray-900 mb-5 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  <Key className="w-5 h-5 text-gray-400" />
                  تغيير كلمة المرور
                </h2>
                <div className="space-y-4 max-w-md">
                  {[
                    { label: "كلمة المرور الحالية" },
                    { label: "كلمة المرور الجديدة" },
                    { label: "تأكيد كلمة المرور الجديدة" },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        {f.label}
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#a41b42] focus:ring-2 focus:ring-[#a41b42]/10 transition-all"
                      />
                    </div>
                  ))}
                  <button
                    className="px-6 py-2.5 rounded-xl bg-[#a41b42] text-white text-sm hover:bg-[#8b1538] transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    تحديث كلمة المرور
                  </button>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                <h2 className="text-gray-900 mb-5 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  <Shield className="w-5 h-5 text-gray-400" />
                  إعدادات الأمان
                </h2>
                <div className="space-y-3">
                  {[
                    { title: "المصادقة الثنائية", desc: "حماية إضافية لحسابك عند تسجيل الدخول" },
                    { title: "إشعارات تسجيل الدخول", desc: "تنبيه عند تسجيل الدخول من جهاز جديد" },
                    { title: "إشعارات العقود", desc: "تنبيه فوري عند أي تحديث في العقود" },
                  ].map((setting, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all"
                    >
                      <div>
                        <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{setting.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{setting.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i === 2} />
                        <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a41b42]" style={{ width: 40, height: 22 }} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border border-[#fce7eb] p-6 sm:p-8">
                <h2 className="text-[#8b1538] mb-3 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  <LogOut className="w-5 h-5" />
                  منطقة الخطر
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  بمجرد حذف حسابك، سيتم حذف جميع بياناتك وعقودك بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                </p>
                <button
                  className="px-5 py-2.5 rounded-xl border-2 border-[#fad1d8] text-[#a41b42] text-sm hover:bg-[#fef2f4] hover:border-[#f8bac7] transition-all"
                  style={{ fontWeight: 600 }}
                >
                  حذف الحساب نهائيًا
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}