import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Search, Plus, Edit2, Trash2, Award, UserCheck, ShieldAlert, X } from 'lucide-react';

export const AmbassadorManagement: React.FC = () => {
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState<any | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCollege, setNewCollege] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPoints, setNewPoints] = useState(0);

  // Points adjust form
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState('');

  const fetchAmbassadors = async () => {
    try {
      const res = await adminAPI.getAmbassadors({ search });
      if (res.data.success) {
        setAmbassadors(res.data.ambassadors);
      }
    } catch (err) {
      console.error('Failed to load ambassadors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadors();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminAPI.createAmbassador({
        name: newName,
        email: newEmail,
        college: newCollege,
        phone: newPhone,
        totalPoints: newPoints,
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewCollege('');
        setNewPhone('');
        fetchAmbassadors();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating ambassador.');
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPointsModal) return;
    try {
      const res = await adminAPI.adjustPoints({
        ambassadorId: showPointsModal._id,
        amount: adjustAmount,
        reason: adjustReason,
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowPointsModal(null);
        setAdjustReason('');
        fetchAmbassadors();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adjusting points.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    try {
      const res = await adminAPI.updateAmbassador(showEditModal._id, {
        name: showEditModal.name,
        email: showEditModal.email,
        college: showEditModal.college,
        srid: showEditModal.srid,
        status: showEditModal.status,
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowEditModal(null);
        fetchAmbassadors();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating ambassador.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ambassador '${name}'?`)) {
      try {
        await adminAPI.deleteAmbassador(id);
        fetchAmbassadors();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white">Ambassador Roster & Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage ambassador credentials, unique SRIDs, point balances, and account statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ambassador</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-800/80 p-4 rounded-3xl border border-slate-700 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, college, SRID..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{ambassadors.length} ambassadors</span>
      </div>

      {/* Table */}
      <div className="bg-slate-800/90 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Ambassador</th>
                <th className="py-3.5 px-6">SRID</th>
                <th className="py-3.5 px-6">College</th>
                <th className="py-3.5 px-6 text-center">Points</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-xs sm:text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading ambassadors...</td>
                </tr>
              ) : ambassadors.length > 0 ? (
                ambassadors.map((amb) => (
                  <tr key={amb._id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{amb.name}</div>
                      <div className="text-[11px] text-slate-400">{amb.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-indigo-400">{amb.srid}</td>
                    <td className="py-4 px-6 text-slate-300 max-w-xs truncate">{amb.college}</td>
                    <td className="py-4 px-6 text-center font-black font-mono text-amber-400">
                      {amb.totalPoints}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          amb.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {amb.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setShowPointsModal(amb)}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30"
                        title="Adjust Points"
                      >
                        +/- Points
                      </button>
                      <button
                        onClick={() => setShowEditModal(amb)}
                        className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(amb._id, amb.name)}
                        className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No ambassadors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-lg">Add New Ambassador</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">College</label>
                <input
                  type="text"
                  value={newCollege}
                  onChange={(e) => setNewCollege(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Initial Points</label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">SRID will be generated automatically (e.g. SR1028).</p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-lg">Adjust Points: {showPointsModal.name}</h3>
              <button onClick={() => setShowPointsModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdjustPoints} className="space-y-3 text-xs">
              <p className="text-slate-400">Current Balance: <strong className="text-amber-400">{showPointsModal.totalPoints} pts</strong></p>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Points Delta (+ to add, - to deduct)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Mandatory Audit Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Special Hackathon Hosting Bonus"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPointsModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Ambassador Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-lg">Edit Ambassador</h3>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">SRID (Unique Referral ID)</label>
                <input
                  type="text"
                  value={showEditModal.srid}
                  onChange={(e) => setShowEditModal({ ...showEditModal, srid: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-indigo-400 font-mono font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={showEditModal.name}
                  onChange={(e) => setShowEditModal({ ...showEditModal, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">College</label>
                <input
                  type="text"
                  value={showEditModal.college}
                  onChange={(e) => setShowEditModal({ ...showEditModal, college: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Account Status</label>
                <select
                  value={showEditModal.status}
                  onChange={(e) => setShowEditModal({ ...showEditModal, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
