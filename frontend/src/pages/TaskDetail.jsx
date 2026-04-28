import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import MatchScoreBadge from '../components/MatchScoreBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import GoogleMap from '../components/GoogleMap';
import StatusIndicator from '../components/StatusIndicator';
import TaskTracking from '../components/TaskTracking';
import { MapPin, BrainCircuit, Users, Map, Calendar, Trash2, ChevronLeft, Info } from 'lucide-react';


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
    <div className="main-content animate-fade-in !py-12">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-10 animate-slide-up">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-primary-500 hover:text-primary-600 transition-colors uppercase tracking-[0.2em] mb-6 group">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
              {task.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`urgency-tag urgency-${task.urgency} !px-4 !py-1.5 !text-[11px]`}>{task.urgency}</span>
              <span className={`badge ${task.status==='completed'?'badge-emerald':task.status==='open'?'badge-cyan':'badge-amber'} !px-4 !py-1.5 font-bold text-[11px]`}>{task.status.toUpperCase()}</span>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" /> 
                {task.location_name||'Remote'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex p-1.5 bg-slate-200/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl w-fit mb-12 animate-slide-up border border-slate-200/50 dark:border-white/5" style={{ animationDelay: '0.1s' }}>
        <TabButton active={tab==='details'} onClick={()=>setTab('details')} label={<><Info className="w-4 h-4" /> Details</>} />
        {user.role==='organizer' && (
          <TabButton active={tab==='matches'} onClick={()=>setTab('matches')} label={<><BrainCircuit className="w-4 h-4" /> AI Matches ({matches.length})</>} />
        )}
        <TabButton active={tab==='participants'} onClick={()=>setTab('participants')} label={<><Users className="w-4 h-4" /> Participants ({participants.length})</>} />
        {task.latitude && <TabButton active={tab==='map'} onClick={()=>setTab('map')} label={<><Map className="w-4 h-4" /> Map View</>} />}
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {tab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="card !p-10">
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                    Description
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-lg">
                    {task.description||'No description provided.'}
                  </p>
                </div>

                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {(task.required_skills||[]).map(s => (
                      <span key={s} className="skill-tag !text-[11px] !px-5 !py-2.5 !m-0">
                        {s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    ))}
                    {(!task.required_skills||task.required_skills.length===0) && <span className="text-sm font-bold text-slate-400 italic">No specific skills required</span>}
                  </div>
                </div>

                {task.start_time && (
                  <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                      Schedule
                    </h3>
                    <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center gap-6">
                      <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/10">
                        <Calendar className="w-7 h-7 text-primary-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Window</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {new Date(task.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <div className="text-sm font-medium text-slate-500">
                          to {task.end_time ? new Date(task.end_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Open-ended'}
                        </div>
                      </div>
                    </div>
                  </div>
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
              <div className="card !p-8 h-fit sticky top-32">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                  <BrainCircuit className="w-5 h-5 text-primary-500" />
                  Task Stats
                </h3>
                <div className="space-y-5">
                  <StatRow label="Current Status" value={task.status} />
                  <StatRow label="Priority"      value={task.urgency} />
                  <StatRow label="Allocation"    value={`${task.current_volunteers} / ${task.max_volunteers}`} />
                  <StatRow label="Location"      value={task.location_name||'Remote'} />
                </div>

                <div className="mt-8 mb-10 pt-8 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    <span>Filling Progress</span>
                    <span className="text-primary-500">{Math.round((task.current_volunteers/task.max_volunteers)*100)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000 rounded-full" 
                      style={{ width:`${Math.min(100,(task.current_volunteers/task.max_volunteers)*100)}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {user.role==='volunteer' && myParticipation && myParticipation.status==='assigned' && (
                    <button className="btn btn-primary w-full py-4 shadow-xl shadow-primary-500/20" onClick={() => handleStatusChange('accepted')}>Accept Assignment</button>
                  )}
                  {user.role==='volunteer' && myParticipation && myParticipation.status==='accepted' && (
                    <button className="btn btn-primary w-full py-4 shadow-xl shadow-primary-500/20" onClick={() => handleStatusChange('active')}>Start Task Now</button>
                  )}
                  {user.role==='volunteer' && myParticipation && myParticipation.status==='active' && (
                    <button className="btn btn-primary !bg-emerald-500 !shadow-emerald-500/30 w-full py-4" onClick={() => handleStatusChange('completed')}>Mark as Completed</button>
                  )}
                  {user.role==='volunteer' && task.status==='open' && !myParticipation && (
                    <button className="btn btn-primary w-full py-4 shadow-xl shadow-primary-500/20" onClick={() => setApplyConfirm(true)}>Apply for Task</button>
                  )}
                  {user.role==='volunteer' && myParticipation && (myParticipation.status==='assigned' || myParticipation.status==='accepted') && (
                    <button className="btn btn-secondary !bg-red-500/5 !text-red-500 hover:!bg-red-500/10 w-full py-4" onClick={() => setWithdrawConfirm(true)}>Withdraw Application</button>
                  )}
                  {user.role==='organizer' && (
                    <button className="btn btn-danger w-full py-4 shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 font-bold" onClick={() => setDeleteConfirm(true)}>
                      <Trash2 className="w-5 h-5" /> 
                      Cancel Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'matches' && user.role==='organizer' && (
          <div className="card">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold flex items-center gap-2"><BrainCircuit className="w-6 h-6 text-primary-500" /> AI-Ranked Volunteers</h3>
              <button className="btn btn-primary !bg-emerald-500 !shadow-emerald-500/20 !px-4 !py-2 !text-xs" onClick={handleAutoAssign}>⚡ Auto-Assign Top</button>
            </div>
            {matches.length===0 ? <EmptyState icon={<BrainCircuit className="w-16 h-16" />} title="No matches found" text="We couldn't find suitable volunteers for this task yet." /> : (
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
            <h3 className="text-xl font-bold mb-10 flex items-center gap-2"><Users className="w-6 h-6 text-primary-500" /> Task Participants</h3>
            {participants.length===0 ? <EmptyState icon={<Users className="w-16 h-16" />} title="No participants yet" text="Wait for volunteers to apply or start assigning them!" /> : (
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
              <h3 className="text-xl font-bold flex items-center gap-2"><Map className="w-6 h-6 text-primary-500" /> Task Location</h3>
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
      className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
      <div className="mb-4 text-slate-300 dark:text-slate-700">{icon}</div>
      <h3 className="text-lg font-bold text-slate-400 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs">{text}</p>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</span>
      <span className="text-xs font-extrabold text-slate-900 dark:text-white capitalize bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5">{value}</span>
    </div>
  );
}

