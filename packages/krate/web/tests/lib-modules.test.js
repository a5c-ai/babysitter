/**
 * Lib module tests -- verify exports and basic behavior of pure utility
 * modules under app/lib/ and app/hooks/.
 *
 * These tests run in Node.js without Next.js or React.  JSX/React modules
 * are verified via source-text inspection (they cannot be imported in raw Node).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readSrc(...parts) {
  return fs.readFileSync(path.join(webRoot, ...parts), 'utf8');
}

// ---------------------------------------------------------------------------
// fetch-dedup.js
// ---------------------------------------------------------------------------

test('fetch-dedup.js exports dedupFetch', async () => {
  const { dedupFetch } = await import('../app/lib/fetch-dedup.js');
  assert.equal(typeof dedupFetch, 'function');
});

// ---------------------------------------------------------------------------
// agent-utils.js
// ---------------------------------------------------------------------------

test('agent-utils.js exports phaseTone', async () => {
  const mod = await import('../app/lib/agent-utils.js');
  assert.equal(typeof mod.phaseTone, 'function');
});

test('agent-utils.js exports relativeTime', async () => {
  const mod = await import('../app/lib/agent-utils.js');
  assert.equal(typeof mod.relativeTime, 'function');
});

test('agent-utils.js exports deriveSegments', async () => {
  const mod = await import('../app/lib/agent-utils.js');
  assert.equal(typeof mod.deriveSegments, 'function');
});

test('phaseTone returns expected tones', async () => {
  const { phaseTone } = await import('../app/lib/agent-utils.js');
  assert.equal(phaseTone('Active'), 'warn');
  assert.equal(phaseTone('Running'), 'warn');
  assert.equal(phaseTone('Completed'), 'good');
  assert.equal(phaseTone('Succeeded'), 'good');
  assert.equal(phaseTone('Failed'), 'danger');
  assert.equal(phaseTone('Errored'), 'danger');
  assert.equal(phaseTone('Queued'), 'neutral');
  assert.equal(phaseTone(null), 'neutral');
  assert.equal(phaseTone('Archived'), 'neutral');
  assert.equal(phaseTone('SomeUnknown'), 'neutral');
});

test('relativeTime returns empty string for falsy input', async () => {
  const { relativeTime } = await import('../app/lib/agent-utils.js');
  assert.equal(relativeTime(null), '');
  assert.equal(relativeTime(undefined), '');
  assert.equal(relativeTime(''), '');
});

test('deriveSegments returns empty array for empty input', async () => {
  const { deriveSegments } = await import('../app/lib/agent-utils.js');
  assert.deepEqual(deriveSegments([]), []);
  assert.deepEqual(deriveSegments(null), []);
});

test('deriveSegments groups consecutive messages of the same kind', async () => {
  const { deriveSegments } = await import('../app/lib/agent-utils.js');
  const messages = [
    { role: 'user' },
    { role: 'user' },
    { role: 'assistant' },
    { role: 'tool' },
    { role: 'tool' },
    { role: 'tool' },
    { role: 'assistant' },
  ];
  const segments = deriveSegments(messages);
  assert.equal(segments.length, 4);
  assert.deepEqual(segments[0], { kind: 'user', count: 2 });
  assert.deepEqual(segments[1], { kind: 'assistant', count: 1 });
  assert.deepEqual(segments[2], { kind: 'tool', count: 3 });
  assert.deepEqual(segments[3], { kind: 'assistant', count: 1 });
});

// ---------------------------------------------------------------------------
// agent-identity.js
// ---------------------------------------------------------------------------

test('agent-identity.js resolves profiles from grouped model resources', async () => {
  const { buildAgentIdentityProfiles } = await import('../app/lib/agent-identity.js');
  const profiles = buildAgentIdentityProfiles({
    resources: [
      { kind: 'AgentPersona', items: [{ kind: 'AgentPersona', metadata: { name: 'aria' }, spec: { organizationRef: 'default', displayName: 'Aria', role: { title: 'Reviewer' }, soul: { ref: 'aria-soul' }, appearance: { ref: 'aria-appearance' }, voiceProfile: { ref: 'aria-voice' } } }] },
      { kind: 'AgentSoul', items: [{ kind: 'AgentSoul', metadata: { name: 'aria-soul' }, spec: { organizationRef: 'default', content: 'Soul' } }] },
      { kind: 'AgentAppearance', items: [{ kind: 'AgentAppearance', metadata: { name: 'aria-appearance' }, spec: { organizationRef: 'default', avatar: { type: 'initials', fallbackInitials: 'AR' } } }] },
      { kind: 'AgentVoiceProfile', items: [{ kind: 'AgentVoiceProfile', metadata: { name: 'aria-voice' }, spec: { organizationRef: 'default', ttsProvider: 'openai' } }] },
      { kind: 'AgentDefinition', items: [{ kind: 'AgentDefinition', metadata: { name: 'aria-reviewer' }, spec: { organizationRef: 'default', personaRef: 'aria', stackRef: 'review-stack' } }] },
      { kind: 'AgentStack', items: [{ kind: 'AgentStack', metadata: { name: 'review-stack' }, spec: { organizationRef: 'default', displayName: 'Review stack' } }] },
    ],
  });
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].displayName, 'Aria');
  assert.equal(profiles[0].definitions[0].metadata.name, 'aria-reviewer');
  assert.equal(profiles[0].stacks[0].metadata.name, 'review-stack');
});

test('agent-identity.js resolves profiles from kind-keyed resource maps', async () => {
  const { buildAgentIdentityProfiles, resolveAgentIdentityForRef } = await import('../app/lib/agent-identity.js');
  const resources = {
    AgentPersona: [{ kind: 'AgentPersona', metadata: { name: 'aria' }, spec: { organizationRef: 'default', displayName: 'Aria', role: { title: 'Reviewer' } } }],
    AgentDefinition: [{ kind: 'AgentDefinition', metadata: { name: 'aria-reviewer' }, spec: { organizationRef: 'default', personaRef: 'aria', stackRef: 'review-stack' } }],
    AgentStack: [{ kind: 'AgentStack', metadata: { name: 'legacy-stack' }, spec: { organizationRef: 'default', displayName: 'Legacy Stack' } }],
  };
  const profiles = buildAgentIdentityProfiles(resources);
  assert.equal(profiles.length, 1);
  assert.equal(resolveAgentIdentityForRef('aria-reviewer', resources).displayName, 'Aria');
  assert.equal(resolveAgentIdentityForRef('legacy-stack', resources).fallback, true);
});

// ---------------------------------------------------------------------------
// model-catalog-data.js
// ---------------------------------------------------------------------------

test('model-catalog-data.js exports CURATED_MODELS as non-empty array', async () => {
  const { CURATED_MODELS } = await import('../app/lib/model-catalog-data.js');
  assert.ok(Array.isArray(CURATED_MODELS), 'CURATED_MODELS must be an array');
  assert.ok(CURATED_MODELS.length > 0, 'CURATED_MODELS must not be empty');
});

test('model-catalog-data.js exports MODEL_CATEGORIES as non-empty array', async () => {
  const { MODEL_CATEGORIES } = await import('../app/lib/model-catalog-data.js');
  assert.ok(Array.isArray(MODEL_CATEGORIES), 'MODEL_CATEGORIES must be an array');
  assert.ok(MODEL_CATEGORIES.length > 0, 'MODEL_CATEGORIES must not be empty');
});

test('every curated model has required fields', async () => {
  const { CURATED_MODELS } = await import('../app/lib/model-catalog-data.js');
  for (const model of CURATED_MODELS) {
    assert.ok(model.id, `model missing id: ${JSON.stringify(model)}`);
    assert.ok(model.name, `model ${model.id} missing name`);
    assert.ok(model.category, `model ${model.id} missing category`);
    assert.ok(model.storageUri, `model ${model.id} missing storageUri`);
  }
});

// ---------------------------------------------------------------------------
// krate-ui.jsx (source inspection -- cannot import JSX in raw Node)
// ---------------------------------------------------------------------------

const krateUiSrc = readSrc('app', 'lib', 'krate-ui.jsx');

test('krate-ui.jsx exports loadKrateUi', () => {
  assert.match(krateUiSrc, /export\s+async\s+function\s+loadKrateUi/);
});

test('krate-ui.jsx exports orgHref', () => {
  assert.match(krateUiSrc, /export\s+function\s+orgHref/);
});

test('krate-ui.jsx exports StatusPill component', () => {
  assert.match(krateUiSrc, /export\s+function\s+StatusPill/);
});

test('krate-ui.jsx exports DegradedBanner component', () => {
  assert.match(krateUiSrc, /export\s+function\s+DegradedBanner/);
});

// ---------------------------------------------------------------------------
// page-frame.jsx (source inspection)
// ---------------------------------------------------------------------------

const pageFrameSrc = readSrc('app', 'lib', 'page-frame.jsx');

test('page-frame.jsx exports AppShell', () => {
  assert.match(pageFrameSrc, /export\s+function\s+AppShell/);
});

test('page-frame.jsx exports PageFrame', () => {
  assert.match(pageFrameSrc, /export\s+async\s+function\s+PageFrame/);
});

// ---------------------------------------------------------------------------
// hooks (source inspection -- React hooks cannot run in raw Node)
// ---------------------------------------------------------------------------

test('use-unsaved-changes.js exports useUnsavedChanges', () => {
  const src = readSrc('app', 'hooks', 'use-unsaved-changes.js');
  assert.match(src, /export\s+function\s+useUnsavedChanges/);
});

test('use-debounce.js exports useDebounce', () => {
  const src = readSrc('app', 'hooks', 'use-debounce.js');
  assert.match(src, /export\s+function\s+useDebounce/);
});

// ---------------------------------------------------------------------------
// No side effects at module level
// ---------------------------------------------------------------------------

test('agent-utils.js has no console.log at module level', () => {
  const src = readSrc('app', 'lib', 'agent-utils.js');
  // Look for bare console.log (not inside a function body).  Heuristic:
  // Lines that start with console.log at indentation 0.
  const topLevel = src.split('\n').filter((l) => /^console\.(log|warn|error)\b/.test(l.trim()) && !l.startsWith(' ') && !l.startsWith('\t'));
  assert.deepEqual(topLevel, [], 'agent-utils.js should not have top-level console calls');
});

test('fetch-dedup.js has no console.log at module level', () => {
  const src = readSrc('app', 'lib', 'fetch-dedup.js');
  const topLevel = src.split('\n').filter((l) => /^console\.(log|warn|error)\b/.test(l.trim()) && !l.startsWith(' ') && !l.startsWith('\t'));
  assert.deepEqual(topLevel, [], 'fetch-dedup.js should not have top-level console calls');
});

test('model-catalog-data.js has no console.log at module level', () => {
  const src = readSrc('app', 'lib', 'model-catalog-data.js');
  const topLevel = src.split('\n').filter((l) => /^console\.(log|warn|error)\b/.test(l.trim()) && !l.startsWith(' ') && !l.startsWith('\t'));
  assert.deepEqual(topLevel, [], 'model-catalog-data.js should not have top-level console calls');
});
