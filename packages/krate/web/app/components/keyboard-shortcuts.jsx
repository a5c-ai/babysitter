'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SHORTCUTS_DATA = [
  { keys: 'Cmd K', label: 'Open command palette' },
  { keys: 'g s', label: 'Go to Agent Stacks' },
  { keys: 'g p', label: 'Go to Projects' },
  { keys: 'g r', label: 'Go to Runs' },
  { keys: 'g d', label: 'Go to Dashboard' },
  { keys: 'n s', label: 'New Agent Stack' },
  { keys: 'n p', label: 'New Project' },
  { keys: '?', label: 'Show/hide this help' },
];

const CHORD_MAP = {
  gs: '/agents/stacks',
  gp: '/agents/projects',
  gr: '/agents/runs',
  gd: '/',
  ns: '/agents/stacks/new',
  np: '/agents/projects/new',
};

export function KeyboardShortcuts({ org }) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const pendingKey = useRef(null);
  const pendingTimeout = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      // Skip if focus is in an input/textarea/select/contenteditable
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) {
        return;
      }
      // Skip if modifier keys are held (except for ?)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // Handle Escape to close the help modal
      if (key === 'Escape' && showHelpRef.current) {
        e.preventDefault();
        setShowHelp(false);
        return;
      }

      // Handle pending chord keys
      if (pendingKey.current) {
        const chord = pendingKey.current + key;
        clearTimeout(pendingTimeout.current);
        pendingKey.current = null;

        if (CHORD_MAP[chord]) {
          e.preventDefault();
          const path = CHORD_MAP[chord];
          router.push('/orgs/' + org + (path === '/' ? '' : path));
        }
        return;
      }

      // Start a chord sequence
      if (key === 'g' || key === 'n') {
        pendingKey.current = key;
        pendingTimeout.current = setTimeout(() => {
          pendingKey.current = null;
        }, 1500);
        return;
      }

      // Toggle help modal
      if (key === '?') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(pendingTimeout.current);
    };
  }, [org, router]);

  // Keep a ref for showHelp so the event handler can read current value
  const showHelpRef = useRef(showHelp);
  useEffect(() => {
    showHelpRef.current = showHelp;
  }, [showHelp]);

  if (!showHelp) return null;

  return (
    <div
      onClick={() => setShowHelp(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #fff)',
          borderRadius: 8,
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          padding: '2rem',
          minWidth: 360,
          maxWidth: '90vw',
        }}
      >
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Keyboard Shortcuts</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <tbody>
            {SHORTCUTS_DATA.map(({ keys, label }) => (
              <tr key={keys} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--ink-muted, #6b7280)', whiteSpace: 'nowrap' }}>
                  {keys.split(' ').map((k) => (
                    <kbd
                      key={k}
                      style={{
                        background: 'var(--bg, #f3f4f6)',
                        border: '1px solid var(--border, #d1d5db)',
                        borderRadius: 3,
                        padding: '1px 6px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        marginRight: 4,
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                </td>
                <td style={{ padding: '0.5rem 0 0.5rem 1rem' }}>{label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: 'var(--ink-muted, #6b7280)', textAlign: 'right' }}>
          Press <kbd style={{ background: 'var(--bg, #f3f4f6)', border: '1px solid var(--border, #d1d5db)', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: '0.75rem' }}>?</kbd> or Escape to close
        </p>
      </div>
    </div>
  );
}
