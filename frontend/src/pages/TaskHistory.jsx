import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const STATUS_CONFIG = {
  completed: { color: 'var(--accent-4)', bg: 'rgba(16,185,129,0.12)', label: 'Completed', icon: '✅' },
  assigned:  { color: 'var(--accent-1)', bg: 'rgba(6,182,212,0.12)',  label: 'Assigned',  icon: '📌' },
  applied:   { color: 'var(--accent-2)', bg: 'rgba(139,92,246,0.12)', label: 'Applied',   icon: '📝' },
  no_show:   { color: '#ef4444',         bg: 'rgba(239,68,68,0.12)',  label: 'No Show',   icon: '❌' },
  cancelled: { color: '#64748b',         bg: 'rgba(100,116,139,0.12)',label: 'Cancelled', icon: '🚫' },
};

function DetailDrawer({ item, onClose }) {
  if (!item) return null;
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.applied;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2>{item.task_title || `Task #${item.task_id}`}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {[
            ['Status',      `${cfg.icon} ${cfg.label}`],
            ['Applied',     item.applied_at ? new Date(item.applied_at).toLocaleDateString() : '—'],
            ['Completed',   item.completed_at ? new Date(item.completed_at).toLocaleDateString() : '—'],
            ['Match Score', item.match_score ? `${item.match_score.toFixed(0)}%` : '—'],
            ['Points',      item.points_earned ? `+${item.points_earned}` : '—'],
            ['Role',        item.role || 'Volunteer'],
          ].map(([k, v]) => (
            <div key={k} style={{ background:'var(--bg-glass)', padding:'12px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-glass)' }}>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{k}</div>
              <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{v}</div>
            </div>
          ))}
        </div>
        {item.feedback && (
          <div style={{ background:'var(--bg-glass)', padding:'12px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-glass)', marginBottom:16 }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>Organizer Feedback</div>
            <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{item.feedback}</div>
          </div>
        )}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
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
  const counts = { all: history.length, completed: history.filter(h=>h.status==='completed').length, assigned: history.filter(h=>h.status==='assigned').length, applied: history.filter(h=>h.status==='applied').length };

  if (loading) {
    return <div className="main-content">{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:72,borderRadius:12,marginBottom:10}}/>)}</div>;
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>📜 Task History</h1>
        <p>Your complete participation record across all volunteer activities</p>
      </div>

      <div className="stats-grid" style={{ marginBottom:24 }}>
        {[['Total','📋',counts.all,'cyan'],['Completed','✅',counts.completed,'emerald'],['Assigned','📌',counts.assigned,'violet'],['Applied','📝',counts.applied,'amber']].map(([l,ic,v,c])=>(
          <div key={l} className="stat-card"><div className={`stat-icon ${c}`}>{ic}</div><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      <div className="tabs" style={{marginBottom:24}}>
        {[['all','📋 All'],['completed','✅ Completed'],['assigned','📌 Assigned'],['applied','📝 Applied']].map(([f,label])=>(
          <button key={f} className={`tab-btn ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
            {label} <span style={{marginLeft:4,padding:'1px 6px',borderRadius:20,background:'rgba(255,255,255,0.1)',fontSize:'0.7rem'}}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📜</div><h3>No records found</h3><p>Apply to tasks to start building your history</p></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map((item, i) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.applied;
            return (
              <div key={item.id} onClick={()=>setSelected(item)} className="card" style={{cursor:'pointer',padding:'14px 20px',display:'flex',alignItems:'center',gap:14,animation:`slideUp 0.35s ease ${i*0.04}s both`}}>
                <div style={{width:42,height:42,borderRadius:'var(--radius-sm)',background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>{cfg.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,marginBottom:3}}>{item.task_title || `Task #${item.task_id}`}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--text-muted)',display:'flex',gap:12,flexWrap:'wrap'}}>

                    <span>🗓️ {item.applied_at ? new Date(item.applied_at).toLocaleDateString() : '—'}</span>
                    {item.match_score && <span>🎯 {item.match_score.toFixed(0)}% match</span>}
                    {item.points_earned && <span>🏆 +{item.points_earned} pts</span>}
                  </div>
                </div>
                <span style={{padding:'4px 11px',borderRadius:20,background:cfg.bg,color:cfg.color,fontSize:'0.77rem',fontWeight:600,flexShrink:0}}>{cfg.label}</span>
                <span style={{color:'var(--text-muted)'}}>›</span>
              </div>
            );
          })}
        </div>
      )}

      <DetailDrawer item={selected} onClose={()=>setSelected(null)} />
    </div>
  );
}
