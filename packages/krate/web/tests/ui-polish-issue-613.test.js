import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readComponent(...parts) {
  return fs.readFileSync(path.join(webRoot, 'app', 'components', ...parts), 'utf8');
}

test('issue #613 dynamic lists avoid array index React keys', () => {
  const files = [
    ['agent', 'session-cost.jsx'],
    ['external', 'external-conflict-resolver.jsx'],
    ['inference', 'inference-service-list.jsx'],
    ['inference', 'virtual-model-manager.jsx'],
    ['settings', 'secret-manager.jsx'],
  ];

  for (const parts of files) {
    const source = readComponent(...parts);
    assert.doesNotMatch(
      source,
      /key=\{(?:i|idx|rIdx|cIdx)\}/,
      `${parts.join('/')} must not key dynamic rows by array index`,
    );
  }
});

test('issue #613 editable local rows use generated immutable row ids', () => {
  const secrets = readComponent('settings', 'secret-manager.jsx');
  assert.match(secrets, /function createKvPair\(/, 'secret-manager must create immutable ids for key-value rows');
  assert.match(secrets, /key=\{pair\.id\}/, 'secret-manager must key key-value rows by pair.id');

  const virtualModels = readComponent('inference', 'virtual-model-manager.jsx');
  assert.match(virtualModels, /function createLocalRowId\(/, 'virtual-model-manager must generate local row ids');
  for (const keyExpr of ['route.__rowId', 'ref.__rowId', 'rule.__rowId', 'cond.__rowId']) {
    assert.ok(
      virtualModels.includes(`key={${keyExpr}}`),
      `virtual-model-manager must key mutable row by ${keyExpr}`,
    );
  }
});

test('issue #613 server and history rows use stable domain keys', () => {
  const sessionCost = readComponent('agent', 'session-cost.jsx');
  assert.match(sessionCost, /function turnCostKey\(/, 'session-cost must use a stable turn key helper');
  assert.match(sessionCost, /key=\{turnCostKey\(turn\)\}/, 'session cost rows must use turnCostKey(turn)');

  const conflicts = readComponent('external', 'external-conflict-resolver.jsx');
  assert.match(conflicts, /function resolvedConflictKey\(/, 'conflict history must use a stable key helper');
  assert.match(conflicts, /key=\{resolvedConflictKey\(entry\)\}/, 'resolved conflicts must use resolvedConflictKey(entry)');

  const services = readComponent('inference', 'inference-service-list.jsx');
  assert.match(services, /function serviceConditionKey\(/, 'service conditions must use a stable key helper');
  assert.match(services, /key=\{serviceConditionKey\(c\)\}/, 'service conditions must use serviceConditionKey(c)');
});

test('issue #613 approval mode radiogroup supports arrow and Home/End keys', () => {
  const source = readComponent('agent', 'approval-mode-toggle.jsx');
  assert.match(source, /function handleKeyDown\(/, 'ApprovalModeToggle must define a keyboard handler');
  assert.match(source, /onKeyDown=\{handleKeyDown\}/, 'radiogroup buttons must wire the keyboard handler');
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
    assert.ok(source.includes(`'${key}'`), `ApprovalModeToggle must handle ${key}`);
  }
});

test('issue #613 curated deploy route failures remain user-visible', () => {
  const source = readComponent('inference', 'curated-model-catalog.jsx');
  assert.match(source, /routeWarning/, 'route creation failures must be stored in deploy result state');
  assert.match(
    source,
    /Service deployment started, but the model route was not created/,
    'route creation failure must render user-visible partial-success copy',
  );
  assert.doesNotMatch(
    source,
    /fetch\(`\/api\/orgs\/\$\{org\}\/inference\/routes`[\s\S]{0,500}\.catch\(\(err\)\s*=>\s*console\.warn/,
    'route creation failure must not be handled only by console.warn',
  );
});

test('issue #613 touched approval control uses theme tokens for common UI colors', () => {
  const source = readComponent('agent', 'approval-mode-toggle.jsx');
  for (const token of ['var(--success)', 'var(--warning)', 'var(--danger)', 'var(--bg-subtle)', 'var(--border)', 'var(--text-muted)']) {
    assert.ok(source.includes(token), `ApprovalModeToggle should use ${token}`);
  }
  for (const raw of ['#22c55e', '#f59e0b', '#f0fdf4', '#fffbeb', '#fef2f2', '#d1d5db', '#6b7280', '#f8fafc', '#e2e8f0']) {
    assert.ok(!source.includes(raw), `ApprovalModeToggle should not keep common raw color ${raw}`);
  }
});
