'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InlineCreateForm } from '../resource-crud-actions.jsx';

const cardStyle = { padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-card, var(--bg-subtle))' };
const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'rgba(34,197,94,0.12)' : tone === 'warn' ? 'rgba(234,179,8,0.12)' : tone === 'danger' ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)', color: tone === 'good' ? '#16a34a' : tone === 'warn' ? '#ca8a04' : tone === 'danger' ? '#dc2626' : '#6b7280' });

const RULE_TYPE_LABELS = {
  'content-filter': 'Content filter',
  'budget-limit': 'Budget limit',
  'token-limit': 'Token limit',
  'pii-detection': 'PII detection',
  'tool-restriction': 'Tool restriction'
};

const RULE_TYPE_TONES = {
  'content-filter': 'danger',
  'budget-limit': 'warn',
  'token-limit': 'warn',
  'pii-detection': 'danger',
  'tool-restriction': 'neutral'
};

export function GuardrailManager({ org, guardrails: initialGuardrails = [], events: initialEvents = [] }) {
  const router = useRouter();
  const [guardrails, setGuardrails] = useState(initialGuardrails);
  const events = initialEvents;

  function handleCreated(body) {
    const item = body?.items?.[0] || body?.resource || body;
    if (item?.metadata?.name) setGuardrails((prev) => [...prev, item]);
    else router.refresh();
  }

  // Count events per guardrail
  const eventCounts = new Map();
  for (const event of events) {
    const ref = event.spec?.guardrailRef || 'unknown';
    eventCounts.set(ref, (eventCounts.get(ref) || 0) + 1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Guardrails</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{guardrails.length} active rules</p>
            </div>
          </div>

          {guardrails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No guardrails configured. Create safety rules to protect agent behavior.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {guardrails.map((guardrail) => {
                const name = guardrail.metadata?.name || 'unnamed';
                const ruleType = guardrail.spec?.ruleType || 'content-filter';
                const count = eventCounts.get(name) || 0;
                const isEnabled = guardrail.spec?.enabled !== false;
                return (
                  <a key={name} href={`guardrails/${name}`} style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', cursor: 'pointer', opacity: isEnabled ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{guardrail.spec?.displayName || name}</h4>
                      <span style={pillStyle(RULE_TYPE_TONES[ruleType] || 'neutral')}>{RULE_TYPE_LABELS[ruleType] || ruleType}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <span>Action: <strong>{guardrail.spec?.action || 'block'}</strong></span>
                      <span>Scope: <strong>{guardrail.spec?.scope || 'global'}</strong></span>
                    </div>
                    {count > 0 && (
                      <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem' }}>
                        <span style={pillStyle('warn')}>{count} activations</span>
                      </p>
                    )}
                    {!isEnabled && (
                      <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disabled</p>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <InlineCreateForm
          org={org}
          kind="Guardrail"
          title="Create guardrail"
          fields={[
            { name: 'name', label: 'Name', placeholder: 'my-guardrail' },
            { name: 'displayName', label: 'Display name', placeholder: 'Content Safety Filter' },
            { name: 'ruleType', label: 'Rule type', type: 'select', options: [
              { value: 'content-filter', label: 'Content filter' },
              { value: 'budget-limit', label: 'Budget limit' },
              { value: 'token-limit', label: 'Token limit' },
              { value: 'pii-detection', label: 'PII detection' },
              { value: 'tool-restriction', label: 'Tool restriction' }
            ]},
            { name: 'action', label: 'Action', type: 'select', defaultValue: 'block', options: [
              { value: 'block', label: 'Block' },
              { value: 'warn', label: 'Warn' },
              { value: 'log', label: 'Log only' }
            ]},
            { name: 'scope', label: 'Scope', type: 'select', defaultValue: 'global', options: [
              { value: 'global', label: 'Global (all stacks)' },
              { value: 'stack', label: 'Per-stack' }
            ]}
          ]}
          buildSpec={(fd) => ({
            displayName: fd.get('displayName'),
            ruleType: fd.get('ruleType'),
            action: fd.get('action') || 'block',
            scope: fd.get('scope') || 'global',
            enabled: true,
            conditions: {}
          })}
          successText={(body) => `Created guardrail ${body?.resource?.metadata?.name || ''}`}
        />
      </section>
    </div>
  );
}
