"use client";

import { Link } from "react-router-dom-v6";
import { useLocation, useNavigate } from "react-router-dom-v6";
import { useState } from "react";
import { LogoWordmark } from "@a5c-ai/compendium";
import { Bell, Columns3, Github, Menu, Moon, Settings2, Sun, Wifi, WifiOff } from "lucide-react";

import { Button } from "@a5c-ai/compendium";
import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { useNotificationContext } from "@/components/notifications/notification-provider";
import { useEventStream } from "@/hooks/use-event-stream";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useTheme } from "@/components/shared/theme-provider";
import { cx } from "@a5c-ai/compendium";
import { APP_HEADER_NAV_ITEMS } from "@/components/shared/app-header-nav";
import { pageShellContainerClassName } from "@/components/shared/page-shell";

export const WORKSPACES_HREF = "/workspaces";

export function AppHeader() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
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
        <div className={cx(pageShellContainerClassName, "gap-3 py-3")}>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/projects" className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <Columns3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <LogoWordmark className="h-5 w-auto max-w-full" />
                  <span className="text-sm font-semibold tracking-tight">Kanban</span>
                </div>
                <div className="truncate text-xs text-foreground-muted">
                  agent-mux sessions + babysitter dispatches
                </div>
              </div>
            </Link>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <span
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                  streamConnected
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-error/20 bg-error/10 text-error",
                )}
                title={streamConnected ? "Live updates connected" : "Live updates disconnected"}
              >
                {streamConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {streamConnected ? "Dispatches live" : "Dispatches offline"}
              </span>

              <span
                className={cx(
                  "hidden rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex",
                  isAuthenticated
                    ? "border-info/20 bg-info/10 text-info"
                    : "border-warning/20 bg-warning/10 text-warning",
                )}
              >
                {isAuthenticated ? "Gateway connected" : "Gateway disconnected"}
              </span>

              <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} aria-label="Open settings">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>

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
                data-testid="theme-toggle"
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

          <div className="flex items-center gap-2 text-xs text-foreground-muted md:hidden">
            <Menu className="h-3.5 w-3.5" />
            <span>Navigation</span>
          </div>

          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 md:pb-0">
            {APP_HEADER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cx(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
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
