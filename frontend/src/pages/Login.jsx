import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-primary-50/50 animate-fade-in relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-400/20 rounded-full blur-[120px] animate-pulse" />

      <div className="glass-card w-full max-w-md px-12 py-16 shadow-2xl animate-slide-up relative z-10">
        <div className="text-center mb-14">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl inline-flex items-center justify-center text-4xl shadow-lg shadow-primary-500/20 mb-10">
            🌿
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Sign in to your VolunteerAI account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="form-group !mb-0">
            <label className="form-label !mb-3">Email Address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group !mb-0">
            <div className="flex items-center justify-between mb-3">
              <label className="form-label !mb-0">Password</label>
              <a href="#" className="text-xs font-bold text-primary-500 hover:underline">Forgot password?</a>
            </div>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-4 text-base" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Don't have an account? <Link to="/register" className="text-primary-500 font-bold hover:underline">Create one</Link>
        </p>

        <div className="mt-12 p-8 bg-primary-500/5 dark:bg-white/5 rounded-3xl border border-primary-500/10 shadow-inner">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Demo Access</div>
          <div className="space-y-3 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex justify-between items-center"><span className="font-bold text-primary-500 shrink-0 mr-2 uppercase tracking-tighter">Org</span> <span className="truncate opacity-80">admin1@volunteer.org / MyNewPass123!</span></div>
            <div className="flex justify-between items-center"><span className="font-bold text-primary-500 shrink-0 mr-2 uppercase tracking-tighter">Vol</span> <span className="truncate opacity-80">member1@volunteer.org / MyNewPass123!</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}


