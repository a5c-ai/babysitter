import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type HooksLogLevel = 'debug' | 'info' | 'warn' | 'error';

interface HooksLogEntry {
  ts: string;
  level: HooksLogLevel;
  command: string;
  msg: string;
  ctx?: Record<string, unknown>;
}

const LOG_LEVELS: Record<HooksLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LOG_LEVEL_ENV = 'A5C_LOGGING_HOOKS_LEVEL';
const LOG_FILE_NAME = 'hooks-mux.log';

function resolveHomeDir(): string {
  const envHome = process.env.HOME?.trim();
  if (envHome) {
    return envHome;
  }

  const userProfile = process.env.USERPROFILE?.trim();
  if (userProfile) {
    return userProfile;
  }

  return os.homedir();
}

function parseLogLevel(value: string | undefined): HooksLogLevel {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'debug':
      return 'debug';
    case 'warn':
      return 'warn';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
}

export function getHooksLogDir(): string {
  return path.join(resolveHomeDir(), '.a5c', 'logs', 'hooks');
}

export function getHooksLogPath(): string {
  return path.join(getHooksLogDir(), LOG_FILE_NAME);
}

export function shouldLog(level: HooksLogLevel): boolean {
  const configured = parseLogLevel(process.env[LOG_LEVEL_ENV]);
  return LOG_LEVELS[level] >= LOG_LEVELS[configured];
}

export async function appendHooksLog(
  command: string,
  level: HooksLogLevel,
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  if (!shouldLog(level)) {
    return;
  }

  const entry: HooksLogEntry = {
    ts: new Date().toISOString(),
    level,
    command,
    msg: message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.ctx = context;
  }

  const logDir = getHooksLogDir();
  const logPath = getHooksLogPath();
  process.stderr.write(`[hooks-logger] writing to ${logPath} (home=${resolveHomeDir()})\n`);
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
    process.stderr.write(`[hooks-logger] write OK\n`);
  } catch (err) {
    process.stderr.write(`[hooks-logger] FAILED: ${err instanceof Error ? err.message : String(err)}\n`);
  }
}

export function createHooksLogger(command: string) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      appendHooksLog(command, 'debug', message, context),
    info: (message: string, context?: Record<string, unknown>) =>
      appendHooksLog(command, 'info', message, context),
    warn: (message: string, context?: Record<string, unknown>) =>
      appendHooksLog(command, 'warn', message, context),
    error: (message: string, context?: Record<string, unknown>) =>
      appendHooksLog(command, 'error', message, context),
  };
}
