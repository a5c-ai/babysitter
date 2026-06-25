/**
 * Stack Builder — Meeting / Video (G14) spec mapping + G9 validator round-trip.
 *
 * Verifies the PURE buildStackResource(...) (exported from
 * app/components/agent/stack-builder-graph-styles.jsx) emits the correct
 * spec.jitsiCapability / spec.jitsiConfig per modality, then feeds the emitted
 * spec through the REAL createAgentStackController().reconcileStack(...) from
 * @a5c-ai/kradle core to prove JitsiCapabilityReady === 'True' for a valid
 * stack and 'False' for invalid permutations.
 *
 * node --test cannot import a `.jsx` file directly (Unknown file extension),
 * and the suite has no transpiler / no npm install allowed. The -styles.jsx
 * module is pure JS (no imports, no JSX in buildStackResource) carrying only a
 * `'use client'` directive, so we load it by reading its source and importing
 * it via a base64 data: URL — no build step, no loader, no new deps.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAgentStackController } from '@a5c-ai/kradle';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylesPath = path.join(webRoot, 'app', 'components', 'agent', 'stack-builder-graph-styles.jsx');
const stylesSrc = fs.readFileSync(stylesPath, 'utf8');
const stylesUrl = 'data:text/javascript;base64,' + Buffer.from(stylesSrc, 'utf8').toString('base64');
const { buildStackResource, JITSI_VIDEO_TOOLS, JITSI_GOVERNED_DEFAULTS, JITSI_AUDIO_TOOLS } = await import(stylesUrl);

function emptySelections() {
  return {};
}

const base = {
  name: 'a', org: 'o', serviceAccount: 'sa-1',
  selections: emptySelections(), selectedMemoryRepos: [], selectedInference: null,
};

// Resources map that satisfies every non-jitsi condition so JitsiCapabilityReady
// is isolated. The service account ref must resolve for RuntimeIdentityReady.
function resources({ provider = true, appearance = true } = {}) {
  return {
    AgentServiceAccount: [{ metadata: { name: 'sa-1' } }],
    ...(provider ? { JitsiMeetProvider: [{ metadata: { name: 'jitsi-prod' } }] } : {}),
    ...(appearance ? { AgentAppearance: [{ metadata: { name: 'nova-look' } }] } : {}),
  };
}

function jitsiCondition(stack, res) {
  const ctrl = createAgentStackController();
  const out = ctrl.reconcileStack(stack, res);
  return out.conditions.find((c) => c.type === 'JitsiCapabilityReady');
}

// ── Pure spec mapping ───────────────────────────────────────────────────────

test('video OFF → no jitsi fields (spec unchanged)', () => {
  const r = buildStackResource({ ...base, meeting: { enabled: false } });
  assert.equal(r.spec.jitsiCapability, undefined);
  assert.equal(r.spec.jitsiConfig, undefined);
  assert.equal(r.spec.jitsiMeetingProviderRef, undefined);
});

test('no meeting arg at all → no jitsi fields', () => {
  const r = buildStackResource({ ...base });
  assert.equal(r.spec.jitsiCapability, undefined);
  assert.equal(r.spec.jitsiConfig, undefined);
});

test('voice mode → audio capability only, NO video, NO avatarRef', () => {
  const r = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'voice', providerRef: 'jitsi-prod', role: 'agent', audioMode: 'speak',
  } });
  assert.equal(r.spec.jitsiCapability, true);
  assert.equal(r.spec.jitsiConfig.capabilities.audio, 'speak');
  assert.equal(r.spec.jitsiConfig.capabilities.video, undefined);
  assert.equal(r.spec.jitsiConfig.avatarRef, undefined);
  // voice gets audio tools, not video tools
  assert.ok(!r.spec.jitsiConfig.tools.includes('kradle_publish_video'));
});

test('video mode → full jitsiConfig with video:publish + avatarRef + video tools', () => {
  const r = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', providerRef: 'jitsi-prod', role: 'agent',
    audioMode: 'speak', videoPublish: true, avatarRef: 'nova-look', voiceProfileRef: 'nova-voice',
    tools: JITSI_VIDEO_TOOLS, governedTools: JITSI_GOVERNED_DEFAULTS,
  } });
  assert.equal(r.spec.jitsiCapability, true);
  assert.equal(r.spec.jitsiMeetingProviderRef, 'jitsi-prod');
  assert.equal(r.spec.jitsiConfig.role, 'agent');
  assert.equal(r.spec.jitsiConfig.capabilities.video, 'publish');
  assert.equal(r.spec.jitsiConfig.capabilities.audio, 'speak');
  assert.equal(r.spec.jitsiConfig.avatarRef, 'nova-look');
  assert.equal(r.spec.jitsiConfig.voiceProfileRef, 'nova-voice');
  assert.ok(r.spec.jitsiConfig.tools.includes('kradle_publish_video'));
  // governedTools ⊆ tools (the G9 invariant)
  for (const t of r.spec.jitsiConfig.governedTools) {
    assert.ok(r.spec.jitsiConfig.tools.includes(t), `governedTool ${t} must be in tools`);
  }
});

test('video defaults (no explicit tools) still emit governedTools ⊆ tools', () => {
  const r = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', providerRef: 'jitsi-prod', role: 'agent',
    audioMode: 'speak', avatarRef: 'nova-look',
  } });
  assert.ok(r.spec.jitsiConfig.tools.length > 0);
  for (const t of r.spec.jitsiConfig.governedTools) {
    assert.ok(r.spec.jitsiConfig.tools.includes(t));
  }
});

// ── Real validator round-trip (the high-value closing-the-loop test) ────────

test('video spec passes real reconcileStack → JitsiCapabilityReady True', () => {
  const stack = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', providerRef: 'jitsi-prod', role: 'agent',
    audioMode: 'speak', videoPublish: true, avatarRef: 'nova-look', voiceProfileRef: 'nova-voice',
    tools: JITSI_VIDEO_TOOLS, governedTools: JITSI_GOVERNED_DEFAULTS,
  } });
  const jitsi = jitsiCondition(stack, resources());
  assert.equal(jitsi.status, 'True', jitsi.message);
});

test('voice spec passes real reconcileStack → JitsiCapabilityReady True', () => {
  const stack = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'voice', providerRef: 'jitsi-prod', role: 'agent', audioMode: 'speak',
  } });
  const jitsi = jitsiCondition(stack, resources());
  assert.equal(jitsi.status, 'True', jitsi.message);
});

test('observer + publish video → JitsiCapabilityReady False', () => {
  // Force the invalid permutation directly (UI guards against it, validator must reject).
  const stack = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', providerRef: 'jitsi-prod', role: 'observer',
    audioMode: 'receive', videoPublish: true, avatarRef: 'nova-look',
    tools: JITSI_VIDEO_TOOLS, governedTools: JITSI_GOVERNED_DEFAULTS,
  } });
  const jitsi = jitsiCondition(stack, resources());
  assert.equal(jitsi.status, 'False');
  assert.match(jitsi.message, /observer role cannot publish video/);
});

test('publish video with missing avatarRef → JitsiCapabilityReady False', () => {
  const stack = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', providerRef: 'jitsi-prod', role: 'agent',
    audioMode: 'speak', videoPublish: true, avatarRef: 'ghost-look',
    tools: JITSI_VIDEO_TOOLS, governedTools: JITSI_GOVERNED_DEFAULTS,
  } });
  // appearance 'ghost-look' is not in the resources map
  const jitsi = jitsiCondition(stack, resources({ appearance: false }));
  assert.equal(jitsi.status, 'False');
  assert.match(jitsi.message, /AgentAppearance\/ghost-look not found/);
});

test('builder clamps governedTools to a subset of tools (invariant enforced)', () => {
  // governedTools that are NOT in tools must be dropped, so the emitted spec is
  // always valid — the builder cannot produce an ungoverned-tools violation.
  const stack = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', providerRef: 'jitsi-prod', role: 'agent',
    audioMode: 'speak', videoPublish: true, avatarRef: 'nova-look',
    tools: ['kradle_speak'], governedTools: ['kradle_draw_canvas'],
  } });
  assert.deepEqual(stack.spec.jitsiConfig.tools, ['kradle_speak']);
  assert.equal(stack.spec.jitsiConfig.governedTools, undefined); // clamped to []
  const jitsi = jitsiCondition(stack, resources());
  assert.equal(jitsi.status, 'True', jitsi.message);
});

test('hand-built governedTools ⊄ tools → real validator rejects (False)', () => {
  // Bypass the builder's clamp to prove the G9 gate itself rejects the violation.
  const stack = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', providerRef: 'jitsi-prod', role: 'agent',
    audioMode: 'speak', videoPublish: true, avatarRef: 'nova-look',
    tools: JITSI_VIDEO_TOOLS, governedTools: JITSI_GOVERNED_DEFAULTS,
  } });
  stack.spec.jitsiConfig.tools = ['kradle_speak'];
  stack.spec.jitsiConfig.governedTools = ['kradle_draw_canvas'];
  const jitsi = jitsiCondition(stack, resources());
  assert.equal(jitsi.status, 'False');
  assert.match(jitsi.message, /governedTools not in tools/);
});

test('missing provider ref → JitsiCapabilityReady False', () => {
  const stack = buildStackResource({ ...base, meeting: {
    enabled: true, mode: 'video', role: 'agent', audioMode: 'speak',
    videoPublish: true, avatarRef: 'nova-look',
    tools: JITSI_VIDEO_TOOLS, governedTools: JITSI_GOVERNED_DEFAULTS,
  } });
  assert.equal(stack.spec.jitsiMeetingProviderRef, undefined);
  const jitsi = jitsiCondition(stack, resources());
  assert.equal(jitsi.status, 'False');
  assert.match(jitsi.message, /jitsiMeetingProviderRef is required/);
});

// ── Constant parity guard (names mirror controller's JITSI_TOOLS) ───────────

test('exported JITSI constants exist and are non-empty', () => {
  assert.ok(Array.isArray(JITSI_VIDEO_TOOLS) && JITSI_VIDEO_TOOLS.length > 0);
  assert.ok(Array.isArray(JITSI_GOVERNED_DEFAULTS) && JITSI_GOVERNED_DEFAULTS.length > 0);
  assert.ok(Array.isArray(JITSI_AUDIO_TOOLS) && JITSI_AUDIO_TOOLS.length > 0);
  for (const t of JITSI_GOVERNED_DEFAULTS) assert.ok(JITSI_VIDEO_TOOLS.includes(t));
});
