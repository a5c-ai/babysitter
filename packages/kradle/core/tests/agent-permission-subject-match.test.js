import { test } from 'node:test';
import assert from 'node:assert/strict';
import { subjectMatches } from '../src/agent-permission-review.js';

// Regression: the AgentSecretGrant/AgentRoleBinding/AgentConfigGrant CRDs declare
// spec.subject as an OBJECT ({ kind?, name }). A direct `subject === ref` compare
// silently failed for objects, so every grant was unmatched and dispatch was
// always denied "Missing AgentSecretGrant". subjectMatches must handle both shapes.

test('object subject matches by name against the service-account ref', () => {
  assert.equal(subjectMatches({ kind: 'AgentServiceAccount', name: 'default' }, 'default', 'my-stack'), true);
});

test('object subject matches by name against the agent-stack name', () => {
  assert.equal(subjectMatches({ kind: 'AgentStack', name: 'my-stack' }, 'sa-x', 'my-stack'), true);
});

test('object subject with a non-matching name does not match', () => {
  assert.equal(subjectMatches({ kind: 'AgentServiceAccount', name: 'other' }, 'default', 'my-stack'), false);
});

test('legacy string subject still compares directly (back-compat)', () => {
  assert.equal(subjectMatches('default', 'default', 'my-stack'), true);
  assert.equal(subjectMatches('nope', 'default', 'my-stack'), false);
});

test('null/undefined/malformed subjects never match', () => {
  assert.equal(subjectMatches(null, 'default', 'my-stack'), false);
  assert.equal(subjectMatches(undefined, 'default', 'my-stack'), false);
  assert.equal(subjectMatches({ kind: 'AgentServiceAccount' }, 'default', 'my-stack'), false);
});
