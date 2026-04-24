import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('index-simple exports', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('delegates initialize/shutdown to telemetry-simple', async () => {
    const initializeTelemetry = vi.fn();
    const shutdownTelemetry = vi.fn().mockResolvedValue(undefined);

    vi.doMock('../src/telemetry-simple.js', () => ({
      telemetry: { name: 'simple-telemetry' },
      initializeTelemetry,
      shutdownTelemetry,
    }));

    const mod = await import('../src/index-simple.js');

    expect(typeof mod.createLogger).toBe('function');
    expect(typeof mod.createComponentLogger).toBe('function');
    expect(mod.telemetry).toEqual({ name: 'simple-telemetry' });

    mod.initializeObservability();
    await mod.shutdownObservability();

    expect(initializeTelemetry).toHaveBeenCalledTimes(1);
    expect(shutdownTelemetry).toHaveBeenCalledTimes(1);
  });
});
