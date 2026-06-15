'use client';

import { useState } from 'react';

const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'rgba(34,197,94,0.12)' : tone === 'warn' ? 'rgba(234,179,8,0.12)' : tone === 'danger' ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)', color: tone === 'good' ? '#16a34a' : tone === 'warn' ? '#ca8a04' : tone === 'danger' ? '#dc2626' : '#6b7280' });
const btnSecondary = { border: '1px solid var(--border)', background: 'transparent', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' };

function scoreTone(score) {
  if (score >= 0.8) return 'good';
  if (score >= 0.5) return 'warn';
  if (score > 0) return 'danger';
  return 'neutral';
}

export function EvalComparison({ org, results = [], cases = [], models = [] }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const caseMap = new Map(cases.map((c) => [c.metadata?.name, c]));

  // Compute per-model aggregates
  const modelStats = new Map();
  for (const model of models) {
    const modelResults = results.filter((r) => r.spec?.modelRef === model);
    const avgScore = modelResults.length ? modelResults.reduce((s, r) => s + (r.spec?.score || 0), 0) / modelResults.length : 0;
    const avgLatency = modelResults.length ? modelResults.reduce((s, r) => s + (r.spec?.latencyMs || 0), 0) / modelResults.length : 0;
    const totalTokens = modelResults.reduce((s, r) => s + (r.spec?.tokenUsage?.total || 0), 0);
    const totalCost = modelResults.reduce((s, r) => s + (r.spec?.cost || 0), 0);
    modelStats.set(model, { avgScore, avgLatency, totalTokens, totalCost, count: modelResults.length });
  }

  // Get unique case refs
  const caseRefs = [...new Set(results.map((r) => r.spec?.caseRef).filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Model comparison</h3>

      {models.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No models to compare. Run an eval suite with multiple models.
        </div>
      ) : (
        <>
          {/* Model summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(models.length, 4)}, 1fr)`, gap: '0.75rem' }}>
            {models.map((model) => {
              const stats = modelStats.get(model) || {};
              return (
                <div key={model} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-card, var(--bg-subtle))' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{model}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Avg score</span>
                      <span style={pillStyle(scoreTone(stats.avgScore))}>{(stats.avgScore * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Avg latency</span>
                      <span>{stats.avgLatency.toFixed(0)}ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total tokens</span>
                      <span>{stats.totalTokens.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cases</span>
                      <span>{stats.count}</span>
                    </div>
                    {stats.totalCost > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Cost</span>
                        <span>${stats.totalCost.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-side case comparison */}
          {caseRefs.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Case-by-case comparison</h4>
                {selectedCase && (
                  <button style={btnSecondary} onClick={() => setSelectedCase(null)}>Show all</button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(selectedCase ? [selectedCase] : caseRefs).map((caseRef) => {
                  const caseItem = caseMap.get(caseRef);
                  const caseResults = results.filter((r) => r.spec?.caseRef === caseRef);
                  return (
                    <div key={caseRef} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden', cursor: selectedCase ? 'default' : 'pointer' }} onClick={() => !selectedCase && setSelectedCase(caseRef)}>
                      <div style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{caseItem?.spec?.input?.slice(0, 100) || caseRef}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${models.length}, 1fr)` }}>
                        {models.map((model) => {
                          const modelResult = caseResults.find((r) => r.spec?.modelRef === model);
                          return (
                            <div key={model} style={{ padding: '0.75rem', borderRight: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>{model}</div>
                              {modelResult ? (
                                <>
                                  <span style={pillStyle(scoreTone(modelResult.spec?.score || 0))}>
                                    {((modelResult.spec?.score || 0) * 100).toFixed(1)}%
                                  </span>
                                  {selectedCase && modelResult.spec?.output && (
                                    <pre style={{ margin: '0.5rem 0 0', fontSize: '0.6875rem', whiteSpace: 'pre-wrap', color: 'var(--text-muted)', maxHeight: '200px', overflow: 'auto' }}>
                                      {modelResult.spec.output}
                                    </pre>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No result</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
