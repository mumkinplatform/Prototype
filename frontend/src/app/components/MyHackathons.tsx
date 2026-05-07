import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Calendar, Users, MapPin, ChevronLeft, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import PublishConfirmModal from './PublishConfirmModal';
import PublishSuccessModal from './PublishSuccessModal';
import { apiGet } from '../../lib/api';

type Status = 'draft' | 'published' | 'ongoing' | 'completed';

interface Hackathon {
  id: number;
  title: string;
  description: string;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  city: string | null;
}

interface ApiHackathon {
  hackathon_ID: number;
  H_title: string | null;
  H_slug: string | null;
  H_description: string | null;
  H_status: Status;
  H_StartDate: string | null;
  H_EndDate: string | null;
  H_city: string | null;
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop';

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return 'بدون تواريخ';
  const fmt = (d: string | null) => (d ? d.slice(0, 10) : '');
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  return fmt(start) || fmt(end);
}

export default function MyHackathons() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all');
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ hackathons: ApiHackathon[] }>('/hackathons')
      .then((data) => {
        setHackathons(
          data.hackathons.map((h) => ({
            id: h.hackathon_ID,
            title: h.H_title ?? '',
            description: h.H_description ?? '',
            status: h.H_status,
            startDate: h.H_StartDate,
            endDate: h.H_EndDate,
            city: h.H_city,
          }))
        );
      })
      .catch(() => toast.error('تعذّر تحميل قائمة الهاكاثونات'))
      .finally(() => setLoading(false));
  }, []);

  const filteredHackathons = filterStatus === 'all' 
    ? hackathons 
    : hackathons.filter(h => h.status === filterStatus);

  const getStatusBadge = (status: Hackathon['status']) => {
    const statusConfig = {
      draft: { text: 'مسودة', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      published: { text: 'منشور', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      ongoing: { text: 'جاري التنفيذ', color: 'bg-green-100 text-green-700 border-green-200' },
      completed: { text: 'مكتمل', color: 'bg-purple-100 text-purple-700 border-purple-200' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs border ${config.color}`} style={{ fontWeight: 600 }}>
        {config.text}
      </span>
    );
  };

  const confirmPublish = () => {
    if (selectedHackathonId) {
      // الربط بـ /hackathons/:id/publish يأتي في مرحلة لاحقة
      console.log('Publishing hackathon:', selectedHackathonId);
      setShowPublishConfirmModal(false);
      setShowPublishSuccessModal(true);
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
                to="/admin" 
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  إدارة هاكاثوناتي
                </h1>
                <p className="text-sm text-gray-500">
                  عرض وإدارة جميع الهاكاثونات
                </p>
              </div>
            </div>
            <Link
              to="/admin/create-hackathon"
              className="px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-md shadow-[#e35654]/20 transition-all flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" />
              إنشاء هاكاثون جديد
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'all' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            جميع الهاكاثونات ({hackathons.length})
          </button>
          <button 
            onClick={() => setFilterStatus('draft')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'draft' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            المسودات ({hackathons.filter(h => h.status === 'draft').length})
          </button>
          <button 
            onClick={() => setFilterStatus('published')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'published' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            المنشورة ({hackathons.filter(h => h.status === 'published').length})
          </button>
          <button 
            onClick={() => setFilterStatus('ongoing')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'ongoing' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            جاري التنفيذ ({hackathons.filter(h => h.status === 'ongoing').length})
          </button>
          <button 
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-3 text-sm transition-colors ${
              filterStatus === 'completed' 
                ? 'border-b-2 border-[#e35654] text-[#e35654]' 
                : 'text-gray-500 hover:text-gray-900'
            }`} 
            style={{ fontWeight: 600 }}
          >
            المكتملة ({hackathons.filter(h => h.status === 'completed').length})
          </button>
        </div>

        {/* Hackathons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => (
            <div key={hackathon.id} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-[#e35654] hover:shadow-lg transition-all flex flex-col">
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={FALLBACK_IMG}
                  alt={hackathon.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(hackathon.status)}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col min-h-[240px]">
                <h3 className="text-lg text-gray-900 mb-2 line-clamp-1" style={{ fontWeight: 700 }}>
                  {hackathon.title || '(بدون عنوان)'}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {hackathon.description || '(بدون وصف)'}
                </p>

                {/* Meta */}
                <div className="flex flex-col gap-2 mb-3 text-xs text-gray-500 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateRange(hackathon.startDate, hackathon.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{hackathon.city || 'بدون موقع'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>0 مشارك</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {hackathon.status === 'draft' ? (
                    <Link
                      to={`/admin/create-hackathon/${hackathon.id}`}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
                      style={{ fontWeight: 600 }}
                    >
                      <FileText className="w-4 h-4" />
                      <span>تعديل المسودة</span>
                    </Link>
                  ) : hackathon.status === 'completed' ? (
                    <Link
                      to={`/admin/hackathon/${hackathon.id}/statistics`}
                      className="flex-1 px-4 py-2 rounded-lg bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all text-center flex items-center justify-center gap-2"
                      style={{ fontWeight: 600 }}
                    >
                      <span>عرض النتائج</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      to={`/admin/hackathon/${hackathon.id}`}
                      className="flex-1 px-4 py-2 rounded-lg bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-all text-center flex items-center justify-center gap-2"
                      style={{ fontWeight: 600 }}
                    >
                      <span>إدارة الهاكاثون</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">جاري التحميل...</div>
        )}

        {/* Empty State */}
        {filteredHackathons.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              لا توجد هاكاثونات
            </h3>
            <p className="text-gray-500 mb-6">
              {filterStatus === 'all' 
                ? 'لم تقم بإنشاء أي هاكاثون بعد' 
                : `لا توجد هاكاثونات ${filterStatus === 'draft' ? 'بحالة مسودة' : filterStatus === 'published' ? 'منشورة' : filterStatus === 'ongoing' ? 'جارية' : 'مكتملة'}`}
            </p>
            <Link
              to="/admin/create-hackathon"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-all"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" />
              إنشاء هاكاثون جديد
            </Link>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <PublishConfirmModal
        isOpen={showPublishConfirmModal}
        onClose={() => setShowPublishConfirmModal(false)}
        onConfirm={confirmPublish}
      />

      {/* Success Modal */}
      <PublishSuccessModal
        isOpen={showPublishSuccessModal}
        onClose={() => setShowPublishSuccessModal(false)}
        onViewHackathon={() => navigate(`/admin/hackathon/${selectedHackathonId}`)}
        onViewDashboard={() => {
          setShowPublishSuccessModal(false);
          navigate('/admin/my-hackathons');
        }}
      />
    </div>
  );
}