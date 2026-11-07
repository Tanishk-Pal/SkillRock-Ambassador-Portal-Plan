import React from 'react';
import { Award, ShieldCheck, Zap } from 'lucide-react';

interface HeroBannerProps {
  name: string;
  srid: string;
  badgeTier?: string;
  rank?: number;
  totalPoints?: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  name,
  srid,
  badgeTier = 'The Explorer',
  rank = 1,
  totalPoints = 0,
}) => {
  // Extract first name
  const firstName = name.split(' ')[0] || 'Ambassador';

  // Determine badge badge styling
  const getBadgeStyle = (tier: string) => {
    if (tier.includes('Visionary') || tier.includes('Champ')) {
      return { label: 'SAPPHIRE BADGE', bg: 'bg-blue-400/20 text-blue-200', border: 'border-blue-300/30' };
    }
    if (tier.includes('Architect') || tier.includes('Gold')) {
      return { label: 'GOLD BADGE', bg: 'bg-amber-400/20 text-amber-200', border: 'border-amber-300/30' };
    }
    if (tier.includes('Navigator') || tier.includes('Silver')) {
      return { label: 'SILVER BADGE', bg: 'bg-slate-300/20 text-slate-200', border: 'border-slate-300/30' };
    }
    return { label: 'BRONZE BADGE', bg: 'bg-orange-400/20 text-orange-200', border: 'border-orange-300/30' };
  };

  const badgeConfig = getBadgeStyle(badgeTier);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#6366F1] text-white p-6 sm:p-8 lg:p-10 shadow-md">
      {/* Background ambient lighting */}
      <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 -top-10 w-60 h-60 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Ambassador Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Active SkillRock Ambassador
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            {firstName}
          </h1>

          <p className="text-base sm:text-lg font-mono font-medium text-blue-100 flex items-center gap-3">
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
