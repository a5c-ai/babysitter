import { cx } from "@a5c-ai/compendium";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  title = "No dispatches found",
  description = "Start a babysitter dispatch to see it here.",
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/50 px-6 text-center",
        compact ? "py-10" : "py-16",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/80 shadow-sm">
        <Inbox className="h-6 w-6 text-foreground-muted/60" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-foreground-muted">{description}</p>
    </div>
  );
}
