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
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p>Here's your volunteer activity and AI-powered task recommendations</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
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
        <div className="card mb-6">
          <div className="card-header">
            <h3>🎖️ Your Badges</h3>
          </div>
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            {badges.map((b, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 12,
                  padding: '10px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {b.badge_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'recommended' ? 'active' : ''}`} onClick={() => setTab('recommended')}>
          🧠 AI Recommended
        </button>
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          📋 All Open Tasks
        </button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          📜 My History
        </button>
      </div>

      {/* Recommended */}
      {tab === 'recommended' && (
        <div>
          {recommendations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧠</div>
              <h3>No recommendations yet</h3>
              <p>Complete your profile with skills & availability to get AI-powered suggestions</p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <div className="rec-card" key={rec.task.id}>
                <div className="rec-score">{rec.relevance_score.toFixed(0)}</div>
                <div className="rec-body">
                  <div className="rec-title">
                    <Link to={`/tasks/${rec.task.id}`}>{rec.task.title}</Link>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    {rec.task.location_name || 'Remote'} • <span className={`urgency-tag urgency-${rec.task.urgency}`}>{rec.task.urgency}</span>
                  </div>
                  <div className="task-skills">
                    {(rec.task.required_skills || []).map((s) => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                  </div>
                  <ul className="rec-reasons">
                    {rec.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <div>
                  {appliedIds.has(rec.task.id) ? (
                    <span className="badge badge-emerald">Applied ✓</span>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => handleApply(rec.task.id)}>
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
        <div className="task-grid">
          {allTasks.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="flex items-center justify-between mb-4">
                <span className={`urgency-tag urgency-${task.urgency}`}>{task.urgency}</span>
                <span className="volunteer-count">
                  {task.current_volunteers}/{task.max_volunteers} volunteers
                </span>
              </div>
              <div className="task-title">
                <Link to={`/tasks/${task.id}`}>{task.title}</Link>
              </div>
              <div className="task-desc">{task.description}</div>
              <div className="task-skills">
                {(task.required_skills || []).map((s) => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
              <div className="task-footer">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📍 {task.location_name || 'Remote'}
                </span>
                {appliedIds.has(task.id) ? (
                  <span className="badge badge-emerald">Applied ✓</span>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleApply(task.id)}>
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
        <div className="card">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📜</div>
              <h3>No participation history</h3>
              <p>Apply to tasks to start building your history</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Status</th>
                  <th>Match Score</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <Link to={`/tasks/${h.task_id}`}>Task #{h.task_id}</Link>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        h.status === 'completed' ? 'emerald'
                        : h.status === 'no_show' ? 'danger'
                        : h.status === 'assigned' ? 'cyan'
                        : 'violet'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td>{h.match_score ? `${h.match_score.toFixed(0)}%` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {h.applied_at ? new Date(h.applied_at).toLocaleDateString() : '—'}
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
}
