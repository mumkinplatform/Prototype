import { Link, useNavigate } from 'react-router';
import { Search, Bell, Sparkles, LogOut } from 'lucide-react';
import { clearAuth } from '../../lib/auth';

export type AdminNavPage = 'home' | 'hackathons' | 'analytics';

interface AdminNavbarProps {
  activePage?: AdminNavPage;
}

export function AdminNavbar({ activePage = 'home' }: AdminNavbarProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    clearAuth();
    navigate('/');
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

        {/* Nav Items */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
              activePage === 'home'
                ? 'bg-[#e35654]/10 text-[#e35654]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            style={{ fontWeight: activePage === 'home' ? 600 : 400 }}
          >
            الرئيسية
          </Link>

          <Link
            to="/admin/my-hackathons"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
              activePage === 'hackathons'
                ? 'bg-[#e35654]/10 text-[#e35654]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            style={{ fontWeight: activePage === 'hackathons' ? 600 : 400 }}
          >
            إدارة الهاكاثونات
          </Link>

          <Link
            to="/admin/analytics"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
              activePage === 'analytics'
                ? 'bg-[#e35654]/10 text-[#e35654]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            style={{ fontWeight: activePage === 'analytics' ? 600 : 400 }}
          >
            التقارير
          </Link>
        </nav>

        {/* Actions (Left side) */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              placeholder="ابحث..."
              className="pr-9 pl-4 py-2 rounded-xl border border-gray-100 bg-gray-50 text-xs w-36 focus:outline-none focus:border-[#e35654] focus:bg-white focus:w-44 transition-all duration-200"
            />
          </div>

          {/* Bell */}
          <Link
            to="/admin/notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[#fef2f2] text-gray-400 hover:text-[#e35654]"
            style={{ border: '1px solid #f3f4f6' }}
          >
            <Bell className="w-4 h-4" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: '#e35654' }}
            />
          </Link>

          {/* Avatar */}
          <Link
            to="/admin/profile"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg,#e35654 0%,#cc4a48 100%)',
              fontWeight: 800,
              fontSize: '0.8rem',
              boxShadow: '0 4px 10px rgba(227,86,84,0.3)',
            }}
          >
            م
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ background: '#10b981' }}
            />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:bg-[#fef2f2] hover:text-[#e35654]"
            style={{ border: '1px solid #f3f4f6' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}