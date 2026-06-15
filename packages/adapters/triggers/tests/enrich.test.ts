import { describe, expect, it, vi } from 'vitest';
import { enrichEvent } from '../src/enrich.js';

describe('event enrichment', () => {
  it('enriches github commit files from the API', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ files: [{ filename: 'packages/triggers/src/index.ts', status: 'modified', patch: '+@develop-this' }] }),
    } as Response));

    const event = await enrichEvent({
      backend: 'github',
      eventName: 'push',
      token: 'token',
      fetchImpl,
      event: {
        after: 'abc123',
        repository: { full_name: 'a5c-ai/babysitter' },
        commits: [],
      },
    });

    expect(fetchImpl).toHaveBeenCalledWith('https://api.github.com/repos/a5c-ai/babysitter/commits/abc123', expect.any(Object));
    expect(event.changes).toEqual([{ path: 'packages/triggers/src/index.ts', status: 'modified', patch: '+@develop-this' }]);
    expect(event.text).toContain('@develop-this');
  });

  it('continues when github API enrichment fails', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) } as Response));

    const event = await enrichEvent({
      backend: 'github',
      eventName: 'push',
      token: 'token',
      fetchImpl,
      event: {
        after: 'abc123',
        repository: { full_name: 'a5c-ai/babysitter' },
        commits: [{ modified: ['packages/triggers/src/index.ts'] }],
      },
    });

    expect(event.changes).toEqual([{ path: 'packages/triggers/src/index.ts', status: 'modified', patch: undefined }]);
  });
});
