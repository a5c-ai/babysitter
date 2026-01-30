"use client";

import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tag, TagGroup } from "@/components/common/Tag";
import type { SkillListItem } from "@/lib/api/types";

export interface SkillCardProps {
  /** Skill data */
  skill: SkillListItem;
  /** Card variant */
  variant?: "default" | "compact";
  /** Show allowed tools */
  showTools?: boolean;
  /** Maximum tools to display */
  maxTools?: number;
  /** Custom class name */
  className?: string;
  /** Click handler (alternative to link) */
  onClick?: () => void;
}

export function SkillCard({
  skill,
  variant = "default",
  showTools = true,
  maxTools = 3,
  className,
  onClick,
}: SkillCardProps) {
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
              {skill.name}
            </CardTitle>
            {!isCompact && (
              <CardDescription className="mt-1 line-clamp-2">
                {skill.description || "No description available"}
              </CardDescription>
            )}
          </div>
          {/* Skill icon */}
          <div className="shrink-0 rounded-md bg-[var(--color-success-subtle)] p-1.5 text-[var(--color-success-fg)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-3", isCompact ? "p-0 py-2" : "")}>
        {/* Domain/Specialization Tags */}
        <div className="flex flex-wrap gap-1.5">
          {skill.domainName && (
            <Tag variant="domain" size="sm">
              {skill.domainName}
            </Tag>
          )}
          {skill.specializationName && (
            <Tag variant="category" size="sm">
              {skill.specializationName}
            </Tag>
          )}
        </div>

        {/* Allowed Tools */}
        {showTools && skill.allowedTools && skill.allowedTools.length > 0 && (
          <div className="space-y-1">
            {!isCompact && (
              <p className="text-xs font-medium text-[var(--color-fg-muted)]">Tools:</p>
            )}
            <TagGroup
              tags={skill.allowedTools.slice(0, maxTools).map((tool) => ({
                label: tool,
                variant: "outline" as const,
              }))}
              size="sm"
              maxTags={maxTools}
            />
            {skill.allowedTools.length > maxTools && (
              <span className="text-xs text-[var(--color-fg-muted)]">
                +{skill.allowedTools.length - maxTools} more
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          "flex items-center justify-between text-xs text-[var(--color-fg-muted)]",
          isCompact ? "p-0 pt-2 border-t border-[var(--color-border-default)]" : ""
        )}
      >
        {/* Tools count */}
        <div className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{skill.allowedTools?.length || 0} tools</span>
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
      href={`/skills/${encodeURIComponent(skill.name)}` as Route}
      className={cn(
        "block transition-all duration-200",
        className
      )}
    >
      {cardContent}
    </Link>
  );
}

export default SkillCard;
