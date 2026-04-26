import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ActivityStatus from '../components/ActivityStatus';

const SKILL_OPTIONS = [
  'teaching','cooking','first_aid','driving','counseling',
  'fundraising','photography','web_development','carpentry',
  'gardening','translation','event_planning','mentoring',
  'data_entry','public_speaking',
];
const INTEREST_OPTIONS = [
  'education','environment','healthcare','animals','elderly_care',
  'youth','disaster_relief','arts','sports','technology',
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    full_name:'', skills:[], interests:[], location_name:'', latitude:'', longitude:'',
  });
  const [badges, setBadges]   = useState([]);
  const [history, setHistory] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [tab, setTab]         = useState('edit');

  useEffect(() => {
    if (user) {
      setForm({
        full_name:     user.full_name || '',
        skills:        user.skills || [],
        interests:     user.interests || [],
        location_name: user.location_name || '',
        latitude:      user.latitude ?? '',
        longitude:     user.longitude ?? '',
      });
    }
    loadExtras();
  }, [user]);

  const loadExtras = async () => {
    try {
      const [b, h] = await Promise.all([api.getBadges(), api.getHistory()]);
      setBadges(b); setHistory(h);
    } catch (err) { console.error(err); }
  };

  const toggleItem = (field, item) => {
    const current = form[field];
    const next = current.includes(item) ? current.filter(x => x !== item) : [...current, item];
    setForm({ ...form, [field]: next });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
    try {
      await api.updateProfile({
        full_name: form.full_name,
        skills: form.skills,
        interests: form.interests,
        location_name: form.location_name,
        latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const completedCount = history.filter(h => h.status === 'completed').length;

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>Your Profile</h1>
        <p>Manage your skills, interests, availability, and certificates</p>
      </div>

      <div className="profile-grid">
        {/* Sidebar */}
        <div>
          <div className="card" style={{ textAlign:'center' }}>
            <div className="profile-avatar">{user?.full_name?.[0]?.toUpperCase()||'?'}</div>
            <div className="profile-name">{user?.full_name}</div>
            <div className="profile-role">{user?.role}</div>

            {/* Activity status */}
            {user?.role === 'volunteer' && (
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                <ActivityStatus userId={user?.id} />
              </div>
            )}

            <div className="profile-stat"><span>Points</span>      <span>🏆 {user?.points||0}</span></div>
            <div className="profile-stat"><span>Reliability</span>  <span>{((user?.reliability_score||0)*100).toFixed(0)}%</span></div>
            <div className="profile-stat"><span>Tasks Done</span>   <span>{completedCount}</span></div>
            <div className="profile-stat"><span>Badges</span>       <span>{badges.length}</span></div>
          </div>

          {badges.length > 0 && (
            <div className="card mt-4">
              <h3 style={{ marginBottom:12, fontSize:'0.95rem' }}>🎖️ Badges</h3>
              <div className="flex flex-col gap-2">
                {badges.map((b,i) => (
                  <div key={i} style={{ padding:'8px 12px', background:'rgba(139,92,246,0.08)', borderRadius:8, fontSize:'0.85rem', fontWeight:500 }}>
                    {b.badge_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card mt-4">
            <h3 style={{ marginBottom:12, fontSize:'0.95rem' }}>Quick Links</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <Link to="/certificates" className="btn btn-secondary" style={{ justifyContent:'flex-start' }}>🎓 My Certificates</Link>
              <Link to="/history"      className="btn btn-secondary" style={{ justifyContent:'flex-start' }}>📜 Task History</Link>
              <Link to="/leaderboard"  className="btn btn-secondary" style={{ justifyContent:'flex-start' }}>🏆 Leaderboard</Link>
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div>
          <div className="tabs" style={{ marginBottom:20 }}>
            <button className={`tab-btn ${tab==='edit'?'active':''}`}    onClick={() => setTab('edit')}>✏️ Edit Profile</button>
            <button className={`tab-btn ${tab==='history'?'active':''}`} onClick={() => setTab('history')}>📜 Recent Activity</button>
          </div>

          {tab === 'edit' && (
            <div className="card">
              <h3 style={{ marginBottom:20 }}>Edit Profile</h3>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label htmlFor="profile-name">Full Name</label>
                  <input id="profile-name" className="form-control" value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Skills (click to toggle)</label>
                  <div className="flex gap-2" style={{ flexWrap:'wrap' }}>
                    {SKILL_OPTIONS.map(s => (
                      <button key={s} type="button" onClick={() => toggleItem('skills', s)} className="skill-tag"
                        style={{ cursor:'pointer', background: form.skills.includes(s)?'rgba(139,92,246,0.25)':'rgba(139,92,246,0.06)', border: form.skills.includes(s)?'1px solid rgba(139,92,246,0.5)':'1px solid rgba(139,92,246,0.15)', fontSize:'0.78rem', padding:'5px 12px' }}>
                        {form.skills.includes(s) ? '✓ ' : ''}{s.replace('_',' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Interests (click to toggle)</label>
                  <div className="flex gap-2" style={{ flexWrap:'wrap' }}>
                    {INTEREST_OPTIONS.map(i => (
                      <button key={i} type="button" onClick={() => toggleItem('interests', i)} className="skill-tag"
                        style={{ cursor:'pointer', background: form.interests.includes(i)?'rgba(6,182,212,0.25)':'rgba(6,182,212,0.06)', border: form.interests.includes(i)?'1px solid rgba(6,182,212,0.5)':'1px solid rgba(6,182,212,0.15)', color:'var(--accent-1)', fontSize:'0.78rem', padding:'5px 12px' }}>
                        {form.interests.includes(i) ? '✓ ' : ''}{i.replace('_',' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profile-location">Location</label>
                  <input id="profile-location" className="form-control" value={form.location_name}
                    onChange={e => setForm({ ...form, location_name: e.target.value })} placeholder="e.g. Mumbai" />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="form-group">
                    <label htmlFor="profile-lat">Latitude</label>
                    <input id="profile-lat" className="form-control" type="number" step="any" value={form.latitude}
                      onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="19.076" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-lng">Longitude</label>
                    <input id="profile-lng" className="form-control" type="number" step="any" value={form.longitude}
                      onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="72.877" />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  {saved && <span style={{ color:'var(--accent-4)', fontSize:'0.85rem', fontWeight:500 }}>✅ Profile updated!</span>}
                </div>
              </form>
            </div>
          )}

          {tab === 'history' && (
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <h3>Recent Activity</h3>
                <Link to="/history" className="btn btn-secondary btn-sm">View All →</Link>
              </div>
              {history.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📜</div><h3>No history yet</h3></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Task</th><th>Status</th><th>Match</th><th>Date</th></tr></thead>
                  <tbody>
                    {history.slice(0,8).map(h => (
                      <tr key={h.id}>
                        <td><Link to={`/tasks/${h.task_id}`}>Task #{h.task_id}</Link></td>
                        <td><span className={`badge badge-${h.status==='completed'?'emerald':h.status==='no_show'?'danger':h.status==='assigned'?'cyan':'violet'}`}>{h.status}</span></td>
                        <td>{h.match_score ? `${h.match_score.toFixed(0)}%` : '—'}</td>
                        <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{h.applied_at ? new Date(h.applied_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
