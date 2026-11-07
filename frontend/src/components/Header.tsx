import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Award, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  score?: number;
}

export const Header: React.FC<HeaderProps> = ({ score }) => {
  const { user, logout } = useAuth();
  const displayScore = score !== undefined ? score : user?.totalPoints || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Identity */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white p-1 flex items-center justify-center">
            <img src="/logo.jpg" alt="SkillRock Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              Skill<span className="text-orange-500">Rock</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Student Ambassador
            </span>
          </div>
        </Link>

        {/* Right: Score Pill & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Google Student Ambassador Inspired Score Pill */}
          <Link
            to="/my-points"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>Score: {displayScore.toLocaleString()} pts</span>
          </Link>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user?.name ? user.name.charAt(0) : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Ambassador'}</p>
                <p className="text-[10px] text-slate-500 font-mono font-medium">{user?.srid || 'SR0000'}</p>
              </div>
            </Link>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
