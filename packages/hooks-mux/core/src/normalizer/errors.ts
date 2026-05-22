/**
 * Base error for handler failures within the hooks-mux normalizer/runner.
 */
export class HandlerError extends Error {
  public readonly handlerSource: string;
  public readonly handlerName: string;
  public readonly code: string;

  constructor(
    message: string,
    options: { source: string; handler: string; code?: string; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = 'HandlerError';
    this.handlerSource = options.source;
    this.handlerName = options.handler;
    this.code = options.code ?? 'HANDLER_ERROR';
  }
}

/**
 * Thrown when a handler times out.
 */
export class HandlerTimeoutError extends HandlerError {
  constructor(options: { source: string; handler: string; timeoutMs: number }) {
    super(
      `Handler ${options.source}:${options.handler} timed out after ${options.timeoutMs}ms`,
      { source: options.source, handler: options.handler, code: 'HANDLER_TIMEOUT' },
    );
    this.name = 'HandlerTimeoutError';
  }
}

/**
 * Thrown when event normalization fails (e.g. missing required fields).
 */
export class NormalizationError extends Error {
  public readonly code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'NormalizationError';
    this.code = code ?? 'NORMALIZATION_ERROR';
  }
}
