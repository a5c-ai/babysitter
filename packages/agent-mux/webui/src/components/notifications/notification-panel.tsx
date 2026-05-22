"use client";
import { useNavigate } from "react-router-dom-v6";
import { Drawer, cx } from "@a5c-ai/compendium";
import { CheckCircle2, XCircle, AlertTriangle, Info, Bell, Pin, X } from "lucide-react";
import type { AppNotification } from "@/hooks/use-notifications";

const iconMap: Record<AppNotification["type"], React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success drop-shadow-[var(--drop-glow-success)]" />,
  error: <XCircle className="h-4 w-4 text-error drop-shadow-[var(--drop-glow-error)]" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning drop-shadow-[var(--drop-glow-warning)]" />,
  info: <Info className="h-4 w-4 text-info drop-shadow-[var(--drop-glow-cyan)]" />,
};

const borderMap: Record<AppNotification["type"], string> = {
  success: "border-l-success",
  error: "border-l-error",
  warning: "border-l-warning",
  info: "border-l-info",
};

interface NotificationPanelProps {
  open: boolean;
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onClose: () => void;
}

export function NotificationPanel({ open, notifications, onDismiss, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();

  const handleClick = (notif: AppNotification) => {
    if (notif.href) {
      navigate(notif.href);
      onDismiss(notif.id);
      onClose();
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary/60" />
          <span className="text-sm font-medium text-foreground">Notifications</span>
          {notifications.length > 0 && (
            <span className="text-xs text-primary/70 font-mono">({notifications.length})</span>
          )}
        </div>
      }
      width="32rem"
    >
      <div data-testid="notification-panel" className="space-y-2 p-2 sm:p-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/50 py-12 text-foreground-muted">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    data-testid={`notification-item-${notif.id}`}
                    className={cx(
                      "rounded-lg border border-[var(--glass-border-faint)] bg-[var(--glass-card-bg)] p-3 border-l-2",
                      "transition-colors duration-150",
                      notif.href && "cursor-pointer hover:bg-[var(--glass-border-faint)]",
                      borderMap[notif.type]
                    )}
                    onClick={() => handleClick(notif)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="shrink-0 mt-0.5">{iconMap[notif.type]}</div>
                      {notif.persistent && <span title="Pinned — won't auto-dismiss" className="shrink-0"><Pin className="h-3 w-3 text-primary/50" /></span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">{notif.body}</p>
                        <p className="text-xs text-foreground-muted mt-1 opacity-70">
                          {formatTime(notif.timestamp)}
                          {notif.persistent && <span className="text-primary/50 ml-1">· Pinned</span>}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                        className="shrink-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-foreground-muted transition-colors hover:bg-background hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
    </Drawer>
  );
}
