/**
 * ConfirmDialog — reusable confirmation modal.
 * Replaces window.confirm() throughout the app.
 *
 * Props:
 *   open        {boolean}   — show/hide
 *   title       {string}
 *   message     {string}
 *   confirmLabel {string}   — default "Confirm"
 *   cancelLabel  {string}   — default "Cancel"
 *   danger      {boolean}   — red confirm button
 *   onConfirm   {function}
 *   onCancel    {function}
 */
import React from 'react';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div
        className="glass-card w-full max-w-sm p-8 shadow-2xl animate-slide-up flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 ${danger ? 'bg-red-500/10 text-red-500' : 'bg-primary-500/10 text-primary-500'}`}>
          {danger ? '⚠️' : '❓'}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h2>
        {message && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {message}
          </p>
        )}
        <div className="flex gap-3 w-full">
          <button
            id="confirm-dialog-cancel"
            className="flex-1 btn btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-dialog-confirm"
            className={`flex-1 btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
