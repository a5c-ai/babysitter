import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentTriggerController, createResource } from '../src/index.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeWebhookRule(name, webhookTrigger = {}, extra = {}) {
  return createResource('AgentTriggerRule', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    agentStack: 'ci-stack',
    taskKind: 'diagnostic',
    webhookTrigger,
    ...extra,
  });
}

function makeWebhookEvent(overrides = {}) {
  return {
    eventType: 'push',
    repository: 'owner/repo',
    ref: 'refs/heads/main',
    action: null,
    provider: 'github',
    ...overrides,
  };
}

// ─── tests ───────────────────────────────────────────────────────────────────

// 1. evaluateWebhookEvent matches push event to a push trigger rule
test('evaluateWebhookEvent: matches push event to push trigger rule', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('push-rule', { events: ['push'] });
  const event = makeWebhookEvent({ eventType: 'push' });

  const { matchingRules, dispatchIntents } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 1);
  assert.equal(matchingRules[0].metadata.name, 'push-rule');
  assert.equal(dispatchIntents.length, 1);
  assert.equal(dispatchIntents[0].agentStack, 'ci-stack');
  assert.equal(dispatchIntents[0].taskKind, 'diagnostic');
});

// 2. evaluateWebhookEvent matches pull_request event to pull_request trigger rule
test('evaluateWebhookEvent: matches pull_request event to pull_request trigger rule', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('pr-rule', { events: ['pull_request'] });
  const event = makeWebhookEvent({ eventType: 'pull_request', action: 'opened' });

  const { matchingRules, dispatchIntents } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 1);
  assert.equal(matchingRules[0].metadata.name, 'pr-rule');
  assert.equal(dispatchIntents[0].taskKind, 'diagnostic');
});

// 3. evaluateWebhookEvent returns empty when no rules match event type
test('evaluateWebhookEvent: returns empty when no rules match event type', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('push-only', { events: ['push'] });
  const event = makeWebhookEvent({ eventType: 'issues' });

  const { matchingRules, dispatchIntents } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 0);
  assert.equal(dispatchIntents.length, 0);
});

// 4. evaluateWebhookEvent filters by repository — matches when equal
test('evaluateWebhookEvent: filters by repository — matches when equal', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('repo-rule', { events: ['push'], repository: 'owner/repo' });
  const event = makeWebhookEvent({ eventType: 'push', repository: 'owner/repo' });

  const { matchingRules } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 1);
});

// 5. evaluateWebhookEvent filters by repository — no match when different
test('evaluateWebhookEvent: filters by repository — no match when different', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('repo-rule', { events: ['push'], repository: 'owner/repo' });
  const event = makeWebhookEvent({ eventType: 'push', repository: 'other/repo' });

  const { matchingRules } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 0);
});

// 6. evaluateWebhookEvent respects enabled: false — disabled rules are excluded
test('evaluateWebhookEvent: respects enabled: false — disabled rules are excluded', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('disabled-rule', { events: ['push'] }, { enabled: false });
  const event = makeWebhookEvent({ eventType: 'push' });

  const { matchingRules } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 0);
});

// 7. evaluateWebhookEvent deduplicates rules with the same name
test('evaluateWebhookEvent: deduplicates rules with the same name', () => {
  const ctrl = createAgentTriggerController();
  const rule1 = makeWebhookRule('dup-rule', { events: ['push'] });
  const rule2 = makeWebhookRule('dup-rule', { events: ['push'] }); // same name
  const event = makeWebhookEvent({ eventType: 'push' });

  const { matchingRules } = ctrl.evaluateWebhookEvent(event, [rule1, rule2]);

  assert.equal(matchingRules.length, 1);
});

// 8. evaluateWebhookEvent handles empty rules array
test('evaluateWebhookEvent: handles empty rules array', () => {
  const ctrl = createAgentTriggerController();
  const event = makeWebhookEvent();

  const { matchingRules, dispatchIntents } = ctrl.evaluateWebhookEvent(event, []);

  assert.equal(matchingRules.length, 0);
  assert.equal(dispatchIntents.length, 0);
});

// 9. evaluateWebhookEvent handles undefined/null rules gracefully
test('evaluateWebhookEvent: handles undefined rules gracefully', () => {
  const ctrl = createAgentTriggerController();
  const event = makeWebhookEvent();

  const resultUndefined = ctrl.evaluateWebhookEvent(event, undefined);
  assert.equal(resultUndefined.matchingRules.length, 0);
  assert.equal(resultUndefined.dispatchIntents.length, 0);

  const resultNull = ctrl.evaluateWebhookEvent(event, null);
  assert.equal(resultNull.matchingRules.length, 0);
  assert.equal(resultNull.dispatchIntents.length, 0);
});

// 10. evaluateWebhookEvent matches wildcard events array ['*']
test('evaluateWebhookEvent: matches wildcard events array [\'*\']', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('wildcard-rule', { events: ['*'] });
  const events = ['push', 'pull_request', 'issues', 'workflow_run', 'ping'];

  for (const eventType of events) {
    const { matchingRules } = ctrl.evaluateWebhookEvent(makeWebhookEvent({ eventType }), [rule]);
    assert.equal(matchingRules.length, 1, `Should match event type '${eventType}' with wildcard`);
  }
});

// 11. evaluateWebhookEvent filters by action — matches when equal
test('evaluateWebhookEvent: filters by action — matches when equal', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('pr-opened-rule', { events: ['pull_request'], action: 'opened' });
  const event = makeWebhookEvent({ eventType: 'pull_request', action: 'opened' });

  const { matchingRules } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 1);
});

// 12. evaluateWebhookEvent filters by action — no match when action differs
test('evaluateWebhookEvent: filters by action — no match when action differs', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('pr-opened-rule', { events: ['pull_request'], action: 'opened' });
  const event = makeWebhookEvent({ eventType: 'pull_request', action: 'closed' });

  const { matchingRules } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 0);
});

// 13. evaluateWebhookEvent matches when events array is absent (match all)
test('evaluateWebhookEvent: matches when events array is absent (match all)', () => {
  const ctrl = createAgentTriggerController();
  // webhookTrigger present but no events filter
  const rule = makeWebhookRule('no-events-filter', {});
  const event = makeWebhookEvent({ eventType: 'workflow_run' });

  const { matchingRules } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(matchingRules.length, 1);
});

// 14. dispatchIntent includes correct agentStack and uses custom taskKind
test('evaluateWebhookEvent: dispatchIntent includes agentStack and custom taskKind', () => {
  const ctrl = createAgentTriggerController();
  const rule = makeWebhookRule('custom-kind-rule', { events: ['push'] }, { taskKind: 'repair', agentStack: 'my-stack' });
  const event = makeWebhookEvent({ eventType: 'push' });

  const { dispatchIntents } = ctrl.evaluateWebhookEvent(event, [rule]);

  assert.equal(dispatchIntents.length, 1);
  assert.equal(dispatchIntents[0].agentStack, 'my-stack');
  assert.equal(dispatchIntents[0].taskKind, 'repair');
  assert.deepEqual(dispatchIntents[0].event, event);
});
