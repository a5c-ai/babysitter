import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWebhookEvent } from '../src/index.js';

describe('normalizeWebhookEvent', () => {
  // 1. GitHub workflow_run failure -> type: 'ci-failure'
  it('normalizes GitHub workflow_run failure to ci-failure', () => {
    const body = {
      action: 'completed',
      workflow_run: { conclusion: 'failure', name: 'CI Build', head_branch: 'feature-x' },
      repository: { full_name: 'acme/app' },
      sender: { login: 'alice' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'ci-failure');
    assert.equal(event.source.kind, 'Pipeline');
    assert.equal(event.source.name, 'CI Build');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.ref, 'feature-x');
    assert.equal(event.actor, 'alice');
    assert.equal(event.payload, body);
  });

  // 2. GitHub PR opened -> type: 'pr-opened'
  it('normalizes GitHub PR opened to pr-opened', () => {
    const body = {
      action: 'opened',
      pull_request: { number: 42, head: { ref: 'feat/login' } },
      repository: { full_name: 'acme/app' },
      sender: { login: 'bob' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'pr-opened');
    assert.equal(event.source.kind, 'PullRequest');
    assert.equal(event.source.name, '42');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.ref, 'feat/login');
    assert.equal(event.actor, 'bob');
    assert.equal(event.payload, body);
  });

  // 3. GitHub issue comment -> type: 'comment' with kind 'Issue'
  it('normalizes GitHub issue comment to comment with kind Issue', () => {
    const body = {
      action: 'created',
      comment: { body: 'Looks good!', user: { login: 'reviewer' } },
      issue: { number: 10 },
      repository: { full_name: 'acme/app' },
      sender: { login: 'reviewer' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'comment');
    assert.equal(event.source.kind, 'Issue');
    assert.equal(event.source.name, '10');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.actor, 'reviewer');
    assert.deepEqual(event.payload, { body: 'Looks good!' });
  });

  // 4. GitHub PR comment -> type: 'comment' with kind 'PullRequest'
  it('normalizes GitHub PR comment to comment with kind PullRequest', () => {
    const body = {
      action: 'created',
      comment: { body: 'LGTM', user: { login: 'reviewer' } },
      issue: { number: 7, pull_request: { url: 'https://api.github.com/repos/acme/app/pulls/7' } },
      repository: { full_name: 'acme/app' },
      sender: { login: 'reviewer' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'comment');
    assert.equal(event.source.kind, 'PullRequest');
    assert.equal(event.source.name, '7');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.actor, 'reviewer');
    assert.deepEqual(event.payload, { body: 'LGTM' });
  });

  // 5. GitHub label added -> type: 'label-added'
  it('normalizes GitHub label added to label-added', () => {
    const body = {
      action: 'labeled',
      label: { name: 'bug' },
      issue: { number: 15 },
      repository: { full_name: 'acme/app' },
      sender: { login: 'triager' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'label-added');
    assert.equal(event.source.kind, 'Issue');
    assert.equal(event.source.name, '15');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.actor, 'triager');
    assert.deepEqual(event.payload, { label: 'bug' });
  });

  // 6. GitHub push -> type: 'push'
  it('normalizes GitHub push to push', () => {
    const body = {
      ref: 'refs/heads/main',
      commits: [{ id: 'abc123', message: 'fix typo' }],
      repository: { full_name: 'acme/app' },
      sender: { login: 'dev' },
      pusher: { name: 'dev' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'push');
    assert.equal(event.source.kind, 'Repository');
    assert.equal(event.source.name, 'acme/app');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.ref, 'main');
    assert.equal(event.actor, 'dev');
    assert.equal(event.payload, body);
  });

  // 7. Unknown payload -> type: 'webhook' (fallback)
  it('returns webhook fallback for unknown payload', () => {
    const body = {
      action: 'some-unknown-action',
      repository: { full_name: 'acme/app' },
      sender: { login: 'bot' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'webhook');
    assert.equal(event.source.kind, 'WebhookDelivery');
    assert.equal(event.source.name, 'unknown');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.actor, 'bot');
    assert.equal(event.payload, body);
  });

  // 8. Empty/minimal payload -> doesn't crash
  it('handles empty payload without crashing', () => {
    const event = normalizeWebhookEvent({}, 'acme');

    assert.equal(event.type, 'webhook');
    assert.equal(event.source.kind, 'WebhookDelivery');
    assert.equal(event.source.name, 'unknown');
    assert.equal(event.repository, '');
    assert.equal(event.actor, 'system');
    assert.equal(event.ref, 'main');
  });

  it('handles minimal payload with only action without crashing', () => {
    const event = normalizeWebhookEvent({ action: 'opened' }, 'acme');

    assert.equal(event.type, 'webhook');
    assert.equal(event.source.kind, 'WebhookDelivery');
  });

  // Additional: label on PR (not issue)
  it('normalizes label on PR with kind PullRequest', () => {
    const body = {
      action: 'labeled',
      label: { name: 'ready-to-merge' },
      pull_request: { number: 99 },
      repository: { full_name: 'acme/app' },
      sender: { login: 'lead' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'label-added');
    assert.equal(event.source.kind, 'PullRequest');
    assert.equal(event.source.name, '99');
    assert.deepEqual(event.payload, { label: 'ready-to-merge' });
  });

  // Additional: issue opened (not PR)
  it('normalizes issue opened to issue-created', () => {
    const body = {
      action: 'opened',
      issue: { number: 33 },
      repository: { full_name: 'acme/app' },
      sender: { login: 'reporter' }
    };
    const event = normalizeWebhookEvent(body, 'acme');

    assert.equal(event.type, 'issue-created');
    assert.equal(event.source.kind, 'Issue');
    assert.equal(event.source.name, '33');
    assert.equal(event.repository, 'acme/app');
    assert.equal(event.actor, 'reporter');
  });
});
