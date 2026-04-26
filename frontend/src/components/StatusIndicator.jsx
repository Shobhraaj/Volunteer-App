/**
 * StatusIndicator — read-only real-time status indicator for a specific user.
 * Reads from Firestore `userStatus/{userId}` document.
 */
import React from 'react';
import { useActivityStatus } from '../hooks/useFirestore';

const STATUS_COLORS = {
  active:  '#10b981', // Emerald
  busy:    '#f59e0b', // Amber
  offline: '#64748b', // Slate
};

export default function StatusIndicator({ userId, showLabel = false, size = 10 }) {
  const [status] = useActivityStatus(userId);

  if (!userId) return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={`Status: ${status}`}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: STATUS_COLORS[status] || STATUS_COLORS.offline,
          display: 'inline-block',
          boxShadow: status === 'active' ? `0 0 8px ${STATUS_COLORS.active}40` : 'none',
        }}
      />
      {showLabel && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {status}
        </span>
      )}
    </div>
  );
}
