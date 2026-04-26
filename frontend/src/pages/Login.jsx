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
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 animate-fade-in relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />

      <div className="glass-card w-full max-w-md p-10 shadow-2xl animate-slide-up relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl inline-flex items-center justify-center text-3xl shadow-lg shadow-primary-500/20 mb-6">
            🌿
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Sign in to your VolunteerAI account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="form-label">Email Address</label>
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
          <div className="form-group">
            <div className="flex items-center justify-between mb-2">
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

        <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Don't have an account? <Link to="/register" className="text-primary-500 font-bold hover:underline">Create one</Link>
        </p>

        <div className="mt-8 p-4 bg-primary-500/5 dark:bg-white/5 rounded-xl border border-primary-500/10">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Demo Access</div>
          <div className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div><span className="font-bold text-primary-500">Org:</span> admin1@volunteer.org / MyNewPass123!</div>
            <div><span className="font-bold text-primary-500">Vol:</span> member1@volunteer.org / MyNewPass123!</div>
          </div>
        </div>
      </div>
    </div>
  );
}


