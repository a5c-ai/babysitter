import React, { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Dialog heading */
  title?: string;
  /** Body text */
  message?: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Called when user confirms */
  onConfirm?: () => void;
  /** Called when user cancels or presses Escape */
  onCancel?: () => void;
  /** If true, confirm button uses danger color */
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps): JSX.Element | null {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus confirm button when dialog opens
  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [open]);

  // Trap Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--overlay-bg, rgba(0, 0, 0, 0.45))',
  };

  const panelStyle: React.CSSProperties = {
    background: 'var(--surface, #fff)',
    color: 'var(--text, #1f2937)',
    borderRadius: '8px',
    padding: '1.5rem',
    minWidth: '320px',
    maxWidth: '440px',
    boxShadow: '0 8px 30px var(--shadow, rgba(0,0,0,0.18))',
    border: '1px solid var(--border, #e5e7eb)',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text, #1f2937)',
  };

  const messageStyle: React.CSSProperties = {
    margin: '0.75rem 0 1.25rem',
    fontSize: '0.875rem',
    color: 'var(--text-muted, #6b7280)',
    lineHeight: 1.5,
  };

  const btnBase: React.CSSProperties = {
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  };

  const confirmBtnStyle: React.CSSProperties = {
    ...btnBase,
    background: danger ? 'var(--color-danger, #dc2626)' : 'var(--accent, #2563eb)',
    color: '#fff',
  };

  const cancelBtnStyle: React.CSSProperties = {
    ...btnBase,
    background: 'transparent',
    border: '1px solid var(--border, #d1d5db)',
    color: 'var(--text, #374151)',
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
