import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import MatchScoreBadge from '../components/MatchScoreBadge';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');

  useEffect(() => { loadTask(); }, [id]);

  const loadTask = async () => {
    try {
      const t = await api.getTask(id);
      setTask(t);

      if (user.role === 'organizer') {
        const [m, p] = await Promise.all([
          api.getMatches(id, 15),
          api.getParticipants(id),
        ]);
        setMatches(m);
        setParticipants(p);
      } else {
        const p = await api.getParticipants(id);
        setParticipants(p);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAssign = async (volId) => {
    try {
      await api.assignVolunteers(id, [volId]);
      loadTask();
    } catch (err) { alert(err.message); }
  };

  const handleAutoAssign = async () => {
    try {
      const result = await api.autoAssign(id);
      alert(`✅ Auto-assigned ${result.assigned_count} volunteers!`);
      loadTask();
    } catch (err) { alert(err.message); }
  };

  const handleApply = async () => {
    try {
      await api.applyToTask(parseInt(id));
      loadTask();
    } catch (err) { alert(err.message); }
  };

  if (loading) {
    return <div className="main-content"><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div>;
  }

  if (!task) {
    return <div className="main-content"><div className="empty-state"><h3>Task not found</h3></div></div>;
  }

  const myParticipation = participants.find((p) => p.volunteer_id === user.id);

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <Link to="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Back to Dashboard</Link>
        <h1>{task.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className={`urgency-tag urgency-${task.urgency}`}>{task.urgency}</span>
          <span className={`badge ${task.status === 'completed' ? 'badge-emerald' : task.status === 'open' ? 'badge-cyan' : 'badge-amber'}`}>
            {task.status}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {task.location_name || 'Remote'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</button>
        {user.role === 'organizer' && (
          <button className={`tab-btn ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')}>
            🧠 AI Matches ({matches.length})
          </button>
        )}
        <button className={`tab-btn ${tab === 'participants' ? 'active' : ''}`} onClick={() => setTab('participants')}>
          Participants ({participants.length})
        </button>
      </div>

      {/* Details */}
      {tab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {task.description || 'No description provided.'}
            </p>

            <h3 style={{ marginTop: 24, marginBottom: 12 }}>Required Skills</h3>
            <div className="task-skills">
              {(task.required_skills || []).map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
              {(!task.required_skills || task.required_skills.length === 0) && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No specific skills required</span>
              )}
            </div>

            {task.start_time && (
              <>
                <h3 style={{ marginTop: 24, marginBottom: 8 }}>Schedule</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  🗓️ {new Date(task.start_time).toLocaleString()} — {task.end_time ? new Date(task.end_time).toLocaleString() : 'Open-ended'}
                </p>
              </>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Stats</h3>
            <div className="profile-stat"><span>Status</span><span style={{ textTransform: 'capitalize' }}>{task.status}</span></div>
            <div className="profile-stat"><span>Urgency</span><span style={{ textTransform: 'capitalize' }}>{task.urgency}</span></div>
            <div className="profile-stat"><span>Volunteers</span><span>{task.current_volunteers}/{task.max_volunteers}</span></div>
            <div className="profile-stat"><span>Location</span><span>{task.location_name || 'Remote'}</span></div>

            <div style={{ marginTop: 20 }}>
              <div className="progress-bar" style={{ marginBottom: 8 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, (task.current_volunteers / task.max_volunteers) * 100)}%` }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {Math.round((task.current_volunteers / task.max_volunteers) * 100)}% filled
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4">
              {user.role === 'volunteer' && task.status === 'open' && !myParticipation && (
                <button className="btn btn-primary w-full" onClick={handleApply}>Apply to this Task</button>
              )}
              {myParticipation && (
                <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-4)' }}>
                  ✅ You are {myParticipation.status}
                </div>
              )}
              {user.role === 'organizer' && task.status === 'open' && (
                <button className="btn btn-success w-full" onClick={handleAutoAssign}>
                  ⚡ Auto-Assign Volunteers
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Matches (organizer only) */}
      {tab === 'matches' && user.role === 'organizer' && (
        <div className="card">
          <div className="card-header">
            <h3>🧠 AI-Ranked Volunteers</h3>
            <button className="btn btn-success btn-sm" onClick={handleAutoAssign}>⚡ Auto-Assign Top</button>
          </div>
          {matches.length === 0 ? (
            <div className="empty-state"><h3>No volunteers available</h3></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Match Score</th>
                  <th>Skills</th>
                  <th>Location</th>
                  <th>Availability</th>
                  <th>Reliability</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.volunteer.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.volunteer.email}</div>
                    </td>
                    <td><MatchScoreBadge score={m.match_score} /></td>
                    <td><span className="badge badge-violet">{(m.skill_score * 100).toFixed(0)}%</span></td>
                    <td><span className="badge badge-cyan">{(m.location_score * 100).toFixed(0)}%</span></td>
                    <td><span className="badge badge-amber">{(m.availability_score * 100).toFixed(0)}%</span></td>
                    <td><span className="badge badge-emerald">{(m.reliability_score * 100).toFixed(0)}%</span></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAssign(m.volunteer.id)}>
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Participants */}
      {tab === 'participants' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Task Participants</h3>
          {participants.length === 0 ? (
            <div className="empty-state"><h3>No participants yet</h3></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Volunteer ID</th>
                  <th>Status</th>
                  <th>Match Score</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td>Volunteer #{p.volunteer_id}</td>
                    <td>
                      <span className={`badge badge-${
                        p.status === 'completed' ? 'emerald'
                        : p.status === 'assigned' ? 'cyan'
                        : p.status === 'no_show' ? 'danger'
                        : 'violet'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.match_score ? <MatchScoreBadge score={p.match_score} /> : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {p.applied_at ? new Date(p.applied_at).toLocaleDateString() : '—'}
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
