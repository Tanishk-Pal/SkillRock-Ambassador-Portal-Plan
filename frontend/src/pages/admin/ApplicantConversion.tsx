import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { UserCheck, CheckCircle2, ShieldCheck, Copy, Check, Sparkles } from 'lucide-react';

export const ApplicantConversion: React.FC = () => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversionModal, setConversionModal] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchApplicants = async () => {
    try {
      const res = await adminAPI.getApplicants();
      if (res.data.success) {
        setApplicants(res.data.applicants);
      }
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const handleConvert = async (applicantId: string) => {
    try {
      const res = await adminAPI.convertApplicant(applicantId);
      if (res.data.success) {
        setConversionModal(res.data);
        fetchApplicants();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert applicant.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Direct SSAP Application Pipeline
          </span>
          <h2 className="text-2xl font-black text-white">1-Click Ambassador Activation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Review student applications from the SSAP portal and promote approved candidates with auto-assigned SRIDs.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-700">
          {applicants.length} Total Applicants
        </span>
      </div>

      {/* Applicants Table */}
      <div className="bg-slate-800/90 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Candidate</th>
                <th className="py-3.5 px-6">College & Location</th>
                <th className="py-3.5 px-6 text-center">Application Status</th>
                <th className="py-3.5 px-6 text-center">Ambassador Account</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-xs sm:text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading applicants from MongoDB Atlas...</td>
                </tr>
              ) : applicants.length > 0 ? (
                applicants.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{app.fullName}</div>
                      <div className="text-[11px] text-slate-400">{app.email}</div>
                      {app.phone && <div className="text-[10px] text-slate-500 font-mono">{app.phone}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300 font-medium">{app.college || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{app.city ? `${app.city}, ${app.state || ''}` : ''}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-200">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {app.convertedToAmbassador ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active ({app.ambassadorSrid})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Not Yet Activated</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {app.convertedToAmbassador ? (
                        <span className="text-xs font-mono text-indigo-400 font-bold">{app.ambassadorSrid}</span>
                      ) : (
                        <button
                          onClick={() => handleConvert(app._id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all hover:scale-[1.02]"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Approve & Activate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No applicant records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Credentials Popup Modal */}
      {conversionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">Ambassador Activated!</h3>
                <p className="text-xs text-slate-400">Credentials created & 100 Welcome Points awarded.</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 font-mono text-xs space-y-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                <span className="text-white font-bold">{conversionModal.credentials.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Assigned SRID</span>
                <span className="text-indigo-400 font-black text-sm">{conversionModal.credentials.srid}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Temporary Password</span>
                <span className="text-amber-400 font-bold">{conversionModal.credentials.password}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Welcome to SkillRock SSAP!\nPortal: http://localhost:5174/login\nEmail: ${conversionModal.credentials.email}\nSRID: ${conversionModal.credentials.srid}\nPassword: ${conversionModal.credentials.password}`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Credentials'}</span>
              </button>

              <button
                onClick={() => setConversionModal(null)}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
