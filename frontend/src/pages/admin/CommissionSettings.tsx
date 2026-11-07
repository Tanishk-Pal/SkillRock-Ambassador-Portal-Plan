import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Settings, Save, CheckCircle2, Shield } from 'lucide-react';

export const CommissionSettings: React.FC = () => {
  const [rate, setRate] = useState<number>(20);
  const [fixed, setFixed] = useState<number>(0);
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminAPI.getCommissionSettings();
        if (res.data.success && res.data.setting) {
          setRate(res.data.setting.defaultRatePercent);
          setFixed(res.data.setting.fixedCommissionPerCourse || 0);
          setRules(res.data.setting.eligibilityRules || '');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.updateCommissionSettings({
        defaultRatePercent: Number(rate),
        fixedCommissionPerCourse: Number(fixed),
        eligibilityRules: rules,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update commission settings.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-black text-white">Referral & Commission Configuration</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure default ambassador commission rates on course checkout enrolments and payout governance.
        </p>
      </div>

      <div className="bg-slate-800/90 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-xl max-w-2xl">
        {saved && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Commission settings updated successfully. Applied to all new course checkouts.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-xs">
              Default Referral Commission (%)
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Standard default is 20%. For a ₹199 course, ambassador earns ₹39.80 upon verified payment.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-xs">
              Fixed Bonus Per Enrolment (₹)
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                value={fixed}
                onChange={(e) => setFixed(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">INR</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-xs">
              Commission Eligibility & Terms
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              <span>Save Commission Policy</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
