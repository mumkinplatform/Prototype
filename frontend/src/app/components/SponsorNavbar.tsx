import { useNavigate, Link } from "react-router";
import { Search, Bell, MessageCircle, Sparkles } from "lucide-react";

export type SponsorNavPage =
  | "home"
  | "sponsorships"
  | "opportunities"
  | "payments"
  | "messages"
  | "notifications"
  | "profile";

interface SponsorNavbarProps {
  /** الصفحة الحالية لتحديد الزر النشط */
  activePage: SponsorNavPage;
  /** عند النقر على الـ Avatar */
  onAvatarClick?: () => void;
}

const NAV_ITEMS: { label: string; page: SponsorNavPage; path: string }[] = [
  { label: "الرئيسية", page: "home", path: "/sponsor" },
  { label: "رعاياتي", page: "sponsorships", path: "/sponsor/sponsorships" },
  { label: "فرص الرعاية", page: "opportunities", path: "/sponsor/opportunities" },
  { label: "المدفوعات", page: "payments", path: "/sponsor/payments" },
  { label: "الرسائل", page: "messages", path: "/sponsor/messages" },
];

export function SponsorNavbar({ activePage, onAvatarClick }: SponsorNavbarProps) {
  const navigate = useNavigate();

  const handleAvatar = () => {
    if (onAvatarClick) {
      onAvatarClick();
    } else {
      navigate("/sponsor");
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo - يروح للصفحة الرئيسية */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-[#e35654] flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
            مُمكّن
          </span>
        </Link>

        {/* Nav pills (centered) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                  active
                    ? 'bg-[#e35654]/10 text-[#e35654]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={{ fontWeight: active ? 600 : 400 }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ── Actions (left side in RTL) ── */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              placeholder="ابحث..."
              className="pr-9 pl-4 py-2 rounded-xl border border-gray-100 bg-gray-50 text-xs w-36 focus:outline-none focus:border-[#e35654] focus:bg-white focus:w-44 transition-all duration-200"
            />
          </div>

          {/* Messages */}
          <button
            onClick={() => navigate("/sponsor/messages")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[#fef2f2] text-gray-400 hover:text-[#e35654]"
            style={{ border: "1px solid #f3f4f6" }}
          >
            <MessageCircle className="w-4 h-4" />
            <span
              className="absolute top-1 right-1 w-4 h-4 bg-[#e35654] rounded-full text-white flex items-center justify-center"
              style={{ fontSize: 9, fontWeight: 700 }}
            >
              7
            </span>
          </button>

          {/* Bell */}
          <button
            onClick={() => navigate("/sponsor/notifications")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[#fef2f2] text-gray-400 hover:text-[#e35654]"
            style={{ border: "1px solid #f3f4f6" }}
          >
            <Bell className="w-4 h-4" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: "#e35654" }}
            />
          </button>

          {/* Avatar */}
          <button
            onClick={() => navigate("/sponsor/profile")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg,#e35654 0%,#cc4a48 100%)",
              fontWeight: 800,
              fontSize: "0.8rem",
              boxShadow: "0 4px 10px rgba(227,86,84,0.3)",
            }}
          >
            ش
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ background: "#10b981" }}
            />
          </button>
        </div>

        {/* ── Mobile Nav ── */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.path)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  fontWeight: active ? 700 : 500,
                  color: active ? "#e35654" : "#6b7280",
                  background: active ? "#fef2f2" : "transparent",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}