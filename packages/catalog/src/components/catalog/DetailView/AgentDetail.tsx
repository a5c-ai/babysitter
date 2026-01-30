"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/components/common/Tag";
import { MetadataDisplay } from "../MetadataDisplay";
import { QuickActions } from "../QuickActions";
import { RelatedItems } from "../RelatedItems";
import type { AgentDetail as AgentDetailType } from "@/lib/api/types";

export interface AgentDetailProps {
  /** Agent data */
  agent: AgentDetailType;
  /** Related agents */
  relatedAgents?: Array<{ id: number; name: string; description: string; role?: string | null }>;
  /** Custom class name */
  className?: string;
}

export function AgentDetail({
  agent,
  relatedAgents = [],
  className,
}: AgentDetailProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* Agent avatar */}
            <div className="rounded-full bg-[var(--color-attention-subtle)] p-3 text-[var(--color-attention-fg)]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-fg-default)]">
                {agent.name}
              </h1>
              {agent.role && (
                <p className="text-sm text-[var(--color-fg-muted)]">{agent.role}</p>
              )}
            </div>
          </div>
          <p className="text-[var(--color-fg-muted)]">{agent.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {agent.domainName && (
              <Tag variant="domain">{agent.domainName}</Tag>
            )}
            {agent.specializationName && (
              <Tag variant="category">{agent.specializationName}</Tag>
            )}
          </div>
        </div>

        <QuickActions
          entityId={agent.name}
          entityType="agent"
          filePath={agent.filePath}
        />
      </div>

      <Separator />

      {/* Expertise Badges */}
      {agent.expertise && agent.expertise.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expertise ({agent.expertise.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agent.expertise.map((exp, index) => (
                <Badge key={index} variant="warning" className="text-sm">
                  {exp}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content/Documentation */}
      {agent.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Render markdown content as pre-formatted for now */}
              <div className="whitespace-pre-wrap text-sm text-[var(--color-fg-default)]">
                {agent.content}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frontmatter/Metadata */}
      {agent.frontmatter && Object.keys(agent.frontmatter).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <MetadataDisplay data={agent.frontmatter} />
          </CardContent>
        </Card>
      )}

      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-fg-muted)]">Path:</span>
              <code className="rounded bg-[var(--color-canvas-subtle)] px-2 py-0.5 text-xs">
                {agent.filePath}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-fg-muted)]">Directory:</span>
              <code className="rounded bg-[var(--color-canvas-subtle)] px-2 py-0.5 text-xs">
                {agent.directory}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-fg-muted)]">Last Updated:</span>
              <span className="text-[var(--color-fg-default)]">
                {new Date(agent.updatedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Agents */}
      {relatedAgents.length > 0 && (
        <RelatedItems
          title="Related Agents"
          items={relatedAgents.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            subtitle: a.role || undefined,
            href: `/agents/${encodeURIComponent(a.name)}`,
            type: "agent" as const,
          }))}
        />
      )}
    </div>
  );
}

export default AgentDetail;
