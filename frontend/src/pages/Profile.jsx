import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ActivityStatus from '../components/ActivityStatus';
import { Trophy, Award, GraduationCap, FileText, CheckCircle2, Edit3, UserCircle, History as HistoryIcon, MapPin } from 'lucide-react';

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
    <div className="main-content py-8 px-4 md:px-8 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Your Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your skills, interests, availability, and view achievements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-primary-500/20 mb-4">
              {user?.full_name?.[0]?.toUpperCase()||'?'}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{user?.full_name}</h2>
            <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">{user?.role}</div>

            {user?.role === 'volunteer' && (
              <div className="mb-6 w-full flex justify-center">
                <ActivityStatus userId={user?.id} />
              </div>
            )}

            <div className="w-full space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-sm font-bold text-slate-500">Points</span>
                <span className="font-extrabold text-primary-500 flex items-center gap-1"><Trophy className="w-4 h-4" /> {user?.points||0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-sm font-bold text-slate-500">Reliability</span>
                <span className="font-bold text-slate-900 dark:text-white">{((user?.reliability_score||0)*100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-sm font-bold text-slate-500">Tasks Done</span>
                <span className="font-bold text-slate-900 dark:text-white">{completedCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-sm font-bold text-slate-500">Badges</span>
                <span className="font-bold text-slate-900 dark:text-white">{badges.length}</span>
              </div>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-violet-500" /> Badges</h3>
              <div className="flex flex-col gap-2">
                {badges.map((b,i) => (
                  <div key={i} className="px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm font-bold text-violet-600 dark:text-violet-400">
                    {b.badge_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <div className="flex flex-col gap-3">
              <Link to="/certificates" className="btn btn-secondary justify-start w-full"><GraduationCap className="w-4 h-4" /> My Certificates</Link>
              <Link to="/history"      className="btn btn-secondary justify-start w-full"><FileText className="w-4 h-4" /> Task History</Link>
              <Link to="/leaderboard"  className="btn btn-secondary justify-start w-full"><Trophy className="w-4 h-4" /> Leaderboard</Link>
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit mb-8">
            <button className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab==='edit'?'bg-white dark:bg-white/10 text-primary-500 shadow-sm':'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setTab('edit')}><Edit3 className="w-4 h-4" /> Edit Profile</button>
            <button className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab==='history'?'bg-white dark:bg-white/10 text-primary-500 shadow-sm':'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setTab('history')}><HistoryIcon className="w-4 h-4" /> Recent Activity</button>
          </div>

          {tab === 'edit' && (
            <div className="card animate-slide-up">
              <h3 className="text-xl font-bold mb-6">Edit Profile Details</h3>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Full Name</label>
                  <input id="profile-name" className="form-input" value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map(s => {
                      const active = form.skills.includes(s);
                      return (
                        <button key={s} type="button" onClick={() => toggleItem('skills', s)} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${active ? 'bg-violet-500/20 border-violet-500/50 text-violet-700 dark:text-violet-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                          {active && '✓ '}{s.replace('_',' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(i => {
                      const active = form.interests.includes(i);
                      return (
                        <button key={i} type="button" onClick={() => toggleItem('interests', i)} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${active ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                          {active && '✓ '}{i.replace('_',' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-location">Location</label>
                  <input id="profile-location" className="form-input" value={form.location_name}
                    onChange={e => setForm({ ...form, location_name: e.target.value })} placeholder="e.g. Mumbai" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="form-group !mb-0">
                    <label className="form-label" htmlFor="profile-lat">Latitude</label>
                    <input id="profile-lat" className="form-input" type="number" step="any" value={form.latitude}
                      onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="19.076" />
                  </div>
                  <div className="form-group !mb-0">
                    <label className="form-label" htmlFor="profile-lng">Longitude</label>
                    <input id="profile-lng" className="form-input" type="number" step="any" value={form.longitude}
                      onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="72.877" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100 dark:border-white/10">
                  <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  {saved && <div className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-lg animate-fade-in flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Profile updated successfully!</div>}
                </div>
              </form>
            </div>
          )}

          {tab === 'history' && (
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Recent Activity</h3>
                <Link to="/history" className="text-sm font-bold text-primary-500 hover:underline">View All →</Link>
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                  <FileText className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
                  <h3 className="text-lg font-bold text-slate-400">No history yet</h3>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead><tr><th>Task</th><th>Status</th><th>Match</th><th>Date</th></tr></thead>
                    <tbody>
                      {history.slice(0,8).map(h => (
                        <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="font-bold text-slate-900 dark:text-white">
                            <Link to={`/tasks/${h.task_id}`} className="hover:text-primary-500 transition-colors">Task #{h.task_id}</Link>
                          </td>
                          <td><span className={`badge badge-${h.status==='completed'?'emerald':h.status==='no_show'?'danger':h.status==='assigned'?'cyan':'violet'}`}>{h.status}</span></td>
                          <td className="font-medium">{h.match_score ? `${h.match_score.toFixed(0)}%` : '—'}</td>
                          <td className="text-sm text-slate-400">{h.applied_at ? new Date(h.applied_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
