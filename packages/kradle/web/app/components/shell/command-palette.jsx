'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '../../hooks/use-debounce.js';

const RECENT_COMMANDS_KEY = 'kradle:recentCommands';
const MAX_RECENT = 5;

function getRecentCommands() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) || '[]');
  } catch (err) {
    console.warn('[command-palette] Failed to read recent commands from localStorage:', err.message || err);
    return [];
  }
}

function addRecentCommand(id) {
  try {
    const existing = getRecentCommands().filter((c) => c !== id);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify([id, ...existing].slice(0, MAX_RECENT)));
  } catch (err) {
    console.warn('[command-palette] Failed to write recent commands to localStorage:', err.message || err);
  }
}

function fuzzyMatch(query, label) {
  if (!query) return true;
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  let qi = 0;
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function buildCommands(org) {
  const prefix = (path) => '/orgs/' + org + (path === '/' ? '' : path);
  return [
    // Navigate
    { id: 'nav-dashboard', label: 'Go to Dashboard', hint: 'Home workspace', href: prefix('/'), group: 'Navigate' },
    { id: 'nav-repos', label: 'Go to Repositories', hint: 'Code and files', href: prefix('/repositories'), group: 'Navigate' },
    { id: 'nav-stacks', label: 'Go to Agent Stacks', hint: 'Stack configurations', href: prefix('/agents/stacks'), group: 'Navigate' },
    { id: 'nav-agent-directory', label: 'Go to Agent Directory', hint: 'Personas and profiles', href: prefix('/agents/directory'), group: 'Navigate' },
    { id: 'nav-sessions', label: 'Go to Sessions', hint: 'Chat sessions', href: prefix('/agents/sessions'), group: 'Navigate' },
    { id: 'nav-runs', label: 'Go to Dispatch Runs', hint: 'Dispatch runs', href: prefix('/agents/runs'), group: 'Navigate' },
    { id: 'nav-rules', label: 'Go to Trigger Rules', hint: 'Rule definitions', href: prefix('/agents/rules'), group: 'Navigate' },
    { id: 'nav-projects', label: 'Go to Projects', hint: 'Project boards', href: prefix('/agents/projects'), group: 'Navigate' },
    { id: 'nav-approvals', label: 'Go to Approvals', hint: 'Pending approvals', href: prefix('/agents/approvals'), group: 'Navigate' },
    { id: 'nav-memory', label: 'Go to Memory', hint: 'Memory repos', href: prefix('/agents/memory'), group: 'Navigate' },
    { id: 'nav-insights', label: 'Go to Insights', hint: 'Health and activity', href: prefix('/insights'), group: 'Navigate' },
    { id: 'nav-people', label: 'Go to People', hint: 'Users and teams', href: prefix('/people'), group: 'Navigate' },
    { id: 'nav-deployments', label: 'Go to Deployments', hint: 'Releases and envs', href: prefix('/deployments'), group: 'Navigate' },
    // Create
    { id: 'create-stack', label: 'New Agent Stack', hint: 'Create a new stack', href: prefix('/agents/stacks/new'), group: 'Create' },
    { id: 'create-agent-persona', label: 'New Agent Persona', hint: 'Create identity and deployment', href: prefix('/agents/directory/new'), group: 'Create' },
    { id: 'create-project', label: 'New Project', hint: 'Create a project board', href: prefix('/agents/projects/new'), group: 'Create' },
    { id: 'create-rule', label: 'New Trigger Rule', hint: 'Create a trigger rule', href: prefix('/agents/rules/new'), group: 'Create' },
    { id: 'create-repo', label: 'New Repository', hint: 'Create a repository', href: prefix('/repositories/new'), group: 'Create' },
    // Actions
    { id: 'action-dispatch', label: 'Dispatch Agent Persona', hint: 'Run an agent identity with stack fallback', href: prefix('/agents/runs'), group: 'Actions' },
    { id: 'action-toggle-dark', label: 'Toggle Dark Mode', hint: 'Switch color theme', action: () => document.documentElement.classList.toggle('dark'), group: 'Actions' },
  ];
}

export function CommandPalette({ org, isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommandIds, setRecentCommandIds] = useState([]);
  const [actionError, setActionError] = useState('');
  const actionErrorTimerRef = useRef(null);
  const inputRef = useRef(null);

  const allCommands = useMemo(() => buildCommands(org), [org]);
  const debouncedQuery = useDebounce(query, 150);

  // Load recent commands when opened
  useEffect(() => {
    if (isOpen) {
      setRecentCommandIds(getRecentCommands());
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCommands = useMemo(() => debouncedQuery
    ? allCommands.filter((cmd) => fuzzyMatch(debouncedQuery, cmd.label) || fuzzyMatch(debouncedQuery, cmd.hint || ''))
    : allCommands, [debouncedQuery, allCommands]);

  // Group filtered commands
  const groups = ['Navigate', 'Create', 'Actions'];
  const grouped = useMemo(() => groups
    .map((g) => ({ group: g, commands: filteredCommands.filter((c) => c.group === g) }))
    .filter((g) => g.commands.length > 0), [filteredCommands]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => grouped.flatMap((g) => g.commands), [grouped]);

  // Show recent commands when query is empty
  const showRecent = !query && recentCommandIds.length > 0;
  const recentCommands = showRecent
    ? recentCommandIds.map((id) => allCommands.find((c) => c.id === id)).filter(Boolean)
    : [];

  const navList = showRecent ? recentCommands : flatList;

  function executeCommand(cmd) {
    addRecentCommand(cmd.id);
    setActionError('');
    try {
      if (cmd.href) {
        onClose();
        router.push(cmd.href);
      } else if (cmd.action) {
        onClose();
        try {
          cmd.action();
        } catch {
          showActionError('Could not execute command');
        }
      }
    } catch {
      showActionError('Could not execute command');
    }
  }

  function showActionError(msg) {
    setActionError(msg);
    if (actionErrorTimerRef.current) clearTimeout(actionErrorTimerRef.current);
    actionErrorTimerRef.current = setTimeout(() => setActionError(''), 3000);
  }

  function handleInputKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, navList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = navList[selectedIndex];
      if (cmd) executeCommand(cmd);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!isOpen) return null;

  // Render groups or recent
  function renderCommandItem(cmd, absoluteIdx) {
    const isSelected = absoluteIdx === selectedIndex;
    return (
      <button
        key={cmd.id}
        onClick={() => { setSelectedIndex(absoluteIdx); executeCommand(cmd); }}
        onMouseEnter={() => setSelectedIndex(absoluteIdx)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          background: isSelected ? 'var(--surface-raised)' : 'none',
          border: 'none',
          borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.875rem',
          color: 'var(--text)',
        }}
      >
        <span style={{ fontWeight: 500 }}>{cmd.label}</span>
        {cmd.hint && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{cmd.hint}</span>
        )}
      </button>
    );
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--shadow)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel-strong)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--accent)',
          boxShadow: 'var(--shadow-lg)',
          width: 'min(600px, 90vw)',
          maxHeight: '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search commands..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1rem',
              color: 'var(--text)',
            }}
            aria-label="Command palette search"
          />
          <kbd style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Esc</kbd>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {showRecent && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                Recent
              </div>
              {recentCommands.map((cmd, idx) => renderCommandItem(cmd, idx))}
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            </>
          )}
          {!showRecent && grouped.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No commands match &ldquo;{query}&rdquo;
            </div>
          )}
          {!showRecent && grouped.map((g) => {
            const groupStart = flatList.indexOf(g.commands[0]);
            return (
              <div key={g.group}>
                <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                  {g.group}
                </div>
                {g.commands.map((cmd, idx) => renderCommandItem(cmd, groupStart + idx))}
              </div>
            );
          })}
        </div>
        {actionError && (
          <div style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--danger)', background: 'var(--card)', borderTop: '1px solid var(--danger)' }}>
            {actionError}
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px', display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span><kbd style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 2, padding: '1px 4px' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 2, padding: '1px 4px' }}>↵</kbd> select</span>
          <span><kbd style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 2, padding: '1px 4px' }}>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteWrapper({ org }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <CommandPalette org={org} isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
