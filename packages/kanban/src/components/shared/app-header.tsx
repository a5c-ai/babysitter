"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoWordmark } from "@a5c-ai/compendium";
import { Bell, Columns3, Github, Moon, Sun, Wifi, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { useNotificationContext } from "@/components/notifications/notification-provider";
import { useEventStream } from "@/hooks/use-event-stream";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useTheme } from "@/components/shared/theme-provider";
import { cn } from "@/lib/cn";
import { APP_HEADER_NAV_ITEMS } from "@/components/shared/app-header-nav";

export const WORKSPACES_HREF = "/workspaces";

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const { connected: streamConnected } = useEventStream();
  const { isAuthenticated } = useGatewayAuth();
  const { notifications, dismiss } = useNotificationContext();
  const [showNotifications, setShowNotifications] = useState(false);

  useKeyboard([
    { key: "n", action: () => setShowNotifications((value) => !value), description: "Toggle notifications" },
  ]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <Columns3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <LogoWordmark className="h-5 w-auto" />
                <span className="text-sm font-semibold tracking-tight">Kanban</span>
              </div>
              <div className="text-xs text-foreground-muted">
                agent-mux sessions + babysitter runs
              </div>
            </div>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {APP_HEADER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-primary/30 bg-primary/12 text-foreground"
                      : "border-transparent text-foreground-muted hover:border-border hover:bg-background-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                streamConnected
                  ? "border-success/20 bg-success/10 text-success"
                  : "border-error/20 bg-error/10 text-error",
              )}
              title={streamConnected ? "Babysitter run stream connected" : "Babysitter run stream disconnected"}
            >
              {streamConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {streamConnected ? "Runs live" : "Runs offline"}
            </span>

            <span
              className={cn(
                "hidden rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex",
                isAuthenticated
                  ? "border-info/20 bg-info/10 text-info"
                  : "border-warning/20 bg-warning/10 text-warning",
              )}
            >
              {isAuthenticated ? "Gateway connected" : "Gateway disconnected"}
            </span>

            <Button
              onClick={() => setShowNotifications((value) => !value)}
              className="relative"
              variant="ghost"
              size="sm"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              ) : null}
            </Button>

            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <a
              href="https://github.com/a5c-ai/babysitter"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground lg:inline-flex"
            >
              <Github className="h-4 w-4" />
              Repo
            </a>
          </div>
        </div>
      </header>

      <NotificationPanel
        open={showNotifications}
        notifications={notifications}
        onDismiss={dismiss}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
