import { afterEach, describe, expect, it, vi } from 'vitest';
import { createComponentLogger, createSimpleLogger } from '../src/logger-simple.js';

describe('SimpleLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('writes structured log entries with merged context', () => {
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const logger = createSimpleLogger({ service: 'agent-mux', version: '1.2.3' });

    logger.info({ runId: 'run-1', duration: 12 }, 'hello');

    expect(write).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(String(write.mock.calls[0]?.[0]).trim());
    expect(entry).toMatchObject({
      level: 'info',
      msg: 'hello',
      service: 'agent-mux',
      version: '1.2.3',
      runId: 'run-1',
      duration: 12,
    });
    expect(typeof entry.timestamp).toBe('string');
  });

  it('keeps base context when creating child loggers', () => {
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const logger = createSimpleLogger({ service: 'agent-mux' }).child({ component: 'worker' });

    logger.warn('child-message');

    const entry = JSON.parse(String(write.mock.calls[0]?.[0]).trim());
    expect(entry).toMatchObject({
      level: 'warn',
      msg: 'child-message',
      service: 'agent-mux',
      component: 'worker',
    });
  });

  it('respects the configured log level threshold for parent and child loggers', () => {
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    vi.stubEnv('AMUX_LOG_LEVEL', 'error');

    const logger = createSimpleLogger({ service: 'agent-mux' });
    const child = logger.child({ component: 'worker' });

    logger.debug({ runId: 'run-1' }, 'debug should be dropped');
    child.info('info should be dropped');
    child.error({ runId: 'run-1' }, 'error should remain');

    expect(write).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(String(write.mock.calls[0]?.[0]).trim());
    expect(entry).toMatchObject({
      level: 'error',
      msg: 'error should remain',
      service: 'agent-mux',
      component: 'worker',
      runId: 'run-1',
    });
  });

  it('exposes the higher-level helper methods', () => {
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const logger = createComponentLogger('scheduler', { sessionId: 'session-1' });
    logger.level = 'debug';

    logger.runStart({
      runId: 'run-1',
      agent: 'codex',
      prompt: 'x'.repeat(140),
      model: 'gpt-5.4',
    });
    logger.runComplete({
      runId: 'run-1',
      agent: 'codex',
      duration: 25,
      cost: { totalUsd: 1.25 },
    });
    logger.runError({
      runId: 'run-1',
      agent: 'codex',
      error: new Error('boom'),
    });
    logger.toolCallStart({
      runId: 'run-1',
      toolName: 'bash',
      toolCallId: 'tool-1',
      args: { cmd: 'pwd' },
    });
    logger.toolCallComplete({
      runId: 'run-1',
      toolName: 'bash',
      toolCallId: 'tool-1',
      duration: 7,
      result: 'x'.repeat(240),
    });
    logger.session('session opened', {
      sessionId: 'session-1',
      action: 'create',
    });

    const entries = write.mock.calls.map(([chunk]) => JSON.parse(String(chunk).trim()));
    expect(entries[0]).toMatchObject({
      msg: 'Agent run started',
      agent: 'codex',
      component: 'scheduler',
      sessionId: 'session-1',
    });
    expect(entries[0].prompt).toHaveLength(103);
    expect(entries[1]).toMatchObject({
      msg: 'Agent run completed',
      duration: 25,
      cost: { totalUsd: 1.25 },
    });
    expect(entries[2]).toMatchObject({
      msg: 'Agent run failed',
      error: expect.objectContaining({ message: 'boom', name: 'Error' }),
    });
    expect(entries[3]).toMatchObject({
      msg: 'Tool call started',
      toolName: 'bash',
      toolCallId: 'tool-1',
    });
    expect(entries[4]).toMatchObject({
      msg: 'Tool call completed',
      toolName: 'bash',
      toolCallId: 'tool-1',
      duration: 7,
    });
    expect(entries[4].result).toHaveLength(200);
    expect(entries[5]).toMatchObject({
      msg: 'session opened',
      type: 'session',
      action: 'create',
    });
  });
});
