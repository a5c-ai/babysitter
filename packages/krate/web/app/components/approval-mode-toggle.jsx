'use client';
import { useState } from 'react';

const MODES = [
  {
    id: 'yolo',
    label: 'Yolo',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    dotColor: '#16a34a',
    tooltip:
      'Yolo mode: All tool calls are auto-approved without prompting. Use in trusted, sandboxed environments only.',
  },
  {
    id: 'prompt',
    label: 'Prompt',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    dotColor: '#d97706',
    tooltip:
      'Prompt mode: Sensitive or destructive tool calls require human approval before proceeding.',
  },
  {
    id: 'deny',
    label: 'Deny',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    dotColor: '#dc2626',
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
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Approval mode</span>
      </div>

      <div
        style={{
          display: 'flex',
          border: '1px solid #d1d5db',
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
              onClick={() => handleSelect(m.id)}
              onMouseEnter={() => setTooltip(m.id)}
              onMouseLeave={() => setTooltip(null)}
              role="radio"
              aria-checked={active}
              aria-pressed={active}
              title={m.tooltip}
              style={{
                flex: 1,
                padding: '5px 12px',
                border: 'none',
                borderRight: m.id !== 'deny' ? '1px solid #d1d5db' : 'none',
                backgroundColor: active ? m.color : 'transparent',
                color: active ? '#fff' : '#6b7280',
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
            color: '#374151',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: `3px solid ${MODES.find((m) => m.id === tooltip)?.color || '#94a3b8'}`,
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
