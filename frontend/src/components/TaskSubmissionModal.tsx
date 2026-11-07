import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, CheckCircle2, AlertCircle, FileText, Send } from 'lucide-react';
import { Task } from '../types';
import { taskAPI } from '../services/api';

interface TaskSubmissionModalProps {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  if (!task) return null;

  const [textResponse, setTextResponse] = useState('');
  const [links, setLinks] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const submission = task.submission;
  const isApproved = task.userStatus === 'Approved';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (textResponse) formData.append('textResponse', textResponse);
      if (videoUrl) formData.append('videoUrl', videoUrl);

      if (links) {
        const linkList = links
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        linkList.forEach((link) => formData.append('links', link));
      }

      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
        }
      }

      const res = await taskAPI.submitTask(task._id, formData);
      if (res.data.success) {
        setSuccessMsg('Your task submission has been recorded and submitted for Admin review!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit task proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
              {task.category}
            </span>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
              +{task.points} pts
            </span>
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{task.title}</h3>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">{task.fullDescription}</p>
        </div>

        {/* Previous Feedback / Rejection Notice */}
        {submission && submission.status === 'rejected' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Admin Feedback on Previous Submission:</p>
              <p className="mt-1">{submission.adminFeedback || 'Please address requirements and resubmit.'}</p>
            </div>
          </div>
        )}

        {/* Approved Status Notice */}
        {isApproved && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Submission Approved!</p>
              <p className="mt-1">
                You have earned <strong className="font-extrabold">+{task.points} points</strong> for this task.
                {submission?.adminFeedback && ` Note: "${submission.adminFeedback}"`}
              </p>
            </div>
          </div>
        )}

        {/* Instructions Checklist */}
        {task.instructions && task.instructions.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              Submission Instructions
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              {task.instructions.map((inst, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-indigo-600 flex-shrink-0">{i + 1}.</span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submission Form (Hidden if already approved) */}
        {!isApproved ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium">
                {successMsg}
              </div>
            )}

            {/* Text Response Field */}
            {task.allowedSubmissionTypes.includes('text') && (
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Summary / Activity Report
                </label>
                <textarea
                  value={textResponse}
                  onChange={(e) => setTextResponse(e.target.value)}
                  placeholder="Describe your event, workshop results, or participant feedback..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  required={task.allowedSubmissionTypes.length === 1}
                />
              </div>
            )}

            {/* Links Field */}
            {task.allowedSubmissionTypes.includes('url') && (
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  Links / URLs (LinkedIn Post, Drive Folder, Reel)
                </label>
                <textarea
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder="https://linkedin.com/posts/...&#10;https://drive.google.com/..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">Separate multiple links with a new line.</p>
              </div>
            )}

            {/* File Upload Field */}
            {(task.allowedSubmissionTypes.includes('image') ||
              task.allowedSubmissionTypes.includes('document')) && (
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Upload Verification Proof (Photos, Screenshots, PDFs)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.zip"
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-dashed border-slate-300 rounded-2xl p-2 cursor-pointer"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Proof</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
