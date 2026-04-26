import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Menu, X, Sparkles, LogIn, Home, LayoutDashboard, Handshake, Users } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "الرئيسية", path: "/", icon: Home },
  { label: "عن المنصة", path: "/#about-section", icon: LayoutDashboard },
  { label: "الخدمات", path: "/#services", icon: Handshake },
  { label: "تواصل معنا", path: "/#contact", icon: Users },
];

// Pages where footer should be hidden (fullscreen layouts)
const noFooterPaths = ["/messages", "/sponsor/messages"];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hideFooter = noFooterPaths.includes(location.pathname);

  // Handle logo click - scroll to top if already on homepage
  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#fafaf9] font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#a41b42] flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
              مُمكّن
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active =
                link.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.path.split('#')[0]) && !link.path.includes('#');
              
              const handleClick = () => {
                if (link.path.includes('#')) {
                  navigate('/');
                  setTimeout(() => {
                    const id = link.path.split('#')[1];
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  navigate(link.path);
                }
              };
              
              return (
                <button
                  key={link.path}
                  onClick={handleClick}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? "bg-[#a41b42]/10 text-[#a41b42]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  style={{ fontWeight: active ? 600 : 400 }}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="px-5 py-2 rounded-xl text-[#a41b42] text-sm border border-[#a41b42] hover:bg-[#a41b42]/10 transition-all duration-200"
              style={{ fontWeight: 500 }}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#a41b42] text-white text-sm shadow-sm hover:bg-[#8b1538] transition-all duration-200"
              style={{ fontWeight: 500 }}
            >
              ابدأ الآن
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2 flex flex-col gap-1">
            {navLinks.map((link) => {
              const active =
                link.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-right transition-all duration-200 ${
                    active
                      ? "bg-[#a41b42]/10 text-[#a41b42]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{ fontWeight: active ? 600 : 400 }}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                navigate("/auth");
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#a41b42] text-white text-sm mt-2"
              style={{ fontWeight: 500 }}
            >
              <LogIn className="w-4 h-4" />
              دخول / تسجيل
            </button>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer — hidden on fullscreen pages */}
      {!hideFooter && (
        <footer className="bg-white border-t border-gray-100 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#a41b42] flex items-center justify-center">
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
      )}
    </div>
  );
}