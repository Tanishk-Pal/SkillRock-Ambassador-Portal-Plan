import React from 'react';
import { Target, Video, MapPin, BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpen }) => {
  // Select icon based on category
  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'Product Trials':
        return {
          icon: Target,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          briefColor: 'text-emerald-600',
        };
      case 'Content Creation':
        return {
          icon: Video,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          briefColor: 'text-amber-600',
        };
      case 'Monthly Highlights':
        return {
          icon: MapPin,
          color: 'text-violet-600',
          bgColor: 'bg-violet-50',
          briefColor: 'text-blue-600',
        };
      case 'Product Understanding':
      default:
        return {
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          briefColor: 'text-indigo-600',
        };
    }
  };

  const catStyle = getCategoryDetails(task.category);
  const Icon = catStyle.icon;

  // Determine submission status pill
  const getStatusBadge = () => {
    const status = task.userStatus || 'Not Started';
    if (status === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" /> Approved (+{task.points} pts)
        </span>
      );
    }
    if (status === 'Submitted' || status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> Under Review
        </span>
      );
    }
    if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" /> Action Needed
        </span>
      );
    }
    return (
      <span className="text-xs font-medium text-slate-400 italic">
        {task.isMandatory ? 'Mandatory' : 'Optional'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between group">
      <div>
        {/* Card Header: Category & Mandatory Badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${catStyle.bgColor} ${catStyle.color} flex items-center justify-center flex-shrink-0 border border-slate-100`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
              {task.category}
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        {/* Month's Brief Label */}
        <p className={`text-[11px] font-black uppercase tracking-wider mb-1.5 ${catStyle.briefColor}`}>
          {task.briefMonth || "MONTH'S BRIEF"}
        </p>

        {/* Task Title */}
        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h4>

        {/* Description */}
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
          {task.shortDescription}
        </p>
      </div>

      {/* Footer: Points and Continue CTA Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Task Reward</span>
          <span className="text-sm font-extrabold text-indigo-600">+{task.points} pts</span>
        </div>

        <button
          onClick={() => onOpen(task)}
          className={`px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xs transition-all ${
            task.userStatus === 'Approved'
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-md'
          }`}
        >
          {task.userStatus === 'Approved'
            ? 'View Submission'
            : task.userStatus === 'Submitted'
            ? 'Check Status'
            : task.userStatus === 'Rejected'
            ? 'Resubmit Proof'
            : 'Continue'}
        </button>
      </div>
    </div>
  );
};
