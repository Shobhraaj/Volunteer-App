import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import StatCard from '../components/StatCard';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [tab, setTab] = useState('recommended');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (taskId) => {
    try {
      await api.applyToTask(taskId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const completedCount = history.filter((h) => h.status === 'completed').length;
  const appliedIds = new Set(history.map((h) => h.task_id));

  if (loading) {
    return (
      <div className="main-content">
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

return (
  <div className="main-content fade-in px-6 py-6">
    
    {/* Header */}
    <div className="page-header mb-6">
      <h1 className="mb-2">
        Welcome back, {user?.full_name?.split(' ')[0]} 👋
      </h1>
      <p className="text-muted">
        Here's your volunteer activity and AI-powered task recommendations
      </p>
    </div>

    {/* Stats */}
    <div className="stats-grid mb-6 gap-4">
      <StatCard icon="🏆" label="Total Points" value={user?.points || 0} color="amber" />
      <StatCard icon="✅" label="Tasks Completed" value={completedCount} color="emerald" />
      <StatCard icon="🎖️" label="Badges Earned" value={badges.length} color="violet" />
      <StatCard
        icon="📊"
        label="Reliability Score"
        value={`${((user?.reliability_score || 0) * 100).toFixed(0)}%`}
        color="cyan"
      />
    </div>

    {/* Badges */}
    {badges.length > 0 && (
      <div className="card mb-6 p-4">
        <div className="card-header mb-4">
          <h3>🎖️ Your Badges</h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {badges.map((b, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              {b.badge_name}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Tabs */}
    <div className="tabs mb-6 flex gap-3">
      <button
        className={`tab-btn ${tab === 'recommended' ? 'active' : ''}`}
        onClick={() => setTab('recommended')}
      >
        🧠 AI Recommended
      </button>

      <button
        className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
        onClick={() => setTab('all')}
      >
        📋 All Open Tasks
      </button>

      <button
        className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
        onClick={() => setTab('history')}
      >
        📜 My History
      </button>
    </div>

    {/* Recommended */}
    {tab === 'recommended' && (
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="empty-state py-10 text-center">
            <div className="empty-icon mb-3">🧠</div>
            <h3 className="mb-2">No recommendations yet</h3>
            <p className="text-muted">
              Complete your profile with skills & availability to get AI-powered suggestions
            </p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div className="rec-card p-4 flex gap-4 items-start" key={rec.task.id}>
              
              <div className="rec-score">
                {rec.relevance_score.toFixed(0)}
              </div>

              <div className="rec-body flex-1">
                <div className="rec-title mb-1">
                  <Link to={`/tasks/${rec.task.id}`}>
                    {rec.task.title}
                  </Link>
                </div>

                <div className="text-xs text-muted mb-2">
                  {rec.task.location_name || 'Remote'} •{' '}
                  <span className={`urgency-tag urgency-${rec.task.urgency}`}>
                    {rec.task.urgency}
                  </span>
                </div>

                <div className="task-skills flex flex-wrap gap-2 mb-2">
                  {(rec.task.required_skills || []).map((s) => (
                    <span key={s} className="skill-tag">{s}</span>
                  ))}
                </div>

                <ul className="rec-reasons pl-5 space-y-1">
                  {rec.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="ml-auto">
                {appliedIds.has(rec.task.id) ? (
                  <span className="badge badge-emerald">Applied ✓</span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApply(rec.task.id)}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    )}

    {/* All Tasks */}
    {tab === 'all' && (
      <div className="task-grid gap-4">
        {allTasks.map((task) => (
          <div className="task-card p-4 flex flex-col gap-3" key={task.id}>
            
            <div className="flex items-center justify-between">
              <span className={`urgency-tag urgency-${task.urgency}`}>
                {task.urgency}
              </span>

              <span className="volunteer-count text-sm">
                {task.current_volunteers}/{task.max_volunteers} volunteers
              </span>
            </div>

            <div className="task-title">
              <Link to={`/tasks/${task.id}`}>
                {task.title}
              </Link>
            </div>

            <div className="task-desc text-sm">
              {task.description}
            </div>

            <div className="task-skills flex flex-wrap gap-2">
              {(task.required_skills || []).map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>

            <div className="task-footer flex items-center justify-between mt-2">
              <span className="text-xs text-muted">
                📍 {task.location_name || 'Remote'}
              </span>

              {appliedIds.has(task.id) ? (
                <span className="badge badge-emerald">Applied ✓</span>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApply(task.id)}
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* History */}
    {tab === 'history' && (
      <div className="card p-4">
        {history.length === 0 ? (
          <div className="empty-state py-10 text-center">
            <div className="empty-icon mb-3">📜</div>
            <h3 className="mb-2">No participation history</h3>
            <p className="text-muted">
              Apply to tasks to start building your history
            </p>
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="py-2 text-left">Task ID</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Match Score</th>
                <th className="py-2 text-left">Applied</th>
              </tr>
            </thead>

            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="py-2">
                    <Link to={`/tasks/${h.task_id}`}>
                      Task #{h.task_id}
                    </Link>
                  </td>

                  <td className="py-2">
                    <span className={`badge badge-${
                      h.status === 'completed' ? 'emerald'
                      : h.status === 'no_show' ? 'danger'
                      : h.status === 'assigned' ? 'cyan'
                      : 'violet'
                    }`}>
                      {h.status}
                    </span>
                  </td>

                  <td className="py-2">
                    {h.match_score ? `${h.match_score.toFixed(0)}%` : '—'}
                  </td>

                  <td className="py-2 text-xs text-muted">
                    {h.applied_at
                      ? new Date(h.applied_at).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )}

  </div>
);
