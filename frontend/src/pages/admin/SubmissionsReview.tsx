import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FileCheck2, CheckCircle, XCircle, Clock, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';

export const SubmissionsReview: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Review modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [feedback, setFeedback] = useState('');
  const [customPoints, setCustomPoints] = useState<number | undefined>(undefined);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const res = await adminAPI.getSubmissions({ status: statusFilter });
      if (res.data.success) {
        setSubmissions(res.data.submissions);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handleOpenReview = (sub: any, action: 'approve' | 'reject') => {
    setSelectedSub(sub);
    setReviewAction(action);
    setFeedback(action === 'approve' ? 'Great work! Task verified.' : 'Proof is incomplete. Please address requirements and resubmit.');
    setCustomPoints(sub.taskId?.points || 500);
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSubmittingReview(true);

    try {
      const res = await adminAPI.reviewSubmission(selectedSub._id, {
        action: reviewAction,
        feedback,
        customPoints: reviewAction === 'approve' ? customPoints : 0,
      });

      if (res.data.success) {
        alert(res.data.message);
        setSelectedSub(null);
        fetchSubmissions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Ambassador Submission Reviews</h2>
          <p className="text-xs text-slate-400 mt-1">
            Verify proof of workshop hosting, reels, LinkedIn posts, and product surveys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white outline-none"
          >
            <option value="all">All Submissions</option>
            <option value="submitted">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading submissions...</div>
        ) : submissions.length > 0 ? (
          submissions.map((sub) => {
            const amb = sub.ambassadorId;
            const task = sub.taskId;

            return (
              <div
                key={sub._id}
                className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-white text-base">
                        {amb?.name || 'Ambassador'}
                      </h3>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        ({sub.srid})
                      </span>
                      <span className="text-xs text-slate-400">• {amb?.college}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted for: <strong className="text-slate-200">{task?.title || 'Task'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : sub.status === 'rejected'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {sub.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                      {sub.status === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : null}
                      {sub.status === 'submitted' ? <Clock className="w-3.5 h-3.5" /> : null}
                      {sub.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Submission Content */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-3">
                  {sub.submissionData?.textResponse && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                        Report / Summary:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
                        {sub.submissionData.textResponse}
                      </p>
                    </div>
                  )}

                  {sub.submissionData?.links && sub.submissionData.links.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                        Submitted Verification Links:
                      </span>
                      <div className="space-y-1">
                        {sub.submissionData.links.map((link: string, i: number) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:underline break-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{link}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {sub.submissionData?.filePaths && sub.submissionData.filePaths.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                        Uploaded Proof Files:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {sub.submissionData.filePaths.map((fp: string, i: number) => (
                          <a
                            key={i}
                            href={fp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
                          >
                            <span>File #{i + 1}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {sub.adminFeedback && (
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      <span className="font-bold text-[10px] uppercase text-amber-400 block mb-0.5">
                        Admin Feedback Given:
                      </span>
                      <p className="italic">&ldquo;{sub.adminFeedback}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleOpenReview(sub, 'reject')}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-all"
                  >
                    Reject with Feedback
                  </button>
                  <button
                    onClick={() => handleOpenReview(sub, 'approve')}
                    className="px-5 py-2 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Approve (+{task?.points || 500} pts)
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-800/90 p-12 rounded-3xl border border-slate-700 text-center text-slate-400 text-sm">
            No submissions found for the selected filter.
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white text-lg">
              {reviewAction === 'approve' ? 'Approve Submission' : 'Reject Submission'}
            </h3>
            <p className="text-xs text-slate-400">
              {reviewAction === 'approve'
                ? `Award points to ${selectedSub.ambassadorId?.name} for completing '${selectedSub.taskId?.title}'.`
                : `Provide clear feedback so ${selectedSub.ambassadorId?.name} can improve and resubmit.`}
            </p>

            <form onSubmit={handleConfirmReview} className="space-y-3 text-xs">
              {reviewAction === 'approve' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Points to Award</label>
                  <input
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">Reviewer Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-5 py-2 rounded-xl font-bold text-white shadow-md ${
                    reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {submittingReview ? 'Processing...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
