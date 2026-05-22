"use client";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { useToasts } from "@a5c-ai/compendium";
import type { ToastOptions } from "@a5c-ai/compendium";
import {
  useNotifications,
  type AppNotification,
} from "@/hooks/use-notifications";
import { usePolling } from "@/hooks/use-polling";
import { formatShortId } from "@/lib/utils";
import type { DigestResponse } from "@/types";

/** Map internal notification types to compendium toast kinds. */
const TOAST_KIND_MAP: Record<AppNotification["type"], ToastOptions["kind"]> = {
  success: "success",
  error: "error",
  warning: "warn",
  info: "info",
};

interface NotificationContextValue {
  notify: (
    title: string,
    body: string,
    type?: AppNotification["type"],
    options?: { href?: string; persistent?: boolean },
  ) => void;
  requestPermission: () => void;
  permission: NotificationPermission;
  notifications: AppNotification[];
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
  requestPermission: () => {},
  permission: "default",
  notifications: [],
  dismiss: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

// Watermark per run: tracks the highest-seen state so notifications only fire once
interface RunWatermark {
  status: string;
  completedTasks: number;
  pendingBreakpoints: number;
  notifiedCompleted: boolean;
  notifiedFailed: boolean;
  notifiedWaiting: boolean;
}

/** Duration after mount during which watermarks are seeded silently (no notifications). */
export const STABILIZATION_WINDOW_MS = 10_000; // 10 seconds

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { notifications, notify, dismiss, requestPermission, permission } =
    useNotifications();
  const { push } = useToasts();
  const { data: digest } = usePolling<DigestResponse>("/api/digest", {
    interval: 3000,
  });
  // Permanent watermark: tracks highest-seen state per run across all polls
  const watermarkRef = useRef<Map<string, RunWatermark>>(new Map());
  const mountedAtRef = useRef(Date.now());

  // Wrapper that adds to the notification panel state AND shows a compendium toast
  const notifyWithToast = useCallback(
    (
      title: string,
      body: string,
      type: AppNotification["type"] = "info",
      options?: { href?: string; persistent?: boolean },
    ) => {
      notify(title, body, type, options);
      push({
        title,
        message: body,
        kind: TOAST_KIND_MAP[type],
        duration: options?.persistent ? 0 : undefined,
      });
    },
    [notify, push],
  );

  useEffect(() => {
    if (!digest) return;

    const watermarks = watermarkRef.current;
    const isStabilizing =
      Date.now() - mountedAtRef.current < STABILIZATION_WINDOW_MS;

    // During the stabilization window, seed watermarks for every run without
    // firing any notifications. This replaces the old count-based INIT_SKIP
    // approach which could miss runs when there are many active runs and the
    // first N polls didn't cover them all.
    if (isStabilizing) {
      for (const run of digest.runs) {
        watermarks.set(run.runId, {
          status: run.status,
          completedTasks: run.completedTasks,
          pendingBreakpoints: run.pendingBreakpoints || 0,
          notifiedCompleted: run.status === "completed",
          notifiedFailed: run.status === "failed",
          notifiedWaiting: run.status === "waiting",
        });
      }
      return;
    }

    for (const run of digest.runs) {
      const wm = watermarks.get(run.runId);

      if (!wm) {
        // Genuinely new run — seed watermark and notify
        watermarks.set(run.runId, {
          status: run.status,
          completedTasks: run.completedTasks,
          pendingBreakpoints: run.pendingBreakpoints || 0,
          notifiedCompleted: run.status === "completed",
          notifiedFailed: run.status === "failed",
          notifiedWaiting: run.status === "waiting",
        });
        notifyWithToast(
          "New Run Started",
          `${formatShortId(run.runId, 4)} started`,
          "info",
          { href: `/dispatches/${run.runId}` },
        );
        continue;
      }

      // Run completed — only notify once ever
      if (run.status === "completed" && !wm.notifiedCompleted) {
        wm.notifiedCompleted = true;
        notifyWithToast(
          "Run Completed",
          `${formatShortId(run.runId, 4)} finished successfully`,
          "success",
          { href: `/dispatches/${run.runId}` },
        );
      }

      // Run failed — only notify once ever
      if (run.status === "failed" && !wm.notifiedFailed) {
        wm.notifiedFailed = true;
        notifyWithToast(
          "Run Failed",
          `${formatShortId(run.runId, 4)} failed`,
          "error",
          { href: `/dispatches/${run.runId}` },
        );
      }

      // Track completed-task watermark (no per-task notification — the
      // terminal "Run Completed" notification already covers this, and
      // per-task notifications flood the panel when many runs are active).
      if (run.completedTasks > wm.completedTasks) {
        wm.completedTasks = run.completedTasks;
      }

      // Run transitioned to waiting (breakpoint) — only notify once per waiting episode
      // These notifications are persistent (no auto-dismiss) so users cannot miss them
      if (run.status === "waiting" && !wm.notifiedWaiting) {
        wm.notifiedWaiting = true;
        const breakpointTitle = run.breakpointQuestion || "Review required";
        notifyWithToast(
          `Run ${formatShortId(run.runId, 4)} needs attention`,
          breakpointTitle,
          "warning",
          { href: `/dispatches/${run.runId}`, persistent: true },
        );
      }

      // Reset waiting flag when run leaves waiting state (allows re-notification on next breakpoint)
      if (run.status !== "waiting" && wm.notifiedWaiting) {
        wm.notifiedWaiting = false;
      }

      // Breakpoint resolved — pending count dropped to zero
      if (wm.pendingBreakpoints > 0 && (run.pendingBreakpoints === 0 || run.pendingBreakpoints === undefined)) {
        notifyWithToast(
          "Breakpoint Resolved",
          `Breakpoint in ${formatShortId(run.runId, 4)} was approved`,
          "success",
          { href: `/dispatches/${run.runId}` },
        );
      }
      wm.pendingBreakpoints = run.pendingBreakpoints || 0;

      wm.status = run.status;
    }
  }, [digest, notifyWithToast]);

  return (
    <NotificationContext.Provider
      value={{ notify: notifyWithToast, requestPermission, permission, notifications, dismiss }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
