import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import StatCard from '../components/StatCard';
import ScrollReveal from '../components/ScrollReveal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTheme } from '../context/ThemeContext';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  
  // Modals / Dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, taskId: null });
  const [cancelAssignConfirm, setCancelAssignConfirm] = useState({ open: false, taskId: null, volId: null });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadInitialData();

    // Real-time Firestore listeners for tasks
    const tasksUnsub = onSnapshot(collection(db, 'task_tracking'), (snapshot) => {
      // When tracking updates, we might want to refresh the local state
      // but for simplicity, we'll just reload the main data or handle it incrementally
      loadInitialData();
    });

    return () => tasksUnsub();
  }, []);

  const loadInitialData = async () => {
    try {
      const [t, v, s] = await Promise.all([
        api.getMyTasks(),
        api.getLeaderboard(50),
        api.getOrgStats()
      ]);
      setTasks(t);
      setVolunteers(v);
      setStats(s);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open(api.exportReport(), '_blank');
  };

  const handleCancelAssignment = async () => {

    const { taskId, volId } = cancelAssignConfirm;
    try {
      await api.cancelAssignment(taskId, volId);
      setCancelAssignConfirm({ open: false, taskId: null, volId: null });
      loadInitialData();
    } catch (err) {
      alert('Failed to cancel assignment: ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTask(deleteConfirm.taskId);
      setDeleteConfirm({ open: false, taskId: null });
      loadInitialData();
    } catch (err) {
      alert('Failed to delete task: ' + err.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask({
      ...task,
      required_skills: (task.required_skills || []).join(', ')
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await api.updateTask(editingTask.id, {
        ...editingTask,
        required_skills: editingTask.required_skills.split(',').map(s=>s.trim()).filter(Boolean),
        max_volunteers: parseInt(editingTask.max_volunteers),
      });
      setShowEditModal(false);
      loadInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="main-content"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className="main-content pt-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Admin Control Panel</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Monitor resources, lifecycle stages, and volunteer performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button className="btn btn-secondary !px-4" onClick={handleExportCSV}>📥 Export Report</button>
          <button className="btn btn-secondary !px-4" onClick={() => navigate('/volunteers')}>👥 Volunteers</button>
          <button className="btn btn-primary !px-4" onClick={() => navigate('/analytics')}>📊 Insights</button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="stats-grid">
        <StatCard 
          icon="📋" label="All Tasks" value={tasks.length} color="cyan" 
          onClick={() => setStatusFilter('all')} 
        />
        <StatCard 
          icon="🔥" label="Active Tasks" value={stats?.active_tasks || 0} color="amber" 
          onClick={() => setStatusFilter('in_progress')} 
        />
        <StatCard 
          icon="✅" label="Completed Tasks" value={stats?.completed_tasks || 0} color="emerald" 
          onClick={() => setStatusFilter('completed')} 
        />
        <StatCard 
          icon="👥" label="Total Volunteers" value={volunteers.length} color="violet" 
          onClick={() => navigate('/volunteers')} 
        />
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Task Management */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold">Task Lifecycle</h3>
              {statusFilter !== 'all' && (
                <button 
                  className="badge badge-cyan hover:scale-105 transition-transform" 
                  onClick={() => setStatusFilter('all')}
                >
                  Filter: {statusFilter} ✕
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="form-input !py-2 !pl-10 !text-sm w-full md:w-64" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
            </div>
          </div>
          
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Allocation</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="group">
                    <td className="font-bold text-slate-900 dark:text-white">
                      <Link to={`/tasks/${task.id}`} className="hover:text-primary-500 transition-colors block leading-tight">{task.title}</Link>
                      <div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">📍 {task.location_name || 'Remote'}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${task.status==='completed'?'emerald':task.status==='open'?'cyan':'amber'}`}>
                        {task.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden max-w-[80px]">
                          <div 
                            className="h-full bg-primary-500 transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (task.current_volunteers / task.max_volunteers) * 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400">{task.current_volunteers}/{task.max_volunteers}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex -space-x-2">
                        {[1, 2, 3].slice(0, task.current_volunteers).map(i => (
                          <div key={i} className="w-7 h-7 rounded-full bg-primary-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-sm">V</div>
                        ))}
                        {task.current_volunteers > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-500 shadow-sm">+{task.current_volunteers-3}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-primary-500/10 text-primary-500 rounded-lg transition-colors" onClick={() => handleEditTask(task)} title="Edit">✏️</button>
                        <button className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors" onClick={() => setDeleteConfirm({ open: true, taskId: task.id })} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volunteer Rankings */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Volunteer Performance</h3>
            <button className="text-xs font-bold text-primary-500 hover:underline uppercase tracking-widest">Full Leaderboard →</button>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Score</th>
                  <th>Reliability</th>
                  <th>Badges</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.slice(0, 8).map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-white shadow-sm">
                          {v.full_name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-none mb-1">{v.full_name}</div>
                          <div className="text-[10px] font-medium text-slate-400 uppercase">{v.tasks_completed} tasks completed</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-extrabold text-primary-500">{v.points} pts</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                          <div 
                            className={`h-full transition-all duration-1000 ${v.reliability > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${v.reliability}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400">{v.reliability}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {(v.badges || []).slice(0, 2).map(b => (
                          <span key={b} className="skill-tag !text-[9px] !px-2 !py-0.5 !m-0">{b}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-soft" />
                        Online
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div className="glass-card w-full max-w-xl p-8 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-8">Modify Task Details</h2>
            <form onSubmit={handleUpdateTask} className="space-y-6">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input className="form-input" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input min-h-[100px]" value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Required Skills</label>
                  <input className="form-input text-xs" placeholder="UI, React, Writing..." value={editingTask.required_skills} onChange={e => setEditingTask({...editingTask, required_skills: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Volunteers</label>
                  <input className="form-input" type="number" value={editingTask.max_volunteers} onChange={e => setEditingTask({...editingTask, max_volunteers: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 btn btn-primary py-4">Save Changes</button>
                <button type="button" className="flex-1 btn btn-secondary py-4" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        open={deleteConfirm.open} 
        title="Delete Task?" 
        message="This will permanently remove the task and all assignments."
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, taskId: null })}
      />

      <ConfirmDialog 
        open={cancelAssignConfirm.open} 
        title="Cancel Assignment?" 
        message="This will remove the volunteer from this task and notify them."
        danger
        onConfirm={handleCancelAssignment}
        onCancel={() => setCancelAssignConfirm({ open: false, taskId: null, volId: null })}
      />
    </div>
  );
}



