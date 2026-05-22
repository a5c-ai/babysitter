import { beforeEach, describe, expect, it, vi } from 'vitest';

function installTelemetryMocks() {
  const counters = new Map<string, { add: ReturnType<typeof vi.fn> }>();
  const histograms = new Map<string, { record: ReturnType<typeof vi.fn> }>();
  const gauges = new Map<string, { record: ReturnType<typeof vi.fn> }>();
  const span = {
    setAttributes: vi.fn(),
    setStatus: vi.fn(),
    end: vi.fn(),
    recordException: vi.fn(),
  };
  const tracer = {
    startSpan: vi.fn(() => span),
  };
  class NodeSDK {
    start = vi.fn();
    shutdown = vi.fn().mockResolvedValue(undefined);
  }

  vi.doMock('@opentelemetry/sdk-node', () => ({ NodeSDK }));
  vi.doMock('@opentelemetry/resources', () => ({
    resourceFromAttributes: vi.fn((attributes) => ({ attributes })),
  }));
  vi.doMock('@opentelemetry/semantic-conventions', () => ({
    ATTR_SERVICE_NAME: 'service.name',
    ATTR_SERVICE_VERSION: 'service.version',
  }));
  vi.doMock('@opentelemetry/auto-instrumentations-node', () => ({
    getNodeAutoInstrumentations: vi.fn((config) => ({ config })),
  }));
  vi.doMock('@opentelemetry/api', () => ({
    metrics: {
      getMeter: vi.fn(() => ({
        createCounter: vi.fn((name: string) => {
          const counter = { add: vi.fn() };
          counters.set(name, counter);
          return counter;
        }),
        createHistogram: vi.fn((name: string) => {
          const histogram = { record: vi.fn() };
          histograms.set(name, histogram);
          return histogram;
        }),
        createGauge: vi.fn((name: string) => {
          const gauge = { record: vi.fn() };
          gauges.set(name, gauge);
          return gauge;
        }),
      })),
    },
    trace: {
      getTracer: vi.fn(() => tracer),
      setSpan: vi.fn((_ctx, parentSpan) => ({ parentSpan })),
    },
    context: {
      active: vi.fn(() => ({ context: 'active' })),
      with: vi.fn((ctx, fn) => fn(ctx)),
    },
    SpanStatusCode: {
      OK: 'ok',
      ERROR: 'error',
    },
    SpanKind: {
      SERVER: 'server',
      CLIENT: 'client',
      INTERNAL: 'internal',
    },
  }));

  return { counters, histograms, gauges, tracer, span, NodeSDK };
}

describe('TelemetryManager', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.OTEL_SDK_DISABLED;
  });

  it('records metrics, spans, and sdk lifecycle', async () => {
    const { counters, histograms, gauges, tracer, span, NodeSDK } = installTelemetryMocks();
    const mod = await import('../src/telemetry.js');
    const telemetry = new mod.TelemetryManager({
      serviceName: 'agent-mux',
      serviceVersion: '1.0.0',
      baseAttributes: { env: 'test' },
    });

    telemetry.initialize();
    telemetry.initialize();

    const runSpan = telemetry.startRunSpan('run-1', 'codex', 'gpt-5.4');
    const toolSpan = telemetry.startToolCallSpan('bash', 'tool-1', runSpan);
    const subagentSpan = telemetry.startSubagentSpan('sub-1', 'worker', runSpan);
    telemetry.recordRunStart('codex', 'gpt-5.4');
    telemetry.recordRunComplete('codex', 'gpt-5.4', 20, {
      totalUsd: 1.25,
      inputTokens: 10,
      outputTokens: 5,
      thinkingTokens: 2,
    });
    telemetry.recordRunError('codex', undefined, new Error('boom'), {
      totalUsd: 0.5,
      inputTokens: 3,
    });
    telemetry.recordToolCall('bash', 4, false);
    telemetry.recordAuthEvent('codex', 'token', true);
    telemetry.setActiveRuns(3);
    telemetry.endSpanSuccess(runSpan, { ok: true });
    telemetry.endSpanError(toolSpan, 'failed', { retryable: false });
    expect(telemetry.getMeter()).toBeDefined();
    const sdkInstance = (telemetry as any).sdk;
    expect(sdkInstance).toBeInstanceOf(NodeSDK);
    expect(sdkInstance.start).toHaveBeenCalledTimes(1);
    await telemetry.shutdown();
    expect(sdkInstance.shutdown).toHaveBeenCalledTimes(1);
    expect(tracer.startSpan).toHaveBeenNthCalledWith(1, 'agent.run.codex', expect.objectContaining({
      kind: 'server',
      attributes: expect.objectContaining({
        'agent.run.id': 'run-1',
        'agent.name': 'codex',
        'agent.model': 'gpt-5.4',
        env: 'test',
      }),
    }));
    expect(tracer.startSpan).toHaveBeenNthCalledWith(2, 'tool.call.bash', expect.objectContaining({
      kind: 'client',
    }));
    expect(tracer.startSpan).toHaveBeenNthCalledWith(3, 'subagent.dispatch.worker', expect.objectContaining({
      kind: 'internal',
    }));
    expect(counters.get('agent_runs_total')?.add).toHaveBeenCalledWith(1, {
      agent: 'codex',
      model: 'gpt-5.4',
      status: 'started',
    });
    expect(histograms.get('agent_runs_duration_ms')?.record).toHaveBeenCalledWith(20, {
      agent: 'codex',
      model: 'gpt-5.4',
      status: 'completed',
    });
    expect(histograms.get('tokens_used_total')?.record).toHaveBeenCalledWith(17, {
      agent: 'codex',
      model: 'gpt-5.4',
      token_type: 'total',
    });
    expect(histograms.get('tokens_used_total')?.record).toHaveBeenCalledWith(3, {
      agent: 'codex',
      model: 'unknown',
      token_type: 'total',
      status: 'error',
    });
    expect(counters.get('cost_usd_total')?.add).toHaveBeenCalledWith(1.25, {
      agent: 'codex',
      model: 'gpt-5.4',
    });
    expect(counters.get('agent_runs_errors_total')?.add).toHaveBeenCalledWith(1, {
      agent: 'codex',
      model: 'unknown',
      error_type: 'Error',
    });
    expect(counters.get('tool_calls_total')?.add).toHaveBeenCalledWith(1, {
      tool: 'bash',
      status: 'error',
    });
    expect(histograms.get('tool_calls_duration_ms')?.record).toHaveBeenCalledWith(4, {
      tool: 'bash',
      status: 'error',
    });
    expect(counters.get('auth_events_total')?.add).toHaveBeenCalledWith(1, {
      agent: 'codex',
      method: 'token',
      status: 'success',
    });
    expect(gauges.get('agent_active_runs')?.record).toHaveBeenCalledWith(3);
    expect(span.setAttributes).toHaveBeenCalledWith({ ok: true });
    expect(span.setStatus).toHaveBeenCalledWith({ code: 'ok' });
    expect(span.recordException).toHaveBeenCalledWith(expect.any(Error));
    expect(span.end).toHaveBeenCalled();
    expect(subagentSpan).toBe(span);
  });

  it('respects the exported initialize/shutdown helpers', async () => {
    installTelemetryMocks();
    process.env.OTEL_SDK_DISABLED = 'true';

    const mod = await import('../src/telemetry.js');

    mod.initializeTelemetry();
    await mod.shutdownTelemetry();

    expect((mod.telemetry as any).sdk).toBeNull();
  });
});
