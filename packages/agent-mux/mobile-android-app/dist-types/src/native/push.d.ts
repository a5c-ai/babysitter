import * as Notifications from 'expo-notifications';
import type { HookNotificationPayload } from '../types.js';
export declare const HOOK_ALLOW_ACTION = "amux.hook.allow";
export declare const HOOK_DENY_ACTION = "amux.hook.deny";
export declare function configurePushCategories(): Promise<void>;
export declare function registerForPushAsync(): Promise<string | null>;
export declare function parseHookPayload(content: Notifications.NotificationContentInput | Notifications.NotificationContent): HookNotificationPayload | null;
//# sourceMappingURL=push.d.ts.map