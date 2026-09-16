"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/shared/theme-provider";
import { useEventStream } from "@/hooks/use-event-stream";
import { useNotificationContext } from "@/components/notifications/notification-provider";
import { useKeyboard } from "@/hooks/use-keyboard";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { SettingsModal } from "@/components/shared/settings-modal";
import { cn } from "@/lib/cn";
import {
  Eye,
  Sun,
  Moon,
  Settings,
  Bell,
  HelpCircle,
  Wifi,
  WifiOff,
  Github,
} from "lucide-react";

export function AppHeader() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { connected: sseConnected } = useEventStream();
  const { notifications, dismiss } = useNotificationContext();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleNotificationPanel = useCallback(() => {
    setShowNotificationPanel((v) => !v);
  }, []);

  useKeyboard([
    { key: "n", action: toggleNotificationPanel, description: "Toggle notifications" },
  ]);

  // Allow external components to open the settings modal via custom event
  useEffect(() => {
    const handler = () => setShowSettings(true);
    window.addEventListener("open-settings", handler);
    return () => window.removeEventListener("open-settings", handler);
  }, []);


  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-6 py-3 flex items-center gap-3">
          <Eye className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Babysitter Observer
            </Link>
          </h1>
          <a
            href="https://www.a5c.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs leading-tight font-medium text-primary/60 hover:text-primary transition-colors hidden sm:block"
          >
            a5c.ai
          </a>
          <a
            href="https://github.com/a5c-ai/babysitter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground-secondary transition-colors hidden sm:block"
            title="Babysitter on GitHub"
          >
            <Github className="h-3.5 w-3.5" />
          </a>
          <span className="text-xs text-foreground-muted hidden md:block">
            Real-time orchestration dashboard
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {/* SSE connection status chip */}
            <span
              data-testid="sse-status"
              role="status"
              aria-live="polite"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium mr-1 transition-all",
                sseConnected
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-error/10 text-error border border-error/20"
              )}
              title={sseConnected ? "Live updates connected" : "Live updates disconnected"}
            >
              {sseConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{sseConnected ? "Live" : "Offline"}</span>
            </span>
            {/* Notification bell */}
            <button
              data-testid="notification-bell"
              onClick={toggleNotificationPanel}
              className="relative rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary transition-colors"
              title="Notifications"
              aria-label={`Notifications${notifications.length > 0 ? ` (${notifications.length} unread)` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span data-testid="notification-badge" className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
            {/* Keyboard shortcuts help */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-shortcuts-help"))}
              className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary transition-colors"
              title="Keyboard shortcuts"
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              data-testid="theme-toggle"
              onClick={toggleTheme}
              className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary transition-colors"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        open={showNotificationPanel}
        notifications={notifications}
        onDismiss={dismiss}
        onClose={() => setShowNotificationPanel(false)}
      />

      {/* Settings Modal */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
