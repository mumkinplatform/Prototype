import { Outlet, useLocation, Navigate } from "react-router";
import { ParticipantNavbar, type ParticipantNavPage } from "./ParticipantNavbar";
import { Sparkles } from "lucide-react";
import { getUser } from "../../lib/auth";

/** Maps pathname segments to ParticipantNavbar active page */
function getActivePage(pathname: string): ParticipantNavPage {
  const segments = pathname.replace(/\/$/, "").split("/");
  // segments: ["", "participant", ...rest]
  const rest = segments.slice(2); // everything after "participant"
  const first = rest[0] ?? "";

  switch (first) {
    case "hackathons":
    case "hackathon":
      return "hackathons";
    case "workspace":
      return "workspace";
    case "profile":
      return "profile";
    case "notifications":
    case "messages":
    case "matchmaking":
      return "home";
    default:
      return "home";
  }
}

export function ParticipantLayout() {
  const { pathname } = useLocation();
  const activePage = getActivePage(pathname);

  const user = getUser();
  if (!user || user.role !== "participant") {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-white to-gray-50 font-sans flex flex-col">
      <ParticipantNavbar activePage={activePage} />
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e35654] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700" style={{ fontWeight: 600 }}>
                مُمكّن
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 مُمكّن — منصة الهاكاثونات الرقمية. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}