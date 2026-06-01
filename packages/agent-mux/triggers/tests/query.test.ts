import { describe, expect, it } from 'vitest';
import { normalizeEvent } from '../src/backends/index.js';
import { evaluateTrigger, matchesGlob, parseQuery } from '../src/query.js';

describe('agent-mux trigger evaluation', () => {
  it('matches issue comments by event and mention text', () => {
    const event = normalizeEvent('github', 'issue_comment', {
      action: 'created',
      repository: { full_name: 'a5c-ai/babysitter' },
      sender: { login: 'octo' },
      issue: { title: 'Add automation', body: 'please help', labels: [{ name: 'automation' }] },
      comment: { body: '@develop-this implement it' },
    });

    const result = evaluateTrigger(event, 'event:issue_comment text:@develop-this label:automation');

    expect(result.matched).toBe(true);
  });

  it('matches changed file globs and diff mentions', () => {
    const event = normalizeEvent('github', 'push', {
      ref: 'refs/heads/main',
      repository: { full_name: 'a5c-ai/babysitter' },
      commits: [{ modified: ['packages/agent-mux/cli/src/index.ts'] }],
    });
    event.changes[0]!.patch = '+ @develop-this wire this action';

    const result = evaluateTrigger(event, { paths: 'packages/agent-mux/**', diff: '@develop-this' });

    expect(result.matched).toBe(true);
    expect(matchesGlob('packages/agent-mux/cli/src/index.ts', 'packages/agent-mux/**')).toBe(true);
  });

  it('supports expression queries', () => {
    const event = normalizeEvent('gitlab', 'merge_request', {
      object_kind: 'merge_request',
      user: { username: 'dev' },
      project: { path_with_namespace: 'a5c-ai/babysitter' },
      object_attributes: { action: 'open', title: '@develop-this', source_branch: 'feature' },
    });

    expect(evaluateTrigger(event, { expression: "event == 'merge_request' && text ~ '@develop-this'" }).matched).toBe(true);
  });

  it('parses compact query syntax', () => {
    expect(parseQuery('event:issue_comment text:@develop-this path:packages/**')).toEqual({
      event: ['issue_comment'],
      text: ['@develop-this'],
      paths: ['packages/**'],
    });
  });

  it('rejects unsupported expression clauses', () => {
    const event = normalizeEvent('generic-webhook', 'webhook', { text: '@develop-this' });
    expect(() => evaluateTrigger(event, { expression: 'text != "@develop-this"' })).toThrow('Unsupported trigger expression clause');
  });

  it('reports branch mismatches', () => {
    const event = normalizeEvent('generic-webhook', 'webhook', { branch: 'main' });
    const result = evaluateTrigger(event, { branch: 'develop' });
    expect(result).toMatchObject({ matched: false, reasons: ['branch did not match'] });
  });});
