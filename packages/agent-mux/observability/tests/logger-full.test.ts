import { beforeEach, describe, expect, it, vi } from 'vitest';

function installPinoMock() {
  const rootLogger = {
    level: 'info',
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  };
  const childLogger = {
    level: 'info',
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  };

  rootLogger.child.mockReturnValue(childLogger);

  const destination = vi.fn((file: string) => ({ file }));
  const transport = vi.fn((config: unknown) => ({ config }));
  const pinoFactory = vi.fn(() => rootLogger);
  Object.assign(pinoFactory, { destination, transport });

  vi.doMock('pino', () => ({ default: pinoFactory }));

  return { rootLogger, childLogger, pinoFactory, destination, transport };
}

describe('logger.ts', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('wraps pino loggers and preserves helper methods for children', async () => {
    const { rootLogger, childLogger, pinoFactory, transport } = installPinoMock();
    const mod = await import('../src/logger.js');

    const logger = mod.createLogger({
      pretty: true,
      structured: false,
      baseContext: { component: 'root' },
    });

    logger.trace('trace');
    logger.debug({ debug: true }, 'debug');
    logger.info('info');
    logger.warn({ warn: true }, 'warn');
    logger.error('error');
    logger.fatal({ fatal: true }, 'fatal');

    const child = logger.child({ component: 'child' });
    child.runStart({ runId: 'run-1', agent: 'codex', prompt: 'x'.repeat(140), model: 'gpt-5.4' });
    child.runComplete({ runId: 'run-1', agent: 'codex', duration: 20 });
    child.runError({ runId: 'run-1', agent: 'codex', error: new Error('boom') });
    child.toolCallStart({ runId: 'run-1', toolName: 'bash', toolCallId: 'tool-1', args: { cmd: 'pwd' } });
    child.toolCallComplete({
      runId: 'run-1',
      toolName: 'bash',
      toolCallId: 'tool-1',
      duration: 3,
      result: 'y'.repeat(240),
    });
    child.perf?.('perf', { duration: 10, runId: 'run-1' });
    child.auth?.('auth', { success: true, method: 'token', runId: 'run-1' });
    child.config?.('config', { runId: 'run-1' });
    child.session('session', { action: 'create', sessionId: 'session-1' });

    expect(pinoFactory).toHaveBeenCalled();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(rootLogger.trace).toHaveBeenCalledWith('trace', undefined);
    expect(rootLogger.debug).toHaveBeenCalledWith({ debug: true }, 'debug');
    expect(rootLogger.info).toHaveBeenCalledWith('info', undefined);
    expect(rootLogger.warn).toHaveBeenCalledWith({ warn: true }, 'warn');
    expect(rootLogger.error).toHaveBeenCalledWith('error', undefined);
    expect(rootLogger.fatal).toHaveBeenCalledWith({ fatal: true }, 'fatal');
    expect(rootLogger.child).toHaveBeenCalledWith({ component: 'child' });
    expect(childLogger.info).toHaveBeenCalledWith(expect.objectContaining({
      runId: 'run-1',
      agent: 'codex',
      model: 'gpt-5.4',
    }), 'Agent run started');
    expect(childLogger.info).toHaveBeenCalledWith(expect.objectContaining({
      type: 'performance',
      duration: 10,
    }), 'perf');
    expect(childLogger.debug).toHaveBeenCalledWith(expect.objectContaining({
      type: 'config',
      runId: 'run-1',
    }), 'config');
    expect(childLogger.error).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'boom', name: 'Error' }),
    }), 'Agent run failed');
    expect(childLogger.info).toHaveBeenCalledWith(expect.objectContaining({
      type: 'session',
      sessionId: 'session-1',
    }), 'session');
  });

  it('supports file destinations and reconfiguring the shared logger', async () => {
    const { rootLogger, childLogger, destination } = installPinoMock();
    const mod = await import('../src/logger.js');

    const fileLogger = mod.createLogger({
      pretty: false,
      logFile: '/tmp/agent-mux.log',
    });
    fileLogger.info('before');

    const componentLogger = mod.createComponentLogger('component', { runId: 'run-2' });
    const runLogger = mod.createRunLogger('run-3', 'codex', { sessionId: 'session-3' });

    mod.reconfigureLogger({ level: 'debug' });
    mod.logger.info('after');

    expect(destination).toHaveBeenCalledWith('/tmp/agent-mux.log');
    expect(rootLogger.child).toHaveBeenCalledWith({ component: 'component', runId: 'run-2' });
    expect(rootLogger.child).toHaveBeenCalledWith({
      runId: 'run-3',
      agent: 'codex',
      sessionId: 'session-3',
    });
    expect(componentLogger).toBeDefined();
    expect(runLogger).toBeDefined();
    expect(mod.logger.level).toBe('debug');
    expect(childLogger.info).not.toHaveBeenCalledWith('before', undefined);
  });
});
