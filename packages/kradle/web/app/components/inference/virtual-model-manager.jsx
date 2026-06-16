'use client';

import { useState, memo } from 'react';
import {
  relativeTime,
  cardStyle, btnStyle, btnOutlineStyle, inputStyle, labelStyle, badgeStyle,
} from './inference-helpers.jsx';

let localRowCounter = 0;

function createLocalRowId(prefix = 'row') {
  localRowCounter += 1;
  return `${prefix}-${localRowCounter}`;
}

function createRouteRow() {
  return { __rowId: createLocalRowId('route'), modelRouteRef: '', weight: 1, priority: 0 };
}

function createFallbackRow() {
  return { __rowId: createLocalRowId('fallback'), modelRouteRef: '' };
}

function createConditionRow() {
  return { __rowId: createLocalRowId('condition'), field: '', operator: 'eq', value: '' };
}

function createRuleRow() {
  return { __rowId: createLocalRowId('rule'), name: '', conditions: [createConditionRow()], action: { route: '' } };
}

// ─── Virtual Model Card ─────────────────────────────────────────────────────

export const VirtualModelCard = memo(function VirtualModelCard({ vm, onDelete }) {
  const name = vm.metadata?.name || vm.name || 'unknown';
  const spec = vm.spec || {};
  const modelName = spec.modelName || name;
  const routeCount = spec.routes?.length || 0;
  const rulesCount = spec.rules?.length || 0;
  const hasHooks = !!spec.hooks;
  const sessionEnabled = !!spec.sessionConfig?.enabled;
  const enabled = spec.enabled !== false;
  const createdAt = vm.metadata?.creationTimestamp;

  return (
    <div style={{ ...cardStyle, opacity: enabled ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{name}</span>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <span style={badgeStyle('#a9bf57')}>{routeCount} route{routeCount !== 1 ? 's' : ''}</span>
          {rulesCount > 0 && <span style={badgeStyle('var(--accent)')}>{rulesCount} rule{rulesCount !== 1 ? 's' : ''}</span>}
          {hasHooks && <span style={badgeStyle('var(--warning)')}>hooks</span>}
          {sessionEnabled && <span style={badgeStyle('var(--info)')}>session</span>}
          {!enabled && <span style={badgeStyle('var(--text-muted)')}>disabled</span>}
        </div>
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
        Model: <strong>{modelName}</strong>
      </div>
      {spec.fallbackChain?.length > 0 && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Fallback: {spec.fallbackChain.join(' > ')}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{createdAt ? relativeTime(createdAt) : ''}</span>
        <button style={btnStyle('var(--danger)')} onClick={() => onDelete(vm)} aria-label={`Delete virtual model ${name}`}>Delete</button>
      </div>
    </div>
  );
});

// ─── Collapsible Section ────────────────────────────────────────────────────

export function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title} section`}
        style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}
      >
        {title}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{open ? 'collapse' : 'expand'}</span>
      </button>
      {open && <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{children}</div>}
    </div>
  );
}

// ─── Create Virtual Model Form ──────────────────────────────────────────────

export function CreateVirtualModelForm({ routes: availableRoutes, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() => ({
    modelName: '',
    routes: [createRouteRow()],
    fallbackChain: [],
    rules: [],
    hooks: { routeSelect: '', requestTransform: '', responseTransform: '', sessionLifecycle: '', observe: '', onSessionStart: '', onSessionEnd: '', onTurnEnd: '', onPreToolUse: '', onPostToolUse: '', onUserPromptSubmit: '', onError: '', onCompact: '' },
    sessionEnabled: false,
    maxTurns: 10,
    escalationThreshold: 100000,
  }));

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  // Route management
  const addRoute = () => setForm(f => ({ ...f, routes: [...f.routes, createRouteRow()] }));
  const removeRoute = (idx) => setForm(f => ({ ...f, routes: f.routes.filter((_, i) => i !== idx) }));
  const updateRoute = (idx, field, value) => setForm(f => ({
    ...f,
    routes: f.routes.map((r, i) => i === idx ? { ...r, [field]: value } : r),
  }));

  // Fallback chain management
  const addFallback = () => setForm(f => ({ ...f, fallbackChain: [...f.fallbackChain, createFallbackRow()] }));
  const removeFallback = (idx) => setForm(f => ({ ...f, fallbackChain: f.fallbackChain.filter((_, i) => i !== idx) }));
  const updateFallback = (idx, value) => setForm(f => ({
    ...f,
    fallbackChain: f.fallbackChain.map((v, i) => i === idx ? { ...v, modelRouteRef: value } : v),
  }));

  // Rules management
  const addRule = () => setForm(f => ({
    ...f,
    rules: [...f.rules, createRuleRow()],
  }));
  const removeRule = (idx) => setForm(f => ({ ...f, rules: f.rules.filter((_, i) => i !== idx) }));
  const updateRule = (idx, path, value) => setForm(f => {
    const rules = [...f.rules];
    const rule = { ...rules[idx] };
    if (path === 'name') rule.name = value;
    else if (path === 'action.route') rule.action = { ...rule.action, route: value };
    rules[idx] = rule;
    return { ...f, rules };
  });
  const addCondition = (ruleIdx) => setForm(f => {
    const rules = [...f.rules];
    rules[ruleIdx] = { ...rules[ruleIdx], conditions: [...rules[ruleIdx].conditions, createConditionRow()] };
    return { ...f, rules };
  });
  const removeCondition = (ruleIdx, condIdx) => setForm(f => {
    const rules = [...f.rules];
    rules[ruleIdx] = { ...rules[ruleIdx], conditions: rules[ruleIdx].conditions.filter((_, i) => i !== condIdx) };
    return { ...f, rules };
  });
  const updateCondition = (ruleIdx, condIdx, field, value) => setForm(f => {
    const rules = [...f.rules];
    const conditions = [...rules[ruleIdx].conditions];
    conditions[condIdx] = { ...conditions[condIdx], [field]: value };
    rules[ruleIdx] = { ...rules[ruleIdx], conditions };
    return { ...f, rules };
  });

  // Hooks management
  const updateHook = (hookName, value) => setForm(f => ({
    ...f,
    hooks: { ...f.hooks, [hookName]: value },
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = {
      modelName: form.modelName,
      routes: form.routes.filter(r => r.modelRouteRef).map(r => ({
        modelRouteRef: r.modelRouteRef,
        weight: Number(r.weight) || 1,
        priority: Number(r.priority) || 0,
      })),
    };
    const fallbackRefs = form.fallbackChain.map(r => r.modelRouteRef).filter(Boolean);
    if (fallbackRefs.length > 0) {
      body.fallbackChain = fallbackRefs;
    }
    if (form.rules.length > 0) {
      body.rules = form.rules.filter(r => r.name && r.conditions.length > 0).map(r => ({
        name: r.name,
        conditions: r.conditions.filter(c => c.field && c.operator).map(c => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
        action: r.action,
      }));
    }
    const activeHooks = {};
    for (const [k, v] of Object.entries(form.hooks)) {
      if (v.trim()) activeHooks[k] = v.trim();
    }
    if (Object.keys(activeHooks).length > 0) {
      body.hooks = activeHooks;
    }
    if (form.sessionEnabled) {
      body.sessionConfig = {
        enabled: true,
        maxTurns: Number(form.maxTurns) || 10,
        escalationThreshold: Number(form.escalationThreshold) || 100000,
      };
    }
    onSubmit(body);
  };

  const routeOptions = (availableRoutes || []).map(r => r.metadata?.name || r.name).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Model Name *</label>
        <input style={inputStyle} value={form.modelName} onChange={setField('modelName')} required placeholder="smart-router" />
      </div>

      {/* Routes */}
      <div>
        <label style={labelStyle}>Routes *</label>
        {form.routes.map((route, idx) => (
          <div key={route.__rowId} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem', alignItems: 'center' }}>
            <select style={{ ...inputStyle, flex: 2 }} value={route.modelRouteRef} onChange={(e) => updateRoute(idx, 'modelRouteRef', e.target.value)} required>
              <option value="">Select route...</option>
              {routeOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" value={route.weight} onChange={(e) => updateRoute(idx, 'weight', e.target.value)} placeholder="Weight" title="Weight" aria-label={`Weight for route ${route.modelRouteRef || idx + 1}`} />
            <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" value={route.priority} onChange={(e) => updateRoute(idx, 'priority', e.target.value)} placeholder="Priority" title="Priority" aria-label={`Priority for route ${route.modelRouteRef || idx + 1}`} />
            {form.routes.length > 1 && (
              <button type="button" style={{ ...btnStyle('var(--danger)'), padding: '0.375rem 0.5rem', fontSize: '0.75rem' }} onClick={() => removeRoute(idx)} aria-label={`Remove route ${route.modelRouteRef || idx + 1}`}>X</button>
            )}
          </div>
        ))}
        <button type="button" style={{ ...btnOutlineStyle, fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={addRoute}>+ Add Route</button>
      </div>

      {/* Fallback Chain */}
      <div>
        <label style={labelStyle}>Fallback Chain</label>
        {form.fallbackChain.map((ref, idx) => (
          <div key={ref.__rowId} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem', alignItems: 'center' }}>
            <select style={{ ...inputStyle, flex: 1 }} value={ref.modelRouteRef} onChange={(e) => updateFallback(idx, e.target.value)}>
              <option value="">Select fallback...</option>
              {routeOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button type="button" style={{ ...btnStyle('var(--danger)'), padding: '0.375rem 0.5rem', fontSize: '0.75rem' }} onClick={() => removeFallback(idx)}>X</button>
          </div>
        ))}
        <button type="button" style={{ ...btnOutlineStyle, fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={addFallback}>+ Add Fallback</button>
      </div>

      {/* Rules */}
      <CollapsibleSection title={`Rules (${form.rules.length})`}>
        {form.rules.map((rule, rIdx) => (
          <div key={rule.__rowId} style={{ ...cardStyle, padding: '0.75rem', background: 'var(--surface-raised)' }}>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem' }}>
              <input style={{ ...inputStyle, flex: 2 }} value={rule.name} onChange={(e) => updateRule(rIdx, 'name', e.target.value)} placeholder="Rule name" aria-label={`Rule ${rIdx + 1} name`} />
              <select style={{ ...inputStyle, flex: 2 }} value={rule.action.route} onChange={(e) => updateRule(rIdx, 'action.route', e.target.value)}>
                <option value="">Action route...</option>
                {routeOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button type="button" style={{ ...btnStyle('var(--danger)'), padding: '0.375rem 0.5rem', fontSize: '0.75rem' }} onClick={() => removeRule(rIdx)}>X</button>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Conditions:</div>
            {rule.conditions.map((cond, cIdx) => (
              <div key={cond.__rowId} style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem', alignItems: 'center' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={cond.field} onChange={(e) => updateCondition(rIdx, cIdx, 'field', e.target.value)} placeholder="field" aria-label={`Rule ${rIdx + 1} condition ${cIdx + 1} field`} />
                <select style={{ ...inputStyle, flex: 1 }} value={cond.operator} onChange={(e) => updateCondition(rIdx, cIdx, 'operator', e.target.value)}>
                  {['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'contains', 'matches'].map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input style={{ ...inputStyle, flex: 1 }} value={cond.value} onChange={(e) => updateCondition(rIdx, cIdx, 'value', e.target.value)} placeholder="value" aria-label={`Rule ${rIdx + 1} condition ${cIdx + 1} value`} />
                {rule.conditions.length > 1 && (
                  <button type="button" style={{ ...btnStyle('var(--danger)'), padding: '0.25rem 0.375rem', fontSize: '0.6875rem' }} onClick={() => removeCondition(rIdx, cIdx)}>X</button>
                )}
              </div>
            ))}
            <button type="button" style={{ ...btnOutlineStyle, fontSize: '0.6875rem', padding: '0.2rem 0.375rem' }} onClick={() => addCondition(rIdx)}>+ Condition</button>
          </div>
        ))}
        <button type="button" style={{ ...btnOutlineStyle, fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={addRule}>+ Add Rule</button>
      </CollapsibleSection>

      {/* Hooks */}
      <CollapsibleSection title="Routing & Transform Hooks">
        {[
          ['routeSelect', 'return args.routes[0].modelRouteRef; // pick route from args.requestContext'],
          ['requestTransform', 'return args.request; // modify prompt before sending'],
          ['responseTransform', 'return args.response; // filter response before returning'],
          ['observe', '// emit: args.event, args.metrics, context.modelName'],
        ].map(([hookName, placeholder]) => (
          <div key={hookName}>
            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>{hookName}</label>
            <textarea
              style={{ ...inputStyle, height: '3.5rem', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
              value={form.hooks[hookName]}
              onChange={(e) => updateHook(hookName, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
      </CollapsibleSection>
      <CollapsibleSection title="Agentic Lifecycle Hooks">
        {[
          ['onSessionStart', '// args.session — fired when agent session begins'],
          ['onSessionEnd', '// args.session — fired when agent session ends'],
          ['onTurnEnd', 'return { action: "continue" }; // args.turn, args.session — after each assistant turn'],
          ['onPreToolUse', 'return { allow: true }; // args.toolCall, args.session — gate tool calls'],
          ['onPostToolUse', 'return { modified: null }; // args.toolCall, args.result, args.session'],
          ['onUserPromptSubmit', 'return { block: false }; // args.prompt, args.session — gate user input'],
          ['onError', 'return { retry: false, fallbackRoute: null }; // args.error, args.session'],
          ['onCompact', 'return { modified: null }; // args.summary, args.session — modify compaction'],
          ['sessionLifecycle', 'return { action: "continue" }; // args.event, args.session — general lifecycle'],
        ].map(([hookName, placeholder]) => (
          <div key={hookName}>
            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>{hookName}</label>
            <textarea
              style={{ ...inputStyle, height: '3.5rem', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
              value={form.hooks[hookName]}
              onChange={(e) => updateHook(hookName, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
      </CollapsibleSection>

      {/* Session Config */}
      <div>
        <label style={labelStyle}>Session Config</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <input type="checkbox" id="sessionEnabled" checked={form.sessionEnabled} onChange={setField('sessionEnabled')} />
          <label htmlFor="sessionEnabled" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Enable session management</label>
        </div>
        {form.sessionEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Max Turns</label>
              <input style={inputStyle} type="number" min="1" value={form.maxTurns} onChange={setField('maxTurns')} />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Escalation Threshold</label>
              <input style={inputStyle} type="number" min="1" value={form.escalationThreshold} onChange={setField('escalationThreshold')} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button type="submit" style={btnStyle()} disabled={loading} aria-label={form.modelName ? `Create virtual model ${form.modelName}` : 'Create new virtual model'}>{loading ? 'Creating...' : 'Create Virtual Model'}</button>
        <button type="button" style={btnOutlineStyle} onClick={onCancel} aria-label="Cancel creating virtual model">Cancel</button>
      </div>
    </form>
  );
}
