import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';

import { configurePushCategories, parseHookPayload, registerForPushAsync } from '../native/push.js';
import type { HookNotificationPayload } from '../types.js';

type NotificationContextValue = {
  devicePushToken: string | null;
  lastHookPayload: HookNotificationPayload | null;
  lastActionIdentifier: string | null;
};

const NotificationContext = createContext<NotificationContextValue>({
  devicePushToken: null,
  lastHookPayload: null,
  lastActionIdentifier: null,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function NotificationProvider(props: { children: React.ReactNode }): JSX.Element {
  const [devicePushToken, setDevicePushToken] = useState<string | null>(null);
  const [lastHookPayload, setLastHookPayload] = useState<HookNotificationPayload | null>(null);
  const [lastActionIdentifier, setLastActionIdentifier] = useState<string | null>(null);

  useEffect(() => {
    void configurePushCategories();
    void registerForPushAsync().then(setDevicePushToken);

    const notificationSub = Notifications.addNotificationReceivedListener((notification) => {
      setLastHookPayload(parseHookPayload(notification.request.content));
      setLastActionIdentifier(null);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      setLastHookPayload(parseHookPayload(response.notification.request.content));
      setLastActionIdentifier(response.actionIdentifier);
    });

    return () => {
      notificationSub.remove();
      responseSub.remove();
    };
  }, []);

  const value = useMemo(
    () => ({ devicePushToken, lastHookPayload, lastActionIdentifier }),
    [devicePushToken, lastHookPayload, lastActionIdentifier],
  );

  return <NotificationContext.Provider value={value}>{props.children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}
