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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="w-full max-w-[480px] relative z-10">
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-[2.5rem] p-10 md:p-14 transition-all duration-500">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-3xl shadow-xl shadow-emerald-500/20 mb-8 transform hover:scale-110 transition-all duration-500 cursor-default">
              <span className="text-4xl">🌿</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Please enter your details to sign in</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors">Forgot password?</a>
              </div>
              <div className="relative group">
                <input
                  type="password"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:underline">Create one for free</Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Section - Redesigned as a subtle bottom utility */}
        <div className="mt-8 px-6">
          <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 opacity-70">Demo Preview Access</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                <span className="text-emerald-500 uppercase text-[9px]">Org</span>
                <span className="opacity-70">admin1@volunteer.org</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                <span className="text-emerald-500 uppercase text-[9px]">Vol</span>
                <span className="opacity-70">member1@volunteer.org</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
