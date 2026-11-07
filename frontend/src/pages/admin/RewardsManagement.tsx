import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { RewardTier } from '../../types';
import { Gift, Edit2, Award, X } from 'lucide-react';

export const RewardsManagement: React.FC = () => {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);

  const fetchTiers = async () => {
    try {
      const res = await adminAPI.getRewards();
      if (res.data.success) {
        setTiers(res.data.tiers);
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    try {
      await adminAPI.updateRewardTier(editingTier._id, {
        pointsRequired: Number(editingTier.pointsRequired),
        physicalRewards: editingTier.physicalRewards,
        digitalRewards: editingTier.digitalRewards,
        badgeColor: editingTier.badgeColor,
      });
      setEditingTier(null);
      fetchTiers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating tier.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-black text-white">Reward Tiers & Milestone Perks</h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize the 4-tier recognition scheme (Explorer, Navigator, Architect, Visionary), physical gifts, and point thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tiers.map((tier) => (
          <div key={tier._id} className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tier.badgeColor || '#4F46E5' }}
                />
                <h3 className="font-extrabold text-white text-base">{tier.tierCategory}</h3>
              </div>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {tier.pointsRequired} pts
              </span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 text-xs space-y-2">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Physical Perks</span>
                <span className="text-slate-200 font-medium">{tier.physicalRewards}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Digital Credential</span>
                <span className="text-indigo-400 font-medium">{tier.digitalRewards}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setEditingTier(tier)}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Perks
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-lg">Edit {editingTier.tierCategory}</h3>
              <button onClick={() => setEditingTier(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Points Required</label>
                <input
                  type="number"
                  value={editingTier.pointsRequired}
                  onChange={(e) => setEditingTier({ ...editingTier, pointsRequired: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">E-Vouchers & Physical Rewards</label>
                <input
                  type="text"
                  value={editingTier.physicalRewards}
                  onChange={(e) => setEditingTier({ ...editingTier, physicalRewards: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Digital Badge & Rewards</label>
                <input
                  type="text"
                  value={editingTier.digitalRewards}
                  onChange={(e) => setEditingTier({ ...editingTier, digitalRewards: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Hex Color Code</label>
                <input
                  type="text"
                  value={editingTier.badgeColor}
                  onChange={(e) => setEditingTier({ ...editingTier, badgeColor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  Save Perks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
