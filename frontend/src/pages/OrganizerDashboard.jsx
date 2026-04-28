import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import GoogleMap from '../components/GoogleMap';
import { MapPin, Plus, Map, List, Trash2, Zap, BarChart3 } from 'lucide-react';

export default function OrganizerDashboard() {
  const [tasks, setTasks]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMap, setShowMap]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, taskId: null, taskTitle: '' });
  const [newTask, setNewTask] = useState({
    title: '', description: '', required_skills: '',
    urgency: 'medium', location_name: '', latitude: '', longitude: '',
    max_volunteers: 5,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, s] = await Promise.all([api.getMyTasks(), api.getOrgStats()]);
      setTasks(t); setStats(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createTask({
        ...newTask,
        required_skills: newTask.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        latitude: newTask.latitude ? parseFloat(newTask.latitude) : null,
        longitude: newTask.longitude ? parseFloat(newTask.longitude) : null,
        max_volunteers: parseInt(newTask.max_volunteers),
      });
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', required_skills: '', urgency: 'medium', location_name: '', latitude: '', longitude: '', max_volunteers: 5 });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleAutoAssign = async (taskId) => {
    try {
      const result = await api.autoAssign(taskId);
      alert(`✅ Auto-assigned ${result.assigned_count} volunteers!`);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteTask = (task) => {
    setDeleteConfirm({ open: true, taskId: task.id, taskTitle: task.title });
  };

  const confirmDelete = async () => {
    const taskId = deleteConfirm.taskId;
    setDeleteConfirm({ open: false, taskId: null, taskTitle: '' });
    try {
      await api.deleteTask(taskId);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const set = (field) => (e) => setNewTask({ ...newTask, [field]: e.target.value });

  if (loading) {
    return (
      <div className="main-content py-8 px-4 md:px-8">
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content py-8 px-4 md:px-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Organizer Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage tasks, view AI matches, and monitor progress</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="btn btn-secondary" onClick={() => setShowMap(m => !m)}>
            {showMap ? <><List className="w-4 h-4" /> List View</> : <><Map className="w-4 h-4" /> Map View</>}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard icon={<BarChart3 className="w-6 h-6" />} label="Total Tasks"        value={stats.total_tasks}              color="cyan"    />
          <StatCard icon="🔥"                                  label="Active Tasks"       value={stats.active_tasks}             color="amber"   />
          <StatCard icon="✅"                                  label="Completed Tasks"    value={stats.completed_tasks}          color="emerald" />
          <StatCard icon="👥"                                  label="Volunteers Engaged" value={stats.total_volunteers_engaged} color="violet"  />
        </div>
      )}

      {/* Map view */}
      {showMap && (
        <div className="card mb-8 !p-0 overflow-hidden animate-slide-up">
          <div className="p-6 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-xl font-bold flex items-center gap-2"><Map className="w-5 h-5 text-primary-500" /> Task Locations</h3>
          </div>
          <GoogleMap tasks={tasks} height="360px" />
        </div>
      )}

      <div className="task-grid animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {tasks.map((task) => (
          <div className="card flex flex-col apple-hover group" key={task.id}>
            <div className="flex items-center justify-between mb-4">
              <span className={`urgency-tag urgency-${task.urgency}`}>{task.urgency}</span>
              <span className={`badge ${task.status === 'completed' ? 'badge-emerald' : task.status === 'open' ? 'badge-cyan' : 'badge-amber'}`}>
                {task.status}
              </span>
            </div>

            <Link
              to={`/tasks/${task.id}`}
              className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors mb-2 block"
            >
              {task.title}
            </Link>

            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
              {task.description}
            </p>

            <div className="flex flex-wrap mb-4">
              {(task.required_skills || []).slice(0, 3).map(s => (
                <span key={s} className="skill-tag !text-[10px] !px-2">{s}</span>
              ))}
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span>Volunteers</span>
                <span>{task.current_volunteers}/{task.max_volunteers}</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (task.current_volunteers / task.max_volunteers) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {task.location_name || 'Remote'}
              </span>
              <div className="flex gap-2">
                <Link to={`/tasks/${task.id}`} className="btn btn-secondary btn-sm">
                  View Matches
                </Link>
                {task.status === 'open' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleAutoAssign(task.id)}>
                    <Zap className="w-3 h-3" /> Auto
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm !px-2.5"
                  onClick={() => handleDeleteTask(task)}
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="empty-state mt-8">
          <div className="empty-icon">📋</div>
          <h3>No tasks yet</h3>
          <p>Create your first task to get started with AI matching</p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold !mb-0">Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Task Title</label>
                <input id="task-title" className="form-input" value={newTask.title} onChange={set('title')} placeholder="e.g. Community Teaching Session" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">Description</label>
                <textarea id="task-desc" className="form-input min-h-[90px]" value={newTask.description} onChange={set('description')} placeholder="Describe the task..." />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-skills">Required Skills (comma-separated)</label>
                <input id="task-skills" className="form-input" value={newTask.required_skills} onChange={set('required_skills')} placeholder="teaching, mentoring, public_speaking" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-urgency">Urgency</label>
                  <select id="task-urgency" className="form-input" value={newTask.urgency} onChange={set('urgency')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-max">Max Volunteers</label>
                  <input id="task-max" className="form-input" type="number" min="1" value={newTask.max_volunteers} onChange={set('max_volunteers')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-location">Location</label>
                <input id="task-location" className="form-input" value={newTask.location_name} onChange={set('location_name')} placeholder="e.g. Mumbai" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group !mb-0">
                  <label className="form-label" htmlFor="task-lat">Latitude (optional)</label>
                  <input id="task-lat" className="form-input" type="number" step="any" value={newTask.latitude} onChange={set('latitude')} placeholder="19.076" />
                </div>
                <div className="form-group !mb-0">
                  <label className="form-label" htmlFor="task-lng">Longitude (optional)</label>
                  <input id="task-lng" className="form-input" type="number" step="any" value={newTask.longitude} onChange={set('longitude')} placeholder="72.877" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/10 mt-2">
                <button type="submit" className="btn btn-primary flex-1">Create Task</button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Cancel Task"
        message={`Are you sure you want to delete "${deleteConfirm.taskTitle}"? All volunteer applications will be cancelled.`}
        confirmLabel="Yes, Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, taskId: null, taskTitle: '' })}
      />
    </div>
  );
}
