import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import ActivityStatus from './ActivityStatus';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const themeIcon = theme === 'light' ? '🔆' : theme === 'dark' ? '🌙' : '🧘';
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Comfort';

  return (
    <nav className="navbar fixed top-0 left-0 right-0 h-20 bg-opacity-70 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-6 lg:px-12 transition-all duration-300">
      <Link to="/dashboard" className="flex items-center gap-3 apple-hover group">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-primary-500/20 group-hover:rotate-12 transition-transform duration-300">
          🌿
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">VolunteerAI</span>
      </Link>

      <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl">
        {user?.role === 'volunteer' && (
          <>
            <NavLink to="/dashboard" label="Dashboard" icon="🏠" active={isActive('/dashboard')} />
            <NavLink to="/history" label="History" icon="⏳" active={isActive('/history')} />
            <NavLink to="/leaderboard" label="Leaderboard" icon="🏆" active={isActive('/leaderboard')} />
          </>
        )}
        
        {user?.role === 'organizer' && (
          <>
            <NavLink to="/dashboard" label="Admin" icon="⚙️" active={isActive('/dashboard')} />
            <NavLink to="/volunteers" label="Volunteers" icon="👥" active={isActive('/volunteers')} />
            <NavLink to="/analytics" label="Analytics" icon="📊" active={isActive('/analytics')} />
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button 
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95" 
          onClick={toggleTheme}
          title={`Switch Theme (Current: ${themeLabel})`}
        >
          <span className="text-lg">{themeIcon}</span>
          <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{themeLabel}</span>
        </button>

        <NotificationBell />
        <ActivityStatus userId={user?.id} compact />
        
        <Link to="/profile" className="flex items-center gap-3 p-1 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-all group">
          <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
            {initials}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">{user?.full_name}</div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
              {user?.role}
            </div>
          </div>
        </Link>

        <button className="hidden sm:inline-flex btn btn-secondary !px-4 !py-2 text-xs" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

function NavLink({ to, label, icon, active }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-white dark:bg-white/10 text-primary-500 shadow-sm' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

