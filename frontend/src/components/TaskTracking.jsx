import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const STEPS = [
  { id: 'created',   label: 'Created',   icon: '📝' },
  { id: 'assigned',  label: 'Assigned',  icon: '👤' },
  { id: 'accepted',  label: 'Accepted',  icon: '🤝' },
  { id: 'active',    label: 'Active',    icon: '⚡' },
  { id: 'completed', label: 'Completed', icon: '🏆' }
];

export default function TaskTracking({ taskId, volunteerId, initialStatus, initialHistory }) {
  const [status, setStatus] = useState(initialStatus);
  const [history, setHistory] = useState(initialHistory || []);

  useEffect(() => {
    if (!taskId || !volunteerId) return;

    const docId = `${taskId}_${volunteerId}`;
    const unsub = onSnapshot(doc(db, 'task_tracking', docId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStatus(data.status);
        setHistory(data.history || []);
      }
    });

    return () => unsub();
  }, [taskId, volunteerId]);

  const getCurrentStepIndex = () => {
    return STEPS.findIndex(s => s.id === status);
  };

  const getStepStatus = (index) => {
    const currentIndex = getCurrentStepIndex();
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  const getTimestamp = (stepId) => {
    const entry = history.find(h => h.status === stepId);
    if (!entry) return null;
    return new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card glass-card reveal-on-scroll visible">
      <h3 style={{ marginBottom: '24px' }}>Task Progress</h3>
      
      <div className="tracking-container">
        <div className="tracking-steps">
          {STEPS.map((step, index) => {
            const stepStatus = getStepStatus(index);
            return (
              <div key={step.id} className={`tracking-step ${stepStatus}`}>
                <div className="step-icon apple-hover micro-interaction">
                  {step.icon}
                </div>
                <div className="step-label">{step.label}</div>
                {getTimestamp(step.id) && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {getTimestamp(step.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {status === 'cancelled' && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>
          ❌ This task was cancelled.
        </div>
      )}
    </div>
  );
}
