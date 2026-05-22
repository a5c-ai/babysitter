export interface GatewayLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

function write(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
  const line = `[agent-mux-gateway:${level}] ${message}${suffix}`;
  process.stderr.write(`${line}\n`);
}

export function createGatewayLogger(): GatewayLogger {
  return {
    debug(message, meta) {
      write('debug', message, meta);
    },
    info(message, meta) {
      write('info', message, meta);
    },
    warn(message, meta) {
      write('warn', message, meta);
    },
    error(message, meta) {
      write('error', message, meta);
    },
  };
}
