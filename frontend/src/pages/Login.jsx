import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Github,
  Chrome,
} from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans selection:bg-emerald-500/30">
      {/* Left Side: Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-600 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-20 text-white min-h-full">
          <div className="flex items-center gap-4 mt-4 lg:mt-8 ml-2 lg:ml-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl transition-transform hover:scale-110 duration-300">
              <span className="text-3xl">🌿</span>
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase">
              EcoPulse
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center py-20">
            <h2 className="text-5xl xl:text-6xl font-black leading-[1.1] mb-8">
              Connect. Help. <br />
              <span className="text-emerald-200">Make an Impact.</span>
            </h2>
            <p className="text-xl text-emerald-50/80 font-medium leading-relaxed mb-12 max-w-md mx-auto">
              Join thousands of volunteers making the world a better place. Your
              contribution starts with a single click.
            </p>

            {/* Visual Element: Floating Image/Illustration */}
            <div className="relative group max-w-xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-4 shadow-2xl overflow-hidden">
                <img
                  src="/login-hero.png"
                  alt="Volunteers collaborating"
                  className="rounded-2xl shadow-inner object-cover w-full aspect-video opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-emerald-100/60">
            <span>© 2026 Swayam Sevak Platform</span>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 relative">
        {/* Background blobs for right side on mobile/small screens */}
        <div className="lg:hidden absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[440px]">
          {/* Header */}
          <div className="mb-12">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <span className="text-2xl">🌿</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                EcoPulse
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
              Please enter your credentials to access your account.
            </p>
          </div>

          {/* Social Login Buttons (Mockups for UI completeness) */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            <button className="flex items-center justify-center gap-2 py-4 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              <Chrome size={18} className="text-red-500" />
              <span>Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-4 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              <Github size={18} />
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative mb-10 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <span className="relative px-6 bg-white dark:bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-widest">
              or continue with email
            </span>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                <Mail size={14} className="text-emerald-500" />
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Lock size={14} className="text-emerald-500" />
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              New to EcoPulse?{" "}
              <Link
                to="/register"
                className="text-emerald-600 font-black hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Demo Credentials Utility - Redesigned for better impact */}
          <div className="mt-16 p-6 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-[2rem] border-2 border-emerald-100/50 dark:border-emerald-500/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Demo Preview Mode
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 shadow-sm transition-all hover:border-emerald-300">
                <span className="opacity-60">Admin Access</span>
                <span className="text-emerald-600">admin1@volunteer.org</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 shadow-sm transition-all hover:border-emerald-300">
                <span className="opacity-60">Volunteer Access</span>
                <span className="text-emerald-600">member1@volunteer.org</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
