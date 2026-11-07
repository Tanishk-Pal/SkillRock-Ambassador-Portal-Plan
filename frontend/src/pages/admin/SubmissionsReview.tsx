import React, { useState, useEffect } from 'react';
import { adminAPI, getUploadUrl } from '../../services/api';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Instagram,
  Linkedin,
  Video,
  FileText,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { getTaskSubmissionType } from '../../components/TaskSubmissionModal';

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
    setLoading(true);
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
    setFeedback(
      action === 'approve'
        ? 'Great work! Task submission verified and approved.'
        : ''
    );
    setCustomPoints(sub.taskId?.points || 150);
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    if (reviewAction === 'reject' && !feedback.trim()) {
      alert('Please provide a constructive rejection reason so the ambassador knows what to fix.');
      return;
    }

    setSubmittingReview(true);

    try {
      const res = await adminAPI.reviewSubmission(selectedSub._id, {
        action: reviewAction,
        feedback: feedback.trim(),
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
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white">Ambassador Submission Reviews</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Task-Specific Verification
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review specific URLs, video drive links, student growth counts, and sales proofs. Points awarded upon approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white outline-none focus:border-indigo-500"
          >
            <option value="all">All Submissions</option>
            <option value="submitted">Pending Review (Action Required)</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected / Needs Resubmission</option>
          </select>

          <button
            onClick={fetchSubmissions}
            className="p-2.5 rounded-2xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Refresh submissions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
            <p className="text-sm">Loading ambassador submissions...</p>
          </div>
        ) : submissions.length > 0 ? (
          submissions.map((sub) => {
            const amb = sub.ambassadorId;
            const task = sub.taskId;
            const sType = getTaskSubmissionType(task || {});
            const sData = sub.submissionData || {};
            const verifiedSales = sub.verifiedSalesSummary || {
              totalPaidOrders: 0,
              totalRevenue: 0,
              totalCommission: 0,
            };

            return (
              <div
                key={sub._id}
                className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4"
              >
                {/* Ambassador & Task Top Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-white text-base">
                        {amb?.name || 'Ambassador'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {sub.srid || amb?.srid}
                      </span>
                      {amb?.college && (
                        <span className="text-xs text-slate-400">
                          • {amb.college}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Submitted for:</span>
                      <strong className="text-slate-200">
                        Task #{task?.taskNumber || '?'}: {task?.title || 'Task'}
                      </strong>
                      <span className="px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 text-[11px]">
                        +{task?.points || 150} pts
                      </span>

                      {/* Ambassador's Public Social Links */}
                      {(amb?.linkedinUrl || amb?.instagramUrl) && (
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                          {amb?.linkedinUrl && (
                            <a
                              href={amb.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 hover:underline"
                              title="Ambassador's LinkedIn Profile"
                            >
                              <Linkedin className="w-3 h-3" />
                              <span>Profile</span>
                            </a>
                          )}
                          {amb?.instagramUrl && (
                            <a
                              href={amb.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-400 hover:text-pink-300 inline-flex items-center gap-1 hover:underline"
                              title="Ambassador's Instagram Profile"
                            >
                              <Instagram className="w-3 h-3" />
                              <span>Profile</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : sub.status === 'rejected'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {sub.status === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
                      {sub.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                      {sub.status === 'submitted' && <Clock className="w-3.5 h-3.5" />}
                      {sub.status === 'approved'
                        ? `APPROVED (+${sub.awardedPoints || task?.points || 0} pts)`
                        : sub.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* TASK-SPECIFIC SUBMISSION DETAILS */}
                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                  {/* TYPE 1: Reel Challenge */}
                  {sType === 'reel_challenge' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider">
                        <Instagram className="w-4 h-4" />
                        <span>Reel Creation Challenge Submission Details</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Instagram Reel Link */}
                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-pink-500/30 space-y-1">
                          <span className="text-[11px] font-bold text-pink-300 flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5" />
                            Instagram Reel URL (Required):
                          </span>
                          {sData.instagramReelUrl ? (
                            <a
                              href={sData.instagramReelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1.5 font-medium break-all underline"
                            >
                              <span>{sData.instagramReelUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-xs text-red-400">Not provided</span>
                          )}
                        </div>

                        {/* LinkedIn Post Link */}
                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-blue-500/30 space-y-1">
                          <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                            <Linkedin className="w-3.5 h-3.5" />
                            LinkedIn Post URL (Required):
                          </span>
                          {sData.linkedinPostUrl ? (
                            <a
                              href={sData.linkedinPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium break-all underline"
                            >
                              <span>{sData.linkedinPostUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-xs text-red-400">Not provided</span>
                          )}
                        </div>
                      </div>

                      {/* Google Drive Video URL (Optional) */}
                      {sData.googleDriveVideoUrl && (
                        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-xs">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                            <Video className="w-3.5 h-3.5 text-indigo-400" />
                            Google Drive Original Video File:
                          </span>
                          <a
                            href={sData.googleDriveVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 underline break-all"
                          >
                            <span>{sData.googleDriveVideoUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TYPE 2: Monthly Highlight */}
                  {sType === 'monthly_highlight' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                        <Linkedin className="w-4 h-4" />
                        <span>Monthly Highlight Submission Details</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* LinkedIn Post Link */}
                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-blue-500/30 space-y-1">
                          <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                            <Linkedin className="w-3.5 h-3.5" />
                            Published LinkedIn Post URL:
                          </span>
                          {sData.linkedinPostUrl ? (
                            <a
                              href={sData.linkedinPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium break-all underline"
                            >
                              <span>{sData.linkedinPostUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-xs text-red-400">Not provided</span>
                          )}
                        </div>

                        {/* Drive Carousel PDF */}
                        {sData.googleDriveCarouselPdfUrl && (
                          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-400" />
                              Drive Carousel PDF URL:
                            </span>
                            <a
                              href={sData.googleDriveCarouselPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 underline break-all"
                            >
                              <span>{sData.googleDriveCarouselPdfUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TYPE 3: Campus Growth */}
                  {sType === 'campus_growth' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4" />
                        <span>Campus Growth Challenge Metrics & Videos</span>
                      </div>

                      {/* 3 Metric KPI Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Students Reached
                          </span>
                          <span className="text-xl font-black text-indigo-400">
                            {sData.studentsReached !== undefined ? sData.studentsReached : '0'}
                          </span>
                        </div>

                        <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Registrations Generated
                          </span>
                          <span className="text-xl font-black text-emerald-400">
                            {sData.registrationsGenerated !== undefined ? sData.registrationsGenerated : '0'}
                          </span>
                        </div>

                        <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Started Learning
                          </span>
                          <span className="text-xl font-black text-amber-400">
                            {sData.studentsLearningStarted !== undefined ? sData.studentsLearningStarted : '0'}
                          </span>
                        </div>
                      </div>

                      {/* Submitted Google Drive Video Links */}
                      {sData.googleDriveVideoUrls && sData.googleDriveVideoUrls.length > 0 && (
                        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700 space-y-2">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-indigo-400" />
                            Submitted Google Drive Video Links ({sData.googleDriveVideoUrls.length}):
                          </span>
                          <div className="space-y-1.5">
                            {sData.googleDriveVideoUrls.map((vUrl: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs"
                              >
                                <span className="font-mono text-slate-400 font-bold">
                                  Video #{idx + 1}:
                                </span>
                                <a
                                  href={vUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 underline truncate max-w-md sm:max-w-xl"
                                >
                                  {vUrl}
                                </a>
                                <a
                                  href={vUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 flex items-center gap-1 text-[11px] font-semibold shrink-0"
                                >
                                  <span>Open Drive</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TYPE 4: Affiliate & Sales */}
                  {sType === 'affiliate_sales' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <DollarSign className="w-4 h-4" />
                        <span>Affiliate & Sales Challenge Verification</span>
                      </div>

                      {/* Live System Sales Data vs Ambassador Claim */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Verified System Sales Records (SRID: {sub.srid})
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Cross-checked against database course sales. 20% commission is tracked separately in earnings.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 text-center">
                            <span className="text-[10px] text-slate-400 block font-normal">Paid Orders</span>
                            <span className="text-emerald-400">{verifiedSales.totalPaidOrders}</span>
                          </div>
                          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 text-center">
                            <span className="text-[10px] text-slate-400 block font-normal">Revenue</span>
                            <span className="text-white">₹{verifiedSales.totalRevenue}</span>
                          </div>
                          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 text-center">
                            <span className="text-[10px] text-slate-400 block font-normal">20% Commission</span>
                            <span className="text-amber-400">₹{verifiedSales.totalCommission}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ambassador's Reported Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Self-Reported Activity
                          </span>
                          <p className="text-slate-200">
                            <strong>{sData.coursesPromotedCount || 0}</strong> courses promoted •{' '}
                            <strong>{sData.salesGeneratedCount || 0}</strong> sales claimed
                          </p>
                          {sData.courseNames && (
                            <p className="text-slate-400 text-[11px] mt-1">
                              Promoted Courses: <span className="text-slate-200">{sData.courseNames}</span>
                            </p>
                          )}
                        </div>

                        {sData.promotionalUrls && sData.promotionalUrls.length > 0 && (
                          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Promotion Channels / URLs
                            </span>
                            <div className="space-y-1">
                              {sData.promotionalUrls.map((pUrl: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={pUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 underline block truncate text-[11px]"
                                >
                                  {pUrl}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Generic / Additional Links */}
                  {sData.links && sData.links.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                        Submitted Links:
                      </span>
                      <div className="space-y-1">
                        {sData.links.map((link: string, i: number) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:underline break-all text-xs"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span>{link}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Proof Files */}
                  {sData.filePaths && sData.filePaths.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                        Verification Proof Files / Screenshots ({sData.filePaths.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {sData.filePaths.map((fp: string, i: number) => {
                          const fullUrl = getUploadUrl(fp);
                          return (
                            <a
                              key={i}
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-indigo-300 hover:text-white hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Proof #{i + 1}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ambassador Notes / Comments */}
                  {(sData.additionalComments || sData.textResponse) && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-0.5">
                        Ambassador Notes / Comments:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-300 text-xs">
                        {sData.additionalComments || sData.textResponse}
                      </p>
                    </div>
                  )}

                  {/* Admin Feedback Given */}
                  {sub.adminFeedback && (
                    <div className="pt-2 border-t border-slate-800 text-slate-400 text-xs">
                      <span className="font-bold text-[10px] uppercase text-amber-400 block mb-0.5">
                        Admin Feedback Recorded:
                      </span>
                      <p className="italic text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                        &ldquo;{sub.adminFeedback}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Review Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleOpenReview(sub, 'reject')}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{sub.status === 'rejected' ? 'Update Rejection Feedback' : 'Reject with Feedback'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenReview(sub, 'approve')}
                    className="px-5 py-2 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{sub.status === 'approved' ? 'Re-Approve' : `Approve (+${task?.points || 150} pts)`}</span>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                {reviewAction === 'approve' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Approve Task Submission</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Reject Task Submission</span>
                  </>
                )}
              </h3>
              <span className="text-xs font-mono text-indigo-400 font-bold">
                {selectedSub.srid}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {reviewAction === 'approve'
                ? `Award points to ${selectedSub.ambassadorId?.name || 'Ambassador'} for completing '${selectedSub.taskId?.title}'.`
                : `Specify actionable rejection feedback so ${selectedSub.ambassadorId?.name || 'Ambassador'} can correct their submission and resubmit.`}
            </p>

            <form onSubmit={handleConfirmReview} className="space-y-4 text-xs">
              {reviewAction === 'approve' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Points to Award
                  </label>
                  <input
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Number(e.target.value))}
                    required
                    min={0}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-sm focus:border-amber-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Default task reward is {selectedSub.taskId?.points || 150} points.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {reviewAction === 'approve' ? 'Approval Message (Optional)' : 'Rejection Reason / What to Fix (Mandatory)'}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  required={reviewAction === 'reject'}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'e.g. Great work on the reel! Clear audio and good reach.'
                      : 'e.g. The Instagram Reel URL is set to private, or Google Drive video permissions need to be set to "Anyone with the link can view". Please update and resubmit.'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-5 py-2 rounded-xl font-bold text-white shadow-md transition-all ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  }`}
                >
                  {submittingReview
                    ? 'Processing...'
                    : reviewAction === 'approve'
                    ? `Confirm & Award ${customPoints || 0} pts`
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
