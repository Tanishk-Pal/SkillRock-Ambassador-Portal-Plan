import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Instagram,
  Linkedin,
  Video,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';
import { Task, TaskSubmissionData } from '../types';
import { taskAPI, ambassadorAPI, getUploadUrl } from '../services/api';

interface TaskSubmissionModalProps {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const getTaskSubmissionType = (task: {
  title?: string;
  category?: string;
  submissionType?: string;
  taskNumber?: number;
}): 'reel_challenge' | 'monthly_highlight' | 'campus_growth' | 'affiliate_sales' | 'custom' => {
  if (task.submissionType && task.submissionType !== 'custom') {
    return task.submissionType as any;
  }
  const title = (task.title || '').toLowerCase();
  const cat = (task.category || '').toLowerCase();

  if (title.includes('reel') || cat === 'content creation') {
    return 'reel_challenge';
  }
  if (title.includes('highlight') || cat === 'monthly highlights') {
    return 'monthly_highlight';
  }
  if (title.includes('growth') || title.includes('fest') || title.includes('trial') || title.includes('campus growth')) {
    if (title.includes('affiliate') || title.includes('sales') || title.includes('earn')) {
      return 'affiliate_sales';
    }
    return 'campus_growth';
  }
  if (title.includes('affiliate') || title.includes('sales') || title.includes('earn') || title.includes('course')) {
    return 'affiliate_sales';
  }
  return 'custom';
};

export const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  if (!task) return null;

  const taskType = getTaskSubmissionType(task);
  const submission = task.submission;
  const prevData: TaskSubmissionData = submission?.submissionData || {};
  const isApproved = task.userStatus === 'Approved';

  // --- Reel Challenge Form State ---
  const [instagramReelUrl, setInstagramReelUrl] = useState(prevData.instagramReelUrl || '');
  const [linkedinPostUrl, setLinkedinPostUrl] = useState(prevData.linkedinPostUrl || '');
  const [driveVideoUrl, setDriveVideoUrl] = useState(prevData.driveVideoUrl || '');

  // --- Monthly Highlight Form State ---
  const [driveCarouselUrl, setDriveCarouselUrl] = useState(prevData.driveCarouselUrl || '');

  // --- Campus Growth Form State ---
  const [studentsReached, setStudentsReached] = useState<number | ''>(
    prevData.studentsReached !== undefined ? prevData.studentsReached : ''
  );
  const [registrationsGenerated, setRegistrationsGenerated] = useState<number | ''>(
    prevData.registrationsGenerated !== undefined ? prevData.registrationsGenerated : ''
  );
  const [studentsLearningStarted, setStudentsLearningStarted] = useState<number | ''>(
    prevData.studentsLearningStarted !== undefined ? prevData.studentsLearningStarted : ''
  );
  const [driveVideoLinks, setDriveVideoLinks] = useState<string[]>(() => {
    if (prevData.driveVideoLinks && prevData.driveVideoLinks.length > 0) {
      return prevData.driveVideoLinks;
    }
    return [''];
  });

  // --- Affiliate & Course Sales Form State ---
  const [coursesPromotedCount, setCoursesPromotedCount] = useState<number | ''>(
    prevData.coursesPromotedCount !== undefined ? prevData.coursesPromotedCount : ''
  );
  const [salesGeneratedCount, setSalesGeneratedCount] = useState<number | ''>(
    prevData.salesGeneratedCount !== undefined ? prevData.salesGeneratedCount : ''
  );
  const [courseNames, setCourseNames] = useState(prevData.courseNames || '');
  const [promotionalUrls, setPromotionalUrls] = useState(
    Array.isArray(prevData.promotionalUrls) ? prevData.promotionalUrls.join('\n') : ''
  );
  const [salesSummary, setSalesSummary] = useState<{ totalSales: number; totalCommission: number } | null>(null);

  // --- Common Fields ---
  const [additionalComments, setAdditionalComments] = useState(
    prevData.additionalComments || prevData.textResponse || ''
  );
  const [genericLinks, setGenericLinks] = useState(
    Array.isArray(prevData.links) ? prevData.links.join('\n') : ''
  );
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch verified sales if affiliate challenge
  useEffect(() => {
    if (taskType === 'affiliate_sales') {
      ambassadorAPI
        .getSales()
        .then((res) => {
          if (res.data.success && res.data.summary) {
            setSalesSummary({
              totalSales: res.data.summary.totalSales || 0,
              totalCommission: res.data.summary.totalCommission || 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [taskType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleAddDriveVideoLink = () => {
    setDriveVideoLinks([...driveVideoLinks, '']);
  };

  const handleUpdateDriveVideoLink = (index: number, val: string) => {
    const updated = [...driveVideoLinks];
    updated[index] = val;
    setDriveVideoLinks(updated);
  };

  const handleRemoveDriveVideoLink = (index: number) => {
    if (driveVideoLinks.length <= 1) {
      setDriveVideoLinks(['']);
      return;
    }
    const updated = driveVideoLinks.filter((_, i) => i !== index);
    setDriveVideoLinks(updated);
  };

  // URL Validator Helper
  const isValidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const u = new URL(url.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('submissionType', taskType);
      if (additionalComments) formData.append('additionalComments', additionalComments);

      // Task-Specific Validation
      if (taskType === 'reel_challenge') {
        if (!instagramReelUrl.trim() || !isValidUrl(instagramReelUrl)) {
          throw new Error('Please enter a valid Instagram Reel URL (e.g. https://www.instagram.com/reel/...).');
        }
        if (!linkedinPostUrl.trim() || !isValidUrl(linkedinPostUrl)) {
          throw new Error('Please enter a valid LinkedIn Post URL (e.g. https://www.linkedin.com/posts/...).');
        }
        if (driveVideoUrl.trim() && !isValidUrl(driveVideoUrl)) {
          throw new Error('Google Drive Video URL must be a valid link.');
        }

        formData.append('instagramReelUrl', instagramReelUrl.trim());
        formData.append('linkedinPostUrl', linkedinPostUrl.trim());
        if (driveVideoUrl.trim()) formData.append('driveVideoUrl', driveVideoUrl.trim());
      } else if (taskType === 'monthly_highlight') {
        if (!linkedinPostUrl.trim() || !isValidUrl(linkedinPostUrl)) {
          throw new Error('Please enter a valid LinkedIn Post URL (e.g. https://www.linkedin.com/posts/...).');
        }
        if (driveCarouselUrl.trim() && !isValidUrl(driveCarouselUrl)) {
          throw new Error('Google Drive Carousel PDF URL must be a valid link.');
        }

        formData.append('linkedinPostUrl', linkedinPostUrl.trim());
        if (driveCarouselUrl.trim()) formData.append('driveCarouselUrl', driveCarouselUrl.trim());
      } else if (taskType === 'campus_growth') {
        if (studentsReached === '' || Number(studentsReached) < 0) {
          throw new Error('Number of Students Reached is required.');
        }
        if (registrationsGenerated === '' || Number(registrationsGenerated) < 0) {
          throw new Error('Number of Registrations Generated is required.');
        }
        if (studentsLearningStarted === '' || Number(studentsLearningStarted) < 0) {
          throw new Error('Number of Students Who Started Learning is required.');
        }

        const validLinks = driveVideoLinks.map((l) => l.trim()).filter((l) => l.length > 0);
        if (validLinks.length === 0 || !isValidUrl(validLinks[0])) {
          throw new Error('Google Drive Video Link 1 is required and must be a valid link.');
        }

        for (let i = 0; i < validLinks.length; i++) {
          if (!isValidUrl(validLinks[i])) {
            throw new Error(`Google Drive Video Link #${i + 1} is not a valid URL.`);
          }
        }

        formData.append('studentsReached', String(studentsReached));
        formData.append('registrationsGenerated', String(registrationsGenerated));
        formData.append('studentsLearningStarted', String(studentsLearningStarted));
        formData.append('driveVideoLinks', JSON.stringify(validLinks));
      } else if (taskType === 'affiliate_sales') {
        if (coursesPromotedCount === '' || Number(coursesPromotedCount) < 0) {
          throw new Error('Number of Courses Promoted is required.');
        }
        if (salesGeneratedCount === '' || Number(salesGeneratedCount) < 0) {
          throw new Error('Number of Course Sales Generated is required.');
        }
        if (!courseNames.trim()) {
          throw new Error('Please enter the course names promoted.');
        }

        formData.append('coursesPromotedCount', String(coursesPromotedCount));
        formData.append('salesGeneratedCount', String(salesGeneratedCount));
        formData.append('courseNames', courseNames.trim());

        if (promotionalUrls.trim()) {
          const promoList = promotionalUrls
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          formData.append('promotionalUrls', JSON.stringify(promoList));
        }
      } else {
        // Custom
        if (genericLinks.trim()) {
          const linkList = genericLinks
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          linkList.forEach((link) => formData.append('links', link));
        }
      }

      // Append proof files
      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
        }
      }

      const res = await taskAPI.submitTask(task._id, formData);
      if (res.data.success) {
        setSuccessMsg('Your task-specific submission has been recorded! Points will be awarded upon Admin verification.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Failed to submit task proof. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Task Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
              {task.category}
            </span>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
              +{task.points} pts
            </span>
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{task.title}</h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed">{task.fullDescription}</p>
        </div>

        {/* Previous Feedback / Rejection Notice */}
        {submission && submission.status === 'rejected' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-extrabold text-red-800">Admin Correction Request:</p>
              <p className="mt-0.5 text-red-700">{submission.adminFeedback || 'Please correct requirements and resubmit.'}</p>
              <p className="mt-1 text-[11px] text-red-600 font-semibold">
                You can edit your fields below and resubmit for review.
              </p>
            </div>
          </div>
        )}

        {/* Approved Status Notice */}
        {isApproved && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-extrabold text-emerald-800">Submission Approved & Points Awarded!</p>
              <p className="mt-0.5 text-emerald-700">
                You have earned <strong className="font-black text-emerald-900">+{task.points} points</strong> for this challenge.
                {submission?.adminFeedback && ` Note: "${submission.adminFeedback}"`}
              </p>
            </div>
          </div>
        )}

        {/* Submission Form */}
        {!isApproved ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ============================================================== */}
            {/* TASK 1 / FORM: REEL CHALLENGE */}
            {/* ============================================================== */}
            {taskType === 'reel_challenge' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Ambassadors must publish their Reel/video on <strong>both Instagram and LinkedIn</strong>.</span>
                </div>

                {/* Instagram Reel URL - REQUIRED */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      Instagram Reel URL <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                      Required
                    </span>
                  </label>
                  <input
                    type="url"
                    value={instagramReelUrl}
                    onChange={(e) => setInstagramReelUrl(e.target.value)}
                    required
                    placeholder="https://www.instagram.com/reel/Cxxxxxx/"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-pink-500 outline-none font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Direct public URL to your Instagram reel.</p>
                </div>

                {/* LinkedIn Post URL - REQUIRED */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      LinkedIn Post URL <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Required
                    </span>
                  </label>
                  <input
                    type="url"
                    value={linkedinPostUrl}
                    onChange={(e) => setLinkedinPostUrl(e.target.value)}
                    required
                    placeholder="https://www.linkedin.com/posts/username_activity-xxxxxx"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Direct public URL to your LinkedIn video post.</p>
                </div>

                {/* Google Drive Video URL - OPTIONAL */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-amber-500" />
                      Google Drive Video URL (Original MP4)
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                  </label>
                  <input
                    type="url"
                    value={driveVideoUrl}
                    onChange={(e) => setDriveVideoUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/xxxxxx/view"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Optional backup link to original video file on Drive.</p>
                </div>

                {/* Screenshots Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-slate-500" />
                      Instagram & LinkedIn Screenshots
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional Proof</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-dashed border-slate-300 rounded-2xl p-2 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Upload screenshots showing views, engagement, or post confirmation.</p>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TASK 2 / FORM: MONTHLY HIGHLIGHT */}
            {/* ============================================================== */}
            {taskType === 'monthly_highlight' && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Publish your monthly reflections or carousel post on <strong>LinkedIn</strong>.</span>
                </div>

                {/* LinkedIn Post URL - REQUIRED */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      LinkedIn Post / Carousel URL <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Required
                    </span>
                  </label>
                  <input
                    type="url"
                    value={linkedinPostUrl}
                    onChange={(e) => setLinkedinPostUrl(e.target.value)}
                    required
                    placeholder="https://www.linkedin.com/posts/username_activity-xxxxxx"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Public URL to your live LinkedIn carousel/post.</p>
                </div>

                {/* Google Drive Carousel PDF URL - OPTIONAL */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Google Drive Carousel PDF URL
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                  </label>
                  <input
                    type="url"
                    value={driveCarouselUrl}
                    onChange={(e) => setDriveCarouselUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/xxxxxx/view"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Link to your designed carousel PDF slides if stored on Drive.</p>
                </div>

                {/* Screenshot Upload - OPTIONAL */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-slate-500" />
                      Screenshot of Published LinkedIn Post
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-dashed border-slate-300 rounded-2xl p-2 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TASK 3 / FORM: CAMPUS GROWTH CHALLENGE */}
            {/* ============================================================== */}
            {taskType === 'campus_growth' && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Report student onboarding metrics and submit individual Google Drive video evidence.</span>
                </div>

                {/* 3 Numerical Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Students Reached <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={studentsReached}
                      onChange={(e) => setStudentsReached(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Registrations <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={registrationsGenerated}
                      onChange={(e) => setRegistrationsGenerated(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Learning Started <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={studentsLearningStarted}
                      onChange={(e) => setStudentsLearningStarted(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      placeholder="e.g. 10"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Dynamic Google Drive Video Links */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-indigo-600" />
                      Google Drive Video Links <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddDriveVideoLink}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Video</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {driveVideoLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            value={link}
                            onChange={(e) => handleUpdateDriveVideoLink(idx, e.target.value)}
                            required={idx === 0}
                            placeholder={
                              idx === 0
                                ? 'Google Drive Video Link 1 * (Required)'
                                : `Google Drive Video Link ${idx + 1} (Optional)`
                            }
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        {driveVideoLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDriveVideoLink(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove this video link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-amber-700 mt-1.5 font-medium flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Important: Ensure Drive link permissions are set to <strong>&quot;Anyone with the link can view&quot;</strong>.</span>
                  </p>
                </div>

                {/* Evidence Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-slate-500" />
                      Referral Dashboard Screenshot & Activity Proof
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional Proof</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-dashed border-slate-300 rounded-2xl p-2 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TASK 4 / FORM: AFFILIATE & COURSE SALES CHALLENGE */}
            {/* ============================================================== */}
            {taskType === 'affiliate_sales' && (
              <div className="space-y-4">
                {/* Live SRID Sales Attributed Box */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-900 block">Verified Attributed Sales:</span>
                      <span className="text-[11px] text-slate-600">
                        {salesSummary
                          ? `${salesSummary.totalSales} verified order(s) attributed to your SRID`
                          : 'Loading verified purchases...'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-amber-700 bg-white px-3 py-1 rounded-xl border border-amber-200">
                    20% Official Commission Tier
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Number of Courses Promoted */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Courses Promoted <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={coursesPromotedCount}
                      onChange={(e) => setCoursesPromotedCount(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      placeholder="e.g. 3"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  {/* Number of Sales Generated */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Sales Generated <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={salesGeneratedCount}
                      onChange={(e) => setSalesGeneratedCount(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      placeholder="e.g. 2"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Course Names */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Course Names <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseNames}
                    onChange={(e) => setCourseNames(e.target.value)}
                    required
                    placeholder="e.g. Full Stack Web Development, Python Mastery, UI/UX"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Specify which SkillRock courses you actively promoted.</p>
                </div>

                {/* Promotional Post URLs */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Promotional Post / Reel URLs</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                  </label>
                  <textarea
                    value={promotionalUrls}
                    onChange={(e) => setPromotionalUrls(e.target.value)}
                    placeholder="https://instagram.com/reel/...&#10;https://linkedin.com/posts/..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Separate multiple links with a new line.</p>
                </div>

                {/* Sales Evidence Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-slate-500" />
                      Sales Evidence / Screenshots
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-dashed border-slate-300 rounded-2xl p-2 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* CUSTOM / FALLBACK TASK */}
            {/* ============================================================== */}
            {taskType === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Activity Report / Summary
                  </label>
                  <textarea
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    placeholder="Describe your task execution..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Verification Links
                  </label>
                  <textarea
                    value={genericLinks}
                    onChange={(e) => setGenericLinks(e.target.value)}
                    placeholder="https://..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Upload Verification Proof
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-dashed border-slate-300 rounded-2xl p-2 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Additional Comments (For all tasks) */}
            {taskType !== 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Additional Comments</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                </label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Any extra context, challenges faced, or key highlights for the review team..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit for Review</span>
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
