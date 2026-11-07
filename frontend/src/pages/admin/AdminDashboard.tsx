import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, UserCheck, FileCheck2, DollarSign, Award, ArrowUpRight, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getStats();
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading admin dashboard metrics...</div>;
  }

  const ambStats = stats?.ambassadors;
  const subStats = stats?.submissions;
  const salesStats = stats?.sales;
  const topAmbassadors = stats?.topAmbassadors || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white">Program Administration Overview</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across ambassador enrollment, task submissions, and course sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/applicants"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>1-Click Convert Applicants ({ambStats?.pendingApplicants || 0})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Ambassadors</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{ambStats?.total || 0}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            {ambStats?.active || 0} currently active
          </p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Submissions</span>
            <FileCheck2 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{subStats?.pending || 0}</p>
          <Link to="/admin/submissions" className="text-[11px] text-indigo-400 hover:underline font-semibold mt-1 inline-block">
            Review proofs &rarr;
          </Link>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">₹{(salesStats?.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            {salesStats?.totalCount || 0} verified orders
          </p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Commission Payable</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono">
            ₹{(salesStats?.commissionPayable || 0).toLocaleString()}
          </p>
          <Link to="/admin/sales" className="text-[11px] text-indigo-400 hover:underline font-semibold mt-1 inline-block">
            Manage payouts &rarr;
          </Link>
        </div>
      </div>

      {/* Top Performing Ambassadors */}
      <div className="bg-slate-800/90 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/80 flex items-center justify-between">
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Top Ranked Ambassadors
          </h3>
          <Link to="/admin/ambassadors" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            View All Ambassadors &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6 text-center">Rank</th>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">SRID</th>
                <th className="py-3 px-6">College</th>
                <th className="py-3 px-6 text-center">Tier</th>
                <th className="py-3 px-6 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-xs sm:text-sm text-slate-300">
              {topAmbassadors.map((amb: any, idx: number) => (
                <tr key={amb.srid} className="hover:bg-slate-700/40 transition-colors">
                  <td className="py-3.5 px-6 text-center font-mono font-bold text-amber-400">#{idx + 1}</td>
                  <td className="py-3.5 px-6 font-bold text-white">{amb.name}</td>
                  <td className="py-3.5 px-6 font-mono text-slate-400">{amb.srid}</td>
                  <td className="py-3.5 px-6 text-slate-300 truncate max-w-xs">{amb.college}</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-200">
                      {amb.badgeTier || 'The Explorer'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-indigo-400 font-mono">
                    {amb.totalPoints} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
