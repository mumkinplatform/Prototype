import { Link } from 'react-router';
import { 
  Bell, 
  Search,
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
  Award,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { useState } from 'react';

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'security'>('info');
  
  const [profileData, setProfileData] = useState({
    name: 'محمد أحمد العتيبي',
    email: 'mohammed.alotaibi@example.com',
    phone: '+966 50 123 4567',
    position: 'مدير التقنية',
    company: 'شركة الابتكار التقني',
    location: 'الرياض، المملكة العربية السعودية',
    website: 'www.tech-innovation.com',
    bio: 'منظم هاكاثونات محترف مع خبرة 5 سنوات في تنظيم الفعاليات التقنية الكبرى. شغوف بدعم المواهب الشابة والابتكار التقني.',
    commercialRegister: '1234567890',
    joinDate: 'يناير 2022'
  });

  const stats = [
    { label: 'هاكاثونات منظمة', value: '24', icon: Target, color: 'blue' },
    { label: 'إجمالي المشاركين', value: '8,420', icon: Users, color: 'green' },
    { label: 'معدل النجاح', value: '96%', icon: TrendingUp, color: 'purple' },
    { label: 'جوائز موزعة', value: '180', icon: Award, color: 'orange' }
  ];

  const handleSave = () => {
    setIsEditing(false);
    // Save logic here
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset data logic here
  };

  const unreadCount = 3;

  return (
    <>
      {/* Profile Banner */}
      <div className="h-28" style={{ background: "linear-gradient(135deg, #e35654 0%, #cc4a48 100%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 -mt-8 mb-6 shadow-sm">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white -mt-14 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#e35654 0%,#cc4a48 100%)",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                }}
              >
                م
              </div>
              <button className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-white shadow-lg flex items-center justify-center text-[#e35654] opacity-0 group-hover:opacity-100 transition-opacity">
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
                    {profileData.name}
                  </h1>
                  <p className="text-gray-600 text-sm">{profileData.position}</p>
                  <p className="text-gray-500 text-sm">{profileData.company}</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm hover:border-[#e35654] hover:text-[#e35654] hover:bg-[#fef2f2] transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all"
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
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                      stat.color === 'blue' ? 'bg-blue-50' :
                      stat.color === 'green' ? 'bg-green-50' :
                      stat.color === 'purple' ? 'bg-purple-50' :
                      'bg-orange-50'
                    }`}>
                      <stat.icon className={`w-4.5 h-4.5 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'green' ? 'text-green-600' :
                        stat.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.3rem" }}>{stat.value}</p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.7rem" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
              activeTab === 'info'
                ? 'border-[#e35654] text-[#e35654]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontWeight: 600 }}
          >
            المعلومات الشخصية
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
              activeTab === 'stats'
                ? 'border-[#e35654] text-[#e35654]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontWeight: 600 }}
          >
            الإحصائيات
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3.5 px-1 border-b-2 text-sm transition-all ${
              activeTab === 'security'
                ? 'border-[#e35654] text-[#e35654]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontWeight: 600 }}
          >
            الأمان والخصوصية
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>
                معلومات الحساب
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Phone className="w-4 h-4" />
                    رقم الجوال
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.phone}</p>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Award className="w-4 h-4" />
                    المسمى الوظيفي
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.position}
                      onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.position}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Building2 className="w-4 h-4" />
                    اسم الشركة
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.company}</p>
                  )}
                </div>

                {/* Commercial Register */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Shield className="w-4 h-4" />
                    السجل التجاري
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.commercialRegister}
                      onChange={(e) => setProfileData({ ...profileData, commercialRegister: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.commercialRegister}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <MapPin className="w-4 h-4" />
                    الموقع
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.location}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Globe className="w-4 h-4" />
                    الموقع الإلكتروني
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.website}</p>
                  )}
                </div>

                {/* Bio - Full Width */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <User className="w-4 h-4" />
                    نبذة تعريفية
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl leading-relaxed">{profileData.bio}</p>
                  )}
                </div>

                {/* Join Date - Read Only */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                    <Calendar className="w-4 h-4" />
                    تاريخ الانضمام
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">{profileData.joinDate}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      stat.color === 'blue' ? 'bg-blue-100' :
                      stat.color === 'green' ? 'bg-green-100' :
                      stat.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <stat.icon className={`w-6 h-6 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'green' ? 'text-green-600' :
                        stat.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <p className="text-3xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>
                  النشاط الأخير
                </h2>
                <div className="space-y-4">
                  {[
                    { title: 'إطلاق هاكاثون الابتكار', time: 'منذ يومين', color: 'green' },
                    { title: 'قبول 45 مشارك جديد', time: 'منذ 3 أيام', color: 'blue' },
                    { title: 'توقيع اتفاقية رعاية', time: 'منذ أسبوع', color: 'purple' },
                    { title: 'اختتام هاكاثون التقنية', time: 'منذ أسبوعين', color: 'orange' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.color === 'green' ? 'bg-green-500' :
                        activity.color === 'blue' ? 'bg-blue-500' :
                        activity.color === 'purple' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`} />
                      <p className="flex-1 text-gray-900" style={{ fontWeight: 600 }}>{activity.title}</p>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl text-gray-900 mb-6 flex items-center gap-2" style={{ fontWeight: 700 }}>
                  <Key className="w-5 h-5" />
                  تغيير كلمة المرور
                </h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      كلمة المرور الحالية
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e35654] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button className="px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all" style={{ fontWeight: 600 }}>
                    تحديث كلمة المرور
                  </button>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl text-gray-900 mb-6 flex items-center gap-2" style={{ fontWeight: 700 }}>
                  <Shield className="w-5 h-5" />
                  إعدادات الأمان
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div>
                      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>المصادقة الثنائية</p>
                      <p className="text-sm text-gray-500">حماية إضافية لحسابك</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fce7eb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e35654]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div>
                      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>تنبيهات تسجيل الدخول</p>
                      <p className="text-sm text-gray-500">استلم إشعار عند تسجيل دخول جديد</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fce7eb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e35654]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div>
                      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>إشعارات البريد الإلكتروني</p>
                      <p className="text-sm text-gray-500">استقبال تحديثات عبر البريد</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fce7eb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e35654]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}