import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { AmbassadorHelpPill } from '../../components/AmbassadorHelpPill';
import { ambassadorAPI } from '../../services/api';
import { PointsTransaction } from '../../types';
import { Award, ArrowUpRight, ArrowDownLeft, ShieldCheck, Clock } from 'lucide-react';

export const MyPoints: React.FC = () => {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentRank, setCurrentRank] = useState(1);
  const [badgeTier, setBadgeTier] = useState('The Explorer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await ambassadorAPI.getPoints();
        if (res.data.success) {
          setTransactions(res.data.transactions);
          setTotalPoints(res.data.totalPoints);
          setCurrentRank(res.data.currentRank);
          setBadgeTier(res.data.badgeTier);
        }
      } catch (err) {
        console.error('Failed to load points ledger:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header score={totalPoints} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0 space-y-5 sm:space-y-6">
          {/* Points Summary Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Verified Points Balance
              </span>
              <h2 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {totalPoints.toLocaleString()} <span className="text-2xl font-bold font-sans">pts</span>
              </h2>
              <p className="text-xs text-blue-100 flex items-center gap-2 pt-2">
                <span>Tier: <strong className="text-white">{badgeTier}</strong></span>
                <span>•</span>
                <span>Rank: <strong className="text-amber-300">#{currentRank}</strong></span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center sm:text-right">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Audit-Verified</span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-1">
                Every point is permanently backed by admin approval logs.
              </p>
            </div>
          </div>

          {/* Points Transaction Audit Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Points Activity Ledger</h3>
                <p className="text-xs text-slate-500">Immutable record of all points awarded and adjusted.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">{transactions.length} entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Type</th>
                    <th className="py-3.5 px-6">Reason / Reference</th>
                    <th className="py-3.5 px-6 text-center">Amount</th>
                    <th className="py-3.5 px-6 text-center">Balance After</th>
                    <th className="py-3.5 px-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">Loading ledger entries...</td>
                    </tr>
                  ) : transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              tx.amount > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {tx.amount > 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-red-600" />
                            )}
                            {tx.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-900 max-w-sm">
                          {tx.reason}
                        </td>
                        <td className="py-4 px-6 text-center font-black font-mono">
                          <span className={tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-slate-600 font-semibold">
                          {tx.balanceAfter} pts
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-slate-400 font-mono">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No points transactions recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Ambassador Chatbot Help Pill */}
      <AmbassadorHelpPill />
    </div>
  );
};
