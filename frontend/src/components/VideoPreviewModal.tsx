import React, { useState } from 'react';
import {
  X,
  Video,
  ExternalLink,
  Download,
  AlertCircle,
  Copy,
  Check,
  Edit3,
  Save,
  GraduationCap,
  Sparkles,
  Play,
  FileText,
  User,
} from 'lucide-react';
import { getUploadUrl, adminAPI } from '../services/api';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateEmail?: string;
  candidateCollege?: string;
  srid?: string;
  videoUrl?: string;
  videoFilePath?: string;
  videoType?: 'link' | 'upload';
  whyAmbassador?: string;
  personalGoal?: string;
  ambassadorId?: string;
  onVideoUpdated?: (newVideoUrl: string) => void;
}

export function parseVideoEmbed(url?: string): {
  type: 'drive' | 'youtube' | 'direct' | 'unknown';
  embedUrl: string | null;
  directUrl: string;
} {
  if (!url) return { type: 'unknown', embedUrl: null, directUrl: '' };

  const trimmed = url.trim();

  // Google Drive detection
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch && driveFileMatch[1]) {
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
      directUrl: trimmed,
    };
  }

  const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (driveIdMatch && driveIdMatch[1]) {
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`,
      directUrl: trimmed,
    };
  }

  // YouTube detection
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`,
      directUrl: trimmed,
    };
  }

  // Direct MP4/WebM URL
  if (/\.(mp4|webm|mov)($|\?)/i.test(trimmed)) {
    return {
      type: 'direct',
      embedUrl: trimmed,
      directUrl: trimmed,
    };
  }

  return {
    type: 'unknown',
    embedUrl: null,
    directUrl: trimmed,
  };
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidateEmail,
  candidateCollege,
  srid,
  videoUrl: initialVideoUrl,
  videoFilePath,
  videoType,
  whyAmbassador,
  personalGoal,
  ambassadorId,
  onVideoUpdated,
}) => {
  const [currentVideoUrl, setCurrentVideoUrl] = useState(initialVideoUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(initialVideoUrl || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);

  // Sync state if initialVideoUrl changes
  React.useEffect(() => {
    setCurrentVideoUrl(initialVideoUrl || '');
    setInputUrl(initialVideoUrl || '');
    setVideoLoadError(false);
    setIsEditing(false);
  }, [initialVideoUrl, isOpen]);

  if (!isOpen) return null;

  const parsed = parseVideoEmbed(currentVideoUrl);
  const hasUploadedFile = !!videoFilePath;
  const directUploadedUrl = videoFilePath ? getUploadUrl(videoFilePath) : '';
  const fallbackRenderUrl = videoFilePath
    ? `https://skillrock-student-ambassador-program.onrender.com/uploads/${videoFilePath}`
    : '';

  const handleCopyLink = () => {
    const toCopy = currentVideoUrl || directUploadedUrl;
    if (toCopy) {
      navigator.clipboard.writeText(toCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveVideoUrl = async () => {
    if (!ambassadorId) {
      setCurrentVideoUrl(inputUrl);
      setIsEditing(false);
      if (onVideoUpdated) onVideoUpdated(inputUrl);
      return;
    }

    setSaving(true);
    try {
      const res = await adminAPI.updateAmbassadorVideo(ambassadorId, {
        videoUrl: inputUrl.trim(),
        videoType: 'link',
      });
      if (res.data.success) {
        setCurrentVideoUrl(inputUrl.trim());
        setIsEditing(false);
        if (onVideoUpdated) onVideoUpdated(inputUrl.trim());
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update video link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  {candidateName}
                </h3>
                {srid && (
                  <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {srid}
                  </span>
                )}
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Introduction Video
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
                {candidateCollege && (
                  <span className="flex items-center gap-1 truncate text-slate-300">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {candidateCollege}
                  </span>
                )}
                {candidateEmail && (
                  <span className="text-slate-500 hidden sm:inline">&bull; {candidateEmail}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
            title="Close video viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* VIDEO PLAYER AREA */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
            {/* Case 1: Google Drive or YouTube Embed */}
            {parsed.embedUrl ? (
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={parsed.embedUrl}
                  title={`${candidateName} Introduction Video`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : hasUploadedFile && !videoLoadError ? (
              /* Case 2: Uploaded MP4 / WebM File */
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                <video
                  controls
                  crossOrigin="anonymous"
                  playsInline
                  preload="metadata"
                  className="w-full h-full max-h-[460px] object-contain"
                  onError={() => setVideoLoadError(true)}
                >
                  <source src={directUploadedUrl} type="video/mp4" />
                  <source src={fallbackRenderUrl} type="video/mp4" />
                  Your browser does not support HTML5 video playback.
                </video>
              </div>
            ) : (
              /* Case 3: No playable video or file missing */
              <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3 bg-slate-950/60">
                <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Video className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {hasUploadedFile && videoLoadError
                      ? 'Direct Upload File Needs Google Drive Link'
                      : currentVideoUrl
                      ? 'External Video Link Provided'
                      : 'No Introduction Video Linked Yet'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    {hasUploadedFile && videoLoadError
                      ? 'The direct MP4 upload was recorded on an ephemeral server. You can ask the candidate or paste their Google Drive video link below to watch.'
                      : currentVideoUrl
                      ? 'This link can be opened directly in a new tab, or you can update with a standard Google Drive link.'
                      : 'You can add or update this candidate’s Google Drive introduction video link below.'}
                  </p>
                </div>

                {currentVideoUrl && (
                  <a
                    href={currentVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all mt-2"
                  >
                    <span>Open External Video Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Video Player Control Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Type:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700">
                  {parsed.type === 'drive'
                    ? 'Google Drive'
                    : parsed.type === 'youtube'
                    ? 'YouTube'
                    : hasUploadedFile
                    ? 'Uploaded File'
                    : currentVideoUrl
                    ? 'External Link'
                    : 'Unlinked'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Open in Google Drive / New Tab */}
                {(currentVideoUrl || directUploadedUrl) && (
                  <a
                    href={currentVideoUrl || directUploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20 text-xs"
                  >
                    <span>
                      {parsed.type === 'drive'
                        ? 'Open in Google Drive'
                        : parsed.type === 'youtube'
                        ? 'Open on YouTube'
                        : 'Open in New Tab'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {/* Direct File Download */}
                {hasUploadedFile && (
                  <a
                    href={directUploadedUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}

                {/* Copy Link */}
                {(currentVideoUrl || directUploadedUrl) && (
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors text-xs"
                    title="Copy Video URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                )}

                {/* Edit Link Button */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-amber-500/30 transition-colors text-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* EDIT VIDEO LINK PANEL */}
          {isEditing && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  Update Introduction Video URL (Google Drive)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  e.g. https://drive.google.com/file/d/1.../view
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste Google Drive video link..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveVideoUrl}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save</span>
                </button>
              </div>
              <p className="text-[11px] text-indigo-300/80">
                Tip: Ensure Google Drive file sharing is set to &quot;Anyone with the link can view&quot; for direct embedded playback.
              </p>
            </div>
          )}

          {/* APPLICANT INTRODUCTION & STATEMENT DETAILS */}
          {(whyAmbassador || personalGoal) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Candidate Statement & Leadership Vision</span>
              </div>

              {whyAmbassador && (
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-300 block">
                    Why do you want to become a SkillRock Ambassador?
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {whyAmbassador}
                  </p>
                </div>
              )}

              {personalGoal && (
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    Planned Workshop / Campus Growth Initiative:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {personalGoal}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            SkillRock Ambassador Review Team
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default VideoPreviewModal;
