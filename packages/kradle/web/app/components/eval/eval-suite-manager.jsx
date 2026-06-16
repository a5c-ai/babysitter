'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InlineCreateForm, ResourceActions } from '../resource-crud-actions.jsx';

const cardStyle = { padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-card, var(--bg-subtle))' };
const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'color-mix(in srgb, var(--success) 12%, transparent)' : tone === 'warn' ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : 'color-mix(in srgb, var(--text-muted) 12%, transparent)', color: tone === 'good' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : 'var(--text-muted)' });
const btnSecondary = { border: '1px solid var(--border)', background: 'transparent', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' };

export function EvalSuiteManager({ org, suites: initialSuites = [], cases: initialCases = [], runs: initialRuns = [] }) {
  const router = useRouter();
  const [suites, setSuites] = useState(initialSuites);
  const cases = initialCases;
  const runs = initialRuns;

  function handleCreated(body) {
    const item = body?.items?.[0] || body?.resource || body;
    if (item?.metadata?.name) setSuites((prev) => [...prev, item]);
    else router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Eval suites</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{suites.length} configured</p>
            </div>
          </div>

          {suites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No evaluation suites yet. Create one to start testing your agent prompts against scoring criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {suites.map((suite) => {
                const name = suite.metadata?.name || 'unnamed';
                const suiteRuns = runs.filter((r) => r.spec?.suiteRef === name);
                const suiteCases = cases.filter((c) => c.spec?.suiteRef === name);
                const lastRun = suiteRuns.sort((a, b) => (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''))[0];
                return (
                  <a key={name} href={`evals/${name}`} style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{suite.spec?.displayName || name}</h4>
                      <span style={pillStyle(suiteRuns.length ? 'good' : 'neutral')}>{suiteRuns.length} runs</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {suiteCases.length} test cases
                      {lastRun ? ` · Last run: ${lastRun.status?.phase || 'unknown'}` : ''}
                    </p>
                    {suite.spec?.description && (
                      <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{suite.spec.description}</p>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <InlineCreateForm
          org={org}
          kind="EvalSuite"
          title="Create eval suite"
          fields={[
            { name: 'name', label: 'Name', placeholder: 'my-eval-suite' },
            { name: 'displayName', label: 'Display name', placeholder: 'My Eval Suite' },
            { name: 'description', label: 'Description', placeholder: 'What does this suite evaluate?', required: false },
            { name: 'scoringCriteria', label: 'Scoring criteria', placeholder: 'accuracy, relevance, safety', required: false }
          ]}
          buildSpec={(fd) => ({
            displayName: fd.get('displayName'),
            description: fd.get('description') || '',
            scoringCriteria: (fd.get('scoringCriteria') || '').split(',').map((s) => s.trim()).filter(Boolean)
          })}
          successText={(body) => `Created eval suite ${body?.resource?.metadata?.name || ''}`}
        />
      </section>
    </div>
  );
}
