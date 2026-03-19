"use client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { X, CheckCircle2, XCircle, AlertTriangle, Info, Pin } from "lucide-react";
import type { AppNotification } from "@/hooks/use-notifications";

const iconMap: Record<AppNotification["type"], React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success drop-shadow-[var(--drop-glow-success)]" />,
  error: <XCircle className="h-4 w-4 text-error drop-shadow-[var(--drop-glow-error)]" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning drop-shadow-[var(--drop-glow-warning)]" />,
  info: <Info className="h-4 w-4 text-info drop-shadow-[var(--drop-glow-cyan)]" />,
};

const borderMap: Record<AppNotification["type"], string> = {
  success: "border-l-success shadow-toast-glow-success",
  error: "border-l-error shadow-toast-glow-error",
  warning: "border-l-warning shadow-toast-glow-warning",
  info: "border-l-info shadow-toast-glow-cyan",
};

interface ToastStackProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ notifications, onDismiss }: ToastStackProps) {
  const router = useRouter();

  const handleClick = (notif: AppNotification) => {
    if (notif.href) {
      router.push(notif.href);
      onDismiss(notif.id);
    }
  };

  return (
    <div role="log" aria-live="assertive" aria-label="Notifications" data-testid="toast-stack" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          data-testid={`toast-item-${notif.id}`}
          className={cn(
            "rounded-lg border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-heavy)] backdrop-blur-sm p-3 shadow-lg border-l-2",
            "animate-slide-in-right",
            notif.href && "cursor-pointer hover:bg-card-hover",
            notif.persistent && "ring-1 ring-primary/20",
            borderMap[notif.type]
          )}
          onClick={() => handleClick(notif)}
        >
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5">{iconMap[notif.type]}</div>
            {notif.persistent && <span title="Pinned — won't auto-dismiss" className="shrink-0"><Pin className="h-3 w-3 text-primary/50" /></span>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-foreground">{notif.title}</p>
                {notif.persistent && (
                  <Pin className="h-3 w-3 text-warning shrink-0" aria-label="Persistent notification" />
                )}
              </div>
              <p className="text-xs text-foreground-muted mt-0.5 truncate">{notif.body}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
              className="shrink-0 rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-primary transition-colors"
              aria-label={`Dismiss ${notif.title}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
