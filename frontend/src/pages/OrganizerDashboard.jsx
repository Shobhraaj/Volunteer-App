import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import GoogleMap from '../components/GoogleMap';

export default function OrganizerDashboard() {
  const [tasks, setTasks]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMap, setShowMap]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ open:false, taskId:null, taskTitle:'' });
  const [newTask, setNewTask] = useState({
    title:'', description:'', required_skills:'',
    urgency:'medium', location_name:'', latitude:'', longitude:'',
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
        required_skills: newTask.required_skills.split(',').map(s=>s.trim()).filter(Boolean),
        latitude: newTask.latitude ? parseFloat(newTask.latitude) : null,
        longitude: newTask.longitude ? parseFloat(newTask.longitude) : null,
        max_volunteers: parseInt(newTask.max_volunteers),
      });
      setShowCreateModal(false);
      setNewTask({ title:'', description:'', required_skills:'', urgency:'medium', location_name:'', latitude:'', longitude:'', max_volunteers:5 });
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
    setDeleteConfirm({ open:true, taskId: task.id, taskTitle: task.title });
  };

  const confirmDelete = async () => {
    const taskId = deleteConfirm.taskId;
    setDeleteConfirm({ open:false, taskId:null, taskTitle:'' });
    try {
      await api.deleteTask(taskId);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const set = (field) => (e) => setNewTask({ ...newTask, [field]: e.target.value });

  if (loading) {
    return (
      <div className="main-content">
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:140, borderRadius:16 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Organizer Dashboard</h1>
          <p>Manage tasks, view AI matches, and monitor progress</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-secondary" onClick={() => setShowMap(m=>!m)}>
            {showMap ? '📋 List View' : '🗺️ Map View'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Task</button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard icon="📋" label="Total Tasks"          value={stats.total_tasks}               color="cyan"    />
          <StatCard icon="🔥" label="Active Tasks"         value={stats.active_tasks}              color="amber"   />
          <StatCard icon="✅" label="Completed Tasks"      value={stats.completed_tasks}           color="emerald" />
          <StatCard icon="👥" label="Volunteers Engaged"   value={stats.total_volunteers_engaged}  color="violet"  />
        </div>
      )}

      {/* Map view */}
      {showMap && (
        <div className="card mb-6">
          <div className="card-header"><h3>🗺️ Task Locations</h3></div>
          <GoogleMap tasks={tasks} height="360px" />
        </div>
      )}

      <div className="task-grid">
        {tasks.map((task) => (
          <div className="task-card" key={task.id}>
            <div className="flex items-center justify-between mb-4">
              <span className={`urgency-tag urgency-${task.urgency}`}>{task.urgency}</span>
              <span className={`badge ${task.status==='completed'?'badge-emerald':task.status==='open'?'badge-cyan':'badge-amber'}`}>
                {task.status}
              </span>
            </div>
            <div className="task-title"><Link to={`/tasks/${task.id}`}>{task.title}</Link></div>
            <div className="task-desc">{task.description}</div>
            <div className="task-skills">
              {(task.required_skills||[]).map(s => <span key={s} className="skill-tag">{s}</span>)}
            </div>
            <div style={{ marginBottom:12 }}>
              <div className="flex items-center justify-between" style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:4 }}>
                <span>Volunteers</span><span>{task.current_volunteers}/{task.max_volunteers}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${Math.min(100,(task.current_volunteers/task.max_volunteers)*100)}%` }} />
              </div>
            </div>
            <div className="task-footer">
              <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>📍 {task.location_name||'Remote'}</span>
              <div className="flex gap-2">
                <Link to={`/tasks/${task.id}`} className="btn btn-secondary btn-sm">View Matches</Link>
                {task.status==='open' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleAutoAssign(task.id)}>⚡ Auto-Assign</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No tasks yet</h3>
          <p>Create your first task to get started with AI matching</p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="task-title">Task Title</label>
                <input id="task-title" className="form-control" value={newTask.title} onChange={set('title')} placeholder="e.g. Community Teaching Session" required />
              </div>
              <div className="form-group">
                <label htmlFor="task-desc">Description</label>
                <textarea id="task-desc" className="form-control" value={newTask.description} onChange={set('description')} placeholder="Describe the task..." />
              </div>
              <div className="form-group">
                <label htmlFor="task-skills">Required Skills (comma-separated)</label>
                <input id="task-skills" className="form-control" value={newTask.required_skills} onChange={set('required_skills')} placeholder="teaching, mentoring, public_speaking" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group">
                  <label htmlFor="task-urgency">Urgency</label>
                  <select id="task-urgency" className="form-control" value={newTask.urgency} onChange={set('urgency')}>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="task-max">Max Volunteers</label>
                  <input id="task-max" className="form-control" type="number" min="1" value={newTask.max_volunteers} onChange={set('max_volunteers')} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="task-location">Location</label>
                <input id="task-location" className="form-control" value={newTask.location_name} onChange={set('location_name')} placeholder="e.g. Mumbai" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group">
                  <label htmlFor="task-lat">Latitude (optional)</label>
                  <input id="task-lat" className="form-control" type="number" step="any" value={newTask.latitude} onChange={set('latitude')} placeholder="19.076" />
                </div>
                <div className="form-group">
                  <label htmlFor="task-lng">Longitude (optional)</label>
                  <input id="task-lng" className="form-control" type="number" step="any" value={newTask.longitude} onChange={set('longitude')} placeholder="72.877" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn btn-primary">Create Task</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
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
        onCancel={() => setDeleteConfirm({ open:false, taskId:null, taskTitle:'' })}
      />
    </div>
  );
}
