import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { HeroBanner } from '../../components/HeroBanner';
import { TaskCard } from '../../components/TaskCard';
import { TaskSubmissionModal } from '../../components/TaskSubmissionModal';
import { ambassadorAPI, taskAPI } from '../../services/api';
import { DashboardData, Task } from '../../types';
import { CheckCircle2, Award, TrendingUp, MessageCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashRes, taskRes] = await Promise.all([
        ambassadorAPI.getDashboard(),
        taskAPI.getTasks(),
      ]);

      if (dashRes.data.success) {
        setData(dashRes.data.dashboard);
      }
      if (taskRes.data.success) {
        setTasks(taskRes.data.tasks);
      }
    } catch (err) {
      console.error('Failed to load ambassador dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading your ambassador portal...</p>
        </div>
      </div>
    );
  }

  const amb = data?.ambassador;
  const taskStats = data?.taskStats;
  const salesStats = data?.salesStats;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header score={amb?.totalPoints} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        {/* Left Floating Sidebar */}
        <Sidebar />

        {/* Right Main Content */}
        <div className="flex-1 space-y-6">
          {/* Hero Banner matching Google Student Ambassador screen */}
          <HeroBanner
            name={amb?.name || 'Ambassador'}
            srid={amb?.srid || 'SR1001'}
            college={amb?.college}
            linkedin={amb?.linkedin}
            instagram={amb?.instagram}
            badgeTier={amb?.badgeTier || 'The Explorer'}
            rank={amb?.currentRank || 1}
            totalPoints={amb?.totalPoints || 0}
          />

          {/* Social Profiles Mandatory Notice if missing */}
          {(!amb?.linkedin || !amb?.instagram) && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                    Mandatory: Connect Your Public LinkedIn & Instagram
                  </h4>
                  <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5">
                    Ambassadors are required to provide their public social profiles. Private accounts cannot be verified for monthly reels, highlights, or rewards.
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors flex-shrink-0"
              >
                Complete Profile &rarr;
              </Link>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Tasks Done</span>
                <span className="text-lg font-black text-slate-900">
                  {taskStats?.completedTasks || 0}/{taskStats?.totalTasks || 4}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Points</span>
                <span className="text-lg font-black text-indigo-600">
                  {amb?.totalPoints || 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Course Sales</span>
                <span className="text-lg font-black text-slate-900">
                  {salesStats?.totalSales || 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Commission</span>
                <span className="text-lg font-black text-emerald-600">
                  ₹{(salesStats?.totalCommission || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Dynamic Task Slots in 2x2 Grid Layout (From Screenshots) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                Active Monthly Challenges ({tasks.length})
              </h3>
              <button
                onClick={fetchData}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onOpen={(t) => setSelectedTask(t)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Ambassador Chatbot Help Pill (Matching Google Student Ambassador screen) */}
      <a
        href="https://chat.whatsapp.com/KGFvgXHtvsm4jGH3fcnOcj"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        <span>SkillRock Ambassador Help</span>
      </a>

      {/* Task Submission / Detail Modal */}
      {selectedTask && (
        <TaskSubmissionModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
