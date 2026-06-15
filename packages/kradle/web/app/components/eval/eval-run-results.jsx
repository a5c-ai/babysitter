'use client';

import { useState } from 'react';

const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'rgba(34,197,94,0.12)' : tone === 'warn' ? 'rgba(234,179,8,0.12)' : tone === 'danger' ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)', color: tone === 'good' ? '#16a34a' : tone === 'warn' ? '#ca8a04' : tone === 'danger' ? '#dc2626' : '#6b7280' });

function scoreTone(score) {
  if (score >= 0.8) return 'good';
  if (score >= 0.5) return 'warn';
  if (score > 0) return 'danger';
  return 'neutral';
}

export function EvalRunResults({ org, run = null, results: initialResults = [], cases = [] }) {
  const [expandedResult, setExpandedResult] = useState(null);
  const results = initialResults;

  if (!run) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Select an eval run to view results.
      </div>
    );
  }

  const models = run.spec?.models || [];
  const caseMap = new Map(cases.map((c) => [c.metadata?.name, c]));

  // Group results by case, then by model
  const resultsByCase = new Map();
  for (const result of results) {
    const caseRef = result.spec?.caseRef || 'unknown';
    if (!resultsByCase.has(caseRef)) resultsByCase.set(caseRef, []);
    resultsByCase.get(caseRef).push(result);
  }

  const avgScore = results.length ? (results.reduce((sum, r) => sum + (r.spec?.score || 0), 0) / results.length) : 0;
  const totalTokens = results.reduce((sum, r) => sum + (r.spec?.tokenUsage?.total || 0), 0);
  const avgLatency = results.length ? (results.reduce((sum, r) => sum + (r.spec?.latencyMs || 0), 0) / results.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{(avgScore * 100).toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg score</div>
        </div>
        <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{results.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Results</div>
        </div>
        <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{avgLatency.toFixed(0)}ms</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg latency</div>
        </div>
        <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{totalTokens.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total tokens</div>
        </div>
      </div>

      {/* Results table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Case</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Model</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Score</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Latency</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Tokens</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, i) => {
              const caseItem = caseMap.get(result.spec?.caseRef);
              const isExpanded = expandedResult === i;
              return (
                <tr key={result.metadata?.name || i} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isExpanded ? 'var(--bg-subtle)' : 'transparent' }} onClick={() => setExpandedResult(isExpanded ? null : i)}>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {caseItem?.spec?.input?.slice(0, 60) || result.spec?.caseRef || '-'}
                    </div>
                    {isExpanded && result.spec?.output && (
                      <pre style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--text-muted)', maxWidth: '400px' }}>
                        {result.spec.output}
                      </pre>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem' }}><code style={{ fontSize: '0.75rem' }}>{result.spec?.modelRef || '-'}</code></td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    <span style={pillStyle(scoreTone(result.spec?.score || 0))}>{((result.spec?.score || 0) * 100).toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{result.spec?.latencyMs ? `${result.spec.latencyMs}ms` : '-'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{result.spec?.tokenUsage?.total?.toLocaleString() || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={pillStyle(result.status?.phase === 'Completed' ? 'good' : result.status?.phase === 'Failed' ? 'danger' : 'neutral')}>
                      {result.status?.phase || 'pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No results yet. Run the evaluation suite to generate results.
        </div>
      )}
    </div>
  );
}
