import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { globalEventBus } from './event-bus.js';

const execFileAsync = promisify(execFileCallback);
const DEFAULT_TIMEOUT_MS = 3000;

function elapsed(startedAt) {
  return Date.now() - startedAt;
}

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function redactedError(error) {
  return String(error?.message || error || 'unknown error')
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[redacted]');
}

function redactedUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.username) parsed.username = '[redacted]';
    if (parsed.password) parsed.password = '[redacted]';
    for (const [key, value] of parsed.searchParams.entries()) {
      if (/(token|key|secret|password|credential)/i.test(key) || /sk-[A-Za-z0-9_-]{12,}/.test(value)) {
        parsed.searchParams.set(key, '[redacted]');
      }
    }
    return parsed.toString();
  } catch {
    return String(url || '').replace(/sk-ant-[A-Za-z0-9_-]+/g, '[redacted]').replace(/sk-[A-Za-z0-9_-]{12,}/g, '[redacted]');
  }
}

async function httpProbe({ name, url, fetchImpl, timeoutMs }) {
  if (!url) return { name, status: 'not configured', reason: 'missing-url' };
  const startedAt = Date.now();
  const safeUrl = redactedUrl(url);
  try {
    const signal = typeof AbortSignal?.timeout === 'function'
      ? AbortSignal.timeout(timeoutMs)
      : undefined;
    const response = await fetchImpl(url, { signal });
    return response?.ok
      ? { name, status: 'ok', latencyMs: elapsed(startedAt), url: safeUrl }
      : { name, status: 'error', reason: `http-${response?.status || 'unknown'}`, latencyMs: elapsed(startedAt), url: safeUrl };
  } catch (error) {
    return { name, status: 'error', reason: 'request-failed', latencyMs: elapsed(startedAt), error: redactedError(error), url: safeUrl };
  }
}

async function kubernetesProbe({ env, execFileImpl, timeoutMs }) {
  const startedAt = Date.now();
  const command = env.KRATE_KUBECTL || 'kubectl';
  try {
    const result = await execFileImpl(command, ['cluster-info'], { timeout: timeoutMs });
    const output = [result?.stdout, result?.stderr].filter(Boolean).join('\n').trim();
    return { status: 'ok', reason: 'cluster-info', latencyMs: elapsed(startedAt), context: output || null };
  } catch (error) {
    return { status: 'error', reason: 'cluster-info-failed', latencyMs: elapsed(startedAt), error: redactedError(error) };
  }
}

function assistantProbe(env) {
  const key = env.ANTHROPIC_API_KEY || env.KRATE_ASSISTANT_API_KEY || '';
  if (!key) return { status: 'not configured', reason: 'missing-key' };
  if (/^sk-ant-[A-Za-z0-9_-]{12,}$/.test(key) || /^sk-[A-Za-z0-9_-]{12,}$/.test(key)) {
    return { status: 'ok', reason: 'valid-format' };
  }
  return { status: 'error', reason: 'invalid-format' };
}

function eventTransportProbe(eventBus) {
  try {
    const status = eventBus?.status?.() || {};
    return {
      name: 'eventTransport',
      status: status.status || 'unknown',
      reason: status.reason,
      transport: status.transport || 'unknown',
      durable: Boolean(status.durable),
      subject: status.subject,
      stream: status.stream,
    };
  } catch (error) {
    return { name: 'eventTransport', status: 'error', reason: 'status-failed', error: redactedError(error) };
  }
}

export async function collectKrateHealthProbes(options = {}) {
  const env = options.env || process.env;
  const timeoutMs = Number(options.timeoutMs || env.KRATE_HEALTH_TIMEOUT_MS || env.KRATE_KUBECTL_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const execFileImpl = options.execFileImpl || execFileAsync;
  const eventBus = options.eventBus || globalEventBus;
  const giteaUrl = env.KRATE_GITEA_HTTP_URL ? `${trimSlash(env.KRATE_GITEA_HTTP_URL)}/api/v1/version` : '';
  const agentMuxBase = env.AGENT_MUX_URL || env.AGENT_GATEWAY_URL || '';
  const agentMuxUrl = agentMuxBase ? `${trimSlash(agentMuxBase)}/healthz` : '';
  const controllerUrl = env.KRATE_CONTROLLER_URL ? `${trimSlash(env.KRATE_CONTROLLER_URL)}/healthz` : '';

  const [kubernetes, gitea, agentMux, controller, assistant, eventTransport] = await Promise.all([
    kubernetesProbe({ env, execFileImpl, timeoutMs }),
    httpProbe({ name: 'gitea', url: giteaUrl, fetchImpl, timeoutMs }),
    httpProbe({ name: 'agentMux', url: agentMuxUrl, fetchImpl, timeoutMs }),
    httpProbe({ name: 'controller', url: controllerUrl, fetchImpl, timeoutMs }),
    Promise.resolve(assistantProbe(env)),
    Promise.resolve(eventTransportProbe(eventBus)),
  ]);

  return {
    kubernetes,
    gitea,
    agentMux,
    agentGateway: agentMux,
    controller,
    assistant,
    eventTransport,
  };
}

export function healthStatusValue(probe) {
  return probe?.status || 'unknown';
}
