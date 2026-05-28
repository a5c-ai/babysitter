import { describe, expect, it } from 'vitest';
import { normalizeEvent } from '../src/backends/index.js';

describe('trigger backend normalization', () => {
  it('normalizes bitbucket pull request events', () => {
    const event = normalizeEvent('bitbucket', 'pullrequest:created', {
      actor: { nickname: 'octo' },
      repository: { full_name: 'team/repo' },
      pullrequest: {
        title: '@develop-this update docs',
        description: 'body',
        source: { branch: { name: 'feature' } },
        destination: { branch: { name: 'main' } },
      },
    });

    expect(event.backend).toBe('bitbucket');
    expect(event.sourceBranch).toBe('feature');
    expect(event.text).toContain('@develop-this');
  });

  it('normalizes generic webhook changes', () => {
    const event = normalizeEvent('generic-webhook', 'webhook', {
      event: 'deployment',
      actor: 'bot',
      repository: 'team/repo',
      changes: [{ file: 'infra/main.tf', diff: '+@develop-this' }],
    });

    expect(event.eventName).toBe('deployment');
    expect(event.changes).toEqual([{ path: 'infra/main.tf', status: undefined, patch: '+@develop-this' }]);
  });
});
