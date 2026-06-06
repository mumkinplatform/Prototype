import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { Bell, Sparkles, LogOut } from "lucide-react";
import { clearAuth } from "../../lib/auth";
import { apiGet, API_URL } from "../../lib/api";

interface ApiNotificationStub {
  id: number;
  read: boolean;
}

interface ApiMeProfile {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

/** Converts a relative avatar path (e.g. /uploads/...) to an absolute URL. */
function resolveAvatarUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}

export type ParticipantNavPage = "home" | "hackathons" | "workspace" | "profile";

interface ParticipantNavbarProps {
  /** Current page/view used to highlight the active nav item. */
  activePage: ParticipantNavPage;
  /**
   * If provided, called instead of navigate() when nav buttons are clicked.
   * Useful for the Dashboard which controls its view internally.
   */
  onNavigate?: (page: ParticipantNavPage) => void;
  /** Called when the avatar is clicked (defaults to navigate("/participant")). */
  onAvatarClick?: () => void;
}

const NAV_ITEMS: { label: string; page: ParticipantNavPage }[] = [
  { label: "الرئيسية", page: "home" },
  { label: "الهاكاثونات", page: "hackathons" },
  { label: "مساحة العمل", page: "workspace" },
];

export function ParticipantNavbar({
  activePage,
  onNavigate,
  onAvatarClick,
}: ParticipantNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ApiNotificationStub[] }>("/participants/notifications")
      .then((data) => {
        if (cancelled) return;
        setUnreadCount(data.items.filter((n) => !n.read).length);
      })
      .catch(() => {
        if (cancelled) return;
        setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  // Fetch first name and avatar — refetches when the path changes
  // (so profile edits appear in the navbar quickly)
  useEffect(() => {
    let cancelled = false;
    apiGet<ApiMeProfile>("/participants/me")
      .then((data) => {
        if (cancelled) return;
        setFirstName(data.firstName);
        setAvatarUrl(data.avatarUrl);
      })
      .catch(() => { /* ignore — fallback initial */ });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const avatarInitial = (firstName?.trim().charAt(0)) || "؟";
  const resolvedAvatar = resolveAvatarUrl(avatarUrl);

  const handleNav = (page: ParticipantNavPage) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      if (page === "hackathons") navigate("/participant/hackathons");
      else if (page === "workspace") navigate("/participant/workspace");
      else if (page === "profile") navigate("/participant/profile");
      else navigate("/participant");
    }
  };

  const handleAvatar = () => {
    if (onAvatarClick) {
      onAvatarClick();
    } else {
      navigate("/participant/profile");
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo links to landing */}
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
                onClick={() => handleNav(item.page)}
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

        {/* ── Actions (left in RTL) ── */}
        <div className="flex items-center gap-1.5">
          {/* Bell */}
          <button
            onClick={() => navigate("/participant/notifications")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[#fef2f2] text-gray-400 hover:text-[#e35654]"
            style={{ border: "1px solid #f3f4f6" }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
                style={{ background: "#e35654" }}
              />
            )}
          </button>

          {/* Avatar */}
          <button
            onClick={handleAvatar}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg,#e35654 0%,#cc4a48 100%)",
              fontWeight: 800,
              fontSize: "0.8rem",
              boxShadow: "0 4px 10px rgba(227,86,84,0.3)",
            }}
            title={firstName ?? "الملف الشخصي"}
          >
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt={firstName ?? ""}
                className="absolute inset-0 w-full h-full object-cover rounded-xl"
              />
            ) : (
              avatarInitial
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white z-10"
              style={{ background: "#10b981" }}
            />
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              clearAuth();
              navigate("/");
            }}
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:bg-[#fef2f2] hover:text-[#e35654]"
            style={{ border: "1px solid #f3f4f6" }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}