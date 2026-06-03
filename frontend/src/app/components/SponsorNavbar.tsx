import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { Bell, Sparkles, LogOut } from "lucide-react";
import { clearAuth } from "../../lib/auth";
import { apiGet } from "../../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface MeShape {
  fullName?: string;
  brandName?: string | null;
  avatar?: string | null;
}

export type SponsorNavPage =
  | "home"
  | "sponsorships"
  | "opportunities"
  | "messages"
  | "notifications"
  | "profile";

interface SponsorNavbarProps {
  /** Current page, used to highlight the active button */
  activePage: SponsorNavPage;
}

const NAV_ITEMS: { label: string; page: SponsorNavPage; path: string }[] = [
  { label: "الرئيسية", page: "home", path: "/sponsor" },
  { label: "رعاياتي", page: "sponsorships", path: "/sponsor/sponsorships" },
  { label: "فرص الرعاية", page: "opportunities", path: "/sponsor/opportunities" },
  { label: "الرسائل", page: "messages", path: "/sponsor/messages" },
];

export function SponsorNavbar({ activePage }: SponsorNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarLetter, setAvatarLetter] = useState<string>("ش");
  const [unreadCount, setUnreadCount] = useState(0);

  // Refetch unread on every route change so the badge clears the moment the
  // sponsor opens /sponsor/notifications (which auto-marks-all-read on mount).
  useEffect(() => {
    apiGet<{ items: { read?: boolean }[] }>("/sponsors/notifications")
      .then((data) => setUnreadCount(data.items.filter((n) => !n.read).length))
      .catch(() => setUnreadCount(0));
  }, [location.pathname]);

  // While the sponsor is on the notifications page itself, hide the dot — the
  // inbox is open so the signal would just be noise.
  const showDot = unreadCount > 0 && location.pathname !== "/sponsor/notifications";

  // Fetch the avatar from the API + listen for any image update from the profile
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<MeShape>("/sponsors/me");
        if (cancelled) return;
        setAvatar(data.avatar ?? null);
        const letter =
          (data.brandName?.trim()[0] || data.fullName?.trim()[0] || "ش").toUpperCase();
        setAvatarLetter(letter);
      } catch {
        // Ignore the error — the default letter is enough
      }
    };
    load();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ avatar?: string | null }>).detail;
      if (detail && "avatar" in detail) {
        setAvatar(detail.avatar ?? null);
      }
    };
    window.addEventListener("mumkin:avatar-updated", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("mumkin:avatar-updated", handler);
    };
  }, []);

  const avatarUrl = avatar ? `${API_URL}/uploads/avatars/${avatar}` : null;

  const handleConfirmLogout = () => {
    clearAuth();
    navigate("/");
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
          {/* Notifications bell */}
          <button
            onClick={() => navigate("/sponsor/notifications")}
            title="الإشعارات"
            aria-label="الإشعارات"
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activePage === "notifications"
                ? "bg-[#fef2f2] text-[#e35654]"
                : "text-gray-400 hover:bg-[#fef2f2] hover:text-[#e35654]"
            }`}
            style={{ border: "1px solid #f3f4f6" }}
          >
            <Bell className="w-4 h-4" />
            {showDot && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
                style={{ background: "#e35654" }}
              />
            )}
          </button>

          {/* Avatar */}
          <button
            onClick={() => navigate("/sponsor/profile")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105 overflow-hidden"
            style={{
              background: avatarUrl
                ? "transparent"
                : "linear-gradient(135deg,#e35654 0%,#cc4a48 100%)",
              fontWeight: 800,
              fontSize: "0.8rem",
              boxShadow: "0 4px 10px rgba(227,86,84,0.3)",
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              avatarLetter
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => setConfirmingLogout(true)}
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:bg-[#fef2f2] hover:text-[#e35654]"
            style={{ border: "1px solid #f3f4f6" }}
          >
            <LogOut className="w-4 h-4" />
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

      {/* Logout Confirmation Dialog */}
      {confirmingLogout && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setConfirmingLogout(false)}
        >
          <div
            dir="rtl"
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-[#e35654]" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                  تسجيل الخروج
                </h3>
                <p className="text-sm text-gray-500">
                  هل أنت متأكد من تسجيل الخروج من حسابك؟
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingLogout(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
                style={{ fontWeight: 600 }}
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl text-sm text-white bg-[#e35654] hover:bg-[#cc4a48]"
                style={{ fontWeight: 600 }}
              >
                نعم، سجّل خروجي
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}