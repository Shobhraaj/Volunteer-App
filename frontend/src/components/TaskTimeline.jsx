/**
 * TaskTimeline — Visual progress bar for task stages.
 * Created → Assigned → Accepted → Active → Completed → Cancelled
 */
import React from 'react';

const STAGES = [
  { id: 'created',   label: 'Created',   icon: '📝' },
  { id: 'assigned',  label: 'Assigned',  icon: '📌' },
  { id: 'accepted',  label: 'Accepted',  icon: '🤝' },
  { id: 'active',    label: 'Active',    icon: '⚡' },
  { id: 'completed', label: 'Completed', icon: '✅' },
];

export default function TaskTimeline({ currentStatus, timestamps = {} }) {
  const isCancelled = currentStatus === 'cancelled';
  const activeIndex = STAGES.findIndex(s => s.id === currentStatus);
  
  // If cancelled, we show it specially
  if (isCancelled) {
    return (
      <div className="task-timeline-cancelled" style={{
        padding: '16px', background: 'rgba(239, 68, 68, 0.1)', 
        borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)',
        display: 'flex', alignItems: 'center', gap: 12, color: '#ef4444'
      }}>
        <span style={{ fontSize: '1.5rem' }}>🚫</span>
        <div>
          <div style={{ fontWeight: 700 }}>Task Cancelled</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {timestamps.cancelled ? new Date(timestamps.cancelled).toLocaleString() : 'This task has been terminated.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-timeline" style={{
      display: 'flex', justifyContent: 'space-between', position: 'relative',
      padding: '24px 0', marginBottom: '12px'
    }}>
      {/* Background line */}
      <div style={{
        position: 'absolute', top: '44px', left: '10%', right: '10%',
        height: '4px', background: 'var(--border-glass)', zIndex: 0
      }} />
      
      {/* Progress line */}
      <div style={{
        position: 'absolute', top: '44px', left: '10%',
        width: `${(activeIndex / (STAGES.length - 1)) * 80}%`,
        height: '4px', background: 'var(--accent-primary)', zIndex: 1,
        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }} />

      {STAGES.map((stage, index) => {
        const isPast = index < activeIndex;
        const isCurrent = index === activeIndex;
        const ts = timestamps[stage.id];

        return (
          <div key={stage.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '20%', zIndex: 2, position: 'relative'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isCurrent || isPast ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              border: `4px solid ${isCurrent ? 'var(--accent-soft)' : 'var(--border-glass)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', transition: 'var(--transition)',
              boxShadow: isCurrent ? '0 0 15px var(--accent-primary)' : 'none',
              color: isPast || isCurrent ? 'white' : 'var(--text-muted)'
            }}>
              {isPast ? '✓' : stage.icon}
            </div>
            
            <div style={{
              marginTop: 12, textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 700,
                color: isCurrent ? 'var(--accent-primary)' : isPast ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {stage.label}
              </div>
              {ts && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
