export interface PushTarget {
  platform: 'ios';
  deviceToken?: string;
  topic?: string;
}

export interface HookRequestWebhookPayload {
  type: 'hook.request';
  runId: string;
  hookRequestId: string;
  kind: string;
  compact: string;
  pushTargets: PushTarget[];
}

export interface NotificationWebhookConfig {
  url: string;
  token?: string;
  timeoutMs?: number;
}
