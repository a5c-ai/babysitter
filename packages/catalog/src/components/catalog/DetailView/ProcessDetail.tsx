"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MetadataDisplay } from "../MetadataDisplay";
import { QuickActions } from "../QuickActions";
import { RelatedItems } from "../RelatedItems";
import type { ProcessDetail as ProcessDetailType, ProcessTask } from "@/lib/api/types";

export interface ProcessDetailProps {
  /** Process data */
  process: ProcessDetailType;
  /** Related processes */
  relatedProcesses?: Array<{ id: number; processId: string; description: string }>;
  /** Custom class name */
  className?: string;
}

export function ProcessDetail({
  process,
  relatedProcesses = [],
  className,
}: ProcessDetailProps) {
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const expandAllTasks = () => {
    setExpandedTasks(new Set(process.tasks.map((t) => t.id)));
  };

  const collapseAllTasks = () => {
    setExpandedTasks(new Set());
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-[var(--color-accent-subtle)] p-2 text-[var(--color-accent-fg)]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-fg-default)]">
              {process.processId}
            </h1>
          </div>
          <p className="text-[var(--color-fg-muted)]">{process.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {process.category && (
              <Badge variant="secondary">{process.category}</Badge>
            )}
            <Badge variant="outline">{process.taskCount} tasks</Badge>
          </div>
        </div>

        <QuickActions
          entityId={process.processId}
          entityType="process"
          filePath={process.filePath}
        />
      </div>

      <Separator />

      {/* Inputs Table */}
      {process.inputs && process.inputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] text-left">
                    <th className="pb-2 pr-4 font-medium text-[var(--color-fg-muted)]">Name</th>
                    <th className="pb-2 pr-4 font-medium text-[var(--color-fg-muted)]">Type</th>
                    <th className="pb-2 pr-4 font-medium text-[var(--color-fg-muted)]">Required</th>
                    <th className="pb-2 font-medium text-[var(--color-fg-muted)]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {process.inputs.map((input, index) => (
                    <tr key={index} className="border-b border-[var(--color-border-default)] last:border-b-0">
                      <td className="py-2 pr-4 font-mono text-[var(--color-accent-fg)]">{input.name}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-[var(--color-fg-muted)]">{input.type}</td>
                      <td className="py-2 pr-4">
                        {input.required ? (
                          <Badge variant="default" className="text-xs">Required</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        )}
                      </td>
                      <td className="py-2 text-[var(--color-fg-muted)]">{input.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outputs Table */}
      {process.outputs && process.outputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] text-left">
                    <th className="pb-2 pr-4 font-medium text-[var(--color-fg-muted)]">Name</th>
                    <th className="pb-2 pr-4 font-medium text-[var(--color-fg-muted)]">Type</th>
                    <th className="pb-2 font-medium text-[var(--color-fg-muted)]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {process.outputs.map((output, index) => (
                    <tr key={index} className="border-b border-[var(--color-border-default)] last:border-b-0">
                      <td className="py-2 pr-4 font-mono text-[var(--color-accent-fg)]">{output.name}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-[var(--color-fg-muted)]">{output.type}</td>
                      <td className="py-2 text-[var(--color-fg-muted)]">{output.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {process.tasks && process.tasks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tasks ({process.tasks.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAllTasks}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAllTasks}>
                Collapse All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {process.tasks.map((task, index) => (
                <TaskItem
                  key={task.id || index}
                  task={task}
                  isExpanded={expandedTasks.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frontmatter/Metadata */}
      {process.frontmatter && Object.keys(process.frontmatter).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <MetadataDisplay data={process.frontmatter} />
          </CardContent>
        </Card>
      )}

      {/* Related Processes */}
      {relatedProcesses.length > 0 && (
        <RelatedItems
          title="Related Processes"
          items={relatedProcesses.map((p) => ({
            id: p.id,
            name: p.processId,
            description: p.description,
            href: `/processes/${p.id}`,
            type: "process" as const,
          }))}
        />
      )}
    </div>
  );
}

// Task item component
interface TaskItemProps {
  task: ProcessTask;
  isExpanded: boolean;
  onToggle: () => void;
}

function TaskItem({ task, isExpanded, onToggle }: TaskItemProps) {
  return (
    <div className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {task.type}
          </Badge>
          <span className="font-medium text-[var(--color-fg-default)]">{task.id}</span>
          {task.description && (
            <span className="text-sm text-[var(--color-fg-muted)]">- {task.description}</span>
          )}
        </div>
        <svg
          className={cn(
            "h-4 w-4 text-[var(--color-fg-muted)] transition-transform",
            isExpanded && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--color-border-default)] p-3">
          <pre className="overflow-x-auto rounded-md bg-[var(--color-canvas-default)] p-3 text-xs">
            {JSON.stringify(task, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ProcessDetail;
