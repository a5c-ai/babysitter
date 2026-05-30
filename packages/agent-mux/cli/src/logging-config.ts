import type { ObservabilityMode } from '@a5c-ai/agent-mux-observability';

export interface CliLoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  logFile?: string;
  mode?: ObservabilityMode;
}

export function resolveCliLoggingConfig(options: {
  debug?: boolean;
  logLevel?: string;
  logFile?: string;
}): CliLoggingConfig {
  const level = (options.logLevel || (options.debug ? 'debug' : 'info')) as CliLoggingConfig['level'];
  return {
    level,
    logFile: options.logFile,
    mode: options.debug || options.logLevel || options.logFile ? 'full' : undefined,
  };
}
