import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import ActivityStatus from '../components/ActivityStatus';
import { notifyTaskApplied, notifyTaskCancelled } from '../services/notificationService';
import { Trophy, CheckCircle, Award, BarChart3, BrainCircuit, List, FileText, MapPin } from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [tab, setTab] = useState('recommended');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Confirm dialog state
  const [confirm, setConfirm] = useState({ open: false, taskId: null });
  const [cancelConfirm, setCancelConfirm] = useState({ open: false, participationId: null });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [recs, hist, bdgs, tasks] = await Promise.all([
        api.getRecommendations(8),
        api.getHistory(),
        api.getBadges(),
        api.listTasks('open'),
      ]);
      setRecommendations(recs);
      setHistory(hist);
      setBadges(bdgs);
      setAllTasks(tasks);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApply = async (taskId) => {
    setConfirm({ open: true, taskId });
  };

  const confirmApply = async () => {
    const taskId = confirm.taskId;
    setConfirm({ open: false, taskId: null });
    try {
      const res = await api.applyToTask(taskId);
      const task = allTasks.find(t => t.id === taskId);
      if (task) notifyTaskApplied(user.id, task.title);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleCancel = (participationId) => {
    setCancelConfirm({ open: true, participationId });
  };

  const confirmCancel = async () => {
    const pid = cancelConfirm.participationId;
    setCancelConfirm({ open: false, participationId: null });
    try {
      await api.cancelParticipation(pid);
      const histItem = history.find(h => h.id === pid);
      if (histItem) notifyTaskCancelled(user.id, `Task #${histItem.task_id}`);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const completedCount = history.filter((h) => h.status === 'completed').length;
  const appliedMap = {};
  history.forEach(h => { appliedMap[h.task_id] = h; });

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
    <div className="main-content animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Welcome back,{' '}
            <span className="text-primary-500">{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Here's your volunteer activity and AI-powered task recommendations
          </p>
        </div>

        <div
          className="flex items-center gap-4 p-4 glass-card shadow-sm animate-slide-up shrink-0"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">
            Your Status
          </div>
          <ActivityStatus userId={user?.id} />
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="stats-grid mb-10">
        <StatCard icon={<Trophy className="w-6 h-6" />}     label="Total Points"      value={user?.points || 0}                                    color="amber"   />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Tasks Completed"   value={completedCount}                                        color="emerald" />
        <StatCard icon={<Award className="w-6 h-6" />}      label="Badges Earned"     value={badges.length}                                         color="violet"  />
        <StatCard icon={<BarChart3 className="w-6 h-6" />}  label="Reliability Score" value={`${((user?.reliability_score || 0) * 100).toFixed(0)}%`} color="cyan"  />
      </div>

      {/* ── Badges ─────────────────────────────────────────────────── */}
      {badges.length > 0 && (
        <div className="card mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-violet-500 shrink-0" />
            <h3 className="text-lg font-bold">Your Achievements</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm font-bold text-violet-600 dark:text-violet-400 flex items-center gap-2 apple-hover"
              >
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse-soft shrink-0" />
                {b.badge_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div
        className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit mb-8 animate-slide-up"
        style={{ animationDelay: '0.3s' }}
      >
        <TabButton
          active={tab === 'recommended'}
          onClick={() => setTab('recommended')}
          label={<span className="flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> AI Recommended</span>}
        />
        <TabButton
          active={tab === 'all'}
          onClick={() => setTab('all')}
          label={<span className="flex items-center gap-2"><List className="w-4 h-4" /> All Open Tasks</span>}
        />
        <TabButton
          active={tab === 'history'}
          onClick={() => setTab('history')}
          label={<span className="flex items-center gap-2"><FileText className="w-4 h-4" /> My History</span>}
        />
      </div>

      {/* ── Tab Panels ─────────────────────────────────────────────── */}
      <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>

        {/* Recommended */}
        {tab === 'recommended' && (
          <div className="space-y-5">
            {recommendations.length === 0 ? (
              <EmptyState
                icon={<BrainCircuit className="w-12 h-12" />}
                title="No recommendations yet"
                text="Complete your profile with skills & availability to get AI-powered suggestions"
              />
            ) : recommendations.map((rec) => {
              const participation = appliedMap[rec.task.id];
              return (
                <div
                  className="rec-card apple-hover group cursor-pointer"
                  key={rec.task.id}
                  onClick={() => navigate(`/tasks/${rec.task.id}`)}
                >
                  {/* Score badge */}
                  <div className="rec-score group-hover:bg-primary-500 group-hover:text-white transition-colors shrink-0">
                    {rec.relevance_score.toFixed(0)}%
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors mb-2 truncate">
                      {rec.task.title}
                    </div>

                    <div className="flex items-center flex-wrap gap-3 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {rec.task.location_name || 'Remote'}
                      </span>
                      <span className={`urgency-tag urgency-${rec.task.urgency}`}>
                        {rec.task.urgency}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(rec.task.required_skills || []).map(s => (
                        <span key={s} className="skill-tag">{s}</span>
                      ))}
                    </div>

                    <ul className="space-y-1.5">
                      {rec.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="text-primary-500 mt-0.5 shrink-0">✦</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col justify-end shrink-0">
                    {!participation ? (
                      <button
                        className="btn btn-primary"
                        onClick={(e) => { e.stopPropagation(); handleApply(rec.task.id); }}
                      >
                        Apply Now
                      </button>
                    ) : participation.status === 'applied' || participation.status === 'assigned' ? (
                      <div className="flex flex-col gap-2">
                        <span className="badge badge-emerald py-2 px-4 !text-sm">Applied ✓</span>
                        {participation.status === 'applied' && (
                          <button
                            className="btn btn-secondary !bg-red-500/10 !text-red-500 hover:!bg-red-500/20"
                            onClick={(e) => { e.stopPropagation(); handleCancel(participation.id); }}
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className={`badge badge-${participation.status === 'completed' ? 'emerald' : 'violet'} py-2 px-4 !text-sm`}>
                        {participation.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All Tasks */}
        {tab === 'all' && (
          <div className="task-grid">
            {allTasks.map((task) => {
              const participation = appliedMap[task.id];
              return (
                <div
                  className="card flex flex-col apple-hover group cursor-pointer"
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`urgency-tag urgency-${task.urgency}`}>{task.urgency}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {task.current_volunteers}/{task.max_volunteers} filled
                    </span>
                  </div>

                  <div className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors mb-3 leading-snug">
                    {task.title}
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-5 flex-1 leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(task.required_skills || []).slice(0, 3).map(s => (
                      <span key={s} className="skill-tag !text-[10px] !px-2">{s}</span>
                    ))}
                    {task.required_skills?.length > 3 && (
                      <span className="text-[10px] font-bold text-slate-400 self-center">
                        +{task.required_skills.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {task.location_name || 'Remote'}
                    </span>
                    {!participation ? (
                      <button
                        className="btn btn-primary !px-4 !py-2 !text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleApply(task.id); }}
                      >
                        Apply
                      </button>
                    ) : participation.status === 'applied' ? (
                      <button
                        className="btn btn-secondary !bg-red-500/10 !text-red-500 !px-4 !py-2 !text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleCancel(participation.id); }}
                      >
                        Withdraw
                      </button>
                    ) : (
                      <span className={`badge badge-${participation.status === 'completed' ? 'emerald' : 'cyan'}`}>
                        {participation.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {allTasks.length === 0 && (
              <EmptyState
                icon={<List className="w-12 h-12" />}
                title="No open tasks right now"
                text="Check back soon for new opportunities!"
              />
            )}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Participation History</h3>
              <Link
                to="/history"
                className="text-sm font-bold text-primary-500 hover:underline underline-offset-2"
              >
                View Full History →
              </Link>
            </div>

            {history.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No participation history"
                text="Apply to tasks to start building your volunteer legacy!"
              />
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Match Score</th>
                      <th>Applied Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((h) => (
                      <tr key={h.id}>
                        <td className="font-bold text-slate-900 dark:text-white">
                          <Link
                            to={`/tasks/${h.task_id}`}
                            className="hover:text-primary-500 transition-colors"
                          >
                            Task #{h.task_id}
                          </Link>
                        </td>
                        <td>
                          <span className={`badge badge-${
                            h.status === 'completed' ? 'emerald'
                            : h.status === 'no_show'  ? 'danger'
                            : h.status === 'assigned' ? 'cyan'
                            : 'violet'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="font-medium">
                          {h.match_score ? `${h.match_score.toFixed(0)}%` : '—'}
                        </td>
                        <td className="text-slate-400">
                          {h.applied_at ? new Date(h.applied_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          {h.status === 'applied' && (
                            <button
                              className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wide transition-colors"
                              onClick={() => handleCancel(h.id)}
                            >
                              Withdraw
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm Dialogs ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirm.open}
        title="Confirm Application"
        message="Are you sure you want to apply for this task? The organizer will be notified of your application."
        confirmLabel="Yes, Apply Now"
        onConfirm={confirmApply}
        onCancel={() => setConfirm({ open: false, taskId: null })}
      />

      <ConfirmDialog
        open={cancelConfirm.open}
        title="Withdraw Application"
        message="Are you sure you want to withdraw? This will remove you from the candidate list."
        confirmLabel="Yes, Withdraw"
        cancelLabel="Keep Application"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setCancelConfirm({ open: false, participationId: null })}
      />
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
      <div className="mb-5 text-slate-300 dark:text-slate-700">{icon}</div>
      <h3 className="text-lg font-bold text-slate-400 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">{text}</p>
    </div>
  );
}
