import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { leaderboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Trophy, Medal, Award, User, RefreshCw } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [topThree, setTopThree] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await leaderboardAPI.getLeaderboard(search);
      if (res.data.success) {
        setTopThree(res.data.topThree);
        setRankings(res.data.rankings);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Podium styling helpers
  const getPodiumBadge = (rank: number) => {
    if (rank === 1) return { color: 'text-amber-500 bg-amber-50 border-amber-200', icon: Trophy, label: 'Rank 1 (Gold)' };
    if (rank === 2) return { color: 'text-slate-500 bg-slate-50 border-slate-200', icon: Medal, label: 'Rank 2 (Silver)' };
    return { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Medal, label: 'Rank 3 (Bronze)' };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 space-y-6">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                Ambassador Leaderboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real-time rankings based on admin-verified task submissions, workshops, and course referrals.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, college, SRID..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                onClick={fetchLeaderboard}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                title="Refresh Leaderboard"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top 3 Podium Highlights */}
          {topThree.length > 0 && !search && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topThree.map((amb, index) => {
                const badge = getPodiumBadge(index + 1);
                const Icon = badge.icon;
                const isMe = amb.srid === user?.srid;

                return (
                  <div
                    key={amb._id}
                    className={`bg-white rounded-3xl p-6 border transition-all text-center flex flex-col items-center justify-between relative shadow-subtle hover:shadow-card ${
                      isMe ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-slate-200'
                    }`}
                  >
                    {isMe && (
                      <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}

                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-3 ${badge.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-md overflow-hidden flex items-center justify-center font-bold text-slate-600 text-lg uppercase mb-2">
                        {amb.avatar ? (
                          <img src={amb.avatar} alt={amb.name} className="w-full h-full object-cover" />
                        ) : (
                          amb.name.charAt(0)
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base">{amb.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400 font-semibold">{amb.srid}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{amb.college}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-between px-2">
                      <span className="text-xs font-semibold text-slate-400">{amb.badgeTier || 'The Explorer'}</span>
                      <span className="font-black text-indigo-600 text-base font-mono">{amb.totalPoints} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranking Table for Remaining Ambassadors */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6 text-center">Rank</th>
                    <th className="py-3.5 px-6">Ambassador</th>
                    <th className="py-3.5 px-6">SRID</th>
                    <th className="py-3.5 px-6">College</th>
                    <th className="py-3.5 px-6 text-center">Tier</th>
                    <th className="py-3.5 px-6 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">Loading rankings...</td>
                    </tr>
                  ) : rankings.length > 0 ? (
                    rankings.map((amb) => {
                      const isMe = amb.srid === user?.srid;
                      return (
                        <tr
                          key={amb._id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isMe ? 'bg-indigo-50/50 font-bold' : ''
                          }`}
                        >
                          <td className="py-4 px-6 text-center font-extrabold text-slate-800 font-mono">
                            #{amb.rank}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs uppercase flex-shrink-0">
                                {amb.avatar ? (
                                  <img src={amb.avatar} alt={amb.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  amb.name.charAt(0)
                                )}
                              </div>
                              <span className="font-semibold text-slate-900">{amb.name}</span>
                              {isMe && (
                                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono font-medium text-slate-500">{amb.srid}</td>
                          <td className="py-4 px-6 text-slate-600 text-xs max-w-xs truncate">{amb.college}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              <Award className="w-3 h-3 text-amber-500" />
                              {amb.badgeTier || 'The Explorer'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-black text-indigo-600 font-mono text-sm sm:text-base">
                            {amb.totalPoints}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Trophy className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-sm text-slate-700">No ambassadors onboarded yet</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Approved student ambassadors will appear on the leaderboard as tasks and verified submissions are processed.
                          </p>
                          {(user?.role === 'admin' || user?.role === 'superadmin' || (user?.role as string) === 'super_admin') && (
                            <a
                              href="/admin/applicants"
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
                            >
                              Review & Onboard Applicants
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
