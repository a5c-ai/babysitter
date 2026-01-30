"use client";

import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/common/Tag";
import type { AgentListItem } from "@/lib/api/types";

export interface AgentCardProps {
  /** Agent data */
  agent: AgentListItem;
  /** Card variant */
  variant?: "default" | "compact";
  /** Show expertise badges */
  showExpertise?: boolean;
  /** Maximum expertise badges to display */
  maxExpertise?: number;
  /** Custom class name */
  className?: string;
  /** Click handler (alternative to link) */
  onClick?: () => void;
}

export function AgentCard({
  agent,
  variant = "default",
  showExpertise = true,
  maxExpertise = 3,
  className,
  onClick,
}: AgentCardProps) {
  const isCompact = variant === "compact";

  const cardContent = (
    <Card
      className={cn(
        "h-full hover:border-[var(--color-accent-fg)] hover:shadow-md",
        isCompact ? "p-3" : ""
      )}
    >
      <CardHeader className={isCompact ? "p-0 pb-2" : ""}>
        <div className="flex items-start gap-3">
          {/* Agent avatar/icon */}
          <div className="shrink-0 rounded-full bg-[var(--color-attention-subtle)] p-2 text-[var(--color-attention-fg)]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle
              className={cn(
                "truncate",
                isCompact ? "text-sm" : "text-base"
              )}
            >
              {agent.name}
            </CardTitle>
            {agent.role && (
              <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                {agent.role}
              </p>
            )}
            {!isCompact && (
              <CardDescription className="mt-1 line-clamp-2">
                {agent.description || "No description available"}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-3", isCompact ? "p-0 py-2" : "")}>
        {/* Domain/Specialization Tags */}
        <div className="flex flex-wrap gap-1.5">
          {agent.domainName && (
            <Tag variant="domain" size="sm">
              {agent.domainName}
            </Tag>
          )}
          {agent.specializationName && (
            <Tag variant="category" size="sm">
              {agent.specializationName}
            </Tag>
          )}
        </div>

        {/* Expertise Badges */}
        {showExpertise && agent.expertise && agent.expertise.length > 0 && (
          <div className="space-y-1">
            {!isCompact && (
              <p className="text-xs font-medium text-[var(--color-fg-muted)]">Expertise:</p>
            )}
            <div className="flex flex-wrap gap-1">
              {agent.expertise.slice(0, maxExpertise).map((exp, index) => (
                <Badge key={index} variant="warning" className="text-xs">
                  {exp}
                </Badge>
              ))}
              {agent.expertise.length > maxExpertise && (
                <Badge variant="outline" className="text-xs">
                  +{agent.expertise.length - maxExpertise}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          "flex items-center justify-between text-xs text-[var(--color-fg-muted)]",
          isCompact ? "p-0 pt-2 border-t border-[var(--color-border-default)]" : ""
        )}
      >
        {/* Expertise count */}
        <div className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span>{agent.expertise?.length || 0} expertise areas</span>
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
      href={`/agents/${encodeURIComponent(agent.name)}` as Route}
      className={cn(
        "block transition-all duration-200",
        className
      )}
    >
      {cardContent}
    </Link>
  );
}

export default AgentCard;
