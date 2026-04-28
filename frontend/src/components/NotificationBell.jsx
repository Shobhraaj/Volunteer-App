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
    <div ref={ref} className="relative">
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        className="relative bg-transparent border-none cursor-pointer p-2 rounded-xl text-slate-500 dark:text-slate-400 text-xl transition-colors flex items-center hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Notifications"
      >
        🔔
        {count > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-80 max-h-[420px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
            <span className="font-bold text-sm text-slate-900 dark:text-white">🔔 Notifications</span>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="bg-transparent border-none cursor-pointer text-primary-500 hover:text-primary-600 text-xs font-bold"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[340px] custom-scrollbar">
            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <div className="text-3xl mb-2">🔕</div>
                <div className="text-sm font-medium">No notifications yet</div>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 flex gap-3 items-start transition-colors ${
                    n.read ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50' : 'bg-primary-500/5 hover:bg-primary-500/10'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] || 'ℹ️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm mb-0.5 text-slate-900 dark:text-white ${n.read ? 'font-medium' : 'font-bold'}`}>
                      {n.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {n.body}
                    </div>
                    {n.createdAt && (
                      <div className="text-[10px] text-slate-400 mt-1.5 font-medium uppercase tracking-wider">
                        {timeAgo(n.createdAt)}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5 shadow-sm shadow-primary-500/50" />
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
