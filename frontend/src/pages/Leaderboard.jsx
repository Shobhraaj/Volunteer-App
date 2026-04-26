/**
 * Leaderboard page — ranks volunteers by points.
 * Data fetched from FastAPI /analytics/leaderboard with Firestore fallback.
 * Shows gold/silver/bronze podium for top 3, full ranked table below.
 */
import React, { useEffect, useState } from 'react';
import api from '../api';

const PODIUM_CONFIG = [
  { rank: 1, medal: '🥇', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', shadow: 'rgba(245,158,11,0.3)', size: 72, elevation: 32 },
  { rank: 2, medal: '🥈', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', shadow: 'rgba(148,163,184,0.2)', size: 60, elevation: 0  },
  { rank: 3, medal: '🥉', color: '#cd7c3a', bg: 'rgba(205,124,58,0.10)',  shadow: 'rgba(205,124,58,0.2)',  size: 54, elevation: 16 },
];

const BADGE_COLORS = {
  'Top Performer':   '#f59e0b',
  'Rising Star':     '#8b5cf6',
  'Reliable':        '#10b981',
  'Task Master':     '#06b6d4',
  'Community Hero':  '#ef4444',
};

// Demo data shown while loading or when API unavailable
const DEMO = [
  { rank:1, full_name:'Priya Sharma',   points:1480, tasks_completed:24, badges:['Top Performer','Task Master']    },
  { rank:2, full_name:'Arjun Mehta',    points:1210, tasks_completed:19, badges:['Rising Star','Reliable']         },
  { rank:3, full_name:'Sneha Patel',    points:980,  tasks_completed:16, badges:['Community Hero']                 },
  { rank:4, full_name:'Rahul Gupta',    points:860,  tasks_completed:14, badges:['Reliable']                       },
  { rank:5, full_name:'Ananya Reddy',   points:740,  tasks_completed:12, badges:['Rising Star']                    },
  { rank:6, full_name:'Vikram Singh',   points:620,  tasks_completed:10, badges:[]                                 },
  { rank:7, full_name:'Deepa Nair',     points:550,  tasks_completed:9,  badges:[]                                 },
  { rank:8, full_name:'Karan Joshi',    points:490,  tasks_completed:8,  badges:[]                                 },
  { rank:9, full_name:'Meera Iyer',     points:420,  tasks_completed:7,  badges:[]                                 },
  { rank:10,full_name:'Aditya Kumar',   points:380,  tasks_completed:6,  badges:[]                                 },
];

function Initials({ name, size = 44, fontSize = '1rem' }) {
  const letters = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {letters}
    </div>
  );
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');   // 'all' | 'weekly'

  useEffect(() => {
    api.getLeaderboard()
      .then((data) => setLeaders(data.length ? data : DEMO))
      .catch(() => setLeaders(DEMO))
      .finally(() => setLoading(false));
  }, []);

  const top3  = leaders.slice(0, 3);
  const rest  = leaders.slice(3);

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  if (loading) {
    return (
      <div className="main-content">
        <div className="stats-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 10 }} />)}
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      {/* Page header */}
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '2.4rem' }}>🏆 Volunteer Leaderboard</h1>
        <p>Rankings based on points, tasks completed, and performance</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div className="tabs">
          <button className={`tab-btn ${tab === 'all'    ? 'active' : ''}`} onClick={() => setTab('all')}>All Time</button>
          <button className={`tab-btn ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}>This Week</button>
        </div>
      </div>

      {/* Podium — top 3 */}
      {top3.length >= 1 && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: 20, marginBottom: 48, flexWrap: 'wrap',
        }}>
          {podiumOrder.map((person) => {
            if (!person) return null;
            const cfg = PODIUM_CONFIG.find(c => c.rank === person.rank);
            return (
              <div
                key={person.rank}
                className="slide-up"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  background: cfg.bg,
                  border: `2px solid ${cfg.color}40`,
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px 32px',
                  minWidth: 180,
                  boxShadow: `0 8px 40px ${cfg.shadow}`,
                  transform: `translateY(-${cfg.elevation}px)`,
                  transition: 'transform 0.3s ease',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '2.2rem' }}>{cfg.medal}</div>
                <Initials name={person.full_name} size={cfg.size} fontSize={cfg.rank === 1 ? '1.4rem' : '1.1rem'} />
                <div style={{ fontWeight: 700, fontSize: cfg.rank === 1 ? '1.05rem' : '0.95rem', textAlign: 'center' }}>
                  {person.full_name}
                </div>
                <div style={{
                  fontSize: '1.8rem', fontWeight: 800,
                  color: cfg.color, letterSpacing: '-0.02em',
                }}>
                  {person.points?.toLocaleString() || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {person.tasks_completed || 0} tasks
                </div>
                {person.badges?.slice(0,2).map(b => (
                  <span key={b} style={{
                    padding: '3px 8px', borderRadius: 20,
                    background: `${BADGE_COLORS[b] || '#8b5cf6'}20`,
                    color: BADGE_COLORS[b] || '#8b5cf6',
                    fontSize: '0.7rem', fontWeight: 600,
                  }}>{b}</span>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Ranked table */}
      <div className="card">
        <div className="card-header">
          <h3>📊 Full Rankings</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {leaders.length} volunteers
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Volunteer</th>
              <th>Points</th>
              <th>Tasks</th>
              <th>Badges</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((v, i) => (
              <tr key={i} style={{ animation: `slideUp 0.4s ease ${i * 0.04}s both` }}>
                <td>
                  <span style={{
                    fontWeight: 700, fontSize: '1rem',
                    color: v.rank === 1 ? '#f59e0b' : v.rank === 2 ? '#94a3b8' : v.rank === 3 ? '#cd7c3a' : 'var(--text-secondary)',
                  }}>
                    {v.rank === 1 ? '🥇' : v.rank === 2 ? '🥈' : v.rank === 3 ? '🥉' : `#${v.rank}`}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Initials name={v.full_name} size={34} fontSize="0.8rem" />
                    <span style={{ fontWeight: 600 }}>{v.full_name}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--accent-1)' }}>
                    {v.points?.toLocaleString() || 0}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{v.tasks_completed || 0}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(v.badges || []).map(b => (
                      <span key={b} style={{
                        padding: '2px 7px', borderRadius: 20,
                        background: `${BADGE_COLORS[b] || '#8b5cf6'}18`,
                        color: BADGE_COLORS[b] || '#8b5cf6',
                        fontSize: '0.68rem', fontWeight: 600,
                      }}>{b}</span>
                    ))}
                    {(!v.badges || v.badges.length === 0) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
