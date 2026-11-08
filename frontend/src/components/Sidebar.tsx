import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Info,
  BarChart3,
  TrendingUp,
  Award,
  User,
  Shield,
  LogOut,
  MessageCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'About & Rewards', path: '/about', icon: Info },
    { name: 'Leaderboard', path: '/leaderboard', icon: BarChart3 },
    { name: 'My Sales', path: '/my-sales', icon: TrendingUp },
    { name: 'My Points', path: '/my-points', icon: Award },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Admin', path: '/admin/dashboard', icon: Shield },
  ];

  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-sm sticky top-20 flex flex-col justify-between min-h-[500px]">
        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: WhatsApp Help & Logout */}
        <div className="pt-4 mt-6 border-t border-slate-100 space-y-2">
          <a
            href="https://chat.whatsapp.com/KGFvgXHtvsm4jGH3fcnOcj"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all shadow-2xs"
            title="Join SkillRock Ambassador WhatsApp Group"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Ambassador Help Group</span>
          </a>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
