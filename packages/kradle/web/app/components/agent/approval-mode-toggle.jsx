'use client';
import { useState } from 'react';

const MODES = [
  {
    id: 'yolo',
    label: 'Yolo',
    color: 'var(--success)',
    bgColor: 'color-mix(in srgb, var(--success) 12%, transparent)',
    borderColor: 'color-mix(in srgb, var(--success) 35%, var(--border))',
    dotColor: 'var(--success)',
    tooltip:
      'Yolo mode: All tool calls are auto-approved without prompting. Use in trusted, sandboxed environments only.',
  },
  {
    id: 'prompt',
    label: 'Prompt',
    color: 'var(--warning)',
    bgColor: 'color-mix(in srgb, var(--warning) 12%, transparent)',
    borderColor: 'color-mix(in srgb, var(--warning) 35%, var(--border))',
    dotColor: 'var(--warning)',
    tooltip:
      'Prompt mode: Sensitive or destructive tool calls require human approval before proceeding.',
  },
  {
    id: 'deny',
    label: 'Deny',
    color: 'var(--danger)',
    bgColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
    borderColor: 'color-mix(in srgb, var(--danger) 35%, var(--border))',
    dotColor: 'var(--danger)',
    tooltip:
      'Deny mode: All unapproved tool calls are automatically rejected. The agent will be blocked until permissions are relaxed.',
  },
];

export function ApprovalModeToggle({ initialMode = 'prompt', onChange }) {
  const [mode, setMode] = useState(initialMode);
  const [tooltip, setTooltip] = useState(null);

  const currentMeta = MODES.find((m) => m.id === mode) || MODES[1];

  function handleSelect(id) {
    setMode(id);
    if (onChange) onChange(id);
  }

  function handleKeyDown(e) {
    const currentId = e.currentTarget.dataset.modeId;
    const currentIndex = MODES.findIndex((m) => m.id === currentId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + MODES.length) % MODES.length;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % MODES.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = MODES.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextMode = MODES[nextIndex];
    handleSelect(nextMode.id);
    e.currentTarget.parentElement
      ?.querySelector(`[data-mode-id="${nextMode.id}"]`)
      ?.focus();
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: currentMeta.dotColor,
            flexShrink: 0,
            boxShadow: `0 0 0 3px ${currentMeta.bgColor}`,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Approval mode</span>
      </div>

      <div
        style={{
          display: 'flex',
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
        role="radiogroup"
        aria-label="Approval mode"
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              data-mode-id={m.id}
              onClick={() => handleSelect(m.id)}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setTooltip(m.id)}
              onMouseLeave={() => setTooltip(null)}
              role="radio"
              aria-checked={active}
              aria-pressed={active}
              tabIndex={active ? 0 : -1}
              title={m.tooltip}
              style={{
                flex: 1,
                padding: '5px 12px',
                border: 'none',
                borderRight: m.id !== 'deny' ? '1px solid var(--border)' : 'none',
                backgroundColor: active ? m.color : 'transparent',
                color: active ? 'var(--surface)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {tooltip && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${MODES.find((m) => m.id === tooltip)?.color || 'var(--text-muted)'}`,
            borderRadius: 4,
            padding: '6px 10px',
            maxWidth: 260,
            lineHeight: 1.5,
          }}
        >
          {MODES.find((m) => m.id === tooltip)?.tooltip}
        </div>
      )}
    </div>
  );
}
