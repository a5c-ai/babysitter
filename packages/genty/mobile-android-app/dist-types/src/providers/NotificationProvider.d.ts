import React from 'react';
import type { HookNotificationPayload } from '../types.js';
type NotificationContextValue = {
    devicePushToken: string | null;
    lastHookPayload: HookNotificationPayload | null;
    lastActionIdentifier: string | null;
};
export declare function NotificationProvider(props: {
    children: React.ReactNode;
}): JSX.Element;
export declare function useNotifications(): NotificationContextValue;
export {};
//# sourceMappingURL=NotificationProvider.d.ts.map