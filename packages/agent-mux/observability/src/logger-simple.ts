/**
 * Simple structured logging for agent-mux.
 * Provides basic logging capabilities without complex dependencies.
 */

import { Logger, LogLevel, LogContext, CostInfo } from './types.js';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

function normalizeLogLevel(level: string | undefined): LogLevel {
  if (!level) {
    return 'info';
  }
  if (level in LOG_LEVEL_PRIORITY) {
    return level as LogLevel;
  }
  return 'info';
}

/**
 * Simple logger implementation.
 */
class SimpleLogger implements Logger {
  private baseContext: LogContext;
  public level: string = 'info';

  constructor(baseContext: LogContext = {}, level?: string) {
    this.baseContext = baseContext;
    this.level = normalizeLogLevel(level);
  }

  private log(level: LogLevel, msgOrObj: string | object, msg?: string): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[normalizeLogLevel(this.level)]) {
      return;
    }

    const timestamp = new Date().toISOString();

    let message: string;
    let context: LogContext;

    if (typeof msgOrObj === 'string') {
      message = msgOrObj;
      context = {};
    } else {
      message = msg || 'Log message';
      context = msgOrObj as LogContext;
    }

    const mergedContext = { ...this.baseContext, ...context };

    const logEntry = {
      timestamp,
      level,
      msg: message,
      ...mergedContext,
    };

    process.stderr.write(JSON.stringify(logEntry) + '\n');
  }

  trace(msgOrObj: string | object, msg?: string): void {
    this.log('trace', msgOrObj, msg);
  }

  debug(msgOrObj: string | object, msg?: string): void {
    this.log('debug', msgOrObj, msg);
  }

  info(msgOrObj: string | object, msg?: string): void {
    this.log('info', msgOrObj, msg);
  }

  warn(msgOrObj: string | object, msg?: string): void {
    this.log('warn', msgOrObj, msg);
  }

  error(msgOrObj: string | object, msg?: string): void {
    this.log('error', msgOrObj, msg);
  }

  fatal(msgOrObj: string | object, msg?: string): void {
    this.log('fatal', msgOrObj, msg);
  }

  child(context: LogContext): Logger {
    return new SimpleLogger({ ...this.baseContext, ...context }, this.level);
  }

  runStart(context: { runId: string; agent: string; prompt: string; model?: string }): void {
    this.info({
      runId: context.runId,
      agent: context.agent,
      model: context.model,
      prompt: context.prompt.slice(0, 100) + (context.prompt.length > 100 ? '...' : ''),
    }, 'Agent run started');
  }

  runComplete(context: { runId: string; agent: string; duration: number; cost?: CostInfo }): void {
    this.info({
      runId: context.runId,
      agent: context.agent,
      duration: context.duration,
      cost: context.cost,
    }, 'Agent run completed');
  }

  runError(context: { runId: string; agent: string; error: Error | { message: string; name?: string } }): void {
    const error = context.error instanceof Error ? {
      message: context.error.message,
      stack: context.error.stack,
      name: context.error.name,
    } : context.error;

    this.error({
      runId: context.runId,
      agent: context.agent,
      error,
    }, 'Agent run failed');
  }

  toolCallStart(context: { runId: string; toolName: string; toolCallId: string; args?: unknown }): void {
    this.debug({
      runId: context.runId,
      toolName: context.toolName,
      toolCallId: context.toolCallId,
      args: context.args,
    }, 'Tool call started');
  }

  toolCallComplete(context: { runId: string; toolName: string; toolCallId: string; duration: number; result?: unknown }): void {
    this.debug({
      runId: context.runId,
      toolName: context.toolName,
      toolCallId: context.toolCallId,
      duration: context.duration,
      result: typeof context.result === 'string' ? context.result.slice(0, 200) : context.result,
    }, 'Tool call completed');
  }

  session(message: string, context: LogContext & { action?: 'create' | 'resume' | 'fork' | 'end' }): void {
    this.info({
      ...context,
      type: 'session',
    }, message);
  }
}

/**
 * Create a simple logger instance.
 */
export function createSimpleLogger(baseContext?: LogContext): Logger {
  return new SimpleLogger(baseContext, process.env.AMUX_LOG_LEVEL);
}

/**
 * Default logger instance.
 */
export const logger = createSimpleLogger({
  service: 'agent-mux',
  version: process.env.npm_package_version || 'unknown',
});

/**
 * Create a logger for a specific component.
 */
export function createComponentLogger(component: string, context?: LogContext): Logger {
  return logger.child({ component, ...context });
}
