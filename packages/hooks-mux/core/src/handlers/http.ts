import net from 'net';
import type { UnifiedHookResult } from '../types/result';
import type { HttpHandlerRef } from '../types/plan';
import { HandlerError } from '../normalizer/errors';
import { parseHandlerResult, withTimeout, type HandlerRuntimeContext } from './shared';

const DEFAULT_TIMEOUT_MS = 30000;

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function isUnsafeHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost') {
    return true;
  }
  if (net.isIP(host) === 4) {
    return isPrivateIpv4(host);
  }
  if (net.isIP(host) === 6) {
    return host === '::1' || host.startsWith('fe80:') || host === '::';
  }
  return false;
}

function validateUrl(ref: HttpHandlerRef): URL {
  let url: URL;
  try {
    url = new URL(ref.url);
  } catch (err) {
    throw new HandlerError(`Invalid HTTP handler URL: ${ref.url}`, {
      source: ref.url,
      handler: 'http',
      code: 'HTTP_URL_ERROR',
      cause: err,
    });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HandlerError(`Unsupported HTTP handler URL protocol: ${url.protocol}`, {
      source: ref.url,
      handler: 'http',
      code: 'HTTP_URL_ERROR',
    });
  }
  if (url.username || url.password) {
    throw new HandlerError('HTTP handler URL must not include credentials', {
      source: ref.url,
      handler: 'http',
      code: 'HTTP_URL_ERROR',
    });
  }
  if (!ref.allowPrivateNetwork && isUnsafeHost(url.hostname)) {
    throw new HandlerError(`Unsafe HTTP handler host: ${url.hostname}`, {
      source: ref.url,
      handler: 'http',
      code: 'HTTP_URL_ERROR',
    });
  }

  return url;
}

function interpolateHeaderValue(value: string, allowedEnvVars: Set<string>): string {
  return value.replace(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g, (_match, braced: string | undefined, bare: string | undefined) => {
    const name = braced ?? bare;
    if (!name || !allowedEnvVars.has(name)) {
      return '';
    }
    return process.env[name] ?? '';
  });
}

function buildHeaders(ref: HttpHandlerRef): Record<string, string> {
  const allowed = new Set(ref.allowedEnvVars ?? []);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  for (const [name, value] of Object.entries(ref.headers ?? {})) {
    headers[name] = interpolateHeaderValue(value, allowed);
  }

  return headers;
}

export async function runHttpHandler(
  ref: HttpHandlerRef,
  context: HandlerRuntimeContext,
): Promise<UnifiedHookResult> {
  const url = validateUrl(ref);
  if (ref.method != null && ref.method !== 'POST') {
    throw new HandlerError(`Unsupported HTTP handler method: ${String(ref.method)}`, {
      source: ref.url,
      handler: 'http',
      code: 'HTTP_METHOD_ERROR',
    });
  }
  const timeoutMs = context.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const body = JSON.stringify({
    event: context.event,
    ...(ref.body ?? {}),
  });

  return withTimeout(ref.url, 'http', timeoutMs, async (signal) => {
    const response = await fetch(url, {
      method: ref.method ?? 'POST',
      headers: buildHeaders(ref),
      body,
      signal,
      redirect: 'error',
    });

    const text = await response.text();
    if (!response.ok) {
      throw new HandlerError(`HTTP handler returned ${response.status}`, {
        source: ref.url,
        handler: 'http',
        code: 'HTTP_STATUS_ERROR',
      });
    }

    try {
      return text.trim().length === 0 ? { decision: 'noop' } : parseHandlerResult(JSON.parse(text));
    } catch (err) {
      throw new HandlerError('HTTP handler returned invalid JSON', {
        source: ref.url,
        handler: 'http',
        code: 'HTTP_RESPONSE_ERROR',
        cause: err,
      });
    }
  });
}
