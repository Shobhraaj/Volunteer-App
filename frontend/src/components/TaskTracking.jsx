import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const STEPS = [
  { id: 'created',   label: 'Created',   icon: '📝' },
  { id: 'assigned',  label: 'Assigned',  icon: '👤' },
  { id: 'accepted',  label: 'Accepted',  icon: '🤝' },
  { id: 'active',    label: 'Active',    icon: '⚡' },
  { id: 'completed', label: 'Completed', icon: '🏆' },
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

  const getCurrentStepIndex = () => STEPS.findIndex(s => s.id === status);

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
    <div className="card">
      <h3 className="text-xl font-bold mb-6">Task Progress</h3>

      <div className="flex justify-between items-start relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100 dark:bg-white/10" />

        {STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index);
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all mb-2 shadow-sm ${
                  stepStatus === 'completed'
                    ? 'bg-primary-500 text-white shadow-primary-500/30'
                    : stepStatus === 'active'
                    ? 'bg-primary-500/20 text-primary-500 border-2 border-primary-500 scale-110'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                {step.icon}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider text-center ${
                stepStatus === 'pending' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {step.label}
              </div>
              {getTimestamp(step.id) && (
                <div className="text-[9px] text-slate-400 mt-0.5 font-medium">
                  {getTimestamp(step.id)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {status === 'cancelled' && (
        <div className="mt-6 p-3 bg-red-500/10 rounded-xl text-red-500 text-sm font-bold text-center border border-red-500/20">
          ❌ This task was cancelled.
        </div>
      )}
    </div>
  );
}
