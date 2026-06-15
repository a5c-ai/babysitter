import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  initializeTelemetry,
  shutdownTelemetry,
  telemetry,
} from '../src/telemetry-simple.js';

describe('Simple telemetry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits JSON events for run, tool, and auth tracking', async () => {
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    expect(telemetry.startRunSpan('run-1', 'codex', 'gpt-5.4')).toBeNull();
    expect(telemetry.startToolCallSpan('bash', 'tool-1')).toBeNull();
    expect(telemetry.startSubagentSpan('sub-1', 'worker')).toBeNull();

    telemetry.recordRunStart('codex', 'gpt-5.4');
    telemetry.recordRunComplete('codex', 'gpt-5.4', 42, {
      totalUsd: 1.5,
      inputTokens: 10,
    });
    telemetry.recordRunError('codex', undefined, new Error('failed'));
    telemetry.recordRunError('codex', 'gpt-5.4', 'plain error', {
      totalUsd: 0.25,
    });
    telemetry.recordToolCall('bash', 9, true);
    telemetry.recordAuthEvent('codex', 'token', false);
    telemetry.endSpanSuccess(null);
    telemetry.endSpanError(null, new Error('ignored'));

    initializeTelemetry();
    await shutdownTelemetry();

    const events = write.mock.calls.map(([chunk]) => JSON.parse(String(chunk).trim()));
    expect(events).toMatchObject([
      { event: 'run_start', agent: 'codex', model: 'gpt-5.4' },
      { event: 'run_complete', agent: 'codex', duration: 42, cost: { totalUsd: 1.5, inputTokens: 10 } },
      { event: 'run_error', agent: 'codex', model: 'unknown', error_message: 'failed' },
      { event: 'run_error', agent: 'codex', model: 'gpt-5.4', error_message: 'plain error' },
      { event: 'tool_call', tool: 'bash', duration: 9, status: 'success' },
      { event: 'auth_event', agent: 'codex', method: 'token', status: 'failure' },
    ]);
  });
});
