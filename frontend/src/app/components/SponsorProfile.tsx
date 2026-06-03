import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
  Award,
  Target,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { apiGet, apiPut, ApiError } from "../../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type SponsorMeResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  joinedAt: string;
  brandName: string | null;
  crNumber: string | null;
  position: string | null;
  industry: string | null;
  website: string | null;
  banner: string | null;
};

interface ProfileForm {
  fullName: string;
  email: string; // read-only
  brandName: string;
  crNumber: string;
  bio: string;
  phone: string;
  location: string;
  position: string;
  industry: string;
  website: string;
}

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  email: "",
  brandName: "",
  crNumber: "",
  bio: "",
  phone: "",
  location: "",
  position: "",
  industry: "",
  website: "",
};

function toForm(data: SponsorMeResponse): ProfileForm {
  return {
    fullName: data.fullName,
    email: data.email,
    brandName: data.brandName ?? "",
    crNumber: data.crNumber ?? "",
    bio: data.bio ?? "",
    phone: data.phone ?? "",
    location: data.location ?? "",
    position: data.position ?? "",
    industry: data.industry ?? "",
    website: data.website ?? "",
  };
}

function formatJoinedDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
}

async function uploadProfileImage(
  endpoint: "avatar" | "banner",
  file: File
): Promise<{ avatar?: string; banner?: string }> {
  const token = localStorage.getItem("mumkin_token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/sponsors/me/${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error || `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }
  return data;
}

export function SponsorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [snapshot, setSnapshot] = useState<ProfileForm>(EMPTY_FORM);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<SponsorMeResponse>("/sponsors/me")
      .then((data) => {
        if (cancelled) return;
        const f = toForm(data);
        setForm(f);
        setSnapshot(f);
        setAvatar(data.avatar);
        setBanner(data.banner);
        setJoinedAt(data.joinedAt);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "تعذّر تحميل الملف");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancel = () => {
    setForm(snapshot);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // All fields are required (except the bio and the read-only email)
    const requiredFields: { key: keyof ProfileForm; label: string }[] = [
      { key: "brandName", label: "اسم الشركة" },
      { key: "fullName", label: "اسم المسؤول" },
      { key: "phone", label: "رقم الهاتف" },
      { key: "position", label: "المسمى الوظيفي" },
      { key: "crNumber", label: "السجل التجاري" },
      { key: "location", label: "الموقع" },
      { key: "website", label: "الموقع الإلكتروني" },
      { key: "industry", label: "القطاع" },
    ];
    for (const f of requiredFields) {
      if (!form[f.key].trim()) {
        toast.error(`الرجاء تعبئة حقل "${f.label}"`);
        return;
      }
    }
    if (form.fullName.trim().length < 2) {
      toast.error("الاسم الكامل يجب أن يكون حرفين على الأقل");
      return;
    }
    const cr = form.crNumber.trim();
    if (!/^\d{10}$/.test(cr)) {
      toast.error("السجل التجاري يجب أن يكون 10 أرقام بالضبط");
      return;
    }
    const phone = form.phone.trim();
    if (!/^[\d+\-\s()]{5,20}$/.test(phone)) {
      toast.error("رقم الهاتف غير صالح");
      return;
    }

    setSaving(true);
    try {
      const updated = await apiPut<SponsorMeResponse>("/sponsors/me", {
        fullName: form.fullName.trim(),
        bio: form.bio.trim() || null,
        brandName: form.brandName.trim() || null,
        crNumber: cr || null,
        phone: phone || null,
        location: form.location.trim() || null,
        position: form.position.trim() || null,
        industry: form.industry.trim() || null,
        website: form.website.trim() || null,
      });
      const f = toForm(updated);
      setForm(f);
      setSnapshot(f);
      setIsEditing(false);
      toast.success("تم حفظ التعديلات بنجاح");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر الحفظ، حاول لاحقاً";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadProfileImage("avatar", file);
      const newAvatar = res.avatar ?? null;
      setAvatar(newAvatar);
      // Notify the navbar so it updates the image immediately
      window.dispatchEvent(
        new CustomEvent("mumkin:avatar-updated", { detail: { avatar: newAvatar } })
      );
      toast.success("تم تحديث الصورة الشخصية");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر رفع الصورة";
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await uploadProfileImage("banner", file);
      setBanner(res.banner ?? null);
      toast.success("تم تحديث صورة الغلاف");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "تعذّر رفع الصورة";
      toast.error(message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const avatarLetter = (form.fullName.trim()[0] || form.brandName.trim()[0] || "?").toUpperCase();
  const avatarUrl = avatar ? `${API_URL}/uploads/avatars/${avatar}` : null;
  const bannerUrl = banner ? `${API_URL}/uploads/banners/${banner}` : null;

  const FIELDS: {
    label: string;
    key: keyof ProfileForm;
    icon: typeof User;
    type?: string;
    editable?: boolean;
    placeholder?: string;
    required?: boolean;
  }[] = [
    { label: "اسم الشركة / العلامة", key: "brandName", icon: Building2, placeholder: "مثال: TechCo", required: true },
    { label: "اسم المسؤول", key: "fullName", icon: User, placeholder: "الاسم الكامل", required: true },
    { label: "البريد الإلكتروني", key: "email", icon: Mail, editable: false },
    { label: "رقم الهاتف", key: "phone", icon: Phone, type: "tel", placeholder: "+9665XXXXXXXX", required: true },
    { label: "المسمى الوظيفي", key: "position", icon: Award, placeholder: "مدير الشراكات", required: true },
    { label: "السجل التجاري", key: "crNumber", icon: Shield, placeholder: "10 أرقام", required: true },
    { label: "الموقع", key: "location", icon: MapPin, placeholder: "الرياض، السعودية", required: true },
    { label: "الموقع الإلكتروني", key: "website", icon: Globe, type: "url", placeholder: "https://...", required: true },
    { label: "القطاع", key: "industry", icon: Target, placeholder: "تقنية، صحة، تعليم...", required: true },
  ];

  return (
    <>
      {/* Banner — hero مع overlay */}
      <div
        className="relative h-56 group overflow-hidden"
        style={{
          background: bannerUrl
            ? `url(${bannerUrl}) center / cover no-repeat`
            : "linear-gradient(135deg, #e35654 0%, #cc4a48 50%, #a83b3a 100%)",
        }}
      >
        {/* Pattern overlay لو ما فيه صورة */}
        {!bannerUrl && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.3) 0%, transparent 40%)",
            }}
          />
        )}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleBannerChange}
        />
        {/* زر تغيير الغلاف يظهر فقط في وضع التعديل */}
        {isEditing && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="absolute bottom-5 left-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-sm text-gray-800 text-xs hover:bg-white shadow-lg transition-all disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            {uploadingBanner ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 text-[#e35654]" />
            )}
            {uploadingBanner ? "جاري الرفع..." : "تغيير صورة الغلاف"}
          </button>
        )}
      </div>

      {loading && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          جاري تحميل الملف الشخصي...
        </div>
      )}
      {loadError && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
            تعذّر تحميل الملف: {loadError}
          </div>
        </div>
      )}

      {!loading && !loadError && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Profile Header Card — Avatar في الأعلى يمين + المعلومات تحته */}
          <div className="bg-white rounded-2xl border border-gray-100 -mt-16 mb-6 shadow-sm relative">
            {/* Avatar absolute, متداخل مع البنر */}
            <div className="absolute -top-14 right-6 sm:right-8 z-10">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl flex items-center justify-center text-white overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg,#e35654 0%,#cc4a48 100%)",
                    fontWeight: 800,
                    fontSize: "2rem",
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    avatarLetter
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {/* زر الكاميرا يظهر فقط في وضع التعديل */}
                {isEditing && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -left-1 w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center text-[#e35654] border-2 border-gray-50 hover:bg-[#fef2f2] hover:border-[#e35654] transition-all disabled:opacity-60"
                    title="تغيير الصورة الشخصية"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Edit / Save / Cancel — أعلى يسار */}
            <div className="absolute top-4 left-4 sm:left-6 z-10 flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all shadow-sm shadow-[#e35654]/20"
                  style={{ fontWeight: 600 }}
                >
                  <Edit3 className="w-4 h-4" />
                  تعديل البيانات
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#e35654]/20"
                    style={{ fontWeight: 600 }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <X className="w-4 h-4" />
                    إلغاء
                  </button>
                </>
              )}
            </div>

            {/* Info — تحت الـ Avatar بمسافة آمنة */}
            <div className="px-6 sm:px-8 pt-20 pb-6">
              <h1
                className="text-gray-900 mb-1.5 break-words"
                style={{ fontWeight: 800, fontSize: "1.6rem", lineHeight: 1.2 }}
              >
                {form.brandName || "—"}
              </h1>
              <p className="text-gray-600 text-sm mb-3">
                {form.fullName || "—"}
                {form.position && (
                  <>
                    <span className="text-gray-300 mx-2">•</span>
                    <span className="text-gray-500">{form.position}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                {form.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {form.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  انضم {formatJoinedDate(joinedAt)}
                </span>
                {form.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {form.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <h2 className="text-gray-900 mb-6" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              معلومات الحساب
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FIELDS.map((field) => {
                const editable = field.editable !== false;
                const Icon = field.icon;
                const required = field.required === true;
                const isEmpty = !form[field.key].trim();
                const showMissing = isEditing && editable && required && isEmpty;
                return (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      <Icon className="w-4 h-4 text-gray-400" />
                      {field.label}
                      {required && <span className="text-[#e35654] mr-0.5">*</span>}
                      {!editable && isEditing && (
                        <span className="text-[10px] text-gray-400 mr-1">(غير قابل للتعديل)</span>
                      )}
                    </label>
                    {isEditing && editable ? (
                      <input
                        type={field.type ?? "text"}
                        value={form[field.key]}
                        placeholder={field.placeholder}
                        required={required}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                          showMissing
                            ? "border-[#e35654] focus:border-[#e35654] focus:ring-[#e35654]/20 bg-[#fef2f2]/40"
                            : "border-gray-200 focus:border-[#e35654] focus:ring-[#e35654]/10"
                        }`}
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl text-sm break-words">
                        {form[field.key] || "—"}
                      </p>
                    )}
                    {showMissing && (
                      <p className="text-[#e35654] text-xs mt-1" style={{ fontWeight: 500 }}>
                        هذا الحقل مطلوب
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Bio */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  <User className="w-4 h-4 text-gray-400" />
                  نبذة عن الشركة
                </label>
                {isEditing ? (
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    placeholder="اكتب نبذة قصيرة عن الشركة..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e35654] focus:ring-2 focus:ring-[#e35654]/10 transition-all resize-none"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                    {form.bio || "—"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
