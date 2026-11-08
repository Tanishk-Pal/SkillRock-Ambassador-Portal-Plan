import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
  LogOut,
  Award,
  User as UserIcon,
  Menu,
  X,
  LayoutDashboard,
  CheckSquare,
  Info,
  BarChart3,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface HeaderProps {
  score?: number;
}

export const Header: React.FC<HeaderProps> = ({ score }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const displayScore = score !== undefined ? score : user?.totalPoints || 0;
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    (user?.role as string) === 'super_admin';

  // Close mobile menu whenever navigation occurs
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Close drawer on window resize to desktop breakpoint (>=1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'About & Rewards', path: '/about', icon: Info },
    { name: 'Leaderboard', path: '/leaderboard', icon: BarChart3 },
    { name: 'My Sales', path: '/my-sales', icon: TrendingUp },
    { name: 'My Points', path: '/my-points', icon: Award },
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Admin', path: '/admin/dashboard', icon: Shield },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left: Mobile Hamburger Toggle + Brand Identity */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors focus:outline-none flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
              )}
            </button>

            {/* Brand Logo & Name */}
            <Link
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className="flex items-center gap-1.5 sm:gap-3 group min-w-0 flex-shrink-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-xs border border-slate-200/80 bg-white p-0.5 sm:p-1 flex items-center justify-center flex-shrink-0">
                <img src="/logo.jpg" alt="SkillRock Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-baseline">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                  Skill<span className="text-orange-500">Rock</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {isAdmin ? 'Admin Console' : 'Student Ambassador'}
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Score Pill & Profile / Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-all border border-slate-700 flex-shrink-0"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="hidden sm:inline">Admin Console</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            ) : (
              /* Compact Adaptive Score Pill */
              <Link
                to="/my-points"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex-shrink-0"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  <strong className="font-bold">{displayScore.toLocaleString()}</strong>{' '}
                  <span className="text-[10px] sm:text-xs opacity-90">pts</span>
                </span>
              </Link>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 flex-shrink-0">
              <Link
                to={isAdmin ? '/admin/dashboard' : '/profile'}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                title="View Profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs flex-shrink-0">
                  {user?.name ? user.name.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user?.name || (isAdmin ? 'SSAP Admin' : 'Ambassador')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono font-medium">
                    {isAdmin ? 'Editor' : user?.srid || 'SR0000'}
                  </p>
                </div>
              </Link>

              {/* Logout Button: hidden on mobile (<sm:) since drawer contains full logout action */}
              <button
                onClick={logout}
                className="hidden sm:flex p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION SLIDE-OUT DRAWER */}
      <div
        className={`lg:hidden fixed inset-0 z-50 overflow-hidden ${
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        data-testid="mobile-drawer"
        data-state={mobileMenuOpen ? 'open' : 'closed'}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Close navigation backdrop"
        />

        {/* Slide-out Panel from Left */}
        <aside
          className={`fixed top-0 bottom-0 left-0 w-72 sm:w-80 max-w-[85vw] h-full bg-white shadow-2xl z-10 flex flex-col transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header with Ambassador Details */}
          <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center font-extrabold text-sm uppercase shadow-inner flex-shrink-0">
                {user?.name ? user.name.charAt(0) : <UserIcon className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm leading-tight text-white truncate">
                  {user?.name || (isAdmin ? 'SSAP Admin' : 'Ambassador')}
                </h3>
                <p className="text-xs text-blue-100 font-mono font-semibold truncate">
                  {isAdmin
                    ? 'Administrator Role'
                    : `SRID: ${user?.srid || 'SR0000'} • Rank #${user?.currentRank || 1}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0 ml-2"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.path === '/my-points' && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {displayScore.toLocaleString()} pts
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions inside Mobile Drawer */}
          <div className="p-4 pt-2 border-t border-slate-100 space-y-2 flex-shrink-0 bg-slate-50/50">
            {/* WhatsApp Help Group */}
            <a
              href="https://chat.whatsapp.com/KGFvgXHtvsm4jGH3fcnOcj"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300/80 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Join Ambassador WhatsApp Group</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            </a>

            {/* Logout Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Log Out of Portal</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};
