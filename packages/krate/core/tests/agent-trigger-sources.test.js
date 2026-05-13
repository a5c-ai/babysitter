import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateCronExpression,
  calculateNextRun,
  validateWebhookTrigger,
  validateCommentTrigger,
  validateLabelTrigger,
  getTriggerSourceType,
  validateTriggerRule,
  createResource,
} from '../src/index.js';

// ── Cron validation ──────────────────────────────────────────────────────────

test('validateCronExpression: accepts valid 5-field cron expression', () => {
  const result = validateCronExpression('*/5 * * * *');
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test('validateCronExpression: accepts complex valid cron (fixed values + ranges)', () => {
  const result = validateCronExpression('0 9-17 * * 1-5');
  assert.equal(result.valid, true);
});

test('validateCronExpression: rejects invalid cron string (non-cron words)', () => {
  const result = validateCronExpression('not a cron');
  assert.equal(result.valid, false);
  assert.ok(typeof result.error === 'string' && result.error.length > 0, 'Should have an error message');
});

test('validateCronExpression: rejects empty string', () => {
  const result = validateCronExpression('');
  assert.equal(result.valid, false);
  assert.ok(result.error, 'Should have an error message');
});

test('validateCronExpression: rejects fewer than 5 fields', () => {
  const result = validateCronExpression('* * * *');
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('5'), 'Error should mention 5-field requirement');
});

test('validateCronExpression: rejects more than 5 fields', () => {
  const result = validateCronExpression('* * * * * *');
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('5'), 'Error should mention 5-field requirement');
});

// ── calculateNextRun ─────────────────────────────────────────────────────────

test('calculateNextRun: returns a future Date for a valid cron expression', () => {
  const fromDate = new Date('2024-01-01T00:00:00Z');
  const next = calculateNextRun('*/5 * * * *', fromDate);
  assert.ok(next instanceof Date, 'Should return a Date');
  assert.ok(next > fromDate, 'Returned date should be in the future relative to fromDate');
});

test('calculateNextRun: uses current date when fromDate is omitted', () => {
  const before = new Date();
  const next = calculateNextRun('0 0 * * *');
  assert.ok(next instanceof Date, 'Should return a Date');
  assert.ok(next > before, 'Returned date should be after invocation time');
});

test('calculateNextRun: returns null for invalid cron expression', () => {
  const result = calculateNextRun('not-a-cron');
  assert.equal(result, null);
});

// ── validateWebhookTrigger ───────────────────────────────────────────────────

test('validateWebhookTrigger: accepts valid webhook config with url and secretRef', () => {
  const config = { url: 'https://example.com/webhook', secretRef: 'my-webhook-secret' };
  const result = validateWebhookTrigger(config);
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test('validateWebhookTrigger: rejects config missing url', () => {
  const config = { secretRef: 'my-webhook-secret' };
  const result = validateWebhookTrigger(config);
  assert.equal(result.valid, false);
  assert.ok(result.error.toLowerCase().includes('url'), 'Error should mention missing url');
});

test('validateWebhookTrigger: rejects config with non-http url scheme', () => {
  const config = { url: 'ftp://example.com/webhook', secretRef: 'my-webhook-secret' };
  const result = validateWebhookTrigger(config);
  assert.equal(result.valid, false);
  assert.ok(result.error, 'Should have an error message');
});

test('validateWebhookTrigger: accepts webhook config without secretRef (optional)', () => {
  const config = { url: 'https://example.com/webhook' };
  const result = validateWebhookTrigger(config);
  assert.equal(result.valid, true);
});

// ── validateCommentTrigger ───────────────────────────────────────────────────

test('validateCommentTrigger: accepts valid comment trigger with pattern and repos', () => {
  const config = { pattern: '/run-agent', repos: ['myorg/myrepo'] };
  const result = validateCommentTrigger(config);
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test('validateCommentTrigger: accepts comment trigger without repos (global scope)', () => {
  const config = { pattern: '/deploy' };
  const result = validateCommentTrigger(config);
  assert.equal(result.valid, true);
});

test('validateCommentTrigger: rejects empty pattern', () => {
  const config = { pattern: '', repos: ['myorg/myrepo'] };
  const result = validateCommentTrigger(config);
  assert.equal(result.valid, false);
  assert.ok(result.error.toLowerCase().includes('pattern'), 'Error should mention pattern');
});

test('validateCommentTrigger: rejects missing pattern field', () => {
  const config = { repos: ['myorg/myrepo'] };
  const result = validateCommentTrigger(config);
  assert.equal(result.valid, false);
  assert.ok(result.error, 'Should have an error message');
});

// ── validateLabelTrigger ─────────────────────────────────────────────────────

test('validateLabelTrigger: accepts valid label config with labels array and action', () => {
  const config = { labels: ['bug', 'urgent'], action: 'labeled' };
  const result = validateLabelTrigger(config);
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test('validateLabelTrigger: accepts label config with action "unlabeled"', () => {
  const config = { labels: ['wontfix'], action: 'unlabeled' };
  const result = validateLabelTrigger(config);
  assert.equal(result.valid, true);
});

test('validateLabelTrigger: rejects empty labels array', () => {
  const config = { labels: [], action: 'labeled' };
  const result = validateLabelTrigger(config);
  assert.equal(result.valid, false);
  assert.ok(result.error.toLowerCase().includes('label'), 'Error should mention labels');
});

test('validateLabelTrigger: rejects missing labels field', () => {
  const config = { action: 'labeled' };
  const result = validateLabelTrigger(config);
  assert.equal(result.valid, false);
  assert.ok(result.error, 'Should have an error message');
});

test('validateLabelTrigger: rejects invalid action value', () => {
  const config = { labels: ['bug'], action: 'deleted' };
  const result = validateLabelTrigger(config);
  assert.equal(result.valid, false);
  assert.ok(result.error.toLowerCase().includes('action'), 'Error should mention action');
});

// ── getTriggerSourceType ─────────────────────────────────────────────────────

test('getTriggerSourceType: returns "cron" for rule with cronExpression', () => {
  const rule = { spec: { cronExpression: '*/5 * * * *' } };
  assert.equal(getTriggerSourceType(rule), 'cron');
});

test('getTriggerSourceType: returns "webhook" for rule with webhookTrigger', () => {
  const rule = { spec: { webhookTrigger: { url: 'https://example.com/hook' } } };
  assert.equal(getTriggerSourceType(rule), 'webhook');
});

test('getTriggerSourceType: returns "comment" for rule with commentTrigger', () => {
  const rule = { spec: { commentTrigger: { pattern: '/run' } } };
  assert.equal(getTriggerSourceType(rule), 'comment');
});

test('getTriggerSourceType: returns "label" for rule with labelTrigger', () => {
  const rule = { spec: { labelTrigger: { labels: ['bug'], action: 'labeled' } } };
  assert.equal(getTriggerSourceType(rule), 'label');
});

test('getTriggerSourceType: returns "event" for rule with only sources array', () => {
  const rule = { spec: { sources: ['ci-failure'] } };
  assert.equal(getTriggerSourceType(rule), 'event');
});

test('getTriggerSourceType: returns "unknown" for rule with no recognized source spec', () => {
  const rule = { spec: {} };
  assert.equal(getTriggerSourceType(rule), 'unknown');
});

// ── validateTriggerRule with cron source ─────────────────────────────────────

test('validateTriggerRule: rule with valid cron source passes validation', () => {
  const rule = createResource(
    'AgentTriggerRule',
    { name: 'cron-rule', namespace: 'krate-org-default' },
    {
      organizationRef: 'default',
      cronExpression: '0 */6 * * *',
      agentStack: 'maintenance-stack',
      taskKind: 'maintenance',
    }
  );
  const result = validateTriggerRule(rule);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateTriggerRule: rule with invalid cron expression fails validation', () => {
  const rule = createResource(
    'AgentTriggerRule',
    { name: 'bad-cron-rule', namespace: 'krate-org-default' },
    {
      organizationRef: 'default',
      cronExpression: 'every five minutes',
      agentStack: 'maintenance-stack',
      taskKind: 'maintenance',
    }
  );
  const result = validateTriggerRule(rule);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0, 'Should have validation errors');
});

test('validateTriggerRule: rule with webhook source passes validation', () => {
  const rule = createResource(
    'AgentTriggerRule',
    { name: 'webhook-rule', namespace: 'krate-org-default' },
    {
      organizationRef: 'default',
      webhookTrigger: { url: 'https://example.com/hook', secretRef: 'hook-secret' },
      agentStack: 'webhook-stack',
      taskKind: 'on-demand',
    }
  );
  const result = validateTriggerRule(rule);
  assert.equal(result.valid, true);
});
