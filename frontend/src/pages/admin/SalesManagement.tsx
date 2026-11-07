import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { CourseSale } from '../../types';
import { TrendingUp, DollarSign, Filter, Search, CheckCircle, RefreshCw } from 'lucide-react';

export const SalesManagement: React.FC = () => {
  const [sales, setSales] = useState<CourseSale[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sridFilter, setSridFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      const res = await adminAPI.getSales({
        status: statusFilter,
        srid: sridFilter,
      });
      if (res.data.success) {
        setSales(res.data.sales);
      }
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [statusFilter, sridFilter]);

  const handleUpdateCommission = async (saleId: string, commissionStatus: string) => {
    try {
      await adminAPI.updateSaleCommission(saleId, {
        commissionStatus,
        overrideReason: `Updated by admin on ${new Date().toLocaleDateString()}`,
      });
      fetchSales();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update commission status.');
    }
  };

  const totalRevenue = sales
    .filter((s) => s.paymentStatus === 'paid')
    .reduce((sum, s) => sum + s.coursePrice, 0);

  const totalCommissions = sales
    .filter((s) => s.paymentStatus === 'paid')
    .reduce((sum, s) => sum + s.commissionAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white">Course Sales & Commission Engine</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track student course purchases attributed to ambassador SRIDs and manage commission payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 px-4 py-2 rounded-2xl border border-slate-700 text-xs font-mono">
            Revenue: <strong className="text-emerald-400">₹{totalRevenue.toLocaleString()}</strong>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-2xl border border-slate-700 text-xs font-mono">
            Commissions: <strong className="text-indigo-400">₹{totalCommissions.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 p-4 rounded-3xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={sridFilter}
              onChange={(e) => setSridFilter(e.target.value)}
              placeholder="Filter by SRID (e.g. SR1001)..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <button
          onClick={fetchSales}
          className="p-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sales Table */}
      <div className="bg-slate-800/90 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Course & Buyer</th>
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Ambassador (SRID)</th>
                <th className="py-3.5 px-6 text-center">Price</th>
                <th className="py-3.5 px-6 text-center">Payment Status</th>
                <th className="py-3.5 px-6 text-right">Commission</th>
                <th className="py-3.5 px-6 text-center">Payout Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-xs sm:text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading sales data...</td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{sale.courseName}</div>
                      <div className="text-[11px] text-slate-400">Buyer: {sale.buyerName || 'Student'} ({sale.buyerEmail || 'N/A'})</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{sale.orderId}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{sale.ambassadorName}</div>
                      <div className="text-xs font-mono font-bold text-indigo-400">{sale.srid}</div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-200">₹{sale.coursePrice}</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sale.paymentStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {sale.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black font-mono text-emerald-400">
                      ₹{sale.commissionAmount} ({sale.commissionRate}%)
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sale.commissionStatus === 'paid'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {sale.commissionStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {sale.commissionStatus !== 'paid' ? (
                        <button
                          onClick={() => handleUpdateCommission(sale._id, 'paid')}
                          className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-bold">Disbursed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No course sales match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
