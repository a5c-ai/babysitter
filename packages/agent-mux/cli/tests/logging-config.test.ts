import { describe, expect, it } from 'vitest';
import { resolveCliLoggingConfig } from '../src/logging-config.js';

describe('CLI logging config', () => {
  it('turns log flags into explicit config without mutating AMUX env vars', () => {
    delete process.env.AMUX_LOG_LEVEL;
    delete process.env.AMUX_LOG_FILE;
    delete process.env.AMUX_OBSERVABILITY_MODE;

    expect(resolveCliLoggingConfig({ debug: true })).toEqual({
      level: 'debug',
      logFile: undefined,
      mode: 'full',
    });
    expect(resolveCliLoggingConfig({ logLevel: 'error', logFile: '/tmp/amux.log' })).toEqual({
      level: 'error',
      logFile: '/tmp/amux.log',
      mode: 'full',
    });
    expect(process.env.AMUX_LOG_LEVEL).toBeUndefined();
    expect(process.env.AMUX_LOG_FILE).toBeUndefined();
    expect(process.env.AMUX_OBSERVABILITY_MODE).toBeUndefined();
  });
});
