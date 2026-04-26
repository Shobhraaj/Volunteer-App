/**
 * NotificationBell — real-time notification bell with dropdown.
 * Reads from Firestore `notifications/{userId}` collection.
 * Gracefully degrades when Firebase is not configured.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';

const TYPE_ICON = {
  task:     '📋',
  approval: '✅',
  cancel:   '❌',
  info:     'ℹ️',
  warning:  '⚠️',
};

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

// Demo notifications shown when Firebase is not configured
const DEMO_NOTIFICATIONS = [
  { id: '1', title: 'New task available', body: 'Community cleanup drive near your area', type: 'task',     read: false, createdAt: null },
  { id: '2', title: 'Application approved', body: 'You have been assigned to Medical Camp', type: 'approval', read: false, createdAt: null },
  { id: '3', title: 'Reminder',            body: 'Your task starts tomorrow at 9am',      type: 'info',     read: true,  createdAt: null },
];

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, unreadCount, markAllRead] = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Use demo data if Firebase not configured
  const items = notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS;
  const count = notifications.length > 0 ? unreadCount : DEMO_NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open && count > 0) markAllRead();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
          color: 'var(--text-secondary)', fontSize: '1.2rem',
          transition: 'color 0.15s ease',
          display: 'flex', alignItems: 'center',
        }}
        title="Notifications"
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#ef4444', color: 'white',
            fontSize: '0.6rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulseRed 1.5s infinite',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0,
          width: 340, maxHeight: 420,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 300,
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-glass)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔔 Notifications</span>
            {count > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-1)', fontSize: '0.75rem', fontFamily: 'inherit',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', maxHeight: 340 }}>
            {items.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔕</div>
                <div>No notifications yet</div>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: n.read ? 'none' : 'rgba(6,182,212,0.05)',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }}>
                    {TYPE_ICON[n.type] || 'ℹ️'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: n.read ? 500 : 700, fontSize: '0.85rem',
                      marginBottom: 2, color: 'var(--text-primary)',
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {n.body}
                    </div>
                    {n.createdAt && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--accent-1)', flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
