import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import ScrollReveal from '../components/ScrollReveal';
import StatusIndicator from '../components/StatusIndicator';
import { Search } from 'lucide-react';

export default function AllVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ query: '', skill: 'all', status: 'all' });
  const navigate = useNavigate();

  useEffect(() => {
    loadVolunteers();

    // Real-time listener for user status/presence
    let unsub = () => {};
    if (db) {
      unsub = onSnapshot(collection(db, 'users'), () => {
        loadVolunteers();
      });
    }

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

  if (loading) {
    return (
      <div className="main-content py-8 px-4 md:px-8">
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="main-content py-8 px-4 md:px-8 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:justify-between md:items-end">
        <div>
          <h1>Volunteer Directory</h1>
          <p>Browse and manage all registered volunteers across the platform.</p>
        </div>
        <div className="text-sm font-bold text-slate-400 mb-2">
          Total: <span className="text-slate-900 dark:text-white">{volunteers.length}</span>
          {' · '}
          Filtered: <span className="text-slate-900 dark:text-white">{filtered.length}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card mb-8 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="form-group !mb-0">
            <label className="form-label">Search Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                className="form-input !pl-10"
                value={filter.query}
                onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              />
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="form-group !mb-0">
            <label className="form-label">Primary Skill</label>
            <select
              className="form-input"
              value={filter.skill}
              onChange={(e) => setFilter({ ...filter, skill: e.target.value.toLowerCase() })}
            >
              {skills.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
            </select>
          </div>
          <div className="form-group !mb-0">
            <label className="form-label">Performance</label>
            <select
              className="form-input"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="all">All Performance</option>
              <option value="high">Top Rated (90%+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Volunteer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((v, i) => (
          <ScrollReveal key={v.id} delay={0.05 * (i % 10)}>
            <div className="card apple-hover flex flex-col h-full">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div
                    className="user-avatar w-16 h-16 rounded-2xl text-2xl cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate('/profile')}
                  >
                    {v.full_name[0]}
                  </div>
                  <div>
                    <div
                      className="font-bold text-slate-900 dark:text-white mb-1 cursor-pointer hover:text-primary-500 transition-colors"
                      onClick={() => navigate('/profile')}
                    >
                      {v.full_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIndicator userId={v.id} />
                      <span className="text-xs font-medium text-slate-400">
                        {v.tasks_completed} tasks done
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-primary-500">{v.points}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {(v.badges || []).map(b => (
                  <span key={b} className="skill-tag !mr-0 !mb-0">{b}</span>
                ))}
                {(!v.badges || v.badges.length === 0) && (
                  <span className="text-xs font-medium text-slate-400">No badges yet</span>
                )}
              </div>

              <div className="mt-auto pt-5 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Reliability Score</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{v.reliability}%</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${v.reliability}%`,
                      background: v.reliability > 85 ? 'var(--gradient-primary)' : '#f59e0b',
                    }}
                  />
                </div>
                <button
                  className="btn btn-secondary btn-sm w-full mt-4"
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
        <div className="empty-state mt-8">
          <div className="empty-icon">🔍</div>
          <h3>No matches found</h3>
          <p>Try adjusting your search or filters to find more volunteers.</p>
        </div>
      )}
    </div>
  );
}
