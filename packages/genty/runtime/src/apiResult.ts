/**
 * Lightweight result envelope used by daemon lifecycle and config modules.
 *
 * Duplicated from agent-platform's api/utils to avoid a circular
 * dependency between agent-runtime and agent-platform.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function fail<T>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}
