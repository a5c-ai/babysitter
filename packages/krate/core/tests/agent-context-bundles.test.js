import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assembleContextBundle, createRedactionManifest } from '../src/agent-context-bundles.js';
import { createResource } from '../src/resource-model.js';

function makeStack(name, promptOverrides = {}, extraSpec = {}) {
  return createResource('AgentStack', { name }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'babysitter',
    runtimeIdentity: { serviceAccountRef: 'sa-agent' },
    prompt: {
      system: promptOverrides.system || '',
      developer: promptOverrides.developer || '',
      task: promptOverrides.task || '',
    },
    ...extraSpec
  });
}

function makeSkill(name, promptFragment) {
  return createResource('AgentSkill', { name }, {
    organizationRef: 'default',
    format: 'markdown',
    sourceRef: `skills/${name}`,
    promptFragment
  });
}

function makeContextLabel(name, promptFragment) {
  return createResource('AgentContextLabel', { name }, {
    organizationRef: 'default',
    promptFragment,
    allowedSources: ['manual']
  });
}

describe('agent context bundles', () => {
  it('basic assembly with system/developer/task prompt', () => {
    const stack = makeStack('test-stack', {
      system: 'You are a security reviewer.',
      developer: 'Focus on OWASP top 10.',
      task: 'Review the authentication module.'
    });
    const bundle = assembleContextBundle({ stack, repository: 'my-repo', ref: 'refs/heads/main' });

    assert.equal(bundle.kind, 'AgentContextBundle');
    assert.equal(bundle.apiVersion, 'krate.a5c.ai/v1alpha1');
    assert.ok(bundle.metadata.name.startsWith('bundle-'));
    assert.equal(bundle.spec.organizationRef, 'default');
    assert.equal(bundle.spec.dispatchRun, '');
    assert.ok(typeof bundle.spec.digest === 'string' && bundle.spec.digest.length === 64);

    // Prompt layers present
    const layers = bundle.spec.promptLayers;
    assert.equal(layers[0].role, 'system');
    assert.equal(layers[1].role, 'developer');
    assert.equal(layers[2].role, 'task');
    assert.ok(layers[0].sizeBytes > 0);
    assert.ok(layers[1].sizeBytes > 0);
    assert.ok(layers[2].sizeBytes > 0);

    // _content present (in-memory, not persisted)
    assert.equal(bundle._content.system, 'You are a security reviewer.');
    assert.equal(bundle._content.developer, 'Focus on OWASP top 10.');
    assert.equal(bundle._content.task, 'Review the authentication module.');
  });

  it('redaction catches API_KEY=xxx patterns', () => {
    const stack = makeStack('test-stack', {
      system: 'config: API_KEY=sk_live_abc123xyz',
      developer: '',
      task: ''
    });
    const bundle = assembleContextBundle({ stack });
    assert.ok(bundle._content.system.includes('[REDACTED:secret-key]'));
    assert.ok(!bundle._content.system.includes('sk_live_abc123xyz'));
    assert.ok(bundle.spec.redactions.total > 0);
    assert.ok(bundle.spec.redactions.byKind['secret-key'] > 0);
  });

  it('redaction catches provider tokens (sk-xxx)', () => {
    const stack = makeStack('test-stack', {
      system: '',
      developer: 'Use key: sk-abcdefghijklmnopqrstuvwxyz1234567890',
      task: ''
    });
    const bundle = assembleContextBundle({ stack });
    assert.ok(bundle._content.developer.includes('[REDACTED:provider-token]'));
    assert.ok(!bundle._content.developer.includes('sk-abcdefghijklmnopqrstuvwxyz1234567890'));
    assert.ok(bundle.spec.redactions.byKind['provider-token'] > 0);
  });

  it('redaction catches Bearer tokens', () => {
    const stack = makeStack('test-stack', {
      system: 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test',
      developer: '',
      task: ''
    });
    const bundle = assembleContextBundle({ stack });
    assert.ok(bundle._content.system.includes('[REDACTED:bearer-token]'));
    assert.ok(!bundle._content.system.includes('eyJhbGciOiJIUzI1NiJ9'));
    assert.ok(bundle.spec.redactions.byKind['bearer-token'] > 0);
  });

  it('redaction catches private keys', () => {
    const privateKey = '-----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJBALRpYJk...\n-----END RSA PRIVATE KEY-----';
    const stack = makeStack('test-stack', {
      system: `Here is a key: ${privateKey}`,
      developer: '',
      task: ''
    });
    const bundle = assembleContextBundle({ stack });
    assert.ok(bundle._content.system.includes('[REDACTED:private-key]'));
    assert.ok(!bundle._content.system.includes('MIIBogIBAAJBALRpYJk'));
    assert.ok(bundle.spec.redactions.byKind['private-key'] > 0);
  });

  it('size truncation at 750 KiB', () => {
    // Create a bundle that exceeds 750 KiB via many source attachments.
    // Each source is truncated to 64 KiB per-layer, so we need enough sources
    // to exceed 750 KiB total. 750/64 ~= 12, so 13 sources at 64 KiB each should exceed.
    // Use content with spaces to avoid base64-credential pattern matching.
    const chunk = 'the quick brown fox jumps.\n';
    const bigContent = chunk.repeat(Math.ceil((64 * 1024) / chunk.length)).slice(0, 64 * 1024);
    const stack = makeStack('test-stack', {
      system: 'small system prompt',
      developer: '',
      task: ''
    });
    const sourceRefs = [];
    for (let i = 0; i < 15; i++) {
      sourceRefs.push({ kind: 'file', ref: `big-file-${i}.txt`, content: bigContent });
    }
    const bundle = assembleContextBundle({ stack, sourceRefs });

    assert.equal(bundle.spec.limits.truncated, true);
    assert.equal(bundle.spec.limits.maxBytes, 750 * 1024);

    // Verify total content is at or near the limit
    const allContentLen = bundle._content.system.length +
      bundle._content.developer.length +
      bundle._content.task.length +
      bundle._content.sources.reduce((s, src) => s + src.content.length, 0);
    assert.ok(allContentLen <= 750 * 1024 + 100, `total size ${allContentLen} should be near 750KiB limit`);
  });

  it('digest is deterministic (same input produces same digest)', () => {
    const stack = makeStack('test-stack', {
      system: 'Deterministic test system prompt.',
      developer: 'Deterministic test developer prompt.',
      task: 'Deterministic test task prompt.'
    });
    const sourceRefs = [{ kind: 'pr-body', ref: '#42', content: 'PR description here' }];

    const bundle1 = assembleContextBundle({ stack, sourceRefs });
    const bundle2 = assembleContextBundle({ stack, sourceRefs });

    assert.equal(bundle1.spec.digest, bundle2.spec.digest);
    assert.ok(typeof bundle1.spec.digest === 'string' && bundle1.spec.digest.length === 64);
  });

  it('redaction manifest has counts only (no leaked values)', () => {
    const stack = makeStack('test-stack', {
      system: 'SECRET_KEY = "my-super-secret-value123" and PASSWORD=hunter2',
      developer: '',
      task: ''
    });
    const bundle = assembleContextBundle({ stack });
    const manifest = bundle.spec.redactions;

    assert.ok(typeof manifest.total === 'number' && manifest.total >= 2);
    assert.ok(typeof manifest.byKind === 'object');
    // Ensure the manifest only has counts, no string values that could leak secrets
    for (const [kind, count] of Object.entries(manifest.byKind)) {
      assert.ok(typeof kind === 'string');
      assert.ok(typeof count === 'number');
    }
    // Verify no secret values in the serialized manifest
    const serialized = JSON.stringify(manifest);
    assert.ok(!serialized.includes('my-super-secret-value123'));
    assert.ok(!serialized.includes('hunter2'));
  });

  it('empty inputs handled gracefully', () => {
    const stack = makeStack('test-stack', { system: '', developer: '', task: '' });
    const bundle = assembleContextBundle({ stack });

    assert.equal(bundle.kind, 'AgentContextBundle');
    assert.ok(typeof bundle.spec.digest === 'string' && bundle.spec.digest.length === 64);
    assert.equal(bundle.spec.promptLayers.length, 3);
    assert.equal(bundle.spec.promptLayers[0].sizeBytes, 0);
    assert.equal(bundle.spec.promptLayers[1].sizeBytes, 0);
    assert.equal(bundle.spec.promptLayers[2].sizeBytes, 0);
    assert.equal(bundle.spec.redactions.total, 0);
    assert.equal(bundle.spec.limits.truncated, false);
    assert.deepEqual(bundle.spec.sources, []);
    assert.equal(bundle._content.system, '');
    assert.equal(bundle._content.developer, '');
    assert.equal(bundle._content.task, '');
  });

  it('assembles skill and label fragments from resources', () => {
    const stack = makeStack('test-stack', {
      system: 'System prompt',
      developer: '',
      task: ''
    }, { skillRefs: ['skill-review', 'skill-test'] });
    const resources = {
      AgentSkill: [
        makeSkill('skill-review', 'Review all changed files for security issues.'),
        makeSkill('skill-test', 'Run unit tests before proceeding.'),
        makeSkill('skill-unused', 'This should not appear.')
      ],
      AgentContextLabel: [
        makeContextLabel('label-prod', 'This is a production environment.')
      ]
    };
    const bundle = assembleContextBundle({
      stack,
      contextLabels: ['label-prod'],
      resources
    });

    // Should have system + developer + task + 2 skills + 1 label = 6 layers
    assert.equal(bundle.spec.promptLayers.length, 6);
    assert.equal(bundle.spec.promptLayers[3].role, 'skill:skill-review');
    assert.equal(bundle.spec.promptLayers[4].role, 'skill:skill-test');
    assert.equal(bundle.spec.promptLayers[5].role, 'label:label-prod');
    assert.ok(bundle._content.skillFragments.length === 2);
    assert.ok(bundle._content.labelFragments.length === 1);
  });

  it('createRedactionManifest returns correct structure', () => {
    const manifest = createRedactionManifest({ 'secret-key': 3, 'provider-token': 1, 'bearer-token': 2 });
    assert.equal(manifest.total, 6);
    assert.deepEqual(manifest.byKind, { 'secret-key': 3, 'provider-token': 1, 'bearer-token': 2 });
  });

  it('createRedactionManifest with empty counts', () => {
    const manifest = createRedactionManifest({});
    assert.equal(manifest.total, 0);
    assert.deepEqual(manifest.byKind, {});
  });

  it('source refs are limited to MAX_ATTACHMENTS (32)', () => {
    const stack = makeStack('test-stack', { system: '', developer: '', task: '' });
    const sourceRefs = [];
    for (let i = 0; i < 40; i++) {
      sourceRefs.push({ kind: 'file', ref: `file-${i}.txt`, content: `content ${i}` });
    }
    const bundle = assembleContextBundle({ stack, sourceRefs });
    assert.ok(bundle.spec.sources.length <= 32, 'should cap at 32 sources');
    assert.ok(bundle._content.sources.length <= 32);
  });

  it('prompt layers are truncated to 64 KiB each', () => {
    const oversized = 'a'.repeat(80 * 1024); // 80 KiB
    const stack = makeStack('test-stack', {
      system: oversized,
      developer: '',
      task: ''
    });
    const bundle = assembleContextBundle({ stack });
    assert.ok(bundle._content.system.length <= 64 * 1024, 'system prompt should be truncated to 64 KiB');
  });

  it('redaction in source content', () => {
    const stack = makeStack('test-stack', { system: '', developer: '', task: '' });
    const sourceRefs = [
      { kind: 'pipeline-log', ref: 'run-123', content: 'Error: API_KEY=leaked_value_here failed auth' }
    ];
    const bundle = assembleContextBundle({ stack, sourceRefs });
    assert.ok(bundle._content.sources[0].content.includes('[REDACTED:secret-key]'));
    assert.ok(!bundle._content.sources[0].content.includes('leaked_value_here'));
    assert.ok(bundle.spec.redactions.total > 0);
  });
});
