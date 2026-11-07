import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { rewardsAPI } from '../../services/api';
import { RewardTier } from '../../types';
import { Award, Gift, Sparkles, CheckCircle2, FileText } from 'lucide-react';

export const AboutRewards: React.FC = () => {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback default tiers matching Image 2
  const fallbackTiers = [
    {
      _id: '1',
      monthLabel: 'MONTH 1',
      tierCategory: 'The Explorer',
      pointsRequired: 600,
      physicalRewards: 'Premium SkillRock Diary & Planner',
      digitalRewards: 'Verified Digital Badge',
      badgeColor: '#F97316',
      orderIndex: 1,
      isActive: true,
    },
    {
      _id: '2',
      monthLabel: 'MONTH 2',
      tierCategory: 'The Trailblazer',
      pointsRequired: 1200,
      physicalRewards: 'SkillRock Branded Stainless Steel Bottle',
      digitalRewards: 'Verified Digital Badge',
      badgeColor: '#6366F1',
      orderIndex: 2,
      isActive: true,
    },
    {
      _id: '3',
      monthLabel: 'MONTH 3',
      tierCategory: 'The Changemaker',
      pointsRequired: 1800,
      physicalRewards: 'Premium Face Wash & Personal Care Kit',
      digitalRewards: 'Verified Digital Badge',
      badgeColor: '#10B981',
      orderIndex: 3,
      isActive: true,
    },
    {
      _id: '4',
      monthLabel: 'MONTH 4',
      tierCategory: 'SkillRock Champ',
      pointsRequired: 2400,
      physicalRewards: 'Program Graduation Honors Kit',
      digitalRewards: 'Verified 4-Month Digital Certificate + Elite Champ Badge',
      badgeColor: '#3B82F6',
      orderIndex: 4,
      isActive: true,
    },
  ];

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await rewardsAPI.getRewards();
        if (res.data.success && res.data.tiers && res.data.tiers.length > 0) {
          setTiers(res.data.tiers);
        } else {
          setTiers(fallbackTiers as any);
        }
      } catch (err) {
        console.error('Failed to load rewards:', err);
        setTiers(fallbackTiers as any);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  const displayTiers = tiers.length > 0 ? tiers : (fallbackTiers as any);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 space-y-8">
          {/* Main Hero Card for Ambassador Tier & Milestone Structure */}
          <div className="rounded-3xl bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] p-6 sm:p-8 lg:p-10 text-white shadow-xl">
            {/* Header / Title */}
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-blue-100 border border-white/20 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                SSAP Milestone Progression
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Ambassador Tier & Milestone Structure
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
                Progression tiers based on total points accumulated throughout the 4-month program duration.
              </p>
            </div>

            {/* Table Card matching Screenshot */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden text-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6 sm:px-8">Month & Tier</th>
                      <th className="py-4 px-6 text-center">Points</th>
                      <th className="py-4 px-6 sm:px-8">Physical Rewards</th>
                      <th className="py-4 px-6 sm:px-8">Digital Recognition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {displayTiers.map((tier: any, idx: number) => {
                      const monthNum = tier.monthLabel || `MONTH ${tier.orderIndex || idx + 1}`;
                      return (
                        <tr key={tier._id || idx} className="hover:bg-slate-50/70 transition-colors">
                          {/* Column 1: Month & Tier */}
                          <td className="py-5 px-6 sm:px-8">
                            <span className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              {monthNum}
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-slate-900">
                              {tier.tierCategory}
                            </span>
                          </td>

                          {/* Column 2: Points */}
                          <td className="py-5 px-6 text-center">
                            <span className="inline-block text-sm sm:text-base font-black text-blue-600 font-mono">
                              {tier.pointsRequired} pts
                            </span>
                          </td>

                          {/* Column 3: Physical Rewards */}
                          <td className="py-5 px-6 sm:px-8">
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <span className="text-base" role="img" aria-label="gift">
                                🎁
                              </span>
                              <span>{tier.physicalRewards}</span>
                            </div>
                          </td>

                          {/* Column 4: Digital Recognition */}
                          <td className="py-5 px-6 sm:px-8">
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <span>{tier.digitalRewards}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footnote matching screenshot */}
            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white/95 border border-white/20 shadow-sm">
                ✦ Awards and physical rewards are dispatched exclusively upon successfully gaining the required monthly points.
              </span>
            </div>
          </div>

          {/* Certificate Completion Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Award className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Digital Certificate for Program Completion
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Ambassadors completing all mandatory challenges and reaching the required milestones earn an official SkillRock Completion Certificate.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4" />
                Verified Credential
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
