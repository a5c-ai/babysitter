"use client";

import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/common/Tag";
import type { AgentListItem } from "@/lib/api/types";

export interface AgentCardProps {
  agent: AgentListItem;
  variant?: "default" | "compact";
  showExpertise?: boolean;
  maxExpertise?: number;
  className?: string;
  onClick?: () => void;
}

export function AgentCard({
  agent,
  variant = "default",
  showExpertise = true,
  maxExpertise = 4,
  className,
  onClick,
}: AgentCardProps) {
  const isCompact = variant === "compact";
  const capabilityItems = agent.capabilities.slice(0, maxExpertise);

  const cardContent = (
    <Card
      className={cn(
        "h-full border-[rgba(179,126,62,0.18)] bg-[rgba(255,251,244,0.86)] hover:border-[rgba(192,58,43,0.35)]",
        isCompact ? "p-3" : "",
      )}
    >
      <CardHeader className={isCompact ? "p-0 pb-3" : ""}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className={cn("truncate", isCompact ? "text-base" : "text-lg")}>
              {agent.name}
            </CardTitle>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--tkc-cinnabar)]">
              {agent.versionRange}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {agent.runtimeFamily ?? "runtime"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-3">
          {agent.description || "No description available"}
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("space-y-4", isCompact ? "p-0 py-2" : "")}>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
            Providers
          </p>
          <div className="flex flex-wrap gap-1.5">
            {agent.providers.map((provider) => (
              <Tag key={provider.providerId} variant="domain" size="sm">
                {provider.displayName}
              </Tag>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-[var(--tkc-ink-soft)]">
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
              Models
            </span>
            <span>{agent.models.map((model) => model.label).join(", ") || "None"}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
              Transports
            </span>
            <span>{agent.transports.map((transport) => transport.label).join(", ") || "None"}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
              Modalities
            </span>
            <span>{agent.modalities.map((modality) => modality.label).join(", ") || "None"}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
              Hooks
            </span>
            <span>{agent.hooks.map((hook) => hook.canonicalName).join(", ") || "None"}</span>
          </div>
        </div>

        {showExpertise && capabilityItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
              Capability Matrix
            </p>
            <div className="flex flex-wrap gap-1.5">
              {capabilityItems.map((capability) => (
                <Badge key={capability.capabilityId} variant="warning" className="text-xs">
                  {capability.label}
                </Badge>
              ))}
              {agent.capabilities.length > maxExpertise && (
                <Badge variant="outline" className="text-xs">
                  +{agent.capabilities.length - maxExpertise}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          "flex items-center justify-between text-xs text-[var(--tkc-ink-quiet)]",
          isCompact ? "border-t border-[rgba(179,126,62,0.18)] p-0 pt-3" : "",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span>{agent.evidenceSummary.evidenceCount} evidence</span>
          <span>{agent.evidenceSummary.claimCount} claims</span>
          <span>{agent.evidenceSummary.unresolvedGapCount} gaps</span>
        </div>
        <span className="text-[var(--tkc-cinnabar)]">Open</span>
      </CardFooter>
    </Card>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        onKeyDown={(event) => event.key === "Enter" && onClick()}
        role="button"
        tabIndex={0}
        className={cn("block cursor-pointer transition-all duration-200", className)}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/agents/${encodeURIComponent(agent.slug)}` as Route}
      className={cn("block transition-all duration-200", className)}
    >
      {cardContent}
    </Link>
  );
}

export default AgentCard;
