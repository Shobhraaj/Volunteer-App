import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Home, History as HistoryIcon, Trophy, Settings, Users, BarChart3, Sun, Moon, Leaf, Shield, Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ActivityStatus from './ActivityStatus';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeIcon = theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Leaf className="w-4 h-4" />;
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Comfort';

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-[60] transition-all duration-300 shadow-sm">
      <div className="w-full h-20 flex items-center justify-between px-6 md:px-12">
        {/* Left: Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 transition-transform hover:-translate-y-0.5 group shrink-0">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-md group-hover:bg-primary-600 transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">EcoPulse</span>
        </Link>

        {/* Center: Main Nav */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl mx-4 shadow-inner">
          {user?.role === 'volunteer' && (
            <>
              <NavLink to="/dashboard" label="Dashboard" icon={<Home className="w-4 h-4" />} active={isActive('/dashboard')} />
              <NavLink to="/history" label="History" icon={<HistoryIcon className="w-4 h-4" />} active={isActive('/history')} />
              <NavLink to="/leaderboard" label="Leaderboard" icon={<Trophy className="w-4 h-4" />} active={isActive('/leaderboard')} />
            </>
          )}
          
          {user?.role === 'organizer' && (
            <>
              <NavLink to="/dashboard" label="Admin" icon={<Settings className="w-4 h-4" />} active={isActive('/dashboard')} />
              <NavLink to="/volunteers" label="Volunteers" icon={<Users className="w-4 h-4" />} active={isActive('/volunteers')} />
              <NavLink to="/analytics" label="Analytics" icon={<BarChart3 className="w-4 h-4" />} active={isActive('/analytics')} />
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 lg:gap-4 shrink-0">
          <button 
            className="flex items-center gap-2 h-10 px-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm" 
            onClick={toggleTheme}
            title={`Switch Theme (Current: ${themeLabel})`}
          >
            <span className="text-current flex items-center justify-center">{themeIcon}</span>
            <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">{themeLabel}</span>
          </button>

          <NotificationBell />
          <ActivityStatus userId={user?.id} compact />
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group h-12"
            >
              <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-all shrink-0">
                {initials}
              </div>
              <div className="hidden lg:flex flex-col justify-center text-left pr-2">
                <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user?.full_name}</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                  {user?.role}
                </div>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in z-50">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <Link to="/profile" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setDropdownOpen(false)}>My Profile</Link>
                  <Link to="/settings" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setDropdownOpen(false)}>Settings</Link>
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, icon, active }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2.5 h-10 px-5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
        active 
          ? 'bg-primary-500 !text-white shadow-lg shadow-primary-500/20' 
          : 'text-slate-500 dark:text-slate-400 hover:!text-slate-900 dark:hover:!text-white hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

