import { cn } from "@/lib/cn";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title = "No runs found", description = "Start a babysitter run to see it here.", className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <Inbox className="h-12 w-12 text-foreground-muted/30 mb-4" />
      <h3 className="text-sm font-medium text-foreground-secondary">{title}</h3>
      <p className="mt-1 text-xs text-foreground-muted">{description}</p>
    </div>
  );
}
