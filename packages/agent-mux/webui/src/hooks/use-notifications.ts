"use client";
import { useState, useCallback, useRef, useEffect } from "react";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: number;
  href?: string;
  /** When true the notification will not auto-dismiss and must be closed manually or resolved externally. */
  persistent?: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const counterRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const notify = useCallback(
    (
      title: string,
      body: string,
      type: AppNotification["type"] = "info",
      options?: { href?: string; persistent?: boolean },
    ) => {
      const id = `notif-${++counterRef.current}-${Date.now()}`;

      // In-app toast
      const notification: AppNotification = {
        id,
        title,
        body,
        type,
        timestamp: Date.now(),
        href: options?.href,
        persistent: options?.persistent,
      };
      setNotifications((prev) => [...prev, notification]);

      // Auto-dismiss after 5 seconds (skip for persistent notifications like breakpoints)
      if (!options?.persistent) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      }

      // Browser notification when tab is hidden
      if (
        permission === "granted" &&
        typeof window !== "undefined" &&
        document.hidden
      ) {
        try {
          new Notification(title, { body, tag: id });
        } catch {
          // Silent fail for environments that don't support Notification constructor
        }
      }
    },
    [permission],
  );

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, notify, dismiss, requestPermission, permission };
}
