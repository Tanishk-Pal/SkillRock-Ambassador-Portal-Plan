import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { TaskCard } from '../../components/TaskCard';
import { TaskSubmissionModal } from '../../components/TaskSubmissionModal';
import { taskAPI } from '../../services/api';
import { Task } from '../../types';
import { Filter } from 'lucide-react';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await taskAPI.getTasks();
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return t.userStatus === 'Approved';
    if (filter === 'pending') return t.userStatus === 'Submitted' || t.userStatus === 'Under Review';
    if (filter === 'not_started') return !t.userStatus || t.userStatus === 'Not Started';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Monthly Ambassador Tasks</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Complete monthly leadership challenges, submit verification proof, and earn verified points.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
              >
                <option value="all">All Tasks ({tasks.length})</option>
                <option value="not_started">Not Started</option>
                <option value="pending">Under Review</option>
                <option value="completed">Approved</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-400">Loading tasks...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTasks.map((task) => (
                <TaskCard key={task._id} task={task} onOpen={(t) => setSelectedTask(t)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedTask && (
        <TaskSubmissionModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
};
