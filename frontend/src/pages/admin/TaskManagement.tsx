import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Task } from '../../types';
import { Plus, Edit2, Trash2, CheckSquare, X, Calendar, Award } from 'lucide-react';

export const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [taskNumber, setTaskNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('Product Trials');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [points, setPoints] = useState<number>(500);
  const [deadline, setDeadline] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await adminAPI.getTasks();
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

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTaskNumber(tasks.length + 1);
    setTitle('');
    setCategory('Product Trials');
    setShortDescription('');
    setFullDescription('');
    setPoints(500);
    setDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsMandatory(true);
    setShowModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTaskNumber(task.taskNumber);
    setTitle(task.title);
    setCategory(task.category);
    setShortDescription(task.shortDescription);
    setFullDescription(task.fullDescription);
    setPoints(task.points);
    setDeadline(new Date(task.deadline).toISOString().split('T')[0]);
    setIsMandatory(task.isMandatory);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        taskNumber,
        title,
        category,
        shortDescription,
        fullDescription,
        points: Number(points),
        deadline,
        isMandatory,
        allowedSubmissionTypes: ['text', 'url', 'image', 'document'],
      };

      if (editingTask) {
        await adminAPI.updateTask(editingTask._id, payload);
      } else {
        await adminAPI.createTask(payload);
      }
      setShowModal(false);
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving task.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete task "${title}"?`)) {
      try {
        await adminAPI.deleteTask(id);
        fetchTasks();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete task.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white">Dynamic 4-Task Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure monthly ambassador challenges, point values, submission formats, and deadlines dynamically.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task Slot</span>
        </button>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tasks.map((task) => (
          <div key={task._id} className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-700 text-indigo-300 border border-slate-600">
                  Task #{task.taskNumber} • {task.category}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  +{task.points} pts
                </span>
              </div>

              <h3 className="font-extrabold text-white text-base mb-2">{task.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{task.shortDescription}</p>

              <div className="text-[11px] text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{task.isMandatory ? 'Mandatory' : 'Optional'}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-700/80 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(task)}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => handleDelete(task._id, task.title)}
                className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-lg">
                {editingTask ? `Edit Task #${editingTask.taskNumber}` : 'Create New Task Slot'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Task Number</label>
                  <input
                    type="number"
                    value={taskNumber}
                    onChange={(e) => setTaskNumber(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Points Available</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Task Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Product Trials">Product Trials</option>
                  <option value="Content Creation">Content Creation</option>
                  <option value="Monthly Highlights">Monthly Highlights</option>
                  <option value="Product Understanding">Product Understanding</option>
                  <option value="Campus Leadership">Campus Leadership</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fest Stall Challenge: Build Night"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Short Description (for card)</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Description & Details</label>
                <textarea
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Requirement</label>
                  <select
                    value={isMandatory ? 'true' : 'false'}
                    onChange={(e) => setIsMandatory(e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="true">Mandatory</option>
                    <option value="false">Optional</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
