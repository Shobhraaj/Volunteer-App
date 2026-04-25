import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'volunteer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', marginBottom: 12
          }}>⚡</div>
        </div>
        <h1>Join VolunteerAI</h1>
        <p className="auth-subtitle">Create your account and start making a difference</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="form-control"
              type="text"
              placeholder="Your full name"
              value={form.fullName}
              onChange={set('fullName')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="form-control"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-role">I am a…</label>
            <select id="reg-role" className="form-control" value={form.role} onChange={set('role')}>
              <option value="volunteer">Volunteer — I want to help</option>
              <option value="organizer">Organizer — I manage tasks for an NGO</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
