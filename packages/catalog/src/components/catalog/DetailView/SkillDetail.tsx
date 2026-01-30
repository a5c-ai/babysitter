"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/components/common/Tag";
import { MetadataDisplay } from "../MetadataDisplay";
import { QuickActions } from "../QuickActions";
import { RelatedItems } from "../RelatedItems";
import type { SkillDetail as SkillDetailType } from "@/lib/api/types";

export interface SkillDetailProps {
  /** Skill data */
  skill: SkillDetailType;
  /** Related skills */
  relatedSkills?: Array<{ id: number; name: string; description: string }>;
  /** Custom class name */
  className?: string;
}

export function SkillDetail({
  skill,
  relatedSkills = [],
  className,
}: SkillDetailProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-[var(--color-success-subtle)] p-2 text-[var(--color-success-fg)]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-fg-default)]">
              {skill.name}
            </h1>
          </div>
          <p className="text-[var(--color-fg-muted)]">{skill.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {skill.domainName && (
              <Tag variant="domain">{skill.domainName}</Tag>
            )}
            {skill.specializationName && (
              <Tag variant="category">{skill.specializationName}</Tag>
            )}
          </div>
        </div>

        <QuickActions
          entityId={skill.name}
          entityType="skill"
          filePath={skill.filePath}
        />
      </div>

      <Separator />

      {/* Allowed Tools */}
      {skill.allowedTools && skill.allowedTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Allowed Tools ({skill.allowedTools.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skill.allowedTools.map((tool, index) => (
                <Badge key={index} variant="outline" className="font-mono text-sm">
                  {tool}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content/Documentation */}
      {skill.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Render markdown content as pre-formatted for now */}
              <div className="whitespace-pre-wrap text-sm text-[var(--color-fg-default)]">
                {skill.content}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frontmatter/Metadata */}
      {skill.frontmatter && Object.keys(skill.frontmatter).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <MetadataDisplay data={skill.frontmatter} />
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
                {skill.filePath}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-fg-muted)]">Directory:</span>
              <code className="rounded bg-[var(--color-canvas-subtle)] px-2 py-0.5 text-xs">
                {skill.directory}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-fg-muted)]">Last Updated:</span>
              <span className="text-[var(--color-fg-default)]">
                {new Date(skill.updatedAt).toLocaleDateString(undefined, {
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

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <RelatedItems
          title="Related Skills"
          items={relatedSkills.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            href: `/skills/${encodeURIComponent(s.name)}`,
            type: "skill" as const,
          }))}
        />
      )}
    </div>
  );
}

export default SkillDetail;
