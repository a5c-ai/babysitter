/**
 * Structured logging with Pino for agent-mux.
 *
 * Provides contextual logging for agents, runs, sessions, and operations
 * with configurable output formats and log levels.
 */

import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';
import { Logger, LogLevel, LogContext, CostInfo } from './types.js';

/**
 * Logger configuration options.
 */
export interface LoggerConfig {
  /** Log level threshold */
  level?: LogLevel;
  /** Log to a file instead of stdout */
  logFile?: string;
  /** Enable pretty printing for development */
  pretty?: boolean;
  /** Enable structured JSON output */
  structured?: boolean;
  /** Include timestamps in logs */
  timestamp?: boolean;
  /** Include source location (file:line) in logs */
  includeSource?: boolean;
  /** Base context to include in all logs */
  baseContext?: LogContext;
  /** Custom pino options */
  pinoOptions?: pino.LoggerOptions;
}

/**
 * Implementation of the Logger interface that wraps a Pino instance.
 * Ensures that child loggers created via .child() also have the enhanced methods.
 */
class PinoLoggerWrapper implements Logger {
  constructor(private pino: PinoLogger) {}

  // Core pino methods
  get level(): string { return this.pino.level; }
  set level(val: string) { this.pino.level = val; }

  trace(msg: string): void;
  trace(obj: object, msg?: string): void;
  trace(objOrMsg: any, msg?: string): void {
    this.pino.trace(objOrMsg, msg);
  }

  debug(msg: string): void;
  debug(obj: object, msg?: string): void;
  debug(objOrMsg: any, msg?: string): void {
    this.pino.debug(objOrMsg, msg);
  }

  info(msg: string): void;
  info(obj: object, msg?: string): void;
  info(objOrMsg: any, msg?: string): void {
    this.pino.info(objOrMsg, msg);
  }

  warn(msg: string): void;
  warn(obj: object, msg?: string): void;
  warn(objOrMsg: any, msg?: string): void {
    this.pino.warn(objOrMsg, msg);
  }

  error(msg: string): void;
  error(obj: object, msg?: string): void;
  error(objOrMsg: any, msg?: string): void {
    this.pino.error(objOrMsg, msg);
  }

  fatal(msg: string): void;
  fatal(obj: object, msg?: string): void;
  fatal(objOrMsg: any, msg?: string): void {
    this.pino.fatal(objOrMsg, msg);
  }

  child(bindings: LogContext): Logger {
    return new PinoLoggerWrapper(this.pino.child(bindings));
  }

  // Enhanced methods
  runStart(context: { runId: string; agent: string; prompt: string; model?: string }): void {
    this.pino.info({
      runId: context.runId,
      agent: context.agent,
      model: context.model,
      prompt: context.prompt.slice(0, 100) + (context.prompt.length > 100 ? '...' : ''),
    }, 'Agent run started');
  }

  runComplete(context: { runId: string; agent: string; duration: number; cost?: CostInfo }): void {
    this.pino.info({
      runId: context.runId,
      agent: context.agent,
      duration: context.duration,
      cost: context.cost,
    }, 'Agent run completed');
  }

  runError(context: { runId: string; agent: string; error: Error | LogContext['error'] }): void {
    const error = context.error instanceof Error ? {
      message: context.error.message,
      stack: context.error.stack,
      name: context.error.name,
    } : context.error;

    this.pino.error({
      runId: context.runId,
      agent: context.agent,
      error,
    }, 'Agent run failed');
  }

  toolCallStart(context: { runId: string; toolName: string; toolCallId: string; args?: unknown }): void {
    this.pino.debug({
      runId: context.runId,
      toolName: context.toolName,
      toolCallId: context.toolCallId,
      args: context.args,
    }, 'Tool call started');
  }

  toolCallComplete(context: { runId: string; toolName: string; toolCallId: string; duration: number; result?: unknown }): void {
    this.pino.debug({
      runId: context.runId,
      toolName: context.toolName,
      toolCallId: context.toolCallId,
      duration: context.duration,
      result: typeof context.result === 'string' ? context.result.slice(0, 200) : context.result,
    }, 'Tool call completed');
  }

  perf(message: string, context: LogContext & { duration: number }): void {
    this.pino.info({
      ...context,
      type: 'performance',
    }, message);
  }

  auth(message: string, context: LogContext & { method?: string; success?: boolean }): void {
    this.pino.info({
      ...context,
      type: 'auth',
    }, message);
  }

  config(message: string, context: LogContext): void {
    this.pino.debug({
      ...context,
      type: 'config',
    }, message);
  }

  session(message: string, context: LogContext & { action?: 'create' | 'resume' | 'fork' | 'end' }): void {
    this.pino.info({
      ...context,
      type: 'session',
    }, message);
  }
}

/**
 * Default logger configuration.
 */
const DEFAULT_CONFIG: Required<Omit<LoggerConfig, 'pinoOptions' | 'baseContext'>> = {
  level: 'info',
  logFile: '',
  pretty: process.env.NODE_ENV !== 'production',
  structured: process.env.NODE_ENV === 'production',
  timestamp: true,
  includeSource: false,
};

/**
 * Create a structured logger instance.
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  const resolvedConfig = { ...DEFAULT_CONFIG, ...config };

  // Determine if we should use pretty printing
  const shouldUsePretty = resolvedConfig.pretty && !resolvedConfig.structured && !resolvedConfig.logFile;

  // Base pino options
  const pinoOptions: pino.LoggerOptions = {
    level: resolvedConfig.level,
    timestamp: resolvedConfig.timestamp,
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
      service: 'agent-mux',
      ...config.baseContext,
    },
    ...config.pinoOptions,
  };

  let baseLogger: PinoLogger;

  if (resolvedConfig.logFile) {
    // Log to file (always structured JSON)
    baseLogger = pino(pinoOptions, pino.destination(resolvedConfig.logFile));
  } else if (shouldUsePretty) {
    // Add pretty printing for development
    const transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname,service',
        messageFormat: '{msg}',
      },
    };
    baseLogger = pino(pinoOptions, pino.transport(transport));
  } else {
    baseLogger = pino(pinoOptions);
  }

  return new PinoLoggerWrapper(baseLogger);
}

/**
 * Default logger instance.
 */
export const logger = createLogger({
  level: (process.env.AMUX_LOG_LEVEL as LogLevel) || 'info',
  logFile: process.env.AMUX_LOG_FILE,
  pretty: process.env.AMUX_LOG_PRETTY === 'true',
  baseContext: {
    version: process.env.npm_package_version || 'unknown',
  },
});

/**
 * Create a logger for a specific component.
 */
export function createComponentLogger(component: string, context?: LogContext): Logger {
  return logger.child({ component, ...context });
}

/**
 * Create a logger for a specific run.
 */
export function createRunLogger(runId: string, agent: string, additionalContext?: LogContext): Logger {
  return logger.child({ runId, agent, ...additionalContext });
}

/**
 * Reconfigure the default logger.
 * Note: This replaces the pino instance in the singleton wrapper.
 */
export function reconfigureLogger(config: LoggerConfig): void {
  const newLogger = createLogger(config);
  // @ts-expect-error - accessing private property to reconfigure singleton
  logger.pino = (newLogger as any).pino;
  if (config.level) {
    logger.level = config.level;
  }
}
