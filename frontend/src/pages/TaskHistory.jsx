import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const STATUS_CONFIG = {
  completed: { color: 'emerald', label: 'Completed', icon: '✅' },
  assigned:  { color: 'cyan',    label: 'Assigned',  icon: '📌' },
  applied:   { color: 'violet',  label: 'Applied',   icon: '📝' },
  no_show:   { color: 'danger',  label: 'No Show',   icon: '❌' },
  cancelled: { color: 'amber',   label: 'Cancelled', icon: '🚫' },
};

function DetailDrawer({ item, onClose }) {
  if (!item) return null;
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.applied;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-lg animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold !mb-0">{item.task_title || `Task #${item.task_id}`}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            ['Status', `${cfg.icon} ${cfg.label}`],
            ['Applied', item.applied_at ? new Date(item.applied_at).toLocaleDateString() : '—'],
            ['Completed', item.completed_at ? new Date(item.completed_at).toLocaleDateString() : '—'],
            ['Match Score', item.match_score ? `${item.match_score.toFixed(0)}%` : '—'],
            ['Points', item.points_earned ? `+${item.points_earned}` : '—'],
            ['Role', item.role || 'Volunteer'],
          ].map(([k, v]) => (
            <div
              key={k}
              className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{k}</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">{v}</div>
            </div>
          ))}
        </div>

        {item.feedback && (
          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 mb-6">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Organizer Feedback</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.feedback}</div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link to={`/tasks/${item.task_id}`} className="btn btn-primary btn-sm">View Task →</Link>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function TaskHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getHistory().then(setHistory).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? history : history.filter(h => h.status === filter);
  const counts = {
    all: history.length,
    completed: history.filter(h => h.status === 'completed').length,
    assigned: history.filter(h => h.status === 'assigned').length,
    applied: history.filter(h => h.status === 'applied').length,
  };

  if (loading) {
    return (
      <div className="main-content py-8 px-4 md:px-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton mb-3" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="main-content py-8 px-4 md:px-8 animate-fade-in">
      <div className="page-header">
        <h1>📜 Task History</h1>
        <p>Your complete participation record across all volunteer activities</p>
      </div>

      <div className="stats-grid">
        {[
          ['Total', '📋', counts.all, 'cyan'],
          ['Completed', '✅', counts.completed, 'emerald'],
          ['Assigned', '📌', counts.assigned, 'violet'],
          ['Applied', '📝', counts.applied, 'amber'],
        ].map(([l, ic, v, c]) => (
          <div key={l} className="stat-card">
            <div className={`stat-icon ${c}`}>{ic}</div>
            <div className="stat-value">{v}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      <div className="tabs mb-8">
        {[
          ['all', '📋 All'],
          ['completed', '✅ Completed'],
          ['assigned', '📌 Assigned'],
          ['applied', '📝 Applied'],
        ].map(([f, label]) => (
          <button
            key={f}
            className={`tab-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {label}{' '}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] font-bold">
              {counts[f] ?? history.length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h3>No records found</h3>
          <p>Apply to tasks to start building your history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.applied;
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className="card cursor-pointer !p-4 flex items-center gap-4 hover:shadow-lg transition-all apple-hover animate-slide-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xl shrink-0">
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white mb-1 truncate">
                    {item.task_title || `Task #${item.task_id}`}
                  </div>
                  <div className="flex gap-4 flex-wrap text-[11px] font-medium text-slate-400">
                    <span>🗓️ {item.applied_at ? new Date(item.applied_at).toLocaleDateString() : '—'}</span>
                    {item.match_score && <span>🎯 {item.match_score.toFixed(0)}% match</span>}
                    {item.points_earned && <span>🏆 +{item.points_earned} pts</span>}
                  </div>
                </div>
                <span className={`badge badge-${cfg.color} shrink-0`}>{cfg.label}</span>
                <span className="text-slate-300 dark:text-slate-700">›</span>
              </div>
            );
          })}
        </div>
      )}

      <DetailDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
