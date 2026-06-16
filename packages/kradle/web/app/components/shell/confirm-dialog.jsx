'use client';

import { useEffect, useRef } from 'react';

/**
 * ConfirmDialog -- reusable modal confirmation dialog.
 *
 * Props:
 *   open          {boolean}  -- whether the dialog is visible
 *   title         {string}   -- dialog heading
 *   message       {string}   -- body text
 *   confirmLabel  {string}   -- label for the confirm button (default "Confirm")
 *   cancelLabel   {string}   -- label for the cancel button (default "Cancel")
 *   onConfirm     {fn}       -- called when user confirms
 *   onCancel      {fn}       -- called when user cancels or presses Escape
 *   danger        {boolean}  -- if true, confirm button uses danger color
 */
export function ConfirmDialog({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  const confirmRef = useRef(null);

  // Auto-focus confirm button when dialog opens
  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [open]);

  // Trap Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--shadow)',
  };

  const panelStyle = {
    background: 'var(--panel-strong)',
    color: 'var(--text)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    minWidth: '320px',
    maxWidth: '440px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--accent)',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--text)',
  };

  const messageStyle = {
    margin: '0.75rem 0 1.25rem',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  };

  const btnBase = {
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  };

  const confirmBtnStyle = {
    ...btnBase,
    background: danger ? 'var(--danger)' : 'var(--accent)',
    color: '#fff',
  };

  const cancelBtnStyle = {
    ...btnBase,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            style={confirmBtnStyle}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
