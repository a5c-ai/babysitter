'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const RECENT_COMMANDS_KEY = 'krate:recentCommands';
const MAX_RECENT = 5;

function getRecentCommands() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentCommand(id) {
  try {
    const existing = getRecentCommands().filter((c) => c !== id);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify([id, ...existing].slice(0, MAX_RECENT)));
  } catch {
    // ignore
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
    { id: 'create-project', label: 'New Project', hint: 'Create a project board', href: prefix('/agents/projects/new'), group: 'Create' },
    { id: 'create-rule', label: 'New Trigger Rule', hint: 'Create a trigger rule', href: prefix('/agents/rules/new'), group: 'Create' },
    { id: 'create-repo', label: 'New Repository', hint: 'Create a repository', href: prefix('/repositories/new'), group: 'Create' },
    // Actions
    { id: 'action-dispatch', label: 'Dispatch Agent', hint: 'Run an agent now', action: () => document.querySelector('[data-dispatch-button]')?.click(), group: 'Actions' },
    { id: 'action-toggle-dark', label: 'Toggle Dark Mode', hint: 'Switch color theme', action: () => document.documentElement.classList.toggle('dark'), group: 'Actions' },
  ];
}

export function CommandPalette({ org, isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommandIds, setRecentCommandIds] = useState([]);
  const inputRef = useRef(null);

  const allCommands = buildCommands(org);

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

  const filteredCommands = query
    ? allCommands.filter((cmd) => fuzzyMatch(query, cmd.label) || fuzzyMatch(query, cmd.hint || ''))
    : allCommands;

  // Group filtered commands
  const groups = ['Navigate', 'Create', 'Actions'];
  const grouped = groups
    .map((g) => ({ group: g, commands: filteredCommands.filter((c) => c.group === g) }))
    .filter((g) => g.commands.length > 0);

  // Flat list for keyboard navigation
  const flatList = grouped.flatMap((g) => g.commands);

  // Show recent commands when query is empty
  const showRecent = !query && recentCommandIds.length > 0;
  const recentCommands = showRecent
    ? recentCommandIds.map((id) => allCommands.find((c) => c.id === id)).filter(Boolean)
    : [];

  const navList = showRecent ? recentCommands : flatList;

  function executeCommand(cmd) {
    addRecentCommand(cmd.id);
    onClose();
    if (cmd.href) {
      router.push(cmd.href);
    } else if (cmd.action) {
      cmd.action();
    }
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
          background: isSelected ? 'var(--bg-hover, #f3f4f6)' : 'none',
          border: 'none',
          borderLeft: isSelected ? '2px solid var(--accent, #3b82f6)' : '2px solid transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.875rem',
          color: 'var(--ink-pigment, #111)',
        }}
      >
        <span style={{ fontWeight: 500 }}>{cmd.label}</span>
        {cmd.hint && (
          <span style={{ color: 'var(--ink-muted, #9ca3af)', fontSize: '0.8rem' }}>{cmd.hint}</span>
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
        background: 'rgba(0,0,0,0.5)',
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
          background: 'var(--surface, #fff)',
          borderRadius: 8,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: 'min(600px, 90vw)',
          maxHeight: '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ borderBottom: '1px solid var(--border, #e5e7eb)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--ink-muted, #9ca3af)', fontSize: '1rem' }}>⌘</span>
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
              color: 'var(--ink-pigment, #111)',
            }}
            aria-label="Command palette search"
          />
          <kbd style={{ background: 'var(--bg, #f3f4f6)', border: '1px solid var(--border, #d1d5db)', borderRadius: 3, padding: '2px 6px', fontSize: '0.75rem', color: 'var(--ink-muted, #6b7280)' }}>Esc</kbd>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {showRecent && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted, #9ca3af)' }}>
                Recent
              </div>
              {recentCommands.map((cmd, idx) => renderCommandItem(cmd, idx))}
              <div style={{ borderTop: '1px solid var(--border, #e5e7eb)', margin: '4px 0' }} />
            </>
          )}
          {!showRecent && grouped.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-muted, #9ca3af)', fontSize: '0.875rem' }}>
              No commands match &ldquo;{query}&rdquo;
            </div>
          )}
          {!showRecent && grouped.map((g) => {
            const groupStart = flatList.indexOf(g.commands[0]);
            return (
              <div key={g.group}>
                <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted, #9ca3af)' }}>
                  {g.group}
                </div>
                {g.commands.map((cmd, idx) => renderCommandItem(cmd, groupStart + idx))}
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: '1px solid var(--border, #e5e7eb)', padding: '8px 16px', display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--ink-muted, #9ca3af)' }}>
          <span><kbd style={{ background: 'var(--bg, #f3f4f6)', border: '1px solid var(--border, #d1d5db)', borderRadius: 2, padding: '1px 4px' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ background: 'var(--bg, #f3f4f6)', border: '1px solid var(--border, #d1d5db)', borderRadius: 2, padding: '1px 4px' }}>↵</kbd> select</span>
          <span><kbd style={{ background: 'var(--bg, #f3f4f6)', border: '1px solid var(--border, #d1d5db)', borderRadius: 2, padding: '1px 4px' }}>Esc</kbd> close</span>
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
