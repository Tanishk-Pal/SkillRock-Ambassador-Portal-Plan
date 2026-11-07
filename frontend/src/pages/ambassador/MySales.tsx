import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { ambassadorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CourseSale } from '../../types';
import { TrendingUp, Copy, Check, DollarSign, ShoppingCart, Clock, CheckCircle } from 'lucide-react';

export const MySales: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<CourseSale[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await ambassadorAPI.getSales();
        if (res.data.success) {
          setSales(res.data.sales);
          setSummary(res.data.summary);
        }
      } catch (err) {
        console.error('Failed to load ambassador sales:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const handleCopySRID = () => {
    if (user?.srid) {
      navigator.clipboard.writeText(user.srid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 space-y-6">
          {/* SRID Promo Referral Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20 inline-block">
                SkillRock Referral Program
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Earn 20% on Every Paid Course</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                When fellow students enroll in SkillRock courses (e.g. Applied Python Programming for ₹199),
                have them enter your unique SRID at checkout to automatically attribute the sale to your account.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-center min-w-[200px]">
              <span className="text-[11px] font-bold text-slate-300 uppercase">Your Referral Code</span>
              <span className="text-2xl font-black text-white font-mono tracking-wider my-1">
                {user?.srid || 'SR1001'}
              </span>
              <button
                onClick={handleCopySRID}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy SRID
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Sales</span>
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">{summary?.totalSales || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Verified Paid</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600">{summary?.paidSales || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Revenue</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">₹{(summary?.totalRevenue || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Commission Earned</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-indigo-600 font-mono">
                ₹{(summary?.totalCommission || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Sales Attribution Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg">Course Sales History</h3>
              <span className="text-xs font-semibold text-slate-400">{sales.length} transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Course Name</th>
                    <th className="py-3.5 px-6">Order ID</th>
                    <th className="py-3.5 px-6 text-center">Price</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Commission (20%)</th>
                    <th className="py-3.5 px-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">Loading sales data...</td>
                    </tr>
                  ) : sales.length > 0 ? (
                    sales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {sale.courseName}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-500">
                          {sale.orderId}
                        </td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-800">
                          ₹{sale.coursePrice}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              sale.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sale.paymentStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {sale.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-emerald-600 font-mono text-sm">
                          +₹{sale.commissionAmount}
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-slate-400">
                          {new Date(sale.saleTimestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No sales recorded yet. Share your SRID <strong>{user?.srid}</strong> to start earning!
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
