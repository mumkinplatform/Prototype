import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, Users, Mail, Search, ChevronDown, Copy, Ban, Edit2, AlertTriangle, UserPlus, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '../../lib/api';
import {
  PERMISSIONS_BY_SECTION,
  SECTION_LABELS,
  SECTIONS,
  type Section,
} from '../../lib/permissions';

// Map UI department label ↔ Section enum
const SECTION_BADGE_COLORS: Record<Section, string> = {
  team: 'bg-blue-100 text-blue-700',
  registrations: 'bg-orange-100 text-orange-700',
  projects: 'bg-indigo-100 text-indigo-700',
  sponsors: 'bg-emerald-100 text-emerald-700',
};

interface CoManagerRaw {
  HCM_ID: number;
  HCM_FullName: string;
  HCM_Email: string;
  HCM_Role: 'manager' | 'staff';
  HCM_Section: Section | null;
  HCM_ParentID: number | null;
  HCM_Permissions: unknown;
  HCM_InviteStatus: 'pending' | 'accepted' | 'declined';
  HCM_InviteExpiresAt: string | null;
  HCM_AcceptedAt: string | null;
  M_ID: number | null;
}

// UI shape — mirrors the original mock so we don't redo the markup.
interface TeamMember {
  id: number;
  name: string;
  email: string;
  avatar: string;
  department: string;        // Arabic section label
  departmentColor: string;   // tailwind classes
  accessLevel: string;       // "مدير قسم" or "موظف"
  status: 'نشط' | 'مدعو';
  permissions: number;       // 0..100 — % of section permissions selected
  role: string;
  // backing data we need for edit/save
  section: Section | null;
  parentId: number | null;
  permissionKeys: string[];
}

function parsePermissions(raw: unknown): string[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    /* ignore */
  }
  return [];
}

function buildAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function mapCoManager(c: CoManagerRaw): TeamMember {
  const perms = parsePermissions(c.HCM_Permissions);
  const total = c.HCM_Section ? PERMISSIONS_BY_SECTION[c.HCM_Section].length : 1;
  const pct = c.HCM_Section ? Math.round((perms.length / total) * 100) : 0;
  const sectionLabel = c.HCM_Section ? SECTION_LABELS[c.HCM_Section] : '—';
  const sectionColor = c.HCM_Section ? SECTION_BADGE_COLORS[c.HCM_Section] : 'bg-gray-100 text-gray-600';
  return {
    id: c.HCM_ID,
    name: c.HCM_FullName,
    email: c.HCM_Email,
    avatar: buildAvatar(c.HCM_FullName),
    department: sectionLabel,
    departmentColor: sectionColor,
    accessLevel: c.HCM_Role === 'manager' ? 'مدير قسم' : 'موظف',
    status: c.HCM_InviteStatus === 'accepted' ? 'نشط' : 'مدعو',
    permissions: c.HCM_InviteStatus === 'accepted' ? pct : 0,
    role: c.HCM_Role,
    section: c.HCM_Section,
    parentId: c.HCM_ParentID,
    permissionKeys: perms,
  };
}


export function HackathonTeams() {
  const { id } = useParams();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<Section | 'all'>('all');
  const [filterPermissions, setFilterPermissions] = useState<'all' | 'manager' | 'staff'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState<{
    name: string;
    email: string;
    section: Section;
    role: 'manager' | 'staff';
    parentId: number | null;
    permissions: string[];
  }>({
    name: '',
    email: '',
    section: 'registrations',
    role: 'staff',
    parentId: null,
    permissions: [],
  });

  // Sidebar editable form for the selected member.
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: 'manager' | 'staff';
    section: Section | '';
    permissions: string[];
  }>({ name: '', email: '', role: 'staff', section: '', permissions: [] });

  // ─── Load co-managers from API ───
  const refresh = async () => {
    if (!id) return;
    try {
      const data = await apiGet<{ coManagers: CoManagerRaw[] }>(`/hackathons/${id}`);
      const mapped = (data.coManagers ?? []).map(mapCoManager);
      setTeamMembers(mapped);
    } catch (err) {
      console.error('failed to load co-managers', err);
      toast.error('تعذّر تحميل الفريق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync sidebar form when selecting a member
  useEffect(() => {
    if (selectedMember) {
      setEditForm({
        name: selectedMember.name,
        email: selectedMember.email,
        role: selectedMember.role as 'manager' | 'staff',
        section: selectedMember.section ?? '',
        permissions: [...selectedMember.permissionKeys],
      });
    } else {
      setEditForm({ name: '', email: '', role: 'staff', section: '', permissions: [] });
    }
  }, [selectedMember]);

  // Filter by tab
  const tabFilteredMembers = teamMembers.filter(member => {
    if (activeTab === 'active') return member.status === 'نشط';
    if (activeTab === 'pending') return member.status === 'مدعو';
    return true;
  });

  // Filter by search and filters
  const filteredMembers = tabFilteredMembers.filter(member => {
    const matchSearch = member.name.includes(searchQuery) || member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDepartment = filterDepartment === 'all' || member.section === filterDepartment;
    const matchPermissions = filterPermissions === 'all' || member.role === filterPermissions;
    return matchSearch && matchDepartment && matchPermissions;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Stats
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === 'نشط').length;
  const pendingInvites = teamMembers.filter(m => m.status === 'مدعو').length;

  const reportApiError = (err: unknown) => {
    if (err instanceof ApiError) {
      const body = err.body as { conflicts?: string[]; errors?: string[]; message?: string } | undefined;
      if (err.status === 409 && body?.conflicts) {
        toast.error('تعارض في الأدوار', { description: body.conflicts.join(' — '), duration: 8000 });
      } else if (err.status === 400 && body?.errors) {
        toast.error('بيانات غير صالحة', { description: body.errors.join(' — ') });
      } else if (body?.message) {
        toast.error(body.message);
      } else {
        toast.error(`تعذّر الإجراء (HTTP ${err.status})`);
      }
    } else {
      toast.error('تعذّر الاتصال بالخادم');
    }
  };

  const handleAddMember = async () => {
    if (!id) return;
    if (!newMember.name.trim() || !newMember.email.trim()) {
      toast.error('خطأ في البيانات', { description: 'الرجاء إدخال الاسم والبريد الإلكتروني', duration: 3000 });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      toast.error('خطأ في البريد الإلكتروني', { description: 'الرجاء إدخال بريد إلكتروني صحيح', duration: 3000 });
      return;
    }
    if (newMember.permissions.length === 0) {
      toast.error('اختر صلاحية واحدة على الأقل');
      return;
    }
    try {
      await apiPost(`/hackathons/${id}/co-managers`, {
        fullName: newMember.name.trim(),
        email: newMember.email.trim(),
        role: newMember.role,
        section: newMember.section,
        // parentId is auto-resolved server-side from the section's manager.
        permissions: newMember.permissions,
      });
      setShowAddMemberModal(false);
      setNewMember({
        name: '',
        email: '',
        section: 'registrations',
        role: 'staff',
        parentId: null,
        permissions: [],
      });
      toast.success('تم إضافة العضو بنجاح', {
        description: `أُرسلت دعوة إلى ${newMember.email} ورابط الانضمام صالح لمدة 7 أيام`,
        duration: 4000,
      });
      await refresh();
    } catch (err) {
      reportApiError(err);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedMember || !id) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error('الاسم والإيميل مطلوبان');
      return;
    }
    if (!editForm.section) {
      toast.error('اختر القسم');
      return;
    }
    if (editForm.permissions.length === 0) {
      toast.error('اختر صلاحية واحدة على الأقل');
      return;
    }
    try {
      await apiPut(`/hackathons/${id}/co-managers/${selectedMember.id}`, {
        fullName: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        section: editForm.section,
        permissions: editForm.permissions,
      });
      toast.success('تم حفظ التغييرات بنجاح', {
        description: `تم تحديث بيانات ${editForm.name}`,
        duration: 4000,
      });
      setSelectedMember(null);
      await refresh();
    } catch (err) {
      reportApiError(err);
    }
  };

  const handleCopyEmail = (email: string, name: string) => {
    navigator.clipboard.writeText(email);
    toast.success('تم النسخ', { description: `تم نسخ بريد ${name} الإلكتروني`, duration: 2000 });
  };

  const handleDisableMember = async (member: TeamMember) => {
    if (!id) return;
    const confirmed = window.confirm(`هل تريد حذف ${member.name} من فريق التنظيم؟`);
    if (!confirmed) return;
    try {
      await apiDelete(`/hackathons/${id}/co-managers/${member.id}`);
      toast.success('تم الحذف', { description: `تم حذف ${member.name}`, duration: 3000 });
      if (selectedMember?.id === member.id) setSelectedMember(null);
      await refresh();
    } catch (err) {
      reportApiError(err);
    }
  };

  const handleResendInvite = async (member: TeamMember) => {
    if (!id) return;
    try {
      await apiPost(`/hackathons/${id}/co-managers/${member.id}/resend-invite`);
      toast.success('تم إعادة إرسال الدعوة', {
        description: `أُرسل إيميل تذكيري إلى ${member.email}`,
        duration: 4000,
      });
    } catch (err) {
      reportApiError(err);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to={`/admin/hackathon/${id}`}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  إدارة فريق التنظيم والصلاحيات
                </h1>
                <p className="text-sm text-gray-500">
                  تحكم في الأدوار المنظمين، تعيين الأقسام، وتخصيص مستويات الوصول الدقيقة لكل عضو في الفريق المنظم
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all" 
              style={{ fontWeight: 600 }}
            >
              <UserPlus className="w-4 h-4" />
              إضافة عضو جديد
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`bg-white rounded-2xl border p-6 flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'all' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">إجمالي الأعضاء</p>
                  <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{totalMembers}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  activeTab === 'all' ? 'bg-blue-600' : 'bg-blue-50'
                }`}>
                  <Users className={`w-6 h-6 ${activeTab === 'all' ? 'text-white' : 'text-blue-600'}`} />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('active')}
                className={`bg-white rounded-2xl border p-6 flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'active' ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">المسؤولون النشطون</p>
                  <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{activeMembers}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  activeTab === 'active' ? 'bg-green-600' : 'bg-green-50'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${activeTab === 'active' ? 'bg-white' : 'bg-green-500'}`}></div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('pending')}
                className={`bg-white rounded-2xl border p-6 flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'pending' ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">دعوات معلقة</p>
                  <p className="text-3xl text-gray-900" style={{ fontWeight: 700 }}>{pendingInvites}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  activeTab === 'pending' ? 'bg-orange-600' : 'bg-orange-50'
                }`}>
                  <Mail className={`w-6 h-6 ${activeTab === 'pending' ? 'text-white' : 'text-orange-600'}`} />
                </div>
              </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث بالاسم أو البريد الإلكتروني..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="relative">
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value as Section | 'all')}
                    className="appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="all">كل الأقسام</option>
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>{SECTION_LABELS[s]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterPermissions}
                    onChange={(e) => setFilterPermissions(e.target.value as 'all' | 'manager' | 'staff')}
                    className="appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="all">كل الأدوار</option>
                    <option value="manager">مدير قسم</option>
                    <option value="staff">موظف</option>
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className={`px-4 py-2.5 rounded-xl text-white text-sm ${
                  activeTab === 'all' ? 'bg-blue-600' :
                  activeTab === 'active' ? 'bg-green-600' :
                  'bg-orange-600'
                }`} style={{ fontWeight: 600 }}>
                  {activeTab === 'all' ? 'الكل' :
                   activeTab === 'active' ? 'نشط' :
                   'معلق'}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الصورة</th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>العضو</th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>القسم</th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>مستوى الوصول</th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الحالة</th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الصلاحيات</th>
                    <th className="text-right px-6 py-4 text-sm text-gray-500" style={{ fontWeight: 600 }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMembers.map((member) => (
                    <tr 
                      key={member.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="px-6 py-4">
                        <img 
                          src={member.avatar} 
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs ${member.departmentColor}`} style={{ fontWeight: 600 }}>
                          {member.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{member.accessLevel}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${member.status === 'نشط' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          <span className="text-sm text-gray-700">{member.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${member.permissions}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500" style={{ fontWeight: 600 }}>{member.permissions}%</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {member.status === 'مدعو' ? 'معلق' : member.permissions > 70 ? 'متقدمة' : member.permissions > 40 ? 'محدودة' : 'أساسية'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyEmail(member.email, member.name);
                            }}
                            title="نسخ الإيميل"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {member.status === 'مدعو' && (
                            <button
                              className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResendInvite(member);
                              }}
                              title="إعادة إرسال الدعوة"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisableMember(member);
                            }}
                            title="حذف"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                            }}
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentMembers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">لا توجد نتائج</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`} 
                  style={{ fontWeight: 600 }}
                >
                  السابق
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`} 
                  style={{ fontWeight: 600 }}
                >
                  التالي
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6">
              <h3 className="text-lg text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                {selectedMember ? 'تحرير الصلاحيات' : 'اختر عضواً'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {selectedMember ? selectedMember.name : 'اختر عضواً من الجدول لتعديل بياناته'}
              </p>

              {selectedMember && (
                <>
                  {/* Selected Member Info */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={selectedMember.avatar} 
                        alt={selectedMember.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{selectedMember.name}</p>
                        <p className="text-xs text-gray-500">{selectedMember.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      الحالة: <span className={selectedMember.status === 'نشط' ? 'text-green-600' : 'text-orange-600'} style={{ fontWeight: 600 }}>{selectedMember.status}</span>
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>الاسم الكامل</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                        dir="ltr"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>الدور</label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as 'manager' | 'staff' }))}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="manager">مدير قسم</option>
                          <option value="staff">موظف</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>القسم</label>
                        <select
                          value={editForm.section}
                          onChange={(e) => {
                            const newSection = e.target.value as Section;
                            setEditForm((p) => ({
                              ...p,
                              section: newSection,
                              // Clear permissions on section change — admin picks them manually.
                              permissions: [],
                            }));
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                        >
                          {SECTIONS.map((s) => (
                            <option key={s} value={s}>{SECTION_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Permissions checkboxes */}
                  {editForm.section && (
                    <div className="mb-6">
                      <label className="block text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>
                        الصلاحيات
                        <span className="text-xs text-gray-400 mr-2" style={{ fontWeight: 400 }}>
                          ({editForm.permissions.length}/{PERMISSIONS_BY_SECTION[editForm.section].length})
                        </span>
                      </label>
                      <div className="space-y-2">
                        {PERMISSIONS_BY_SECTION[editForm.section].map((perm) => {
                          const checked = editForm.permissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                checked ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setEditForm((p) => ({
                                    ...p,
                                    permissions: p.permissions.includes(perm.key)
                                      ? p.permissions.filter((k) => k !== perm.key)
                                      : [...p.permissions, perm.key],
                                  }))
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={`text-sm flex-1 ${checked ? 'text-blue-700' : 'text-gray-700'}`} style={{ fontWeight: checked ? 600 : 500 }}>
                                {perm.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section access info */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-amber-900 mb-1" style={{ fontWeight: 600 }}>ملاحظة</p>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            صلاحيات حذف/تغيير الهاكاثون محصورة على المنظّم الأصلي ولا تُمنح لأي عضو في الفريق.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedMember(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      إلغاء
                    </button>
                    <button 
                      onClick={handleSaveChanges}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      حفظ التغييرات
                    </button>
                  </div>
                </>
              )}

              {!selectedMember && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    اضغط على أي عضو في الجدول لعرض تفاصيله وتعديل بياناته
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-xs text-gray-400">
          عرض {startIndex + 1} - {Math.min(endIndex, filteredMembers.length)} من {filteredMembers.length}، إجمالي {totalMembers} عضو
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <h2 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              إضافة عضو جديد
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              ستُرسل دعوة بالبريد الإلكتروني تحوي رابطاً صالحاً لمدة 7 أيام لقبول الانضمام.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="أدخل الاسم الكامل"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="example@hackathon.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  القسم
                </label>
                <select
                  value={newMember.section}
                  onChange={(e) => {
                    const newSection = e.target.value as Section;
                    setNewMember({
                      ...newMember,
                      section: newSection,
                      parentId: null,
                      // Clear permissions so admin selects them manually for the new section.
                      permissions: [],
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>{SECTION_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  الصلاحيات <span className="text-xs text-gray-400">({newMember.permissions.length}/{PERMISSIONS_BY_SECTION[newMember.section].length})</span>
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {PERMISSIONS_BY_SECTION[newMember.section].map((perm) => {
                    const checked = newMember.permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                          checked ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setNewMember((p) => ({
                              ...p,
                              permissions: p.permissions.includes(perm.key)
                                ? p.permissions.filter((k) => k !== perm.key)
                                : [...p.permissions, perm.key],
                            }))
                          }
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm flex-1 ${checked ? 'text-blue-700' : 'text-gray-700'}`} style={{ fontWeight: checked ? 600 : 500 }}>
                          {perm.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  الدور
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as 'manager' | 'staff', parentId: null })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="manager">مدير قسم</option>
                  <option value="staff">موظف</option>
                </select>
              </div>

              {newMember.role === 'staff' && (() => {
                const sectionManager = teamMembers.find(
                  (m) => m.role === 'manager' && m.section === newMember.section,
                );
                if (!sectionManager) {
                  return (
                    <div className="text-xs bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-800">
                      ⚠️ لا يوجد مدير لهذا القسم بعد — أضف مدير القسم أولاً قبل الموظفين.
                    </div>
                  );
                }
                return null;
              })()}

              {newMember.role === 'manager' && (() => {
                const dup = teamMembers.find(
                  (m) => m.role === 'manager' && m.section === newMember.section,
                );
                if (dup) {
                  return (
                    <div className="text-xs bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-800">
                      ⚠️ يوجد مدير لهذا القسم بالفعل ({dup.name}). كل قسم له مدير واحد فقط.
                    </div>
                  );
                }
                return null;
              })()}

              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
                بعد الإضافة، تقدر تحدّد الصلاحيات بالضغط على العضو في الجدول.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-all"
                style={{ fontWeight: 600 }}
              >
                إضافة العضو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
