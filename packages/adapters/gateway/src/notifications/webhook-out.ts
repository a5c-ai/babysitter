import type { HookRequestWebhookPayload, NotificationWebhookConfig, PushTarget } from './types.js';

function compactSummary(kind: string, payload: Record<string, unknown>): string {
  const command = typeof payload['command'] === 'string' ? payload['command'] : null;
  const toolName = typeof payload['toolName'] === 'string' ? payload['toolName'] : null;
  const input = typeof payload['input'] === 'string' ? payload['input'] : null;
  return [toolName ?? kind, command, input].filter(Boolean).join(' | ').slice(0, 220);
}

function normalizePushTargets(payload: Record<string, unknown>): PushTarget[] {
  const targets = payload['pushTargets'];
  if (!Array.isArray(targets)) {
    return [];
  }
  return targets.reduce<PushTarget[]>((acc, target) => {
      if (!target || typeof target !== 'object') {
        return acc;
      }
      acc.push({
        platform: 'ios' as const,
        deviceToken: typeof target['deviceToken'] === 'string' ? target['deviceToken'] : undefined,
        topic: typeof target['topic'] === 'string' ? target['topic'] : undefined,
      });
      return acc;
    }, []);
}

export function createHookWebhookPayload(
  runId: string,
  hookRequestId: string,
  kind: string,
  payload: Record<string, unknown>,
): HookRequestWebhookPayload {
  return {
    type: 'hook.request',
    runId,
    hookRequestId,
    kind,
    compact: compactSummary(kind, payload),
    pushTargets: normalizePushTargets(payload),
  };
}

export async function emitHookWebhook(config: NotificationWebhookConfig, payload: HookRequestWebhookPayload): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 5000);
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Notification webhook failed: ${response.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
