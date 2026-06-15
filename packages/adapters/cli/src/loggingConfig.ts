type AgentMuxLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface CliLoggerConfig {
  level: AgentMuxLogLevel;
  logFile?: string;
}

function normalizeLogLevel(value: string | undefined, fallback: AgentMuxLogLevel): AgentMuxLogLevel {
  return value === 'debug' ||
    value === 'info' ||
    value === 'warn' ||
    value === 'error' ||
    value === 'silent'
    ? value
    : fallback;
}

export function resolveCliLoggerConfig(
  flags: { debug?: boolean; logLevel?: string; logFile?: string },
  env: NodeJS.ProcessEnv = process.env,
): CliLoggerConfig {
  const level = flags.logLevel
    ? normalizeLogLevel(flags.logLevel, flags.debug ? 'debug' : 'info')
    : normalizeLogLevel(env['AGENT_MUX_LOG_LEVEL'], flags.debug ? 'debug' : 'info');
  const logFile = flags.logFile ?? env['AGENT_MUX_LOG_FILE'];
  return logFile ? { level, logFile } : { level };
}
