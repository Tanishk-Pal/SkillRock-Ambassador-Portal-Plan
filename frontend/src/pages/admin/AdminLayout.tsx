import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CheckSquare,
  FileCheck2,
  TrendingUp,
  Gift,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Ambassadors', path: '/admin/ambassadors', icon: Users },
    { name: '1-Click Applicants', path: '/admin/applicants', icon: UserCheck },
    { name: 'Task Management', path: '/admin/tasks', icon: CheckSquare },
    { name: 'Submission Reviews', path: '/admin/submissions', icon: FileCheck2 },
    { name: 'Sales & Referrals', path: '/admin/sales', icon: TrendingUp },
    { name: 'Reward Tiers', path: '/admin/rewards', icon: Gift },
    { name: 'Commission Rules', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/80 px-4 lg:px-8 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">SkillRock Admin</span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Program Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Signed in as <strong className="text-white">{user?.email || 'admin@skillrock.in'}</strong>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body with Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        {/* Admin Navigation Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-slate-800/90 rounded-3xl p-2 sm:p-3 border border-slate-700 sticky top-16 lg:top-20 shadow-xl flex lg:flex-col gap-1 sm:gap-1.5 overflow-x-auto lg:overflow-visible scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <div className="hidden lg:block pt-4 mt-4 border-t border-slate-700/60 px-3">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Console Mode
              </span>
              <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                Full Platform Editor & Admin
              </p>
            </div>
          </div>
        </aside>

        {/* Admin Main Dynamic Outlet */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
