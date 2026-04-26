import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import MatchScoreBadge from '../components/MatchScoreBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import GoogleMap from '../components/GoogleMap';
import StatusIndicator from '../components/StatusIndicator';
import TaskTracking from '../components/TaskTracking';


export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [task, setTask]             = useState(null);
  const [matches, setMatches]       = useState([]);
  const [participants, setParticipants] = useState([]);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('details');

  // Confirm dialogs
  const [applyConfirm, setApplyConfirm]   = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => { loadTask(); }, [id]);

  const loadTask = async () => {
    try {
      const t = await api.getTask(id);
      setTask(t);
      if (user.role === 'organizer') {
        const [m, p] = await Promise.all([api.getMatches(id, 15), api.getParticipants(id)]);
        setMatches(m); setParticipants(p);
      } else {
        const p = await api.getParticipants(id);
        setParticipants(p);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAssign = async (volId) => {
    try { await api.assignVolunteers(id, [volId]); loadTask(); }
    catch (err) { alert(err.message); }
  };

  const handleAutoAssign = async () => {
    try {
      const result = await api.autoAssign(id);
      alert(`✅ Auto-assigned ${result.assigned_count} volunteers!`);
      loadTask();
    } catch (err) { alert(err.message); }
  };

  const confirmApply = async () => {
    setApplyConfirm(false);
    try { await api.applyToTask(parseInt(id)); loadTask(); }
    catch (err) { alert(err.message); }
  };

  const confirmCancel = async () => {
    setCancelConfirm(false);
    if (!myParticipation) return;
    try { await api.cancelParticipation(myParticipation.id); loadTask(); }
    catch (err) { alert(err.message); }
  };

  const confirmDelete = async () => {
    setDeleteConfirm(false);
    try { await api.deleteTask(parseInt(id)); window.location.href='/dashboard'; }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="main-content"><div className="skeleton" style={{ height:400, borderRadius:16 }} /></div>;
  if (!task)   return <div className="main-content"><div className="empty-state"><h3>Task not found</h3></div></div>;

  const myParticipation = participants.find(p => p.volunteer_id === user.id);

  const handleWithdraw = async () => {
    try {
      await api.withdrawFromTask(id);
      setWithdrawConfirm(false);
      loadTask();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateParticipationStatus(id, user.id, newStatus);
      loadTask();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="main-content pt-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="animate-slide-up">
          <Link to="/dashboard" className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-2 mb-4 uppercase tracking-widest">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">{task.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`urgency-tag urgency-${task.urgency}`}>{task.urgency}</span>
            <span className={`badge ${task.status==='completed'?'badge-emerald':task.status==='open'?'badge-cyan':'badge-amber'}`}>{task.status.toUpperCase()}</span>
            <span className="text-sm font-bold text-slate-400">📍 {task.location_name||'Remote'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TabButton active={tab==='details'} onClick={()=>setTab('details')} label="Details" />
        {user.role==='organizer' && (
          <TabButton active={tab==='matches'} onClick={()=>setTab('matches')} label={`🧠 AI Matches (${matches.length})`} />
        )}
        <TabButton active={tab==='participants'} onClick={()=>setTab('participants')} label={`Participants (${participants.length})`} />
        {task.latitude && <TabButton active={tab==='map'} onClick={()=>setTab('map')} label="🗺️ Map View" />}
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {tab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-6">Description</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {task.description||'No description provided.'}
                </p>
                <h3 className="text-xl font-bold mt-10 mb-6">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(task.required_skills||[]).map(s => <span key={s} className="skill-tag !text-xs !px-4 !py-2">{s}</span>)}
                  {(!task.required_skills||task.required_skills.length===0) && <span className="text-sm font-bold text-slate-400">No specific skills required</span>}
                </div>
                {task.start_time && (
                  <>
                    <h3 className="text-xl font-bold mt-10 mb-6">Schedule</h3>
                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl">🗓️</span>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">Time Window</div>
                          <p className="text-xs font-medium text-slate-500 mt-1">
                            {new Date(task.start_time).toLocaleString()} — {task.end_time ? new Date(task.end_time).toLocaleString() : 'Open-ended'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {myParticipation && (
                <TaskTracking 
                  taskId={id} 
                  volunteerId={user.id} 
                  initialStatus={myParticipation.status} 
                  initialHistory={JSON.parse(myParticipation.status_history || '[]')} 
                />
              )}
              <div className="card">
                <h3 className="text-xl font-bold mb-8">Task Stats</h3>
                <div className="space-y-6">
                  <StatRow label="Current Status" value={task.status} />
                  <StatRow label="Priority"      value={task.urgency} />
                  <StatRow label="Allocation"    value={`${task.current_volunteers}/${task.max_volunteers}`} />
                  <StatRow label="Location Type" value={task.location_name||'Remote'} />
                </div>

                <div className="mt-8 mb-10 pt-8 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Filling Progress</span>
                    <span>{Math.round((task.current_volunteers/task.max_volunteers)*100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-1000" 
                      style={{ width:`${Math.min(100,(task.current_volunteers/task.max_volunteers)*100)}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {user.role==='volunteer' && myParticipation && myParticipation.status==='assigned' && (
                    <button className="btn btn-primary w-full py-4" onClick={() => handleStatusChange('accepted')}>Accept Assignment</button>
                  )}
                  {user.role==='volunteer' && myParticipation && myParticipation.status==='accepted' && (
                    <button className="btn btn-primary w-full py-4" onClick={() => handleStatusChange('active')}>Start Task Now</button>
                  )}
                  {user.role==='volunteer' && myParticipation && myParticipation.status==='active' && (
                    <button className="btn btn-primary !bg-emerald-500 !shadow-emerald-500/20 w-full py-4" onClick={() => handleStatusChange('completed')}>Mark as Completed</button>
                  )}
                  {user.role==='volunteer' && task.status==='open' && !myParticipation && (
                    <button className="btn btn-primary w-full py-4" onClick={() => setApplyConfirm(true)}>Apply for Task</button>
                  )}
                  {user.role==='volunteer' && myParticipation && (myParticipation.status==='assigned' || myParticipation.status==='accepted') && (
                    <button className="btn btn-secondary !text-red-500 hover:!bg-red-500/10 w-full py-4" onClick={() => setWithdrawConfirm(true)}>Withdraw</button>
                  )}
                  {user.role==='organizer' && (
                    <button className="btn btn-danger w-full py-4" onClick={() => setDeleteConfirm(true)}>🗑️ Cancel Task</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'matches' && user.role==='organizer' && (
          <div className="card">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold">🧠 AI-Ranked Volunteers</h3>
              <button className="btn btn-primary !bg-emerald-500 !shadow-emerald-500/20 !px-4 !py-2 !text-xs" onClick={handleAutoAssign}>⚡ Auto-Assign Top</button>
            </div>
            {matches.length===0 ? <EmptyState icon="🧠" title="No matches found" text="We couldn't find suitable volunteers for this task yet." /> : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Volunteer</th>
                      <th>Match Score</th>
                      <th>Reliability</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m,i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-4">
                            <StatusIndicator userId={m.volunteer.id} />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white leading-none mb-1">{m.volunteer.full_name}</div>
                              <div className="text-[10px] font-medium text-slate-400">{m.volunteer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><MatchScoreBadge score={m.match_score} /></td>
                        <td className="font-bold text-slate-500">{(m.reliability_score*100).toFixed(0)}%</td>
                        <td>
                          <button className="btn btn-primary !px-4 !py-2 !text-xs" onClick={() => handleAssign(m.volunteer.id)}>Assign</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'participants' && (
          <div className="card">
            <h3 className="text-xl font-bold mb-10">Task Participants</h3>
            {participants.length===0 ? <EmptyState icon="👥" title="No participants yet" text="Wait for volunteers to apply or start assigning them!" /> : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Volunteer</th>
                      <th>Status</th>
                      <th>Match Score</th>
                      <th>Joined On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="flex items-center gap-4">
                            <StatusIndicator userId={p.volunteer_id} />
                            <span className="font-bold text-slate-900 dark:text-white text-sm">Volunteer #{p.volunteer_id}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${p.status==='completed'?'emerald':p.status==='assigned'?'cyan':p.status==='no_show'?'danger':'violet'}`}>{p.status.toUpperCase()}</span>
                        </td>
                        <td>{p.match_score ? <MatchScoreBadge score={p.match_score} /> : <span className="text-slate-400 text-xs">—</span>}</td>
                        <td className="text-xs font-medium text-slate-400">{p.applied_at ? new Date(p.applied_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'map' && task.latitude && (
          <div className="card overflow-hidden !p-0">
            <div className="p-8 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-xl font-bold">🗺️ Task Location</h3>
            </div>
            <GoogleMap tasks={[task]} center={{ lat: task.latitude, lng: task.longitude }} zoom={14} height="500px" />
          </div>
        )}
      </div>

      <ConfirmDialog open={applyConfirm} title="Confirm Application"
        message={`Apply for "${task.title}"? The organizer will be notified.`}
        confirmLabel="Yes, Apply" onConfirm={confirmApply} onCancel={() => setApplyConfirm(false)} />

      <ConfirmDialog open={cancelConfirm} title="Cancel Application" danger
        message="Withdraw your application? This action cannot be undone."
        confirmLabel="Yes, Withdraw" cancelLabel="Keep Application"
        onConfirm={confirmCancel} onCancel={() => setCancelConfirm(false)} />

      <ConfirmDialog open={deleteConfirm} title="Cancel Task" danger
        message={`Delete "${task.title}"? All volunteer applications will be cancelled and notifications sent.`}
        confirmLabel="Yes, Delete Task"
        onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(false)} />

      <ConfirmDialog
        open={withdrawConfirm}
        title="Withdraw from Task"
        message="Are you sure you want to withdraw? This will remove you from the task and notify the organizer."
        confirmLabel="Yes, Withdraw"
        danger
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawConfirm(false)}
      />
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button 
      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-white dark:bg-white/10 text-primary-500 shadow-sm' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`} 
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 card border-dashed">
      <div className="text-5xl mb-4 grayscale opacity-20">{icon}</div>
      <h3 className="text-lg font-bold text-slate-400 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs">{text}</p>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{value}</span>
    </div>
  );
}

