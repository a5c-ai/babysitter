import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateActionTrigger } from '../src/action.js';

describe('agent-mux action trigger flow', () => {
  it('evaluates an event payload from disk like the composite action', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'amux-trigger-'));
    const eventPath = join(dir, 'event.json');
    await writeFile(eventPath, JSON.stringify({
      action: 'created',
      repository: { full_name: 'a5c-ai/babysitter' },
      comment: { body: '@develop-this please' },
      issue: { title: 'request' },
    }), 'utf8');

    const result = await evaluateActionTrigger({
      backend: 'github',
      eventName: 'issue_comment',
      eventPath,
      query: 'event:issue_comment text:@develop-this',
    });

    expect(result.matched).toBe(true);
  });
});
