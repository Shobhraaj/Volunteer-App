import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight, Github, Chrome, CheckCircle2, Building2, Users } from 'lucide-react';

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
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans selection:bg-emerald-500/30">
      {/* Left Side: Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-400/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-20 text-white min-h-full">
          <div className="flex items-center gap-4 mt-4 lg:mt-8 ml-2 lg:ml-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl transition-transform hover:scale-110 duration-300">
              <span className="text-3xl">🌿</span>
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase">EcoPulse</span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center py-20">
            <h2 className="text-5xl xl:text-6xl font-black leading-[1.1] mb-8">
              Start Your <br />
              <span className="text-indigo-200">Journey Today.</span>
            </h2>
            <p className="text-xl text-indigo-50/80 font-medium leading-relaxed mb-12 max-w-md mx-auto">
              Become a part of a global movement. Whether you want to volunteer or organize, we have the tools for you.
            </p>
            
            {/* Visual Element: Illustration */}
            <div className="relative group max-w-xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-4 shadow-2xl overflow-hidden">
                <img 
                  src="/register-hero.png" 
                  alt="Growth and community" 
                  className="rounded-2xl shadow-inner object-cover w-full aspect-video opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-indigo-100/60">
            <span>© 2026 EcoPulse Platform</span>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-y-auto custom-scrollbar">
        {/* Background blobs for right side on mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[480px] py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <span className="text-2xl">🌿</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">EcoPulse</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Join our community and start making an impact.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role Selection */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">I want to join as a...</label>
              <div className="grid grid-cols-2 gap-6">
                <button 
                  type="button"
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                    form.role === 'volunteer' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                  onClick={() => setForm({...form, role: 'volunteer'})}
                >
                  <div className={`p-2 rounded-xl transition-colors ${form.role === 'volunteer' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'}`}>
                    <Users size={20} />
                  </div>
                  <span className={`text-sm font-black ${form.role === 'volunteer' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600'}`}>Volunteer</span>
                  {form.role === 'volunteer' && <CheckCircle2 size={16} className="absolute top-2 right-2 text-emerald-500" />}
                </button>
                <button 
                  type="button"
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                    form.role === 'organizer' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                  onClick={() => setForm({...form, role: 'organizer'})}
                >
                  <div className={`p-2 rounded-xl transition-colors ${form.role === 'organizer' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'}`}>
                    <Building2 size={20} />
                  </div>
                  <span className={`text-sm font-black ${form.role === 'organizer' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'}`}>Organizer</span>
                  {form.role === 'organizer' && <CheckCircle2 size={16} className="absolute top-2 right-2 text-indigo-500" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                <User size={14} className="text-indigo-500" />
                Full Name
              </label>
              <input
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={set('fullName')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                <Mail size={14} className="text-indigo-500" />
                Email Address
              </label>
              <input
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                <Lock size={14} className="text-indigo-500" />
                Password
              </label>
              <input
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-black hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


