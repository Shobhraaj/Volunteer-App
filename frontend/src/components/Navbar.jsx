import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <div className="logo-icon">⚡</div>
        <span>VolunteerAI</span>
      </Link>

      <div className="navbar-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/analytics" className={isActive('/analytics')}>Analytics</Link>
        <Link to="/profile" className={isActive('/profile')}>Profile</Link>
      </div>

      <div className="navbar-user">
        <div className="user-avatar">{initials}</div>
        <div style={{ fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
            {user?.role}
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
