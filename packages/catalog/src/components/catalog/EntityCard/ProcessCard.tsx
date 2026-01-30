"use client";

import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProcessListItem } from "@/lib/api/types";

export interface ProcessCardProps {
  /** Process data */
  process: ProcessListItem;
  /** Card variant */
  variant?: "default" | "compact";
  /** Show task count */
  showTaskCount?: boolean;
  /** Custom class name */
  className?: string;
  /** Click handler (alternative to link) */
  onClick?: () => void;
}

export function ProcessCard({
  process,
  variant = "default",
  showTaskCount = true,
  className,
  onClick,
}: ProcessCardProps) {
  const isCompact = variant === "compact";

  const cardContent = (
    <Card
      className={cn(
        "h-full hover:border-[var(--color-accent-fg)] hover:shadow-md",
        isCompact ? "p-3" : ""
      )}
    >
      <CardHeader className={isCompact ? "p-0 pb-2" : ""}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle
              className={cn(
                "truncate",
                isCompact ? "text-sm" : "text-base"
              )}
            >
              {process.processId}
            </CardTitle>
            {!isCompact && (
              <CardDescription className="mt-1 line-clamp-2">
                {process.description || "No description available"}
              </CardDescription>
            )}
          </div>
          {/* Process icon */}
          <div className="shrink-0 rounded-md bg-[var(--color-accent-subtle)] p-1.5 text-[var(--color-accent-fg)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
        </div>
      </CardHeader>

      {!isCompact && (
        <CardContent className="space-y-3">
          {/* Category */}
          {process.category && (
            <Badge variant="secondary" className="text-xs">
              {process.category}
            </Badge>
          )}
        </CardContent>
      )}

      <CardFooter
        className={cn(
          "flex items-center justify-between text-xs text-[var(--color-fg-muted)]",
          isCompact ? "p-0 pt-2 border-t border-[var(--color-border-default)]" : ""
        )}
      >
        {/* Task count */}
        {showTaskCount && (
          <div className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>{process.taskCount} tasks</span>
          </div>
        )}

        {/* Updated time */}
        <time dateTime={process.updatedAt} className="text-[var(--color-fg-muted)]">
          {formatRelativeTime(process.updatedAt)}
        </time>
      </CardFooter>
    </Card>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        role="button"
        tabIndex={0}
        className={cn(
          "block transition-all duration-200 cursor-pointer",
          className
        )}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/processes/${process.id}` as Route}
      className={cn(
        "block transition-all duration-200",
        className
      )}
    >
      {cardContent}
    </Link>
  );
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export default ProcessCard;
