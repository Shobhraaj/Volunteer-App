import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import ScrollReveal from '../components/ScrollReveal';
import StatusIndicator from '../components/StatusIndicator';

export default function AllVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ query: '', skill: 'all', status: 'all' });
  const navigate = useNavigate();

  useEffect(() => {
    loadVolunteers();

    // Real-time listener for user status/presence
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      // In a real app, we'd update specific users, but for now we refresh
      loadVolunteers();
    });

    return () => unsub();
  }, []);

  const loadVolunteers = async () => {
    try {
      const data = await api.getLeaderboard(200);
      setVolunteers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = volunteers.filter(v => {
    const matchesQuery = v.full_name.toLowerCase().includes(filter.query.toLowerCase());
    const matchesSkill = filter.skill === 'all' || (v.badges && v.badges.some(b => b.toLowerCase().includes(filter.skill)));
    const matchesStatus = filter.status === 'all' || (filter.status === 'high' ? v.reliability > 90 : true);
    return matchesQuery && matchesSkill && matchesStatus;
  });

  const skills = ['All Skills', 'Teaching', 'Medical', 'Environment', 'Support', 'Legal', 'Tech'];

  if (loading) return <div className="main-content"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className="main-content fade-in">
      <ScrollReveal>
        <div className="page-header flex justify-between items-end">
          <div>
            <h1>Volunteer Directory</h1>
            <p>Browse and manage all registered volunteers across the platform.</p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Total: <strong>{volunteers.length}</strong> | Filtered: <strong>{filtered.length}</strong>
          </div>
        </div>
      </ScrollReveal>

      {/* Advanced Search & Filter Bar */}
      <ScrollReveal delay={0.1}>
        <div className="card glass-card mb-8">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Search Name</label>
              <input 
                type="text" 
                placeholder="Search by name..." 
                className="form-control"
                value={filter.query}
                onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Primary Skill</label>
              <select 
                className="form-control"
                value={filter.skill}
                onChange={(e) => setFilter({ ...filter, skill: e.target.value.toLowerCase() })}
              >
                {skills.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Performance</label>
              <select 
                className="form-control"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="all">All Performance</option>
                <option value="high">Top Rated (90%+)</option>
              </select>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {filtered.map((v, i) => (
          <ScrollReveal key={v.id} delay={0.05 * (i % 10)}>
            <div className="card glass-card clickable-card apple-hover" style={{ padding: '24px' }}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="user-avatar micro-interaction" 
                    onClick={() => navigate('/profile')}
                    style={{ 
                      width: 64, height: 64, borderRadius: '20px',
                      fontSize: '1.4rem', background: 'var(--gradient-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {v.full_name[0]}
                  </div>
                  <div>
                    <h3 
                      style={{ fontSize: '1.1rem', marginBottom: 4, cursor: 'pointer' }}
                      onClick={() => navigate('/profile')}
                      className="apple-hover"
                    >
                      {v.full_name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <StatusIndicator userId={v.id} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {v.tasks_completed} tasks done
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{v.points}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>POINTS</div>
                </div>
              </div>

              <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
                {(v.badges || []).map(b => (
                  <span key={b} className="skill-tag" style={{ fontSize: '0.7rem' }}>{b}</span>
                ))}
              </div>

              <div className="mt-4 pt-6" style={{ borderTop: '1px solid var(--border-glass)' }}>
                <div className="flex justify-between items-center mb-2" style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reliability Score</span>
                  <span style={{ fontWeight: 700 }}>{v.reliability}%</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${v.reliability}%`, 
                      background: v.reliability > 85 ? 'var(--accent-primary)' : '#f59e0b' 
                    }} 
                  />
                </div>
                <button 
                  className="btn btn-secondary btn-sm w-full mt-6 apple-hover micro-interaction"
                  onClick={() => navigate('/profile')}
                >
                  View Performance Profile
                </button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
          <h3>No matches found</h3>
          <p>Try adjusting your search or filters to find more volunteers.</p>
        </div>
      )}
    </div>
  );
}
