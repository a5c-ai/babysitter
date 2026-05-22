import * as Notifications from 'expo-notifications';

import type { HookNotificationPayload } from '../types.js';

export const HOOK_ALLOW_ACTION = 'amux.hook.allow';
export const HOOK_DENY_ACTION = 'amux.hook.deny';

export async function configurePushCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('amux-hook', [
    { identifier: HOOK_ALLOW_ACTION, buttonTitle: 'Allow', options: { opensAppToForeground: false } },
    { identifier: HOOK_DENY_ACTION, buttonTitle: 'Deny', options: { opensAppToForeground: false } },
  ]);
}

export async function registerForPushAsync(): Promise<string | null> {
  const permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) {
    return null;
  }
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export function parseHookPayload(
  content: Notifications.NotificationContentInput | Notifications.NotificationContent,
): HookNotificationPayload | null {
  const data = 'data' in content ? content.data : {};
  if (data?.['type'] !== 'hook.request') {
    return null;
  }
  return {
    type: 'hook.request',
    runId: String(data['runId'] ?? ''),
    hookRequestId: String(data['hookRequestId'] ?? ''),
    kind: String(data['kind'] ?? ''),
    compact: typeof data['compact'] === 'string' ? data['compact'] : undefined,
    gatewayUrl: String(data['gatewayUrl'] ?? ''),
    token: typeof data['token'] === 'string' ? data['token'] : undefined,
  };
}
