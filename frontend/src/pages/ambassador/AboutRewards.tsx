import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { rewardsAPI } from '../../services/api';
import { RewardTier } from '../../types';
import { Award, Gift, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';

export const AboutRewards: React.FC = () => {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await rewardsAPI.getRewards();
        if (res.data.success) {
          setTiers(res.data.tiers);
        }
      } catch (err) {
        console.error('Failed to load rewards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 space-y-8">
          {/* Welcome Intro Section (From Screenshot 3) */}
          <div className="text-center max-w-3xl mx-auto pt-4 sm:pt-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              SkillRock SSAP Recognition
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Hey Ambassador,<br />
              Welcome to SkillRock <span className="text-orange-500">Student Ambassador</span> Program
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              As a SkillRock Student Ambassador, you will have the opportunity to experience SkillRock&apos;s latest
              learning tools firsthand, conduct meaningful campus workshops, and connect with a community of
              driven, like-minded student builders.
            </p>

            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              In addition, ambassadors receive exciting e-vouchers and physical rewards while developing valuable real-world tech and leadership skills.
            </p>
          </div>

          {/* Reward Structure Table (From Screenshot 3) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
            {/* Table Header Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
                <Gift className="w-5 h-5 text-amber-300" />
                <span>Reward Structure</span>
              </div>
              <ChevronDown className="w-5 h-5 text-white/70" />
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/70 border-b border-blue-100 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-900">
                    <th className="py-4 px-6">Tier Category</th>
                    <th className="py-4 px-6 text-center">Points</th>
                    <th className="py-4 px-6">E-Vouchers & Physical Rewards</th>
                    <th className="py-4 px-6 text-center">Digital Rewards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">Loading reward tiers...</td>
                    </tr>
                  ) : tiers.length > 0 ? (
                    tiers.map((tier) => (
                      <tr key={tier._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-5 px-6 font-bold text-slate-900 flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tier.badgeColor || '#4F46E5' }}
                          />
                          <span>{tier.tierCategory}</span>
                        </td>
                        <td className="py-5 px-6 text-center font-extrabold text-indigo-600 font-mono text-sm sm:text-base">
                          {tier.pointsRequired}
                        </td>
                        <td className="py-5 px-6 font-medium text-slate-800">
                          {tier.physicalRewards}
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 font-bold text-xs text-slate-700 border border-slate-200">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            {tier.digitalRewards.split('&')[0]}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">No active reward tiers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Guarantee Notice */}
          <div className="bg-indigo-50/60 rounded-3xl p-6 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Automated & Tamper-Proof Reward Unlocks</h4>
                <p className="text-xs text-slate-600">Points are awarded only after strict admin proof verification.</p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-3.5 py-1.5 rounded-full border border-indigo-200 shadow-2xs">
              SkillRock Official Policy
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
