import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Zap,
  GraduationCap,
  Linkedin,
  Instagram,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface HeroBannerProps {
  name: string;
  srid: string;
  college?: string;
  linkedin?: string;
  instagram?: string;
  badgeTier?: string;
  rank?: number;
  totalPoints?: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  name,
  srid,
  college,
  linkedin,
  instagram,
  badgeTier = 'The Explorer',
  rank = 1,
  totalPoints = 0,
}) => {
  // Determine badge styling
  const getBadgeStyle = (tier: string) => {
    if (tier.includes('Champ') || tier.includes('Visionary')) {
      return { label: 'ELITE CHAMP BADGE', bg: 'bg-blue-400/20 text-blue-200', border: 'border-blue-300/30' };
    }
    if (tier.includes('Changemaker') || tier.includes('Architect')) {
      return { label: 'CHANGEMAKER BADGE', bg: 'bg-emerald-400/20 text-emerald-200', border: 'border-emerald-300/30' };
    }
    if (tier.includes('Trailblazer') || tier.includes('Navigator')) {
      return { label: 'TRAILBLAZER BADGE', bg: 'bg-indigo-400/20 text-indigo-200', border: 'border-indigo-300/30' };
    }
    return { label: 'EXPLORER BADGE', bg: 'bg-orange-400/20 text-orange-200', border: 'border-orange-300/30' };
  };

  const badgeConfig = getBadgeStyle(badgeTier);

  // Helper to format clean display text for social links
  const formatLinkedinDisplay = (urlOrHandle: string) => {
    if (!urlOrHandle) return '';
    const clean = urlOrHandle.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '');
    return clean.startsWith('in/') ? clean : `in/${clean}`;
  };

  const formatInstagramDisplay = (urlOrHandle: string) => {
    if (!urlOrHandle) return '';
    const clean = urlOrHandle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '').replace(/^@/, '');
    return `@${clean}`;
  };

  const getLinkedinUrl = (val: string) => {
    if (!val) return '#';
    return val.startsWith('http') ? val : `https://linkedin.com/in/${val.replace(/^@/, '').replace(/^in\//, '')}`;
  };

  const getInstagramUrl = (val: string) => {
    if (!val) return '#';
    return val.startsWith('http') ? val : `https://instagram.com/${val.replace(/^@/, '')}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#6366F1] text-white p-5 sm:p-8 lg:p-10 shadow-md">
      {/* Background ambient lighting */}
      <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 -top-10 w-60 h-60 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
        {/* Left: Ambassador Info */}
        <div className="space-y-2.5 max-w-xl w-full">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Active SkillRock Ambassador
            </span>
          </div>

          {/* Ambassador Name */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {name}
          </h1>

          {/* Ambassador's College Name, LinkedIn & Instagram IDs */}
          <div className="space-y-2 pt-0.5">
            {/* College Name */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-100">
              <GraduationCap className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="truncate">{college || 'College Campus'}</span>
            </div>

            {/* Social IDs row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {linkedin ? (
                <a
                  href={getLinkedinUrl(linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all hover:scale-[1.02] shadow-2xs"
                  title="Public LinkedIn Profile"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>{formatLinkedinDisplay(linkedin)}</span>
                  <ExternalLink className="w-3 h-3 text-white/60" />
                </a>
              ) : (
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>+ Mandatory Public LinkedIn</span>
                </Link>
              )}

              {instagram ? (
                <a
                  href={getInstagramUrl(instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all hover:scale-[1.02] shadow-2xs"
                  title="Public Instagram Profile (No private accounts)"
                >
                  <Instagram className="w-3.5 h-3.5 text-[#F472B6]" />
                  <span>{formatInstagramDisplay(instagram)}</span>
                  <ExternalLink className="w-3 h-3 text-white/60" />
                </a>
              ) : (
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-pink-400/20 hover:bg-pink-400/30 text-pink-200 border border-pink-300/40 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-pink-300" />
                  <span>+ Mandatory Public Instagram</span>
                </Link>
              )}
            </div>

            {/* Public account compliance notice */}
            <p className="text-[11px] text-blue-200/80 font-medium flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
              <span>Public access required • Private accounts cannot be verified</span>
            </p>
          </div>

          <p className="text-sm sm:text-base font-mono font-medium text-blue-100 flex items-center gap-3 pt-1">
            <span>SRID : <strong className="text-white font-bold tracking-wider">{srid}</strong></span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300 font-semibold">Rank #{rank}</span>
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-white/90 pt-3 flex items-center gap-2">
            Your Tasks
          </h2>
        </div>

        {/* Right: Badge Card matching Screenshot */}
        <div className="w-full md:w-auto flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-lg flex flex-col items-center justify-center text-center min-w-[200px]">
            <span className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border ${badgeConfig.bg} ${badgeConfig.border}`}>
              {badgeConfig.label}
            </span>

            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner my-1">
              <Award className="w-9 h-9 text-amber-300 animate-pulse" />
            </div>

            <p className="text-sm font-black text-white mt-2">{badgeTier}</p>
            <p className="text-xs text-blue-100 font-medium">{totalPoints} Verified Points</p>
          </div>
        </div>
      </div>
    </div>
  );
};
