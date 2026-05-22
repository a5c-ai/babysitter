/**
 * OpenTelemetry integration for agent-mux.
 *
 * Provides metrics, tracing, and observability for agent operations,
 * performance monitoring, and error tracking.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  metrics,
  trace,
  context,
  SpanStatusCode,
  SpanKind,
  type Meter,
  type Tracer,
  type Span,
  type Counter,
  type Histogram,
  type Gauge,
} from '@opentelemetry/api';
import { Telemetry, CostInfo } from './types.js';

/**
 * Telemetry configuration options.
 */
export interface TelemetryConfig {
  /** Service name for telemetry */
  serviceName?: string;
  /** Service version */
  serviceVersion?: string;
  /** Enable tracing */
  enableTracing?: boolean;
  /** Enable metrics */
  enableMetrics?: boolean;
  /** OTLP endpoint for exporting data */
  otlpEndpoint?: string;
  /** Custom attributes to attach to all telemetry */
  baseAttributes?: Record<string, string | number | boolean>;
}

/**
 * Agent-mux specific metrics.
 */
export interface AgentMuxMetrics {
  /** Counter for total agent runs */
  runsTotal: Counter;
  /** Counter for agent run errors */
  runsErrors: Counter;
  /** Histogram for agent run duration */
  runsDuration: Histogram;
  /** Histogram for tool call duration */
  toolCallsDuration: Histogram;
  /** Counter for tool calls */
  toolCallsTotal: Counter;
  /** Gauge for active runs */
  activeRuns: Gauge;
  /** Histogram for token usage */
  tokensUsed: Histogram;
  /** Counter for cost tracking */
  costTotal: Counter;
  /** Counter for authentication events */
  authEvents: Counter;
}

/**
 * Telemetry manager for agent-mux observability.
 */
export class TelemetryManager implements Telemetry {
  private sdk: NodeSDK | null = null;
  private meter: Meter;
  private tracer: Tracer;
  private metrics: AgentMuxMetrics;
  private config: Required<TelemetryConfig>;

  constructor(config: TelemetryConfig = {}) {
    this.config = {
      serviceName: 'agent-mux',
      serviceVersion: process.env.npm_package_version || '0.0.0',
      enableTracing: true,
      enableMetrics: true,
      otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
      baseAttributes: {},
      ...config,
    };

    this.meter = metrics.getMeter('@a5c-ai/agent-mux', this.config.serviceVersion);
    this.tracer = trace.getTracer('@a5c-ai/agent-mux', this.config.serviceVersion);
    this.metrics = this.createMetrics();
  }

  /**
   * Initialize OpenTelemetry SDK.
   */
  initialize(): void {
    if (this.sdk) {
      return; // Already initialized
    }

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: this.config.serviceName,
        [ATTR_SERVICE_VERSION]: this.config.serviceVersion,
      }),
      instrumentations: [getNodeAutoInstrumentations({
        // Disable some noisy instrumentations
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
      })],
    });

    this.sdk.start();
  }

  /**
   * Shutdown telemetry.
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.sdk = null;
    }
  }

  /**
   * Create metrics instances.
   */
  private createMetrics(): AgentMuxMetrics {
    return {
      runsTotal: this.meter.createCounter('agent_runs_total', {
        description: 'Total number of agent runs',
        unit: '1',
      }),
      runsErrors: this.meter.createCounter('agent_runs_errors_total', {
        description: 'Total number of failed agent runs',
        unit: '1',
      }),
      runsDuration: this.meter.createHistogram('agent_runs_duration_ms', {
        description: 'Duration of agent runs in milliseconds',
        unit: 'ms',
      }),
      toolCallsDuration: this.meter.createHistogram('tool_calls_duration_ms', {
        description: 'Duration of tool calls in milliseconds',
        unit: 'ms',
      }),
      toolCallsTotal: this.meter.createCounter('tool_calls_total', {
        description: 'Total number of tool calls',
        unit: '1',
      }),
      activeRuns: this.meter.createGauge('agent_active_runs', {
        description: 'Number of currently active agent runs',
        unit: '1',
      }),
      tokensUsed: this.meter.createHistogram('tokens_used_total', {
        description: 'Total tokens used (input + output + thinking)',
        unit: '1',
      }),
      costTotal: this.meter.createCounter('cost_usd_total', {
        description: 'Total cost in USD',
        unit: 'USD',
      }),
      authEvents: this.meter.createCounter('auth_events_total', {
        description: 'Authentication events',
        unit: '1',
      }),
    };
  }

  /**
   * Start tracing an agent run.
   */
  startRunSpan(runId: string, agent: string, model?: string): Span {
    return this.tracer.startSpan(`agent.run.${agent}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'agent.run.id': runId,
        'agent.name': agent,
        'agent.model': model || 'unknown',
        ...this.config.baseAttributes,
      },
    });
  }

  /**
   * Start tracing a tool call.
   */
  startToolCallSpan(toolName: string, toolCallId: string, parentSpan?: Span): Span {
    const spanContext = parentSpan ? trace.setSpan(context.active(), parentSpan) : context.active();

    return context.with(spanContext, () => this.tracer.startSpan(`tool.call.${toolName}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'tool.name': toolName,
        'tool.call.id': toolCallId,
        ...this.config.baseAttributes,
      },
    }));
  }

  /**
   * Start tracing a subagent delegation.
   */
  startSubagentSpan(subagentId: string, agentName: string, parentSpan?: Span): Span {
    const spanContext = parentSpan ? trace.setSpan(context.active(), parentSpan) : context.active();

    return context.with(spanContext, () => this.tracer.startSpan(`subagent.dispatch.${agentName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'subagent.id': subagentId,
        'subagent.name': agentName,
        ...this.config.baseAttributes,
      },
    }));
  }

  /**
   * Record agent run start.
   */
  recordRunStart(agent: string, model?: string): void {
    this.metrics.runsTotal.add(1, {
      agent,
      model: model || 'unknown',
      status: 'started',
    });
  }

  /**
   * Record agent run completion.
   */
  recordRunComplete(agent: string, model: string | undefined, duration: number, cost?: {
    totalUsd?: number;
    inputTokens?: number;
    outputTokens?: number;
    thinkingTokens?: number;
  }): void {
    this.metrics.runsDuration.record(duration, {
      agent,
      model: model || 'unknown',
      status: 'completed',
    });

    if (cost) {
      const totalTokens = (cost.inputTokens || 0) + (cost.outputTokens || 0) + (cost.thinkingTokens || 0);

      this.metrics.tokensUsed.record(totalTokens, {
        agent,
        model: model || 'unknown',
        token_type: 'total',
      });

      if (cost.inputTokens) {
        this.metrics.tokensUsed.record(cost.inputTokens, {
          agent,
          model: model || 'unknown',
          token_type: 'input',
        });
      }

      if (cost.outputTokens) {
        this.metrics.tokensUsed.record(cost.outputTokens, {
          agent,
          model: model || 'unknown',
          token_type: 'output',
        });
      }

      if (cost.thinkingTokens) {
        this.metrics.tokensUsed.record(cost.thinkingTokens, {
          agent,
          model: model || 'unknown',
          token_type: 'thinking',
        });
      }

      if (cost.totalUsd) {
        this.metrics.costTotal.add(cost.totalUsd, {
          agent,
          model: model || 'unknown',
        });
      }
    }
  }

  /**
   * Record agent run error.
   */
  recordRunError(agent: string, model: string | undefined, error: Error | string, cost?: CostInfo): void {
    this.metrics.runsErrors.add(1, {
      agent,
      model: model || 'unknown',
      error_type: error instanceof Error ? error.constructor.name : 'unknown',
    });

    if (cost) {
      const totalTokens = (cost.inputTokens || 0) + (cost.outputTokens || 0) + (cost.thinkingTokens || 0);

      this.metrics.tokensUsed.record(totalTokens, {
        agent,
        model: model || 'unknown',
        token_type: 'total',
        status: 'error',
      });

      if (cost.totalUsd) {
        this.metrics.costTotal.add(cost.totalUsd, {
          agent,
          model: model || 'unknown',
          status: 'error',
        });
      }
    }
  }

  /**
   * Record tool call.
   */
  recordToolCall(toolName: string, duration: number, success: boolean): void {
    this.metrics.toolCallsTotal.add(1, {
      tool: toolName,
      status: success ? 'success' : 'error',
    });

    this.metrics.toolCallsDuration.record(duration, {
      tool: toolName,
      status: success ? 'success' : 'error',
    });
  }

  /**
   * Record authentication event.
   */
  recordAuthEvent(agent: string, method: string, success: boolean): void {
    this.metrics.authEvents.add(1, {
      agent,
      method,
      status: success ? 'success' : 'failure',
    });
  }

  /**
   * Set active runs gauge.
   */
  setActiveRuns(count: number): void {
    this.metrics.activeRuns.record(count);
  }

  /**
   * End a span with success.
   */
  endSpanSuccess(span: Span, attributes?: Record<string, string | number | boolean>): void {
    if (attributes) {
      span.setAttributes(attributes);
    }
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  }

  /**
   * End a span with error.
   */
  endSpanError(span: Span, error: Error | string, attributes?: Record<string, string | number | boolean>): void {
    span.recordException(error instanceof Error ? error : new Error(error));
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : error,
    });
    if (attributes) {
      span.setAttributes(attributes);
    }
    span.end();
  }

  /**
   * Get the meter instance.
   */
  getMeter(): Meter {
    return this.meter;
  }
}

/**
 * Default telemetry manager instance.
 */
export const telemetry = new TelemetryManager({
  serviceName: process.env.OTEL_SERVICE_NAME || 'agent-mux',
  serviceVersion: process.env.npm_package_version,
  enableTracing: process.env.OTEL_TRACES_EXPORTER !== 'none',
  enableMetrics: process.env.OTEL_METRICS_EXPORTER !== 'none',
});

/**
 * Initialize telemetry if enabled.
 */
export function initializeTelemetry(): void {
  if (process.env.OTEL_SDK_DISABLED !== 'true') {
    telemetry.initialize();
  }
}

/**
 * Shutdown telemetry.
 */
export async function shutdownTelemetry(): Promise<void> {
  await telemetry.shutdown();
}
