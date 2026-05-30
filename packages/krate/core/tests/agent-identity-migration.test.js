import assert from 'node:assert/strict';
import test from 'node:test';
import {
  agentStackHasInlineIdentity,
  createResource,
  legacyAgentStackIdentityWarning,
  migrateAgentStackIdentity,
  planAgentStackIdentityMigration,
} from '../src/index.js';

function stack(spec = {}) {
  return createResource('AgentStack', { name: 'review-bot', namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'claude-code',
    runtimeIdentity: { serviceAccountRef: 'review-bot' },
    ...spec,
  });
}

test('agentStackHasInlineIdentity detects prompt and skill fields', () => {
  assert.equal(agentStackHasInlineIdentity(stack()), false);
  assert.equal(agentStackHasInlineIdentity(stack({ systemPrompt: 'Review code.' })), true);
  assert.equal(agentStackHasInlineIdentity(stack({ skillRefs: ['security-review'] })), true);
});

test('planAgentStackIdentityMigration extracts persona and definition while preserving backup', () => {
  const legacy = stack({
    systemPrompt: 'You review code.',
    developerPrompt: 'Prefer focused comments.',
    taskPrompt: 'Review this PR.',
    skillRefs: ['security-review'],
  });

  const plan = planAgentStackIdentityMigration(legacy);

  assert.equal(plan.dryRun, true);
  assert.equal(plan.persona.kind, 'AgentPersona');
  assert.equal(plan.persona.metadata.name, 'review-bot-persona');
  assert.equal(plan.persona.spec.soul.inline, 'You review code.');
  assert.deepEqual(plan.persona.spec.skillRefs, ['security-review']);
  assert.equal(plan.persona.spec.legacyPrompts.developerPrompt, 'Prefer focused comments.');
  assert.equal(plan.persona.spec.legacyPrompts.taskPrompt, 'Review this PR.');
  assert.equal(plan.definition.kind, 'AgentDefinition');
  assert.equal(plan.definition.metadata.name, 'review-bot');
  assert.equal(plan.definition.spec.personaRef, 'review-bot-persona');
  assert.equal(plan.definition.spec.stackRef, 'review-bot');
  assert.equal(plan.backup.spec.systemPrompt, 'You review code.');
  assert.equal(plan.cleanedStack.spec.systemPrompt, undefined);
  assert.equal(plan.cleanedStack.spec.developerPrompt, undefined);
  assert.equal(plan.cleanedStack.spec.taskPrompt, undefined);
  assert.equal(plan.cleanedStack.spec.skillRefs, undefined);
  assert.equal(plan.cleanedStack.spec.baseAgent, 'claude-code');
  assert.equal(plan.operations.length, 3);
});

test('migrateAgentStackIdentity is dry-run by default and apply mode writes stack cleanup last', async () => {
  const applied = [];
  const legacy = stack({ systemPrompt: 'Identity.', skillRefs: ['review'] });

  const dryRun = await migrateAgentStackIdentity(legacy, {
    applyResource(resource) {
      applied.push(resource);
      return resource;
    },
  });

  assert.equal(dryRun.dryRun, true);
  assert.equal(applied.length, 0);

  const result = await migrateAgentStackIdentity(legacy, {
    dryRun: false,
    applyResource(resource) {
      applied.push(resource);
      return { name: resource.metadata.name };
    },
  });

  assert.equal(result.dryRun, false);
  assert.deepEqual(applied.map((resource) => resource.kind), ['AgentPersona', 'AgentDefinition', 'AgentStack']);
  assert.equal(applied[2].spec.systemPrompt, undefined);
});

test('legacyAgentStackIdentityWarning returns deprecation guidance only for inline identity stacks', () => {
  assert.equal(legacyAgentStackIdentityWarning(stack()), null);
  assert.match(legacyAgentStackIdentityWarning(stack({ developerPrompt: 'Legacy.' })), /AgentStack "review-bot" has inline prompts or skills/);
});
