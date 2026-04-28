/**
 * ActivityStatus — shows and lets the user toggle their activity status.
 * Status stored in Firestore `userStatus/{userId}`.
 * Gracefully degrades (local state only) when Firebase is not configured.
 *
 * Props:
 *   userId  {number|string}
 *   compact {boolean}  — show dot only (for navbar)
 */
import React, { useState, useRef, useEffect } from 'react';
import { useActivityStatus } from '../hooks/useFirestore';

const STATUS_OPTIONS = [
  { value: 'active',  label: 'Active',  color: '#10b981', emoji: '🟢' },
  { value: 'busy',    label: 'Busy',    color: '#f59e0b', emoji: '🟡' },
  { value: 'offline', label: 'Offline', color: '#64748b', emoji: '⚫' },
];

export default function ActivityStatus({ userId, compact = false }) {
  const [status, , updateStatus] = useActivityStatus(userId);
  const [open, setOpen]          = useState(false);
  const ref                      = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[2];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        className={`flex items-center gap-2.5 rounded-full transition-all active:scale-95 ${
          compact ? 'p-2 hover:bg-slate-100 dark:hover:bg-white/5' : 'px-5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm'
        }`}
        onClick={() => setOpen((o) => !o)}
        title="Set activity status"
      >
        <span
          className="relative flex h-3 w-3"
        >
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: current.color }}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3`} style={{ backgroundColor: current.color }}></span>
        </span>
        {!compact && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{current.label}</span>}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 p-2 glass-card min-w-[160px] shadow-2xl animate-slide-up z-[110]"
        >
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Set Status</div>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { updateStatus(opt.value); setOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                status === opt.value 
                  ? 'bg-primary-500/10 text-primary-500' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
