import { describe, it, expect, vi } from 'vitest';
import type { RunHandle } from '@a5c-ai/agent-mux';
import { dispatchPromptToActiveRun, parseActiveRunCommand } from '../src/app.js';

function makeHandle(): RunHandle {
  const pending = new Promise<any>(() => {});
  return {
    runId: 'run-1',
    agent: 'claude',
    model: undefined,
    send: vi.fn(async () => {}),
    queue: vi.fn(async () => {}),
    steer: vi.fn(async () => {}),
    continue: vi.fn(async () => {}),
    approve: vi.fn(async () => {}),
    deny: vi.fn(async () => {}),
    interrupt: vi.fn(async () => {}),
    abort: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
    interaction: {} as any,
    result: () => pending,
    then: pending.then.bind(pending),
    catch: pending.catch.bind(pending),
    finally: pending.finally.bind(pending),
    [Symbol.asyncIterator]: () => ({
      next: async () => ({ value: undefined, done: true }),
    }),
  };
}

describe('App active-run command helpers', () => {
  it('parses queue and steer prefixes', () => {
    expect(parseActiveRunCommand('/queue later')).toEqual({
      kind: 'queue',
      prompt: 'later',
      when: 'next-turn',
    });
    expect(parseActiveRunCommand('/steer-tool tighten scope')).toEqual({
      kind: 'steer',
      prompt: 'tighten scope',
      when: 'after-tool',
    });
    expect(parseActiveRunCommand('/steer nudge')).toEqual({
      kind: 'steer',
      prompt: 'nudge',
      when: 'after-response',
    });
  });

  it('routes active-run commands to the correct handle APIs', async () => {
    const handle = makeHandle();

    await expect(dispatchPromptToActiveRun(handle, 'hello')).resolves.toBe('Sending to active run…');
    expect(handle.send).toHaveBeenCalledWith('hello');

    await expect(dispatchPromptToActiveRun(handle, '/queue later')).resolves.toBe('Queued for the next turn…');
    expect(handle.queue).toHaveBeenCalledWith('later', { when: 'next-turn' });

    await expect(dispatchPromptToActiveRun(handle, '/steer-tool tighten scope')).resolves.toBe('Steering after the next tool result…');
    expect(handle.steer).toHaveBeenCalledWith('tighten scope', { when: 'after-tool' });
  });
});
