import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Search,
  Bell,
  Mail,
  Trophy,
  Users,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Upload,
  FileText,
  Send,
  X,
  Filter,
  Award,
  Bookmark,
  Github,
  Link2,
  LogOut,
  Settings,
  Star,
  Play,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  User,
} from "lucide-react";
 
// ─── Images ───────────────────────────────────────────────────────────────────
const IMG_AI = "https://images.unsplash.com/photo-1540058404349-2e5fabf32d75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_CYBER = "https://images.unsplash.com/photo-1768839721176-2fa91fdce725?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_CITY = "https://images.unsplash.com/photo-1758640098400-061795902273?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_FINTECH = "https://images.unsplash.com/photo-1561525155-40a650192479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_HEALTH = "https://images.unsplash.com/photo-1758691463203-cce9d415b2b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_DEV = "https://images.unsplash.com/photo-1692106979244-a2ac98253f6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
 
// ─── Types ────────────────────────────────────────────────────────────────────
type View = "home" | "hackathons" | "workspaces" | "workspace" | "profile";
 
// ─── Data ─────────────────────────────────────────────────────────────────────
const myHackathons = [
  {
    id: 1,
    name: "هاكاثون الذكاء الاصطناعي 2024",
    status: "مقبول",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    note: "تبقى 12 يوماً على الموعد النهائي لتسليم المشروع الأولي.",
    progress: 65,
    image: IMG_AI,
    track: "الذكاء الاصطناعي",
  },
  {
    id: 2,
    name: "تحدي الأمن السيبراني للمحترفين",
    status: "مقبول",
    statusColor: "#10b981",
    statusBg: "#f0fdf4",
    note: "تم القبول في فريقك. يمكنك البدء في م����حلة النماذج الأولية.",
    progress: 10,
    image: IMG_CYBER,
    track: "الأمن السيبراني",
  },
];
 
const suggestedHackathons = [
  { id: 10, name: "هاكاثون الصحة الرقمية", date: "10 سبتمبر", prize: "15,000", image: IMG_HEALTH, recommended: false },
  { id: 11, name: "هاكاثون التقنية المالية - فينتك", date: "22 أغسطس", prize: "30,000", image: IMG_FINTECH, recommended: false },
  { id: 12, name: "هاكاثون حلول المدن الذكية", date: "15 يوليو", prize: "20,000", image: IMG_CITY, recommended: true },
];
 
const exploreHackathons = [
  {
    id: 20,
    name: "هاكاثون الابتكار المالي الخليجي",
    track: "المال",
    type: "قريب",
    typeColor: "#6366f1",
    typeBg: "#eef2ff",
    prize: "25,000 درهم إماراتي",
    date: "22 - 25 نوفمبر, 2024",
    location: "الإمارات العربية المتحدة",
    participants: 128,
    image: IMG_FINTECH,
    avatars: ["#e35654", "#6366f1", "#10b981"],
  },
  {
    id: 21,
    name: "تحدي حماية البنية التحتية الرقمية",
    track: "الأمن السيبراني",
    type: "قريب",
    typeColor: "#6366f1",
    typeBg: "#eef2ff",
    prize: "50,000 ريال سعودي",
    date: "1 - 3 ديسمبر, 2024",
    location: "جدة، المملكة العربية السعودية",
    participants: 120,
    image: IMG_CYBER,
    avatars: ["#f59e0b", "#e35654", "#6b7280"],
  },
  {
    id: 22,
    name: "هاكاثون نيوم للذكاء الاصطناعي 2024",
    track: "الذكاء الاصطناعي",
    type: "نشط",
    typeColor: "#e35654",
    typeBg: "#fef2f2",
    prize: "100,000 ريال سعودي",
    date: "15 - 18 نوفمبر, 2024",
    location: "الرياض، المملكة العربية السعودية",
    participants: 45,
    image: IMG_AI,
    avatars: ["#10b981", "#6366f1", "#e35654"],
  },
];
 
const teamMembers = [
  { name: "أحمد محمد", role: "مطوّر Full Stack", color: "#e35654", initials: "أ", you: true },
  { name: "ريم العتيبي", role: "مصممة UI/UX", color: "#6366f1", initials: "ر" },
  { name: "عبدالله الغامدي", role: "مطوّر AI/ML", color: "#10b981", initials: "ع" },
];
 
const projectFiles = [
  { name: "برنامج تجريبي.pdf", size: "2.1 MB", color: "#e35654" },
  { name: "واجهات مشارك.v1.fig", size: "8.7 MB", color: "#6366f1" },
];
 
// ─── Sub-components ──────────────────────────────────────────────────────────
 
 
// ─── Home View ───────────────────────────────────────────────────────────────
function HomeView({ setView }: { setView: (v: View) => void }) {
  const navigate = useNavigate();
  const [hackTab, setHackTab] = useState("نشط");
  const [showRegModal, setShowRegModal] = useState(false);
 
 
 
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Soft gradient blobs - مموهة */}
          <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
            {/* Top left blob - أحمر */}
            <div 
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.4) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Top right blob - ذهبي */}
            <div 
              className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.4) 0%, rgba(250, 187, 91, 0.25) 50%, transparent 70%)' }}
            ></div>
            
            {/* Center blob - أحمر وذهبي مدمج */}
            <div 
              className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.3) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Bottom left blob - ذهبي */}
            <div 
              className="absolute -bottom-20 -left-20 w-[550px] h-[550px] rounded-full opacity-28 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(250, 187, 91, 0.35) 0%, rgba(250, 187, 91, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Bottom right blob - أحمر */}
            <div 
              className="absolute -bottom-28 -right-28 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.35) 0%, rgba(227, 86, 84, 0.2) 50%, transparent 70%)' }}
            ></div>
            
            {/* Small accent blob - مزيج أحمر وذهبي */}
            <div 
              className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full opacity-22 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(227, 86, 84, 0.3) 0%, rgba(250, 187, 91, 0.15) 50%, transparent 70%)' }}
            ></div>
          </div>
 
          {/* Simple curved lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            <path 
              d="M 0 200 Q 200 180, 400 200 T 800 200 T 1200 200 T 1600 200" 
              stroke="#e3565410" 
              strokeWidth="2" 
              fill="none" 
            />
            <path 
              d="M 0 220 Q 200 200, 400 220 T 800 220 T 1200 220 T 1600 220" 
              stroke="#00bcd415" 
              strokeWidth="2" 
              fill="none" 
            />
            <path 
              d="M 0 240 Q 200 220, 400 240 T 800 240 T 1200 240 T 1600 240" 
              stroke="#8b5cf610" 
              strokeWidth="2" 
              fill="none" 
            />
            <path 
              d="M 900 100 Q 950 150, 1000 100 T 1200 100" 
              stroke="#e3565412" 
              strokeWidth="1.5" 
              fill="none" 
            />
            <path 
              d="M 920 120 Q 970 170, 1020 120 T 1220 120" 
              stroke="#00bcd418" 
              strokeWidth="1.5" 
              fill="none" 
            />
          </svg>
 
          {/* Small decorative shapes */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <div className="absolute top-20 left-32 w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
            <div className="absolute top-40 right-48 w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
            <div className="absolute bottom-32 left-48 w-2.5 h-2.5 bg-green-400 rounded-full opacity-70"></div>
            <div className="absolute bottom-48 right-32 w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
            <div className="absolute top-1/2 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
            <div className="absolute top-1/3 right-20 w-2 h-2 bg-cyan-300 rounded-full opacity-50"></div>
            <div className="absolute top-24 left-1/4 w-4 h-4 bg-orange-400 opacity-70 transform rotate-45"></div>
            <div className="absolute top-56 right-1/4 w-3 h-3 bg-yellow-400 opacity-60"></div>
            <div className="absolute bottom-40 left-1/3 w-3.5 h-3.5 bg-cyan-400 opacity-70 transform rotate-12"></div>
            <div className="absolute bottom-56 right-1/3 w-4 h-4 bg-green-400 opacity-60 transform rotate-45"></div>
            <div className="absolute top-32 right-56 w-6 h-6 border-2 border-cyan-400 opacity-60 transform rotate-45"></div>
            <div className="absolute bottom-36 left-64 w-7 h-7 border-2 border-green-400 opacity-50 transform rotate-45"></div>
          </div>
 
          {/* Floating Icons - للمشاركة والتفاعل والمسابقات */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {/* Top Right - Trophy (الفوز) */}
            <div className="absolute top-20 right-32 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
 
            {/* Top Left - Users (الفريق والمشاركة) */}
            <div className="absolute top-32 left-24 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
 
            {/* Middle Right - Star (التميز) */}
            <div className="absolute top-1/2 right-16 w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
              <Star className="w-7 h-7 text-orange-600" />
            </div>
 
            {/* Middle Left - Sparkles (الابتكار) */}
            <div className="absolute top-1/3 left-16 w-11 h-11 bg-cyan-100 rounded-lg flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3s' }}>
              <Sparkles className="w-6 h-6 text-cyan-600" />
            </div>
 
            {/* Bottom Right - Award (الجوائز) */}
            <div className="absolute bottom-24 right-28 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center rotate-12 animate-float" style={{ animation: 'float 5.5s ease-in-out infinite 1.5s' }}>
              <Award className="w-5 h-5 text-pink-600" />
            </div>
 
            {/* Bottom Left - CheckCircle (الإنجاز) */}
            <div className="absolute bottom-32 left-20 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center -rotate-6 animate-float" style={{ animation: 'float 6.5s ease-in-out infinite 2.5s' }}>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
 
            {/* Center Top - Bookmark (المشاريع المحفوظة) */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-float" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}>
              <Bookmark className="w-4 h-4 text-blue-600" />
            </div>
 
            {/* Bottom Center - Github (المشاريع) */}
            <div className="absolute bottom-20 left-1/3 w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite 3.5s' }}>
              <Github className="w-5 h-5 text-indigo-600" />
            </div>
 
            {/* Top Center Right - Mail (التواصل) */}
            <div className="absolute top-24 right-1/3 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center -rotate-12 animate-float" style={{ animation: 'float 7s ease-in-out infinite 4s' }}>
              <Mail className="w-5 h-5 text-[#e35654]" />
            </div>
          </div>
 
          {/* Content */}
          <div className="relative text-center max-w-3xl mx-auto" style={{ zIndex: 2 }}>
            <h1 className="text-5xl text-gray-900 mb-6 leading-tight" style={{ fontWeight: 700 }}>
              ابدأ رحلتك في الابتكار<br />
              <span className="text-[#e35654]">واصنع المستقبل</span>
            </h1>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              انضم إلى أفضل الهاكاثونات التقنية وطوّر مهاراتك من خلال تحديات حقيقية،<br />
              تنافس مع المبدعين واربح جوائز قيّمة.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setView("hackathons")}
                className="px-10 py-4 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] shadow-lg shadow-[#e35654]/30 transition-all hover:shadow-xl hover:-translate-y-0.5" 
                style={{ fontWeight: 600 }}
              >
                استكشف الهاكاثونات
              </button>
              <button 
                onClick={() => navigate("/participant/workspace")}
                className="px-10 py-4 rounded-xl bg-white text-gray-700 border-2 border-gray-200 hover:border-[#e35654] hover:text-[#e35654] hover:bg-red-50 transition-all hover:-translate-y-0.5" 
                style={{ fontWeight: 600 }}
              >
                مساحة العمل
              </button>
            </div>
          </div>
        </div>
 
        {/* Add keyframes for floating animation */}
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }
        `}</style>
      </section>
 
      {/* Quick Services */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl text-gray-900 mb-6" style={{ fontWeight: 700 }}>الخدمات السريعة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Card 1 - استكشاف الهاكاثونات */}
            <button 
              onClick={() => setView("hackathons")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#e35654] transition-all cursor-pointer text-right block w-full"
            >
              <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#e35654]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>استكشاف الهاكاثونات</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                ابحث عن الهاكاثونات المتاحة وتعرّف على المسارات والجوائز ومواعيد المشاركة ثم سجّل بسهولة.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#e35654] text-sm hover:bg-red-50 hover:border-[#e35654] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                استكشف
              </span>
            </button>
 
            {/* Service Card 2 - مساحات العمل */}
            <button 
              onClick={() => navigate("/participant/workspace")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-[#00bcd4] transition-all cursor-pointer text-right block w-full"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#00bcd4]" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>مساحات العمل</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                ادخل إلى الهاكاثونات التي تم قبولك فيها وتابع عمل فريقك، واطلع على المهام والإعلانات، وقم برفع المشاريع ومتابعة مراحل العمل.
              </p>
              <span className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-[#00bcd4] text-sm hover:bg-cyan-50 hover:border-[#00bcd4] transition-all inline-block text-center" style={{ fontWeight: 600 }}>
                عرض المساحات
              </span>
            </button>
          </div>
        </div>
      </section>
 
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {/* My Hackathons */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>هاكاثوناتي</h2>
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
              {["نشط", "قيد المراجعة", "مكتمل"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHackTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    hackTab === tab ? "bg-white shadow-sm text-gray-900 border border-gray-100" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{ fontWeight: hackTab === tab ? 600 : 400 }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {myHackathons.map((h) => (
              <div key={h.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: h.statusBg, color: h.statusColor, fontWeight: 600 }}
                    >
                      {h.status}
                    </span>
                    <h3 className="text-gray-900 text-sm truncate" style={{ fontWeight: 600 }}>{h.name}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-2 line-clamp-1">{h.note}</p>
                  <div>
                    <p className="text-gray-400 mb-1" style={{ fontSize: "0.65rem" }}>نسبة الاكتمال</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${h.progress}%`, background: "#e35654" }}
                      />
                    </div>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.65rem" }}>{h.progress}%</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/participant/workspace")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] transition-colors flex-shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  <Play className="w-3 h-3" />
                  دخول مساحة العمل
                </button>
              </div>
            ))}
          </div>
        </div>
 
        {/* Suggested Hackathons */}
        
      </div>
 
      {/* Registration Modal */}
      {showRegModal && <RegistrationModal onClose={() => setShowRegModal(false)} />}
    </>
  );
}
 
// ─── Registration Modal ──────────────────────────────────────────────────────
function RegistrationModal({ onClose }: { onClose: () => void }) {
  const [participationType, setParticipationType] = useState<"team" | "individual">("team");
  const [teamMethod, setTeamMethod] = useState<"email" | "ai">("email");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>خطوات التسجيل في الهاكاثون</h2>
            <p className="text-gray-400 text-xs mt-0.5">الخطوة {step} من 3: حدد نوع المشاركة</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
 
        <div className="p-6">
          <p className="text-gray-700 text-sm mb-4" style={{ fontWeight: 600 }}>
            كيف تود المشاركة في هاكاثون الابتكار؟
          </p>
 
          {/* Participation Type */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { type: "team" as const, label: "فريق", desc: "سجل مع فريقك أو قم ببناء فريقك الخاص داخل المنصة", icon: "👥" },
              { type: "individual" as const, label: "فردي", desc: "سجل كمشارك منفرد وستوفر له مساعدات في إيجاد فريق لاحقاً", icon: "👤" },
            ].map((opt) => (
              <button
                key={opt.type}
                onClick={() => setParticipationType(opt.type)}
                className={`p-4 rounded-2xl border-2 text-right transition-all ${
                  participationType === opt.type
                    ? "border-[#e35654] bg-[#fef2f2]"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="text-2xl mb-2">{opt.icon}</div>
                <p className="text-gray-900 text-sm mb-1" style={{ fontWeight: 700 }}>{opt.label}</p>
                <p className="text-gray-400" style={{ fontSize: "0.65rem", lineHeight: 1.4 }}>{opt.desc}</p>
              </button>
            ))}
          </div>
 
          {/* Team Options */}
          {participationType === "team" && (
            <div className="space-y-3">
              <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>خيارات تكوين الفريق:</p>
 
              {/* Email invite */}
              <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${teamMethod === "email" ? "border-[#e35654] bg-[#fef2f2]" : "border-gray-100"}`}>
                <input
                  type="radio"
                  name="teamMethod"
                  checked={teamMethod === "email"}
                  onChange={() => setTeamMethod("email")}
                  className="mt-0.5 accent-[#e35654]"
                />
                <div className="flex-1">
                  <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>دعوة أعضاء الفريق (الإلكترونية)</p>
                  <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>أدخل البريد الإلكتروني، فأرسل دعوات لمشاركيك المختارين</p>
                  {teamMethod === "email" && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#e35654]"
                        dir="ltr"
                      />
                      <button className="px-3 py-1.5 rounded-lg bg-[#e35654] text-white text-xs" style={{ fontWeight: 600 }}>
                        إرسال
                      </button>
                    </div>
                  )}
                </div>
              </label>
 
              {/* AI Matching */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${teamMethod === "ai" ? "border-[#e35654] bg-[#fef2f2]" : "border-gray-100"}`}
                onClick={() => { setTeamMethod("ai"); window.location.href = "/matchmaking"; }}
              >
                <input
                  type="radio"
                  name="teamMethod"
                  checked={teamMethod === "ai"}
                  onChange={() => setTeamMethod("ai")}
                  className="mt-0.5 accent-[#e35654]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>توفيق الفرق بالذكاء الاصطناعي (AI Matching)</p>
                    <span className="text-white text-xs px-1.5 py-0.5 rounded-md" style={{ background: "#6366f1", fontWeight: 700, fontSize: "0.55rem" }}>AI POWERED</span>
                  </div>
                  <p className="text-gray-400" style={{ fontSize: "0.65rem", lineHeight: 1.4 }}>
                    دع الذكاء الاصطناعي يقترح أعضاء بناءً على مهاراتك وأهدافك والمهارات المطلوبة في هذا الهاكاثون
                  </p>
                  <p className="mt-1.5 text-[#6366f1]" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                    ← انتقل لصفحة تكوين الفرق بالذكاء الاصطناعي
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
 
        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <button
            onClick={onClose}
            className="text-gray-500 text-sm hover:text-gray-700"
            style={{ fontWeight: 500 }}
          >
            السابق
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors"
            style={{ fontWeight: 600 }}
          >
            تأكيد ومتابعة
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── Hackathons Explore View ──────────────────────────────────────────────────
function HackathonsView() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/participant/hackathons"); }, []);
  return null;
}
 
// ─── Workspaces List View ─────────────────────────────────────────────────────
function WorkspacesListView({ 
  setView, 
  setSelectedHackathon 
}: { 
  setView: (v: View) => void;
  setSelectedHackathon: (h: typeof myHackathons[0]) => void;
}) {
  const handleEnterWorkspace = (hackathon: typeof myHackathons[0]) => {
    setSelectedHackathon(hackathon);
    setView("workspace");
  };
 
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView("home")}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                مساحات العمل
              </h1>
              <p className="text-sm text-gray-500">
                اختر هاكاثوناً للدخول إلى مساحة عمله
              </p>
            </div>
          </div>
        </div>
      </div>
 
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myHackathons.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img src={h.image} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
                <div className="absolute bottom-4 right-4 left-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-3 py-1.5 rounded-full text-white shadow-md" style={{ background: "#e35654", fontWeight: 600 }}>
                      {h.track}
                    </span>
                    <span
                      className="text-xs px-3 py-1.5 rounded-full shadow-md"
                      style={{ background: h.statusBg, color: h.statusColor, fontWeight: 600 }}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>
              </div>
 
              {/* Content */}
              <div className="p-5">
                <h2 className="text-gray-900 text-base mb-2" style={{ fontWeight: 700 }}>{h.name}</h2>
                <p className="text-gray-400 text-sm mb-5 line-clamp-2">{h.note}</p>
 
                <button
                  onClick={() => handleEnterWorkspace(h)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors shadow-md shadow-[#e35654]/20"
                  style={{ fontWeight: 600 }}
                >
                  <Play className="w-4 h-4" />
                  دخول مساحة العمل
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
// ─── File Upload Modal ────────────────────────────────────────────────────────
function FileUploadModal({ onClose, onUpload }: { onClose: () => void; onUpload: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
 
  const handleFile = (file: File) => {
    setSelectedFile(file);
    setDone(false);
    setProgress(0);
    // generate image preview
    const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(
      file.name.split(".").pop()?.toLowerCase() || ""
    );
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };
 
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
 
  const handleUpload = () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 8;
      });
    }, 120);
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setUploading(false);
      setDone(true);
      onUpload(selectedFile);
      setTimeout(() => onClose(), 1500);
    }, 1800);
  };
 
  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
 
  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["zip", "rar"].includes(ext || "")) return "📦";
    if (ext === "pdf") return "📄";
    if (["pptx", "ppt"].includes(ext || "")) return "📊";
    if (["docx", "doc"].includes(ext || "")) return "📝";
    if (["mp4", "mov"].includes(ext || "")) return "🎬";
    if (["png", "jpg", "jpeg"].includes(ext || "")) return "🖼️";
    return "📁";
  };
 
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e35654]/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-[#e35654]" />
            </div>
            <div>
              <h2 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>رفع ملف للمشروع</h2>
              <p className="text-gray-400" style={{ fontSize: "0.68rem" }}>zip, pdf, pptx, mp4, png — حتى 50MB</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
 
        <div className="p-6 space-y-4">
          {/* Drop Zone */}
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all py-10"
            style={{
              borderColor: dragOver ? "#e35654" : selectedFile ? "#10b981" : "#e5e7eb",
              background: dragOver ? "#fef2f2" : selectedFile ? "#f0fdf4" : "#fafafa",
            }}
          >
            <input
              type="file"
              className="hidden"
              accept=".zip,.rar,.pdf,.docx,.pptx,.mp4,.png,.jpg"
              onChange={handleInputChange}
            />
            {selectedFile ? (
              <>
                {previewUrl ? (
                  <div className="w-full rounded-xl overflow-hidden border border-green-200" style={{ maxHeight: 160 }}>
                    <img src={previewUrl} alt="معاينة" className="w-full h-40 object-contain bg-gray-50" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: "#f0fdf4" }}
                  >
                    {getFileIcon(selectedFile.name)}
                  </div>
                )}
                <div className="text-center w-full px-2">
                  <p className="text-gray-900 text-sm truncate" style={{ fontWeight: 700 }}>{selectedFile.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{formatSize(selectedFile.size)}</p>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full" style={{ fontWeight: 600 }}>
                  ✓ تم الاختيار — انقر لتغيير الملف
                </span>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>
                    {dragOver ? "أفلت الملف هنا 🎯" : "اسحب وأفلت الملف هنا"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">أو انقر للاختيار من جهازك</p>
                </div>
              </>
            )}
          </label>
 
          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>جارٍ رفع <span className="text-gray-700" style={{ fontWeight: 600 }}>{selectedFile?.name}</span>...</span>
                <span className="text-[#e35654]" style={{ fontWeight: 700 }}>{Math.min(progress, 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e35654] rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
          {done && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-green-700 text-xs" style={{ fontWeight: 600 }}>تم رفع الملف بنجاح!</p>
            </div>
          )}
        </div>
 
        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
            style={{ fontWeight: 500 }}
          >
            إلغاء
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || done}
            className="flex-1 py-2.5 rounded-xl text-white text-sm transition-colors disabled:opacity-50"
            style={{ background: "#e35654", fontWeight: 600 }}
          >
            {uploading ? "جارٍ الرفع..." : done ? "✓ تم" : "رفع الملف"}
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── Team Chat Box ──────────────────────────────────────��─────────────────────
const INITIAL_MESSAGES = [
  { id: 1, sender: "سارة أحمد", avatar: "س", color: "#6366f1", text: "مرحباً بالجميع! متحمسون للبدء 🚀", time: "9:00 ص", mine: false },
  { id: 2, sender: "أنت", avatar: "أ", color: "#e35654", text: "تمام، هل بدأنا بتقسيم المهام؟", time: "9:02 ص", mine: true },
  { id: 3, sender: "محمد علي", avatar: "م", color: "#10b981", text: "أنا أتكفل بالواجهة الأمامية 💻", time: "9:04 ص", mine: false },
];
 
function TeamChatBox() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
 
  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { id: Date.now(), sender: "أنت", avatar: "أ", color: "#e35654", text: input.trim(), time, mine: true }]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
 
  return (
    <div className="flex flex-col" style={{ height: 340 }}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/10">
        <Users className="w-4 h-4 text-[#e35654]" />
        <span className="text-white text-xs" style={{ fontWeight: 700 }}>شات الفريق</span>
        <span className="mr-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          <span className="text-gray-400" style={{ fontSize: "0.65rem" }}>3 أعضاء نشطون</span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.mine ? "flex-row-reverse" : ""}`}>
            {!msg.mine && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: msg.color, fontSize: "0.6rem", fontWeight: 700 }}>
                {msg.avatar}
              </div>
            )}
            <div className={`max-w-[72%] flex flex-col gap-0.5 ${msg.mine ? "items-end" : "items-start"}`}>
              {!msg.mine && (
                <span className="text-gray-400 px-1" style={{ fontSize: "0.6rem" }}>{msg.sender}</span>
              )}
              <div
                className={`px-3 py-2 text-xs leading-relaxed ${msg.mine ? "text-white rounded-2xl rounded-tl-sm" : "text-gray-200 rounded-2xl rounded-tr-sm"}`}
                style={{ background: msg.mine ? "#e35654" : "rgba(255,255,255,0.08)", fontWeight: 500 }}
              >
                {msg.text}
              </div>
              <span className="text-gray-600 px-1" style={{ fontSize: "0.58rem" }}>{msg.time}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-500"
            style={{ fontFamily: "inherit" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: "#e35654" }}
          >
            <Send className="w-3 h-3 text-white" style={{ transform: "scaleX(-1)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── File Preview Modal ───────────────────────────────────────────────────────
function FilePreviewModal({ file, previewUrl, onClose }: { file: File; previewUrl: string | null; onClose: () => void }) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`;
  const getIcon = () => {
    if (["zip","rar"].includes(ext)) return "📦";
    if (ext === "pdf") return "📄";
    if (["pptx","ppt"].includes(ext)) return "📊";
    if (["docx","doc"].includes(ext)) return "📝";
    if (["mp4","mov"].includes(ext)) return "🎬";
    if (isImage) return "🖼️";
    return "📁";
  };
  const colorMap: Record<string, string> = { pdf:"#e35654", zip:"#f59e0b", rar:"#f59e0b", pptx:"#6366f1", docx:"#6366f1", mp4:"#10b981", png:"#10b981", jpg:"#10b981" };
  const color = colorMap[ext] || "#6b7280";
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: color + "15" }}>
              {getIcon()}
            </div>
            <div>
              <h2 className="text-gray-900 text-sm truncate max-w-xs" style={{ fontWeight: 700 }}>{file.name}</h2>
              <p className="text-gray-400" style={{ fontSize: "0.68rem" }}>{formatSize(file.size)} • {ext.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          {isImage && previewUrl ? (
            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center" style={{ minHeight: 220 }}>
              <img src={previewUrl} alt={file.name} className="max-w-full max-h-72 object-contain" />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-4 py-12">
              <span className="text-6xl">{getIcon()}</span>
              <div className="text-center">
                <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{file.name}</p>
                <p className="text-gray-400 text-xs mt-1">{formatSize(file.size)} • لا تتوفر معاينة لهذا النوع</p>
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "اسم الملف", value: file.name.split(".")[0] },
              { label: "الحجم", value: formatSize(file.size) },
              { label: "النوع", value: ext.toUpperCase() },
            ].map((d, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{d.label}</p>
                <p className="text-gray-800 text-xs mt-0.5 truncate" style={{ fontWeight: 600 }}>{d.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-5">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-xs" style={{ fontWeight: 600 }}>تم رفع هذا الملف بنجاح كمشروع نهائي ✓</p>
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ─── Workspace View ───────────────────────────────────────────────────────────
function WorkspaceView({ 
  setView, 
  hackathon 
}: { 
  setView: (v: View) => void;
  hackathon: typeof myHackathons[0] | null;
}) {
  const [timeLeft] = useState({ days: 10, hours: 45, minutes: 14, seconds: 2 });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFinalUploadModal, setShowFinalUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(projectFiles);
  const [finalProjectFile, setFinalProjectFile] = useState<File | null>(null);
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null);
 
  // إذا لم يتم اختيار هاكاثون، ارجع إلى صفحة مساحات العمل
  if (!hackathon) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">لم يتم اختيار هاكاثون</p>
          <button
            onClick={() => setView("workspaces")}
            className="px-6 py-3 rounded-xl bg-[#e35654] text-white hover:bg-[#cc4a48] transition-colors"
            style={{ fontWeight: 600 }}
          >
            العودة إلى مساحات العمل
          </button>
        </div>
      </div>
    );
  }
 
  const handleUpload = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const colorMap: Record<string, string> = {
      pdf: "#e35654", zip: "#f59e0b", rar: "#f59e0b",
      pptx: "#6366f1", docx: "#6366f1", mp4: "#10b981",
      png: "#10b981", jpg: "#10b981",
    };
    setUploadedFiles((prev) => [
      ...prev,
      {
        name: file.name,
        size: file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        color: colorMap[ext] || "#6b7280",
      },
    ]);
  };
 
  const handleFinalUpload = (file: File) => {
    setFinalProjectFile(file);
    const isImage = ["png","jpg","jpeg","gif","webp"].includes(file.name.split(".").pop()?.toLowerCase() || "");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setFinalPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFinalPreviewUrl(null);
    }
  };
 
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("workspaces")}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
                  {hackathon.name}
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: hackathon.statusBg, color: hackathon.statusColor, fontWeight: 600 }}>
                    {hackathon.status}
                  </span>
                  <span>•</span>
                  <span>{hackathon.track}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                أضف فريق الهاكاثون
              </button>
              {finalProjectFile ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs hover:bg-green-100 transition-colors max-w-40"
                    style={{ fontWeight: 600 }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{finalProjectFile.name}</span>
                  </button>
                  <button
                    onClick={() => setShowFinalUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] shadow-sm transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    تغيير
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowFinalUploadModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e35654] text-white text-xs hover:bg-[#cc4a48] shadow-sm transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  رفع المشروع النهائي
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
 
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Welcome Banner */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)" }}>
              <TeamChatBox />
            </div>
 
            {/* Hackathon Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-50">
                {[
                  { label: "مسار الابتكار", value: "الذكاء الاصطناعي في الحكم", color: "#6366f1" },
                  { label: "سؤال الابتكار", value: "نمو", color: "#10b981" },
                  { label: "توقيت التسليم", value: "مراحل النهائي مكتملة", color: "#f59e0b" },
                ].map((info, i) => (
                  <div key={i}>
                    <p className="text-gray-400 mb-1" style={{ fontSize: "0.7rem" }}>{info.label}</p>
                    <p style={{ color: info.color, fontWeight: 600, fontSize: "0.8rem" }}>{info.value}</p>
                  </div>
                ))}
              </div>
 
              {/* Countdown */}
              <div>
                <p className="text-gray-500 text-xs mb-3" style={{ fontWeight: 600 }}>الوقت المتبقي للتسليم</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: timeLeft.days, label: "أيام" },
                    { value: timeLeft.hours, label: "ساعة" },
                    { value: timeLeft.minutes, label: "دقيقة" },
                    { value: timeLeft.seconds, label: "ثانية" },
                  ].map((t, i) => (
                    <div key={i} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.4rem" }}>
                        {String(t.value).padStart(2, "0")}
                      </p>
                      <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{t.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
 
            {/* Upcoming Session */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-900 mb-3 text-sm" style={{ fontWeight: 700 }}>جلسة قادمة</h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-[#e35654] flex items-center justify-center flex-shrink-0">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">08:00 PM</p>
                  <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>
                    هاكاثون بنك CIB: جلسة التوجيه الافتتاحية الأولى
                  </p>
                </div>
              </div>
            </div>
          </div>
 
          {/* Sidebar */}
          <div className="space-y-5">
            {/* Team Members */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-900 mb-3 text-sm" style={{ fontWeight: 700 }}>أعضاء الفريق</h3>
              <div className="space-y-2">
                {teamMembers.map((member, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ background: member.color, fontWeight: 700 }}
                    >
                      {member.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-gray-900 text-xs truncate" style={{ fontWeight: 600 }}>{member.name}</p>
                        {member.you && (
                          <span className="text-xs bg-[#e35654]/10 text-[#e35654] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ fontWeight: 600, fontSize: "0.6rem" }}>
                            أنت
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{member.role}</p>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
 
            {/* Project Files */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-900 mb-3 text-sm" style={{ fontWeight: 700 }}>ملفات المشروع المشتركة</h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: file.color + "15" }}
                    >
                      <FileText className="w-4 h-4" style={{ color: file.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-xs truncate" style={{ fontWeight: 600 }}>{file.name}</p>
                      <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{file.size}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-xs hover:border-[#e35654] hover:text-[#e35654] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  رفع ملف
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}
      {showFinalUploadModal && (
        <FileUploadModal
          onClose={() => setShowFinalUploadModal(false)}
          onUpload={(file) => { handleFinalUpload(file); }}
        />
      )}
      {showPreviewModal && finalProjectFile && (
        <FilePreviewModal
          file={finalProjectFile}
          previewUrl={finalPreviewUrl}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
 
// ─── Profile View ─────────────────────────────────────────────────────────────
function ProfileView({ setView }: { setView: (v: View) => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("الهاكاثونات");
  const tabs = ["الهاكاثونات (12)", "المشاريع (8)", "الجوائز (4)", "التحديثات"];
 
  // ── Modal states ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
 
  // ── Profile data state ──
  const [profileName, setProfileName] = useState("أحمد محمد");
  const [profileTitle, setProfileTitle] = useState("مطور واجهات أمامية | خبير في حلول التقنية المالية");
  const [profileLocation, setProfileLocation] = useState("الرياض، المملكة العربية السعودية");
  const [profileSkills, setProfileSkills] = useState(["حل المشكلات", "Next.js", "UX/UI Design", "Tailwind CSS", "TypeScript", "React"]);
  const [newSkill, setNewSkill] = useState("");
 
  // ── Edit form temp state ──
  const [editName, setEditName] = useState(profileName);
  const [editTitle, setEditTitle] = useState(profileTitle);
  const [editLocation, setEditLocation] = useState(profileLocation);
  const [editSkillsTemp, setEditSkillsTemp] = useState<string[]>(profileSkills);
  const [editNewSkill, setEditNewSkill] = useState("");
 
  // ── Achievement form state ──
  const [achievementTitle, setAchievementTitle] = useState("");
  const [achievementType, setAchievementType] = useState("المركز الأول 🥇");
  const [achievementHackathon, setAchievementHackathon] = useState("");
  const [achievementDate, setAchievementDate] = useState("");
  const [achievementDesc, setAchievementDesc] = useState("");
  const [achievementFile, setAchievementFile] = useState<File | null>(null);
  const [achievementSaved, setAchievementSaved] = useState(false);
 
  // ── Quick Links state ──
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [personalLink, setPersonalLink] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [editPersonalLink, setEditPersonalLink] = useState("");
  const [editGithubLink, setEditGithubLink] = useState("");
  const [editCvFileTemp, setEditCvFileTemp] = useState<File | null>(null);
  const [linksSaved, setLinksSaved] = useState(false);
 
  // ── Projects state ──
  const [starredProjects, setStarredProjects] = useState<Set<number>>(new Set());
  const [showProjectLinkModal, setShowProjectLinkModal] = useState(false);
  const [selectedProjectIdx, setSelectedProjectIdx] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
 
  // ── Hackathons expand ──
  const [showAllHackathons, setShowAllHackathons] = useState(false);
 
  const openLinksModal = () => {
    setEditPersonalLink(personalLink);
    setEditGithubLink(githubLink);
    setEditCvFileTemp(cvFile);
    setLinksSaved(false);
    setShowLinksModal(true);
  };
 
  const saveLinks = () => {
    setPersonalLink(editPersonalLink);
    setGithubLink(editGithubLink);
    setCvFile(editCvFileTemp);
    setLinksSaved(true);
    setTimeout(() => setShowLinksModal(false), 900);
  };
 
  const toggleStar = (idx: number) => {
    setStarredProjects(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
 
  const openProjectLink = (idx: number) => {
    setSelectedProjectIdx(idx);
    setLinkCopied(false);
    setShowProjectLinkModal(true);
  };
 
  const copyProjectLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
 
  const openEditModal = () => {
    setEditName(profileName);
    setEditTitle(profileTitle);
    setEditLocation(profileLocation);
    setEditSkillsTemp([...profileSkills]);
    setEditNewSkill("");
    setShowEditModal(true);
  };
 
  const saveProfile = () => {
    setProfileName(editName);
    setProfileTitle(editTitle);
    setProfileLocation(editLocation);
    setProfileSkills([...editSkillsTemp]);
    setShowEditModal(false);
  };
 
  const saveAchievement = () => {
    setAchievementSaved(true);
    setTimeout(() => {
      setShowAchievementModal(false);
      setAchievementTitle("");
      setAchievementHackathon("");
      setAchievementDate("");
      setAchievementDesc("");
      setAchievementType("المركز الأول 🥇");
      setAchievementFile(null);
      setAchievementSaved(false);
    }, 1200);
  };
 
  const profileStats = [
    { label: "جوائز", value: "4", icon: "🏆" },
    { label: "هاكاثونات", value: "12", icon: "🚀" },
    { label: "نسبة الإنجاز", value: "95%", icon: "⭐" },
    { label: "مشاريع", value: "8", icon: "📁" },
  ];
 
  const recentHackathons = [
    { name: "هاكاثون الذكاء الاصطناعي 2024", date: "فبراير 2024", status: "مكتمل", rank: "🥇 المركز الأول" },
    { name: "تحدي التقنية المالية (FinTech)", date: "يونيو 2023", status: "مكتمل", rank: "نجم فردي" },
  ];
 
  const projects = [
    { name: "تطبيق \"مساري\" للمواصلات", type: "موبايل", color: "#6366f1", desc: "تطبيق يُحسّن تجربة الخدمات المصرفية الرقمية للأعمال قبل الركاب" },
    { name: "منصة تعلم الأكواد بالعربية", type: "ويب", color: "#10b981", desc: "مشروع مفتوح المصدر لتعليم البرمجة للمبتدئين بلغة عربية مُبسطة" },
  ];
 
  const skills = profileSkills;
 
  return (
    <div className="min-h-screen bg-white">
      {/* Profile Banner */}
      <div className="h-28" style={{ background: "linear-gradient(135deg, #e35654 0%, #cc4a48 100%)" }} />
 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 -mt-8 mb-6 shadow-sm">
          <div className="flex items-end gap-5">
            <div
              className="w-20 h-20 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white -mt-14 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #e35654 0%, #cc4a48 100%)", fontWeight: 800, fontSize: "1.5rem" }}
            >
              {profileName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.6rem" }}>{profileName}</h1>
              <p className="text-gray-600 text-sm">{profileTitle}</p>
              <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {profileLocation}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 pb-1">
              <button
                onClick={openEditModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Settings className="w-3.5 h-3.5" />
                تعديل
              </button>
              <button
                onClick={() => setShowAchievementModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Award className="w-3.5 h-3.5" />
                نشر إنجاز
              </button>
            </div>
          </div>
 
          {/* Skills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs" style={{ fontWeight: 500 }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
 
        {/* ── Edit Profile Modal ─────────────────────────────────────────── */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" dir="rtl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#e35654]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#e35654]" />
                  </div>
                  <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>تعديل الملف الشخصي</span>
                </div>
                <button onClick={() => setShowEditModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
 
              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>الاسم الكامل</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                {/* Title */}
                <div>
                  <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>المسمى الوظيفي / التخصص</label>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                    placeholder="مثال: مطور واجهات أمامية | خبير تقنية"
                  />
                </div>
                {/* Location */}
                <div>
                  <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>الموقع الجغرافي</label>
                  <input
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                    placeholder="مثال: الرياض، المملكة العربية السعودية"
                  />
                </div>
                {/* Skills */}
                <div>
                  <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>المهارات</label>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[36px] p-2 rounded-xl border border-gray-200 bg-gray-50">
                    {editSkillsTemp.map((sk, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-xs" style={{ fontWeight: 500 }}>
                        {sk}
                        <button
                          onClick={() => setEditSkillsTemp(editSkillsTemp.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-[#e35654] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={editNewSkill}
                      onChange={e => setEditNewSkill(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && editNewSkill.trim()) {
                          setEditSkillsTemp([...editSkillsTemp, editNewSkill.trim()]);
                          setEditNewSkill("");
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                      placeholder="أضف مهارة جديدة..."
                    />
                    <button
                      onClick={() => {
                        if (editNewSkill.trim()) {
                          setEditSkillsTemp([...editSkillsTemp, editNewSkill.trim()]);
                          setEditNewSkill("");
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[#e35654]/10 text-[#e35654] text-xs hover:bg-[#e35654]/20 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">اضغط Enter أو زر + لإضافة المهارة</p>
                </div>
              </div>
 
              {/* Footer */}
              <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={saveProfile}
                  className="flex-1 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
 
        {/* ── Add Achievement Modal ──────────────────────────────────────── */}
        {showAchievementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" dir="rtl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#e35654]/10 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-[#e35654]" />
                  </div>
                  <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>نشر إنجاز جديد</span>
                </div>
                <button onClick={() => setShowAchievementModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
 
              {/* Body */}
              {achievementSaved ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="text-gray-800 text-sm" style={{ fontWeight: 700 }}>تم نشر الإنجاز بنجاح!</p>
                  <p className="text-gray-400 text-xs">سيظهر في ملفك الشخصي الآن</p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4">
                  {/* Achievement Type */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>نوع الإنجاز</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["المركز الأول 🥇", "المركز الثاني 🥈", "المركز الثالث 🥉", "مشاركة مميزة ⭐", "جائزة خاصة 🏆", "شهادة إتمام 📜"].map(type => (
                        <button
                          key={type}
                          onClick={() => setAchievementType(type)}
                          className={`py-2 px-2 rounded-xl border text-xs transition-colors text-center ${achievementType === type ? "border-[#e35654] bg-[#fef2f2] text-[#e35654]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                          style={{ fontWeight: achievementType === type ? 600 : 400 }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Title */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>عنوان الإنجاز</label>
                    <input
                      value={achievementTitle}
                      onChange={e => setAchievementTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                      placeholder="م��ال: الفوز بهاكاثون الذكاء الاصطناعي الوطني"
                    />
                  </div>
                  {/* Hackathon Name */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>اسم الهاكاثون / الفعالية</label>
                    <input
                      value={achievementHackathon}
                      onChange={e => setAchievementHackathon(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                      placeholder="مثال: هاكاثون مُمكّن للابتكار 2024"
                    />
                  </div>
                  {/* Date */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>تاريخ الإنجاز</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={achievementDate}
                        onChange={e => setAchievementDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors cursor-pointer appearance-none bg-white"
                        dir="ltr"
                        style={{ colorScheme: "light" }}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    {achievementDate && (
                      <p className="text-[#e35654] text-xs mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {new Date(achievementDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  {/* Description */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>وصف مختصر <span className="text-gray-400 font-normal">(اختياري)</span></label>
                    <textarea
                      value={achievementDesc}
                      onChange={e => setAchievementDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors resize-none"
                      placeholder="اكتب تفاصيل إضافية عن إنجازك..."
                    />
                  </div>
                  {/* File Upload */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 block" style={{ fontWeight: 600 }}>
                      إرفاق ملف / شهادة <span className="text-gray-400 font-normal">(اختياري)</span>
                    </label>
                    <label
                      className={`flex flex-col items-center justify-center gap-2 w-full py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                        achievementFile ? "border-[#e35654] bg-[#fef2f2]" : "border-gray-200 bg-gray-50 hover:border-[#e35654] hover:bg-[#fef9f9]"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) setAchievementFile(f);
                        }}
                      />
                      {achievementFile ? (
                        <>
                          <div className="w-9 h-9 rounded-xl bg-[#e35654]/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#e35654]" />
                          </div>
                          <p className="text-[#e35654] text-xs text-center" style={{ fontWeight: 600 }}>{achievementFile.name}</p>
                          <p className="text-gray-400 text-xs">{(achievementFile.size / 1024).toFixed(0)} KB</p>
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); setAchievementFile(null); }}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> إزالة الملف
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-gray-600 text-xs text-center" style={{ fontWeight: 500 }}>اسحب الملف هنا أو <span className="text-[#e35654]">اختر من جهازك</span></p>
                          <p className="text-gray-400 text-xs">PDF، صورة، أو Word — بحد أقصى 10MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}
 
              {/* Footer */}
              {!achievementSaved && (
                <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={saveAchievement}
                    disabled={!achievementTitle.trim() || !achievementHackathon.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontWeight: 600 }}
                  >
                    نشر الإنجاز
                  </button>
                  <button
                    onClick={() => setShowAchievementModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
 
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Sidebar */}
          <div className="space-y-5">
            {/* Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-900 mb-4 text-sm" style={{ fontWeight: 700 }}>إحصائيات المشاركة</h3>
              <div className="grid grid-cols-2 gap-3">
                {profileStats.map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl" style={{ background: "#fef2f2" }}>
                    <p className="text-xl mb-1">{s.icon}</p>
                    <p className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{s.value}</p>
                    <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Awards */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-gray-900 mb-4 text-sm" style={{ fontWeight: 700 }}>الجوائز والشهادات</h3>
              <div className="space-y-3">
                {[
                  { title: "المركز الأول - هاكاثون الطاقة", sub: "وزارة الاقتصاد والتقنية المعلومات", icon: "🏆" },
                  { title: "أفضل مطور واجهات 2023", sub: "منصة الأكواد المنفتحة", icon: "🎖️" },
                ].map((award, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-xl flex-shrink-0">{award.icon}</span>
                    <div>
                      <p className="text-gray-900 text-xs" style={{ fontWeight: 600 }}>{award.title}</p>
                      <p className="text-gray-400" style={{ fontSize: "0.65rem" }}>{award.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>روابط سريعة</h3>
                <button
                  onClick={openLinksModal}
                  className="text-xs text-[#e35654] hover:underline flex items-center gap-1"
                  style={{ fontWeight: 500 }}
                >
                  <Pencil className="w-3 h-3" /> تعديل
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={openLinksModal}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-right group"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600 text-xs">{personalLink || "الرابط الشخصي"}</span>
                  </div>
                  {personalLink && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
                </button>
                <button
                  onClick={openLinksModal}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-right"
                >
                  <div className="flex items-center gap-2">
                    <Github className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600 text-xs">{githubLink || "GitHub Profile"}</span>
                  </div>
                  {githubLink && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
                </button>
                <button
                  onClick={openLinksModal}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-right"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600 text-xs">{cvFile ? cvFile.name : "السيرة الذاتية (PDF)"}</span>
                  </div>
                  {cvFile && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
                </button>
              </div>
            </div>
          </div>
 
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.split(" ")[0])}
                  className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab.split(" ")[0]
                      ? "border-[#e35654] text-[#e35654]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  style={{ fontWeight: activeTab === tab.split(" ")[0] ? 700 : 400 }}
                >
                  {tab}
                </button>
              ))}
            </div>
 
            {/* ── الهاكاثونات Tab ── */}
            {activeTab === "الهاكاثونات" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>الهاكاثونات الأخيرة</h3>
                  <button
                    onClick={() => setShowAllHackathons(v => !v)}
                    className="text-[#e35654] text-xs hover:underline flex items-center gap-1"
                    style={{ fontWeight: 500 }}
                  >
                    {showAllHackathons ? "عرض أقل ▲" : "عرض الكل ▼"}
                  </button>
                </div>
                <div className="space-y-3">
                  {(showAllHackathons
                    ? [
                        ...recentHackathons,
                        { name: "هاكاثون المدن الذكية 2023", date: "مارس 2023", status: "مكتمل", rank: "🥈 المركز الثاني" },
                        { name: "تحدي الصحة الرقمية", date: "أكتوبر 2022", status: "مكتمل", rank: "مشاركة مميزة ⭐" },
                      ]
                    : recentHackathons
                  ).map((h, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-[#e35654]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{h.name}</h4>
                        <p className="text-gray-400 text-xs">{h.date}</p>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#f0fdf4] text-green-700" style={{ fontWeight: 600 }}>
                          {h.status}
                        </span>
                        <p className="text-[#e35654] text-xs mt-1" style={{ fontWeight: 600 }}>{h.rank}</p>
                      </div>
                    </div>
                  ))}
                </div>
 
                {/* Featured Projects */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>أبرز المشاريع</h3>
                    <button
                      onClick={() => setActiveTab("المشاريع")}
                      className="text-[#e35654] text-xs hover:underline"
                      style={{ fontWeight: 500 }}
                    >
                      عرض الكل
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {projects.map((proj, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                        <div className="h-24 flex items-center justify-center" style={{ background: proj.color + "15" }}>
                          <span className="text-xs px-2.5 py-1 rounded-full text-white" style={{ background: proj.color, fontWeight: 600 }}>
                            {proj.type}
                          </span>
                        </div>
                        <div className="p-4">
                          <h4 className="text-gray-900 text-sm mb-1" style={{ fontWeight: 600 }}>{proj.name}</h4>
                          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{proj.desc}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => toggleStar(i)}
                              className={`p-1.5 rounded-lg transition-colors ${starredProjects.has(i) ? "bg-yellow-50 text-yellow-500" : "hover:bg-gray-100 text-gray-400"}`}
                              title="تفضيل المشروع"
                            >
                              <Star className={`w-3.5 h-3.5 ${starredProjects.has(i) ? "fill-yellow-400" : ""}`} />
                            </button>
                            <button
                              onClick={() => openProjectLink(i)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                              title="نسخ رابط المشروع"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
 
            {/* ── المشاريع Tab ── */}
            {activeTab === "المشاريع" && (
              <div className="grid grid-cols-2 gap-4">
                {projects.map((proj, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <div className="h-24 flex items-center justify-center" style={{ background: proj.color + "15" }}>
                      <span className="text-xs px-2.5 py-1 rounded-full text-white" style={{ background: proj.color, fontWeight: 600 }}>
                        {proj.type}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="text-gray-900 text-sm mb-1" style={{ fontWeight: 600 }}>{proj.name}</h4>
                      <p className="text-gray-400 text-xs">{proj.desc}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => toggleStar(i)}
                          className={`p-1.5 rounded-lg transition-colors ${starredProjects.has(i) ? "bg-yellow-50 text-yellow-500" : "hover:bg-gray-100 text-gray-400"}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${starredProjects.has(i) ? "fill-yellow-400" : ""}`} />
                        </button>
                        <button
                          onClick={() => openProjectLink(i)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* ── الجوائز Tab ── */}
            {activeTab === "الجوائز" && (
              <div className="space-y-3">
                {[
                  { icon: "🥇", title: "المركز الأول - هاكاثون الذكاء الاصطناعي 2024", event: "هاكاثون الذكاء الاصطناعي الوطني", date: "فبراير 2024", color: "#fef9c3", border: "#fde68a" },
                  { icon: "🏆", title: "المركز الأول - هاكاثون الطاقة المتجددة", event: "وزارة الاقتصاد والتقنية المعلومات", date: "نوفمبر 2023", color: "#fef9c3", border: "#fde68a" },
                  { icon: "🎖️", title: "أفضل مطور واجهات 2023", event: "منصة الأكواد المنفتحة", date: "سبتمبر 2023", color: "#f0fdf4", border: "#bbf7d0" },
                  { icon: "⭐", title: "مشاركة مميزة - تحدي الصحة الرقمية", event: "وزارة الصحة السعودية", date: "أكتوبر 2022", color: "#fef2f2", border: "#fecaca" },
                ].map((a, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: a.color, border: `1px solid ${a.border}` }}>
                      {a.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{a.title}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">{a.event}</p>
                    </div>
                    <div className="flex-shrink-0 text-left">
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{a.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* ── التحديثات Tab ── */}
            {activeTab === "التحديثات" && (
              <div className="space-y-3">
                {[
                  { icon: "🚀", title: "انضم إلى هاكاثون الذكاء الاصطناعي 2024", time: "منذ 3 أيام", color: "#fef2f2" },
                  { icon: "🏆", title: "حصل على المركز الأول في هاكاثون الطاقة", time: "منذ 3 أشهر", color: "#fef9c3" },
                  { icon: "📁", title: "أضاف مشروع \"منصة تعلم الأكواد بالعربية\"", time: "منذ 5 أشهر", color: "#f0fdf4" },
                  { icon: "⭐", title: "حقّق نسبة إنجاز 95% في مشاريعه", time: "منذ 6 أشهر", color: "#f5f3ff" },
                  { icon: "🎯", title: "انضم إلى منصة مُمكّن", time: "منذ سنة", color: "#f0f9ff" },
                ].map((u, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: u.color }}>
                      {u.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm" style={{ fontWeight: 500 }}>{u.title}</p>
                    </div>
                    <span className="text-gray-400 text-xs flex-shrink-0">{u.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          {/* ── Quick Links Modal ── */}
          {showLinksModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#e35654]/10 flex items-center justify-center">
                      <Link2 className="w-4 h-4 text-[#e35654]" />
                    </div>
                    <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>تعديل الروابط السريعة</span>
                  </div>
                  <button onClick={() => setShowLinksModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {/* Personal Link */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 flex items-center gap-1.5 block" style={{ fontWeight: 600 }}>
                      <Link2 className="w-3.5 h-3.5 text-gray-400" /> الرابط الشخصي
                    </label>
                    <input
                      value={editPersonalLink}
                      onChange={e => setEditPersonalLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                      placeholder="https://myportfolio.com"
                      dir="ltr"
                    />
                  </div>
                  {/* GitHub */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 flex items-center gap-1.5 block" style={{ fontWeight: 600 }}>
                      <Github className="w-3.5 h-3.5 text-gray-400" /> GitHub Profile
                    </label>
                    <input
                      value={editGithubLink}
                      onChange={e => setEditGithubLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#e35654] transition-colors"
                      placeholder="https://github.com/username"
                      dir="ltr"
                    />
                  </div>
                  {/* CV Upload */}
                  <div>
                    <label className="text-gray-700 text-xs mb-1.5 flex items-center gap-1.5 block" style={{ fontWeight: 600 }}>
                      <FileText className="w-3.5 h-3.5 text-gray-400" /> السيرة الذاتية (PDF)
                    </label>
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${editCvFileTemp ? "border-[#e35654] bg-[#fef2f2]" : "border-gray-200 bg-gray-50 hover:border-[#e35654]"}`}>
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setEditCvFileTemp(f); }} />
                      {editCvFileTemp ? (
                        <>
                          <FileText className="w-5 h-5 text-[#e35654] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[#e35654] text-xs truncate" style={{ fontWeight: 600 }}>{editCvFileTemp.name}</p>
                            <p className="text-gray-400 text-xs">{(editCvFileTemp.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button type="button" onClick={e => { e.preventDefault(); setEditCvFileTemp(null); }} className="text-gray-300 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <p className="text-gray-500 text-xs">اختر ملف السيرة الذاتية <span className="text-[#e35654]">أو اسحبه هنا</span></p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                  {linksSaved ? (
                    <div className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 text-sm flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> تم الحفظ!
                    </div>
                  ) : (
                    <button onClick={saveLinks} className="flex-1 py-2.5 rounded-xl bg-[#e35654] text-white text-sm hover:bg-[#cc4a48] transition-colors" style={{ fontWeight: 600 }}>
                      حفظ الروابط
                    </button>
                  )}
                  <button onClick={() => setShowLinksModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
 
          {/* ── Project Link Modal ── */}
          {showProjectLinkModal && selectedProjectIdx !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" dir="rtl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: projects[selectedProjectIdx].color + "20" }}>
                      <Link2 className="w-4 h-4" style={{ color: projects[selectedProjectIdx].color }} />
                    </div>
                    <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>رابط المشروع</span>
                  </div>
                  <button onClick={() => setShowProjectLinkModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 py-5">
                  <p className="text-gray-500 text-xs mb-3">{projects[selectedProjectIdx].name}</p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="flex-1 text-gray-600 text-xs truncate" dir="ltr">
                      https://mumkin.sa/projects/{selectedProjectIdx + 1}
                    </span>
                    <button
                      onClick={copyProjectLink}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 flex-shrink-0 ${linkCopied ? "bg-green-50 text-green-600" : "bg-[#e35654] text-white hover:bg-[#cc4a48]"}`}
                      style={{ fontWeight: 600 }}
                    >
                      {linkCopied ? (<><CheckCircle className="w-3 h-3" /> تم النسخ</>) : (<><Link2 className="w-3 h-3" /> نسخ</>)}
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-5">
                  <button onClick={() => setShowProjectLinkModal(false)} className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
// ─── Main Component ───────────────────────────────────────────────────────────
export function ParticipantDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
 
  // Derive initial view from pathname
  const deriveView = (): View => {
    const seg = location.pathname.replace(/\/$/, "").split("/");
    const rest = seg[2] ?? "";
    if (rest === "workspace") return "workspaces";
    if (rest === "profile") return "profile";
    return (location.state as { view?: View } | null)?.view ?? "home";
  };
 
  const [view, setView] = useState<View>(deriveView);
  const [selectedHackathon, setSelectedHackathon] = useState<typeof myHackathons[0] | null>(null);
 
  // Re-sync when pathname changes (e.g. navbar navigation)
  useEffect(() => {
    setView(deriveView());
  }, [location.pathname]);
 
  return (
    <>
      <main>
        {view === "home" && <HomeView setView={setView} />}
        {view === "hackathons" && <HackathonsView />}
        {view === "workspaces" && <WorkspacesListView setView={setView} setSelectedHackathon={setSelectedHackathon} />}
        {view === "workspace" && <WorkspaceView setView={setView} hackathon={selectedHackathon} />}
        {view === "profile" && <ProfileView setView={setView} />}
      </main>
    </>
  );
}