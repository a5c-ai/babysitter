"use client";

import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DomainListItem } from "@/lib/api/types";

export interface DomainCardProps {
  /** Domain data */
  domain: DomainListItem;
  /** Card variant */
  variant?: "default" | "compact";
  /** Show entity counts */
  showCounts?: boolean;
  /** Custom class name */
  className?: string;
  /** Click handler (alternative to link) */
  onClick?: () => void;
}

export function DomainCard({
  domain,
  variant = "default",
  showCounts = true,
  className,
  onClick,
}: DomainCardProps) {
  const isCompact = variant === "compact";

  const totalEntities =
    domain.specializationCount + domain.agentCount + domain.skillCount;

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
              {domain.name}
            </CardTitle>
            {!isCompact && domain.category && (
              <CardDescription className="mt-1">
                {domain.category}
              </CardDescription>
            )}
          </div>
          {/* Domain icon */}
          <div className="shrink-0 rounded-md bg-[var(--color-done-subtle)] p-1.5 text-[var(--color-done-fg)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        </div>
      </CardHeader>

      {showCounts && (
        <CardContent className={cn("space-y-3", isCompact ? "p-0 py-2" : "")}>
          {/* Entity counts */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-[var(--color-canvas-subtle)] p-2">
              <p className="text-lg font-semibold text-[var(--color-fg-default)]">
                {domain.specializationCount}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)]">Specializations</p>
            </div>
            <div className="rounded-md bg-[var(--color-canvas-subtle)] p-2">
              <p className="text-lg font-semibold text-[var(--color-fg-default)]">
                {domain.skillCount}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)]">Skills</p>
            </div>
            <div className="rounded-md bg-[var(--color-canvas-subtle)] p-2">
              <p className="text-lg font-semibold text-[var(--color-fg-default)]">
                {domain.agentCount}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)]">Agents</p>
            </div>
          </div>

          {/* Category badge */}
          {domain.category && (
            <Badge variant="secondary" className="text-xs">
              {domain.category}
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
        {/* Total entities */}
        <div className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          <span>{totalEntities} total entities</span>
        </div>

        {/* Link indicator */}
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
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
      href={`/domains/${encodeURIComponent(domain.name)}` as Route}
      className={cn(
        "block transition-all duration-200",
        className
      )}
    >
      {cardContent}
    </Link>
  );
}

export default DomainCard;
