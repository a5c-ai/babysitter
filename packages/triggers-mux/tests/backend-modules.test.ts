import { describe, expect, it } from 'vitest';
import { normalizeBitbucket } from '../src/backends/bitbucket.js';
import { normalizeGeneric } from '../src/backends/generic-webhook.js';
import { normalizeGithub } from '../src/backends/github.js';
import { normalizeGitlab } from '../src/backends/gitlab.js';

describe('individual backend normalizers', () => {
  it('normalizes github comments', () => {
    const event = normalizeGithub('issue_comment', { comment: { body: '@develop-this' }, sender: { login: 'octo' } }, {});
    expect(event.backend).toBe('github');
    expect(event.actor).toBe('octo');
    expect(event.text).toContain('@develop-this');
  });

  it('normalizes gitlab commits', () => {
    const event = normalizeGitlab('push', { object_kind: 'push', commits: [{ modified: ['src/app.ts'] }] }, {});
    expect(event.backend).toBe('gitlab');
    expect(event.changes[0]?.path).toBe('src/app.ts');
  });

  it('normalizes bitbucket push file metadata', () => {
    const event = normalizeBitbucket('repo:push', { push: { changes: [{ new: { name: 'main', target: { hash: 'abc', files: [{ path: 'src/app.ts', type: 'modified' }] } } }] } }, {});
    expect(event.ref).toBe('main');
    expect(event.sha).toBe('abc');
    expect(event.changes[0]?.status).toBe('modified');
  });

  it('normalizes generic webhook file metadata', () => {
    const event = normalizeGeneric('webhook', { event: 'custom', changes: [{ filename: 'src/app.ts' }] }, {});
    expect(event.eventName).toBe('custom');
    expect(event.changes[0]?.path).toBe('src/app.ts');
  });
});
