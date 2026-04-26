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
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 animate-fade-in relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />

      <div className="glass-card w-full max-w-lg p-10 shadow-2xl animate-slide-up relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl inline-flex items-center justify-center text-3xl shadow-lg shadow-primary-500/20 mb-6">
            ⚡
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Join VolunteerAI</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Create your account and start making a difference</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group col-span-1 md:col-span-2">
            <label className="form-label">Full Name</label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              placeholder="Your full name"
              value={form.fullName}
              onChange={set('fullName')}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              placeholder="Min. 6 chars"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
            />
          </div>
          <div className="form-group col-span-1 md:col-span-2">
            <label className="form-label">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                className={`p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2 ${
                  form.role === 'volunteer' 
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 grayscale'
                }`}
                onClick={() => setForm({...form, role: 'volunteer'})}
              >
                <span className="text-xl">🙋‍♂️</span>
                Volunteer
              </button>
              <button 
                type="button"
                className={`p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2 ${
                  form.role === 'organizer' 
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 grayscale'
                }`}
                onClick={() => setForm({...form, role: 'organizer'})}
              >
                <span className="text-xl">🏢</span>
                Organizer
              </button>
            </div>
          </div>
          <button type="submit" className="col-span-1 md:col-span-2 btn btn-primary py-4 text-base" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Already have an account? <Link to="/login" className="text-primary-500 font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

