import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// Pricing per 1M tokens in USD (input / output / cache_read / cache_write)
// Rates are approximate public list prices as of mid-2025.
// ---------------------------------------------------------------------------

interface ModelRates {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

const MODEL_PRICING: Record<string, ModelRates> = {
  'claude-opus-4': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'claude-opus-4-5': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'claude-sonnet-4': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-4-5': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-3-7': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-3-5': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-3-5': { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
  'claude-haiku-3': { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.3 },
  'gpt-4o': { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 },
  'gpt-4-turbo': { input: 10, output: 30, cacheRead: 0, cacheWrite: 0 },
  'gpt-4': { input: 30, output: 60, cacheRead: 0, cacheWrite: 0 },
};

function normalizeModelKey(model: string | null | undefined): string | null {
  if (!model) return null;
  const s = model.toLowerCase().replace(/[_\s]/g, '-');
  if (MODEL_PRICING[s]) return s;
  const keys = Object.keys(MODEL_PRICING);
  let best: string | null = null;
  for (const key of keys) {
    if (s.startsWith(key) || s.includes(key)) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best;
}

export interface TurnUsage {
  id?: string;
  turnId?: string;
  messageId?: string;
  timestamp?: string;
  model?: string;
  modelId?: string;
  inputTokens?: number;
  input_tokens?: number;
  outputTokens?: number;
  output_tokens?: number;
  cacheReadTokens?: number;
  cache_read_input_tokens?: number;
  cacheWriteTokens?: number;
  cache_write_input_tokens?: number;
}

function computeTurnCost(turn: TurnUsage): number | null {
  const model = turn.model || turn.modelId || '';
  const key = normalizeModelKey(model);
  const rates = key ? MODEL_PRICING[key] : null;
  if (!rates) return null;

  const inputTokens = turn.inputTokens || turn.input_tokens || 0;
  const outputTokens = turn.outputTokens || turn.output_tokens || 0;
  const cacheRead = turn.cacheReadTokens || turn.cache_read_input_tokens || 0;
  const cacheWrite = turn.cacheWriteTokens || turn.cache_write_input_tokens || 0;

  return (
    (inputTokens * rates.input +
      outputTokens * rates.output +
      cacheRead * rates.cacheRead +
      cacheWrite * rates.cacheWrite) /
    1_000_000
  );
}

function formatCost(usd: number | null): string {
  if (usd == null) return '—';
  if (usd < 0.0001) return '<$0.0001';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

function formatTokens(n: number | null | undefined): string {
  if (n == null || n === 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function turnCostKey(turn: TurnUsage): string {
  return turn.id ||
    turn.turnId ||
    turn.messageId ||
    turn.timestamp ||
    [
      turn.model || turn.modelId || 'unknown-model',
      turn.inputTokens || turn.input_tokens || 0,
      turn.outputTokens || turn.output_tokens || 0,
      turn.cacheReadTokens || turn.cache_read_input_tokens || 0,
      turn.cacheWriteTokens || turn.cache_write_input_tokens || 0,
    ].join(':') || '';
}

interface TurnCostRowProps {
  turn: TurnUsage;
  index: number;
}

function TurnCostRow({ turn, index }: TurnCostRowProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const model = turn.model || turn.modelId || '—';
  const inputTokens = turn.inputTokens || turn.input_tokens || 0;
  const outputTokens = turn.outputTokens || turn.output_tokens || 0;
  const cacheRead = turn.cacheReadTokens || turn.cache_read_input_tokens || 0;
  const cacheWrite = turn.cacheWriteTokens || turn.cache_write_input_tokens || 0;
  const cost = computeTurnCost(turn);
  const known = normalizeModelKey(model);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      style={{ marginBottom: 4 }}
    >
      <summary
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          fontSize: 12,
          listStyle: 'none',
        }}
      >
        <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: 11 }}>Turn {index + 1}</span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: 'var(--text)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {model}
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 600,
            color: cost != null ? '#1e293b' : '#9ca3af',
            flexShrink: 0,
          }}
        >
          {cost != null ? formatCost(cost) : '—'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </summary>

      <div
        style={{
          padding: '8px 10px',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          backgroundColor: '#fff',
        }}
      >
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 8px 2px 0', color: 'var(--text-muted)' }}>Input tokens</td>
              <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{formatTokens(inputTokens)}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 8px 2px 0', color: 'var(--text-muted)' }}>Output tokens</td>
              <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{formatTokens(outputTokens)}</td>
            </tr>
            {cacheRead > 0 && (
              <tr>
                <td style={{ padding: '2px 8px 2px 0', color: 'var(--text-muted)' }}>Cache read</td>
                <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{formatTokens(cacheRead)}</td>
              </tr>
            )}
            {cacheWrite > 0 && (
              <tr>
                <td style={{ padding: '2px 8px 2px 0', color: 'var(--text-muted)' }}>Cache write</td>
                <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{formatTokens(cacheWrite)}</td>
              </tr>
            )}
            <tr style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 8px 2px 0', color: 'var(--text)', fontWeight: 600 }}>
                Estimated cost
              </td>
              <td
                style={{
                  fontFamily: 'monospace',
                  textAlign: 'right',
                  fontWeight: 600,
                  color: cost != null ? '#1e293b' : '#9ca3af',
                }}
              >
                {cost != null ? formatCost(cost) : known === null ? 'unknown model' : '—'}
              </td>
            </tr>
          </tbody>
        </table>
        {!known && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
            Pricing not available for model &quot;{model}&quot;. Cost cannot be estimated.
          </p>
        )}
      </div>
    </details>
  );
}

export interface SessionCostProps {
  turns?: TurnUsage[];
  totalCost?: number | string | null;
  compact?: boolean;
}

export function SessionCost({ turns = [], totalCost, compact = false }: SessionCostProps): JSX.Element {
  const turnsWithUsage = (turns || []).filter(
    (t) => ((t.inputTokens || t.input_tokens || 0) + (t.outputTokens || t.output_tokens || 0)) > 0
  );

  const computedTotal = turnsWithUsage.reduce((acc, t) => {
    const c = computeTurnCost(t);
    return c != null ? acc + c : acc;
  }, 0);

  const displayTotal =
    totalCost != null
      ? `$${Number(totalCost).toFixed(3)}`
      : turnsWithUsage.length > 0
      ? formatCost(computedTotal)
      : '—';

  const totalInputTokens = turnsWithUsage.reduce(
    (acc, t) => acc + (t.inputTokens || t.input_tokens || 0),
    0
  );
  const totalOutputTokens = turnsWithUsage.reduce(
    (acc, t) => acc + (t.outputTokens || t.output_tokens || 0),
    0
  );

  if (compact) {
    return (
      <div
        aria-live="polite"
        aria-label={`Session cost: ${displayTotal}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          padding: '6px 10px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Session cost</span>
        <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{displayTotal}</strong>
        {totalInputTokens > 0 && (
          <>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {formatTokens(totalInputTokens)} in / {formatTokens(totalOutputTokens)} out
            </span>
          </>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{turnsWithUsage.length} turns</span>
      </div>
    );
  }

  return (
    <div>
      <div
        aria-live="polite"
        aria-label={`Total session cost: ${displayTotal}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          padding: '8px 10px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 4,
        }}
      >
        <span style={{ fontSize: 12, color: '#166534' }}>Total session cost</span>
        <strong
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            color: '#14532d',
            flex: 1,
          }}
        >
          {displayTotal}
        </strong>
        <span style={{ fontSize: 11, color: '#16a34a' }}>
          {formatTokens(totalInputTokens)} in / {formatTokens(totalOutputTokens)} out
        </span>
      </div>

      {turnsWithUsage.length > 0 ? (
        <div>
          {turnsWithUsage.map((turn, turnIndex) => (
            <TurnCostRow key={turnCostKey(turn)} turn={turn} index={turnIndex} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
          No per-turn token usage data available for this session.
        </p>
      )}
    </div>
  );
}
