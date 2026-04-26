import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, Users, Mail, Search, ChevronDown, Copy, Ban, Edit2, AlertTriangle, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  avatar: string;
  department: string;
  departmentColor: string;
  accessLevel: string;
  status: 'نشط' | 'مدعو';
  permissions: number;
  role: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'أحمد محمد',
    email: 'ahmed@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    department: 'إدارة التسجيلات',
    departmentColor: 'bg-blue-100 text-blue-700',
    accessLevel: 'مدير القسم',
    status: 'نشط',
    permissions: 90,
    role: 'manager'
  },
  {
    id: 2,
    name: 'ساره خالد',
    email: 'sara.kh@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    department: 'لجنة التحكيم',
    departmentColor: 'bg-purple-100 text-purple-700',
    accessLevel: 'منظم',
    status: 'نشط',
    permissions: 45,
    role: 'organizer'
  },
  {
    id: 3,
    name: 'عم�� العتيبي',
    email: 'omar.o@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    department: 'قسم الرعاية',
    departmentColor: 'bg-green-100 text-green-700',
    accessLevel: 'مشرف',
    status: 'نشط',
    permissions: 65,
    role: 'supervisor'
  },
  {
    id: 4,
    name: 'فاطمة الزهراني',
    email: 'fatima.z@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    department: 'إدارة التسجيلات',
    departmentColor: 'bg-blue-100 text-blue-700',
    accessLevel: 'منظم',
    status: 'نشط',
    permissions: 55,
    role: 'organizer'
  },
  {
    id: 5,
    name: 'خالد السعيد',
    email: 'khaled.s@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    department: 'قسم الرعاية',
    departmentColor: 'bg-green-100 text-green-700',
    accessLevel: 'مدير القسم',
    status: 'نشط',
    permissions: 85,
    role: 'manager'
  },
  {
    id: 6,
    name: 'نورة القحطاني',
    email: 'norah.q@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    department: 'لجنة التحكيم',
    departmentColor: 'bg-purple-100 text-purple-700',
    accessLevel: 'مدير القسم',
    status: 'نشط',
    permissions: 95,
    role: 'manager'
  },
  {
    id: 7,
    name: 'محمد الدوسري',
    email: 'mohammed.d@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop',
    department: 'إدارة التسجيلات',
    departmentColor: 'bg-blue-100 text-blue-700',
    accessLevel: 'مشرف',
    status: 'نشط',
    permissions: 70,
    role: 'supervisor'
  },
  {
    id: 8,
    name: 'ريم العمري',
    email: 'reem.o@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    department: 'قسم الرعاية',
    departmentColor: 'bg-green-100 text-green-700',
    accessLevel: 'منظم',
    status: 'نشط',
    permissions: 60,
    role: 'organizer'
  },
  {
    id: 9,
    name: 'عبدالله الشمري',
    email: 'abdullah.sh@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    department: 'لجنة التحكيم',
    departmentColor: 'bg-purple-100 text-purple-700',
    accessLevel: 'منظم',
    status: 'مدعو',
    permissions: 0,
    role: 'organizer'
  },
  {
    id: 10,
    name: 'هند المطيري',
    email: 'hind.m@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    department: 'إدارة التسجيلات',
    departmentColor: 'bg-blue-100 text-blue-700',
    accessLevel: 'منظم',
    status: 'مدعو',
    permissions: 0,
    role: 'organizer'
  },
  {
    id: 11,
    name: 'سعد الغامدي',
    email: 'saad.g@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop',
    department: 'قسم الرعاية',
    departmentColor: 'bg-green-100 text-green-700',
    accessLevel: 'مشرف',
    status: 'مدعو',
    permissions: 0,
    role: 'supervisor'
  },
  {
    id: 12,
    name: 'مريم الحربي',
    email: 'maryam.h@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop',
    department: 'لجنة التحكيم',
    departmentColor: 'bg-purple-100 text-purple-700',
    accessLevel: 'منظم',
    status: 'مدعو',
    permissions: 0,
    role: 'organizer'
  },
  {
    id: 13,
    name: 'يوسف الشهري',
    email: 'youssef.sh@hackathon.com',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop',
    department: 'إدارة التسجيلات',
    departmentColor: 'bg-blue-100 text-blue-700',
    accessLevel: 'منظم',
    status: 'مدعو',
    permissions: 0,
    role: 'organizer'
  }
];

export function HackathonTeams() {
  const { id } = useParams();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPermissions, setFilterPermissions] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    department: 'إدارة التسجيلات',
    accessLevel: 'منظم'
  });
  
  // Permission options
  const [permissions, setPermissions] = useState({
    addParticipants: false,
    approveReject: false,
    assignJudges: false,
    editSchedule: false
  });

  const [sensitiveActions, setSensitiveActions] = useState(false);

  // Filter by tab
  const tabFilteredMembers = teamMembers.filter(member => {
    if (activeTab === 'active') return member.status === 'نشط';
    if (activeTab === 'pending') return member.status === 'مدعو';
    return true;
  });

  // Filter by search and filters
  const filteredMembers = tabFilteredMembers.filter(member => {
    const matchSearch = member.name.includes(searchQuery) || member.email.includes(searchQuery);
    const matchDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    const matchPermissions = filterPermissions === 'all' || member.accessLevel === filterPermissions;
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

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast.error('خطأ في البيانات', {
        description: 'الرجاء إدخال الاسم والبريد الإلكتروني',
        duration: 3000,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      toast.error('خطأ في البريد الإلكتروني', {
        description: 'الرجاء إدخال بريد إلكتروني صحيح',
        duration: 3000,
      });
      return;
    }

    const departmentColors: { [key: string]: string } = {
      'إدارة التسجيلات': 'bg-blue-100 text-blue-700',
      'لجنة التحكيم': 'bg-purple-100 text-purple-700',
      'قسم الرعاية': 'bg-green-100 text-green-700'
    };

    const member: TeamMember = {
      id: teamMembers.length + 1,
      name: newMember.name,
      email: newMember.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMember.name}`,
      department: newMember.department,
      departmentColor: departmentColors[newMember.department],
      accessLevel: newMember.accessLevel,
      status: 'مدعو',
      permissions: 0,
      role: 'organizer'
    };

    setTeamMembers([...teamMembers, member]);
    setShowAddMemberModal(false);
    setNewMember({
      name: '',
      email: '',
      department: 'إدارة التسجيلات',
      accessLevel: 'منظم'
    });

    toast.success('تم إضافة العضو بنجاح', {
      description: `تم إرسال دعوة إلى ${newMember.email}`,
      duration: 4000,
    });
  };

  const handleSaveChanges = () => {
    if (!selectedMember) return;

    // حساب نسبة الصلاحيات
    const enabledPermissions = Object.values(permissions).filter(p => p).length;
    const totalPermissions = Object.values(permissions).length;
    const permissionPercentage = Math.round((enabledPermissions / totalPermissions) * 100);

    // تحديث العضو
    const updatedMembers = teamMembers.map(member => {
      if (member.id === selectedMember.id) {
        return {
          ...member,
          permissions: permissionPercentage
        };
      }
      return member;
    });

    setTeamMembers(updatedMembers);
    
    toast.success('تم حفظ التغييرات بنجاح', {
      description: `تم تحديث صلاحيات ${selectedMember.name}`,
      duration: 4000,
    });

    setSelectedMember(null);
  };

  const handleCopyEmail = (email: string, name: string) => {
    navigator.clipboard.writeText(email);
    toast.success('تم النسخ', {
      description: `تم نسخ بريد ${name} الإلكتروني`,
      duration: 2000,
    });
  };

  const handleDisableMember = (member: TeamMember) => {
    toast.warning('تعطيل العضو', {
      description: `هل تريد تعطيل ${member.name}؟`,
      duration: 3000,
    });
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
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="all">كل الأقسام</option>
                    <option value="إدارة التسجيلات">إدارة التسجيلات</option>
                    <option value="لجنة التحكيم">لجنة التحكيم</option>
                    <option value="قسم الرعاية">قسم الرعاية</option>
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterPermissions}
                    onChange={(e) => setFilterPermissions(e.target.value)}
                    className="appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="all">كل الصلاحيات</option>
                    <option value="مدير القسم">مدير القسم</option>
                    <option value="منظم">منظم</option>
                    <option value="مشرف">مشرف</option>
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
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisableMember(member);
                            }}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button 
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                            }}
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
                {selectedMember ? selectedMember.name : 'اختر عضواً من الجدول لتعديل صلاحياته'}
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
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">البريد الإلكتروني المحدد</span>
                        <span className="text-gray-900" style={{ fontWeight: 600 }}>{selectedMember.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">القسم المسؤول</span>
                        <span className={`px-2 py-1 rounded ${selectedMember.departmentColor}`} style={{ fontWeight: 600 }}>
                          {selectedMember.department}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">صلاحيات الجلسة الحالية</span>
                        <span className="text-gray-900" style={{ fontWeight: 600 }}>{selectedMember.accessLevel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-700 mb-3" style={{ fontWeight: 600 }}>تخصيص الصلاحيات</p>
                    
                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.addParticipants}
                        onChange={(e) => setPermissions({...permissions, addParticipants: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">إضافة مشاركين جدد</p>
                        <p className="text-xs text-gray-500">السماح بإضافة مشاركين جدد إضافة</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.approveReject}
                        onChange={(e) => setPermissions({...permissions, approveReject: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">قبول/رفض الطلبات</p>
                        <p className="text-xs text-gray-500">التحكم في طلبات الانضمام للهاكاثون</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.assignJudges}
                        onChange={(e) => setPermissions({...permissions, assignJudges: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">توزيع الحكام</p>
                        <p className="text-xs text-gray-500">إدارة تخصيص الحكام المناسبين على الفرق المشاركة</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.editSchedule}
                        onChange={(e) => setPermissions({...permissions, editSchedule: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">تعديل الجدول</p>
                        <p className="text-xs text-gray-500">التحكم في الجدال الزمنية وأوقات الفعاليات المختلفة</p>
                      </div>
                    </label>
                  </div>

                  {/* Sensitive Actions */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-900 mb-1" style={{ fontWeight: 600 }}>إجراءات حساسية</p>
                          <p className="text-xs text-red-700">السماح بحذف الهاكاثونات بالكامل</p>
                        </div>
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sensitiveActions}
                        onChange={(e) => setSensitiveActions(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">تفعيل الإجراءات الحساسة</span>
                    </label>
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
                    اضغط على أي عضو في الجدول لعرض تفاصيله وتعديل صلاحياته
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
              أدخل بيانات العضو الجديد لإرسال دعوة الانضمام
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
                  value={newMember.department}
                  onChange={(e) => setNewMember({...newMember, department: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="إدارة التسجيلات">إدارة التسجيلات</option>
                  <option value="لجنة التحكيم">لجنة التحكيم</option>
                  <option value="قسم الرعاية">قسم الرعاية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                  مستوى الوصول
                </label>
                <select
                  value={newMember.accessLevel}
                  onChange={(e) => setNewMember({...newMember, accessLevel: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="مدير القسم">مدير القسم</option>
                  <option value="منظم">منظم</option>
                  <option value="مشرف">مشرف</option>
                </select>
              </div>
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
