import { Telemetry, CostInfo } from './types.js';

/**
 * Simple telemetry implementation that logs metrics.
 */
class SimpleTelemetryImpl implements Telemetry {
  private emit(event: Record<string, unknown>): void {
    process.stderr.write(JSON.stringify(event) + '\n');
  }

  startRunSpan(_runId: string, _agent: string, _model?: string): null {
    return null;
  }

  startToolCallSpan(_toolName: string, _toolCallId: string, _parentSpan?: unknown): null {
    return null;
  }

  startSubagentSpan(_subagentId: string, _agentName: string, _parentSpan?: unknown): null {
    return null;
  }

  recordRunStart(agent: string, model?: string): void {
    this.emit({
      timestamp: new Date().toISOString(),
      event: 'run_start',
      agent,
      model: model || 'unknown',
    });
  }

  recordRunComplete(agent: string, model: string | undefined, duration: number, cost?: CostInfo): void {
    this.emit({
      timestamp: new Date().toISOString(),
      event: 'run_complete',
      agent,
      model: model || 'unknown',
      duration,
      cost,
    });
  }

  recordRunError(agent: string, model: string | undefined, error: Error | string, cost?: CostInfo): void {
    this.emit({
      timestamp: new Date().toISOString(),
      event: 'run_error',
      agent,
      model: model || 'unknown',
      error_type: error instanceof Error ? error.constructor.name : 'unknown',
      error_message: error instanceof Error ? error.message : error,
      cost,
    });
  }

  recordToolCall(toolName: string, duration: number, success: boolean): void {
    this.emit({
      timestamp: new Date().toISOString(),
      event: 'tool_call',
      tool: toolName,
      duration,
      status: success ? 'success' : 'error',
    });
  }

  recordAuthEvent(agent: string, method: string, success: boolean): void {
    this.emit({
      timestamp: new Date().toISOString(),
      event: 'auth_event',
      agent,
      method,
      status: success ? 'success' : 'failure',
    });
  }

  endSpanSuccess(_span: unknown, _attributes?: Record<string, string | number | boolean>): void {
    // No-op in simple telemetry mode
  }

  endSpanError(
    _span: unknown,
    _error: Error | string,
    _attributes?: Record<string, string | number | boolean>,
  ): void {
    // No-op in simple telemetry mode
  }
}

/**
 * Default telemetry instance.
 */
export const telemetry = new SimpleTelemetryImpl();

/**
 * Initialize telemetry (no-op for simple implementation).
 */
export function initializeTelemetry(): void {
  // No-op for simple implementation
}

/**
 * Shutdown telemetry (no-op for simple implementation).
 */
export async function shutdownTelemetry(): Promise<void> {
  // No-op for simple implementation
}
